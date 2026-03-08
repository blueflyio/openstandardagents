/**
 * @ossa/framework-converters
 *
 * Convert agents from popular frameworks to OSSA manifests
 */

export * from './types.js';
export * from './converters/langchain.js';
export * from './converters/crewai.js';
export * from './converters/autogen.js';
export * from './converters/langflow.js';
export * from './converters/agentscope.js';

import { langchainConverter } from './converters/langchain.js';
import { crewaiConverter } from './converters/crewai.js';
import { autogenConverter } from './converters/autogen.js';
import { langflowConverter } from './converters/langflow.js';
import { agentscopeConverter } from './converters/agentscope.js';
import type { FrameworkConverter } from './types.js';

/**
 * Registry of all available converters (import from platform -> OSSA)
 */
export const converters: Record<string, FrameworkConverter> = {
  langchain: langchainConverter,
  crewai: crewaiConverter,
  autogen: autogenConverter,
  langflow: langflowConverter,
  agentscope: agentscopeConverter,
};

/**
 * Auto-detect framework and convert
 */
export async function autoConvert(input: unknown) {
  for (const [name, converter] of Object.entries(converters)) {
    if (await converter.validate(input)) {
      return {
        framework: name,
        result: await converter.convert(input),
      };
    }
  }

  throw new Error('Could not detect framework - please specify manually');
}

/**
 * Get converter by name
 */
export function getConverter(framework: string): FrameworkConverter {
  const converter = converters[framework.toLowerCase()];

  if (!converter) {
    throw new Error(
      `Unknown framework: ${framework}. Available: ${Object.keys(converters).join(', ')}`
    );
  }

  return converter;
}
