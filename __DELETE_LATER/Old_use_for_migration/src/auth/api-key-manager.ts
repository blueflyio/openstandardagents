/**
 * API Key Manager with Rotation and Secure Storage
 * OSSA v0.1.8 compliant API key management system
 */

import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import {
  APIKey,
  APIKeyRestrictions,
  APIKeyMetadata,
  RotationSchedule,
  AuthenticatedRequest,
  AuthenticatedUser,
  APIKeyValidationError,
  AuthMiddleware
} from './types.js';
import { Response, NextFunction } from 'express';

const scryptAsync = promisify(scrypt);

export interface APIKeyStorage {
  get(keyId: string): Promise<APIKey | null>;
  set(keyId: string, apiKey: APIKey): Promise<void>;
  delete(keyId: string): Promise<void>;
  list(filters?: APIKeyFilters): Promise<APIKey[]>;
  updateUsage(keyId: string, usage: Partial<APIKeyMetadata['usage']>): Promise<void>;
}

export interface APIKeyFilters {
  owner?: string;
  environment?: string;
  isActive?: boolean;
  tags?: string[];
  scopes?: string[];
}

export interface APIKeyGenerationOptions {
  name: string;
  description?: string;
  owner: string;
  environment: 'development' | 'staging' | 'production';
  scopes: string[];
  restrictions?: Partial<APIKeyRestrictions>;
  expiresIn?: number; // seconds
  rotationSchedule?: Partial<RotationSchedule>;
  tags?: string[];
}

export interface APIKeyValidationContext {
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  timestamp: Date;
}

// In-memory storage implementation (for demo purposes)
class MemoryAPIKeyStorage implements APIKeyStorage {
  private storage: Map<string, APIKey> = new Map();

  async get(keyId: string): Promise<APIKey | null> {
    return this.storage.get(keyId) || null;
  }

  async set(keyId: string, apiKey: APIKey): Promise<void> {
    this.storage.set(keyId, apiKey);
  }

  async delete(keyId: string): Promise<void> {
    this.storage.delete(keyId);
  }

  async list(filters?: APIKeyFilters): Promise<APIKey[]> {
    let keys = Array.from(this.storage.values());
    
    if (filters) {
      if (filters.owner) {
        keys = keys.filter(key => key.metadata.owner === filters.owner);
      }
      if (filters.environment) {
        keys = keys.filter(key => key.metadata.environment === filters.environment);
      }
      if (filters.isActive !== undefined) {
        keys = keys.filter(key => key.isActive === filters.isActive);
      }
      if (filters.tags && filters.tags.length > 0) {
        keys = keys.filter(key => 
          filters.tags!.some(tag => key.metadata.tags.includes(tag))
        );
      }
      if (filters.scopes && filters.scopes.length > 0) {
        keys = keys.filter(key =>
          filters.scopes!.some(scope => key.scopes.includes(scope))
        );
      }
    }
    
    return keys;
  }

  async updateUsage(keyId: string, usage: Partial<APIKeyMetadata['usage']>): Promise<void> {
    const key = this.storage.get(keyId);
    if (key) {
      Object.assign(key.metadata.usage, usage);
      key.lastUsedAt = new Date();
    }
  }
}

export class APIKeyManager {
  private storage: APIKeyStorage;
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();
  private usageStats: Map<string, { requests: number; window: Date }> = new Map();

  constructor(storage?: APIKeyStorage) {
    this.storage = storage || new MemoryAPIKeyStorage();
    this.startRotationScheduler();
    this.startUsageStatsCleanup();
  }

  /**
   * Generate new API key
   */
  async generateAPIKey(options: APIKeyGenerationOptions): Promise<{ apiKey: APIKey; rawKey: string }> {
    const keyId = this.generateKeyId();
    const rawKey = this.generateRawKey();
    const keyHash = await this.hashKey(rawKey);

    const now = new Date();
    const expiresAt = options.expiresIn ? new Date(now.getTime() + options.expiresIn * 1000) : undefined;

    // Setup rotation schedule
    let rotationSchedule: RotationSchedule | undefined;
    if (options.rotationSchedule && options.rotationSchedule.frequency) {
      const nextRotation = this.calculateNextRotation(now, options.rotationSchedule.frequency);
      rotationSchedule = {
        frequency: options.rotationSchedule.frequency,
        nextRotation,
        gracePeriodDays: options.rotationSchedule.gracePeriodDays || 7,
        autoRotate: options.rotationSchedule.autoRotate || false,
        notifyBeforeDays: options.rotationSchedule.notifyBeforeDays || 3
      };
    }

    const apiKey: APIKey = {
      id: keyId,
      keyHash,
      name: options.name,
      description: options.description,
      scopes: options.scopes,
      restrictions: this.normalizeRestrictions(options.restrictions || {}),
      metadata: {
        owner: options.owner,
        environment: options.environment,
        tags: options.tags || [],
        usage: {
          totalRequests: 0,
          lastMonthRequests: 0,
          averageResponseTime: 0
        }
      },
      createdAt: now,
      expiresAt,
      isActive: true,
      rotationSchedule
    };

    await this.storage.set(keyId, apiKey);

    // Schedule rotation if enabled
    if (rotationSchedule?.autoRotate) {
      this.scheduleRotation(keyId, rotationSchedule.nextRotation);
    }

    return { apiKey, rawKey };
  }

  /**
   * Validate API key and return associated data
   */
  async validateAPIKey(rawKey: string, context: APIKeyValidationContext): Promise<APIKey> {
    const keyId = this.extractKeyId(rawKey);
    if (!keyId) {
      throw new APIKeyValidationError('Invalid API key format');
    }

    const apiKey = await this.storage.get(keyId);
    if (!apiKey) {
      throw new APIKeyValidationError('API key not found');
    }

    if (!apiKey.isActive) {
      throw new APIKeyValidationError('API key is inactive');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new APIKeyValidationError('API key has expired');
    }

    // Verify key hash
    const keyHash = await this.hashKey(rawKey);
    if (!timingSafeEqual(Buffer.from(apiKey.keyHash, 'hex'), Buffer.from(keyHash, 'hex'))) {
      throw new APIKeyValidationError('Invalid API key');
    }

    // Validate restrictions
    await this.validateRestrictions(apiKey, context);

    // Update usage statistics
    await this.updateUsageStats(apiKey.id);

    return apiKey;
  }

  /**
   * Rotate API key (generate new key with same configuration)
   */
  async rotateAPIKey(keyId: string, reason: 'scheduled' | 'manual' | 'compromise' | 'expiry' = 'manual'): Promise<{ newApiKey: APIKey; newRawKey: string; oldApiKey: APIKey }> {
    const oldApiKey = await this.storage.get(keyId);
    if (!oldApiKey) {
      throw new Error('API key not found');
    }

    // Generate new key with same configuration
    const { apiKey: newApiKey, rawKey: newRawKey } = await this.generateAPIKey({
      name: oldApiKey.name,
      description: oldApiKey.description,
      owner: oldApiKey.metadata.owner,
      environment: oldApiKey.metadata.environment,
      scopes: oldApiKey.scopes,
      restrictions: oldApiKey.restrictions,
      tags: oldApiKey.metadata.tags,
      rotationSchedule: oldApiKey.rotationSchedule
    });

    // Update rotation history
    newApiKey.metadata.rotationHistory = oldApiKey.metadata.rotationHistory || [];
    newApiKey.metadata.rotationHistory.push({
      timestamp: new Date(),
      oldKeyId: oldApiKey.id,
      newKeyId: newApiKey.id,
      reason,
      initiator: 'system', // In real implementation, this would be the authenticated user
      success: true
    });

    // Deactivate old key (with grace period if configured)
    if (oldApiKey.rotationSchedule?.gracePeriodDays && oldApiKey.rotationSchedule.gracePeriodDays > 0) {
      // Keep old key active for grace period
      const gracePeriodEnd = new Date(Date.now() + oldApiKey.rotationSchedule.gracePeriodDays * 24 * 60 * 60 * 1000);
      
      setTimeout(async () => {
        oldApiKey.isActive = false;
        await this.storage.set(oldApiKey.id, oldApiKey);
      }, oldApiKey.rotationSchedule.gracePeriodDays * 24 * 60 * 60 * 1000);
    } else {
      // Immediately deactivate old key
      oldApiKey.isActive = false;
      await this.storage.set(oldApiKey.id, oldApiKey);
    }

    // Schedule next rotation
    if (newApiKey.rotationSchedule?.autoRotate) {
      const nextRotation = this.calculateNextRotation(new Date(), newApiKey.rotationSchedule.frequency);
      newApiKey.rotationSchedule.nextRotation = nextRotation;
      await this.storage.set(newApiKey.id, newApiKey);
      this.scheduleRotation(newApiKey.id, nextRotation);
    }

    return { newApiKey, newRawKey, oldApiKey };
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(keyId: string): Promise<void> {
    const apiKey = await this.storage.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.isActive = false;
    await this.storage.set(keyId, apiKey);

    // Cancel scheduled rotation
    const timer = this.rotationTimers.get(keyId);
    if (timer) {
      clearTimeout(timer);
      this.rotationTimers.delete(keyId);
    }
  }

  /**
   * List API keys with filtering
   */
  async listAPIKeys(filters?: APIKeyFilters): Promise<APIKey[]> {
    return this.storage.list(filters);
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(keyId: string): Promise<APIKeyMetadata['usage'] | null> {
    const apiKey = await this.storage.get(keyId);
    return apiKey?.metadata.usage || null;
  }

  /**
   * Create API key authentication middleware
   */
  createMiddleware(options?: {
    headerName?: string;
    queryParam?: string;
    prefix?: string;
    optional?: boolean;
    requiredScopes?: string[];
  }): AuthMiddleware {
    const headerName = options?.headerName || 'x-api-key';
    const queryParam = options?.queryParam || 'api_key';
    const prefix = options?.prefix || '';

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        let rawKey = this.extractAPIKey(req, headerName, queryParam, prefix);
        
        if (!rawKey) {
          if (options?.optional) {
            return next();
          }
          throw new APIKeyValidationError('API key required');
        }

        const context: APIKeyValidationContext = {
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer'),
          timestamp: new Date()
        };

        const apiKey = await this.validateAPIKey(rawKey, context);

        // Check required scopes
        if (options?.requiredScopes && options.requiredScopes.length > 0) {
          const hasRequiredScope = options.requiredScopes.every(scope =>
            apiKey.scopes.includes(scope)
          );
          
          if (!hasRequiredScope) {
            throw new APIKeyValidationError('API key missing required scopes');
          }
        }

        // Create authenticated user
        const user: AuthenticatedUser = {
          id: apiKey.metadata.owner,
          roles: ['api-key-user'],
          permissions: apiKey.scopes,
          metadata: {
            apiKeyId: apiKey.id,
            apiKeyName: apiKey.name,
            environment: apiKey.metadata.environment,
            tags: apiKey.metadata.tags
          }
        };

        // Attach auth info to request
        req.auth = {
          type: 'api_key',
          user,
          apiKey,
          scopes: apiKey.scopes,
          restrictions: this.formatRestrictionsForAuth(apiKey.restrictions),
          metadata: {
            keyId: apiKey.id,
            environment: apiKey.metadata.environment
          }
        };

        next();

      } catch (error) {
        if (error instanceof APIKeyValidationError) {
          res.status(error.statusCode).json({
            error: error.code,
            message: error.message,
            details: error.details
          });
        } else {
          res.status(401).json({
            error: 'API_KEY_AUTHENTICATION_FAILED',
            message: 'API key authentication failed'
          });
        }
      }
    };
  }

  /**
   * Extract API key from request
   */
  private extractAPIKey(
    req: AuthenticatedRequest, 
    headerName: string, 
    queryParam: string, 
    prefix: string
  ): string | null {
    // Check header
    const headerValue = req.get(headerName);
    if (headerValue) {
      return prefix ? headerValue.replace(prefix, '').trim() : headerValue;
    }

    // Check query parameter
    const queryValue = req.query[queryParam];
    if (typeof queryValue === 'string') {
      return prefix ? queryValue.replace(prefix, '').trim() : queryValue;
    }

    return null;
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(): string {
    return `ak_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate cryptographically secure raw key
   */
  private generateRawKey(): string {
    const keyId = randomBytes(8).toString('hex');
    const keySecret = randomBytes(32).toString('hex');
    return `${keyId}.${keySecret}`;
  }

  /**
   * Extract key ID from raw key
   */
  private extractKeyId(rawKey: string): string | null {
    const parts = rawKey.split('.');
    return parts.length === 2 ? `ak_${parts[0]}` : null;
  }

  /**
   * Hash API key for secure storage
   */
  private async hashKey(rawKey: string): Promise<string> {
    const salt = randomBytes(16);
    const keyBuffer = await scryptAsync(rawKey, salt, 32) as Buffer;
    return `${salt.toString('hex')}:${keyBuffer.toString('hex')}`;
  }

  /**
   * Validate API key restrictions
   */
  private async validateRestrictions(apiKey: APIKey, context: APIKeyValidationContext): Promise<void> {
    const restrictions = apiKey.restrictions;

    // IP whitelist validation
    if (restrictions.ipWhitelist && restrictions.ipWhitelist.length > 0) {
      if (!context.ipAddress || !restrictions.ipWhitelist.includes(context.ipAddress)) {
        throw new APIKeyValidationError('IP address not in whitelist');
      }
    }

    // User agent pattern validation
    if (restrictions.userAgentPattern && context.userAgent) {
      const pattern = new RegExp(restrictions.userAgentPattern);
      if (!pattern.test(context.userAgent)) {
        throw new APIKeyValidationError('User agent pattern does not match');
      }
    }

    // Referer pattern validation
    if (restrictions.refererPattern && context.referer) {
      const pattern = new RegExp(restrictions.refererPattern);
      if (!pattern.test(context.referer)) {
        throw new APIKeyValidationError('Referer pattern does not match');
      }
    }

    // Time window validation
    if (restrictions.timeWindows && restrictions.timeWindows.length > 0) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const isInWindow = restrictions.timeWindows.some(window => {
        return currentTime >= window.start && currentTime <= window.end;
      });
      
      if (!isInWindow) {
        throw new APIKeyValidationError('Request outside allowed time window');
      }
    }

    // Rate limiting validation
    if (restrictions.rateLimit) {
      const usageKey = `${apiKey.id}:${Math.floor(Date.now() / (restrictions.rateLimit.window * 1000))}`;
      const currentUsage = this.usageStats.get(usageKey);
      
      if (currentUsage && currentUsage.requests >= restrictions.rateLimit.requests) {
        throw new APIKeyValidationError('Rate limit exceeded');
      }
    }
  }

  /**
   * Update usage statistics for API key
   */
  private async updateUsageStats(keyId: string): Promise<void> {
    const apiKey = await this.storage.get(keyId);
    if (!apiKey) return;

    // Update total requests
    const newUsage = {
      totalRequests: apiKey.metadata.usage.totalRequests + 1,
      lastMonthRequests: apiKey.metadata.usage.lastMonthRequests + 1,
      averageResponseTime: apiKey.metadata.usage.averageResponseTime // Would be calculated from actual response times
    };

    await this.storage.updateUsage(keyId, newUsage);

    // Update rate limiting stats
    if (apiKey.restrictions.rateLimit) {
      const usageKey = `${keyId}:${Math.floor(Date.now() / (apiKey.restrictions.rateLimit.window * 1000))}`;
      const currentUsage = this.usageStats.get(usageKey) || { requests: 0, window: new Date() };
      currentUsage.requests++;
      this.usageStats.set(usageKey, currentUsage);
    }
  }

  /**
   * Calculate next rotation date based on frequency
   */
  private calculateNextRotation(from: Date, frequency: RotationSchedule['frequency']): Date {
    const result = new Date(from);
    
    switch (frequency) {
      case 'daily':
        result.setDate(result.getDate() + 1);
        break;
      case 'weekly':
        result.setDate(result.getDate() + 7);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + 1);
        break;
      case 'quarterly':
        result.setMonth(result.getMonth() + 3);
        break;
      case 'yearly':
        result.setFullYear(result.getFullYear() + 1);
        break;
    }
    
    return result;
  }

  /**
   * Schedule automatic rotation
   */
  private scheduleRotation(keyId: string, rotationDate: Date): void {
    const delay = rotationDate.getTime() - Date.now();
    
    if (delay > 0) {
      const timer = setTimeout(async () => {
        try {
          await this.rotateAPIKey(keyId, 'scheduled');
          this.rotationTimers.delete(keyId);
        } catch (error) {
          console.error(`Failed to rotate API key ${keyId}:`, error);
        }
      }, delay);
      
      this.rotationTimers.set(keyId, timer);
    }
  }

  /**
   * Start rotation scheduler
   */
  private startRotationScheduler(): void {
    // Check for pending rotations every hour
    setInterval(async () => {
      const now = new Date();
      const keys = await this.storage.list({ isActive: true });
      
      for (const key of keys) {
        if (key.rotationSchedule?.autoRotate && 
            key.rotationSchedule.nextRotation <= now && 
            !this.rotationTimers.has(key.id)) {
          
          try {
            await this.rotateAPIKey(key.id, 'scheduled');
          } catch (error) {
            console.error(`Failed to rotate API key ${key.id}:`, error);
          }
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Start usage stats cleanup
   */
  private startUsageStatsCleanup(): void {
    // Clean old usage stats every 24 hours
    setInterval(() => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
      
      for (const [key, usage] of this.usageStats.entries()) {
        if (usage.window.getTime() < cutoff) {
          this.usageStats.delete(key);
        }
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Normalize restrictions with defaults
   */
  private normalizeRestrictions(restrictions: Partial<APIKeyRestrictions>): APIKeyRestrictions {
    return {
      ipWhitelist: restrictions.ipWhitelist,
      userAgentPattern: restrictions.userAgentPattern,
      refererPattern: restrictions.refererPattern,
      rateLimit: restrictions.rateLimit,
      timeWindows: restrictions.timeWindows
    };
  }

  /**
   * Format restrictions for auth context
   */
  private formatRestrictionsForAuth(restrictions: APIKeyRestrictions): string[] {
    const formatted: string[] = [];
    
    if (restrictions.ipWhitelist) {
      formatted.push(`ip-whitelist:${restrictions.ipWhitelist.length}-ips`);
    }
    if (restrictions.rateLimit) {
      formatted.push(`rate-limit:${restrictions.rateLimit.requests}/${restrictions.rateLimit.window}s`);
    }
    if (restrictions.timeWindows) {
      formatted.push(`time-windows:${restrictions.timeWindows.length}-periods`);
    }
    
    return formatted;
  }
}