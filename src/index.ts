/**
 * OSSA Main Export
 * Export all services, repositories, and types for library usage
 */

// Types
export * from './types/index.js';
export * from './types/openapi-extensions.js';

// Transports
export * from './transports/index.js';

// Version utilities (dynamic version detection)
export {
  getVersionInfo,
  getVersion,
  getSchemaPath,
  getApiVersion,
  getSchemaDir,
  isPrerelease,
  getSupportedVersions,
  resolveSchemaPath,
  type VersionInfo,
} from './utils/version.js';

// Repositories
export { SchemaRepository } from './repositories/schema.repository.js';
export { ManifestRepository } from './repositories/manifest.repository.js';

// Services
export { ValidationService } from './services/validation.service.js';
export { GenerationService } from './services/generation.service.js';
export { MigrationService } from './services/migration.service.js';

// DI Container
export { container, getService, resetContainer } from './di-container.js';

// Framework Adapters
export { LangChainAdapter } from './adapters/langchain-adapter.js';
export { CrewAIAdapter } from './adapters/crewai-adapter.js';
export { LangflowAdapter } from './adapters/langflow-adapter.js';
export { LangSmithAdapter } from './adapters/langsmith.adapter.js';
export { LangfuseAdapter } from './adapters/langfuse.adapter.js';
export { PhoenixAdapter } from './adapters/phoenix.adapter.js';
export { OpenTelemetryAdapter } from './adapters/opentelemetry.adapter.js';
export { OpenAPIAdapter } from './adapters/openapi-adapter.js';
export { DrupalAdapter } from './adapters/drupal/index.js';
export { SymfonyAdapter } from './adapters/symfony/index.js';

// Anthropic Adapter (full exports)
export {
  AnthropicAdapter,
  createAdapter,
  mergeConfig,
  validateConfig,
  calculateCost,
  getRecommendedModel,
  DEFAULT_MODELS,
  DEFAULT_CONFIG,
  DEFAULT_RATE_LIMITS,
  MODEL_PRICING,
  MODEL_CONTEXT_WINDOWS,
  ToolMapper,
  createToolMapper,
  extractCapabilities,
  validateToolInput,
  createTool,
  COMMON_TOOLS,
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
} from './adapters/anthropic/index.js';

// Anthropic Adapter Types
export type {
  AgentResponse,
  RuntimeOptions,
  AgentInfo,
  AnthropicConfig,
  AnthropicModel,
  RateLimitConfig,
  OssaCapability,
  ToolHandler,
  ToolDefinition,
  OssaMessage,
  OssaMessageContent,
  AnthropicContentBlock,
} from './adapters/anthropic/index.js';
