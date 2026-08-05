import prisma from '@/utils/prisma';

export interface UsageData {
  date: string;
  apiCalls: number;
  workflowRuns: number;
  aiTokensUsed: number;
  estimatedCost: number;
}

export interface BillingInfo {
  currentPlan: 'free' | 'pro' | 'enterprise';
  usage: {
    apiCalls: number;
    workflowRuns: number;
    aiTokens: number;
    storage: number; // in MB
  };
  limits: {
    apiCalls: number;
    workflowRuns: number;
    aiTokens: number;
    storage: number;
    members: number;
  };
  estimatedBill: number;
}

// Plan definitions
const PLANS = {
  free: {
    name: 'Free',
    apiCalls: 1000,
    workflowRuns: 100,
    aiTokens: 10000,
    storage: 100,
    members: 2,
    price: 0,
  },
  pro: {
    name: 'Pro',
    apiCalls: 10000,
    workflowRuns: 1000,
    aiTokens: 100000,
    storage: 1000,
    members: 10,
    price: 29,
  },
  enterprise: {
    name: 'Enterprise',
    apiCalls: 100000,
    workflowRuns: 10000,
    aiTokens: 1000000,
    storage: 10000,
    members: -1, // unlimited
    price: 99,
  },
};

export class AnalyticsService {
  /**
   * Get usage statistics for organization
   */
  async getUsageStats(organizationId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)); // Default: last 30 days
    const end = endDate || new Date();

    const metrics = await prisma.usageMetric.findMany({
      where: {
        organizationId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Aggregate totals
    const totals = metrics.reduce(
      (acc, metric) => ({
        apiCalls: acc.apiCalls + metric.apiCalls,
        workflowRuns: acc.workflowRuns + metric.workflowRuns,
        aiTokensUsed: acc.aiTokensUsed + metric.aiTokensUsed,
        estimatedCost: acc.estimatedCost + metric.estimatedCost,
      }),
      { apiCalls: 0, workflowRuns: 0, aiTokensUsed: 0, estimatedCost: 0 }
    );

    // Calculate daily averages
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const averages = {
      apiCalls: Math.round(totals.apiCalls / days),
      workflowRuns: Math.round(totals.workflowRuns / days),
      aiTokensUsed: Math.round(totals.aiTokensUsed / days),
      estimatedCost: Number((totals.estimatedCost / days).toFixed(4)),
    };

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        days,
      },
      totals,
      averages,
      daily: metrics.map((m) => ({
        date: m.date.toISOString().split('T')[0],
        apiCalls: m.apiCalls,
        workflowRuns: m.workflowRuns,
        aiTokensUsed: m.aiTokensUsed,
        estimatedCost: m.estimatedCost,
      })),
    };
  }

  /**
   * Get workflow execution statistics
   */
  async getExecutionStats(organizationId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    // Get workflows for organization
    const workflows = await prisma.workflow.findMany({
      where: { organizationId },
      select: { id: true, name: true },
    });

    const workflowIds = workflows.map((w) => w.id);

    // Get execution stats grouped by workflow
    const executions = await prisma.executionLog.groupBy({
      by: ['workflowId', 'status'],
      where: {
        workflowId: { in: workflowIds },
        startedAt: {
          gte: start,
          lte: end,
        },
      },
      _count: true,
    });

    // Get total executions
    const totalExecutions = await prisma.executionLog.count({
      where: {
        workflowId: { in: workflowIds },
        startedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Calculate success/failure rates
    const statusCounts = executions.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + e._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const successRate = totalExecutions > 0 
      ? ((statusCounts['SUCCESS'] || 0) / totalExecutions) * 100 
      : 0;
    
    const failureRate = totalExecutions > 0 
      ? ((statusCounts['FAILED'] || 0) / totalExecutions) * 100 
      : 0;

    // Get recent executions
    const recentExecutions = await prisma.executionLog.findMany({
      where: {
        workflowId: { in: workflowIds },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: {
        workflow: {
          select: { name: true },
        },
      },
    });

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totals: {
        executions: totalExecutions,
        success: statusCounts['SUCCESS'] || 0,
        failed: statusCounts['FAILED'] || 0,
        pending: statusCounts['PENDING'] || 0,
        running: statusCounts['RUNNING'] || 0,
      },
      rates: {
        successRate: Number(successRate.toFixed(2)),
        failureRate: Number(failureRate.toFixed(2)),
      },
      byWorkflow: workflows.map((w) => {
        const workflowExecs = executions.filter((e) => e.workflowId === w.id);
        const workflowTotal = workflowExecs.reduce((sum, e) => sum + e._count, 0);
        return {
          id: w.id,
          name: w.name,
          total: workflowTotal,
          success: workflowExecs.find((e) => e.status === 'SUCCESS')?._count || 0,
          failed: workflowExecs.find((e) => e.status === 'FAILED')?._count || 0,
        };
      }),
      recent: recentExecutions.map((e) => ({
        id: e.id,
        workflowName: e.workflow.name,
        status: e.status,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        duration: e.duration,
        error: e.error,
      })),
    };
  }

  /**
   * Get billing information for organization
   */
  async getBillingInfo(organizationId: string): Promise<BillingInfo> {
    // Get current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const metrics = await prisma.usageMetric.findMany({
      where: {
        organizationId,
        date: {
          gte: startOfMonth,
        },
      },
    });

    const usage = metrics.reduce(
      (acc, m) => ({
        apiCalls: acc.apiCalls + m.apiCalls,
        workflowRuns: acc.workflowRuns + m.workflowRuns,
        aiTokens: acc.aiTokens + m.aiTokensUsed,
        estimatedCost: acc.estimatedCost + m.estimatedCost,
      }),
      { apiCalls: 0, workflowRuns: 0, aiTokens: 0, estimatedCost: 0 }
    );

    // Determine plan based on usage (simplified logic)
    let currentPlan: 'free' | 'pro' | 'enterprise' = 'free';
    if (usage.workflowRuns > PLANS.free.workflowRuns || usage.aiTokens > PLANS.free.aiTokens) {
      currentPlan = 'pro';
    }
    if (usage.workflowRuns > PLANS.pro.workflowRuns || usage.aiTokens > PLANS.pro.aiTokens) {
      currentPlan = 'enterprise';
    }

    const plan = PLANS[currentPlan];

    // Calculate estimated bill (overage charges)
    let estimatedBill = plan.price;
    if (currentPlan === 'free') {
      // Calculate overage
      const apiCallsOver = Math.max(0, usage.apiCalls - PLANS.free.apiCalls);
      const workflowRunsOver = Math.max(0, usage.workflowRuns - PLANS.free.workflowRuns);
      const aiTokensOver = Math.max(0, usage.aiTokens - PLANS.free.aiTokens);

      estimatedBill = (apiCallsOver * 0.001) + (workflowRunsOver * 0.01) + (aiTokensOver * 0.0001);
    }

    return {
      currentPlan,
      usage: {
        apiCalls: usage.apiCalls,
        workflowRuns: usage.workflowRuns,
        aiTokens: usage.aiTokens,
        storage: 0, // Not implemented yet
      },
      limits: {
        apiCalls: plan.apiCalls,
        workflowRuns: plan.workflowRuns,
        aiTokens: plan.aiTokens,
        storage: plan.storage,
        members: plan.members,
      },
      estimatedBill: Number(estimatedBill.toFixed(2)),
    };
  }

  /**
   * Get available plans
   */
  getPlans() {
    return Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.price,
      limits: {
        apiCalls: plan.apiCalls,
        workflowRuns: plan.workflowRuns,
        aiTokens: plan.aiTokens,
        storage: plan.storage,
        members: plan.members,
      },
    }));
  }

  /**
   * Get system-wide analytics (admin only)
   */
  async getSystemStats() {
    const totalUsers = await prisma.user.count();
    const totalOrganizations = await prisma.organization.count();
    const totalWorkflows = await prisma.workflow.count();
    const totalExecutions = await prisma.executionLog.count();

    // Get executions by status
    const statusCounts = await prisma.executionLog.groupBy({
      by: ['status'],
      _count: true,
    });

    const executionsByStatus = statusCounts.reduce(
      (acc, s) => {
        acc[s.status] = s._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get total AI usage
    const aiUsage = await prisma.executionLog.aggregate({
      _sum: {
        aiTokensUsed: true,
        aiCost: true,
      },
    });

    // Get usage metrics for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMetrics = await prisma.usageMetric.aggregate({
      where: {
        date: {
          gte: today,
        },
      },
      _sum: {
        apiCalls: true,
        workflowRuns: true,
        aiTokensUsed: true,
        estimatedCost: true,
      },
    });

    return {
      users: totalUsers,
      organizations: totalOrganizations,
      workflows: totalWorkflows,
      executions: {
        total: totalExecutions,
        success: executionsByStatus['SUCCESS'] || 0,
        failed: executionsByStatus['FAILED'] || 0,
        pending: executionsByStatus['PENDING'] || 0,
        running: executionsByStatus['RUNNING'] || 0,
      },
      aiUsage: {
        totalTokens: aiUsage._sum.aiTokensUsed || 0,
        totalCost: aiUsage._sum.aiCost || 0,
      },
      today: {
        apiCalls: todayMetrics._sum.apiCalls || 0,
        workflowRuns: todayMetrics._sum.workflowRuns || 0,
        aiTokens: todayMetrics._sum.aiTokensUsed || 0,
        estimatedCost: todayMetrics._sum.estimatedCost || 0,
      },
    };
  }
}

export default new AnalyticsService();

