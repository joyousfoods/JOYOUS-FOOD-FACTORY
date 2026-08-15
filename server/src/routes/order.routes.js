import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { checkoutLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { GUEST_CART_HEADER, PAYMENT_METHOD, ORDER_STATUS } from '../constants/index.js';
import { addressSchema } from './address.routes.js';
import * as orderService from '../services/orderService.js';
import * as cartService from '../services/cartService.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

const createOrderSchema = z
  .object({
    contact: contactSchema,
    // Either an existing saved address id, or a full address for guests.
    addressId: z.string().optional(),
    address: addressSchema.omit({ isDefault: true }).partial({ type: true }).optional(),
    couponCode: z.string().trim().max(40).optional().or(z.literal('')),
    paymentMethod: z.enum([PAYMENT_METHOD.RAZORPAY, PAYMENT_METHOD.COD]),
    customerNote: z.string().trim().max(500).optional(),
    giftMessage: z.string().trim().max(300).optional(),
  })
  .refine((data) => Boolean(data.addressId || data.address), {
    message: 'A delivery address is required',
    path: ['address'],
  });

/**
 * NOTE ON TRUST: this body carries no prices, no totals and no payment
 * status. Amounts are computed from the database cart inside
 * orderService.createOrder, so a tampered request cannot change what is
 * charged.
 */
router.post(
  '/',
  optionalAuth,
  checkoutLimiter,
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const result = await orderService.createOrder({
      userId: req.user?.id,
      guestToken: req.headers[GUEST_CART_HEADER],
      ...req.body,
      couponCode: req.body.couponCode || undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        order: serialiseOrder(result.order),
        gateway: result.gateway,
      },
    });
  })
);

router.get(
  '/',
  requireAuth,
  validate({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(10),
      status: z.nativeEnum(ORDER_STATUS).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await orderService.listUserOrders(req.user.id, req.query);
    res.json({
      success: true,
      data: { ...result, items: result.items.map(serialiseOrder) },
    });
  })
);

/** Guest order tracking: order number + the phone number on the order. */
router.get(
  '/track',
  validate({
    query: z.object({
      orderNumber: z.string().trim().min(4),
      phone: z.string().trim().min(10),
    }),
  }),
  asyncHandler(async (req, res) => {
    const order = await orderService.getOrderByNumber(req.query.orderNumber, {
      phone: req.query.phone,
    });
    res.json({ success: true, data: { order: serialiseOrder(order) } });
  })
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id, { userId: req.user?.id });
    res.json({ success: true, data: { order: serialiseOrder(order) } });
  })
);

router.post(
  '/:id/cancel',
  requireAuth,
  validate({ body: z.object({ reason: z.string().trim().max(300).optional() }) }),
  asyncHandler(async (req, res) => {
    const order = await orderService.cancelOrder(req.params.id, req.user.id, req.body.reason);
    res.json({ success: true, data: { order: serialiseOrder(order) } });
  })
);

/** Reorder: replaces the cart with the lines from a previous order. */
router.post(
  '/:id/reorder',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id, { userId: req.user?.id });

    const entries = order.items
      .filter((i) => i.productId)
      .map((i) => ({ productId: i.productId, quantity: i.quantity }));

    const { guestToken, skipped } = await cartService.replaceCartWithProducts({
      userId: req.user?.id,
      guestToken: req.headers[GUEST_CART_HEADER],
      entries,
    });

    if (guestToken) res.set(GUEST_CART_HEADER, guestToken);

    const cart = await cartService.getCartView({ userId: req.user?.id, guestToken });
    res.json({ success: true, data: { cart, skipped } });
  })
);

/** Trims internal fields before an order leaves the server. */
export function serialiseOrder(order) {
  if (!order) return null;
  const { internalNote, ...rest } = order;
  return rest;
}

export default router;
