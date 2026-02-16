/**
 * Anthropic Adapter for OSSA
 * Configuration, tools, and message conversion for Anthropic Claude
 * Uses official @anthropic-ai/sdk for API calls
 *
 * @packageDocumentation
 */

// Client (NEW - uses official SDK)
export { AnthropicClient, createAnthropicClient } from './client.js';

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
export {
  ToolMapper,
  createToolMapper,
  extractCapabilities,
  validateToolInput,
  createTool,
  COMMON_TOOLS,
} from './tools.js';
export type { OssaCapability, ToolHandler, ToolDefinition } from './tools.js';

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
 * Version information
 */
export const VERSION = '0.4.0';
