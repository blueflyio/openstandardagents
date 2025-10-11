/**
 * OSSA Specification Package
 * Open Standard for Scalable AI Agents
 *
 * Supports both v0.1.9 (legacy) and v1.0 (current) specifications
 */

// Export all v1.0 types (default)
export * from './types';

// Legacy v0.1.9 schema exports for backward compatibility
export { default as agentManifestSchemaLegacy } from '../schemas/agent-manifest.schema.json';
export { default as capabilitySchemaLegacy } from '../schemas/capability.schema.json';
export { default as conformanceSchemaLegacy } from '../schemas/conformance.schema.json';
export { default as workflowSchemaLegacy } from '../schemas/workflow.schema.json';

// v1.0 Constants (current)
export const OSSA_VERSION = '1.0' as const;
export const SCHEMA_VERSION = 'https://ossa.ai/schemas/v1.0' as const;

// Legacy v0.1.9 constants for backward compatibility
export const OSSA_API_VERSION = '@bluefly/ossa/v0.1.9';
export const OSSA_SPECIFICATION_VERSION = '0.1.9';

// v1.0 Schema paths
export const SCHEMA_PATHS = {
  AGENT_MANIFEST: 'schemas/v1.0/agent-manifest.schema.json',
  CAPABILITY: 'schemas/v1.0/capability.schema.json',
  DISCOVERY: 'schemas/v1.0/discovery.schema.json',
  BRIDGE: 'schemas/v1.0/bridge.schema.json',
  MONITORING: 'schemas/v1.0/monitoring.schema.json',
  PERFORMANCE: 'schemas/v1.0/performance.schema.json'
} as const;

// Common patterns for v1.0
export const PATTERNS = {
  AGENT_NAME: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
  CAPABILITY_NAME: /^[a-z0-9_]+$/,
  SEMANTIC_VERSION: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  AGENT_ID: /^[a-z0-9-]+@\d+\.\d+\.\d+$/
} as const;

export const AGENT_TYPES = [
  'orchestrator',
  'worker',
  'critic',
  'judge',
  'trainer',
  'governor',
  'monitor',
  'integrator',
  'voice'
] as const;

export const CAPABILITY_TYPES = [
  'action',
  'sensor',
  'processor',
  'coordinator',
  'validator'
] as const;

export const CONFORMANCE_LEVELS = [
  'bronze',
  'silver',
  'gold',
  'advanced'
] as const;

export const FEEDBACK_LOOP_PHASES = [
  'plan',
  'execute',
  'review',
  'judge',
  'learn',
  'govern'
] as const;