/**
 * OSSA SDKs - Unified SDK Architecture
 *
 * SOLID: Single Responsibility per SDK, Open/Closed for extensibility
 * DRY: Shared validation, type generation, and utilities
 * Zod: Runtime validation for all SDKs
 * OpenAPI: SDK contracts defined in openapi/
 * CRUD: Create/Read/Update/Delete operations for manifests
 */

export * from './typescript/index.js';
export * from './python/index.js';
export * from './shared/index.js';
