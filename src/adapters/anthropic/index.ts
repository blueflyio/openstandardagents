/**
 * Anthropic Adapter for OSSA
 * Runtime adapter for executing OSSA agents with Anthropic Claude
 *
 * @packageDocumentation
 */

// Main runtime adapter
export { AnthropicAdapter } from './runtime.js';
export type {
  AgentResponse,
  RuntimeOptions,
  AgentInfo,
} from './runtime.js';

// Client wrapper
export { AnthropicClient } from './client.js';
export type { UsageStats } from './client.js';

// Configuration
export {
  mergeConfig,
  validateConfig,
  calculateCost,
  getRecommendedModel,
  DEFAULT_MODELS,
  DEFAULT_CONFIG,
  DEFAULT_RATE_LIMITS,
  MODEL_PRICING,
  MODEL_CONTEXT_WINDOWS,
} from './config.js';
export type {
  AnthropicConfig,
  AnthropicModel,
  RateLimitConfig,
} from './config.js';

// Tool mapping
export { ToolMapper, createToolMapper, extractCapabilities, validateToolInput, createTool, COMMON_TOOLS } from './tools.js';
export type {
  OssaCapability,
  ToolHandler,
  ToolDefinition,
} from './tools.js';

// Message conversion
export {
  convertToAnthropicMessages,
  convertFromAnthropicMessage,
  createTextMessage,
  createSystemMessage,
  createToolUseMessage,
  createToolResultMessage,
  extractText,
  hasToolUse,
  extractToolUses,
  validateMessage,
  mergeMessages,
} from './messages.js';
export type {
  OssaMessage,
  OssaMessageContent,
  AnthropicContentBlock,
} from './messages.js';

/**
 * Create an Anthropic adapter instance
 *
 * @example
 * ```typescript
 * import { createAdapter } from '@bluefly/openstandardagents/adapters/anthropic';
 *
 * const adapter = createAdapter(agentManifest, {
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   model: 'claude-3-5-sonnet-20241022',
 * });
 *
 * const response = await adapter.chat('Hello!');
 * console.log(response);
 * ```
 */
export { AnthropicAdapter as createAdapter } from './runtime.js';

/**
 * Version information
 */
export const VERSION = '0.3.0';

/**
 * Default export
 */
export { AnthropicAdapter as default } from './runtime.js';
