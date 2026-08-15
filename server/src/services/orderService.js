import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { priceCart, validateOrderRules } from './pricingService.js';
import { redeemCoupon, releaseCoupon } from './couponService.js';
import { sendOrderNotification } from './whatsappService.js';
import { createGatewayOrder } from './paymentService.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  PAYMENT_PROVIDER_STATUS,
  ALLOWED_STATUS_TRANSITIONS,
  NOTIFICATION_TYPE,
  WA_TEMPLATE,
} from '../constants/index.js';

const ORDER_INCLUDE = {
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
  payments: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      provider: true,
      status: true,
      method: true,
      amountPaise: true,
      providerPaymentId: true,
      errorDescription: true,
      createdAt: true,
    },
  },
};

/**
 * Human-friendly, non-guessable-ish order number. The date prefix keeps
 * numbers sortable for the kitchen; the random suffix stops customers
 * enumerating other people's orders from their own number.
 */
async function generateOrderNumber(tx) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const now = new Date();
    const ymd = `${now.getFullYear()}`.slice(2) + String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const candidate = `JFF-${ymd}-${rand}`;
    const clash = await tx.order.findUnique({ where: { orderNumber: candidate } });
    if (!clash) return candidate;
  }
  return `JFF-${Date.now()}`;
}

function snapshotAddress(address) {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || null,
    landmark: address.landmark || null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    type: address.type || 'HOME',
  };
}

/**
 * Step 1 of checkout: turn the server's view of the cart into a persisted
 * order in PENDING_PAYMENT, and — for Razorpay — a gateway order whose
 * amount comes from our own pricing, not the request body.
 *
 * Nothing is confirmed here. Stock is decremented only once payment is
 * verified (or immediately, for COD), so abandoned checkouts do not
 * strand inventory.
 */
export async function createOrder({
  userId,
  guestToken,
  addressId,
  address,
  contact,
  couponCode,
  paymentMethod,
  customerNote,
  giftMessage,
}) {
  // ── Load the cart from the database, ignoring anything the client sent
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { guestToken },
    include: { items: { include: { product: true } } },
  });

  const activeItems = (cart?.items || []).filter((i) => i.product.isActive);
  if (activeItems.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  // ── Stock re-check at the moment of ordering
  for (const item of activeItems) {
    if (item.product.trackStock && item.quantity > item.product.stock) {
      throw ApiError.conflict(
        `${item.product.name} only has ${item.product.stock} left. Please update your cart.`
      );
    }
  }

  const lines = activeItems.map((i) => ({ product: i.product, quantity: i.quantity }));

  // ── Server-side pricing. This is the amount that will be charged.
  const pricing = await priceCart({ lines, couponCode, userId });

  const ruleErrors = validateOrderRules(pricing.items);
  if (ruleErrors.length) throw ApiError.badRequest(ruleErrors[0], { details: ruleErrors });

  if (couponCode && pricing.couponError) {
    throw ApiError.badRequest(pricing.couponError);
  }

  if (pricing.totalPaise <= 0) {
    throw ApiError.badRequest('Order total must be greater than zero');
  }

  // ── Resolve the delivery address
  let resolvedAddress;
  if (addressId) {
    if (!userId) throw ApiError.unauthorized('Sign in to use a saved address');
    const saved = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!saved) throw ApiError.notFound('That saved address no longer exists');
    resolvedAddress = saved;
  } else if (address) {
    resolvedAddress = address;
  } else {
    throw ApiError.badRequest('A delivery address is required');
  }

  // ── Payment method gates
  if (paymentMethod === PAYMENT_METHOD.COD) {
    if (!env.store.codEnabled) {
      throw ApiError.badRequest('Cash on delivery is currently unavailable');
    }
    if (pricing.totalPaise > env.store.codMaxOrderPaise) {
      throw ApiError.badRequest(
        'This order is above the cash-on-delivery limit. Please pay online to continue.'
      );
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx);

    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        addressId: addressId || null,
        shippingSnapshot: snapshotAddress(resolvedAddress),
        customerName: contact.name,
        customerPhone: contact.phone,
        customerEmail: contact.email,
        subtotalPaise: pricing.subtotalPaise,
        discountPaise: pricing.discountPaise,
        deliveryPaise: pricing.deliveryPaise,
        totalPaise: pricing.totalPaise,
        couponCode: pricing.coupon?.code || null,
        paymentMethod,
        paymentStatus: PAYMENT_STATUS.PENDING,
        orderStatus: ORDER_STATUS.PENDING_PAYMENT,
        customerNote: customerNote || null,
        giftMessage: giftMessage || null,
        items: {
          create: pricing.items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productSlug: item.slug,
            packLabel: item.packLabel,
            imageUrl: item.imageUrl,
            unitPricePaise: item.unitPricePaise,
            unitMrpPaise: item.unitMrpPaise,
            quantity: item.quantity,
            subtotalPaise: item.subtotalPaise,
          })),
        },
        events: {
          create: {
            status: ORDER_STATUS.PENDING_PAYMENT,
            note: 'Order created, awaiting payment',
            createdBy: 'system',
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    await redeemCoupon(tx, {
      couponCode: pricing.coupon?.code,
      orderId: created.id,
      userId,
      discountPaise: pricing.discountPaise,
    });

    return created;
  });

  // ── COD confirms immediately; Razorpay waits for verified payment.
  if (paymentMethod === PAYMENT_METHOD.COD) {
    const confirmed = await confirmOrder(order.id, {
      source: 'COD',
      paymentStatus: PAYMENT_STATUS.PENDING,
    });
    return { order: confirmed, gateway: null };
  }

  const gatewayOrder = await createGatewayOrder({
    amountPaise: pricing.totalPaise,
    receipt: order.orderNumber,
    notes: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerPhone: contact.phone,
    },
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: gatewayOrder.id },
    }),
    prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PAYMENT_METHOD.RAZORPAY,
        providerOrderId: gatewayOrder.id,
        amountPaise: pricing.totalPaise,
        status: PAYMENT_PROVIDER_STATUS.CREATED,
      },
    }),
  ]);

  return {
    order: await getOrderById(order.id),
    gateway: {
      provider: 'RAZORPAY',
      keyId: env.razorpay.keyId, // public key — safe in the browser
      razorpayOrderId: gatewayOrder.id,
      amountPaise: pricing.totalPaise,
      currency: 'INR',
      orderNumber: order.orderNumber,
      prefill: { name: contact.name, email: contact.email, contact: contact.phone },
    },
  };
}

/**
 * Marks an order confirmed: decrements stock, clears the cart, records the
 * event, notifies the customer and fires the WhatsApp alert to the business.
 *
 * Idempotent. Concurrent callers (the browser's verify request and the
 * gateway webhook both racing) are serialised by the conditional update
 * below — only the caller whose UPDATE matches a still-pending row does
 * the work; the other sees count === 0 and returns the existing order.
 */
export async function confirmOrder(orderId, { source, paymentId, paymentStatus }) {
  const alreadyConfirmed = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderStatus: true },
  });
  if (!alreadyConfirmed) throw ApiError.notFound('Order not found');

  let didTransition = false;

  await prisma.$transaction(async (tx) => {
    // Conditional update = the concurrency gate.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, orderStatus: ORDER_STATUS.PENDING_PAYMENT },
      data: {
        orderStatus: ORDER_STATUS.PROCESSING,
        paymentStatus: paymentStatus ?? PAYMENT_STATUS.PAID,
        ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
        placedAt: new Date(),
      },
    });

    if (count === 0) {
      logger.info('order', `${orderId} already confirmed — ignoring duplicate from ${source}`);
      return;
    }
    didTransition = true;

    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });

    // Stock moves only now, so abandoned checkouts never hold inventory.
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.updateMany({
        where: { id: item.productId, trackStock: true },
        data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
      });
      await tx.product.updateMany({
        where: { id: item.productId, trackStock: false },
        data: { salesCount: { increment: item.quantity } },
      });
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        status: ORDER_STATUS.PROCESSING,
        note:
          source === 'COD'
            ? 'Order confirmed — cash on delivery'
            : `Payment verified via ${source}`,
        createdBy: 'system',
      },
    });

    // Emptying the cart is part of the same transaction as confirming.
    if (order.userId) {
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      await tx.notification.create({
        data: {
          userId: order.userId,
          title: `Order ${order.orderNumber} confirmed`,
          body:
            source === 'COD'
              ? 'We have received your order. Pay in cash when it arrives.'
              : 'We have received your payment and started preparing your order.',
          type: NOTIFICATION_TYPE.ORDER,
          linkUrl: `/account/orders/${order.id}`,
        },
      });
    }
  });

  // WhatsApp is fired outside the transaction: a slow or failing Graph API
  // call must never roll back a paid order. The notification log's unique
  // constraint keeps it idempotent on its own.
  if (didTransition) {
    sendOrderNotification(orderId, WA_TEMPLATE.NEW_ORDER).catch((err) =>
      logger.error('order', `WhatsApp dispatch threw for ${orderId}`, err.message)
    );
  }

  return getOrderById(orderId);
}

/** Records a failed payment attempt without touching the order's items. */
export async function markPaymentFailed(orderId, { paymentId, code, description, raw }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  // A late failure event for an order that is already paid must not
  // downgrade it — Razorpay can deliver events out of order.
  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    logger.warn('order', `Ignoring failure event for already-paid order ${order.orderNumber}`);
    return getOrderById(orderId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: PAYMENT_STATUS.FAILED },
    });

    await tx.payment.create({
      data: {
        orderId,
        provider: PAYMENT_METHOD.RAZORPAY,
        providerOrderId: order.razorpayOrderId,
        providerPaymentId: paymentId || null,
        amountPaise: order.totalPaise,
        status: PAYMENT_PROVIDER_STATUS.FAILED,
        errorCode: code || null,
        errorDescription: description || null,
        rawPayload: raw || undefined,
        signatureVerified: true,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId,
        status: ORDER_STATUS.PENDING_PAYMENT,
        note: `Payment failed${description ? `: ${description}` : ''}`,
        createdBy: 'system',
      },
    });
  });

  return getOrderById(orderId);
}

/** Upserts the successful Payment row that accompanies a confirmation. */
export async function recordSuccessfulPayment(orderId, { paymentId, method, amountPaise, signatureVerified, raw }) {
  const existing = paymentId
    ? await prisma.payment.findUnique({ where: { providerPaymentId: paymentId } })
    : null;

  if (existing) {
    return prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: PAYMENT_PROVIDER_STATUS.PAID,
        method: method || existing.method,
        signatureVerified: signatureVerified || existing.signatureVerified,
        rawPayload: raw || existing.rawPayload || undefined,
      },
    });
  }

  return prisma.payment.create({
    data: {
      orderId,
      provider: PAYMENT_METHOD.RAZORPAY,
      providerPaymentId: paymentId || null,
      amountPaise,
      status: PAYMENT_PROVIDER_STATUS.PAID,
      method: method || null,
      signatureVerified: Boolean(signatureVerified),
      rawPayload: raw || undefined,
    },
  });
}

export async function getOrderById(orderId, { userId } = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) throw ApiError.notFound('Order not found');
  if (userId && order.userId && order.userId !== userId) {
    throw ApiError.forbidden('This order belongs to another account');
  }
  return order;
}

export async function getOrderByNumber(orderNumber, { phone } = {}) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    include: ORDER_INCLUDE,
  });
  if (!order) throw ApiError.notFound('We could not find an order with that number');

  // Guest tracking requires the phone number on the order, so an order
  // number alone does not expose someone else's details.
  if (phone !== undefined && order.customerPhone.replace(/\D/g, '').slice(-10) !== phone.replace(/\D/g, '').slice(-10)) {
    throw ApiError.notFound('We could not find an order matching those details');
  }

  return order;
}

export async function listUserOrders(userId, { page = 1, limit = 10, status } = {}) {
  const where = { userId, ...(status ? { orderStatus: status } : {}) };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(orderId, nextStatus, { note, createdBy } = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Order not found');

  const allowed = ALLOWED_STATUS_TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(
      `An order that is ${order.orderStatus} cannot move to ${nextStatus}. Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: nextStatus,
        ...(nextStatus === ORDER_STATUS.DELIVERED
          ? {
              deliveredAt: new Date(),
              // COD is collected on delivery.
              ...(order.paymentMethod === PAYMENT_METHOD.COD
                ? { paymentStatus: PAYMENT_STATUS.PAID }
                : {}),
            }
          : {}),
        ...(nextStatus === ORDER_STATUS.CANCELLED ? { cancelledAt: new Date() } : {}),
      },
    });

    await tx.orderEvent.create({
      data: { orderId, status: nextStatus, note: note || null, createdBy: createdBy || 'admin' },
    });

    if (nextStatus === ORDER_STATUS.CANCELLED) {
      // Return reserved stock and free the coupon for reuse.
      const full = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (full.orderStatus !== ORDER_STATUS.PENDING_PAYMENT) {
        for (const item of full.items) {
          if (!item.productId) continue;
          await tx.product.updateMany({
            where: { id: item.productId, trackStock: true },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      await releaseCoupon(tx, orderId);
    }

    if (order.userId) {
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: `Order ${order.orderNumber} — ${nextStatus.replace(/_/g, ' ').toLowerCase()}`,
          body: note || `Your order status changed to ${nextStatus.replace(/_/g, ' ').toLowerCase()}.`,
          type: NOTIFICATION_TYPE.ORDER,
          linkUrl: `/account/orders/${orderId}`,
        },
      });
    }
  });

  return getOrderById(orderId);
}

/** Customer-initiated cancellation, only while the order has not shipped. */
export async function cancelOrder(orderId, userId, reason) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.userId !== userId) throw ApiError.forbidden('This order belongs to another account');

  const cancellable = [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PROCESSING, ORDER_STATUS.PACKED];
  if (!cancellable.includes(order.orderStatus)) {
    throw ApiError.badRequest(
      'This order has already been dispatched and can no longer be cancelled. Please contact support.'
    );
  }

  return updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, {
    note: reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer',
    createdBy: userId,
  });
}
