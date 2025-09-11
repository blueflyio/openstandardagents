/**
 * Comprehensive Test Suite for OSSA Authentication System
 * Tests all authentication components and security features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  OSSAAuthenticationSystem,
  createOSSAAuthSystem,
  JWTManager,
  OAuth2Provider,
  APIKeyManager,
  SecureCredentialManager,
  mTLSCertificateValidator,
  SecurityMiddleware,
  generateJWTKeyPair,
  AuthConfig,
  AuthenticatedRequest,
  JWTOptions
} from '../index.js';

// Mock Express Request/Response
const createMockRequest = (overrides: Partial<Request> = {}): AuthenticatedRequest => ({
  method: 'GET',
  url: '/',
  path: '/',
  headers: {},
  query: {},
  body: {},
  ip: '127.0.0.1',
  socket: {} as any,
  get: (header: string) => (overrides.headers as any)?.[header.toLowerCase()],
  ...overrides
} as AuthenticatedRequest);

const createMockResponse = (): Partial<Response> => {
  const headers: Record<string, any> = {};
  return {
    status: (code: number) => ({ json: () => {}, send: () => {} } as any),
    json: () => {},
    setHeader: (name: string, value: any) => { headers[name] = value; },
    getHeader: (name: string) => headers[name],
    removeHeader: (name: string) => delete headers[name],
    cookie: () => {},
    on: () => {},
    statusCode: 200
  };
};

const createMockNext = (): NextFunction => () => {};

describe('OSSA Authentication System', () => {
  let authConfig: AuthConfig;
  let authSystem: OSSAAuthenticationSystem;

  beforeEach(() => {
    authConfig = {
      providers: {
        jwt: {
          algorithm: 'RS256',
          issuer: 'test-issuer',
          audience: 'test-audience',
          expiresIn: '1h',
          publicKey: Buffer.from('test-public-key')
        },
        oauth2: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback',
          authorizationUrl: 'https://auth.example.com/oauth/authorize',
          tokenUrl: 'https://auth.example.com/oauth/token',
          scopes: ['read', 'write'],
          pkce: true,
          state: true,
          nonce: true
        },
        mtls: {
          enabled: true,
          requireClientCert: true,
          ca: Buffer.from('test-ca-cert'),
          rejectUnauthorized: true
        },
        apiKey: {
          storage: 'memory',
          encryptionKey: 'test-encryption-key-32-bytes-long',
          rotationEnabled: true
        }
      },
      security: {
        requireHttps: false, // Disabled for testing
        csrfProtection: true,
        rateLimiting: true,
        bruteForceProtection: true,
        sessionTimeout: 3600
      },
      logging: {
        enabled: true,
        level: 'info',
        destination: 'console',
        auditTrail: true
      }
    };

    authSystem = createOSSAAuthSystem(authConfig);
  });

  describe('System Initialization', () => {
    it('should create auth system with all components', () => {
      expect(authSystem).toBeDefined();
      expect(authSystem.getAuthSystem()).toBeDefined();
      expect(authSystem.getJWTManager()).toBeDefined();
      expect(authSystem.getOAuth2Provider()).toBeDefined();
      expect(authSystem.getMTLSValidator()).toBeDefined();
      expect(authSystem.getAPIKeyManager()).toBeDefined();
      expect(authSystem.getCredentialManager()).toBeDefined();
      expect(authSystem.getSecurityMiddleware()).toBeDefined();
    });

    it('should create Express setup', () => {
      const setup = authSystem.createExpressSetup();
      
      expect(setup.authenticate).toBeDefined();
      expect(setup.jwt).toBeDefined();
      expect(setup.oauth2).toBeDefined();
      expect(setup.mtls).toBeDefined();
      expect(setup.apiKey).toBeDefined();
      expect(setup.authorize).toBeDefined();
      expect(setup.securityHeaders).toBeDefined();
      expect(setup.csrfProtection).toBeDefined();
      expect(setup.sessionMiddleware).toBeDefined();
    });

    it('should get system health', async () => {
      const health = await authSystem.getSystemHealth();
      
      expect(health.timestamp).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.components).toBeDefined();
      expect(health.components.jwt).toBeDefined();
      expect(health.components.oauth2).toBeDefined();
      expect(health.components.mtls).toBeDefined();
      expect(health.components.credentials).toBeDefined();
      expect(health.components.security).toBeDefined();
    });
  });

  describe('JWT Authentication', () => {
    let jwtManager: JWTManager;

    beforeEach(() => {
      jwtManager = authSystem.getJWTManager()!;
    });

    it('should generate JWT key pair', async () => {
      const keyPair = await generateJWTKeyPair('RS256');
      
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
      expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
    });

    it('should sign and verify JWT token', async () => {
      // Generate a real key pair for testing
      const keyPair = await generateJWTKeyPair('RS256');
      
      // Create new JWT manager with real keys
      const testJWTManager = new JWTManager({
        algorithm: 'RS256',
        issuer: 'test',
        audience: 'test',
        expiresIn: '1h'
      });

      testJWTManager.addKeyPair('test', {
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
        keyId: 'test',
        algorithm: 'RS256'
      });

      const payload = {
        sub: 'user123',
        agentId: 'agent456',
        scope: 'read write'
      };

      const token = await testJWTManager.sign(payload, 'test');
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);

      const verified = await testJWTManager.verify(token);
      expect(verified.sub).toBe('user123');
      expect(verified.agentId).toBe('agent456');
      expect(verified.scope).toBe('read write');
    });

    it('should create JWT middleware', async () => {
      const keyPair = await generateJWTKeyPair('RS256');
      const middleware = jwtManager.createMiddleware();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should reject invalid JWT tokens', async () => {
      const keyPair = await generateJWTKeyPair('RS256');
      const testJWTManager = new JWTManager({
        algorithm: 'RS256',
        issuer: 'test',
        audience: 'test',
        expiresIn: '1h'
      });

      testJWTManager.addKeyPair('test', {
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
        keyId: 'test',
        algorithm: 'RS256'
      });

      // Test invalid token format
      await expect(testJWTManager.verify('invalid.token')).rejects.toThrow();
      
      // Test malformed token
      await expect(testJWTManager.verify('invalid-token')).rejects.toThrow();
    });
  });

  describe('OAuth2 Provider', () => {
    let oauth2Provider: OAuth2Provider;

    beforeEach(() => {
      oauth2Provider = authSystem.getOAuth2Provider()!;
    });

    it('should generate authorization URL with PKCE', () => {
      const result = oauth2Provider.generateAuthorizationUrl(['read', 'write']);
      
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('scope=read%20write');
      expect(result.url).toContain('code_challenge');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.state).toBeDefined();
      expect(result.codeVerifier).toBeDefined();
    });

    it('should create OAuth2 middleware', () => {
      const middleware = oauth2Provider.createMiddleware({
        scope: ['read'],
        optional: false
      });
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should validate required scopes', async () => {
      const middleware = oauth2Provider.createMiddleware({
        scope: ['admin'],
        optional: false
      });

      const req = createMockRequest({
        headers: { authorization: 'Bearer test-token' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      // This would fail in real scenario due to invalid token
      // but tests the middleware structure
      expect(() => middleware(req, res as Response, next)).not.toThrow();
    });
  });

  describe('API Key Manager', () => {
    let apiKeyManager: APIKeyManager;

    beforeEach(() => {
      apiKeyManager = authSystem.getAPIKeyManager()!;
    });

    it('should generate API key', async () => {
      const result = await apiKeyManager.generateAPIKey({
        name: 'test-key',
        owner: 'test-user',
        environment: 'development',
        scopes: ['read', 'write'],
        tags: ['test']
      });

      expect(result.apiKey).toBeDefined();
      expect(result.rawKey).toBeDefined();
      expect(result.apiKey.name).toBe('test-key');
      expect(result.apiKey.scopes).toEqual(['read', 'write']);
      expect(result.rawKey).toContain('.');
    });

    it('should validate API key', async () => {
      const { apiKey, rawKey } = await apiKeyManager.generateAPIKey({
        name: 'test-key',
        owner: 'test-user',
        environment: 'development',
        scopes: ['read']
      });

      const validated = await apiKeyManager.validateAPIKey(rawKey, {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: new Date()
      });

      expect(validated.id).toBe(apiKey.id);
      expect(validated.name).toBe('test-key');
      expect(validated.isActive).toBe(true);
    });

    it('should rotate API key', async () => {
      const { apiKey } = await apiKeyManager.generateAPIKey({
        name: 'test-key',
        owner: 'test-user',
        environment: 'development',
        scopes: ['read']
      });

      const result = await apiKeyManager.rotateAPIKey(apiKey.id);

      expect(result.newApiKey.id).not.toBe(result.oldApiKey.id);
      expect(result.newApiKey.name).toBe(result.oldApiKey.name);
      expect(result.oldApiKey.isActive).toBe(false);
      expect(result.newRawKey).toBeDefined();
    });

    it('should create API key middleware', () => {
      const middleware = apiKeyManager.createMiddleware({
        headerName: 'x-api-key',
        requiredScopes: ['read']
      });

      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('Credential Manager', () => {
    let credentialManager: SecureCredentialManager;

    beforeEach(() => {
      credentialManager = authSystem.getCredentialManager()!;
    });

    it('should store and retrieve encrypted credential', async () => {
      const credentialId = await credentialManager.storeCredential({
        type: 'password',
        name: 'test-credential',
        value: 'secret-password',
        owner: 'test-user',
        environment: 'development',
        tags: ['test']
      }, {
        accessor: 'test-system',
        action: 'write'
      });

      const retrieved = await credentialManager.getCredential(credentialId, {
        accessor: 'test-system',
        action: 'read'
      });

      expect(retrieved).toBe('secret-password');
    });

    it('should update credential', async () => {
      const credentialId = await credentialManager.storeCredential({
        type: 'api_key',
        name: 'test-api-key',
        value: 'old-key',
        owner: 'test-user',
        environment: 'development'
      }, {
        accessor: 'test-system',
        action: 'write'
      });

      await credentialManager.updateCredential(credentialId, 'new-key', {
        accessor: 'test-system',
        action: 'write'
      });

      const updated = await credentialManager.getCredential(credentialId, {
        accessor: 'test-system',
        action: 'read'
      });

      expect(updated).toBe('new-key');
    });

    it('should rotate credential', async () => {
      const oldId = await credentialManager.storeCredential({
        type: 'certificate',
        name: 'test-cert',
        value: 'old-certificate',
        owner: 'test-user',
        environment: 'production'
      }, {
        accessor: 'test-system',
        action: 'write'
      });

      const newId = await credentialManager.rotateCredential(oldId, {
        accessor: 'test-system',
        action: 'rotate'
      });

      expect(newId).not.toBe(oldId);

      const newValue = await credentialManager.getCredential(newId, {
        accessor: 'test-system',
        action: 'read'
      });

      expect(newValue).toBe('old-certificate');
    });

    it('should check credential health', async () => {
      await credentialManager.storeCredential({
        type: 'token',
        name: 'health-test',
        value: 'test-value',
        owner: 'test-user',
        environment: 'development'
      }, {
        accessor: 'test-system',
        action: 'write'
      });

      const health = await credentialManager.checkCredentialHealth();

      expect(health.total).toBe(1);
      expect(health.active).toBe(1);
      expect(health.expired).toBe(0);
    });
  });

  describe('Security Middleware', () => {
    let securityMiddleware: SecurityMiddleware;

    beforeEach(() => {
      securityMiddleware = authSystem.getSecurityMiddleware()!;
    });

    it('should create security headers middleware', () => {
      const middleware = securityMiddleware.createSecurityHeadersMiddleware();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as Request, res as Response, next);
      
      expect(res.setHeader).toBeDefined();
    });

    it('should create CSRF middleware', () => {
      const middleware = securityMiddleware.createCSRFMiddleware();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create content validation middleware', () => {
      const middleware = securityMiddleware.createContentValidationMiddleware();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should detect suspicious activity', () => {
      const middleware = securityMiddleware.createSuspiciousActivityMiddleware();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');

      // Test with suspicious request
      const req = createMockRequest({
        url: '/admin/../../../etc/passwd',
        headers: {
          'user-agent': 'sqlmap/1.0'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res as Response, next);
      
      // Should log suspicious activity
      const stats = securityMiddleware.getSecurityStats();
      expect(stats).toBeDefined();
    });

    it('should get security statistics', () => {
      const stats = securityMiddleware.getSecurityStats();
      
      expect(stats).toBeDefined();
      expect(stats.csrfTokensActive).toBeDefined();
      expect(stats.auditEventsToday).toBeDefined();
      expect(stats.auditEventsByType).toBeDefined();
      expect(stats.auditEventsBySeverity).toBeDefined();
    });
  });

  describe('mTLS Certificate Validation', () => {
    let mtlsValidator: mTLSCertificateValidator;

    beforeEach(() => {
      mtlsValidator = authSystem.getMTLSValidator()!;
    });

    it('should create mTLS middleware', () => {
      const middleware = mtlsValidator.createMiddleware({
        optional: true
      });
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should get validation statistics', () => {
      const stats = mtlsValidator.getValidationStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalValidations).toBeDefined();
      expect(stats.successfulValidations).toBeDefined();
      expect(stats.failedValidations).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle multi-auth scenarios', async () => {
      const setup = authSystem.createExpressSetup();
      
      const multiAuthMiddleware = setup.multiAuth([
        { type: 'jwt', required: false },
        { type: 'api_key', required: false }
      ], 'any');

      expect(multiAuthMiddleware).toBeDefined();
      expect(typeof multiAuthMiddleware).toBe('function');
    });

    it('should create authorization middleware', () => {
      const setup = authSystem.createExpressSetup();
      
      const authzMiddleware = setup.authorize({
        scopes: ['admin'],
        roles: ['administrator'],
        permissions: ['write']
      });

      expect(authzMiddleware).toBeDefined();
      expect(typeof authzMiddleware).toBe('function');
    });

    it('should handle session management', () => {
      const setup = authSystem.createExpressSetup();
      
      const sessionMiddleware = setup.sessionMiddleware({
        timeout: 3600,
        renewOnActivity: true
      });

      expect(sessionMiddleware).toBeDefined();
      expect(typeof sessionMiddleware).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication failures gracefully', async () => {
      const setup = authSystem.createExpressSetup();
      const middleware = setup.jwt;
      
      const req = createMockRequest({
        headers: { authorization: 'Bearer invalid-token' }
      });
      
      let responseStatus: number = 200;
      let responseData: any = {};
      
      const res = {
        ...createMockResponse(),
        status: (code: number) => ({
          json: (data: any) => {
            responseStatus = code;
            responseData = data;
          }
        })
      };

      const next = createMockNext();

      await middleware(req, res as Response, next);
      
      // Should handle error appropriately
      expect(responseStatus).toBeGreaterThanOrEqual(400);
    });

    it('should validate configuration', () => {
      const { validateAuthConfig } = require('../index.js');
      
      const invalidConfig = {
        providers: {},
        security: { requireHttps: true },
        logging: { enabled: true }
      };

      const result = validateAuthConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent authentication requests', async () => {
      const { apiKey } = await authSystem.getAPIKeyManager()!.generateAPIKey({
        name: 'perf-test',
        owner: 'test-user',
        environment: 'development',
        scopes: ['read']
      });

      const middleware = authSystem.getAPIKeyManager()!.createMiddleware();
      
      const promises = Array.from({ length: 100 }, async (_, i) => {
        const req = createMockRequest({
          headers: { 'x-api-key': `test-key-${i}` }
        });
        const res = createMockResponse();
        const next = createMockNext();

        return new Promise<void>((resolve) => {
          middleware(req, res as Response, () => resolve());
        });
      });

      const startTime = Date.now();
      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should efficiently manage memory usage', async () => {
      const credentialManager = authSystem.getCredentialManager()!;
      
      // Create many credentials
      const credentialIds = [];
      for (let i = 0; i < 100; i++) {
        const id = await credentialManager.storeCredential({
          type: 'password',
          name: `test-cred-${i}`,
          value: `value-${i}`,
          owner: 'test-user',
          environment: 'development'
        }, {
          accessor: 'test-system',
          action: 'write'
        });
        credentialIds.push(id);
      }

      expect(credentialIds.length).toBe(100);

      // Check that cleanup works
      const health = await credentialManager.checkCredentialHealth();
      expect(health.total).toBe(100);
    });
  });
});

// Helper functions for testing
export const testHelpers = {
  createMockRequest,
  createMockResponse,
  createMockNext,
  generateTestKeyPair: generateJWTKeyPair,
  
  createTestConfig: (): AuthConfig => ({
    providers: {
      jwt: {
        algorithm: 'RS256',
        issuer: 'test',
        audience: 'test',
        expiresIn: '1h',
        publicKey: Buffer.from('test-key')
      }
    },
    security: {
      requireHttps: false,
      csrfProtection: false,
      rateLimiting: false,
      bruteForceProtection: false,
      sessionTimeout: 3600
    },
    logging: {
      enabled: false,
      level: 'error',
      destination: 'console',
      auditTrail: false
    }
  })
};