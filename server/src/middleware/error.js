import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
};

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export const errorHandler = (err, req, res, _next) => {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong on our side. Please try again.';
  let details;

  if (err instanceof ApiError) {
    ({ status, code, message, details } = err);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      code = 'DUPLICATE';
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'value';
      message = `That ${target} is already in use`;
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'The requested record no longer exists';
    } else {
      logger.error('db', `Prisma ${err.code}`, err.meta);
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    status = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Cannot reach the database. Check DATABASE_URL and that Postgres is running.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'BAD_JSON';
    message = 'Request body was not valid JSON';
  }

  if (status >= 500) {
    logger.error('http', `${req.method} ${req.originalUrl} → ${status}`, err);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.isProduction || status < 500 ? {} : { stack: err.stack }),
    },
  });
};
