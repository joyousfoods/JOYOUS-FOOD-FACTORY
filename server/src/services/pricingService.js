import { env } from '../config/env.js';
import { COUPON_TYPE } from '../constants/index.js';
import { validateCoupon } from './couponService.js';

/**
 * THE single source of truth for what an order costs.
 *
 * Nothing here reads a price, quantity subtotal, discount or total from the
 * request body — line prices come from the Product rows loaded out of the
 * database, and the coupon is re-validated server-side on every call. The
 * cart page, the checkout summary and the Razorpay order amount all call
 * this same function, so the browser can never influence what is charged.
 */
export async function priceCart({ lines, couponCode, userId }) {
  const items = lines.map(({ product, quantity }) => {
    const unitPricePaise = product.pricePaise;
    const unitMrpPaise = product.mrpPaise;
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      packLabel: product.packLabel,
      imageUrl: product.imageUrl,
      tier: product.tier,
      orderMultiple: product.orderMultiple,
      freeShipping: product.freeShipping,
      categoryId: product.categoryId,
      quantity,
      unitPricePaise,
      unitMrpPaise,
      subtotalPaise: unitPricePaise * quantity,
      mrpSubtotalPaise: unitMrpPaise * quantity,
    };
  });

  const subtotalPaise = items.reduce((sum, i) => sum + i.subtotalPaise, 0);
  const mrpTotalPaise = items.reduce((sum, i) => sum + i.mrpSubtotalPaise, 0);
  const catalogueSavingsPaise = Math.max(0, mrpTotalPaise - subtotalPaise);

  let discountPaise = 0;
  let coupon = null;
  let couponError = null;
  let freeShippingFromCoupon = false;

  if (couponCode) {
    try {
      const result = await validateCoupon({ code: couponCode, items, subtotalPaise, userId });
      coupon = result.coupon;
      discountPaise = result.discountPaise;
      freeShippingFromCoupon = result.coupon.type === COUPON_TYPE.FREE_SHIPPING;
    } catch (err) {
      // An invalid coupon must not block checkout — the cart is priced
      // without it and the reason is surfaced to the customer.
      couponError = err.message;
    }
  }

  const discountedSubtotal = Math.max(0, subtotalPaise - discountPaise);

  const everyLineShipsFree = items.length > 0 && items.every((i) => i.freeShipping);
  const meetsThreshold = discountedSubtotal >= env.store.freeDeliveryThresholdPaise;
  const deliveryFree = everyLineShipsFree || meetsThreshold || freeShippingFromCoupon;

  const deliveryPaise = items.length === 0 || deliveryFree ? 0 : env.store.deliveryFeePaise;

  const totalPaise = discountedSubtotal + deliveryPaise;

  return {
    items,
    subtotalPaise,
    mrpTotalPaise,
    catalogueSavingsPaise,
    discountPaise,
    deliveryPaise,
    totalPaise,
    totalSavingsPaise: catalogueSavingsPaise + discountPaise,
    coupon: coupon
      ? { code: coupon.code, description: coupon.description, type: coupon.type }
      : null,
    couponError,
    delivery: {
      isFree: deliveryFree,
      feePaise: env.store.deliveryFeePaise,
      freeThresholdPaise: env.store.freeDeliveryThresholdPaise,
      amountToFreePaise: deliveryFree
        ? 0
        : Math.max(0, env.store.freeDeliveryThresholdPaise - discountedSubtotal),
    },
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

/**
 * Bulk/commercial packs are sold in fixed multiples. Enforced here rather
 * than only in the UI so the rule survives a hand-crafted API request.
 */
export function validateOrderRules(items) {
  const errors = [];

  const bulkQty = items
    .filter((i) => i.tier === 'BULK')
    .reduce((sum, i) => sum + i.quantity, 0);

  if (bulkQty > 0) {
    const multiple = items.find((i) => i.tier === 'BULK')?.orderMultiple || 1;
    if (multiple > 1 && bulkQty % multiple !== 0) {
      const next = Math.ceil(bulkQty / multiple) * multiple;
      errors.push(
        `Commercial packs are sold in multiples of ${multiple}. You have ${bulkQty} — add ${next - bulkQty} more to continue.`
      );
    }
  }

  const hasRetail = items.some((i) => i.tier === 'RETAIL');
  const hasBulk = bulkQty > 0;
  if (hasRetail && hasBulk) {
    errors.push(
      'Retail and commercial packs are billed and shipped differently, so they cannot be combined in one order.'
    );
  }

  return errors;
}
