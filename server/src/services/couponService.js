import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { COUPON_SCOPE, COUPON_TYPE } from '../constants/index.js';
import { formatINR } from '../utils/money.js';

const asArray = (value) => (Array.isArray(value) ? value : []);

/**
 * Re-checks every coupon rule against the server's own view of the cart.
 * Throws with a customer-facing reason; the caller decides whether that is
 * fatal (applying a code) or merely informational (re-pricing a cart).
 */
export async function validateCoupon({ code, items, subtotalPaise, userId }) {
  const normalised = code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({ where: { code: normalised } });
  if (!coupon || !coupon.isActive) {
    throw ApiError.badRequest(`"${normalised}" is not a valid coupon code`);
  }

  const now = new Date();
  if (coupon.startsAt > now) throw ApiError.badRequest('This offer has not started yet');
  if (coupon.expiresAt && coupon.expiresAt < now) throw ApiError.badRequest('This offer has expired');

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This offer has been fully claimed');
  }

  if (userId && coupon.perUserLimit !== null) {
    const used = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this offer');
    }
  }

  // Only the lines the coupon actually applies to count toward the
  // minimum spend and the discount base.
  const eligible = filterEligibleItems(coupon, items);
  if (eligible.length === 0) {
    throw ApiError.badRequest('This offer does not apply to the items in your cart');
  }

  const eligibleSubtotal = eligible.reduce((sum, i) => sum + i.subtotalPaise, 0);

  if (coupon.minOrderPaise > 0 && subtotalPaise < coupon.minOrderPaise) {
    const shortfall = coupon.minOrderPaise - subtotalPaise;
    throw ApiError.badRequest(
      `Add ${formatINR(shortfall)} more to use this offer (minimum order ${formatINR(coupon.minOrderPaise)})`
    );
  }

  const discountPaise = computeDiscount(coupon, eligibleSubtotal);

  if (discountPaise <= 0 && coupon.type !== COUPON_TYPE.FREE_SHIPPING) {
    throw ApiError.badRequest('This offer gives no discount on your current cart');
  }

  return { coupon, discountPaise, eligibleSubtotal };
}

function filterEligibleItems(coupon, items) {
  if (coupon.appliesTo === COUPON_SCOPE.CATEGORY) {
    const ids = asArray(coupon.categoryIds);
    return items.filter((i) => ids.includes(i.categoryId));
  }
  if (coupon.appliesTo === COUPON_SCOPE.PRODUCT) {
    const ids = asArray(coupon.productIds);
    return items.filter((i) => ids.includes(i.productId));
  }
  return items;
}

function computeDiscount(coupon, basePaise) {
  let discount = 0;

  if (coupon.type === COUPON_TYPE.PERCENT) {
    discount = Math.floor((basePaise * coupon.value) / 100);
  } else if (coupon.type === COUPON_TYPE.FLAT) {
    discount = coupon.value;
  } else if (coupon.type === COUPON_TYPE.FREE_SHIPPING) {
    return 0; // applied against delivery in pricingService, not the subtotal
  }

  if (coupon.maxDiscountPaise !== null && coupon.maxDiscountPaise > 0) {
    discount = Math.min(discount, coupon.maxDiscountPaise);
  }

  // Never let a coupon exceed what the customer is actually spending.
  return Math.max(0, Math.min(discount, basePaise));
}

/** Public offers shown on the storefront and in the cart's "available offers". */
export async function listPublicCoupons() {
  const now = new Date();
  return prisma.coupon.findMany({
    where: {
      isActive: true,
      isPublic: true,
      startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      // Hide fully-claimed offers rather than letting a customer
      // discover the limit only at checkout.
      NOT: { AND: [{ usageLimit: { not: null } }, { usedCount: { gte: prisma.coupon.fields.usageLimit } }] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      code: true,
      description: true,
      type: true,
      value: true,
      maxDiscountPaise: true,
      minOrderPaise: true,
      expiresAt: true,
    },
  });
}

/**
 * Records the redemption and bumps usedCount. Runs inside the caller's
 * transaction so a failed order never consumes a coupon.
 */
export async function redeemCoupon(tx, { couponCode, orderId, userId, discountPaise }) {
  if (!couponCode) return;

  const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
  if (!coupon) return;

  await tx.couponRedemption.create({
    data: { couponId: coupon.id, orderId, userId: userId || null, discountPaise },
  });

  await tx.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  });
}

/** Releases a coupon when its order is cancelled. */
export async function releaseCoupon(tx, orderId) {
  const redemption = await tx.couponRedemption.findUnique({ where: { orderId } });
  if (!redemption) return;

  await tx.coupon.update({
    where: { id: redemption.couponId },
    data: { usedCount: { decrement: 1 } },
  });
  await tx.couponRedemption.delete({ where: { id: redemption.id } });
}
