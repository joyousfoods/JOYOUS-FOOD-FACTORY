import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { PAYMENT_STATUS, ORDER_STATUS } from '../constants/index.js';
import * as paymentService from '../services/paymentService.js';
import * as orderService from '../services/orderService.js';
import { serialiseOrder } from './order.routes.js';

const router = Router();

/**
 * Fast path after Razorpay Checkout closes in the browser.
 *
 * The signature proves the payload came from Razorpay, so this is enough
 * to move the customer to the confirmation screen. It is NOT the only
 * path to a paid order — the webhook below confirms independently, which
 * is what keeps orders correct when the browser is closed mid-redirect
 * or the callback never fires.
 */
router.post(
  '/verify',
  optionalAuth,
  validate({
    body: z.object({
      razorpayOrderId: z.string().min(1),
      razorpayPaymentId: z.string().min(1),
      signature: z.string().min(1),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

    const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
    if (!order) throw ApiError.notFound('We could not match that payment to an order');

    if (!paymentService.verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, signature })) {
      logger.error('payment', `Signature mismatch for order ${order.orderNumber}`);
      await orderService.markPaymentFailed(order.id, {
        paymentId: razorpayPaymentId,
        code: 'SIGNATURE_MISMATCH',
        description: 'Payment signature verification failed',
      });
      throw ApiError.badRequest('We could not verify this payment. If you were charged, contact support with your order number.');
    }

    // Confirm against Razorpay's own record, not the browser's word, and
    // check the amount matches what we priced.
    const gatewayPayment = await paymentService.fetchPayment(razorpayPaymentId);
    if (gatewayPayment) {
      if (gatewayPayment.amount !== order.totalPaise) {
        logger.error(
          'payment',
          `Amount mismatch on ${order.orderNumber}: gateway ${gatewayPayment.amount} vs order ${order.totalPaise}`
        );
        throw ApiError.badRequest('Payment amount did not match the order total. Please contact support.');
      }
      if (!['captured', 'authorized'].includes(gatewayPayment.status)) {
        throw ApiError.badRequest(`Payment is not complete (status: ${gatewayPayment.status}).`);
      }
    }

    await orderService.recordSuccessfulPayment(order.id, {
      paymentId: razorpayPaymentId,
      method: gatewayPayment?.method,
      amountPaise: order.totalPaise,
      signatureVerified: true,
      raw: gatewayPayment || undefined,
    });

    const confirmed = await orderService.confirmOrder(order.id, {
      source: 'CHECKOUT_SIGNATURE',
      paymentId: razorpayPaymentId,
      paymentStatus: PAYMENT_STATUS.PAID,
    });

    res.json({ success: true, data: { order: serialiseOrder(confirmed) } });
  })
);

/** Called when the customer dismisses the Razorpay modal or a payment errors. */
router.post(
  '/failed',
  validate({
    body: z.object({
      razorpayOrderId: z.string().min(1),
      code: z.string().optional(),
      description: z.string().max(300).optional(),
      paymentId: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { razorpayOrderId: req.body.razorpayOrderId } });
    if (!order) throw ApiError.notFound('Order not found');

    const updated = await orderService.markPaymentFailed(order.id, {
      paymentId: req.body.paymentId,
      code: req.body.code,
      description: req.body.description,
    });

    res.json({ success: true, data: { order: serialiseOrder(updated) } });
  })
);

/** Re-opens Razorpay for an order whose first attempt failed. */
router.post(
  '/:orderId/retry',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.orderId, { userId: req.user?.id });

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      throw ApiError.badRequest('This order has already been paid');
    }
    if (order.orderStatus === ORDER_STATUS.CANCELLED) {
      throw ApiError.badRequest('This order was cancelled. Please place a new order.');
    }

    const gatewayOrder = await paymentService.createGatewayOrder({
      amountPaise: order.totalPaise,
      receipt: order.orderNumber,
      notes: { orderId: order.id, orderNumber: order.orderNumber, retry: 'true' },
    });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: gatewayOrder.id, paymentStatus: PAYMENT_STATUS.PENDING },
      }),
      prisma.payment.create({
        data: {
          orderId: order.id,
          provider: 'RAZORPAY',
          providerOrderId: gatewayOrder.id,
          amountPaise: order.totalPaise,
          status: 'CREATED',
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        gateway: {
          provider: 'RAZORPAY',
          keyId: env.razorpay.keyId,
          razorpayOrderId: gatewayOrder.id,
          amountPaise: order.totalPaise,
          currency: 'INR',
          orderNumber: order.orderNumber,
          prefill: {
            name: order.customerName,
            email: order.customerEmail,
            contact: order.customerPhone,
          },
        },
      },
    });
  })
);

// ─────────────────────────────────────────────────────────────
// Webhook — the authoritative source of payment truth
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments/webhook
 *
 * Razorpay retries a webhook until it receives a 2xx, and may deliver the
 * same event more than once. Two layers keep that safe:
 *
 *  1. A WebhookEvent row keyed on (provider, x-razorpay-event-id) is
 *     inserted before any work — a unique violation means "already seen".
 *  2. confirmOrder() only transitions an order out of PENDING_PAYMENT
 *     once, and the WhatsApp log's unique (orderId, template) constraint
 *     independently guarantees a single business notification.
 *
 * Signature verification runs against the RAW body; req.rawBody is
 * captured by the express.json verify hook in app.js.
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'];
    const rawBody = req.rawBody;

    if (!rawBody) {
      logger.error('webhook', 'Raw body unavailable — cannot verify signature');
      return res.status(400).json({ success: false, error: { message: 'Invalid payload' } });
    }

    if (!paymentService.verifyWebhookSignature(rawBody, signature)) {
      logger.error('webhook', 'Rejected: signature verification failed');
      return res.status(400).json({ success: false, error: { message: 'Invalid signature' } });
    }

    const event = req.body;
    const eventType = event?.event;

    // ── Idempotency gate
    try {
      await prisma.webhookEvent.create({
        data: {
          provider: 'RAZORPAY',
          eventId: eventId || `${eventType}:${event?.payload?.payment?.entity?.id || Date.now()}`,
          eventType,
          payload: event,
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        logger.info('webhook', `Duplicate delivery of ${eventType} (${eventId}) — acknowledged, not reprocessed`);
        return res.json({ success: true, data: { status: 'duplicate' } });
      }
      throw err;
    }

    // Acknowledge before doing the work so a slow WhatsApp call cannot
    // cause Razorpay to time out and retry.
    res.json({ success: true, data: { status: 'received' } });

    try {
      await processWebhookEvent(event, eventType);
      await prisma.webhookEvent.updateMany({
        where: { provider: 'RAZORPAY', eventId: eventId || undefined },
        data: { processedAt: new Date() },
      });
    } catch (err) {
      logger.error('webhook', `Processing ${eventType} failed`, err.message);
    }
  })
);

async function processWebhookEvent(event, eventType) {
  const paymentEntity = event?.payload?.payment?.entity;
  const orderEntity = event?.payload?.order?.entity;
  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;

  if (!razorpayOrderId) {
    logger.warn('webhook', `${eventType} carried no order id — ignoring`);
    return;
  }

  const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
  if (!order) {
    logger.warn('webhook', `No local order for razorpay order ${razorpayOrderId}`);
    return;
  }

  switch (eventType) {
    case 'payment.captured':
    case 'order.paid': {
      const paidAmount = paymentEntity?.amount ?? orderEntity?.amount_paid;

      // Amount check: never confirm an order for less than it costs.
      if (paidAmount !== undefined && paidAmount !== order.totalPaise) {
        logger.error(
          'webhook',
          `Amount mismatch on ${order.orderNumber}: paid ${paidAmount}, expected ${order.totalPaise}`
        );
        await prisma.orderEvent.create({
          data: {
            orderId: order.id,
            status: order.orderStatus,
            note: `Webhook amount mismatch: received ${paidAmount}, expected ${order.totalPaise}. Held for manual review.`,
            createdBy: 'system',
          },
        });
        return;
      }

      await orderService.recordSuccessfulPayment(order.id, {
        paymentId: paymentEntity?.id,
        method: paymentEntity?.method,
        amountPaise: order.totalPaise,
        signatureVerified: true,
        raw: event,
      });

      await orderService.confirmOrder(order.id, {
        source: 'WEBHOOK',
        paymentId: paymentEntity?.id,
        paymentStatus: PAYMENT_STATUS.PAID,
      });

      logger.info('webhook', `${order.orderNumber} confirmed via ${eventType}`);
      break;
    }

    case 'payment.failed': {
      await orderService.markPaymentFailed(order.id, {
        paymentId: paymentEntity?.id,
        code: paymentEntity?.error_code,
        description: paymentEntity?.error_description,
        raw: event,
      });
      logger.info('webhook', `${order.orderNumber} marked payment failed`);
      break;
    }

    case 'refund.processed':
    case 'refund.created': {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PAYMENT_STATUS.REFUNDED },
      });
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          status: order.orderStatus,
          note: 'Refund processed by payment gateway',
          createdBy: 'system',
        },
      });
      break;
    }

    default:
      logger.info('webhook', `Unhandled event type ${eventType}`);
  }
}

export default router;
