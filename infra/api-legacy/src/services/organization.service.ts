import prisma from '@/utils/prisma';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '@/utils/errors';

export class OrganizationService {
  /**
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string, userId: string) {
    // Check if user has access
    await this.checkOrganizationAccess(organizationId, userId);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
                isActive: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            workflows: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return organization;
  }

  /**
   * Get all organizations for a user
   */
  async getUserOrganizations(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                workflows: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Create new organization
   */
  async createOrganization(data: { name: string; description?: string }, userId: string) {
    // Check if slug is available
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictError('Organization with this name already exists');
    }

    // Create organization and add user as admin
    const organization = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: data.name,
          slug: `${slug}-${Date.now()}`,
          description: data.description,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: newOrg.id,
          role: 'ADMIN',
        },
      });

      return newOrg;
    });

    return organization;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    userId: string,
    data: { name?: string; description?: string; isActive?: boolean }
  ) {
    // Check if user is admin
    await this.checkOrganizationAdmin(organizationId, userId);

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    });

    return organization;
  }

  /**
   * Add member to organization
   */
  async addMember(organizationId: string, userId: string, email: string, role: 'ADMIN' | 'MEMBER') {
    // Check if user is admin
    await this.checkOrganizationAdmin(organizationId, userId);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found with this email');
    }

    // Check if already a member
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this organization');
    }

    // Add member
    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId,
        role,
      },
    });

    return { message: 'Member added successfully', userId: user.id };
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string, memberId: string) {
    // Check if user is admin
    await this.checkOrganizationAdmin(organizationId, userId);

    // Cannot remove yourself
    if (memberId === userId) {
      throw new BadRequestError('Cannot remove yourself from the organization');
    }

    // Check if member exists
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    // Remove member
    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId,
        },
      },
    });

    return { message: 'Member removed successfully' };
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER'
  ) {
    // Check if user is admin
    await this.checkOrganizationAdmin(organizationId, userId);

    // Cannot change your own role
    if (memberId === userId) {
      throw new BadRequestError('Cannot change your own role');
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    await prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId,
        },
      },
      data: { role },
    });

    return { message: 'Role updated successfully' };
  }

  /**
   * Leave organization
   */
  async leaveOrganization(organizationId: string, userId: string) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('You are not a member of this organization');
    }

    // Check if user is the only admin
    if (membership.role === 'ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: 'ADMIN',
        },
      });

      if (adminCount === 1) {
        throw new BadRequestError('Cannot leave organization as the only admin. Transfer admin role first.');
      }
    }

    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return { message: 'Successfully left organization' };
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
  }

  /**
   * Check if user is admin of organization
   */
  private async checkOrganizationAdmin(organizationId: string, userId: string) {
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required');
    }
  }
}

export default new OrganizationService();

