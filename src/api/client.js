/**
 * Single HTTP client for the whole storefront.
 *
 * Responsibilities that live here so no component has to think about them:
 *  - base URL + credentials
 *  - the in-memory access token and transparent refresh on 401
 *  - the guest cart token round-trip (x-guest-token)
 *  - turning every failure into an ApiError with a message safe to show
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const GUEST_TOKEN_KEY = 'jff_guest_token';

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkError() {
    return this.code === 'NETWORK_ERROR';
  }
  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

// ── Access token (memory only; the refresh token is an httpOnly cookie) ──
let accessToken = null;
const authListeners = new Set();

export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

/** Notifies the AuthContext when the session dies mid-flight. */
export const onAuthExpired = (listener) => {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
};
const emitAuthExpired = () => authListeners.forEach((fn) => fn());

// ── Guest cart token ────────────────────────────────────────────────────
export const getGuestToken = () => {
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null; // private browsing / storage disabled
  }
};

export const setGuestToken = (token) => {
  if (!token) return;
  try {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  } catch {
    /* non-fatal: the cart falls back to per-request behaviour */
  }
};

export const clearGuestToken = () => {
  try {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

// ── Refresh, de-duplicated across concurrent 401s ───────────────────────
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) return null;
      const payload = await response.json();
      const token = payload?.data?.accessToken || null;
      accessToken = token;
      return token;
    } catch {
      return null;
    } finally {
      // Cleared on the next tick so callers awaiting this promise all
      // observe the same result before a new refresh can start.
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        if (value.length) url.searchParams.set(key, value.join(','));
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function parseBody(response) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, params, signal, retryOn401 = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const guestToken = getGuestToken();
  if (guestToken) headers['x-guest-token'] = guestToken;

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      credentials: 'include',
      signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(
      'We could not reach the server. Check your connection and try again.',
      { code: 'NETWORK_ERROR' }
    );
  }

  // The server mints a guest cart on first write; persist it immediately.
  const returnedGuestToken = response.headers.get('x-guest-token');
  if (returnedGuestToken) setGuestToken(returnedGuestToken);

  if (response.status === 401 && retryOn401) {
    const token = await refreshAccessToken();
    if (token) {
      return request(path, { method, body, params, signal, retryOn401: false });
    }
    accessToken = null;
    emitAuthExpired();
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    const error = payload?.error || {};
    throw new ApiError(error.message || `Request failed (${response.status})`, {
      status: response.status,
      code: error.code,
      details: error.details,
    });
  }

  return payload?.data ?? payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  refreshAccessToken,
};
