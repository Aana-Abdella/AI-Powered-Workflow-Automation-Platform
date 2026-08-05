import { Request, Response, NextFunction } from 'express';
import workflowService from '@/services/workflow.service';
import { enqueueWorkflowExecution } from '@/queues/workflow.queue';
import prisma from '@/utils/prisma';
import { BadRequestError } from '@/utils/errors';
import crypto from 'crypto';

const isValidSignature = (providedSignature: string, computedSignature: string) => {
  try {
    const normalizedProvided = providedSignature.replace(/^sha256=/, '');
    const a = Buffer.from(normalizedProvided, 'hex');
    const b = Buffer.from(computedSignature, 'hex');
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

export class WorkflowController {
  /**
   * Create workflow
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, trigger, actions, organizationId } = req.body;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const workflow = await workflowService.createWorkflow({
        name,
        description,
        trigger,
        actions,
        organizationId,
        userId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workflow by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const workflow = await workflowService.getWorkflowById(
        id,
        req.user.userId
      );

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List workflows
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.query;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      if (!organizationId) {
        throw new BadRequestError('Organization ID required');
      }

      const workflows = await workflowService.listWorkflows(
        organizationId as string,
        req.user.userId
      );

      res.json({
        success: true,
        data: workflows,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update workflow
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, trigger, actions } = req.body;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const workflow = await workflowService.updateWorkflow(
        id,
        req.user.userId,
        { name, description, trigger, actions }
      );

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete workflow
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await workflowService.deleteWorkflow(id, req.user.userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enable workflow
   */
  async enable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const workflow = await workflowService.toggleWorkflow(
        id,
        req.user.userId,
        true
      );

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable workflow
   */
  async disable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const workflow = await workflowService.toggleWorkflow(
        id,
        req.user.userId,
        false
      );

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger workflow via webhook
   */
  async triggerWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const input = req.body;
      const providedSignature = req.header('x-flowforge-signature');

      // Get workflow by webhook token
      const workflow = await workflowService.getWorkflowByWebhookToken(token);
      const payload = JSON.stringify(input ?? {});
      const computedSignature = crypto
        .createHmac('sha256', workflow.webhookToken || token)
        .update(payload)
        .digest('hex');

      if (!providedSignature || !isValidSignature(providedSignature, computedSignature)) {
        throw new BadRequestError('Invalid webhook signature');
      }

      const webhookEvent = await prisma.webhookEvent.create({
        data: {
          workflowId: workflow.id,
          eventType: req.header('x-event-type') || 'webhook.event',
          payload: input,
          headers: req.headers as unknown as Record<string, unknown>,
          signature: providedSignature,
          signatureValid: true,
          processed: false,
        },
      });

      // Create execution log
      const execution = await prisma.executionLog.create({
        data: {
          workflowId: workflow.id,
          userId: workflow.createdById,
          status: 'PENDING',
          input,
        },
      });

      // Enqueue workflow execution
      await enqueueWorkflowExecution({
        workflowId: workflow.id,
        executionId: execution.id,
        userId: workflow.createdById,
        organizationId: workflow.organizationId,
        trigger: workflow.trigger,
        actions: workflow.actions as any[],
        input,
      });

      res.json({
        success: true,
        data: {
          webhookEventId: webhookEvent.id,
          executionId: execution.id,
          status: 'queued',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workflow executions
   */
  async getExecutions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      // Verify access
      await workflowService.getWorkflowById(id, req.user.userId);

      const executions = await prisma.executionLog.findMany({
        where: { workflowId: id },
        orderBy: { startedAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await prisma.executionLog.count({
        where: { workflowId: id },
      });

      res.json({
        success: true,
        data: {
          executions,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WorkflowController();
