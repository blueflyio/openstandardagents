/**
 * Authentication Middleware Integration Layer
 * OSSA v0.1.8 compliant unified authentication middleware system
 */

import { Request, Response, NextFunction } from 'express';
import {
  AuthConfig,
  AuthMiddlewareOptions,
  AuthenticatedRequest,
  AuthMiddleware,
  RateLimitConfig,
  BruteForceConfig,
  AuthenticationError,
  AuthorizationError
} from './types.js';
import { JWTManager, createJWTMiddleware } from './jwt-middleware.js';
import { OAuth2Provider } from './oauth2-provider.js';
import { mTLSCertificateValidator, createMTLSMiddleware } from './mtls-middleware.js';
import { APIKeyManager } from './api-key-manager.js';

export interface AuthenticationResult {
  success: boolean;
  provider: 'jwt' | 'oauth2' | 'mtls' | 'api_key' | 'none';
  user?: any;
  token?: string;
  scopes?: string[];
  restrictions?: string[];
  metadata?: Record<string, any>;
  error?: string;
}

export class AuthenticationMiddlewareSystem {
  private jwtManager?: JWTManager;
  private oauth2Provider?: OAuth2Provider;
  private mtlsValidator?: mTLSCertificateValidator;
  private apiKeyManager?: APIKeyManager;
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private bruteForceProtection?: BruteForceProtector;

  constructor(private config: AuthConfig) {
    this.initializeProviders();
  }

  /**
   * Create unified authentication middleware
   */
  createAuthMiddleware(options?: AuthMiddlewareOptions): AuthMiddleware {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        // Apply security headers first
        this.applySecurityHeaders(req, res, options);

        // Apply rate limiting if enabled
        if (this.config.security.rateLimiting && options?.rateLimiting) {
          await this.applyRateLimit(req, res, options.rateLimiting);
        }

        // Apply brute force protection
        if (this.config.security.bruteForceProtection && this.bruteForceProtection) {
          await this.bruteForceProtection.checkRequest(req, res);
        }

        // Try authentication providers in order of preference
        const authResult = await this.tryAuthentication(req, res, options);

        if (!authResult.success) {
          throw new AuthenticationError(
            authResult.error || 'Authentication failed',
            'AUTHENTICATION_FAILED'
          );
        }

        // Set authentication info on request
        req.auth = {
          type: authResult.provider as any,
          user: authResult.user,
          token: authResult.token,
          scopes: authResult.scopes || [],
          restrictions: authResult.restrictions || [],
          metadata: {
            ...authResult.metadata,
            authenticationTime: Date.now() - startTime,
            authProvider: authResult.provider
          }
        };

        next();

      } catch (error) {
        this.handleAuthenticationError(error, req, res, next);
      }
    };
  }

  /**
   * Create middleware for specific authentication method
   */
  createSpecificMiddleware(
    method: 'jwt' | 'oauth2' | 'mtls' | 'api_key',
    options?: any
  ): AuthMiddleware {
    switch (method) {
      case 'jwt':
        if (!this.jwtManager) {
          throw new Error('JWT authentication not configured');
        }
        return this.jwtManager.createMiddleware(options);

      case 'oauth2':
        if (!this.oauth2Provider) {
          throw new Error('OAuth2 authentication not configured');
        }
        return this.oauth2Provider.createMiddleware(options);

      case 'mtls':
        if (!this.mtlsValidator) {
          throw new Error('mTLS authentication not configured');
        }
        return this.mtlsValidator.createMiddleware(options);

      case 'api_key':
        if (!this.apiKeyManager) {
          throw new Error('API Key authentication not configured');
        }
        return this.apiKeyManager.createMiddleware(options);

      default:
        throw new Error(`Unsupported authentication method: ${method}`);
    }
  }

  /**
   * Create middleware chain with multiple authentication methods
   */
  createMultiAuthMiddleware(
    methods: Array<{
      type: 'jwt' | 'oauth2' | 'mtls' | 'api_key';
      options?: any;
      required?: boolean;
    }>,
    strategy: 'any' | 'all' = 'any'
  ): AuthMiddleware {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const results: AuthenticationResult[] = [];
      let hasSuccess = false;

      for (const method of methods) {
        try {
          const middleware = this.createSpecificMiddleware(method.type, method.options);
          
          // Create a mock response to capture middleware behavior
          const mockRes = { ...res };
          let middlewareError: any = null;
          
          await new Promise<void>((resolve, reject) => {
            middleware(req, mockRes, (error?: any) => {
              if (error) {
                middlewareError = error;
                reject(error);
              } else {
                resolve();
              }
            });
          });

          if (!middlewareError && req.auth) {
            results.push({
              success: true,
              provider: method.type,
              user: req.auth.user,
              token: req.auth.token,
              scopes: req.auth.scopes,
              restrictions: req.auth.restrictions,
              metadata: req.auth.metadata
            });
            hasSuccess = true;
          }

          // For 'any' strategy, first success is sufficient
          if (strategy === 'any' && hasSuccess) {
            break;
          }

        } catch (error) {
          results.push({
            success: false,
            provider: method.type,
            error: error instanceof Error ? error.message : 'Authentication failed'
          });

          // For required methods, failure should stop the chain
          if (method.required) {
            throw error;
          }
        }
      }

      // Check strategy requirements
      if (strategy === 'all') {
        const requiredMethods = methods.filter(m => m.required !== false);
        const successCount = results.filter(r => r.success).length;
        
        if (successCount < requiredMethods.length) {
          throw new AuthenticationError('Not all required authentication methods succeeded', 'MULTI_AUTH_FAILED');
        }
      } else if (strategy === 'any' && !hasSuccess) {
        throw new AuthenticationError('No authentication method succeeded', 'NO_AUTH_SUCCESS');
      }

      // Combine results for 'all' strategy
      if (strategy === 'all' && results.length > 1) {
        const combinedScopes = new Set<string>();
        const combinedRestrictions = new Set<string>();
        const combinedMetadata: Record<string, any> = {};

        for (const result of results.filter(r => r.success)) {
          result.scopes?.forEach(scope => combinedScopes.add(scope));
          result.restrictions?.forEach(restriction => combinedRestrictions.add(restriction));
          Object.assign(combinedMetadata, result.metadata);
        }

        req.auth = {
          type: 'multi',
          user: results.find(r => r.success)?.user,
          scopes: Array.from(combinedScopes),
          restrictions: Array.from(combinedRestrictions),
          metadata: {
            ...combinedMetadata,
            authMethods: results.filter(r => r.success).map(r => r.provider),
            strategy
          }
        };
      }

      next();
    };
  }

  /**
   * Create authorization middleware for scope/permission checking
   */
  createAuthorizationMiddleware(requirements: {
    scopes?: string[];
    permissions?: string[];
    roles?: string[];
    custom?: (req: AuthenticatedRequest) => boolean | Promise<boolean>;
  }): AuthMiddleware {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.auth || !req.auth.user) {
        throw new AuthorizationError('Authentication required for authorization', 'AUTH_REQUIRED');
      }

      try {
        // Check scopes
        if (requirements.scopes && requirements.scopes.length > 0) {
          const userScopes = req.auth.scopes || [];
          const hasRequiredScope = requirements.scopes.every(scope => 
            userScopes.includes(scope)
          );
          
          if (!hasRequiredScope) {
            throw new AuthorizationError('Insufficient scopes', 'INSUFFICIENT_SCOPE');
          }
        }

        // Check permissions
        if (requirements.permissions && requirements.permissions.length > 0) {
          const userPermissions = req.auth.user.permissions || [];
          const hasRequiredPermission = requirements.permissions.every(permission =>
            userPermissions.includes(permission)
          );
          
          if (!hasRequiredPermission) {
            throw new AuthorizationError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS');
          }
        }

        // Check roles
        if (requirements.roles && requirements.roles.length > 0) {
          const userRoles = req.auth.user.roles || [];
          const hasRequiredRole = requirements.roles.some(role =>
            userRoles.includes(role)
          );
          
          if (!hasRequiredRole) {
            throw new AuthorizationError('Insufficient roles', 'INSUFFICIENT_ROLES');
          }
        }

        // Custom authorization check
        if (requirements.custom) {
          const customResult = await requirements.custom(req);
          if (!customResult) {
            throw new AuthorizationError('Custom authorization check failed', 'CUSTOM_AUTH_FAILED');
          }
        }

        next();

      } catch (error) {
        if (error instanceof AuthorizationError) {
          res.status(error.statusCode).json({
            error: error.code,
            message: error.message,
            details: error.details
          });
        } else {
          res.status(403).json({
            error: 'AUTHORIZATION_FAILED',
            message: 'Authorization check failed'
          });
        }
      }
    };
  }

  /**
   * Create session middleware for managing authentication sessions
   */
  createSessionMiddleware(options: {
    timeout?: number; // seconds
    renewOnActivity?: boolean;
    storage?: 'memory' | 'redis' | 'database';
  } = {}): AuthMiddleware {
    const sessionTimeout = (options.timeout || this.config.security.sessionTimeout) * 1000;
    const sessions = new Map<string, { lastActivity: Date; data: any }>();

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.auth?.user) {
        return next();
      }

      const sessionId = req.auth.metadata?.sessionId || `session_${Date.now()}_${Math.random()}`;
      const now = new Date();

      // Check existing session
      const existingSession = sessions.get(sessionId);
      if (existingSession) {
        const timeSinceLastActivity = now.getTime() - existingSession.lastActivity.getTime();
        
        if (timeSinceLastActivity > sessionTimeout) {
          sessions.delete(sessionId);
          throw new AuthenticationError('Session expired', 'SESSION_EXPIRED');
        }

        if (options.renewOnActivity) {
          existingSession.lastActivity = now;
        }
      } else {
        // Create new session
        sessions.set(sessionId, {
          lastActivity: now,
          data: {
            userId: req.auth.user.id,
            authType: req.auth.type,
            createdAt: now
          }
        });
      }

      // Attach session info to request
      req.auth.metadata = {
        ...req.auth.metadata,
        sessionId,
        sessionCreated: existingSession?.data.createdAt || now,
        lastActivity: existingSession?.lastActivity || now
      };

      next();
    };
  }

  /**
   * Try authentication with available providers
   */
  private async tryAuthentication(
    req: AuthenticatedRequest,
    res: Response,
    options?: AuthMiddlewareOptions
  ): Promise<AuthenticationResult> {
    const providers: Array<{
      name: 'jwt' | 'oauth2' | 'mtls' | 'api_key';
      middleware: AuthMiddleware;
    }> = [];

    // Add configured providers
    if (this.jwtManager && options?.jwt) {
      providers.push({
        name: 'jwt',
        middleware: this.jwtManager.createMiddleware(options.jwt)
      });
    }

    if (this.oauth2Provider && options?.oauth2) {
      providers.push({
        name: 'oauth2',
        middleware: this.oauth2Provider.createMiddleware(options.oauth2)
      });
    }

    if (this.mtlsValidator && options?.mtls) {
      providers.push({
        name: 'mtls',
        middleware: this.mtlsValidator.createMiddleware(options.mtls)
      });
    }

    if (this.apiKeyManager && options?.apiKey) {
      providers.push({
        name: 'api_key',
        middleware: this.apiKeyManager.createMiddleware(options.apiKey)
      });
    }

    // Try each provider
    for (const provider of providers) {
      try {
        const mockRes = { ...res };
        let authSuccess = false;
        
        await new Promise<void>((resolve, reject) => {
          provider.middleware(req, mockRes, (error?: any) => {
            if (error) {
              reject(error);
            } else {
              authSuccess = true;
              resolve();
            }
          });
        });

        if (authSuccess && req.auth) {
          return {
            success: true,
            provider: provider.name,
            user: req.auth.user,
            token: req.auth.token,
            scopes: req.auth.scopes,
            restrictions: req.auth.restrictions,
            metadata: req.auth.metadata
          };
        }

      } catch (error) {
        // Continue to next provider
        continue;
      }
    }

    return {
      success: false,
      provider: 'none',
      error: 'No authentication provider succeeded'
    };
  }

  /**
   * Apply security headers
   */
  private applySecurityHeaders(req: Request, res: Response, options?: AuthMiddlewareOptions): void {
    // HTTPS enforcement
    if (options?.security?.requireHttps && !req.secure) {
      throw new AuthenticationError('HTTPS required', 'HTTPS_REQUIRED');
    }

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    if (!res.getHeader('Content-Security-Policy')) {
      res.setHeader('Content-Security-Policy', "default-src 'self'");
    }

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'OSSA');
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(req: Request, res: Response, config: RateLimitConfig): Promise<void> {
    const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'anonymous';
    
    let rateLimiter = this.rateLimiters.get(key);
    if (!rateLimiter) {
      rateLimiter = new RateLimiter(config);
      this.rateLimiters.set(key, rateLimiter);
    }

    const isAllowed = await rateLimiter.checkRequest();
    
    if (!isAllowed) {
      res.status(config.statusCode || 429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: config.message || 'Too many requests'
      });
      
      if (config.onLimitReached) {
        config.onLimitReached(req, res, config);
      }
      
      throw new Error('Rate limit exceeded');
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(
    error: any,
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString()
      });
    } else if (error.message === 'Rate limit exceeded') {
      // Already handled by rate limiter
      return;
    } else {
      // Log unexpected errors
      console.error('Authentication middleware error:', error);
      
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Internal authentication error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Initialize authentication providers based on configuration
   */
  private initializeProviders(): void {
    // Initialize JWT manager
    if (this.config.providers.jwt) {
      this.jwtManager = new JWTManager(this.config.providers.jwt);
      
      // Add the public key for verification
      if (this.config.providers.jwt.publicKey) {
        this.jwtManager.addKeyPair(this.config.providers.jwt.keyId || 'default', {
          privateKey: '', // Not needed for verification
          publicKey: this.config.providers.jwt.publicKey,
          keyId: this.config.providers.jwt.keyId || 'default',
          algorithm: this.config.providers.jwt.algorithm
        });
      }
    }

    // Initialize OAuth2 provider
    if (this.config.providers.oauth2) {
      this.oauth2Provider = new OAuth2Provider(this.config.providers.oauth2);
    }

    // Initialize mTLS validator
    if (this.config.providers.mtls) {
      this.mtlsValidator = new mTLSCertificateValidator(this.config.providers.mtls);
    }

    // Initialize API key manager
    if (this.config.providers.apiKey) {
      this.apiKeyManager = new APIKeyManager();
    }

    // Initialize brute force protection
    if (this.config.security.bruteForceProtection) {
      this.bruteForceProtection = new BruteForceProtector({
        freeRetries: 5,
        minWait: 1000,
        maxWait: 300000,
        lifetime: 3600000
      });
    }
  }
}

/**
 * Simple rate limiter implementation
 */
class RateLimiter {
  private requests: Array<number> = [];

  constructor(private config: RateLimitConfig) {}

  async checkRequest(): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove expired requests
    this.requests = this.requests.filter(time => time > windowStart);

    // Check if under limit
    if (this.requests.length < this.config.max) {
      this.requests.push(now);
      return true;
    }

    return false;
  }
}

/**
 * Simple brute force protector
 */
class BruteForceProtector {
  private attempts: Map<string, Array<number>> = new Map();

  constructor(private config: BruteForceConfig) {}

  async checkRequest(req: Request, res: Response): Promise<void> {
    const key = req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - this.config.lifetime;

    let attempts = this.attempts.get(key) || [];
    attempts = attempts.filter(time => time > windowStart);

    if (attempts.length >= this.config.freeRetries) {
      const waitTime = Math.min(
        this.config.maxWait,
        this.config.minWait * Math.pow(2, attempts.length - this.config.freeRetries)
      );

      const lastAttempt = attempts[attempts.length - 1];
      const timeSinceLastAttempt = now - lastAttempt;

      if (timeSinceLastAttempt < waitTime) {
        const nextValidRequest = new Date(lastAttempt + waitTime);
        
        if (this.config.failCallback) {
          this.config.failCallback(req, res, () => {}, nextValidRequest);
        } else {
          res.status(429).json({
            error: 'BRUTE_FORCE_PROTECTION',
            message: 'Too many failed attempts',
            retryAfter: nextValidRequest
          });
        }
        
        throw new Error('Brute force protection triggered');
      }
    }

    // Record this attempt
    attempts.push(now);
    this.attempts.set(key, attempts);
  }
}

/**
 * Factory function to create authentication middleware system
 */
export function createAuthenticationSystem(config: AuthConfig): AuthenticationMiddlewareSystem {
  return new AuthenticationMiddlewareSystem(config);
}