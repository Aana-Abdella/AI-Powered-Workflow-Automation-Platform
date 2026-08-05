import { Router } from 'express';
import teamController from '@/controllers/team.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Team/Member routes
router.get('/members', teamController.getMembers);
router.post('/members', teamController.inviteMember);
router.patch('/members/:userId', teamController.updateMemberRole);
router.delete('/members/:userId', teamController.removeMember);
router.post('/leave', teamController.leaveOrganization);

export default router;

