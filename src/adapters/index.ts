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
import { NPMAdapter } from './npm/adapter.js';
import { WarpAdapter } from './warp/adapter.js';
import { CursorAdapter } from './cursor/adapter.js';
import { ClaudeCodeAdapter } from './claude-code/adapter.js';
import { MobileAgentAdapter } from './mobile-agent/adapter.js';
import { LangflowPlatformAdapter } from './langflow/platform-adapter.js';
import { ClaudeAgentSdkAdapter } from './claude-agent-sdk/adapter.js';

/**
 * Initialize and register all export adapters
 */
export function initializeAdapters(): void {
  // Register LangChain adapter
  registry.register(new LangChainAdapter());

  // Register LangFlow adapter (OSSA -> LangFlow flow JSON for CI + Studio)
  registry.register(new LangflowPlatformAdapter());

  // Register MCP adapter
  registry.register(new MCPAdapter());

  // Register CrewAI adapter
  registry.register(new CrewAIAdapter());

  // Register GitLab Duo adapter
  registry.register(new GitLabDuoAdapter());

  // Register Drupal adapter
  registry.register(new DrupalAdapter());

  // Register NPM adapter
  registry.register(new NPMAdapter());

  // Register Warp adapter
  registry.register(new WarpAdapter());

  // Register Cursor adapter
  registry.register(new CursorAdapter());

  // Register Claude Code adapter
  registry.register(new ClaudeCodeAdapter());

  // Register MobileAgent adapter
  registry.register(new MobileAgentAdapter());

  // Register Claude Agent SDK adapter
  registry.register(new ClaudeAgentSdkAdapter());
}

// Export registry for use in commands
export { registry };
