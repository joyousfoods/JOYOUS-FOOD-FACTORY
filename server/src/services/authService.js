import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/index.js';

const SALT_ROUNDS = 12;
const REFRESH_COOKIE = 'jff_refresh';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl,
  });
}

function ttlToMs(ttl) {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const [, amount, unit] = match;
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return Number(amount) * factor;
}

/**
 * Refresh tokens are opaque random strings; only their SHA-256 hash is
 * stored, so a database leak cannot be replayed against the API.
 */
async function issueRefreshToken(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + ttlToMs(env.jwt.refreshTtl));
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return { token, expiresAt };
}

export function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    expires: expiresAt,
    path: '/api/auth',
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

export const readRefreshCookie = (req) => req.cookies?.[REFRESH_COOKIE] || null;

export async function register({ name, email, phone, password }) {
  const normalisedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalisedEmail } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists. Try signing in instead.');
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalisedEmail,
      phone: phone || null,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      role: ROLES.CUSTOMER,
    },
  });

  const refresh = await issueRefreshToken(user.id);
  return { user: publicUser(user), accessToken: signAccessToken(user), refresh };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  // Compare against a dummy hash when the user is absent so the response
  // time does not reveal whether an email is registered.
  const hash = user?.passwordHash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) throw ApiError.unauthorized('Incorrect email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');

  const refresh = await issueRefreshToken(user.id);
  return { user: publicUser(user), accessToken: signAccessToken(user), refresh };
}

/** Rotates the refresh token: the presented one is revoked as it is spent. */
export async function refreshSession(presentedToken) {
  if (!presentedToken) throw ApiError.unauthorized('No session to refresh');

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presentedToken) },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }
  if (!record.user.isActive) throw ApiError.forbidden('This account has been disabled');

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const refresh = await issueRefreshToken(record.userId);
  return {
    user: publicUser(record.user),
    accessToken: signAccessToken(record.user),
    refresh,
  };
}

export async function logout(presentedToken) {
  if (!presentedToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(presentedToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Account not found');
  return publicUser(user);
}

export async function updateProfile(userId, { name, phone }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
    },
  });
  return publicUser(user);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Account not found');

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest('Your current password is incorrect');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS) },
  });

  // Signing out every other device is the point of a password change.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
