import { createApp } from './app.js';
import { env, describeIntegrations } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { logger } from './utils/logger.js';

async function start() {
  try {
    await prisma.$connect();
    logger.info('boot', 'Database connected');
  } catch (err) {
    logger.error(
      'boot',
      'Could not connect to the database. Check DATABASE_URL in server/.env and that Postgres is reachable.',
      err.message
    );
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.port, () => {
    const integrations = describeIntegrations();
    logger.info('boot', `API listening on http://localhost:${env.port}`);
    logger.info('boot', `Allowed origins: ${env.clientOrigins.join(', ')}`);
    logger.info('boot', `Integrations: ${JSON.stringify(integrations)}`);

    // Loud, specific warnings beat a silently degraded checkout.
    if (integrations.razorpay !== 'configured') {
      logger.warn('boot', 'Razorpay is NOT configured — online payment will return 503. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }
    if (integrations.razorpayWebhook !== 'configured') {
      logger.warn('boot', 'RAZORPAY_WEBHOOK_SECRET is missing — the /api/payments/webhook endpoint will reject all deliveries.');
    }
    if (integrations.whatsapp !== 'configured') {
      logger.warn('boot', 'WhatsApp is NOT configured — order alerts will be logged with status SKIPPED instead of sent.');
    }
  });

  const shutdown = async (signal) => {
    logger.info('shutdown', `${signal} received, closing`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Don't hang forever on a stuck connection.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
