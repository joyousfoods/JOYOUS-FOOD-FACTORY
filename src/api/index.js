import { api } from './client.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import {
  supabaseAuthApi,
  supabaseProductApi,
  supabaseCatalogApi,
  supabaseOrderApi,
} from './supabaseService.js';
import { PRODUCTS, CATEGORIES, filterProducts } from '../data/products.js';

/**
 * Endpoint modules. Components import from here rather than calling
 * `api.get('/api/…')` inline. When Supabase is configured via .env,
 * requests are routed to Supabase PostgreSQL & Supabase Auth.
 */

export const authApi = {
  register: (payload) => {
    if (isSupabaseConfigured()) return supabaseAuthApi.register(payload);
    return api.post('/api/auth/register', payload);
  },
  login: (payload) => {
    if (isSupabaseConfigured()) return supabaseAuthApi.login(payload);
    return api.post('/api/auth/login', payload);
  },
  logout: () => {
    if (isSupabaseConfigured()) return supabaseAuthApi.logout();
    return api.post('/api/auth/logout');
  },
  me: () => {
    if (isSupabaseConfigured()) return supabaseAuthApi.me();
    return api.get('/api/auth/me');
  },
  updateProfile: (payload) => {
    if (isSupabaseConfigured()) return supabaseAuthApi.updateProfile(payload);
    return api.patch('/api/auth/me', payload);
  },
  changePassword: (payload) => api.post('/api/auth/change-password', payload),
};

export const productApi = {
  list: async (params = {}) => {
    if (isSupabaseConfigured()) {
      try { return await supabaseProductApi.list(params); } catch { /* fallback below */ }
    }
    const items = filterProducts(params);
    const limit = params.limit || items.length;
    return { items: items.slice(0, limit) };
  },
  facets: () => api.get('/api/products/facets'),
  detail: async (slug) => {
    if (isSupabaseConfigured()) {
      try {
        const item = await supabaseProductApi.detail(slug);
        if (item) return item;
      } catch { /* fallback below */ }
    }
    return PRODUCTS.find((p) => p.slug === slug) || null;
  },
  related: (slug) => api.get(`/api/products/${slug}/related`),
  frequentlyBoughtTogether: (slug) => api.get(`/api/products/${slug}/frequently-bought-together`),
  suggestions: (q) => {
    if (!q) return Promise.resolve({ items: [] });
    const matches = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    return Promise.resolve({ items: matches });
  },
  byIds: async (ids) => {
    if (isSupabaseConfigured()) {
      try { return await supabaseProductApi.byIds(ids); } catch { /* fallback below */ }
    }
    return { items: PRODUCTS.filter((p) => ids.includes(p.id)) };
  },
  addReview: (productId, payload) => api.post(`/api/products/${productId}/reviews`, payload),
};

export const catalogApi = {
  categories: async () => {
    if (isSupabaseConfigured()) {
      try { return await supabaseCatalogApi.categories(); } catch { /* fallback below */ }
    }
    return {
      items: CATEGORIES.map((c) => ({
        id: c.id,
        slug: c.id,
        name: c.label,
        imageUrl: '/3/B (169) copy.jpg',
        productCount: 4,
      })),
    };
  },
  config: () => Promise.resolve({
    currency: 'INR',
    delivery: { feePaise: 9000, freeThresholdPaise: 99900 },
    payments: { razorpayEnabled: false, razorpayKeyId: null, codEnabled: true, codMaxOrderPaise: 1000000 },
    support: {
      phone: '+919848574748',
      altPhone: '+919666255559',
      email: 'joyousfoodshyd@gmail.com',
      whatsapp: '919848574748',
    },
  }),
  coupons: async () => {
    if (isSupabaseConfigured()) {
      try { return await supabaseCatalogApi.coupons(); } catch { /* fallback below */ }
    }
    return {
      items: [
        { id: '1', code: 'WELCOME10', description: '10% off your first order', minOrderPaise: 50000 },
        { id: '2', code: 'FREESHIP999', description: 'Free shipping above ₹999', minOrderPaise: 99900 },
      ],
    };
  },
  subscribe: async (email) => {
    if (isSupabaseConfigured()) {
      try { return await supabaseCatalogApi.subscribe(email); } catch { /* fallback below */ }
    }
    return { success: true, message: 'Thank you for subscribing!' };
  },
};

export const cartApi = {
  get: (coupon) => api.get('/api/cart', { params: { coupon } }),
  addItem: (productId, quantity = 1, coupon) =>
    api.post('/api/cart/items', { productId, quantity, coupon }),
  setQuantity: (productId, quantity, coupon) =>
    api.patch(`/api/cart/items/${productId}`, { quantity, coupon }),
  removeItem: (productId) => api.delete(`/api/cart/items/${productId}`),
  clear: () => api.delete('/api/cart'),
};

export const wishlistApi = {
  list: () => api.get('/api/wishlist'),
  ids: () => api.get('/api/wishlist/ids'),
  add: (productId) => api.post('/api/wishlist', { productId }),
  remove: (productId) => api.delete(`/api/wishlist/${productId}`),
  moveToCart: (productId, payload) => api.post(`/api/wishlist/${productId}/move-to-cart`, payload),
  saveForLater: (productId) => api.post('/api/wishlist/save-for-later', { productId }),
};

export const addressApi = {
  list: () => api.get('/api/addresses'),
  create: (payload) => api.post('/api/addresses', payload),
  update: (id, payload) => api.patch(`/api/addresses/${id}`, payload),
  remove: (id) => api.delete(`/api/addresses/${id}`),
  setDefault: (id) => api.post(`/api/addresses/${id}/default`),
};

export const orderApi = {
  create: async (payload) => {
    if (isSupabaseConfigured()) {
      try { return await supabaseOrderApi.create(payload); } catch { /* fallback below */ }
    }
    return { order: payload };
  },
  list: (params) => api.get('/api/orders', { params }),
  detail: (id) => api.get(`/api/orders/${id}`),
  track: async (orderNumber, phone) => {
    if (isSupabaseConfigured()) {
      try { return await supabaseOrderApi.track(orderNumber, phone); } catch { /* fallback below */ }
    }
    return api.get('/api/orders/track', { params: { orderNumber, phone } });
  },
  cancel: (id, reason) => api.post(`/api/orders/${id}/cancel`, { reason }),
  reorder: (id) => api.post(`/api/orders/${id}/reorder`),
};

export const paymentApi = {
  verify: (payload) => api.post('/api/payments/verify', payload),
  markFailed: (payload) => api.post('/api/payments/failed', payload),
  retry: (orderId) => api.post(`/api/payments/${orderId}/retry`),
};

export const notificationApi = {
  list: () => api.get('/api/notifications'),
  markRead: (ids) => api.post('/api/notifications/read', { ids }),
};

export { ApiError } from './client.js';

