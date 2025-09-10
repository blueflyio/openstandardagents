/**
 * JWT Authentication Middleware
 * OSSA v0.1.8 compliant JWT token validation and processing
 */

import { createVerify, createSign, randomBytes } from 'crypto';
import { 
  JWTPayload, 
  JWTOptions, 
  JWTKeys, 
  AuthenticatedRequest, 
  AuthenticatedUser,
  TokenValidationError,
  AuthMiddleware 
} from './types.js';
import { Response, NextFunction } from 'express';

export class JWTManager {
  private keys: Map<string, JWTKeys> = new Map();
  private algorithms: Set<string> = new Set([
    'RS256', 'RS384', 'RS512', 
    'ES256', 'ES384', 'ES512', 
    'PS256', 'PS384', 'PS512'
  ]);

  constructor(private options: JWTOptions) {
    this.validateOptions();
  }

  /**
   * Add signing/verification key pair
   */
  addKeyPair(keyId: string, keys: JWTKeys): void {
    if (!this.algorithms.has(keys.algorithm)) {
      throw new Error(`Unsupported algorithm: ${keys.algorithm}`);
    }
    this.keys.set(keyId, keys);
  }

  /**
   * Sign JWT token
   */
  async sign(payload: Partial<JWTPayload>, keyId?: string): Promise<string> {
    const keyPair = this.getKeyPair(keyId);
    if (!keyPair) {
      throw new Error('No signing key available');
    }

    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      iss: this.options.issuer,
      aud: this.options.audience,
      iat: now,
      exp: now + this.getExpirationSeconds(),
      nbf: this.options.notBefore ? now + this.getNotBeforeSeconds() : now,
      jti: randomBytes(16).toString('hex'),
      ...payload
    };

    const header = {
      alg: keyPair.algorithm,
      typ: 'JWT',
      kid: keyId || 'default'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = this.signData(signingInput, keyPair.privateKey, keyPair.algorithm);
    
    return `${signingInput}.${signature}`;
  }

  /**
   * Verify and decode JWT token
   */
  async verify(token: string): Promise<JWTPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new TokenValidationError('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    
    let header: any;
    let payload: JWTPayload;

    try {
      header = JSON.parse(this.base64UrlDecode(encodedHeader));
      payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    } catch (error) {
      throw new TokenValidationError('Invalid token encoding');
    }

    // Validate header
    if (!header.alg || !this.algorithms.has(header.alg)) {
      throw new TokenValidationError('Invalid or unsupported algorithm');
    }

    if (header.typ !== 'JWT') {
      throw new TokenValidationError('Invalid token type');
    }

    // Get verification key
    const keyPair = this.getKeyPair(header.kid);
    if (!keyPair) {
      throw new TokenValidationError('Unknown key ID');
    }

    if (keyPair.algorithm !== header.alg) {
      throw new TokenValidationError('Algorithm mismatch');
    }

    // Verify signature
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    if (!this.verifySignature(signingInput, signature, keyPair.publicKey, keyPair.algorithm)) {
      throw new TokenValidationError('Invalid signature');
    }

    // Validate claims
    await this.validateClaims(payload);

    return payload;
  }

  /**
   * Create JWT authentication middleware
   */
  createMiddleware(options?: {
    optional?: boolean;
    scope?: string[];
    extractToken?: (req: AuthenticatedRequest) => string | null;
  }): AuthMiddleware {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const token = this.extractToken(req, options?.extractToken);
        
        if (!token) {
          if (options?.optional) {
            return next();
          }
          throw new TokenValidationError('No token provided');
        }

        const payload = await this.verify(token);
        
        // Validate scopes if required
        if (options?.scope && options.scope.length > 0) {
          if (!payload.scope) {
            throw new TokenValidationError('Token missing required scopes');
          }
          
          const tokenScopes = payload.scope.split(' ');
          const hasRequiredScope = options.scope.every(scope => 
            tokenScopes.includes(scope)
          );
          
          if (!hasRequiredScope) {
            throw new TokenValidationError('Insufficient token scope');
          }
        }

        // Create authenticated user
        const user: AuthenticatedUser = {
          id: payload.sub,
          roles: [],
          permissions: [],
          agentId: payload.agentId,
          trustLevel: payload.trustLevel,
          metadata: {
            tokenId: payload.jti,
            issuer: payload.iss,
            audience: payload.aud,
            issuedAt: new Date(payload.iat * 1000),
            expiresAt: new Date(payload.exp * 1000)
          }
        };

        // Attach auth info to request
        req.auth = {
          type: 'jwt',
          user,
          token,
          scopes: payload.scope?.split(' ') || [],
          restrictions: payload.restrictions || [],
          metadata: {
            algorithm: this.getKeyPair()?.algorithm,
            keyId: this.extractKeyId(token)
          }
        };

        next();
      } catch (error) {
        if (error instanceof TokenValidationError) {
          res.status(error.statusCode).json({
            error: error.code,
            message: error.message,
            details: error.details
          });
        } else {
          res.status(401).json({
            error: 'AUTHENTICATION_FAILED',
            message: 'Token validation failed'
          });
        }
      }
    };
  }

  /**
   * Refresh token (create new token with extended expiry)
   */
  async refresh(token: string, keyId?: string): Promise<string> {
    const payload = await this.verify(token);
    
    // Remove old timing claims
    delete payload.iat;
    delete payload.exp;
    delete payload.nbf;
    delete payload.jti;

    return this.sign(payload, keyId);
  }

  /**
   * Revoke token (add to blacklist)
   */
  async revoke(token: string): Promise<void> {
    const payload = await this.verify(token);
    
    // In production, this should store the JTI in a blacklist
    // For now, we just validate the token exists
    if (!payload.jti) {
      throw new TokenValidationError('Token cannot be revoked');
    }
    
    // Store in blacklist (implementation depends on storage backend)
    await this.addToBlacklist(payload.jti, payload.exp);
  }

  /**
   * Extract token from request
   */
  private extractToken(
    req: AuthenticatedRequest, 
    customExtractor?: (req: AuthenticatedRequest) => string | null
  ): string | null {
    if (customExtractor) {
      return customExtractor(req);
    }

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter
    const queryToken = req.query.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    // Check cookie
    const cookieToken = req.cookies?.jwt;
    if (typeof cookieToken === 'string') {
      return cookieToken;
    }

    return null;
  }

  /**
   * Validate JWT claims
   */
  private async validateClaims(payload: JWTPayload): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const clockTolerance = this.options.clockTolerance || 0;

    // Check expiration
    if (payload.exp && (payload.exp + clockTolerance) < now) {
      throw new TokenValidationError('Token expired');
    }

    // Check not before
    if (payload.nbf && (payload.nbf - clockTolerance) > now) {
      throw new TokenValidationError('Token not yet valid');
    }

    // Check issuer
    if (payload.iss !== this.options.issuer) {
      throw new TokenValidationError('Invalid issuer');
    }

    // Check audience
    const audiences = Array.isArray(this.options.audience) 
      ? this.options.audience 
      : [this.options.audience];
    
    const tokenAudiences = Array.isArray(payload.aud) 
      ? payload.aud 
      : [payload.aud];
    
    const validAudience = audiences.some(aud => 
      tokenAudiences.includes(aud)
    );
    
    if (!validAudience) {
      throw new TokenValidationError('Invalid audience');
    }

    // Check max age
    if (this.options.maxAge && payload.iat) {
      const maxAgeSeconds = typeof this.options.maxAge === 'string' 
        ? this.parseTimespan(this.options.maxAge) 
        : this.options.maxAge;
      
      if ((now - payload.iat) > maxAgeSeconds) {
        throw new TokenValidationError('Token too old');
      }
    }

    // Check if token is blacklisted
    if (payload.jti && await this.isBlacklisted(payload.jti)) {
      throw new TokenValidationError('Token has been revoked');
    }
  }

  /**
   * Sign data with private key
   */
  private signData(data: string, privateKey: string | Buffer, algorithm: string): string {
    const sign = createSign(this.getNodeAlgorithm(algorithm));
    sign.update(data);
    const signature = sign.sign(privateKey);
    return this.base64UrlEncode(signature);
  }

  /**
   * Verify signature with public key
   */
  private verifySignature(
    data: string, 
    signature: string, 
    publicKey: string | Buffer, 
    algorithm: string
  ): boolean {
    try {
      const verify = createVerify(this.getNodeAlgorithm(algorithm));
      verify.update(data);
      const signatureBuffer = this.base64UrlDecodeBuffer(signature);
      return verify.verify(publicKey, signatureBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Get Node.js crypto algorithm from JWT algorithm
   */
  private getNodeAlgorithm(jwtAlgorithm: string): string {
    const algorithmMap: Record<string, string> = {
      'RS256': 'RSA-SHA256',
      'RS384': 'RSA-SHA384', 
      'RS512': 'RSA-SHA512',
      'ES256': 'sha256',
      'ES384': 'sha384',
      'ES512': 'sha512',
      'PS256': 'RSA-SHA256',
      'PS384': 'RSA-SHA384',
      'PS512': 'RSA-SHA512'
    };
    
    return algorithmMap[jwtAlgorithm] || jwtAlgorithm;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(buffer: Buffer | string): string {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    return buf.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode to string
   */
  private base64UrlDecode(str: string): string {
    return this.base64UrlDecodeBuffer(str).toString();
  }

  /**
   * Base64 URL decode to buffer
   */
  private base64UrlDecodeBuffer(str: string): Buffer {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return Buffer.from(base64, 'base64');
  }

  /**
   * Get key pair by ID
   */
  private getKeyPair(keyId?: string): JWTKeys | undefined {
    if (keyId) {
      return this.keys.get(keyId);
    }
    
    // Return first available key if no ID specified
    return this.keys.values().next().value;
  }

  /**
   * Extract key ID from token
   */
  private extractKeyId(token: string): string | undefined {
    try {
      const header = JSON.parse(this.base64UrlDecode(token.split('.')[0]));
      return header.kid;
    } catch {
      return undefined;
    }
  }

  /**
   * Get expiration time in seconds
   */
  private getExpirationSeconds(): number {
    if (typeof this.options.expiresIn === 'number') {
      return this.options.expiresIn;
    }
    return this.parseTimespan(this.options.expiresIn);
  }

  /**
   * Get not before time in seconds
   */
  private getNotBeforeSeconds(): number {
    if (!this.options.notBefore) return 0;
    
    if (typeof this.options.notBefore === 'number') {
      return this.options.notBefore;
    }
    return this.parseTimespan(this.options.notBefore);
  }

  /**
   * Parse timespan string to seconds
   */
  private parseTimespan(timespan: string): number {
    const units: Record<string, number> = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800,
      'y': 31536000
    };

    const match = timespan.match(/^(\d+)([smhdwy]?)$/);
    if (!match) {
      throw new Error(`Invalid timespan format: ${timespan}`);
    }

    const [, amount, unit] = match;
    const multiplier = units[unit] || 1;
    
    return parseInt(amount, 10) * multiplier;
  }

  /**
   * Validate configuration options
   */
  private validateOptions(): void {
    if (!this.options.issuer) {
      throw new Error('JWT issuer is required');
    }
    
    if (!this.options.audience) {
      throw new Error('JWT audience is required');
    }
    
    if (!this.options.expiresIn) {
      throw new Error('JWT expiration time is required');
    }
    
    if (!this.algorithms.has(this.options.algorithm)) {
      throw new Error(`Unsupported algorithm: ${this.options.algorithm}`);
    }
  }

  /**
   * Add token to blacklist (placeholder for external implementation)
   */
  private async addToBlacklist(jti: string, exp: number): Promise<void> {
    // Implementation depends on storage backend (Redis, database, etc.)
    // For now, this is a placeholder
    console.warn(`Token ${jti} should be blacklisted until ${new Date(exp * 1000)}`);
  }

  /**
   * Check if token is blacklisted (placeholder for external implementation)
   */
  private async isBlacklisted(jti: string): Promise<boolean> {
    // Implementation depends on storage backend (Redis, database, etc.)
    // For now, this is a placeholder
    return false;
  }
}

/**
 * Create JWT authentication middleware with default configuration
 */
export function createJWTMiddleware(
  options: JWTOptions & { publicKey: string | Buffer; keyId?: string }
): AuthMiddleware {
  const manager = new JWTManager(options);
  
  // Add the public key for verification
  manager.addKeyPair(options.keyId || 'default', {
    privateKey: '', // Not needed for verification only
    publicKey: options.publicKey,
    keyId: options.keyId || 'default',
    algorithm: options.algorithm
  });

  return manager.createMiddleware();
}

/**
 * Utility function to generate key pair for JWT signing
 */
export function generateJWTKeyPair(algorithm: string = 'RS256'): Promise<{ privateKey: string; publicKey: string }> {
  return new Promise((resolve, reject) => {
    const { generateKeyPair } = require('crypto');
    
    const keyType = algorithm.startsWith('RS') || algorithm.startsWith('PS') ? 'rsa' : 'ec';
    const options: any = {};
    
    if (keyType === 'rsa') {
      options.modulusLength = algorithm.includes('512') ? 4096 : 2048;
    } else {
      const namedCurve = algorithm === 'ES256' ? 'prime256v1' : 
                         algorithm === 'ES384' ? 'secp384r1' : 'secp521r1';
      options.namedCurve = namedCurve;
    }

    generateKeyPair(keyType, {
      ...options,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }, (err: Error | null, publicKey: string, privateKey: string) => {
      if (err) {
        reject(err);
      } else {
        resolve({ publicKey, privateKey });
      }
    });
  });
}