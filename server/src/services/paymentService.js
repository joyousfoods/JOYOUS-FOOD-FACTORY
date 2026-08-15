import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

let client = null;

/**
 * Lazily constructed so the server still boots (and the catalogue still
 * works) when Razorpay credentials have not been supplied yet. Only the
 * payment endpoints fail, and they fail with a clear message.
 */
export function razorpay() {
  if (!env.razorpay.isConfigured) {
    throw ApiError.unavailable(
      'Online payment is not available right now. Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured on the server.'
    );
  }
  if (!client) {
    client = new Razorpay({
      key_id: env.razorpay.keyId,
      key_secret: env.razorpay.keySecret,
    });
  }
  return client;
}

/**
 * Creates the gateway-side order. `amountPaise` always comes from
 * pricingService — never from the browser.
 */
export async function createGatewayOrder({ amountPaise, receipt, notes }) {
  try {
    const order = await razorpay().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
      payment_capture: 1,
    });
    logger.info('razorpay', `Created order ${order.id} for ${receipt} (${amountPaise} paise)`);
    return order;
  } catch (err) {
    logger.error('razorpay', 'Order creation failed', err?.error || err?.message);
    throw ApiError.unavailable(
      err?.error?.description || 'Could not start the payment. Please try again.'
    );
  }
}

/**
 * Verifies the handler payload returned by Razorpay Checkout in the browser.
 *
 * This is a *fast path* used to redirect the customer to the confirmation
 * screen quickly. It is never the sole basis for marking an order paid —
 * the webhook is authoritative, because a browser response can be forged
 * or simply never arrive.
 */
export function verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false;

  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return timingSafeEqual(expected, signature);
}

/** Verifies the X-Razorpay-Signature header on an inbound webhook. */
export function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.isWebhookConfigured) {
    throw ApiError.unavailable('RAZORPAY_WEBHOOK_SECRET is not configured on the server');
  }
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Authoritative read straight from Razorpay, used to reconcile an order. */
export async function fetchPayment(paymentId) {
  try {
    return await razorpay().payments.fetch(paymentId);
  } catch (err) {
    logger.error('razorpay', `Could not fetch payment ${paymentId}`, err?.error || err?.message);
    return null;
  }
}

export async function refundPayment(paymentId, amountPaise) {
  try {
    return await razorpay().payments.refund(paymentId, {
      amount: amountPaise,
      speed: 'normal',
    });
  } catch (err) {
    logger.error('razorpay', `Refund failed for ${paymentId}`, err?.error || err?.message);
    throw ApiError.unavailable(err?.error?.description || 'Refund could not be processed');
  }
}
