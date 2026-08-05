import { Router } from 'express';
import adminController from '@/controllers/admin.controller';
import { authenticate } from '@/middleware/auth';
import { requirePlatformAdmin } from '@/middleware/rbac';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requirePlatformAdmin);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserById);
router.patch('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// Organization management
router.get('/organizations', adminController.getOrganizations);

// System
router.get('/logs', adminController.getSystemLogs);
router.get('/health', adminController.getSystemHealth);
router.get('/metrics', adminController.getMetrics);

export default router;
