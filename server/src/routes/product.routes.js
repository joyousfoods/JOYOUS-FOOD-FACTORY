import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as productService from '../services/productService.js';

const router = Router();

/** Comma-separated query params ("a,b,c") arrive as one string. */
const csv = z
  .string()
  .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
  .optional();

const boolish = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1')
  .optional();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(),
  categories: csv,
  flavour: csv,
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minDiscount: z.coerce.number().int().min(0).max(100).optional(),
  tier: z.enum(['RETAIL', 'BULK']).optional(),
  inStock: boolish,
  onOffer: boolish,
  featured: boolish,
  bestSeller: boolish,
  newArrival: boolish,
  sort: z
    .enum(['relevance', 'popularity', 'price_asc', 'price_desc', 'newest', 'discount', 'rating'])
    .default('relevance'),
});

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await productService.listProducts(req.query) });
  })
);

router.get(
  '/facets',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: await productService.getFilterFacets() });
  })
);

router.get(
  '/search/suggestions',
  validate({
    query: z.object({
      q: z.string().trim().max(120).optional(),
      limit: z.coerce.number().int().min(1).max(10).default(6),
    }),
  }),
  asyncHandler(async (req, res) => {
    const data = await productService.searchSuggestions(req.query.q, req.query.limit);
    res.json({ success: true, data });
  })
);

/** Hydrates the client's "recently viewed" id list into full cards. */
router.post(
  '/batch',
  validate({ body: z.object({ ids: z.array(z.string()).max(24) }) }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: { items: await productService.getProductsByIds(req.body.ids) } });
  })
);

router.get(
  '/:slug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await productService.getProductBySlug(req.params.slug) });
  })
);

router.get(
  '/:slug/related',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: { items: await productService.getRelatedProducts(req.params.slug) },
    });
  })
);

router.get(
  '/:slug/frequently-bought-together',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: { items: await productService.getFrequentlyBoughtTogether(req.params.slug) },
    });
  })
);

router.post(
  '/:id/reviews',
  requireAuth,
  validate({
    body: z.object({
      rating: z.coerce.number().int().min(1).max(5),
      title: z.string().trim().max(120).optional(),
      body: z.string().trim().max(1500).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const review = await productService.addReview(req.params.id, {
      userId: req.user.id,
      authorName: req.user.name,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { review } });
  })
);

export default router;
