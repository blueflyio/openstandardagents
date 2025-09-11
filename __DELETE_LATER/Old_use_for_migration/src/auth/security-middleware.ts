/**
 * Security Middleware with CSRF Protection and Enhanced Security Features
 * OSSA v0.1.8 compliant security hardening middleware
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import {
  AuthenticatedRequest,
  AuthenticationError,
  RateLimitConfig,
  BruteForceConfig
} from './types.js';

export interface CSRFConfig {
  enabled: boolean;
  tokenName: string;
  headerName: string;
  cookieName: string;
  saltLength: number;
  secret: string;
  secureCookie: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  ignoreMethods: string[];
  skipFailureAudit: boolean;
}

export interface SecurityHeadersConfig {
  contentTypeOptions: boolean;
  frameOptions: 'DENY' | 'SAMEORIGIN' | string;
  xssProtection: boolean;
  strictTransportSecurity: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  contentSecurityPolicy: string | false;
  referrerPolicy: string;
  permissionsPolicy: string | false;
  crossOriginEmbedderPolicy: 'require-corp' | 'credentialless' | false;
  crossOriginOpenerPolicy: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none' | false;
  crossOriginResourcePolicy: 'same-site' | 'same-origin' | 'cross-origin' | false;
}

export interface ContentValidationConfig {
  maxRequestSize: string; // e.g., '10mb'
  allowedContentTypes: string[];
  validateJsonStructure: boolean;
  preventXmlExternalEntities: boolean;
  sanitizeHtml: boolean;
}

export interface SecurityAuditConfig {
  enabled: boolean;
  logFailedAttempts: boolean;
  logSuccessfulAuth: boolean;
  logSuspiciousActivity: boolean;
  storage: 'console' | 'file' | 'database';
  retentionDays: number;
}

export interface SecurityEvent {
  timestamp: Date;
  type: 'auth_success' | 'auth_failure' | 'csrf_failure' | 'rate_limit' | 'brute_force' | 'suspicious_activity';
  ip: string;
  userAgent?: string;
  userId?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityMiddleware {
  private csrfTokens: Map<string, { token: string; expires: Date }> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private bruteForceTrackers: Map<string, BruteForceTracker> = new Map();
  private securityAuditLog: SecurityEvent[] = [];

  constructor(
    private csrfConfig: CSRFConfig,
    private headersConfig: SecurityHeadersConfig,
    private contentConfig: ContentValidationConfig,
    private auditConfig: SecurityAuditConfig
  ) {
    this.startCleanupTimers();
  }

  /**
   * Create CSRF protection middleware
   */
  createCSRFMiddleware() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!this.csrfConfig.enabled) {
          return next();
        }

        // Skip CSRF for ignored methods
        if (this.csrfConfig.ignoreMethods.includes(req.method)) {
          return next();
        }

        // For safe methods, generate and set token
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          this.generateCSRFToken(req, res);
          return next();
        }

        // For unsafe methods, validate token
        this.validateCSRFToken(req, res);
        next();

      } catch (error) {
        if (error instanceof AuthenticationError) {
          if (!this.csrfConfig.skipFailureAudit) {
            this.logSecurityEvent({
              type: 'csrf_failure',
              ip: req.ip || 'unknown',
              userAgent: req.get('User-Agent'),
              userId: req.auth?.user?.id,
              details: {
                method: req.method,
                url: req.url,
                error: error.message
              },
              severity: 'high'
            });
          }

          res.status(403).json({
            error: 'CSRF_PROTECTION_FAILED',
            message: 'CSRF token validation failed'
          });
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * Create security headers middleware
   */
  createSecurityHeadersMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // X-Content-Type-Options
      if (this.headersConfig.contentTypeOptions) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }

      // X-Frame-Options
      if (this.headersConfig.frameOptions) {
        res.setHeader('X-Frame-Options', this.headersConfig.frameOptions);
      }

      // X-XSS-Protection
      if (this.headersConfig.xssProtection) {
        res.setHeader('X-XSS-Protection', '1; mode=block');
      }

      // Strict-Transport-Security
      if (this.headersConfig.strictTransportSecurity) {
        const sts = this.headersConfig.strictTransportSecurity;
        let stsValue = `max-age=${sts.maxAge}`;
        
        if (sts.includeSubDomains) {
          stsValue += '; includeSubDomains';
        }
        
        if (sts.preload) {
          stsValue += '; preload';
        }
        
        res.setHeader('Strict-Transport-Security', stsValue);
      }

      // Content-Security-Policy
      if (this.headersConfig.contentSecurityPolicy) {
        res.setHeader('Content-Security-Policy', this.headersConfig.contentSecurityPolicy);
      }

      // Referrer-Policy
      if (this.headersConfig.referrerPolicy) {
        res.setHeader('Referrer-Policy', this.headersConfig.referrerPolicy);
      }

      // Permissions-Policy
      if (this.headersConfig.permissionsPolicy) {
        res.setHeader('Permissions-Policy', this.headersConfig.permissionsPolicy);
      }

      // Cross-Origin-Embedder-Policy
      if (this.headersConfig.crossOriginEmbedderPolicy) {
        res.setHeader('Cross-Origin-Embedder-Policy', this.headersConfig.crossOriginEmbedderPolicy);
      }

      // Cross-Origin-Opener-Policy
      if (this.headersConfig.crossOriginOpenerPolicy) {
        res.setHeader('Cross-Origin-Opener-Policy', this.headersConfig.crossOriginOpenerPolicy);
      }

      // Cross-Origin-Resource-Policy
      if (this.headersConfig.crossOriginResourcePolicy) {
        res.setHeader('Cross-Origin-Resource-Policy', this.headersConfig.crossOriginResourcePolicy);
      }

      // Remove identifying headers
      res.removeHeader('X-Powered-By');
      res.setHeader('Server', 'OSSA/1.0');

      next();
    };
  }

  /**
   * Create content validation middleware
   */
  createContentValidationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate content type
        const contentType = req.get('Content-Type');
        if (contentType && this.contentConfig.allowedContentTypes.length > 0) {
          const isAllowed = this.contentConfig.allowedContentTypes.some(allowed =>
            contentType.toLowerCase().includes(allowed.toLowerCase())
          );
          
          if (!isAllowed) {
            throw new AuthenticationError(
              `Content type ${contentType} not allowed`,
              'INVALID_CONTENT_TYPE',
              415
            );
          }
        }

        // Validate request size (this should be handled by body parser, but we double-check)
        const contentLength = req.get('Content-Length');
        if (contentLength) {
          const maxSize = this.parseSize(this.contentConfig.maxRequestSize);
          const requestSize = parseInt(contentLength, 10);
          
          if (requestSize > maxSize) {
            throw new AuthenticationError(
              'Request too large',
              'REQUEST_TOO_LARGE',
              413
            );
          }
        }

        // Validate JSON structure if enabled
        if (this.contentConfig.validateJsonStructure && 
            contentType?.includes('application/json') && 
            req.body) {
          this.validateJsonStructure(req.body);
        }

        // Prevent XML External Entities if enabled
        if (this.contentConfig.preventXmlExternalEntities && 
            contentType?.includes('xml')) {
          this.validateXmlContent(req.body);
        }

        next();

      } catch (error) {
        if (error instanceof AuthenticationError) {
          res.status(error.statusCode).json({
            error: error.code,
            message: error.message
          });
        } else {
          res.status(400).json({
            error: 'CONTENT_VALIDATION_ERROR',
            message: 'Content validation failed'
          });
        }
      }
    };
  }

  /**
   * Create advanced rate limiting middleware
   */
  createAdvancedRateLimitingMiddleware(configs: {
    global?: RateLimitConfig;
    perUser?: RateLimitConfig;
    perEndpoint?: Record<string, RateLimitConfig>;
  }) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const checks: Array<{ name: string; config: RateLimitConfig; key: string }> = [];

        // Global rate limiting
        if (configs.global) {
          checks.push({
            name: 'global',
            config: configs.global,
            key: 'global'
          });
        }

        // Per-user rate limiting
        if (configs.perUser && req.auth?.user) {
          checks.push({
            name: 'per-user',
            config: configs.perUser,
            key: `user:${req.auth.user.id}`
          });
        }

        // Per-endpoint rate limiting
        if (configs.perEndpoint) {
          const endpoint = `${req.method}:${req.route?.path || req.path}`;
          const endpointConfig = configs.perEndpoint[endpoint];
          
          if (endpointConfig) {
            checks.push({
              name: 'per-endpoint',
              config: endpointConfig,
              key: `endpoint:${endpoint}`
            });
          }
        }

        // Check all rate limits
        for (const check of checks) {
          const rateLimiter = this.getRateLimiter(check.key, check.config);
          const allowed = await rateLimiter.checkRequest();
          
          if (!allowed) {
            this.logSecurityEvent({
              type: 'rate_limit',
              ip: req.ip || 'unknown',
              userAgent: req.get('User-Agent'),
              userId: req.auth?.user?.id,
              details: {
                limitType: check.name,
                endpoint: req.path
              },
              severity: 'medium'
            });

            res.status(429).json({
              error: 'RATE_LIMIT_EXCEEDED',
              message: `${check.name} rate limit exceeded`,
              retryAfter: Math.ceil(check.config.windowMs / 1000)
            });
            
            return;
          }
        }

        next();

      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Create brute force protection middleware
   */
  createBruteForceProtectionMiddleware(config: BruteForceConfig) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const tracker = this.getBruteForceTracker(key, config);
      
      if (!tracker.isAllowed()) {
        const nextValidRequest = tracker.getNextAllowedTime();
        
        this.logSecurityEvent({
          type: 'brute_force',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          details: {
            attempts: tracker.getAttemptCount(),
            nextValidRequest: nextValidRequest.toISOString()
          },
          severity: 'high'
        });

        if (config.failCallback) {
          config.failCallback(req, res, next, nextValidRequest);
        } else {
          res.status(429).json({
            error: 'BRUTE_FORCE_PROTECTION',
            message: 'Too many failed attempts',
            retryAfter: nextValidRequest.toISOString()
          });
        }
        
        return;
      }

      // Record failed attempts on authentication failures
      res.on('finish', () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          tracker.recordFailedAttempt();
        } else if (res.statusCode < 400) {
          tracker.recordSuccessfulAttempt();
        }
      });

      next();
    };
  }

  /**
   * Create suspicious activity detection middleware
   */
  createSuspiciousActivityMiddleware() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const suspiciousIndicators = this.detectSuspiciousActivity(req);
      
      if (suspiciousIndicators.length > 0) {
        this.logSecurityEvent({
          type: 'suspicious_activity',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          userId: req.auth?.user?.id,
          details: {
            indicators: suspiciousIndicators,
            url: req.url,
            method: req.method,
            headers: this.sanitizeHeaders(req.headers)
          },
          severity: suspiciousIndicators.length > 2 ? 'critical' : 'medium'
        });

        // Optional: Block highly suspicious requests
        if (suspiciousIndicators.length > 3) {
          res.status(403).json({
            error: 'SUSPICIOUS_ACTIVITY_BLOCKED',
            message: 'Request blocked due to suspicious activity'
          });
          return;
        }
      }

      next();
    };
  }

  /**
   * Generate CSRF token
   */
  private generateCSRFToken(req: AuthenticatedRequest, res: Response): void {
    const sessionId = req.auth?.metadata?.sessionId || req.sessionID || 'anonymous';
    const tokenValue = randomBytes(16).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create token with secret
    const token = this.createCSRFToken(tokenValue);
    
    // Store token
    this.csrfTokens.set(sessionId, { token: tokenValue, expires });

    // Set cookie
    res.cookie(this.csrfConfig.cookieName, token, {
      httpOnly: false, // Client needs to read this
      secure: this.csrfConfig.secureCookie,
      sameSite: this.csrfConfig.sameSite,
      expires
    });

    // Set header for AJAX requests
    res.setHeader('X-CSRF-Token', token);
  }

  /**
   * Validate CSRF token
   */
  private validateCSRFToken(req: AuthenticatedRequest, res: Response): void {
    const sessionId = req.auth?.metadata?.sessionId || req.sessionID || 'anonymous';
    const storedTokenData = this.csrfTokens.get(sessionId);
    
    if (!storedTokenData) {
      throw new AuthenticationError('No CSRF token found in session', 'CSRF_TOKEN_MISSING');
    }

    if (storedTokenData.expires < new Date()) {
      this.csrfTokens.delete(sessionId);
      throw new AuthenticationError('CSRF token has expired', 'CSRF_TOKEN_EXPIRED');
    }

    // Get token from request (header or form data)
    let providedToken = req.get(this.csrfConfig.headerName) || req.body?.[this.csrfConfig.tokenName];
    
    if (!providedToken) {
      throw new AuthenticationError('CSRF token not provided', 'CSRF_TOKEN_NOT_PROVIDED');
    }

    // Verify token
    if (!this.verifyCSRFToken(providedToken, storedTokenData.token)) {
      throw new AuthenticationError('Invalid CSRF token', 'CSRF_TOKEN_INVALID');
    }
  }

  /**
   * Create CSRF token with HMAC
   */
  private createCSRFToken(tokenValue: string): string {
    const salt = randomBytes(this.csrfConfig.saltLength).toString('hex');
    const hash = createHash('sha256')
      .update(tokenValue + salt + this.csrfConfig.secret)
      .digest('hex');
    
    return `${salt}.${hash}`;
  }

  /**
   * Verify CSRF token
   */
  private verifyCSRFToken(providedToken: string, storedTokenValue: string): boolean {
    try {
      const [salt, hash] = providedToken.split('.');
      if (!salt || !hash) return false;

      const expectedHash = createHash('sha256')
        .update(storedTokenValue + salt + this.csrfConfig.secret)
        .digest('hex');

      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Validate JSON structure for security
   */
  private validateJsonStructure(data: any): void {
    // Check for prototype pollution attempts
    if (typeof data === 'object' && data !== null) {
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      
      const checkObject = (obj: any, path: string = ''): void => {
        if (typeof obj !== 'object' || obj === null) return;

        for (const key of Object.keys(obj)) {
          if (dangerousKeys.includes(key)) {
            throw new Error(`Dangerous key detected: ${path}${key}`);
          }
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            checkObject(obj[key], `${path}${key}.`);
          }
        }
      };

      checkObject(data);
    }

    // Check for excessively nested structures (DoS prevention)
    const maxDepth = 10;
    const checkDepth = (obj: any, depth: number = 0): void => {
      if (depth > maxDepth) {
        throw new Error('JSON structure too deeply nested');
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          checkDepth(value, depth + 1);
        }
      }
    };

    checkDepth(data);
  }

  /**
   * Validate XML content for XXE attacks
   */
  private validateXmlContent(content: string): void {
    if (typeof content !== 'string') return;

    // Check for external entity declarations
    const xxePatterns = [
      /<!ENTITY\s+\w+\s+SYSTEM/i,
      /<!ENTITY\s+\w+\s+PUBLIC/i,
      /<!DOCTYPE.*SYSTEM/i,
      /<!DOCTYPE.*PUBLIC/i
    ];

    for (const pattern of xxePatterns) {
      if (pattern.test(content)) {
        throw new Error('XML External Entity (XXE) attack detected');
      }
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(req: AuthenticatedRequest): string[] {
    const indicators: string[] = [];

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/i,
      /(\bor\b\s+\d+\s*=\s*\d+)|(\band\b\s+\d+\s*=\s*\d+)/i,
      /(\bdrop\b\s+\btable\b)|(\bdelete\b\s+\bfrom\b)/i,
      /(\binsert\b\s+\binto\b)|(\bupdate\b.*\bset\b)/i
    ];

    const checkText = JSON.stringify(req.query) + JSON.stringify(req.body);
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(checkText)) {
        indicators.push('sql_injection_attempt');
        break;
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(checkText)) {
        indicators.push('xss_attempt');
        break;
      }
    }

    // Check for unusual user agents
    const userAgent = req.get('User-Agent') || '';
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /burp/i,
      /nessus/i,
      /nmap/i,
      /masscan/i,
      /zap/i
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        indicators.push('suspicious_user_agent');
        break;
      }
    }

    // Check for path traversal attempts
    const pathTraversalPatterns = [
      /\.\.\//,
      /\.\.%2f/i,
      /\.\.%5c/i,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i
    ];

    const url = req.url;
    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(url)) {
        indicators.push('path_traversal_attempt');
        break;
      }
    }

    // Check for unusual request frequency from same IP
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowSize = 60000; // 1 minute
    
    if (!this.requestFrequency) {
      this.requestFrequency = new Map();
    }
    
    const requests = this.requestFrequency.get(ip) || [];
    const recentRequests = requests.filter(time => now - time < windowSize);
    recentRequests.push(now);
    this.requestFrequency.set(ip, recentRequests);

    if (recentRequests.length > 100) {
      indicators.push('high_request_frequency');
    }

    return indicators;
  }

  private requestFrequency?: Map<string, number[]>;

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  /**
   * Get or create rate limiter for key
   */
  private getRateLimiter(key: string, config: RateLimitConfig): RateLimiter {
    let rateLimiter = this.rateLimiters.get(key);
    if (!rateLimiter) {
      rateLimiter = new RateLimiter(config);
      this.rateLimiters.set(key, rateLimiter);
    }
    return rateLimiter;
  }

  /**
   * Get or create brute force tracker for key
   */
  private getBruteForceTracker(key: string, config: BruteForceConfig): BruteForceTracker {
    let tracker = this.bruteForceTrackers.get(key);
    if (!tracker) {
      tracker = new BruteForceTracker(config);
      this.bruteForceTrackers.set(key, tracker);
    }
    return tracker;
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    if (!this.auditConfig.enabled) return;

    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.securityAuditLog.push(fullEvent);

    // Keep only recent events in memory
    const retentionTime = this.auditConfig.retentionDays * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - retentionTime);
    this.securityAuditLog = this.securityAuditLog.filter(e => e.timestamp > cutoff);

    // Output based on configuration
    if (this.auditConfig.storage === 'console') {
      console.log('SECURITY_EVENT:', JSON.stringify(fullEvent, null, 2));
    }
    // Additional storage implementations would go here
  }

  /**
   * Parse size string to bytes
   */
  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };

    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/);
    if (!match) {
      throw new Error(`Invalid size format: ${sizeStr}`);
    }

    const [, amount, unit = 'b'] = match;
    return parseFloat(amount) * units[unit];
  }

  /**
   * Start cleanup timers
   */
  private startCleanupTimers(): void {
    // Clean expired CSRF tokens every 15 minutes
    setInterval(() => {
      const now = new Date();
      for (const [key, data] of this.csrfTokens.entries()) {
        if (data.expires < now) {
          this.csrfTokens.delete(key);
        }
      }
    }, 15 * 60 * 1000);

    // Clean old rate limit data every hour
    setInterval(() => {
      for (const [key, limiter] of this.rateLimiters.entries()) {
        limiter.cleanup();
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Get security audit log
   */
  getSecurityAuditLog(): SecurityEvent[] {
    return [...this.securityAuditLog];
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    csrfTokensActive: number;
    rateLimitersActive: number;
    bruteForceTrackersActive: number;
    auditEventsToday: number;
    auditEventsByType: Record<string, number>;
    auditEventsBySeverity: Record<string, number>;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEvents = this.securityAuditLog.filter(e => e.timestamp >= today);
    
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    
    for (const event of todayEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    }

    return {
      csrfTokensActive: this.csrfTokens.size,
      rateLimitersActive: this.rateLimiters.size,
      bruteForceTrackersActive: this.bruteForceTrackers.size,
      auditEventsToday: todayEvents.length,
      auditEventsByType: eventsByType,
      auditEventsBySeverity: eventsBySeverity
    };
  }
}

/**
 * Simple rate limiter implementation
 */
class RateLimiter {
  private requests: number[] = [];

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

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    this.requests = this.requests.filter(time => time > windowStart);
  }
}

/**
 * Brute force tracker implementation
 */
class BruteForceTracker {
  private attempts: number[] = [];
  private lastSuccessfulAttempt?: number;

  constructor(private config: BruteForceConfig) {}

  recordFailedAttempt(): void {
    this.attempts.push(Date.now());
    
    // Keep only recent attempts
    const cutoff = Date.now() - this.config.lifetime;
    this.attempts = this.attempts.filter(time => time > cutoff);
  }

  recordSuccessfulAttempt(): void {
    this.lastSuccessfulAttempt = Date.now();
    // Reset attempts on successful authentication
    this.attempts = [];
  }

  isAllowed(): boolean {
    const now = Date.now();
    const cutoff = now - this.config.lifetime;
    
    // Clean old attempts
    this.attempts = this.attempts.filter(time => time > cutoff);

    if (this.attempts.length < this.config.freeRetries) {
      return true;
    }

    // Calculate wait time based on exponential backoff
    const lastAttempt = this.attempts[this.attempts.length - 1];
    const attemptsOverLimit = this.attempts.length - this.config.freeRetries;
    const waitTime = Math.min(
      this.config.maxWait,
      this.config.minWait * Math.pow(2, attemptsOverLimit)
    );

    return (now - lastAttempt) >= waitTime;
  }

  getNextAllowedTime(): Date {
    if (this.isAllowed()) {
      return new Date();
    }

    const lastAttempt = this.attempts[this.attempts.length - 1];
    const attemptsOverLimit = this.attempts.length - this.config.freeRetries;
    const waitTime = Math.min(
      this.config.maxWait,
      this.config.minWait * Math.pow(2, attemptsOverLimit)
    );

    return new Date(lastAttempt + waitTime);
  }

  getAttemptCount(): number {
    return this.attempts.length;
  }
}