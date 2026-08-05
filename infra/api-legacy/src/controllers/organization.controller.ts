import { Request, Response, NextFunction } from 'express';
import organizationService from '@/services/organization.service';
import { BadRequestError } from '@/utils/errors';

export class OrganizationController {
  /**
   * Get user's organizations
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const organizations = await organizationService.getUserOrganizations(req.user.userId);

      res.json({
        success: true,
        data: organizations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organization by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const organization = await organizationService.getOrganizationById(
        id,
        req.user.userId
      );

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new organization
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const organization = await organizationService.createOrganization(
        { name, description },
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update organization
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const organization = await organizationService.updateOrganization(
        id,
        req.user.userId,
        { name, description, isActive }
      );

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add member to organization
   */
  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { email, role } = req.body;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await organizationService.addMember(
        id,
        req.user.userId,
        email,
        role || 'MEMBER'
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId: memberId } = req.params;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await organizationService.removeMember(
        id,
        req.user.userId,
        memberId
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
   * Update member role
   */
  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId: memberId } = req.params;
      const { role } = req.body;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await organizationService.updateMemberRole(
        id,
        req.user.userId,
        memberId,
        role
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
  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await organizationService.leaveOrganization(
        id,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrganizationController();

