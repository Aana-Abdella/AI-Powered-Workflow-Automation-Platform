import prisma from '@/utils/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import crypto from 'crypto';

export interface CreateApiKeyInput {
  name: string;
  expiresIn?: number; // days
  rateLimit?: number;
}

export class ApiKeyService {
  /**
   * Hash a raw API key
   */
  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Create a new API key for an organization
   */
  async createApiKey(
    organizationId: string,
    userId: string,
    data: CreateApiKeyInput
  ) {
    // Verify user has access to organization
    await this.checkOrganizationAccess(organizationId, userId);

    // Generate API key
    const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = this.hashKey(rawKey);

    const expiresAt = data.expiresIn
      ? new Date(Date.now() + data.expiresIn * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        name: data.name,
        keyPrefix,
        keyHash,
        expiresAt,
        rateLimit: data.rateLimit || 1000,
        organizationId,
        userId,
      },
    });

    // Return the raw key only once!
    return {
      ...apiKey,
      rawKey, // Only returned on creation
    };
  }

  /**
   * List all API keys for an organization
   */
  async listApiKeys(organizationId: string, userId: string) {
    await this.checkOrganizationAccess(organizationId, userId);

    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        rateLimit: true,
        rateLimitUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiKeys;
  }

  /**
   * Get API key by ID
   */
  async getApiKeyById(
    apiKeyId: string,
    organizationId: string,
    userId: string
  ) {
    await this.checkOrganizationAccess(organizationId, userId);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        rateLimit: true,
        rateLimitUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }

    return apiKey;
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(
    apiKeyId: string,
    organizationId: string,
    userId: string
  ) {
    await this.checkOrganizationAccess(organizationId, userId);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        organizationId,
      },
    });

    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false },
    });

    return { message: 'API key revoked successfully' };
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(
    apiKeyId: string,
    organizationId: string,
    userId: string
  ) {
    await this.checkOrganizationAccess(organizationId, userId);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        organizationId,
      },
    });

    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }

    await prisma.apiKey.delete({
      where: { id: apiKeyId },
    });

    return { message: 'API key deleted successfully' };
  }

  /**
   * Validate an API key (for middleware)
   */
  async validateApiKey(rawKey: string) {
    const keyHash = this.hashKey(rawKey);

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        organization: true,
      },
    });

    if (!apiKey) {
      throw new ForbiddenError('Invalid API key');
    }

    if (!apiKey.isActive) {
      throw new ForbiddenError('API key is revoked');
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      throw new ForbiddenError('API key has expired');
    }

    // Update last used and rate limit
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        rateLimitUsed: { increment: 1 },
      },
    });

    return {
      organizationId: apiKey.organizationId,
      apiKeyId: apiKey.id,
      rateLimit: apiKey.rateLimit,
    };
  }

  /**
   * Regenerate an API key (creates new, invalidates old)
   */
  async regenerateApiKey(
    apiKeyId: string,
    organizationId: string,
    userId: string
  ) {
    await this.checkOrganizationAccess(organizationId, userId);

    const existingKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        organizationId,
      },
    });

    if (!existingKey) {
      throw new NotFoundError('API key not found');
    }

    // Generate new key
    const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = this.hashKey(rawKey);

    // Invalidate old key and create new one
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false },
    });

    const newKey = await prisma.apiKey.create({
      data: {
        name: `${existingKey.name} (Regenerated)`,
        keyPrefix,
        keyHash,
        expiresAt: existingKey.expiresAt,
        rateLimit: existingKey.rateLimit,
        organizationId,
        userId,
      },
    });

    return {
      ...newKey,
      rawKey,
    };
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

export default new ApiKeyService();

