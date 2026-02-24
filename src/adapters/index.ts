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
// Config-only adapters (lightweight JSON export for MCP tool responses)
import { KagentConfigAdapter } from './kubernetes/config-adapter.js';
import { DockerConfigAdapter } from './docker/config-adapter.js';
import { OpenAIConfigAdapter } from './openai-agents/config-adapter.js';
import { AnthropicConfigAdapter } from './anthropic/config-adapter.js';
import { AutogenConfigAdapter } from './autogen/config-adapter.js';
import { SemanticKernelConfigAdapter } from './semantic-kernel/config-adapter.js';
import { SymfonyAiPlatformAdapter } from './symfony/platform-adapter.js';
import { FusionInventoryConfigAdapter } from './fusioninventory/config-adapter.js';

let _initialized = false;

/**
 * Initialize and register all export adapters.
 * Safe to call multiple times; subsequent calls are no-ops.
 */
export function initializeAdapters(): void {
  if (_initialized) return;
  _initialized = true;

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

  // Register Symfony AI Agent export adapter
  registry.register(new SymfonyAiPlatformAdapter());

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

  // Config-only adapters (lightweight JSON for MCP convert)
  registry.register(new KagentConfigAdapter());
  registry.register(new DockerConfigAdapter());
  registry.register(new OpenAIConfigAdapter());
  registry.register(new AnthropicConfigAdapter());
  registry.register(new AutogenConfigAdapter());
  registry.register(new SemanticKernelConfigAdapter());
  registry.register(new FusionInventoryConfigAdapter());
}

// Export registry for use in commands
export { registry };
