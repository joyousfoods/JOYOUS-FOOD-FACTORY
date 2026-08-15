import 'dotenv/config';

const required = (key, { allowEmpty = false } = {}) => {
  const value = process.env[key];
  if (!allowEmpty && (value === undefined || value === '')) {
    throw new Error(
      `Missing required environment variable ${key}. Copy server/.env.example to server/.env and fill it in.`
    );
  }
  return value;
};

const int = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) throw new Error(`Environment variable ${key} must be an integer`);
  return parsed;
};

const bool = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: int('PORT', 4000),

  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    get isConfigured() {
      return Boolean(this.keyId && this.keySecret);
    },
    get isWebhookConfigured() {
      return Boolean(this.webhookSecret);
    },
  },

  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessNumber: (process.env.WHATSAPP_BUSINESS_NUMBER || '').replace(/\D/g, ''),
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
    templateLang: process.env.WHATSAPP_TEMPLATE_LANG || 'en',
    get isConfigured() {
      return Boolean(this.accessToken && this.phoneNumberId && this.businessNumber);
    },
  },

  store: {
    deliveryFeePaise: int('DELIVERY_FEE_PAISE', 9000),
    freeDeliveryThresholdPaise: int('FREE_DELIVERY_THRESHOLD_PAISE', 99900),
    codEnabled: bool('COD_ENABLED', true),
    codMaxOrderPaise: int('COD_MAX_ORDER_PAISE', 1000000),
  },

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@joyousfoodfactory.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || '',
  },
};

/**
 * Logged once at boot so an operator can immediately see which
 * integrations are live and which are running in a degraded mode.
 */
export function describeIntegrations() {
  return {
    razorpay: env.razorpay.isConfigured ? 'configured' : 'MISSING CREDENTIALS',
    razorpayWebhook: env.razorpay.isWebhookConfigured ? 'configured' : 'MISSING SECRET',
    whatsapp: env.whatsapp.isConfigured ? 'configured' : 'MISSING CREDENTIALS',
  };
}
