import { supabase } from '../lib/supabase';
import { PRODUCTS, CATEGORIES } from '../data/products';

export const supabaseAuthApi = {
  async register({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').upsert([
        { id: data.user.id, name, email },
      ]);
    }
    return { user: { id: data.user?.id, email, name } };
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const name = data.user?.user_metadata?.name || email.split('@')[0];
    return { user: { id: data.user?.id, email: data.user?.email, name } };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const name = profile?.name || user.user_metadata?.name || user.email.split('@')[0];
    return {
      user: {
        id: user.id,
        email: user.email,
        name,
        phone: profile?.phone || '',
      },
    };
  },

  async updateProfile(payload) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .upsert([{ id: user.id, email: user.email, ...payload }])
      .select()
      .single();

    if (error) throw error;
    return { user: { id: user.id, email: user.email, name: data.name, phone: data.phone } };
  },
};

// Helper to map DB row to product model
function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    category: row.category,
    mrp: Number(row.mrp),
    price: Number(row.price),
    image: row.image,
    images: row.images || [],
    packLabel: row.pack_label,
    pieces: row.pieces,
    badge: row.badge,
    freeShipping: row.free_shipping,
    isFeatured: row.is_featured,
    isBestSeller: row.is_bestseller,
    isNewArrival: row.is_new_arrival,
    flavour: row.flavour,
    shelfLife: row.shelf_life,
    storage: row.storage,
  };
}

export const supabaseProductApi = {
  async list(params = {}) {
    let query = supabase.from('products').select('*');

    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    if (params.featured) {
      query = query.eq('is_featured', true);
    }
    if (params.bestSeller) {
      query = query.eq('is_bestseller', true);
    }
    if (params.newArrival) {
      query = query.eq('is_new_arrival', true);
    }
    if (params.q) {
      query = query.ilike('name', `%${params.q}%`);
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { items: (data || []).map(mapProduct) };
  },

  async detail(slug) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error || !data) return PRODUCTS.find((p) => p.slug === slug) || null;
    return mapProduct(data);
  },

  async byIds(ids = []) {
    if (!ids.length) return { items: [] };
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', ids);
    if (error) return { items: PRODUCTS.filter((p) => ids.includes(p.id)) };
    return { items: (data || []).map(mapProduct) };
  },
};

export const supabaseCatalogApi = {
  async categories() {
    const { data, error } = await supabase.from('categories').select('*');
    if (error || !data || data.length === 0) {
      return {
        items: CATEGORIES.map((c) => ({
          id: c.id,
          slug: c.id,
          name: c.label,
          imageUrl: '/3/B (169) copy.jpg',
          productCount: 4,
        })),
      };
    }
    return {
      items: data.map((c) => ({
        id: c.id,
        slug: c.slug || c.id,
        name: c.name,
        imageUrl: c.image_url,
        productCount: c.product_count,
      })),
    };
  },

  async subscribe(email) {
    const { data, error } = await supabase
      .from('subscribers')
      .insert([{ email }])
      .select()
      .single();
    if (error && error.code !== '23505') throw error;
    return { success: true, message: 'Thank you for subscribing!' };
  },

  async coupons() {
    const { data, error } = await supabase.from('coupons').select('*').eq('is_active', true);
    if (error || !data) {
      return {
        items: [
          { id: '1', code: 'WELCOME10', description: '10% off your first order', minOrderPaise: 50000 },
          { id: '2', code: 'FREESHIP999', description: 'Free shipping above ₹999', minOrderPaise: 99900 },
        ],
      };
    }
    return {
      items: data.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        minOrderPaise: (c.min_order_price || 0) * 100,
        maxDiscountPaise: c.max_discount ? c.max_discount * 100 : null,
      })),
    };
  },
};

export const supabaseOrderApi = {
  async create(payload) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          order_number: payload.orderNumber || `JFF-${Date.now()}`,
          user_id: user?.id || null,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          line1: payload.line1,
          line2: payload.line2,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          note: payload.note,
          subtotal: payload.subtotal,
          delivery: payload.delivery || 0,
          total: payload.total,
          order_status: 'CONFIRMED',
          payment_status: 'COD',
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;
    return { order: orderData };
  },

  async track(orderNumber, phone) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('phone', phone)
      .single();

    if (error || !data) {
      throw new Error('No matching order found for this order number and phone.');
    }
    return { order: data };
  },
};

