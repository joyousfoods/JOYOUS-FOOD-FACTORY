-- ============================================================
-- JOYOUS FOOD FACTORY — SUPABASE INITIAL SEED DATA
-- Execute this script in your Supabase SQL Editor after running schema.sql
-- ============================================================

-- Categories Seed Data
INSERT INTO public.categories (id, slug, name, image_url, product_count) VALUES
('chocolate-beedas', 'chocolate-beedas', 'Chocolate Beedas', '/3/B (169) copy.jpg', 4),
('gift-boxes', 'gift-boxes', 'Gift Boxes', '/Gemini_Generated_Image_50m3lk50m3lk50m3.png', 2),
('dry-fruit-range', 'dry-fruit-range', 'Dry Fruit Range', '/products/honey-dry-fruit-pack-18.jpeg', 1),
('commercial-packs', 'commercial-packs', 'Commercial & Bulk', '/Combo/B (376) copy.jpg', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url;

-- Products Seed Data
INSERT INTO public.products (
  id, slug, name, short_description, description, category, mrp, price,
  image, images, pack_label, pieces, badge, free_shipping, is_featured,
  is_bestseller, is_new_arrival, flavour, shelf_life, storage
) VALUES
(
  'special-gift-box-36',
  'special-gift-box-36',
  'Special Gift Box',
  'Six signature flavours, six pieces each — our complete range in one box.',
  'The full Joyous Food Factory range in a single presentation box: Rose, Chocolate, Pista, Vanilla, Kesar Badam and our seasonal flavour, six pieces of each. Made to order and dispatched fresh.',
  'gift-boxes',
  1299.00, 999.00,
  '/Gemini_Generated_Image_50m3lk50m3lk50m3.png',
  ARRAY['/Combo/B (376) copy.jpg', '/Combo/B (382) copy.jpg'],
  '36 Pieces (6 Flavours × 6 pcs)', 36,
  'Free Shipping', TRUE, TRUE, TRUE, FALSE,
  'Assorted', '6 months from manufacturing date', 'Keep refrigerated between 4°C and 8°C.'
),
(
  'rose-chocolate-beeda-25',
  'rose-chocolate-beeda-25',
  'Rose Flavour Chocolate Beeda',
  'Rose gulkand and betel leaf in a dark chocolate shell.',
  'Our bestseller. Rose gulkand, gently spiced betel leaf and a whisper of fennel, enrobed in chocolate and finished by hand. Sweet, floral and cooling.',
  'chocolate-beedas',
  750.00, 625.00,
  '/3/B (169) copy.jpg',
  ARRAY['/3/B (171) copy.jpg', '/3/B (187) copy.jpg'],
  'Pack of 1 × 25 pcs', 25,
  'Bestseller', FALSE, TRUE, TRUE, FALSE,
  'Rose Gulkand', '6 months from manufacturing date', 'Keep refrigerated between 4°C and 8°C.'
),
(
  'chocolate-beeda-25',
  'chocolate-beeda-25',
  'Chocolate Flavour Chocolate Beeda',
  'The original — classic beeda filling in a rich chocolate shell.',
  'The one that started it all. A classic sweet beeda filling wrapped in a rich chocolate shell, made fresh each morning.',
  'chocolate-beedas',
  750.00, 625.00,
  '/1/B (71) copy.jpg',
  ARRAY['/1/B (69) copy.jpg', '/1/B (76) copy.jpg'],
  'Pack of 1 × 25 pcs', 25,
  'Classic', FALSE, FALSE, TRUE, FALSE,
  'Chocolate', '6 months from manufacturing date', 'Keep refrigerated between 4°C and 8°C.'
),
(
  'pista-chocolate-beeda-25',
  'pista-chocolate-beeda-25',
  'Pista Flavour Chocolate Beeda',
  'Real crushed pistachios, cardamom and paan in chocolate.',
  'Crushed Iranian pistachios, green cardamom and betel leaf paste, covered in milk chocolate. Nutty, rich and aromatic.',
  'chocolate-beedas',
  800.00, 675.00,
  '/2/B (134) copy.jpg',
  ARRAY['/2/B (137) copy.jpg', '/2/B (144) copy.jpg'],
  'Pack of 1 × 25 pcs', 25,
  'Premium', FALSE, TRUE, FALSE, TRUE,
  'Pista Cardamom', '6 months from manufacturing date', 'Keep refrigerated between 4°C and 8°C.'
),
(
  'honey-dry-fruit-pack-18',
  'honey-dry-fruit-pack-18',
  'Honey Dry Fruit Mix',
  'Almonds, cashews, raisins and honey wrapped in betel leaf & chocolate.',
  'Whole roasted almonds, cashews and jumbo raisins coated in raw wildflower honey, tucked inside betel leaf and finished with chocolate.',
  'dry-fruit-range',
  950.00, 799.00,
  '/products/honey-dry-fruit-pack-18.jpeg',
  ARRAY['/products/honey-dry-fruit-pack-18.jpeg'],
  'Pack of 1 × 18 pcs', 18,
  'Healthy Delight', FALSE, TRUE, TRUE, TRUE,
  'Honey & Roasted Nuts', '10 days from dispatch (refrigerated)', 'Keep refrigerated between 4°C and 8°C.'
)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, name = EXCLUDED.name;

-- Initial Coupons Seed Data
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_price) VALUES
('WELCOME10', '10% off your first order', 'PERCENTAGE', 10.00, 500.00),
('FREESHIP999', 'Free shipping on orders above ₹999', 'FIXED', 90.00, 999.00)
ON CONFLICT (code) DO NOTHING;
