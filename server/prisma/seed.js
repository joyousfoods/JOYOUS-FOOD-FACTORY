/* eslint-disable no-console */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/config/env.js';

const prisma = new PrismaClient();

/**
 * Catalogue migrated verbatim from the previous hardcoded array in
 * src/components/Pricelist.jsx. Prices, pack labels and images are the
 * real ones from the existing site.
 *
 * Fields the business has not published (nutrition tables, exact weights,
 * detailed ingredient lists) are deliberately left null rather than
 * invented — the product page hides any section without data.
 */

const CATEGORIES = [
  {
    slug: 'chocolate-beedas',
    name: 'Chocolate Beedas',
    description:
      'Our signature creation — the tradition of sweet paan wrapped in a premium chocolate shell, made fresh every day.',
    imageUrl: '/1/B (71) copy.jpg',
    sortOrder: 1,
  },
  {
    slug: 'gift-boxes',
    name: 'Gift Boxes',
    description:
      'Assorted boxes built for weddings, festivals and corporate gifting. Ships free across India.',
    imageUrl: '/Gemini_Generated_Image_50m3lk50m3lk50m3.png',
    sortOrder: 2,
  },
  {
    slug: 'dry-fruit-range',
    name: 'Dry Fruit Range',
    description: 'Premium dry fruits bound in pure honey. Available as single pieces or packs.',
    imageUrl: '/assets/B__376__copy.jpg',
    sortOrder: 3,
  },
  {
    slug: 'commercial-packs',
    name: 'Commercial & Bulk',
    description:
      'Larger 50-piece packs priced for resellers, events and corporate volume. Sold in multiples of 5 packs.',
    imageUrl: '/Combo/B (382) copy.jpg',
    sortOrder: 4,
  },
];

const BEEDA_STORAGE =
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.';
const BEEDA_SHELF_LIFE = '6 months from manufacturing date';
const BEEDA_PACKAGING = 'Food-grade sealed tray inside an insulated courier box with ice packs.';

const PRODUCTS = [
  // ── Gift boxes ─────────────────────────────────────────────
  {
    slug: 'special-gift-box-36',
    name: 'Special Gift Box',
    category: 'gift-boxes',
    shortDescription: 'Six signature flavours, six pieces each — our complete range in one box.',
    description:
      'The full Joyous Food Factory range in a single presentation box: Rose, Chocolate, Pista, Vanilla, Kesar Badam and our seasonal flavour, six pieces of each. Made to order and dispatched fresh, this is the box our customers send for weddings, Diwali and corporate thank-yous.',
    mrpPaise: 129900,
    pricePaise: 99900,
    imageUrl: '/Gemini_Generated_Image_50m3lk50m3lk50m3.png',
    images: ['/Combo/B (376) copy.jpg', '/Combo/B (382) copy.jpg'],
    packLabel: '36 Pieces (6 Flavours × 6 pcs)',
    pieces: 36,
    stock: 40,
    freeShipping: true,
    badge: 'Free Shipping',
    isFeatured: true,
    isBestSeller: true,
    flavour: 'Assorted',
    shelfLife: BEEDA_SHELF_LIFE,
    storage: BEEDA_STORAGE,
    packaging: 'Presentation gift box with ribbon, shipped in an insulated courier box with ice packs.',
    sortOrder: 1,
  },

  // ── Retail beedas (25 pcs) ─────────────────────────────────
  {
    slug: 'rose-chocolate-beeda-25',
    name: 'Rose Flavour Chocolate Beeda',
    category: 'chocolate-beedas',
    shortDescription: 'Rose gulkand and betel leaf in a dark chocolate shell.',
    description:
      'Our bestseller. Rose gulkand, gently spiced betel leaf and a whisper of fennel, enrobed in chocolate and finished by hand. Sweet, floral and cooling.',
    mrpPaise: 75000,
    pricePaise: 62500,
    imageUrl: '/3/B (169) copy.jpg',
    images: ['/3/B (171) copy.jpg', '/3/B (187) copy.jpg', '/2/B (130) copy.jpg'],
    packLabel: 'Pack of 1 × 25 pcs',
    pieces: 25,
    stock: 60,
    badge: 'Bestseller',
    isBestSeller: true,
    isFeatured: true,
    flavour: 'Rose Gulkand',
    shelfLife: BEEDA_SHELF_LIFE,
    storage: BEEDA_STORAGE,
    packaging: BEEDA_PACKAGING,
    sortOrder: 2,
  },
  {
    slug: 'chocolate-beeda-25',
    name: 'Chocolate Flavour Chocolate Beeda',
    category: 'chocolate-beedas',
    shortDescription: 'The original — classic beeda filling in a rich chocolate shell.',
    description:
      'The one that started it all. A classic sweet beeda filling wrapped in a rich chocolate shell, made fresh each morning.',
    mrpPaise: 75000,
    pricePaise: 62500,
    imageUrl: '/1/B (71) copy.jpg',
    images: ['/1/B (69) copy.jpg', '/1/B (76) copy.jpg'],
    packLabel: 'Pack of 1 × 25 pcs',
    pieces: 25,
    stock: 60,
    badge: 'Classic',
    isBestSeller: true,
    flavour: 'Chocolate',
    shelfLife: BEEDA_SHELF_LIFE,
    storage: BEEDA_STORAGE,
    packaging: BEEDA_PACKAGING,
    sortOrder: 3,
  },
  {
    slug: 'pista-chocolate-beeda-25',
    name: 'Pista Flavour Chocolate Beeda',
    category: 'chocolate-beedas',
    shortDescription: 'Fresh pistachio through a smooth chocolate shell.',
    description:
      'Fresh pistachio folded into the filling and scattered over the shell, for a nutty finish against the sweetness of the beeda.',
    mrpPaise: 75000,
    pricePaise: 62500,
    imageUrl: '/2/B (157) copy.jpg',
    images: ['/2/B (163) copy.jpg', '/4/B (268) copy.jpg'],
    packLabel: 'Pack of 1 × 25 pcs',
    pieces: 25,
    stock: 45,
    isFeatured: true,
    flavour: 'Pistachio',
    shelfLife: BEEDA_SHELF_LIFE,
    storage: BEEDA_STORAGE,
    packaging: BEEDA_PACKAGING,
    sortOrder: 4,
  },
  {
    slug: 'vanilla-chocolate-beeda-25',
    name: 'Vanilla Flavour Chocolate Beeda',
    category: 'chocolate-beedas',
    shortDescription: 'Mellow vanilla white chocolate over a traditional filling.',
    description:
      'A softer, creamier take — mellow vanilla against the traditional beeda filling. The one to start with if you are new to beedas.',
    mrpPaise: 75000,
    pricePaise: 62500,
    imageUrl: '/5/B (352) copy.jpg',
    images: ['/5/B (358) copy.jpg', '/5/B (344) copy.jpg'],
    packLabel: 'Pack of 1 × 25 pcs',
    pieces: 25,
    stock: 45,
    badge: 'New',
    isNewArrival: true,
    flavour: 'Vanilla',
    shelfLife: BEEDA_SHELF_LIFE,
    storage: BEEDA_STORAGE,
    packaging: BEEDA_PACKAGING,
    sortOrder: 5,
  },
  {
    slug: 'kesar-badam-chocolate-beeda-25',
    name: 'Kesar Badam Flavour Chocolate Beeda',
    category: 'chocolate-beedas',
    shortDescription: 'Saffron and almond — our richest flavour.',
    description:
      'Real saffron and slivered almond make this the richest in the range, and the one most often chosen for wedding boxes.',
    mrpPaise: 75000,
    pricePaise: 62500,
    imageUrl: '/4/B (292) copy.jpg',
    images: ['/4/B (298) copy.jpg', '/4/B (268) copy.jpg'],
    packLabel: 'Pack of 1 × 25 pcs',
    pieces: 25,
    stock: 40,
    isFeatured: true,
    flavour: 'Kesar Badam',
    shelfLife: BEEDA_SHELF_LIFE,
    storage: BEEDA_STORAGE,
    packaging: BEEDA_PACKAGING,
    sortOrder: 6,
  },

  // ── Dry fruit range ────────────────────────────────────────
  {
    slug: 'honey-dry-fruit-mix-single',
    name: 'Honey Dry Fruit Mix',
    category: 'dry-fruit-range',
    shortDescription: 'A single piece — premium dry fruits bound in pure honey.',
    description:
      'Premium dry fruits bound together with pure honey and set by hand. No chocolate, no added sugar syrup. Sold as a single piece so you can try it before committing to a pack.',
    mrpPaise: 3000,
    pricePaise: 2500,
    imageUrl: '/products/honey-dry-fruit-single.png',
    packLabel: 'Single Piece',
    pieces: 1,
    stock: 200,
    badge: 'New',
    isNewArrival: true,
    flavour: 'Honey Dry Fruit',
    shelfLife: '30 days from the date of dispatch',
    storage: 'Store in a cool, dry place away from direct sunlight.',
    sortOrder: 7,
  },
  {
    slug: 'honey-dry-fruit-mix-pack-18',
    name: 'Honey Dry Fruit Mix — Pack of 18',
    category: 'dry-fruit-range',
    shortDescription: 'Eighteen pieces of honey-bound premium dry fruit.',
    description:
      'The full pack of our honey dry fruit mix — eighteen pieces, boxed and ready to gift or keep. Premium dry fruits bound with pure honey, no chocolate.',
    mrpPaise: 54000,
    pricePaise: 45000,
    imageUrl: '/products/honey-dry-fruit-pack-18.jpeg',
    packLabel: 'Pack of 18',
    pieces: 18,
    stock: 50,
    badge: 'New',
    isNewArrival: true,
    isFeatured: true,
    flavour: 'Honey Dry Fruit',
    shelfLife: '30 days from the date of dispatch',
    storage: 'Store in a cool, dry place away from direct sunlight.',
    sortOrder: 8,
  },

  // ── Commercial packs (50 pcs, multiples of 5) ───────────────
  ...[
    ['rose', 'Rose Flavour', '/3/B (169) copy.jpg', 'Rose Gulkand', 'Bulk Save'],
    ['chocolate', 'Chocolate Flavour', '/1/B (71) copy.jpg', 'Chocolate', 'Most Popular'],
    ['pista', 'Pista Flavour', '/2/B (157) copy.jpg', 'Pistachio', null],
    ['vanilla', 'Vanilla Flavour', '/5/B (352) copy.jpg', 'Vanilla', null],
    ['kesar-badam', 'Kesar Badam Flavour', '/4/B (292) copy.jpg', 'Kesar Badam', null],
  ].map(([slug, name, imageUrl, flavour, badge], index) => ({
    slug: `commercial-${slug}-50`,
    name: `${name} — Commercial Pack`,
    category: 'commercial-packs',
    shortDescription: '50 pieces per pack, priced for volume. Free shipping.',
    description:
      'Our 50-piece commercial pack, priced for resellers, event caterers and corporate volume. Commercial packs are sold in multiples of 5 packs and ship free anywhere in India.',
    mrpPaise: 150000,
    pricePaise: 120000,
    imageUrl,
    packLabel: 'Pack of 1 × 50 pcs',
    pieces: 50,
    stock: 100,
    tier: 'BULK',
    orderMultiple: 5,
    freeShipping: true,
    badge,
    flavour,
    shelfLife: BEEDA_SHELF_LIFE,
    storage: BEEDA_STORAGE,
    packaging: BEEDA_PACKAGING,
    sortOrder: 20 + index,
  })),
];

const COUPONS = [
  {
    code: 'JOYOUS10',
    description: '10% off your order, up to ₹150',
    type: 'PERCENT',
    value: 10,
    maxDiscountPaise: 15000,
    minOrderPaise: 50000,
    perUserLimit: 3,
    isPublic: true,
  },
  {
    code: 'FIRSTBOX',
    description: '₹100 off your first order above ₹799',
    type: 'FLAT',
    value: 10000,
    minOrderPaise: 79900,
    perUserLimit: 1,
    isPublic: true,
  },
  {
    code: 'FREESHIP',
    description: 'Free delivery on any order above ₹499',
    type: 'FREE_SHIPPING',
    value: 0,
    minOrderPaise: 49900,
    isPublic: true,
  },
  {
    code: 'GIFT15',
    description: '15% off gift boxes, up to ₹250',
    type: 'PERCENT',
    value: 15,
    maxDiscountPaise: 25000,
    minOrderPaise: 0,
    appliesTo: 'CATEGORY',
    isPublic: true,
  },
];

async function main() {
  console.log('Seeding Joyous Food Factory…\n');

  // ── Categories
  const categoryBySlug = {};
  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
    categoryBySlug[category.slug] = record;
    console.log(`  category  ${record.slug}`);
  }

  // ── Products
  for (const { category, ...product } of PRODUCTS) {
    const data = { ...product, categoryId: categoryBySlug[category].id };
    await prisma.product.upsert({
      where: { slug: product.slug },
      create: data,
      // Never overwrite live stock levels on a re-seed.
      update: { ...data, stock: undefined },
    });
    console.log(`  product   ${product.slug}`);
  }

  // ── Coupons
  for (const coupon of COUPONS) {
    const data = {
      ...coupon,
      ...(coupon.appliesTo === 'CATEGORY'
        ? { categoryIds: [categoryBySlug['gift-boxes'].id] }
        : {}),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    };
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      create: data,
      update: data,
    });
    console.log(`  coupon    ${coupon.code}`);
  }

  // ── Admin account
  if (env.seed.adminPassword) {
    await prisma.user.upsert({
      where: { email: env.seed.adminEmail },
      create: {
        name: 'Joyous Admin',
        email: env.seed.adminEmail,
        passwordHash: await bcrypt.hash(env.seed.adminPassword, 12),
        role: 'ADMIN',
      },
      update: { role: 'ADMIN' },
    });
    console.log(`\n  admin     ${env.seed.adminEmail}`);
  } else {
    console.log('\n  admin     skipped — set SEED_ADMIN_PASSWORD in server/.env to create one');
  }

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    coupons: await prisma.coupon.count(),
  };
  console.log(`\nDone. ${counts.categories} categories, ${counts.products} products, ${counts.coupons} coupons.\n`);
}

main()
  .catch((err) => {
    console.error('\nSeed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
