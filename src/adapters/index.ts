/**
 * Adapter Registry Initialization
 *
 * Registers all export platform adapters with the central registry.
 * Import this file early in the CLI to ensure all adapters are available.
 */

import { registry } from './registry/platform-registry.js';
import { LangChainAdapter } from './langchain/adapter.js';
import { MCPAdapter } from './mcp/adapter.js';
import { CrewAIAdapter } from './crewai/adapter.js';
import { GitLabDuoAdapter } from './gitlab-duo/adapter.js';
import { DrupalAdapter } from './drupal/adapter.js';

/**
 * Initialize and register all export adapters
 */
export function initializeAdapters(): void {
  // Register LangChain adapter
  registry.register(new LangChainAdapter());

  // Register MCP adapter
  registry.register(new MCPAdapter());

  // Register CrewAI adapter
  registry.register(new CrewAIAdapter());

  // Register GitLab Duo adapter
  registry.register(new GitLabDuoAdapter());

  // Register Drupal adapter
  registry.register(new DrupalAdapter());

  console.log(`Registered ${registry.size} export adapters`);
}

// Export registry for use in commands
export { registry };
