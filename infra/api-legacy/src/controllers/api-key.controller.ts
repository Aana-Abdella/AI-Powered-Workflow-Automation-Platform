import { Request, Response, NextFunction } from 'express';
import apiKeyService from '@/services/api-key.service';
import { z } from 'zod';

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresIn: z.number().int().positive().optional(),
  rateLimit: z.number().int().positive().optional(),
});

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rateLimit: z.number().int().positive().optional(),
});

export class ApiKeyController {
  /**
   * Create a new API key
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const data = createApiKeySchema.parse(req.body);
      const apiKey = await apiKeyService.createApiKey(
        organizationId,
        userId,
        data
      );

      // Return the full key only once
      res.status(201).json({
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          rawKey: apiKey.rawKey, // Only returned on creation
          expiresAt: apiKey.expiresAt,
          rateLimit: apiKey.rateLimit,
          createdAt: apiKey.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all API keys for an organization
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const apiKeys = await apiKeyService.listApiKeys(organizationId, userId);

      res.json({
        success: true,
        data: apiKeys,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get API key by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const apiKey = await apiKeyService.getApiKeyById(
        id,
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: apiKey,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke an API key
   */
  async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const result = await apiKeyService.revokeApiKey(
        id,
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an API key
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const result = await apiKeyService.deleteApiKey(
        id,
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate an API key
   */
  async regenerate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organization ID is required' },
        });
      }

      const apiKey = await apiKeyService.regenerateApiKey(
        id,
        organizationId,
        userId
      );

      // Return the full key only once
      res.json({
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          rawKey: apiKey.rawKey, // Only returned on regeneration
          expiresAt: apiKey.expiresAt,
          rateLimit: apiKey.rateLimit,
          createdAt: apiKey.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ApiKeyController();

