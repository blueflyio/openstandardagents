# OSSA Authentication System

A comprehensive OAuth2/JWT authentication middleware with mTLS certificates support, API key rotation, and secure credential management, fully compliant with OSSA v0.1.8 specifications.

## Features

### 🔐 **Multi-Protocol Authentication**
- **JWT (JSON Web Tokens)** - RS256/RS384/RS512, ES256/ES384/ES512, PS256/PS384/PS512 algorithms
- **OAuth2** - Authorization Code flow with PKCE support
- **mTLS (Mutual TLS)** - Client certificate authentication with CRL checking
- **API Keys** - Secure key management with automatic rotation
- **Multi-Auth** - Support for multiple authentication methods simultaneously

### 🛡️ **Enterprise Security**
- **CSRF Protection** - Token-based cross-site request forgery protection
- **Rate Limiting** - Advanced rate limiting with multiple strategies
- **Brute Force Protection** - Exponential backoff and IP-based blocking
- **Content Validation** - XSS, SQL injection, and XXE attack prevention
- **Security Headers** - Comprehensive HTTP security headers
- **Audit Logging** - Complete security event tracking

### 🔄 **Credential Management**
- **Encrypted Storage** - AES-256-GCM encryption with key derivation
- **Automatic Rotation** - Scheduled and manual credential rotation
- **Access Logging** - Detailed access trails for all credentials
- **Health Monitoring** - Expiration tracking and usage analytics

### 🚀 **Production Ready**
- **High Performance** - Optimized for concurrent request handling
- **Memory Efficient** - Automatic cleanup and resource management
- **Scalable** - Pluggable storage backends (Memory, Redis, Database)
- **Observable** - Health checks and metrics collection

## Quick Start

### Installation

```bash
npm install @ossa/auth
```

### Basic Setup

```typescript
import express from 'express';
import { createOSSAAuthSystem, AuthConfig } from '@ossa/auth';

const app = express();

// Configure authentication
const authConfig: AuthConfig = {
  providers: {
    jwt: {
      algorithm: 'RS256',
      issuer: 'your-app',
      audience: 'your-api',
      expiresIn: '1h',
      publicKey: process.env.JWT_PUBLIC_KEY
    },
    apiKey: {
      encryptionKey: process.env.API_KEY_ENCRYPTION_KEY,
      rotationEnabled: true
    }
  },
  security: {
    requireHttps: true,
    csrfProtection: true,
    rateLimiting: true,
    bruteForceProtection: true,
    sessionTimeout: 3600
  },
  logging: {
    enabled: true,
    level: 'info',
    auditTrail: true
  }
};

// Create authentication system
const authSystem = createOSSAAuthSystem(authConfig);
const auth = authSystem.createExpressSetup();

// Apply security middleware
app.use(auth.securityHeaders());
app.use(auth.bruteForceProtection());
app.use(auth.csrfProtection());

// Protected routes
app.get('/api/protected', 
  auth.authenticate(), 
  auth.authorize({ scopes: ['read'] }),
  (req, res) => {
    res.json({ 
      user: req.auth?.user,
      message: 'Access granted!' 
    });
  }
);

app.listen(3000);
```

## Authentication Methods

### JWT Authentication

```typescript
// Generate key pair
import { generateJWTKeyPair } from '@ossa/auth';

const keyPair = await generateJWTKeyPair('RS256');

// JWT-only authentication
app.use('/api/jwt', auth.jwt({
  scope: ['api:read', 'api:write'],
  optional: false
}));
```

### OAuth2 with PKCE

```typescript
const authConfig: AuthConfig = {
  providers: {
    oauth2: {
      clientId: process.env.OAUTH2_CLIENT_ID,
      clientSecret: process.env.OAUTH2_CLIENT_SECRET,
      authorizationUrl: 'https://auth.provider.com/oauth/authorize',
      tokenUrl: 'https://auth.provider.com/oauth/token',
      redirectUri: 'https://yourapp.com/callback',
      scopes: ['openid', 'profile', 'email'],
      pkce: true,
      state: true,
      nonce: true
    }
  }
};

// OAuth2 flow
const oauth2 = authSystem.getOAuth2Provider();

app.get('/auth/login', (req, res) => {
  const { url, state } = oauth2.generateAuthorizationUrl(['openid', 'profile']);
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  const tokens = await oauth2.handleCallback(code, state);
  // Store tokens and redirect
});
```

### mTLS Certificate Authentication

```typescript
const authConfig: AuthConfig = {
  providers: {
    mtls: {
      enabled: true,
      requireClientCert: true,
      ca: [fs.readFileSync('ca-cert.pem')],
      trustedFingerprints: [
        'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD'
      ],
      crlUrls: ['https://ca.example.com/crl.der']
    }
  }
};

// mTLS authentication
app.use('/api/secure', auth.mtls({
  requireTrusted: true,
  allowExpired: false
}));
```

### API Key Management

```typescript
const apiKeyManager = authSystem.getAPIKeyManager();

// Generate API key
const { apiKey, rawKey } = await apiKeyManager.generateAPIKey({
  name: 'Production API Key',
  owner: 'user@example.com',
  environment: 'production',
  scopes: ['read', 'write'],
  restrictions: {
    ipWhitelist: ['192.168.1.0/24'],
    rateLimit: {
      requests: 1000,
      window: 3600 // 1 hour
    }
  },
  rotationSchedule: {
    frequency: 'monthly',
    autoRotate: true,
    gracePeriodDays: 7
  }
});

// API key authentication
app.use('/api/keys', auth.apiKey({
  headerName: 'X-API-Key',
  requiredScopes: ['api:access']
}));
```

## Multi-Authentication

```typescript
// Multiple auth methods with fallback
app.use('/api/multi', auth.multiAuth([
  { type: 'jwt', required: false },
  { type: 'api_key', required: false },
  { type: 'mtls', required: false }
], 'any')); // Accept any valid method

// All methods required
app.use('/api/secure', auth.multiAuth([
  { type: 'jwt', required: true },
  { type: 'mtls', required: true }
], 'all')); // All methods must succeed
```

## Authorization

```typescript
// Scope-based authorization
app.use('/api/admin', auth.authorize({
  scopes: ['admin:read', 'admin:write'],
  roles: ['administrator'],
  permissions: ['manage:users']
}));

// Custom authorization logic
app.use('/api/custom', auth.authorize({
  custom: async (req) => {
    const user = req.auth?.user;
    return user?.id === 'special-user' || user?.roles.includes('superuser');
  }
}));
```

## Credential Management

```typescript
const credentialManager = authSystem.getCredentialManager();

// Store encrypted credential
const credentialId = await credentialManager.storeCredential({
  type: 'oauth2',
  name: 'Third-party API Token',
  value: 'sensitive-token-value',
  owner: 'service-account',
  environment: 'production',
  expiresIn: 30 * 24 * 60 * 60 // 30 days
}, {
  accessor: 'api-service',
  action: 'write'
});

// Retrieve credential
const tokenValue = await credentialManager.getCredential(credentialId, {
  accessor: 'api-service',
  action: 'read'
});

// Rotate credential
const newCredentialId = await credentialManager.rotateCredential(credentialId, {
  accessor: 'admin-user',
  action: 'rotate'
});
```

## Security Features

### CSRF Protection

```typescript
// CSRF protection with custom configuration
const security = authSystem.getSecurityMiddleware();

app.use(security.createCSRFMiddleware({
  tokenName: '_csrf',
  headerName: 'X-CSRF-Token',
  cookieName: '_csrf',
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
}));
```

### Rate Limiting

```typescript
// Advanced rate limiting
app.use(security.createAdvancedRateLimitingMiddleware({
  global: { windowMs: 60000, max: 1000 }, // Global limit
  perUser: { windowMs: 60000, max: 100 }, // Per authenticated user
  perEndpoint: {
    'POST:/api/upload': { windowMs: 60000, max: 5 }, // Specific endpoint
    'GET:/api/search': { windowMs: 60000, max: 50 }
  }
}));
```

### Content Security

```typescript
// Content validation and security
app.use(security.createContentValidationMiddleware({
  maxRequestSize: '10mb',
  allowedContentTypes: ['application/json', 'multipart/form-data'],
  validateJsonStructure: true,
  preventXmlExternalEntities: true
}));

// Suspicious activity detection
app.use(security.createSuspiciousActivityMiddleware());
```

## Health Monitoring

```typescript
// System health endpoint
app.get('/health/auth', async (req, res) => {
  const health = await authSystem.getSystemHealth();
  res.json(health);
});

// Credential health report
app.get('/admin/credentials/health', async (req, res) => {
  const report = await credentialManager.generateHealthReport();
  res.json(report);
});

// Security statistics
app.get('/admin/security/stats', (req, res) => {
  const stats = security.getSecurityStats();
  res.json(stats);
});
```

## Configuration Reference

### AuthConfig

```typescript
interface AuthConfig {
  providers: {
    jwt?: JWTOptions & { publicKey: string | Buffer; keyId?: string };
    oauth2?: OAuth2Config;
    mtls?: mTLSConfig;
    apiKey?: {
      storage: 'memory' | 'redis' | 'database';
      encryptionKey: string;
      rotationEnabled: boolean;
    };
  };
  security: {
    requireHttps: boolean;
    csrfProtection: boolean;
    rateLimiting: boolean;
    bruteForceProtection: boolean;
    sessionTimeout: number; // seconds
  };
  logging: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
    destination: 'console' | 'file' | 'remote';
    auditTrail: boolean;
  };
}
```

### Environment Variables

```bash
# JWT Configuration
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
JWT_KEY_ID=default

# OAuth2 Configuration
OAUTH2_CLIENT_ID=your-client-id
OAUTH2_CLIENT_SECRET=your-client-secret
OAUTH2_AUTHORIZATION_URL=https://auth.provider.com/oauth/authorize
OAUTH2_TOKEN_URL=https://auth.provider.com/oauth/token

# API Key Configuration
API_KEY_ENCRYPTION_KEY=your-32-byte-encryption-key

# mTLS Configuration
MTLS_CA_CERT_PATH=/path/to/ca-cert.pem
MTLS_CRL_URL=https://ca.example.com/crl.der

# Security Configuration
REQUIRE_HTTPS=true
CSRF_SECRET=your-csrf-secret
```

## Testing

```typescript
import { testHelpers } from '@ossa/auth';

// Test utilities provided
const { 
  createMockRequest, 
  createMockResponse, 
  generateTestKeyPair,
  createTestConfig 
} = testHelpers;

// Run tests
npm test
```

## Performance Considerations

### Memory Usage
- JWT tokens are stateless (no server-side storage)
- API keys cached in memory with LRU eviction
- CSRF tokens auto-expire and cleanup
- Rate limiters use sliding window algorithm

### Scalability
- Stateless design supports horizontal scaling
- Pluggable storage backends for session data
- Connection pooling for certificate validation
- Async/await throughout for non-blocking operations

### Security
- Constant-time comparison for all secret operations
- Secure random generation for tokens and keys
- Protection against timing attacks
- Memory-safe credential handling

## Integration Examples

### Express.js with TypeScript

```typescript
import express from 'express';
import { createOSSAAuthSystem } from '@ossa/auth';
import type { AuthenticatedRequest } from '@ossa/auth';

const app = express();
const authSystem = createOSSAAuthSystem(authConfig);
const auth = authSystem.createExpressSetup();

app.use(auth.authenticate());

app.get('/profile', (req: AuthenticatedRequest, res) => {
  const user = req.auth?.user;
  res.json({ profile: user });
});
```

### Fastify

```typescript
import fastify from 'fastify';
import { createOSSAAuthSystem } from '@ossa/auth';

const server = fastify();
const authSystem = createOSSAAuthSystem(authConfig);
const auth = authSystem.createExpressSetup();

server.addHook('preHandler', auth.authenticate());

server.get('/api/data', async (request, reply) => {
  return { data: 'protected' };
});
```

### Next.js API Routes

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createOSSAAuthSystem } from '@ossa/auth';

const authSystem = createOSSAAuthSystem(authConfig);
const auth = authSystem.createExpressSetup();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const middleware = auth.authenticate();
  
  return new Promise((resolve, reject) => {
    middleware(req as any, res as any, (error) => {
      if (error) {
        return reject(error);
      }
      
      res.status(200).json({ 
        message: 'Authenticated',
        user: (req as any).auth?.user 
      });
      resolve(undefined);
    });
  });
}
```

## Migration Guide

### From Passport.js

```typescript
// Before (Passport.js)
app.use(passport.initialize());
app.use(passport.authenticate('jwt', { session: false }));

// After (OSSA Auth)
app.use(auth.jwt({ optional: false }));
```

### From Express-JWT

```typescript
// Before (express-jwt)
app.use(jwt({ 
  secret: publicKey, 
  algorithms: ['RS256'],
  requestProperty: 'user'
}));

// After (OSSA Auth)
app.use(auth.jwt({
  algorithm: 'RS256',
  publicKey: publicKey
}));
// User available as req.auth.user
```

## Troubleshooting

### Common Issues

1. **JWT Verification Fails**
   - Check public key format and algorithm match
   - Verify issuer and audience claims
   - Ensure clock synchronization between services

2. **CSRF Token Mismatch**
   - Verify CSRF token is included in requests
   - Check cookie settings (secure, sameSite)
   - Ensure token hasn't expired

3. **API Key Validation Errors**
   - Confirm key format (should contain '.')
   - Check IP whitelist restrictions
   - Verify key hasn't expired or been revoked

4. **mTLS Certificate Issues**
   - Validate CA certificate chain
   - Check certificate expiration
   - Verify CRL accessibility

### Debug Mode

```typescript
const authConfig: AuthConfig = {
  // ... other config
  logging: {
    enabled: true,
    level: 'debug', // Enable debug logging
    destination: 'console',
    auditTrail: true
  }
};
```

### Health Checks

```typescript
// Monitor system health
const health = await authSystem.getSystemHealth();
console.log('Auth System Health:', health);

// Monitor security events
const security = authSystem.getSecurityMiddleware();
const events = security.getSecurityAuditLog();
console.log('Recent Security Events:', events);
```

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## Support

For support, please contact the OSSA development team or file an issue in the repository.

---

**OSSA Authentication System** - Enterprise-grade authentication for modern applications.