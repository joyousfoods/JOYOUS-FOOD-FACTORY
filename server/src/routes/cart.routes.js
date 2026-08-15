import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { GUEST_CART_HEADER } from '../constants/index.js';
import * as cartService from '../services/cartService.js';

const router = Router();
router.use(optionalAuth);

const ctx = (req) => ({
  userId: req.user?.id,
  guestToken: req.headers[GUEST_CART_HEADER] || undefined,
});

/**
 * Every cart response carries the full server-priced cart plus the guest
 * token, so the client never has to reason about totals or keep a second
 * copy of cart state.
 */
async function respondWithCart(req, res, status = 200) {
  const view = await cartService.getCartView({
    ...ctx(req),
    couponCode: req.query.coupon || req.body?.coupon,
  });
  if (view.guestToken) res.set(GUEST_CART_HEADER, view.guestToken);
  res.status(status).json({ success: true, data: view });
}

router.get('/', asyncHandler((req, res) => respondWithCart(req, res)));

router.post(
  '/items',
  validate({
    body: z.object({
      productId: z.string().min(1),
      quantity: z.coerce.number().int().min(1).max(99).default(1),
      coupon: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const guestToken = await cartService.addItem({ ...ctx(req), ...req.body });
    req.headers[GUEST_CART_HEADER] = guestToken || req.headers[GUEST_CART_HEADER];
    await respondWithCart(req, res, 201);
  })
);

router.patch(
  '/items/:productId',
  validate({ body: z.object({ quantity: z.coerce.number().int().min(0).max(99), coupon: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const guestToken = await cartService.setItemQuantity({
      ...ctx(req),
      productId: req.params.productId,
      quantity: req.body.quantity,
    });
    req.headers[GUEST_CART_HEADER] = guestToken || req.headers[GUEST_CART_HEADER];
    await respondWithCart(req, res);
  })
);

router.delete(
  '/items/:productId',
  asyncHandler(async (req, res) => {
    const guestToken = await cartService.removeItem({ ...ctx(req), productId: req.params.productId });
    req.headers[GUEST_CART_HEADER] = guestToken || req.headers[GUEST_CART_HEADER];
    await respondWithCart(req, res);
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    await cartService.clearCart(ctx(req));
    await respondWithCart(req, res);
  })
);

export default router;
