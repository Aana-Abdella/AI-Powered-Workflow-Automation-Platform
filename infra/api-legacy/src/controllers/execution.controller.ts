import { Request, Response, NextFunction } from 'express';
import executionService from '@/services/execution.service';
import { z } from 'zod';

const listExecutionsSchema = z.object({
  organizationId: z.string(),
  workflowId: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class ExecutionController {
  /**
   * List executions
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const params = listExecutionsSchema.parse(req.query);

      const result = await executionService.listExecutions({
        ...params,
        userId,
        startDate: params.startDate ? new Date(params.startDate) : undefined,
        endDate: params.endDate ? new Date(params.endDate) : undefined,
      });

      res.json({
        success: true,
        data: result.executions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get execution by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const execution = await executionService.getExecutionById(
        id,
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get execution stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const organizationId = req.query.organizationId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const stats = await executionService.getExecutionStats(
        organizationId,
        userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
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
   * Cancel execution
   */
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const execution = await executionService.cancelExecution(
        id,
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry execution
   */
  async retry(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const execution = await executionService.retryExecution(
        id,
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExecutionController();

