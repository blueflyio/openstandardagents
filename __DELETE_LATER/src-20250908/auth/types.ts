/**
 * OAuth2/JWT Authentication Types
 * OSSA v0.1.8 compliant authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { X509Certificate } from 'crypto';

// JWT Token Types
export interface JWTPayload {
  sub: string;  // Subject (user/agent ID)
  iss: string;  // Issuer
  aud: string | string[];  // Audience
  exp: number;  // Expiration time
  nbf: number;  // Not before
  iat: number;  // Issued at
  jti?: string; // JWT ID
  scope?: string; // OAuth2 scopes
  azp?: string;   // Authorized party
  
  // OSSA specific claims
  agentId?: string;
  trustLevel?: string;
  capabilities?: string[];
  restrictions?: string[];
}

export interface JWTOptions {
  algorithm: 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512' | 'PS256' | 'PS384' | 'PS512';
  issuer: string;
  audience: string | string[];
  expiresIn: string | number;
  notBefore?: string | number;
  clockTolerance?: number;
  maxAge?: string | number;
}

export interface JWTKeys {
  privateKey: string | Buffer;
  publicKey: string | Buffer;
  keyId: string;
  algorithm: string;
}

// OAuth2 Types
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  introspectUrl?: string;
  userinfoUrl?: string;
  scopes: string[];
  pkce: boolean;
  state: boolean;
  nonce: boolean;
}

export interface OAuth2TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: 'Bearer' | 'bearer';
  expires_in: number;
  scope?: string;
  state?: string;
}

export interface OAuth2AuthorizeParams {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256';
  nonce?: string;
}

export interface OAuth2TokenParams {
  grant_type: 'authorization_code' | 'refresh_token' | 'client_credentials';
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret?: string;
  code_verifier?: string;
  refresh_token?: string;
  scope?: string;
}

// mTLS Types
export interface mTLSConfig {
  enabled: boolean;
  requireClientCert: boolean;
  ca: string | Buffer | Array<string | Buffer>;
  cert?: string | Buffer;
  key?: string | Buffer;
  passphrase?: string;
  rejectUnauthorized: boolean;
  checkServerIdentity?: (servername: string, cert: X509Certificate) => Error | undefined;
  trustedFingerprints?: string[];
  allowedSubjects?: string[];
  crlUrls?: string[];
}

export interface ClientCertificate {
  subject: string;
  issuer: string;
  serialNumber: string;
  fingerprint: string;
  fingerprint256: string;
  valid_from: string;
  valid_to: string;
  subjectaltname?: string;
  raw: Buffer;
  pemEncoded: string;
}

// API Key Types
export interface APIKey {
  id: string;
  keyHash: string;
  name: string;
  description?: string;
  scopes: string[];
  restrictions: APIKeyRestrictions;
  metadata: APIKeyMetadata;
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  rotationSchedule?: RotationSchedule;
}

export interface APIKeyRestrictions {
  ipWhitelist?: string[];
  userAgentPattern?: string;
  refererPattern?: string;
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
  timeWindows?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone?: string;
  }[];
}

export interface APIKeyMetadata {
  owner: string;
  environment: 'development' | 'staging' | 'production';
  tags: string[];
  usage: {
    totalRequests: number;
    lastMonthRequests: number;
    averageResponseTime: number;
  };
}

export interface RotationSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextRotation: Date;
  gracePeriodDays: number;
  autoRotate: boolean;
  notifyBeforeDays: number;
}

// Credential Management Types
export interface SecureCredential {
  id: string;
  type: 'oauth2' | 'api_key' | 'certificate' | 'password' | 'token';
  name: string;
  encryptedValue: string;
  salt: string;
  iv: string;
  algorithm: string;
  keyDerivation: {
    method: 'pbkdf2' | 'scrypt' | 'argon2';
    iterations?: number;
    cost?: number;
    blockSize?: number;
    parallelization?: number;
  };
  metadata: CredentialMetadata;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface CredentialMetadata {
  owner: string;
  environment: string;
  tags: string[];
  accessLog: AccessLogEntry[];
  rotationHistory: RotationHistoryEntry[];
}

export interface AccessLogEntry {
  timestamp: Date;
  accessor: string;
  action: 'read' | 'write' | 'delete' | 'rotate';
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
}

export interface RotationHistoryEntry {
  timestamp: Date;
  oldKeyId?: string;
  newKeyId?: string;
  reason: 'scheduled' | 'manual' | 'compromise' | 'expiry';
  initiator: string;
  success: boolean;
}

// Middleware Types
export interface AuthenticatedRequest extends Request {
  auth?: {
    type: 'jwt' | 'oauth2' | 'api_key' | 'mtls';
    user?: AuthenticatedUser;
    token?: string;
    scopes?: string[];
    clientCert?: ClientCertificate;
    apiKey?: APIKey;
    restrictions?: string[];
    metadata?: Record<string, any>;
  };
}

export interface AuthenticatedUser {
  id: string;
  username?: string;
  email?: string;
  roles: string[];
  permissions: string[];
  agentId?: string;
  trustLevel?: string;
  metadata?: Record<string, any>;
}

export interface AuthMiddlewareOptions {
  jwt?: JWTOptions & {
    publicKey: string | Buffer;
    keyId?: string;
  };
  oauth2?: OAuth2Config;
  mtls?: mTLSConfig;
  apiKey?: {
    headerName?: string;
    queryParam?: string;
    prefix?: string;
    validateScope?: boolean;
  };
  rateLimiting?: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: Request) => string;
  };
  security?: {
    requireHttps?: boolean;
    csrfProtection?: boolean;
    contentTypeValidation?: boolean;
    requestSizeLimit?: string;
  };
}

export type AuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;

// Error Types
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class TokenValidationError extends AuthenticationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'TOKEN_VALIDATION_ERROR', 401, details);
  }
}

export class CertificateValidationError extends AuthenticationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CERTIFICATE_VALIDATION_ERROR', 401, details);
  }
}

export class APIKeyValidationError extends AuthenticationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'API_KEY_VALIDATION_ERROR', 401, details);
  }
}

// Configuration Types
export interface AuthConfig {
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
    sessionTimeout: number;
  };
  logging: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
    destination: 'console' | 'file' | 'remote';
    auditTrail: boolean;
  };
}

// Rate Limiting Types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  onLimitReached?: (req: Request, res: Response, options: RateLimitConfig) => void;
}

export interface BruteForceConfig {
  freeRetries: number;
  minWait: number;
  maxWait: number;
  lifetime: number;
  failCallback?: (req: Request, res: Response, next: NextFunction, nextValidRequestDate: Date) => void;
}