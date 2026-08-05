import prisma from '@/utils/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import crypto from 'crypto';
import config from '@/config';

export interface WorkflowTrigger {
  type: 'webhook' | 'timer' | 'event';
  config: Record<string, any>;
}

export interface WorkflowAction {
  type: 'http' | 'ai' | 'database';
  config: Record<string, any>;
}

export class WorkflowService {
  /**
   * Create workflow
   */
  async createWorkflow(data: {
    name: string;
    description?: string;
    trigger: WorkflowTrigger;
    actions: WorkflowAction[];
    organizationId: string;
    userId: string;
  }) {
    // Validate trigger and actions
    this.validateWorkflowDefinition(data.trigger, data.actions);

    // Generate webhook URL if trigger is webhook
    let webhookUrl: string | undefined;
    let webhookToken: string | undefined;

    if (data.trigger.type === 'webhook') {
      webhookToken = crypto.randomBytes(32).toString('hex');
      webhookUrl = `${config.frontend.url}/webhook/${webhookToken}`;
    }

    const workflow = await prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger as any,
        actions: data.actions as any,
        webhookUrl,
        webhookToken,
        organizationId: data.organizationId,
        createdById: data.userId,
      },
    });

    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(workflowId: string, userId: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        organization: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundError('Workflow not found');
    }

    // Check if user has access
    await this.checkWorkflowAccess(workflow.organizationId, userId);

    return workflow;
  }

  /**
   * List workflows for organization
   */
  async listWorkflows(organizationId: string, userId: string) {
    // Check if user has access
    await this.checkWorkflowAccess(organizationId, userId);

    const workflows = await prisma.workflow.findMany({
      where: { organizationId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return workflows;
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    workflowId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      trigger?: WorkflowTrigger;
      actions?: WorkflowAction[];
    }
  ) {
    const workflow = await this.getWorkflowById(workflowId, userId);

    // Validate if provided
    if (data.trigger || data.actions) {
      this.validateWorkflowDefinition(
        data.trigger || (workflow.trigger as WorkflowTrigger),
        data.actions || (workflow.actions as WorkflowAction[])
      );
    }

    const updated = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger as any,
        actions: data.actions as any,
        version: { increment: 1 },
      },
    });

    return updated;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId: string, userId: string) {
    await this.getWorkflowById(workflowId, userId);

    await prisma.workflow.delete({
      where: { id: workflowId },
    });

    return { message: 'Workflow deleted successfully' };
  }

  /**
   * Enable/Disable workflow
   */
  async toggleWorkflow(workflowId: string, userId: string, isEnabled: boolean) {
    await this.getWorkflowById(workflowId, userId);

    const workflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: { isEnabled },
    });

    return workflow;
  }

  /**
   * Get workflow by webhook token
   */
  async getWorkflowByWebhookToken(token: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { webhookToken: token },
      include: { organization: true },
    });

    if (!workflow) {
      throw new NotFoundError('Workflow not found');
    }

    if (!workflow.isEnabled) {
      throw new BadRequestError('Workflow is disabled');
    }

    return workflow;
  }

  /**
   * Validate workflow definition
   */
  private validateWorkflowDefinition(
    trigger: WorkflowTrigger,
    actions: WorkflowAction[]
  ) {
    // Validate trigger
    if (!['webhook', 'timer', 'event'].includes(trigger.type)) {
      throw new BadRequestError('Invalid trigger type');
    }

    // Validate actions
    if (!actions || actions.length === 0) {
      throw new BadRequestError('At least one action is required');
    }

    for (const action of actions) {
      if (!['http', 'ai', 'database'].includes(action.type)) {
        throw new BadRequestError(`Invalid action type: ${action.type}`);
      }
    }
  }

  /**
   * Check if user has access to workflow's organization
   */
  private async checkWorkflowAccess(organizationId: string, userId: string) {
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenError('Access denied to this workflow');
    }
  }
}

export default new WorkflowService();
