import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
router.use(requireAuth);

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the recipient name').max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  line1: z.string().trim().min(5, 'Enter the flat / house and street').max(160),
  line2: z.string().trim().max(160).optional().or(z.literal('')),
  landmark: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Enter the city').max(80),
  state: z.string().trim().min(2, 'Select the state').max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  type: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
  isDefault: z.boolean().default(false),
});

/** Exactly one address per user may be the default. */
async function clearOtherDefaults(tx, userId, keepId) {
  await tx.address.updateMany({
    where: { userId, isDefault: true, ...(keepId ? { NOT: { id: keepId } } : {}) },
    data: { isDefault: false },
  });
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: { items } });
  })
);

router.post(
  '/',
  validate({ body: addressSchema }),
  asyncHandler(async (req, res) => {
    const count = await prisma.address.count({ where: { userId: req.user.id } });
    // The first address a customer saves is their default whether they
    // ticked the box or not.
    const isDefault = req.body.isDefault || count === 0;

    const address = await prisma.$transaction(async (tx) => {
      const created = await tx.address.create({
        data: { ...req.body, isDefault, userId: req.user.id },
      });
      if (isDefault) await clearOtherDefaults(tx, req.user.id, created.id);
      return created;
    });

    res.status(201).json({ success: true, data: { address } });
  })
);

router.patch(
  '/:id',
  validate({ body: addressSchema.partial() }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw ApiError.notFound('Address not found');

    const address = await prisma.$transaction(async (tx) => {
      const updated = await tx.address.update({ where: { id: req.params.id }, data: req.body });
      if (req.body.isDefault) await clearOtherDefaults(tx, req.user.id, updated.id);
      return updated;
    });

    res.json({ success: true, data: { address } });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw ApiError.notFound('Address not found');

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: req.params.id } });

      // Promote another address so the account is never left without a default.
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
        });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });

    res.json({ success: true, data: { message: 'Address removed' } });
  })
);

router.post(
  '/:id/default',
  asyncHandler(async (req, res) => {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw ApiError.notFound('Address not found');

    await prisma.$transaction(async (tx) => {
      await clearOtherDefaults(tx, req.user.id, req.params.id);
      await tx.address.update({ where: { id: req.params.id }, data: { isDefault: true } });
    });

    const items = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: { items } });
  })
);

export default router;
