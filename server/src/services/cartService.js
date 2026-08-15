import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { priceCart, validateOrderRules } from './pricingService.js';
import { toProductCard } from './productService.js';

const CART_INCLUDE = {
  items: {
    include: { product: { include: { category: { select: { id: true, slug: true, name: true } } } } },
    orderBy: { createdAt: 'asc' },
  },
};

export const newGuestToken = () => crypto.randomBytes(24).toString('hex');

/**
 * Finds or creates the caller's cart. Signed-in users own exactly one cart
 * keyed by userId; guests are tracked by an opaque token they send back in
 * the x-guest-token header.
 */
export async function resolveCart({ userId, guestToken, create = true }) {
  if (userId) {
    let cart = await prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE });
    if (!cart && create) {
      cart = await prisma.cart.create({ data: { userId }, include: CART_INCLUDE });
    }
    return cart;
  }

  if (guestToken) {
    const cart = await prisma.cart.findUnique({ where: { guestToken }, include: CART_INCLUDE });
    if (cart) return cart;
  }

  if (!create) return null;

  const token = guestToken || newGuestToken();
  return prisma.cart.create({ data: { guestToken: token }, include: CART_INCLUDE });
}

/** Cart rows + server-computed pricing. The shape the frontend renders. */
export async function getCartView({ userId, guestToken, couponCode }) {
  const cart = await resolveCart({ userId, guestToken });

  const lines = cart.items
    .filter((item) => item.product.isActive)
    .map((item) => ({ product: item.product, quantity: item.quantity }));

  const pricing = await priceCart({ lines, couponCode, userId });

  const items = cart.items
    .filter((item) => item.product.isActive)
    .map((item) => {
      const priced = pricing.items.find((p) => p.productId === item.productId);
      return {
        id: item.id,
        quantity: item.quantity,
        product: toProductCard(item.product),
        unitPricePaise: priced.unitPricePaise,
        subtotalPaise: priced.subtotalPaise,
        maxQuantity: item.product.trackStock ? item.product.stock : 99,
      };
    });

  return {
    id: cart.id,
    guestToken: cart.guestToken,
    items,
    pricing: { ...pricing, items: undefined },
    ruleErrors: validateOrderRules(pricing.items),
  };
}

async function assertPurchasable(productId, requestedQty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw ApiError.notFound('That product is no longer available');

  if (product.trackStock) {
    if (product.stock <= 0) throw ApiError.badRequest(`${product.name} is out of stock`);
    if (requestedQty > product.stock) {
      throw ApiError.badRequest(
        `Only ${product.stock} ${product.stock === 1 ? 'unit' : 'units'} of ${product.name} left in stock`
      );
    }
  }
  return product;
}

export async function addItem({ userId, guestToken, productId, quantity = 1 }) {
  const cart = await resolveCart({ userId, guestToken });
  const existing = cart.items.find((i) => i.productId === productId);
  const nextQty = (existing?.quantity || 0) + quantity;

  await assertPurchasable(productId, nextQty);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity: nextQty },
  });

  return cart.guestToken;
}

export async function setItemQuantity({ userId, guestToken, productId, quantity }) {
  const cart = await resolveCart({ userId, guestToken });

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return cart.guestToken;
  }

  await assertPurchasable(productId, quantity);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity },
  });

  return cart.guestToken;
}

export async function removeItem({ userId, guestToken, productId }) {
  const cart = await resolveCart({ userId, guestToken });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return cart.guestToken;
}

export async function clearCart({ userId, guestToken }) {
  const cart = await resolveCart({ userId, guestToken, create: false });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

/**
 * Called right after sign-in. Guest lines are folded into the user's cart —
 * quantities are summed, capped at available stock, and the guest cart is
 * discarded. Losing a cart at the login step is a classic drop-off point.
 */
export async function mergeGuestCart({ userId, guestToken }) {
  if (!guestToken) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: { include: { product: true } } },
  });
  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) await prisma.cart.delete({ where: { id: guestCart.id } });
    return;
  }

  const userCart =
    (await prisma.cart.findUnique({ where: { userId }, include: { items: true } })) ||
    (await prisma.cart.create({ data: { userId }, include: { items: true } }));

  await prisma.$transaction(async (tx) => {
    for (const item of guestCart.items) {
      const existing = userCart.items.find((i) => i.productId === item.productId);
      const combined = (existing?.quantity || 0) + item.quantity;
      const capped = item.product.trackStock
        ? Math.min(combined, Math.max(item.product.stock, 0))
        : combined;

      if (capped <= 0) continue;

      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
        create: { cartId: userCart.id, productId: item.productId, quantity: capped },
        update: { quantity: capped },
      });
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}

/** Used by "Reorder" — replaces the cart with a past order's lines. */
export async function replaceCartWithProducts({ userId, guestToken, entries }) {
  const cart = await resolveCart({ userId, guestToken });
  const skipped = [];

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  for (const { productId, quantity } of entries) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      skipped.push({ productId, reason: 'No longer available' });
      continue;
    }
    const capped = product.trackStock ? Math.min(quantity, product.stock) : quantity;
    if (capped <= 0) {
      skipped.push({ productId, name: product.name, reason: 'Out of stock' });
      continue;
    }
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: capped },
    });
  }

  return { guestToken: cart.guestToken, skipped };
}
