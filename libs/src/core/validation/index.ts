// OSSA Core Validation Exports
// Centralized validation system for OSSA compliance

export { OSSAOpenAPIValidator, validateOpenAPISpec } from './openapi-validator.js';

// Re-export types for external use
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  OSSAValidationConfig
} from './openapi-validator.js';

// Import types for internal use
import type { OSSAValidationConfig } from './openapi-validator.js';
import { OSSAOpenAPIValidator } from './openapi-validator.js';

// Validation constants
export const OSSA_VERSIONS = ['0.1.9', '0.1.8', '0.1.7'] as const;
export const CONFORMANCE_TIERS = ['core', 'governed', 'advanced', 'enterprise'] as const;
export const SUPPORTED_OPENAPI_VERSIONS = ['3.1.0', '3.0.3', '3.0.2'] as const;

// OSSA-specific validation rules
export const OSSA_REQUIRED_PATHS = ['/agent/health', '/agent/info', '/agent/capabilities'] as const;

export const OSSA_RECOMMENDED_PATHS = [
  '/agent/execute',
  '/agent/config',
  '/agent/metrics',
  '/agent/discover',
  '/agent/register'
] as const;

export const OSSA_SECURITY_SCHEMES = ['ApiKey', 'BearerAuth', 'OAuth2'] as const;

// Validation utilities
export function isValidOSSAVersion(version: string): boolean {
  return OSSA_VERSIONS.includes(version as any);
}

export function isValidConformanceTier(tier: string): boolean {
  return CONFORMANCE_TIERS.includes(tier as any);
}

export function getRecommendedOSSAVersion(): string {
  return OSSA_VERSIONS[0]; // Latest version
}

// Factory function for creating validators
export function createOSSAValidator(config?: Partial<OSSAValidationConfig>) {
  return new OSSAOpenAPIValidator(config);
}
