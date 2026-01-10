/**
 * OSSA SDK - TypeScript SDK for OSSA manifests
 *
 * Provides:
 * - Type-safe manifest handling
 * - Schema validation with Zod
 * - YAML parsing and serialization
 * - CLI integration
 *
 * Note: Python SDK is in ./python/ as separate pip package
 * Note: Go SDK is in ./go/ as separate Go module
 */

// Export TypeScript SDK
export * from './typescript/index.js';

// Export shared utilities (avoiding name conflicts)
export {
  ManifestLoader,
  SchemaValidator,
  loadManifest,
  validateManifest,
} from './shared/index.js';
