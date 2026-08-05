import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment variable validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  FRONTEND_URL: z.string().url(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  WEBHOOK_SECRET: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ADMIN_SEED_EMAIL: z.string().email().default('admin@flowforge.local'),
  ADMIN_SEED_PASSWORD: z.string().min(8).default('Admin@12345'),
  ADMIN_SEED_ORG_NAME: z.string().default('Platform Admin'),
  ADMIN_SEED_FIRST_NAME: z.string().default('Platform'),
  ADMIN_SEED_LAST_NAME: z.string().default('Admin'),
});

// Validate and parse environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

const env = parseEnv();

export const config = {
  // Server
  env: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },

  // OpenAI
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },

  // CORS
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Webhook
  webhook: {
    secret: env.WEBHOOK_SECRET || 'default-webhook-secret',
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
  },

  // Frontend
  frontend: {
    url: env.FRONTEND_URL,
  },

  // Admin seed
  adminSeed: {
    email: env.ADMIN_SEED_EMAIL,
    password: env.ADMIN_SEED_PASSWORD,
    organizationName: env.ADMIN_SEED_ORG_NAME,
    firstName: env.ADMIN_SEED_FIRST_NAME,
    lastName: env.ADMIN_SEED_LAST_NAME,
  },
} as const;

export default config;
