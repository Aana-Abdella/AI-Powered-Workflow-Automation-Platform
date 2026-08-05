import { Router } from 'express';
import organizationController from '@/controllers/organization.controller';
import { authenticate } from '@/middleware/auth';
import { requireAdmin } from '@/middleware/rbac';
import { z } from 'zod';
import { validate } from '@/middleware/validation';

const router = Router();

// Validation schemas
const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
  }),
});

const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  }),
});

const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MEMBER']),
  }),
});

// Routes - all require authentication
router.get('/', authenticate, organizationController.list);
router.get('/:id', authenticate, organizationController.getById);
router.post('/', authenticate, validate(createOrganizationSchema), organizationController.create);
router.patch('/:id', authenticate, validate(updateOrganizationSchema), organizationController.update);

// Member management - require admin
router.post('/:id/members', authenticate, requireAdmin, validate(addMemberSchema), organizationController.addMember);
router.delete('/:id/members/:userId', authenticate, requireAdmin, organizationController.removeMember);
router.patch('/:id/members/:userId', authenticate, requireAdmin, validate(updateMemberRoleSchema), organizationController.updateMemberRole);
router.post('/:id/leave', authenticate, organizationController.leave);

export default router;

