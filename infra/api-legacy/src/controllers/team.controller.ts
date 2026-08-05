import { Request, Response, NextFunction } from 'express';
import teamService from '@/services/team.service';
import { z } from 'zod';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export class TeamController {
  /**
   * Get all members
   */
  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const members = await teamService.getMembers(organizationId, userId);

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invite a member
   */
  async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const data = inviteMemberSchema.parse(req.body);
      const member = await teamService.inviteMember(organizationId, userId, data);

      res.status(201).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { userId: targetUserId } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const data = updateRoleSchema.parse(req.body);
      const member = await teamService.updateMemberRole(
        organizationId,
        userId,
        targetUserId,
        data.role
      );

      res.json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a member
   */
  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { userId: targetUserId } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const result = await teamService.removeMember(
        organizationId,
        userId,
        targetUserId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Leave organization
   */
  async leaveOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const result = await teamService.leaveOrganization(organizationId, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TeamController();

