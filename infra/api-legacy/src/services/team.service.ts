import prisma from '@/utils/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';

export interface InviteMemberInput {
  email: string;
  role?: 'ADMIN' | 'MEMBER';
}

export class TeamService {
  /**
   * Get all members of an organization
   */
  async getMembers(organizationId: string, userId: string) {
    await this.checkOrganizationAccess(organizationId, userId);

    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            emailVerified: true,
            isActive: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members;
  }

  /**
   * Invite a new member to an organization
   */
  async inviteMember(
    organizationId: string,
    userId: string,
    data: InviteMemberInput
  ) {
    // Check if user is admin
    const currentMember = await this.checkAdminAccess(organizationId, userId);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      // Check if already a member
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId,
          },
        },
      });

      if (existingMember) {
        throw new BadRequestError('User is already a member of this organization');
      }

      // Add existing user as member
      const member = await prisma.organizationMember.create({
        data: {
          userId: existingUser.id,
          organizationId,
          role: data.role || 'MEMBER',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          type: 'TEAM_INVITE',
          title: 'Added to Organization',
          message: `You have been added to ${currentMember.user.firstName}'s organization`,
          userId: existingUser.id,
          organizationId,
        },
      });

      return member;
    }

    // TODO: Send invitation email for non-existent user
    // For now, just return an invitation record
    throw new BadRequestError('User does not exist. Invite via email coming soon.');
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    targetUserId: string,
    role: 'ADMIN' | 'MEMBER'
  ) {
    // Check if user is admin
    await this.checkAdminAccess(organizationId, userId);

    // Cannot change own role
    if (userId === targetUserId) {
      throw new BadRequestError('Cannot change your own role');
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    const updated = await prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Remove a member from organization
   */
  async removeMember(
    organizationId: string,
    userId: string,
    targetUserId: string
  ) {
    // Check if user is admin
    await this.checkAdminAccess(organizationId, userId);

    // Cannot remove self
    if (userId === targetUserId) {
      throw new BadRequestError('Cannot remove yourself. Use leave organization instead.');
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId,
        },
      },
    });

    return { message: 'Member removed successfully' };
  }

  /**
   * Leave an organization
   */
  async leaveOrganization(organizationId: string, userId: string) {
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('You are not a member of this organization');
    }

    // Check if user is the only admin
    if (member.role === 'ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: 'ADMIN',
        },
      });

      if (adminCount === 1) {
        throw new BadRequestError(
          'You are the only admin. Transfer ownership or delete the organization first.'
        );
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

    return { message: 'Left organization successfully' };
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(organizationId: string, userId: string) {
    await this.checkAdminAccess(organizationId, userId);

    // TODO: Implement invitations table if needed
    return [];
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

  /**
   * Check if user is admin
   */
  private async checkAdminAccess(organizationId: string, userId: string) {
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

    if (member.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can perform this action');
    }

    return member;
  }
}

export default new TeamService();

