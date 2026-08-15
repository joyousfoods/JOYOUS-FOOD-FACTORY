import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listCategories } from '../services/productService.js';
import { listPublicCoupons } from '../services/couponService.js';

const router = Router();

/**
 * Storefront bootstrap: the values the client must not hardcode
 * (delivery thresholds, which payment methods are actually live).
 */
router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      currency: 'INR',
      delivery: {
        feePaise: env.store.deliveryFeePaise,
        freeThresholdPaise: env.store.freeDeliveryThresholdPaise,
      },
      payments: {
        razorpayEnabled: env.razorpay.isConfigured,
        razorpayKeyId: env.razorpay.keyId || null,
        codEnabled: env.store.codEnabled,
        codMaxOrderPaise: env.store.codMaxOrderPaise,
      },
      support: {
        phone: '+919848574748',
        altPhone: '+919666255559',
        email: 'joyousfoodshyd@gmail.com',
        whatsapp: '919848574748',
      },
    },
  });
});

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: { items: await listCategories() } });
  })
);

router.get(
  '/coupons',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: { items: await listPublicCoupons() } });
  })
);

router.post(
  '/newsletter',
  validate({ body: z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address') }) }),
  asyncHandler(async (req, res) => {
    // Re-subscribing is a success, not a duplicate-key error.
    await prisma.newsletterSubscriber.upsert({
      where: { email: req.body.email },
      create: { email: req.body.email },
      update: { isActive: true },
    });
    res.status(201).json({ success: true, data: { message: 'You are on the list. Watch your inbox for offers.' } });
  })
);

router.get(
  '/notifications',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);
    res.json({ success: true, data: { items, unreadCount } });
  })
);

router.post(
  '/notifications/read',
  requireAuth,
  validate({ body: z.object({ ids: z.array(z.string()).optional() }) }),
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        ...(req.body.ids?.length ? { id: { in: req.body.ids } } : {}),
      },
      data: { isRead: true },
    });
    res.json({ success: true, data: { message: 'Marked as read' } });
  })
);

export default router;
