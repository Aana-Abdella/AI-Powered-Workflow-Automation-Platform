import { Router } from 'express';
import authRoutes from './auth.routes';
import workflowRoutes from './workflow.routes';
import organizationRoutes from './organization.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import apiKeyRoutes from './api-key.routes';
import executionRoutes from './execution.routes';
import teamRoutes from './team.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/workflows', workflowRoutes);
router.use('/organizations', organizationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/executions', executionRoutes);
router.use('/team', teamRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'FlowForge API is running',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/live', (_req, res) => {
  res.status(200).json({ success: true, status: 'live' });
});

router.get('/health/ready', async (_req, res) => {
  try {
    const prisma = (await import('@/utils/prisma')).default;
    const redis = (await import('@/utils/redis')).default;
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.status(200).json({ success: true, status: 'ready' });
  } catch {
    res.status(503).json({ success: false, status: 'not_ready' });
  }
});

export default router;
