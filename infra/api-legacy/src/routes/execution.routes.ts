import { Router } from 'express';
import executionController from '@/controllers/execution.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Execution routes
router.get('/', executionController.list);
router.get('/stats', executionController.getStats);
router.get('/:id', executionController.getById);
router.post('/:id/cancel', executionController.cancel);
router.post('/:id/retry', executionController.retry);

export default router;

