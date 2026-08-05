import Redis from 'ioredis';
import config from '@/config';
import logger from './logger';

// Create Redis client
const redis = new Redis(config.redis.url, {
  // BullMQ requires blocking clients to use null retries.
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    logger.error('Redis reconnect on error:', err);
    return true;
  },
});

// Event handlers
redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis error:', err);
});

redis.on('close', () => {
  logger.warn('⚠️  Redis connection closed');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
});

export default redis;
