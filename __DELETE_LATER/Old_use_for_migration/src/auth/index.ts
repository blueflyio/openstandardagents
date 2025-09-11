/**
 * OSSA Authentication System
 * OAuth2/JWT authentication middleware with mTLS certificates, API key rotation, and secure credential management
 * OSSA v0.1.8 compliant comprehensive authentication solution
 */

// Core Types
export * from './types.js';

// JWT Authentication
export {
  JWTManager,
  createJWTMiddleware,
  generateJWTKeyPair
} from './jwt-middleware.js';

// OAuth2 Provider
export {
  OAuth2Provider
} from './oauth2-provider.js';

// mTLS Certificate Validation
export {
  mTLSCertificateValidator,
  createMTLSMiddleware
} from './mtls-middleware.js';

// API Key Management
export {
  APIKeyManager,
  MemoryAPIKeyStorage
} from './api-key-manager.js';

// Credential Management
export {
  SecureCredentialManager,
  MemoryCredentialStorage
} from './credential-manager.js';

// Security Middleware
export {
  SecurityMiddleware
} from './security-middleware.js';

// Main Integration Layer
export {
  AuthenticationMiddlewareSystem,
  createAuthenticationSystem
} from './middleware-integration.js';

import { AuthConfig } from './types.js';
import { AuthenticationMiddlewareSystem } from './middleware-integration.js';
import { JWTManager, generateJWTKeyPair } from './jwt-middleware.js';
import { OAuth2Provider } from './oauth2-provider.js';
import { mTLSCertificateValidator } from './mtls-middleware.js';
import { APIKeyManager } from './api-key-manager.js';
import { SecureCredentialManager } from './credential-manager.js';
import { SecurityMiddleware } from './security-middleware.js';

/**
 * OSSA Authentication System Factory
 * Creates a complete authentication system with all components configured
 */
export class OSSAAuthenticationSystem {
  private authSystem: AuthenticationMiddlewareSystem;
  private jwtManager?: JWTManager;
  private oauth2Provider?: OAuth2Provider;
  private mtlsValidator?: mTLSCertificateValidator;
  private apiKeyManager?: APIKeyManager;
  private credentialManager?: SecureCredentialManager;
  private securityMiddleware?: SecurityMiddleware;

  constructor(config: AuthConfig) {
    this.authSystem = new AuthenticationMiddlewareSystem(config);
    this.initializeComponents(config);
  }

  /**
   * Get the main authentication middleware system
   */
  getAuthSystem(): AuthenticationMiddlewareSystem {
    return this.authSystem;
  }

  /**
   * Get JWT manager instance
   */
  getJWTManager(): JWTManager | undefined {
    return this.jwtManager;
  }

  /**
   * Get OAuth2 provider instance
   */
  getOAuth2Provider(): OAuth2Provider | undefined {
    return this.oauth2Provider;
  }

  /**
   * Get mTLS validator instance
   */
  getMTLSValidator(): mTLSCertificateValidator | undefined {
    return this.mtlsValidator;
  }

  /**
   * Get API key manager instance
   */
  getAPIKeyManager(): APIKeyManager | undefined {
    return this.apiKeyManager;
  }

  /**
   * Get credential manager instance
   */
  getCredentialManager(): SecureCredentialManager | undefined {
    return this.credentialManager;
  }

  /**
   * Get security middleware instance
   */
  getSecurityMiddleware(): SecurityMiddleware | undefined {
    return this.securityMiddleware;
  }

  /**
   * Generate complete authentication setup for Express.js application
   */
  createExpressSetup() {
    return {
      // Main authentication middleware
      authenticate: this.authSystem.createAuthMiddleware(),
      
      // Specific authentication methods
      jwt: this.authSystem.createSpecificMiddleware('jwt'),
      oauth2: this.authSystem.createSpecificMiddleware('oauth2'),
      mtls: this.authSystem.createSpecificMiddleware('mtls'),
      apiKey: this.authSystem.createSpecificMiddleware('api_key'),
      
      // Authorization middleware factory
      authorize: (requirements: any) => this.authSystem.createAuthorizationMiddleware(requirements),
      
      // Security features
      securityHeaders: this.securityMiddleware?.createSecurityHeadersMiddleware(),
      csrfProtection: this.securityMiddleware?.createCSRFMiddleware(),
      contentValidation: this.securityMiddleware?.createContentValidationMiddleware(),
      bruteForceProtection: this.securityMiddleware?.createBruteForceProtectionMiddleware({
        freeRetries: 5,
        minWait: 1000,
        maxWait: 300000,
        lifetime: 3600000
      }),
      
      // Session management
      sessionMiddleware: this.authSystem.createSessionMiddleware(),
      
      // Multi-auth support
      multiAuth: (methods: any[], strategy?: 'any' | 'all') => 
        this.authSystem.createMultiAuthMiddleware(methods, strategy)
    };
  }

  /**
   * Get system health and statistics
   */
  async getSystemHealth() {
    const health: any = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      components: {}
    };

    // JWT Manager health
    if (this.jwtManager) {
      health.components.jwt = {
        status: 'active',
        // Add JWT-specific health metrics
      };
    }

    // OAuth2 Provider health
    if (this.oauth2Provider) {
      health.components.oauth2 = {
        status: 'active',
        // Add OAuth2-specific health metrics
      };
    }

    // mTLS Validator health
    if (this.mtlsValidator) {
      health.components.mtls = {
        status: 'active',
        ...this.mtlsValidator.getValidationStats()
      };
    }

    // API Key Manager health
    if (this.apiKeyManager) {
      health.components.apiKeys = {
        status: 'active',
        // Add API key health metrics
      };
    }

    // Credential Manager health
    if (this.credentialManager) {
      health.components.credentials = {
        status: 'active',
        ...(await this.credentialManager.checkCredentialHealth())
      };
    }

    // Security Middleware health
    if (this.securityMiddleware) {
      health.components.security = {
        status: 'active',
        ...this.securityMiddleware.getSecurityStats()
      };
    }

    return health;
  }

  /**
   * Initialize components based on configuration
   */
  private initializeComponents(config: AuthConfig): void {
    // Initialize JWT Manager
    if (config.providers.jwt) {
      this.jwtManager = new JWTManager(config.providers.jwt);
      
      if (config.providers.jwt.publicKey) {
        this.jwtManager.addKeyPair(config.providers.jwt.keyId || 'default', {
          privateKey: '', // Not needed for verification only
          publicKey: config.providers.jwt.publicKey,
          keyId: config.providers.jwt.keyId || 'default',
          algorithm: config.providers.jwt.algorithm
        });
      }
    }

    // Initialize OAuth2 Provider
    if (config.providers.oauth2) {
      this.oauth2Provider = new OAuth2Provider(config.providers.oauth2);
    }

    // Initialize mTLS Validator
    if (config.providers.mtls) {
      this.mtlsValidator = new mTLSCertificateValidator(config.providers.mtls);
    }

    // Initialize API Key Manager
    if (config.providers.apiKey) {
      this.apiKeyManager = new APIKeyManager();
    }

    // Initialize Credential Manager (if encryption key provided)
    if (config.providers.apiKey?.encryptionKey) {
      this.credentialManager = new SecureCredentialManager(
        config.providers.apiKey.encryptionKey
      );
    }

    // Initialize Security Middleware
    this.securityMiddleware = new SecurityMiddleware(
      {
        enabled: config.security.csrfProtection,
        tokenName: '_csrf',
        headerName: 'x-csrf-token',
        cookieName: '_csrf',
        saltLength: 16,
        secret: config.providers.apiKey?.encryptionKey || 'default-secret',
        secureCookie: config.security.requireHttps,
        sameSite: 'strict',
        ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
        skipFailureAudit: false
      },
      {
        contentTypeOptions: true,
        frameOptions: 'DENY',
        xssProtection: true,
        strictTransportSecurity: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        contentSecurityPolicy: "default-src 'self'",
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: 'same-origin'
      },
      {
        maxRequestSize: '10mb',
        allowedContentTypes: [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain'
        ],
        validateJsonStructure: true,
        preventXmlExternalEntities: true,
        sanitizeHtml: false
      },
      {
        enabled: config.logging.enabled,
        logFailedAttempts: config.logging.auditTrail,
        logSuccessfulAuth: config.logging.auditTrail,
        logSuspiciousActivity: true,
        storage: 'console',
        retentionDays: 30
      }
    );
  }
}

/**
 * Factory function to create OSSA Authentication System
 */
export function createOSSAAuthSystem(config: AuthConfig): OSSAAuthenticationSystem {
  return new OSSAAuthenticationSystem(config);
}

/**
 * Default configuration for OSSA Authentication System
 */
export const defaultAuthConfig: Partial<AuthConfig> = {
  security: {
    requireHttps: true,
    csrfProtection: true,
    rateLimiting: true,
    bruteForceProtection: true,
    sessionTimeout: 3600 // 1 hour
  },
  logging: {
    enabled: true,
    level: 'info',
    destination: 'console',
    auditTrail: true
  }
};

/**
 * Utility function to merge configurations
 */
export function mergeAuthConfig(base: Partial<AuthConfig>, override: Partial<AuthConfig>): AuthConfig {
  return {
    providers: {
      ...base.providers,
      ...override.providers
    },
    security: {
      ...base.security,
      ...override.security
    },
    logging: {
      ...base.logging,
      ...override.logging
    }
  } as AuthConfig;
}

/**
 * Validation function for auth configuration
 */
export function validateAuthConfig(config: AuthConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate providers
  if (!config.providers || Object.keys(config.providers).length === 0) {
    errors.push('At least one authentication provider must be configured');
  }

  // Validate JWT configuration
  if (config.providers.jwt) {
    if (!config.providers.jwt.issuer) {
      errors.push('JWT issuer is required');
    }
    if (!config.providers.jwt.audience) {
      errors.push('JWT audience is required');
    }
    if (!config.providers.jwt.algorithm) {
      errors.push('JWT algorithm is required');
    }
  }

  // Validate OAuth2 configuration
  if (config.providers.oauth2) {
    if (!config.providers.oauth2.clientId) {
      errors.push('OAuth2 client ID is required');
    }
    if (!config.providers.oauth2.clientSecret) {
      errors.push('OAuth2 client secret is required');
    }
    if (!config.providers.oauth2.authorizationUrl) {
      errors.push('OAuth2 authorization URL is required');
    }
    if (!config.providers.oauth2.tokenUrl) {
      errors.push('OAuth2 token URL is required');
    }
  }

  // Validate mTLS configuration
  if (config.providers.mtls) {
    if (!config.providers.mtls.ca && config.providers.mtls.requireClientCert) {
      errors.push('mTLS CA certificates are required when client certificates are required');
    }
  }

  // Validate security configuration
  if (config.security.requireHttps && !config.security.csrfProtection) {
    // This is just a warning, not an error
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Export default instance for simple usage
export default OSSAAuthenticationSystem;