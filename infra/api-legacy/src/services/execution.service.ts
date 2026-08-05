import prisma from '@/utils/prisma';
import { NotFoundError, ForbiddenError } from '@/utils/errors';

export interface ListExecutionsParams {
  organizationId: string;
  userId: string;
  workflowId?: string;
  status?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

export class ExecutionService {
  /**
   * List executions for an organization or workflow
   */
  async listExecutions(params: ListExecutionsParams) {
    const {
      organizationId,
      userId,
      workflowId,
      status,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
    } = params;

    // Verify access
    await this.checkOrganizationAccess(organizationId, userId);

    const where: any = {};

    // Filter by workflow if provided
    if (workflowId) {
      where.workflowId = workflowId;
      // Verify workflow belongs to organization
      const workflow = await prisma.workflow.findFirst({
        where: { id: workflowId, organizationId },
      });
      if (!workflow) {
        throw new NotFoundError('Workflow not found');
      }
    } else {
      // Get all workflows for organization
      const workflows = await prisma.workflow.findMany({
        where: { organizationId },
        select: { id: true },
      });
      where.workflowId = { in: workflows.map((w) => w.id) };
    }

    // Filter by status
    if (status) {
      where.status = status.toUpperCase();
    }

    // Filter by date range
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = startDate;
      if (endDate) where.startedAt.lte = endDate;
    }

    const [executions, total] = await Promise.all([
      prisma.executionLog.findMany({
        where,
        include: {
          workflow: {
            select: { id: true, name: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.executionLog.count({ where }),
    ]);

    return {
      executions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + executions.length < total,
      },
    };
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(
    executionId: string,
    organizationId: string,
    userId: string
  ) {
    await this.checkOrganizationAccess(organizationId, userId);

    const execution = await prisma.executionLog.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          include: {
            organization: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!execution) {
      throw new NotFoundError('Execution not found');
    }

    // Verify execution belongs to organization
    if (execution.workflow.organization.id !== organizationId) {
      throw new ForbiddenError('Access denied to this execution');
    }

    return execution;
  }

  /**
   * Get execution stats for an organization
   */
  async getExecutionStats(
    organizationId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    await this.checkOrganizationAccess(organizationId, userId);

    // Get all workflows for organization
    const workflows = await prisma.workflow.findMany({
      where: { organizationId },
      select: { id: true, name: true },
    });

    const workflowIds = workflows.map((w) => w.id);

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get totals
    const [totals, byStatus, byWorkflow] = await Promise.all([
      prisma.executionLog.count({
        where: {
          workflowId: { in: workflowIds },
          startedAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
      }),
      prisma.executionLog.groupBy({
        by: ['status'],
        where: {
          workflowId: { in: workflowIds },
          startedAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
        _count: true,
      }),
      Promise.all(
        workflows.map(async (workflow) => {
          const stats = await prisma.executionLog.groupBy({
            by: ['status'],
            where: {
              workflowId: workflow.id,
              startedAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            },
            _count: true,
          });
          return {
            workflowId: workflow.id,
            workflowName: workflow.name,
            stats,
          };
        })
      ),
    ]);

    // Format results
    const statusCounts = byStatus.reduce(
      (acc, curr) => {
        acc[curr.status.toLowerCase()] = curr._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const workflowStats = byWorkflow.map((wf) => ({
      id: wf.workflowId,
      name: wf.workflowName,
      total: wf.stats.reduce((sum, s) => sum + s._count, 0),
      success: wf.stats.find((s) => s.status === 'SUCCESS')?._count || 0,
      failed: wf.stats.find((s) => s.status === 'FAILED')?._count || 0,
    }));

    return {
      totals: {
        executions: totals,
        success: statusCounts.success || 0,
        failed: statusCounts.failed || 0,
        pending: statusCounts.pending || 0,
        running: statusCounts.running || 0,
      },
      rates: {
        successRate:
          totals > 0
            ? ((statusCounts.success || 0) / totals) * 100
            : 0,
        failureRate:
          totals > 0
            ? ((statusCounts.failed || 0) / totals) * 100
            : 0,
      },
      byWorkflow: workflowStats,
    };
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(
    executionId: string,
    organizationId: string,
    userId: string
  ) {
    await this.checkOrganizationAccess(organizationId, userId);

    const execution = await prisma.executionLog.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          include: {
            organization: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!execution) {
      throw new NotFoundError('Execution not found');
    }

    if (execution.workflow.organization.id !== organizationId) {
      throw new ForbiddenError('Access denied to this execution');
    }

    if (execution.status !== 'RUNNING' && execution.status !== 'PENDING') {
      throw new ForbiddenError('Can only cancel pending or running executions');
    }

    const updated = await prisma.executionLog.update({
      where: { id: executionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(
    executionId: string,
    organizationId: string,
    userId: string
  ) {
    await this.checkOrganizationAccess(organizationId, userId);

    const originalExecution = await prisma.executionLog.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          include: {
            organization: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!originalExecution) {
      throw new NotFoundError('Execution not found');
    }

    if (originalExecution.workflow.organization.id !== organizationId) {
      throw new ForbiddenError('Access denied to this execution');
    }

    // Create a new execution with the same input
    const newExecution = await prisma.executionLog.create({
      data: {
        workflowId: originalExecution.workflowId,
        userId,
        status: 'PENDING',
        input: originalExecution.input as any,
      },
    });

    // TODO: Add to queue for processing

    return newExecution;
  }

  /**
   * Check if user has access to organization
   */
  private async checkOrganizationAccess(organizationId: string, userId: string) {
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenError('Access denied to this organization');
    }

    return member;
  }
}

export default new ExecutionService();

