import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { discountPercent } from '../utils/money.js';

const CARD_FIELDS = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  brand: true,
  mrpPaise: true,
  pricePaise: true,
  imageUrl: true,
  stock: true,
  trackStock: true,
  freeShipping: true,
  tier: true,
  orderMultiple: true,
  badge: true,
  isBestSeller: true,
  isNewArrival: true,
  isFeatured: true,
  packLabel: true,
  pieces: true,
  weightGrams: true,
  flavour: true,
  isVeg: true,
  ratingAvg: true,
  ratingCount: true,
  salesCount: true,
  createdAt: true,
  category: { select: { id: true, slug: true, name: true } },
};

/** Shapes a DB row into the contract the storefront renders against. */
export function toProductCard(product) {
  if (!product) return null;
  const inStock = !product.trackStock || product.stock > 0;
  return {
    ...product,
    images: undefined,
    discountPercent: discountPercent(product.mrpPaise, product.pricePaise),
    savingsPaise: Math.max(0, product.mrpPaise - product.pricePaise),
    inStock,
    lowStock: inStock && product.trackStock && product.stock <= 5,
  };
}

const SORT_MAP = {
  relevance: [{ isFeatured: 'desc' }, { salesCount: 'desc' }, { sortOrder: 'asc' }],
  popularity: [{ salesCount: 'desc' }, { ratingCount: 'desc' }],
  price_asc: [{ pricePaise: 'asc' }],
  price_desc: [{ pricePaise: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  rating: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
};

/**
 * Highest-discount sort can't be expressed in SQL against two columns
 * with Prisma's orderBy, so it is applied to the page after fetching.
 * Everything else is ordered and paginated in the database.
 */
export async function listProducts(query) {
  const {
    page = 1,
    limit = 12,
    category,
    categories,
    q,
    minPrice,
    maxPrice,
    tier,
    inStock,
    onOffer,
    minRating,
    minDiscount,
    flavour,
    featured,
    bestSeller,
    newArrival,
    sort = 'relevance',
  } = query;

  const where = { isActive: true };

  const categorySlugs = categories?.length ? categories : category ? [category] : null;
  if (categorySlugs) where.category = { slug: { in: categorySlugs } };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { shortDescription: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { flavour: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
      { packLabel: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.pricePaise = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  if (tier) where.tier = tier;

  // Nested under AND so it cannot clobber the search OR above.
  if (inStock) {
    where.AND = [
      ...(where.AND || []),
      { OR: [{ trackStock: false }, { stock: { gt: 0 } }] },
    ];
  }

  if (flavour?.length) where.flavour = { in: flavour };
  if (minRating !== undefined) where.ratingAvg = { gte: minRating };
  if (featured) where.isFeatured = true;
  if (bestSeller) where.isBestSeller = true;
  if (newArrival) where.isNewArrival = true;

  // "On offer" and "min discount" both compare price to MRP. Prisma cannot
  // compare two columns in a filter, so we express it as a raw fragment.
  const needsDiscountFilter = onOffer || minDiscount !== undefined;
  let discountFilteredIds = null;
  if (needsDiscountFilter) {
    const threshold = minDiscount ?? 1;
    const rows = await prisma.$queryRaw`
      SELECT id FROM "Product"
      WHERE "isActive" = true
        AND "mrpPaise" > 0
        AND FLOOR((("mrpPaise" - "pricePaise")::numeric / "mrpPaise") * 100) >= ${threshold}
    `;
    discountFilteredIds = rows.map((r) => r.id);
    if (discountFilteredIds.length === 0) {
      return { items: [], page, limit, total: 0, totalPages: 0, hasMore: false };
    }
    where.id = { in: discountFilteredIds };
  }

  const orderBy = SORT_MAP[sort] || SORT_MAP.relevance;
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: CARD_FIELDS,
      orderBy,
      // discount sort needs the whole result set in memory to rank correctly
      ...(sort === 'discount' ? {} : { skip, take: limit }),
    }),
    prisma.product.count({ where }),
  ]);

  let items = rows.map(toProductCard);

  if (sort === 'discount') {
    items.sort((a, b) => b.discountPercent - a.discountPercent || b.salesCount - a.salesCount);
    items = items.slice(skip, skip + limit);
  }

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + items.length < total,
  };
}

export async function getProductBySlug(slug) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, authorName: true, rating: true, title: true, body: true, createdAt: true },
      },
    },
  });

  if (!product) throw ApiError.notFound('We could not find that product');

  const { reviews, images, ...rest } = product;
  return {
    ...toProductCard(rest),
    images: Array.isArray(images) ? images : [],
    description: product.description,
    shelfLife: product.shelfLife,
    storage: product.storage,
    ingredients: Array.isArray(product.ingredients) ? product.ingredients : null,
    allergens: Array.isArray(product.allergens) ? product.allergens : null,
    nutrition: product.nutrition || null,
    packaging: product.packaging,
    reviews,
  };
}

/** Same category first, then any bestseller, excluding the product itself. */
export async function getRelatedProducts(slug, take = 8) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true },
  });
  if (!product) return [];

  const sameCategory = await prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    select: CARD_FIELDS,
    orderBy: [{ salesCount: 'desc' }],
    take,
  });

  if (sameCategory.length >= take) return sameCategory.map(toProductCard);

  const filler = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { notIn: [product.id, ...sameCategory.map((p) => p.id)] },
    },
    select: CARD_FIELDS,
    orderBy: [{ isBestSeller: 'desc' }, { salesCount: 'desc' }],
    take: take - sameCategory.length,
  });

  return [...sameCategory, ...filler].map(toProductCard);
}

/**
 * "Frequently bought together" derived from real order history: the
 * products most often appearing in the same orders as this one. Falls
 * back to bestsellers while the store has too little order data.
 */
export async function getFrequentlyBoughtTogether(slug, take = 3) {
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return [];

  const coPurchased = await prisma.$queryRaw`
    SELECT oi2."productId" AS id, COUNT(*)::int AS freq
    FROM "OrderItem" oi1
    JOIN "OrderItem" oi2 ON oi1."orderId" = oi2."orderId"
    WHERE oi1."productId" = ${product.id}
      AND oi2."productId" IS DISTINCT FROM ${product.id}
      AND oi2."productId" IS NOT NULL
    GROUP BY oi2."productId"
    ORDER BY freq DESC
    LIMIT ${take}
  `;

  const ids = coPurchased.map((r) => r.id);

  if (ids.length < take) {
    const fallback = await prisma.product.findMany({
      where: { isActive: true, id: { notIn: [product.id, ...ids] }, tier: 'RETAIL' },
      select: { id: true },
      orderBy: [{ isBestSeller: 'desc' }, { salesCount: 'desc' }],
      take: take - ids.length,
    });
    ids.push(...fallback.map((p) => p.id));
  }

  if (!ids.length) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: CARD_FIELDS,
  });

  // Preserve co-purchase ranking, which findMany does not guarantee.
  const order = new Map(ids.map((id, i) => [id, i]));
  return rows.sort((a, b) => order.get(a.id) - order.get(b.id)).map(toProductCard);
}

export async function getProductsByIds(ids) {
  if (!ids?.length) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: CARD_FIELDS,
  });
  const order = new Map(ids.map((id, i) => [id, i]));
  return rows.sort((a, b) => order.get(a.id) - order.get(b.id)).map(toProductCard);
}

/** Lightweight payload for the header search dropdown. */
export async function searchSuggestions(q, limit = 6) {
  if (!q || q.trim().length < 2) return { products: [], categories: [] };
  const term = q.trim();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { flavour: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { packLabel: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        imageUrl: true,
        pricePaise: true,
        mrpPaise: true,
        packLabel: true,
        category: { select: { name: true, slug: true } },
      },
      orderBy: [{ salesCount: 'desc' }],
      take: limit,
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: term, mode: 'insensitive' } },
      select: { id: true, slug: true, name: true, imageUrl: true },
      take: 4,
    }),
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      discountPercent: discountPercent(p.mrpPaise, p.pricePaise),
    })),
    categories,
  };
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  return categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
}

/** Drives the min/max bounds and option lists on the shop filter panel. */
export async function getFilterFacets() {
  const [priceRange, flavours, categories] = await Promise.all([
    prisma.product.aggregate({
      where: { isActive: true },
      _min: { pricePaise: true },
      _max: { pricePaise: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, flavour: { not: null } },
      select: { flavour: true },
      distinct: ['flavour'],
      orderBy: { flavour: 'asc' },
    }),
    listCategories(),
  ]);

  return {
    priceRange: {
      minPaise: priceRange._min.pricePaise ?? 0,
      maxPaise: priceRange._max.pricePaise ?? 0,
    },
    flavours: flavours.map((f) => f.flavour).filter(Boolean),
    categories,
  };
}

export async function addReview(productId, { userId, authorName, rating, title, body }) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: { productId, userId: userId || null, authorName, rating, title, body },
    });

    const stats = await tx.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        ratingAvg: Number((stats._avg.rating ?? 0).toFixed(2)),
        ratingCount: stats._count,
      },
    });

    return created;
  });

  return review;
}
