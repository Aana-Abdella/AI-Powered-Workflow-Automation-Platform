import { Request, Response, NextFunction } from 'express';
import authService from '@/services/auth.service';
import { validatePasswordStrength } from '@/utils/password';
import { BadRequestError } from '@/utils/errors';
import prisma from '@/utils/prisma';
import config from '@/config';

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.errors.join(', '));
      }

      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
      });

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          organization: result.organization,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          organization: result.organization,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new BadRequestError('Refresh token required');
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const result = await authService.requestPasswordReset(email);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.errors.join(', '));
      }

      const result = await authService.resetPassword(token, password);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const userRecord = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
      });

      if (!userRecord || !userRecord.isActive) {
        throw new BadRequestError('User not authenticated');
      }

      let organization = null;
      if (req.user.organizationId) {
        const membership = await prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: req.user.userId,
              organizationId: req.user.organizationId,
            },
          },
          include: { organization: true },
        });

        if (membership) {
          organization = membership.organization;
        } else {
          organization = await prisma.organization.findUnique({
            where: { id: req.user.organizationId },
            select: { id: true, name: true, slug: true },
          });
        }
      }

      const adminEmail = config.adminSeed.email?.toLowerCase();
      const role = adminEmail && userRecord.email.toLowerCase() === adminEmail ? 'ADMIN' : 'USER';

      res.json({
        success: true,
        data: {
          user: {
            id: userRecord.id,
            email: userRecord.email,
            firstName: userRecord.firstName,
            lastName: userRecord.lastName,
            role,
          },
          organization,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
