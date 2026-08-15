import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { GUEST_CART_HEADER } from '../constants/index.js';
import { mergeGuestCart } from '../services/cartService.js';
import * as authService from '../services/authService.js';

const router = Router();

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const phoneRule = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: phoneRule.optional().or(z.literal('').transform(() => undefined)),
  password: passwordRule,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
});

/** Issues cookies + JSON in one place so every auth response is identical. */
function sendSession(res, { user, accessToken, refresh }) {
  authService.setRefreshCookie(res, refresh.token, refresh.expiresAt);
  res.json({ success: true, data: { user, accessToken } });
}

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const session = await authService.register(req.body);
    await mergeGuestCart({ userId: session.user.id, guestToken: req.headers[GUEST_CART_HEADER] });
    sendSession(res.status(201), session);
  })
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const session = await authService.login(req.body);
    // Fold the guest cart in before the client re-fetches it.
    await mergeGuestCart({ userId: session.user.id, guestToken: req.headers[GUEST_CART_HEADER] });
    sendSession(res, session);
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const session = await authService.refreshSession(authService.readRefreshCookie(req));
    sendSession(res, session);
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await authService.logout(authService.readRefreshCookie(req));
    authService.clearRefreshCookie(res);
    res.json({ success: true, data: { message: 'Signed out' } });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: { user: await authService.getProfile(req.user.id) } });
  })
);

router.patch(
  '/me',
  requireAuth,
  validate({
    body: z.object({
      name: z.string().trim().min(2).max(80).optional(),
      phone: phoneRule.optional().or(z.literal('')),
    }),
  }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: { user: await authService.updateProfile(req.user.id, req.body) } });
  })
);

router.post(
  '/change-password',
  requireAuth,
  authLimiter,
  validate({
    body: z.object({
      currentPassword: z.string().min(1, 'Enter your current password'),
      newPassword: passwordRule,
    }),
  }),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user.id, req.body);
    authService.clearRefreshCookie(res);
    res.json({
      success: true,
      data: { message: 'Password updated. Please sign in again.' },
    });
  })
);

export default router;
