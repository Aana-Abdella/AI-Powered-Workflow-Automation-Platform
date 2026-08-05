import prisma from '@/utils/prisma';
import { NotFoundError, BadRequestError } from '@/utils/errors';

export class AdminService {
  /**
   * Get platform metrics (admin dashboard)
   */
  async getMetrics() {
    const [totalUsers, totalExecutions, activeWorkflows, failedJobs] = await Promise.all([
      prisma.user.count(),
      prisma.executionLog.count(),
      prisma.workflow.count({ where: { isEnabled: true } }),
      prisma.executionLog.count({ where: { status: 'FAILED' } }),
    ]);

    const simulatedRevenue = Number((Math.max(totalExecutions - 1000, 0) * 0.05 + totalUsers * 9.0).toFixed(2));

    return {
      totalUsers,
      totalExecutions,
      activeWorkflows,
      failedJobs,
      simulatedRevenue,
    };
  }
  /**
   * Get all users (paginated)
   */
  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              createdWorkflows: true,
              executionLogs: true,
            },
          },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        organizationMembers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        createdWorkflows: {
          select: {
            id: true,
            name: true,
            isEnabled: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            executionLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user (admin actions)
   */
  async updateUser(userId: string, data: { isActive?: boolean; emailVerified?: boolean }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: data.isActive,
        emailVerified: data.emailVerified,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerified: true,
      },
    });

    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete user (cascades to all related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Get all organizations (paginated)
   */
  async getOrganizations(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              members: true,
              workflows: true,
            },
          },
        },
      }),
      prisma.organization.count(),
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get system logs
   */
  async getSystemLogs(
    page = 1,
    limit = 50,
    type?: 'error' | 'info' | 'warning'
  ) {
    const skip = (page - 1) * limit;

    // Since we don't have a separate logs table in the database,
    // we'll return mock data here. In production, you'd want
    // to implement proper structured logging to a database
    // or use a service like Datadog, Sentry, etc.
    
    return {
      logs: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
      message: 'System logs are available via file system or logging service',
    };
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    // Database health
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'unhealthy';
    }

    // Get execution stats for the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentExecutions = await prisma.executionLog.count({
      where: {
        startedAt: {
          gte: oneHourAgo,
        },
      },
    });

    // Get queue stats (approximate)
    const queuedJobs = 0; // Would require Redis query

    return {
      status: dbStatus === 'healthy' ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      executions: {
        lastHour: recentExecutions,
      },
      queue: {
        status: 'operational',
        queued: queuedJobs,
      },
    };
  }
}

export default new AdminService();
