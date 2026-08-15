import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ORDER_STATUS, WA_TEMPLATE } from '../constants/index.js';
import * as orderService from '../services/orderService.js';
import { retryNotification } from '../services/whatsappService.js';

/**
 * Admin surface. There is no admin UI in this repo yet — these endpoints
 * exist so one can be added (or an existing panel pointed at the API)
 * without reworking the backend.
 */
const router = Router();
router.use(requireAuth, requireAdmin);

// ── Dashboard ────────────────────────────────────────────────
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [orderCount, revenue, customers, lowStock, pending] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: since } } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: since } },
        _sum: { totalPaise: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { trackStock: true, stock: { lte: 5 }, isActive: true } }),
      prisma.order.count({ where: { orderStatus: ORDER_STATUS.PROCESSING } }),
    ]);

    res.json({
      success: true,
      data: {
        last30Days: { orders: orderCount, revenuePaise: revenue._sum.totalPaise || 0 },
        customers,
        lowStockProducts: lowStock,
        ordersAwaitingFulfilment: pending,
      },
    });
  })
);

// ── Orders ───────────────────────────────────────────────────
router.get(
  '/orders',
  validate({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.nativeEnum(ORDER_STATUS).optional(),
      paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
      q: z.string().trim().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { page, limit, status, paymentStatus, q } = req.query;
    const where = {
      ...(status ? { orderStatus: status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: 'insensitive' } },
              { customerName: { contains: q, mode: 'insensitive' } },
              { customerPhone: { contains: q } },
              { customerEmail: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, waLogs: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: { items, page, limit, total, totalPages: Math.ceil(total / limit) } });
  })
);

router.patch(
  '/orders/:id/status',
  validate({
    body: z.object({
      status: z.nativeEnum(ORDER_STATUS),
      note: z.string().trim().max(300).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status, {
      note: req.body.note,
      createdBy: req.user.id,
    });
    res.json({ success: true, data: { order } });
  })
);

/** Re-dispatch a WhatsApp alert that failed or was skipped. */
router.post(
  '/orders/:id/resend-whatsapp',
  asyncHandler(async (req, res) => {
    const outcome = await retryNotification(req.params.id, WA_TEMPLATE.NEW_ORDER);
    res.json({ success: true, data: { outcome } });
  })
);

// ── Catalogue ────────────────────────────────────────────────
const productSchema = z.object({
  slug: z.string().trim().min(2),
  name: z.string().trim().min(2),
  categoryId: z.string().min(1),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  mrpPaise: z.coerce.number().int().min(0),
  pricePaise: z.coerce.number().int().min(0),
  imageUrl: z.string().trim().min(1),
  images: z.array(z.string()).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  trackStock: z.boolean().default(true),
  freeShipping: z.boolean().default(false),
  tier: z.enum(['RETAIL', 'BULK']).default('RETAIL'),
  orderMultiple: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  badge: z.string().trim().max(30).optional(),
  packLabel: z.string().trim().max(80).optional(),
  pieces: z.coerce.number().int().min(0).optional(),
  weightGrams: z.coerce.number().int().min(0).optional(),
  flavour: z.string().trim().max(60).optional(),
  shelfLife: z.string().trim().max(120).optional(),
  storage: z.string().trim().max(300).optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  nutrition: z.any().optional(),
  packaging: z.string().trim().max(300).optional(),
  isVeg: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

router.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const items = await prisma.product.findMany({
      include: { category: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: { items } });
  })
);

router.post(
  '/products',
  validate({ body: productSchema }),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json({ success: true, data: { product } });
  })
);

router.patch(
  '/products/:id',
  validate({ body: productSchema.partial() }),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: { product } });
  })
);

/** Soft delete — hard-deleting a product would orphan order history. */
router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, data: { message: 'Product archived' } });
  })
);

router.patch(
  '/products/:id/inventory',
  validate({ body: z.object({ stock: z.coerce.number().int().min(0) }) }),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { stock: req.body.stock },
    });
    res.json({ success: true, data: { product } });
  })
);

// ── Categories ───────────────────────────────────────────────
router.post(
  '/categories',
  validate({
    body: z.object({
      slug: z.string().trim().min(2),
      name: z.string().trim().min(2),
      description: z.string().trim().max(500).optional(),
      imageUrl: z.string().trim().optional(),
      sortOrder: z.coerce.number().int().default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json({ success: true, data: { category } });
  })
);

// ── Coupons ──────────────────────────────────────────────────
router.get(
  '/coupons',
  asyncHandler(async (_req, res) => {
    const items = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    });
    res.json({ success: true, data: { items } });
  })
);

router.post(
  '/coupons',
  validate({
    body: z.object({
      code: z.string().trim().min(3).max(30).transform((v) => v.toUpperCase()),
      description: z.string().trim().max(200).optional(),
      type: z.enum(['PERCENT', 'FLAT', 'FREE_SHIPPING']),
      value: z.coerce.number().int().min(0),
      maxDiscountPaise: z.coerce.number().int().min(0).optional(),
      minOrderPaise: z.coerce.number().int().min(0).default(0),
      appliesTo: z.enum(['ALL', 'CATEGORY', 'PRODUCT']).default('ALL'),
      categoryIds: z.array(z.string()).optional(),
      productIds: z.array(z.string()).optional(),
      usageLimit: z.coerce.number().int().min(1).optional(),
      perUserLimit: z.coerce.number().int().min(1).optional(),
      expiresAt: z.coerce.date().optional(),
      isPublic: z.boolean().default(true),
    }),
  }),
  asyncHandler(async (req, res) => {
    const coupon = await prisma.coupon.create({ data: req.body });
    res.status(201).json({ success: true, data: { coupon } });
  })
);

router.patch(
  '/coupons/:id',
  validate({ body: z.object({ isActive: z.boolean().optional(), isPublic: z.boolean().optional() }) }),
  asyncHandler(async (req, res) => {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: { coupon } });
  })
);

// ── Customers ────────────────────────────────────────────────
router.get(
  '/customers',
  validate({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);
    res.json({ success: true, data: { items, page, limit, total } });
  })
);

export default router;
