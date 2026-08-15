import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// `--watch` reloads this module on every save; without the global cache
// each reload would open a fresh connection pool.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__jffPrisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['error', 'warn'],
  });

if (!env.isProduction) globalForPrisma.__jffPrisma = prisma;
