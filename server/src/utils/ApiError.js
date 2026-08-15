export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || defaultCodeFor(status);
    this.details = details;
    this.expected = true;
  }

  static badRequest(message, opts) {
    return new ApiError(400, message, opts);
  }
  static unauthorized(message = 'Please sign in to continue', opts) {
    return new ApiError(401, message, opts);
  }
  static forbidden(message = 'You do not have access to this resource', opts) {
    return new ApiError(403, message, opts);
  }
  static notFound(message = 'Not found', opts) {
    return new ApiError(404, message, opts);
  }
  static conflict(message, opts) {
    return new ApiError(409, message, opts);
  }
  static unprocessable(message, opts) {
    return new ApiError(422, message, opts);
  }
  static tooMany(message = 'Too many requests, please slow down', opts) {
    return new ApiError(429, message, opts);
  }
  static internal(message = 'Something went wrong on our side', opts) {
    return new ApiError(500, message, opts);
  }
  static unavailable(message, opts) {
    return new ApiError(503, message, opts);
  }
}

function defaultCodeFor(status) {
  return (
    {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    }[status] || 'ERROR'
  );
}
