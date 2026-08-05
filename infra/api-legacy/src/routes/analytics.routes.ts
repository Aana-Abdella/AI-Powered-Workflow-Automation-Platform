import { Router } from 'express';
import analyticsController from '@/controllers/analytics.controller';
import { authenticate } from '@/middleware/auth';
import { requireAdmin } from '@/middleware/rbac';

const router = Router();

// All routes require authentication
router.get('/usage', authenticate, analyticsController.getUsage);
router.get('/executions', authenticate, analyticsController.getExecutions);
router.get('/billing', authenticate, analyticsController.getBilling);
router.get('/plans', authenticate, analyticsController.getPlans);

// Admin only routes
router.get('/system', authenticate, requireAdmin, analyticsController.getSystemStats);

export default router;

