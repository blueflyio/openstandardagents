/**
 * @ossa/runtime - OSSA Runtime SDK
 * Reference implementation for executing OSSA agents
 */

// Export types (interfaces renamed to avoid collision with classes)
export type {
  Capability,
  AgentManifest,
  ExecutionContext,
  ExecutionResult,
  CapabilityHandler,
  OssaAgent as IOssaAgent,
  Runtime as IRuntime,
  ManifestLoader as IManifestLoader,
  CapabilityRegistry as ICapabilityRegistry,
} from './types.js';

// Export agent implementation (class)
export { OssaAgent, createAgent } from './agent.js';

// Export runtime implementation (class)
export { OssaRuntime, createRuntime } from './runtime.js';
export type { RuntimeConfig } from './runtime.js';

// Export manifest loader (class)
export { ManifestLoader, createManifestLoader } from './manifest.js';

// Export capability registry (class)
export { CapabilityRegistry, createCapabilityRegistry } from './capabilities.js';

/**
 * Quick start example:
 *
 * ```typescript
 * import { createRuntime } from '@ossa/runtime';
 *
 * // Create runtime
 * const runtime = createRuntime();
 *
 * // Load an agent
 * const agent = await runtime.loadAgent('./agent-manifest.yaml');
 *
 * // Register a capability handler
 * agent.registerCapability(
 *   {
 *     name: 'search',
 *     description: 'Search documents',
 *     input_schema: { type: 'object', properties: { query: { type: 'string' } } },
 *     output_schema: { type: 'object', properties: { results: { type: 'array' } } }
 *   },
 *   async (input) => {
 *     // Implementation here
 *     return { results: [] };
 *   }
 * );
 *
 * // Execute capability
 * const result = await agent.execute('search', { query: 'example' });
 * console.log(result);
 * ```
 */
