import { Request, Response, NextFunction } from 'express';
import adminService from '@/services/admin.service';
import { BadRequestError } from '@/utils/errors';

export class AdminController {
  /**
   * Get all users
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await adminService.getUsers(
        Number(page),
        Number(limit)
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
   * Get user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const user = await adminService.getUserById(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { isActive, emailVerified } = req.body;

      const user = await adminService.updateUser(userId, {
        isActive,
        emailVerified,
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const result = await adminService.deleteUser(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all organizations
   */
  async getOrganizations(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await adminService.getOrganizations(
        Number(page),
        Number(limit)
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
   * Get system logs
   */
  async getSystemLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50, type } = req.query;

      const result = await adminService.getSystemLogs(
        Number(page),
        Number(limit),
        type as 'error' | 'info' | 'warning' | undefined
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
   * Get system health
   */
  async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await adminService.getSystemHealth();

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get platform metrics
   */
  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await adminService.getMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
