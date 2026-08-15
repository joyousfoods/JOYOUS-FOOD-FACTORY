import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function readAccessToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.jff_access || null;
}

async function loadUser(token) {
  const payload = jwt.verify(token, env.jwt.accessSecret);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return user;
}

/** Hard gate — 401 when there is no valid session. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readAccessToken(req);
  if (!token) throw ApiError.unauthorized();

  let user;
  try {
    user = await loadUser(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Your session has expired', { code: 'TOKEN_EXPIRED' });
    }
    throw ApiError.unauthorized('Invalid session');
  }

  if (!user) throw ApiError.unauthorized('Invalid session');
  req.user = user;
  next();
});

/** Soft gate — attaches req.user when present, never rejects. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readAccessToken(req);
  if (token) {
    try {
      req.user = (await loadUser(token)) || undefined;
    } catch {
      // An expired or malformed token on a public route is not an error;
      // the request simply continues as a guest.
    }
  }
  next();
});

export const requireAdmin = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role !== ROLES.ADMIN) return next(ApiError.forbidden('Admin access required'));
  next();
};
