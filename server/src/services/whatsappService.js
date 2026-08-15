import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { formatINR } from '../utils/money.js';
import { WA_STATUS, WA_TEMPLATE, PAYMENT_METHOD } from '../constants/index.js';

/**
 * Sends the business a WhatsApp alert when an order is confirmed.
 *
 * Delivery is made idempotent by the unique (orderId, template) constraint
 * on WhatsAppNotificationLog: the row is claimed *before* the API call, so
 * a duplicate Razorpay webhook loses the race on insert and returns early
 * instead of sending a second message.
 */

const graphUrl = () =>
  `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;

export function buildOrderMessage(order) {
  const lines = [];

  lines.push('🛍️ *NEW ORDER — JOYOUS FOOD FACTORY*');
  lines.push('');
  lines.push(`*Order ID:* ${order.orderNumber}`);
  lines.push('');
  lines.push('*Customer:*');
  lines.push(`Name: ${order.customerName}`);
  lines.push(`Phone: ${order.customerPhone}`);
  if (order.customerEmail) lines.push(`Email: ${order.customerEmail}`);
  lines.push('');

  const addr = order.shippingSnapshot || {};
  lines.push('*Delivery Address:*');
  if (addr.line1) lines.push(addr.line1);
  if (addr.line2) lines.push(addr.line2);
  if (addr.landmark) lines.push(`Landmark: ${addr.landmark}`);
  lines.push([addr.city, addr.state].filter(Boolean).join(', '));
  if (addr.pincode) lines.push(addr.pincode);
  lines.push('');

  lines.push('*Products:*');
  order.items.forEach((item, index) => {
    const pack = item.packLabel ? ` (${item.packLabel})` : '';
    lines.push(`${index + 1}. ${item.productName}${pack} × ${item.quantity}`);
    lines.push(`   ${formatINR(item.subtotalPaise)}`);
  });
  lines.push('');

  lines.push(`Subtotal: ${formatINR(order.subtotalPaise)}`);
  if (order.discountPaise > 0) {
    const code = order.couponCode ? ` (${order.couponCode})` : '';
    lines.push(`Discount${code}: -${formatINR(order.discountPaise)}`);
  }
  lines.push(
    `Delivery: ${order.deliveryPaise === 0 ? 'FREE' : formatINR(order.deliveryPaise)}`
  );
  lines.push(
    `*${order.paymentMethod === PAYMENT_METHOD.COD ? 'Amount Due (COD)' : 'Total Paid'}: ${formatINR(order.totalPaise)}*`
  );
  lines.push('');

  lines.push('*Payment:*');
  lines.push(`Method: ${order.paymentMethod === PAYMENT_METHOD.COD ? 'Cash on Delivery' : 'Razorpay'}`);
  lines.push(`Status: ${order.paymentStatus}`);
  if (order.razorpayPaymentId) lines.push(`Payment ID: ${order.razorpayPaymentId}`);
  lines.push('');

  if (order.giftMessage) {
    lines.push(`*Gift Message:* ${order.giftMessage}`);
    lines.push('');
  }
  if (order.customerNote) {
    lines.push(`*Customer Note:* ${order.customerNote}`);
    lines.push('');
  }

  lines.push('*Order Time:*');
  lines.push(
    new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(order.placedAt || order.createdAt)
  );
  lines.push('');
  lines.push('_Please process this order._');

  return lines.join('\n');
}

async function callCloudApi(body) {
  const response = await fetch(graphUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(`WhatsApp Cloud API rejected the message: ${detail}`);
  }

  return payload;
}

function buildRequestBody(order, text) {
  const to = env.whatsapp.businessNumber;

  // Meta only allows free-form text within 24h of an inbound message, so a
  // business-initiated alert normally needs an approved template. When a
  // template name is configured we use it; otherwise we send plain text,
  // which is fine against a test number during development.
  if (env.whatsapp.templateName) {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: env.whatsapp.templateName,
        language: { code: env.whatsapp.templateLang },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.orderNumber },
              { type: 'text', text: order.customerName },
              { type: 'text', text: order.customerPhone },
              { type: 'text', text: formatINR(order.totalPaise) },
            ],
          },
        ],
      },
    };
  }

  return {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  };
}

/**
 * @returns {'SENT'|'FAILED'|'SKIPPED'|'DUPLICATE'} outcome
 */
export async function sendOrderNotification(orderId, template = WA_TEMPLATE.NEW_ORDER) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    logger.warn('whatsapp', `Order ${orderId} not found, nothing to notify`);
    return 'FAILED';
  }

  // Claim the slot first — this is the idempotency gate.
  try {
    await prisma.whatsAppNotificationLog.create({
      data: {
        orderId,
        template,
        recipient: env.whatsapp.businessNumber || 'UNCONFIGURED',
        status: WA_STATUS.PENDING,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      logger.info('whatsapp', `${order.orderNumber} ${template} already dispatched — skipping duplicate`);
      return 'DUPLICATE';
    }
    throw err;
  }

  const text = buildOrderMessage(order);

  if (!env.whatsapp.isConfigured) {
    // No credentials yet: record the exact message that *would* have been
    // sent so the operator can see it in the log and forward it manually,
    // and so nothing silently pretends a message went out.
    await prisma.whatsAppNotificationLog.update({
      where: { orderId_template: { orderId, template } },
      data: {
        status: WA_STATUS.SKIPPED,
        error: 'WhatsApp credentials are not configured (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_BUSINESS_NUMBER)',
        payload: { text },
        attempts: 1,
      },
    });
    logger.warn(
      'whatsapp',
      `NOT SENT — credentials missing. Order ${order.orderNumber} notification content:\n${text}`
    );
    return 'SKIPPED';
  }

  try {
    const result = await callCloudApi(buildRequestBody(order, text));
    const messageId = result?.messages?.[0]?.id || null;

    await prisma.whatsAppNotificationLog.update({
      where: { orderId_template: { orderId, template } },
      data: {
        status: WA_STATUS.SENT,
        providerMessageId: messageId,
        payload: { text, response: result },
        attempts: 1,
      },
    });

    logger.info('whatsapp', `Sent ${template} for ${order.orderNumber} (${messageId})`);
    return 'SENT';
  } catch (err) {
    await prisma.whatsAppNotificationLog.update({
      where: { orderId_template: { orderId, template } },
      data: {
        status: WA_STATUS.FAILED,
        error: err.message,
        payload: { text },
        attempts: { increment: 1 },
      },
    });
    logger.error('whatsapp', `Failed ${template} for ${order.orderNumber}`, err.message);
    return 'FAILED';
  }
}

/** Manual retry for a log row stuck in FAILED/SKIPPED (admin action). */
export async function retryNotification(orderId, template = WA_TEMPLATE.NEW_ORDER) {
  const log = await prisma.whatsAppNotificationLog.findUnique({
    where: { orderId_template: { orderId, template } },
  });
  if (log?.status === WA_STATUS.SENT) return 'DUPLICATE';

  if (log) {
    await prisma.whatsAppNotificationLog.delete({ where: { id: log.id } });
  }
  return sendOrderNotification(orderId, template);
}
