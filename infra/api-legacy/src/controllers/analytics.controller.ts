import { Request, Response, NextFunction } from 'express';
import analyticsService from '@/services/analytics.service';
import { BadRequestError } from '@/utils/errors';

export class AnalyticsController {
  /**
   * Get usage statistics
   */
  async getUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.query;
      const { startDate, endDate } = req.query;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      if (!organizationId) {
        throw new BadRequestError('Organization ID required');
      }

      const stats = await analyticsService.getUsageStats(
        organizationId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutions(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.query;
      const { startDate, endDate } = req.query;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      if (!organizationId) {
        throw new BadRequestError('Organization ID required');
      }

      const stats = await analyticsService.getExecutionStats(
        organizationId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get billing information
   */
  async getBilling(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.query;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      if (!organizationId) {
        throw new BadRequestError('Organization ID required');
      }

      const billing = await analyticsService.getBillingInfo(organizationId as string);

      res.json({
        success: true,
        data: billing,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available plans
   */
  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = analyticsService.getPlans();

      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system-wide statistics (admin only)
   */
  async getSystemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getSystemStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();

