import { Router } from 'express';
import apiKeyController from '@/controllers/api-key.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// API Keys CRUD
router.post('/', apiKeyController.create);
router.get('/', apiKeyController.list);
router.get('/:id', apiKeyController.getById);
router.post('/:id/revoke', apiKeyController.revoke);
router.post('/:id/regenerate', apiKeyController.regenerate);
router.delete('/:id', apiKeyController.delete);

export default router;

