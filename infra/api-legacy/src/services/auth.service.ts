import prisma from '@/utils/prisma';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt';
import { UnauthorizedError, ConflictError, NotFoundError } from '@/utils/errors';
import crypto from 'crypto';
import config from '@/config';

const resolvePlatformRole = (email: string) => {
  const adminEmail = config.adminSeed.email?.toLowerCase();
  return adminEmail && email.toLowerCase() === adminEmail ? 'ADMIN' : 'USER';
};

export class AuthService {
  /**
   * Register new user
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user and default organization in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      // Create default organization
      const orgSlug = `${data.firstName.toLowerCase()}-${user.id.slice(0, 8)}`;
      const organization = await tx.organization.create({
        data: {
          name: `${data.firstName}'s Organization`,
          slug: orgSlug,
        },
      });

      // Add user as admin of organization
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'ADMIN',
        },
      });

      return { user, organization };
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
    });

    const refreshTokenId = crypto.randomUUID();
    const refreshToken = generateRefreshToken({
      userId: result.user.id,
      tokenId: refreshTokenId,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: refreshToken,
        userId: result.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        ...result.user,
        role: resolvePlatformRole(result.user.email),
      },
      organization: result.organization,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizationMembers: {
          take: 1,
          orderBy: { joinedAt: 'asc' },
          include: { organization: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Get primary organization
    const primaryOrg = user.organizationMembers[0]?.organization;

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: primaryOrg?.id,
    });

    const refreshTokenId = crypto.randomUUID();
    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: refreshTokenId,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: resolvePlatformRole(user.email),
      },
      organization: primaryOrg,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    // Find refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            organizationMembers: {
              take: 1,
              include: { organization: true },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedError('User is inactive');
    }

    // Generate new access token
    const primaryOrg = storedToken.user.organizationMembers[0]?.organization;
    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      organizationId: primaryOrg?.id,
    });

    return { accessToken };
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string) {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store reset token
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send email with reset link
    // For now, return token (in production, this should be sent via email)
    return {
      message: 'If the email exists, a reset link has been sent',
      resetToken: resetToken, // Remove this in production
    };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Password reset successful' };
  }
}

export default new AuthService();
