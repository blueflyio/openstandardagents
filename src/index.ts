/**
 * OSSA v0.1.9 - Open Standards Scalable Agents
 * Pure Specification Standard Entry Point
 * 
 * This package contains only specification files and type definitions.
 * Implementation details are available in the companion agent-buildkit repository.
 */

// Export specification file paths (for dynamic loading)
export const SPECIFICATION_FILES = {
  acdl: './api/acdl-specification.yml',
  orchestration: './api/orchestration.openapi.yml', 
  main: './api/specification.openapi.yml',
  voice: './api/voice-agent-specification.yml',
  agentManifestSchema: './api/agent-manifest.schema.json',
  workflowSchema: './api/workflow.schema.json'
} as const;

// Export TypeScript type definitions
export * from './types/index.js';

// Export specification validator
export { SpecificationValidator } from './specification/validator.js';

// Package metadata
export const OSSA_VERSION = '0.1.9';
export const SPECIFICATION_VERSION = '@bluefly/open-standards-scalable-agents@0.1.9';

// Project URLs (ACTUAL locations)
export const PROJECT_URLS = {
  repository: 'https://gitlab.bluefly.io/llm/openapi-ai-agents-standard',
  npm: 'https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents',
  issues: 'https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues',
  changelog: 'https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/releases'
} as const;

// Implementation references
export const IMPLEMENTATION_REFS = {
  referenceImplementation: 'https://gitlab.bluefly.io/llm/agent_buildkit',
  registryBridge: 'https://gitlab.bluefly.io/llm/agent_buildkit/-/tree/main/src/registry',
  examples: 'https://gitlab.bluefly.io/llm/agent_buildkit/-/tree/main/examples'
} as const;