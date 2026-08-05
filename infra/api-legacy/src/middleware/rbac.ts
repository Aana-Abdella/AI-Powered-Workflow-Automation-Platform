import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, BadRequestError } from '@/utils/errors';
import prisma from '@/utils/prisma';
import { Role } from '@prisma/client';
import config from '@/config';

/**
 * Check if user has required role in organization
 */
export const requireRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const organizationId = req.params.organizationId || req.body.organizationId || req.user.organizationId;
      
      if (!organizationId) {
        throw new BadRequestError('Organization ID required');
      }

      // Get user's role in organization
      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.userId,
            organizationId,
          },
        },
        select: { role: true },
      });

      if (!member) {
        throw new ForbiddenError('Not a member of this organization');
      }

      if (!allowedRoles.includes(member.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is admin of organization
 */
export const requireAdmin = requireRole([Role.ADMIN]);

/**
 * Platform admin (system-wide) access
 */
export const requirePlatformAdmin = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const adminEmail = config.adminSeed.email?.toLowerCase();
    if (!adminEmail || req.user.email.toLowerCase() !== adminEmail) {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is member of organization (any role)
 */
export const requireMember = requireRole([Role.ADMIN, Role.MEMBER]);

/**
 * Check if user owns the resource or is admin
 */
export const requireOwnerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const resourceUserId = req.params.userId || req.body.userId;
    const organizationId = req.params.organizationId || req.body.organizationId;

    // If user is the owner
    if (resourceUserId === req.user.userId) {
      return next();
    }

    // Check if user is admin of organization
    if (organizationId) {
      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.userId,
            organizationId,
          },
        },
        select: { role: true },
      });

      if (member && member.role === Role.ADMIN) {
        return next();
      }
    }

    throw new ForbiddenError('Insufficient permissions');
  } catch (error) {
    next(error);
  }
};
