import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config';
import logger from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { seedAdminIfMissing } from './services/adminSeed.service';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api', apiLimiter);

// Container health endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'flowforge-api',
    timestamp: new Date().toISOString(),
  });
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const prisma = (await import('./utils/prisma')).default;
    await prisma.$connect();
    logger.info('✅ Database connected');

    await seedAdminIfMissing();

    // Test Redis connection
    const redis = (await import('./utils/redis')).default;
    await redis.ping();
    logger.info('✅ Redis connected');

    // Start listening
    app.listen(config.port, () => {
      logger.info(`🚀 FlowForge API Server started`);
      logger.info(`📡 Listening on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔗 API URL: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('⏳ SIGTERM received, shutting down gracefully...');
  
  const prisma = (await import('./utils/prisma')).default;
  await prisma.$disconnect();
  
  const redis = (await import('./utils/redis')).default;
  await redis.quit();
  
  logger.info('✅ Server shut down successfully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('⏳ SIGINT received, shutting down gracefully...');
  
  const prisma = (await import('./utils/prisma')).default;
  await prisma.$disconnect();
  
  const redis = (await import('./utils/redis')).default;
  await redis.quit();
  
  logger.info('✅ Server shut down successfully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
