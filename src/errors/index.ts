/**
 * OSSA Error System - Production-Grade Error Handling
 *
 * Error Code Format: OSSA-{CATEGORY}-{NUMBER}
 *
 * Categories:
 * - VAL: Validation errors (OSSA-VAL-001)
 * - EXP: Export errors (OSSA-EXP-001)
 * - MIG: Migration errors (OSSA-MIG-001)
 * - GEN: Generation errors (OSSA-GEN-001)
 * - REG: Registry errors (OSSA-REG-001)
 * - KG: Knowledge graph errors (OSSA-KG-001)
 * - API: API errors (OSSA-API-001)
 * - CFG: Configuration errors (OSSA-CFG-001)
 * - NET: Network errors (OSSA-NET-001)
 * - AUTH: Authentication errors (OSSA-AUTH-001)
 */

/**
 * Base error class for all OSSA errors
 */
export abstract class OssaError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp.toISOString(),
      },
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Check if error is client-side
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

// ============================================================================
// VALIDATION ERRORS (OSSA-VAL-XXX)
// ============================================================================

export class ValidationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-VAL-001', message, 400, details);
  }
}

export class SchemaValidationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-VAL-002', message, 400, details);
  }
}

export class ManifestValidationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-VAL-003', message, 400, details);
  }
}

export class VersionValidationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-VAL-004', message, 400, details);
  }
}

// ============================================================================
// EXPORT ERRORS (OSSA-EXP-XXX)
// ============================================================================

export class ExportError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-EXP-001', message, 500, details);
  }
}

export class PlatformNotSupportedError extends OssaError {
  constructor(platform: string, details?: Record<string, unknown>) {
    super(
      'OSSA-EXP-002',
      `Platform "${platform}" is not supported`,
      400,
      { platform, ...details }
    );
  }
}

export class TemplateNotFoundError extends OssaError {
  constructor(template: string, details?: Record<string, unknown>) {
    super(
      'OSSA-EXP-003',
      `Template "${template}" not found`,
      404,
      { template, ...details }
    );
  }
}

// ============================================================================
// MIGRATION ERRORS (OSSA-MIG-XXX)
// ============================================================================

export class MigrationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-MIG-001', message, 500, details);
  }
}

export class UnsupportedVersionError extends OssaError {
  constructor(version: string, details?: Record<string, unknown>) {
    super(
      'OSSA-MIG-002',
      `Version "${version}" is not supported`,
      400,
      { version, ...details }
    );
  }
}

// ============================================================================
// GENERATION ERRORS (OSSA-GEN-XXX)
// ============================================================================

export class GenerationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-GEN-001', message, 500, details);
  }
}

export class TypeGenerationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-GEN-002', message, 500, details);
  }
}

export class ZodGenerationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-GEN-003', message, 500, details);
  }
}

// ============================================================================
// REGISTRY ERRORS (OSSA-REG-XXX)
// ============================================================================

export class RegistryError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-REG-001', message, 500, details);
  }
}

export class AgentNotFoundError extends OssaError {
  constructor(agentId: string, details?: Record<string, unknown>) {
    super(
      'OSSA-REG-002',
      `Agent "${agentId}" not found in registry`,
      404,
      { agentId, ...details }
    );
  }
}

export class RegistryUnavailableError extends OssaError {
  constructor(registryUrl: string, details?: Record<string, unknown>) {
    super(
      'OSSA-REG-003',
      `Registry at "${registryUrl}" is unavailable`,
      503,
      { registryUrl, ...details }
    );
  }
}

// ============================================================================
// KNOWLEDGE GRAPH ERRORS (OSSA-KG-XXX)
// ============================================================================

export class KnowledgeGraphError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-KG-001', message, 500, details);
  }
}

export class VectorDBConnectionError extends OssaError {
  constructor(dbUrl: string, details?: Record<string, unknown>) {
    super(
      'OSSA-KG-002',
      `Failed to connect to vector database at "${dbUrl}"`,
      503,
      { dbUrl, ...details }
    );
  }
}

export class EntityIndexingError extends OssaError {
  constructor(entityType: string, details?: Record<string, unknown>) {
    super(
      'OSSA-KG-003',
      `Failed to index entity type "${entityType}"`,
      500,
      { entityType, ...details }
    );
  }
}

// ============================================================================
// API ERRORS (OSSA-API-XXX)
// ============================================================================

export class ApiError extends OssaError {
  constructor(message: string, statusCode: number, details?: Record<string, unknown>) {
    super('OSSA-API-001', message, statusCode, details);
  }
}

export class RateLimitError extends OssaError {
  constructor(retryAfter?: number, details?: Record<string, unknown>) {
    super(
      'OSSA-API-002',
      'Rate limit exceeded',
      429,
      { retryAfter, ...details }
    );
  }
}

export class UnauthorizedError extends OssaError {
  constructor(message = 'Unauthorized', details?: Record<string, unknown>) {
    super('OSSA-API-003', message, 401, details);
  }
}

export class ForbiddenError extends OssaError {
  constructor(message = 'Forbidden', details?: Record<string, unknown>) {
    super('OSSA-API-004', message, 403, details);
  }
}

// ============================================================================
// CONFIGURATION ERRORS (OSSA-CFG-XXX)
// ============================================================================

export class ConfigurationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-CFG-001', message, 500, details);
  }
}

export class MissingEnvVarError extends OssaError {
  constructor(envVar: string, details?: Record<string, unknown>) {
    super(
      'OSSA-CFG-002',
      `Required environment variable "${envVar}" is not set`,
      500,
      { envVar, ...details }
    );
  }
}

export class InvalidConfigError extends OssaError {
  constructor(configKey: string, details?: Record<string, unknown>) {
    super(
      'OSSA-CFG-003',
      `Invalid configuration for "${configKey}"`,
      500,
      { configKey, ...details }
    );
  }
}

// ============================================================================
// NETWORK ERRORS (OSSA-NET-XXX)
// ============================================================================

export class NetworkError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-NET-001', message, 503, details);
  }
}

export class TimeoutError extends OssaError {
  constructor(timeout: number, details?: Record<string, unknown>) {
    super(
      'OSSA-NET-002',
      `Request timed out after ${timeout}ms`,
      504,
      { timeout, ...details }
    );
  }
}

export class ConnectionRefusedError extends OssaError {
  constructor(url: string, details?: Record<string, unknown>) {
    super(
      'OSSA-NET-003',
      `Connection refused to "${url}"`,
      503,
      { url, ...details }
    );
  }
}

// ============================================================================
// AUTHENTICATION ERRORS (OSSA-AUTH-XXX)
// ============================================================================

export class AuthenticationError extends OssaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('OSSA-AUTH-001', message, 401, details);
  }
}

export class TokenExpiredError extends OssaError {
  constructor(details?: Record<string, unknown>) {
    super('OSSA-AUTH-002', 'Authentication token has expired', 401, details);
  }
}

export class InvalidTokenError extends OssaError {
  constructor(details?: Record<string, unknown>) {
    super('OSSA-AUTH-003', 'Invalid authentication token', 401, details);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Type guard to check if an error is an OssaError
 */
export function isOssaError(error: unknown): error is OssaError {
  return error instanceof OssaError;
}

/**
 * Convert any error to OssaError
 */
export function toOssaError(error: unknown): OssaError {
  if (isOssaError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new OssaError('OSSA-UNKNOWN-001', error.message, 500, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new OssaError('OSSA-UNKNOWN-002', 'An unknown error occurred', 500, {
    error: String(error),
  });
}

/**
 * Get error code from error
 */
export function getErrorCode(error: unknown): string {
  if (isOssaError(error)) {
    return error.code;
  }
  return 'OSSA-UNKNOWN-001';
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (isOssaError(error)) {
    return error.isRetryable();
  }
  return false;
}
