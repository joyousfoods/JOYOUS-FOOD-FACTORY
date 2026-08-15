import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { toProductCard } from '../services/productService.js';
import * as cartService from '../services/cartService.js';

const router = Router();

const loadWishlist = async (userId) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { product: { include: { category: { select: { id: true, slug: true, name: true } } } } },
  });

  return items
    .filter((i) => i.product.isActive)
    .map((i) => ({ id: i.id, addedAt: i.createdAt, product: toProductCard(i.product) }));
};

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: { items: await loadWishlist(req.user.id) } });
  })
);

router.post(
  '/',
  requireAuth,
  validate({ body: z.object({ productId: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.body.productId } });
    if (!product || !product.isActive) throw ApiError.notFound('That product is not available');

    // Adding twice is a no-op rather than an error — the heart button
    // should never be able to fail from a double tap.
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: req.body.productId } },
      create: { userId: req.user.id, productId: req.body.productId },
      update: {},
    });

    res.status(201).json({ success: true, data: { items: await loadWishlist(req.user.id) } });
  })
);

router.delete(
  '/:productId',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user.id, productId: req.params.productId },
    });
    res.json({ success: true, data: { items: await loadWishlist(req.user.id) } });
  })
);

/** Wishlist → cart in one action, optionally removing it from the wishlist. */
router.post(
  '/:productId/move-to-cart',
  requireAuth,
  validate({
    body: z.object({
      quantity: z.coerce.number().int().min(1).max(99).default(1),
      keepInWishlist: z.boolean().default(false),
    }),
  }),
  asyncHandler(async (req, res) => {
    await cartService.addItem({
      userId: req.user.id,
      productId: req.params.productId,
      quantity: req.body.quantity,
    });

    if (!req.body.keepInWishlist) {
      await prisma.wishlistItem.deleteMany({
        where: { userId: req.user.id, productId: req.params.productId },
      });
    }

    res.json({
      success: true,
      data: {
        items: await loadWishlist(req.user.id),
        cart: await cartService.getCartView({ userId: req.user.id }),
      },
    });
  })
);

/** Cart → wishlist ("Save for later"). */
router.post(
  '/save-for-later',
  requireAuth,
  validate({ body: z.object({ productId: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: req.body.productId } },
      create: { userId: req.user.id, productId: req.body.productId },
      update: {},
    });
    await cartService.removeItem({ userId: req.user.id, productId: req.body.productId });

    res.json({
      success: true,
      data: {
        items: await loadWishlist(req.user.id),
        cart: await cartService.getCartView({ userId: req.user.id }),
      },
    });
  })
);

/**
 * Guests get a read-only membership check so the heart icon can render
 * correctly without forcing a sign-in first.
 */
router.get(
  '/ids',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) return res.json({ success: true, data: { productIds: [] } });
    const rows = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      select: { productId: true },
    });
    res.json({ success: true, data: { productIds: rows.map((r) => r.productId) } });
  })
);

export default router;
