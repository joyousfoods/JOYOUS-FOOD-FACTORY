import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req.body / req.query / req.params against Zod schemas and
 * replaces each with the parsed result, so downstream handlers only ever
 * see coerced, trusted values.
 */
export const validate = (schemas) => (req, _res, next) => {
  for (const key of ['body', 'query', 'params']) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || key,
        message: issue.message,
      }));
      return next(
        ApiError.badRequest(details[0]?.message || 'Invalid request', {
          code: 'VALIDATION_ERROR',
          details,
        })
      );
    }

    // req.query is a getter on Express 5; assign defensively.
    try {
      req[key] = result.data;
    } catch {
      Object.defineProperty(req, key, { value: result.data, writable: true });
    }
  }
  next();
};
