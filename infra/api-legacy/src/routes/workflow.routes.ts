import { Router } from 'express';
import workflowController from '@/controllers/workflow.controller';
import { authenticate } from '@/middleware/auth';
import { requireMember } from '@/middleware/rbac';
import { webhookLimiter } from '@/middleware/rateLimit';
import { z } from 'zod';
import { validate } from '@/middleware/validation';

const router = Router();

// Validation schemas
const createWorkflowSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    trigger: z.object({
      type: z.enum(['webhook', 'timer', 'event']),
      config: z.record(z.any()),
    }),
    actions: z.array(
      z.object({
        type: z.enum(['http', 'ai', 'database']),
        config: z.record(z.any()),
      })
    ).min(1),
    organizationId: z.string(),
  }),
});

const updateWorkflowSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    trigger: z.object({
      type: z.enum(['webhook', 'timer', 'event']),
      config: z.record(z.any()),
    }).optional(),
    actions: z.array(
      z.object({
        type: z.enum(['http', 'ai', 'database']),
        config: z.record(z.any()),
      })
    ).optional(),
  }),
});

// Routes
router.post('/', authenticate, validate(createWorkflowSchema), workflowController.create);
router.get('/', authenticate, workflowController.list);
router.get('/:id', authenticate, workflowController.getById);
router.patch('/:id', authenticate, validate(updateWorkflowSchema), workflowController.update);
router.delete('/:id', authenticate, workflowController.delete);
router.post('/:id/enable', authenticate, workflowController.enable);
router.post('/:id/disable', authenticate, workflowController.disable);
router.get('/:id/executions', authenticate, workflowController.getExecutions);

// Webhook endpoint (no authentication required, uses token)
router.post('/webhook/:token', webhookLimiter, workflowController.triggerWebhook);

export default router;
