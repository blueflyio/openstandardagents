/**
 * OSSA TypeScript SDK
 *
 * TypeScript SDK for Open Standard for Software Agents (OSSA) - The OpenAPI for agents.
 * Provides types, validation, and utilities for working with OSSA manifests.
 *
 * @example
 * ```typescript
 * import { loadManifest, validateManifest, isAgent } from '@ossa/sdk';
 *
 * const manifest = loadManifest('my-agent.ossa.yaml');
 *
 * if (isAgent(manifest)) {
 *   console.log(`Agent: ${manifest.metadata.name}`);
 *   console.log(`Role: ${manifest.spec.role}`);
 * }
 *
 * const result = validateManifest(manifest);
 * if (result.valid) {
 *   console.log('✅ Manifest is valid');
 * }
 * ```
 */

// Version info
export { VERSION, OSSA_VERSION } from './types.js';

// Core types
export type {
  Kind,
  AccessTier,
  LLMProvider,
  Metadata,
  Tool,
  ToolHandler,
  LLMConfig,
  Guardrails,
  Safety,
  ServiceAccount,
  DORATracking,
  Identity,
  Capability,
  AgentSpec,
  TaskStep,
  TaskSpec,
  WorkflowAgent,
  WorkflowStep,
  WorkflowSpec,
  AgentManifest,
  TaskManifest,
  WorkflowManifest,
  OSSAManifest,
  ValidationError,
  ValidationResult,
} from './types.js';

// Type guards and helpers
export {
  isAgent,
  isTask,
  isWorkflow,
  normalizeAccessTier,
  getAccessTier,
} from './types.js';

// Manifest operations (re-export from manifest service)
export { ManifestService } from './manifest.js';

// Validation (re-export from validator service)
export { ValidatorService } from './validator.js';

// CloudEvents
export * from './events/index.js';

// W3C Baggage Tracing
export * from './tracing/index.js';
