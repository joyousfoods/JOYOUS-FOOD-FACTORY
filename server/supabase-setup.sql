-- ============================================================
-- JOYOUS FOOD FACTORY — Complete Supabase Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Drop existing tables (safe re-run) ──────────────────────
DROP TABLE IF EXISTS "WebhookEvent" CASCADE;
DROP TABLE IF EXISTS "NewsletterSubscriber" CASCADE;
DROP TABLE IF EXISTS "WhatsAppNotificationLog" CASCADE;
DROP TABLE IF EXISTS "OrderEvent" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "CouponRedemption" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "WishlistItem" CASCADE;
DROP TABLE IF EXISTS "CartItem" CASCADE;
DROP TABLE IF EXISTS "Cart" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "Coupon" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Address" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ── Users & Auth ─────────────────────────────────────────────

CREATE TABLE "User" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  "passwordHash" TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'CUSTOMER',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_email ON "User"(email);

CREATE TABLE "RefreshToken" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "tokenHash" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_token_user ON "RefreshToken"("userId");

-- ── Catalogue ────────────────────────────────────────────────

CREATE TABLE "Category" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  "imageUrl"  TEXT,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_category_slug ON "Category"(slug);

CREATE TABLE "Product" (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  "shortDescription"  TEXT,
  description         TEXT,
  brand               TEXT NOT NULL DEFAULT 'Joyous Food Factory',
  "categoryId"        TEXT NOT NULL REFERENCES "Category"(id),
  "mrpPaise"          INT NOT NULL,
  "pricePaise"        INT NOT NULL,
  "imageUrl"          TEXT NOT NULL,
  images              JSONB,
  stock               INT NOT NULL DEFAULT 0,
  "trackStock"        BOOLEAN NOT NULL DEFAULT true,
  "freeShipping"      BOOLEAN NOT NULL DEFAULT false,
  tier                TEXT NOT NULL DEFAULT 'RETAIL',
  "orderMultiple"     INT NOT NULL DEFAULT 1,
  "isActive"          BOOLEAN NOT NULL DEFAULT true,
  "isFeatured"        BOOLEAN NOT NULL DEFAULT false,
  "isBestSeller"      BOOLEAN NOT NULL DEFAULT false,
  "isNewArrival"      BOOLEAN NOT NULL DEFAULT false,
  badge               TEXT,
  "salesCount"        INT NOT NULL DEFAULT 0,
  "sortOrder"         INT NOT NULL DEFAULT 0,
  "packLabel"         TEXT,
  pieces              INT,
  "weightGrams"       INT,
  flavour             TEXT,
  "shelfLife"         TEXT,
  storage             TEXT,
  ingredients         JSONB,
  allergens           JSONB,
  nutrition           JSONB,
  packaging           TEXT,
  "isVeg"             BOOLEAN NOT NULL DEFAULT true,
  "ratingAvg"         FLOAT NOT NULL DEFAULT 0,
  "ratingCount"       INT NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_category ON "Product"("categoryId");
CREATE INDEX idx_product_slug ON "Product"(slug);
CREATE INDEX idx_product_active_tier ON "Product"("isActive", tier);

CREATE TABLE "Review" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId"  TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "userId"     TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "authorName" TEXT NOT NULL,
  rating       INT NOT NULL,
  title        TEXT,
  body         TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_product ON "Review"("productId");

-- ── Cart ─────────────────────────────────────────────────────

CREATE TABLE "Cart" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"     TEXT UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  "guestToken" TEXT UNIQUE,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "CartItem" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "cartId"    TEXT NOT NULL REFERENCES "Cart"(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity    INT NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("cartId", "productId")
);
CREATE INDEX idx_cart_item_cart ON "CartItem"("cartId");

-- ── Wishlist ─────────────────────────────────────────────────

CREATE TABLE "WishlistItem" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "productId")
);
CREATE INDEX idx_wishlist_user ON "WishlistItem"("userId");

-- ── Addresses ────────────────────────────────────────────────

CREATE TABLE "Address" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "fullName"  TEXT NOT NULL,
  phone       TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  landmark    TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'HOME',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_address_user ON "Address"("userId");

-- ── Orders ───────────────────────────────────────────────────

CREATE TABLE "Order" (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderNumber"       TEXT UNIQUE NOT NULL,
  "userId"            TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "addressId"         TEXT REFERENCES "Address"(id) ON DELETE SET NULL,
  "shippingSnapshot"  JSONB NOT NULL,
  "customerName"      TEXT NOT NULL,
  "customerPhone"     TEXT NOT NULL,
  "customerEmail"     TEXT NOT NULL,
  "subtotalPaise"     INT NOT NULL,
  "discountPaise"     INT NOT NULL DEFAULT 0,
  "deliveryPaise"     INT NOT NULL DEFAULT 0,
  "totalPaise"        INT NOT NULL,
  "couponCode"        TEXT,
  "paymentMethod"     TEXT NOT NULL,
  "paymentStatus"     TEXT NOT NULL DEFAULT 'PENDING',
  "orderStatus"       TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  "razorpayOrderId"   TEXT UNIQUE,
  "razorpayPaymentId" TEXT,
  "customerNote"      TEXT,
  "giftMessage"       TEXT,
  "internalNote"      TEXT,
  "placedAt"          TIMESTAMPTZ,
  "cancelledAt"       TIMESTAMPTZ,
  "deliveredAt"       TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_user ON "Order"("userId");
CREATE INDEX idx_order_status ON "Order"("orderStatus");
CREATE INDEX idx_order_razorpay ON "Order"("razorpayOrderId");

CREATE TABLE "OrderItem" (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"        TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId"      TEXT REFERENCES "Product"(id) ON DELETE SET NULL,
  "productName"    TEXT NOT NULL,
  "productSlug"    TEXT NOT NULL,
  "packLabel"      TEXT,
  "imageUrl"       TEXT,
  "unitPricePaise" INT NOT NULL,
  "unitMrpPaise"   INT NOT NULL,
  quantity         INT NOT NULL,
  "subtotalPaise"  INT NOT NULL
);
CREATE INDEX idx_order_item_order ON "OrderItem"("orderId");

CREATE TABLE "Payment" (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"           TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL,
  "providerOrderId"   TEXT,
  "providerPaymentId" TEXT UNIQUE,
  "providerSignature" TEXT,
  "amountPaise"       INT NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              TEXT NOT NULL,
  method              TEXT,
  "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
  "errorCode"         TEXT,
  "errorDescription"  TEXT,
  "rawPayload"        JSONB,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_order ON "Payment"("orderId");

CREATE TABLE "OrderEvent" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"   TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_event_order ON "OrderEvent"("orderId");

-- ── Coupons ──────────────────────────────────────────────────

CREATE TABLE "Coupon" (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code                 TEXT UNIQUE NOT NULL,
  description          TEXT,
  type                 TEXT NOT NULL,
  value                INT NOT NULL,
  "maxDiscountPaise"   INT,
  "minOrderPaise"      INT NOT NULL DEFAULT 0,
  "appliesTo"          TEXT NOT NULL DEFAULT 'ALL',
  "categoryIds"        JSONB,
  "productIds"         JSONB,
  "usageLimit"         INT,
  "usedCount"          INT NOT NULL DEFAULT 0,
  "perUserLimit"       INT,
  "startsAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt"          TIMESTAMPTZ,
  "isActive"           BOOLEAN NOT NULL DEFAULT true,
  "isPublic"           BOOLEAN NOT NULL DEFAULT true,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "CouponRedemption" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "couponId"      TEXT NOT NULL REFERENCES "Coupon"(id) ON DELETE CASCADE,
  "orderId"       TEXT UNIQUE NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "userId"        TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "discountPaise" INT NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_coupon_redemption_coupon ON "CouponRedemption"("couponId");
CREATE INDEX idx_coupon_redemption_user ON "CouponRedemption"("userId");

-- ── Notifications & Logs ─────────────────────────────────────

CREATE TABLE "Notification" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'GENERAL',
  "linkUrl"   TEXT,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_user_read ON "Notification"("userId", "isRead");

CREATE TABLE "WhatsAppNotificationLog" (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"           TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  template            TEXT NOT NULL,
  recipient           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  "providerMessageId" TEXT,
  payload             JSONB,
  error               TEXT,
  attempts            INT NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("orderId", template)
);
CREATE INDEX idx_wa_log_status ON "WhatsAppNotificationLog"(status);

CREATE TABLE "WebhookEvent" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider      TEXT NOT NULL,
  "eventId"     TEXT NOT NULL,
  "eventType"   TEXT,
  payload       JSONB,
  "processedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, "eventId")
);

CREATE TABLE "NewsletterSubscriber" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email       TEXT UNIQUE NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- ── Categories ───────────────────────────────────────────────

INSERT INTO "Category" (id, slug, name, description, "imageUrl", "sortOrder") VALUES
  ('cat_beedas',      'chocolate-beedas',  'Chocolate Beedas',   'Our signature creation — the tradition of sweet paan wrapped in a premium chocolate shell, made fresh every day.',          '/1/B (71) copy.jpg',                              1),
  ('cat_gifts',       'gift-boxes',        'Gift Boxes',         'Assorted boxes built for weddings, festivals and corporate gifting. Ships free across India.',                               '/Gemini_Generated_Image_50m3lk50m3lk50m3.png',    2),
  ('cat_dryfruits',   'dry-fruit-range',   'Dry Fruit Range',    'Premium dry fruits bound in pure honey. Available as single pieces or packs.',                                               '/assets/B__376__copy.jpg',                        3),
  ('cat_commercial',  'commercial-packs',  'Commercial & Bulk',  'Larger 50-piece packs priced for resellers, events and corporate volume. Sold in multiples of 5 packs.',                    '/Combo/B (382) copy.jpg',                         4);

-- ── Products ─────────────────────────────────────────────────

INSERT INTO "Product" (
  id, slug, name, "shortDescription", description, "categoryId",
  "mrpPaise", "pricePaise", "imageUrl", images,
  "packLabel", pieces, stock, "freeShipping", tier, "orderMultiple",
  "isFeatured", "isBestSeller", "isNewArrival", badge,
  flavour, "shelfLife", storage, packaging, "sortOrder"
) VALUES

-- Gift Box
(
  'prod_giftbox', 'special-gift-box-36', 'Special Gift Box',
  'Six signature flavours, six pieces each — our complete range in one box.',
  'The full Joyous Food Factory range in a single presentation box: Rose, Chocolate, Pista, Vanilla, Kesar Badam and our seasonal flavour, six pieces of each. Made to order and dispatched fresh.',
  'cat_gifts', 129900, 99900,
  '/Gemini_Generated_Image_50m3lk50m3lk50m3.png',
  '["/Combo/B (376) copy.jpg", "/Combo/B (382) copy.jpg"]',
  '36 Pieces (6 Flavours × 6 pcs)', 36, 40, true, 'RETAIL', 1,
  true, true, false, 'Free Shipping',
  'Assorted', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Presentation gift box with ribbon, shipped in an insulated courier box with ice packs.', 1
),

-- Rose Beeda
(
  'prod_rose', 'rose-chocolate-beeda-25', 'Rose Flavour Chocolate Beeda',
  'Rose gulkand and betel leaf in a dark chocolate shell.',
  'Our bestseller. Rose gulkand, gently spiced betel leaf and a whisper of fennel, enrobed in chocolate and finished by hand. Sweet, floral and cooling.',
  'cat_beedas', 75000, 62500,
  '/3/B (169) copy.jpg',
  '["/3/B (171) copy.jpg", "/3/B (187) copy.jpg", "/2/B (130) copy.jpg"]',
  'Pack of 1 × 25 pcs', 25, 60, false, 'RETAIL', 1,
  true, true, false, 'Bestseller',
  'Rose Gulkand', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 2
),

-- Chocolate Beeda
(
  'prod_choco', 'chocolate-beeda-25', 'Chocolate Flavour Chocolate Beeda',
  'The original — classic beeda filling in a rich chocolate shell.',
  'The one that started it all. A classic sweet beeda filling wrapped in a rich chocolate shell, made fresh each morning.',
  'cat_beedas', 75000, 62500,
  '/1/B (71) copy.jpg',
  '["/1/B (69) copy.jpg", "/1/B (76) copy.jpg"]',
  'Pack of 1 × 25 pcs', 25, 60, false, 'RETAIL', 1,
  false, true, false, 'Classic',
  'Chocolate', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 3
),

-- Pista Beeda
(
  'prod_pista', 'pista-chocolate-beeda-25', 'Pista Flavour Chocolate Beeda',
  'Fresh pistachio through a smooth chocolate shell.',
  'Fresh pistachio folded into the filling and scattered over the shell, for a nutty finish against the sweetness of the beeda.',
  'cat_beedas', 75000, 62500,
  '/2/B (157) copy.jpg',
  '["/2/B (163) copy.jpg", "/4/B (268) copy.jpg"]',
  'Pack of 1 × 25 pcs', 25, 45, false, 'RETAIL', 1,
  true, false, false, null,
  'Pistachio', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 4
),

-- Vanilla Beeda
(
  'prod_vanilla', 'vanilla-chocolate-beeda-25', 'Vanilla Flavour Chocolate Beeda',
  'Mellow vanilla white chocolate over a traditional filling.',
  'A softer, creamier take — mellow vanilla against the traditional beeda filling. The one to start with if you are new to beedas.',
  'cat_beedas', 75000, 62500,
  '/5/B (352) copy.jpg',
  '["/5/B (358) copy.jpg", "/5/B (344) copy.jpg"]',
  'Pack of 1 × 25 pcs', 25, 45, false, 'RETAIL', 1,
  false, false, true, 'New',
  'Vanilla', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 5
),

-- Kesar Badam Beeda
(
  'prod_kesar', 'kesar-badam-chocolate-beeda-25', 'Kesar Badam Flavour Chocolate Beeda',
  'Saffron and almond — our richest flavour.',
  'Real saffron and slivered almond make this the richest in the range, and the one most often chosen for wedding boxes.',
  'cat_beedas', 75000, 62500,
  '/4/B (292) copy.jpg',
  '["/4/B (298) copy.jpg", "/4/B (268) copy.jpg"]',
  'Pack of 1 × 25 pcs', 25, 40, false, 'RETAIL', 1,
  true, false, false, null,
  'Kesar Badam', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 6
),

-- Honey Dry Fruit Single
(
  'prod_honey_single', 'honey-dry-fruit-mix-single', 'Honey Dry Fruit Mix',
  'A single piece — premium dry fruits bound in pure honey.',
  'Premium dry fruits bound together with pure honey and set by hand. No chocolate, no added sugar syrup. Sold as a single piece so you can try it before committing to a pack.',
  'cat_dryfruits', 3000, 2500,
  '/products/honey-dry-fruit-single.png', null,
  'Single Piece', 1, 200, false, 'RETAIL', 1,
  false, false, true, 'New',
  'Honey Dry Fruit', '30 days from the date of dispatch',
  'Store in a cool, dry place away from direct sunlight.',
  null, 7
),

-- Honey Dry Fruit Pack of 18
(
  'prod_honey_pack', 'honey-dry-fruit-mix-pack-18', 'Honey Dry Fruit Mix — Pack of 18',
  'Eighteen pieces of honey-bound premium dry fruit.',
  'The full pack of our honey dry fruit mix — eighteen pieces, boxed and ready to gift or keep. Premium dry fruits bound with pure honey, no chocolate.',
  'cat_dryfruits', 54000, 45000,
  '/products/honey-dry-fruit-pack-18.jpeg', null,
  'Pack of 18', 18, 50, false, 'RETAIL', 1,
  true, false, true, 'New',
  'Honey Dry Fruit', '30 days from the date of dispatch',
  'Store in a cool, dry place away from direct sunlight.',
  null, 8
),

-- Commercial Packs
(
  'prod_com_rose', 'commercial-rose-50', 'Rose Flavour — Commercial Pack',
  '50 pieces per pack, priced for volume. Free shipping.',
  'Our 50-piece commercial pack, priced for resellers, event caterers and corporate volume. Sold in multiples of 5 packs and ship free anywhere in India.',
  'cat_commercial', 150000, 120000,
  '/3/B (169) copy.jpg', null,
  'Pack of 1 × 50 pcs', 50, 100, true, 'BULK', 5,
  false, false, false, 'Bulk Save',
  'Rose Gulkand', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 20
),
(
  'prod_com_choco', 'commercial-chocolate-50', 'Chocolate Flavour — Commercial Pack',
  '50 pieces per pack, priced for volume. Free shipping.',
  'Our 50-piece commercial pack, priced for resellers, event caterers and corporate volume. Sold in multiples of 5 packs and ship free anywhere in India.',
  'cat_commercial', 150000, 120000,
  '/1/B (71) copy.jpg', null,
  'Pack of 1 × 50 pcs', 50, 100, true, 'BULK', 5,
  false, false, false, 'Most Popular',
  'Chocolate', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 21
),
(
  'prod_com_pista', 'commercial-pista-50', 'Pista Flavour — Commercial Pack',
  '50 pieces per pack, priced for volume. Free shipping.',
  'Our 50-piece commercial pack, priced for resellers, event caterers and corporate volume. Sold in multiples of 5 packs and ship free anywhere in India.',
  'cat_commercial', 150000, 120000,
  '/2/B (157) copy.jpg', null,
  'Pack of 1 × 50 pcs', 50, 100, true, 'BULK', 5,
  false, false, false, null,
  'Pistachio', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 22
),
(
  'prod_com_vanilla', 'commercial-vanilla-50', 'Vanilla Flavour — Commercial Pack',
  '50 pieces per pack, priced for volume. Free shipping.',
  'Our 50-piece commercial pack, priced for resellers, event caterers and corporate volume. Sold in multiples of 5 packs and ship free anywhere in India.',
  'cat_commercial', 150000, 120000,
  '/5/B (352) copy.jpg', null,
  'Pack of 1 × 50 pcs', 50, 100, true, 'BULK', 5,
  false, false, false, null,
  'Vanilla', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 23
),
(
  'prod_com_kesar', 'commercial-kesar-badam-50', 'Kesar Badam Flavour — Commercial Pack',
  '50 pieces per pack, priced for volume. Free shipping.',
  'Our 50-piece commercial pack, priced for resellers, event caterers and corporate volume. Sold in multiples of 5 packs and ship free anywhere in India.',
  'cat_commercial', 150000, 120000,
  '/4/B (292) copy.jpg', null,
  'Pack of 1 × 50 pcs', 50, 100, true, 'BULK', 5,
  false, false, false, null,
  'Kesar Badam', '7 days from the date of dispatch when refrigerated',
  'Keep refrigerated between 4°C and 8°C. Best enjoyed chilled. Do not freeze.',
  'Food-grade sealed tray inside an insulated courier box with ice packs.', 24
);

-- ── Coupons ──────────────────────────────────────────────────

INSERT INTO "Coupon" (code, description, type, value, "maxDiscountPaise", "minOrderPaise", "perUserLimit", "isPublic", "expiresAt") VALUES
  ('JOYOUS10', '10% off your order, up to ₹150',          'PERCENT',      10, 15000, 50000, 3, true, now() + interval '180 days'),
  ('FIRSTBOX', '₹100 off your first order above ₹799',    'FLAT',      10000,  null, 79900, 1, true, now() + interval '180 days'),
  ('FREESHIP', 'Free delivery on any order above ₹499',   'FREE_SHIPPING', 0,  null, 49900, null, true, now() + interval '180 days');

INSERT INTO "Coupon" (code, description, type, value, "maxDiscountPaise", "minOrderPaise", "appliesTo", "categoryIds", "isPublic", "expiresAt") VALUES
  ('GIFT15', '15% off gift boxes, up to ₹250', 'PERCENT', 15, 25000, 0, 'CATEGORY', '["cat_gifts"]', true, now() + interval '180 days');

-- ── Done ─────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM "Category") AS categories,
  (SELECT count(*) FROM "Product")  AS products,
  (SELECT count(*) FROM "Coupon")   AS coupons;
