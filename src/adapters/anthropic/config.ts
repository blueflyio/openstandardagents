/**
 * Anthropic Adapter Configuration
 * Configuration management for Claude/Anthropic runtime
 */

/**
 * Anthropic model options
 */
export type AnthropicModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | 'claude-2.1'
  | 'claude-2.0'
  | 'claude-instant-1.2';

/**
 * Default models by category
 */
export const DEFAULT_MODELS = {
  /** Highest intelligence, best for complex tasks */
  opus: 'claude-3-opus-20240229' as AnthropicModel,
  /** Balanced performance and cost */
  sonnet: 'claude-3-5-sonnet-20241022' as AnthropicModel,
  /** Fastest, most cost-effective */
  haiku: 'claude-3-5-haiku-20241022' as AnthropicModel,
  /** Default model */
  default: 'claude-3-5-sonnet-20241022' as AnthropicModel,
} as const;

/**
 * Model pricing per 1M tokens (USD)
 */
export const MODEL_PRICING = {
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-2.1': { input: 8.0, output: 24.0 },
  'claude-2.0': { input: 8.0, output: 24.0 },
  'claude-instant-1.2': { input: 0.8, output: 2.4 },
} as const;

/**
 * Model context windows (tokens)
 */
export const MODEL_CONTEXT_WINDOWS = {
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-5-haiku-20241022': 200000,
  'claude-3-opus-20240229': 200000,
  'claude-3-sonnet-20240229': 200000,
  'claude-3-haiku-20240307': 200000,
  'claude-2.1': 200000,
  'claude-2.0': 100000,
  'claude-instant-1.2': 100000,
} as const;

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Requests per minute */
  requestsPerMinute?: number;
  /** Tokens per minute */
  tokensPerMinute?: number;
  /** Tokens per day */
  tokensPerDay?: number;
  /** Enable automatic retry with backoff */
  enableRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Initial retry delay (ms) */
  initialRetryDelay?: number;
  /** Maximum retry delay (ms) */
  maxRetryDelay?: number;
}

/**
 * Default rate limits (tier 1)
 */
export const DEFAULT_RATE_LIMITS: Required<RateLimitConfig> = {
  requestsPerMinute: 50,
  tokensPerMinute: 40000,
  tokensPerDay: 1000000,
  enableRetry: true,
  maxRetries: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 60000,
};

/**
 * Anthropic adapter configuration
 */
export interface AnthropicConfig {
  /** API key (or use ANTHROPIC_API_KEY env var) */
  apiKey?: string;
  /** Model to use */
  model?: AnthropicModel;
  /** Temperature (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top P sampling */
  topP?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;
  /** Enable streaming responses */
  streaming?: boolean;
  /** Custom base URL (for proxy/testing) */
  baseURL?: string;
  /** Request timeout (ms) */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<
  Omit<AnthropicConfig, 'apiKey' | 'baseURL'>
> = {
  model: DEFAULT_MODELS.default,
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1.0,
  stopSequences: [],
  rateLimit: DEFAULT_RATE_LIMITS,
  streaming: false,
  timeout: 120000, // 2 minutes
  debug: false,
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(
  userConfig?: AnthropicConfig
): Required<AnthropicConfig> {
  return {
    apiKey: userConfig?.apiKey || process.env.ANTHROPIC_API_KEY || '',
    model: userConfig?.model || DEFAULT_CONFIG.model,
    temperature: userConfig?.temperature ?? DEFAULT_CONFIG.temperature,
    maxTokens: userConfig?.maxTokens ?? DEFAULT_CONFIG.maxTokens,
    topP: userConfig?.topP ?? DEFAULT_CONFIG.topP,
    stopSequences: userConfig?.stopSequences || DEFAULT_CONFIG.stopSequences,
    rateLimit: {
      ...DEFAULT_RATE_LIMITS,
      ...userConfig?.rateLimit,
    },
    streaming: userConfig?.streaming ?? DEFAULT_CONFIG.streaming,
    baseURL: userConfig?.baseURL || 'https://api.anthropic.com',
    timeout: userConfig?.timeout ?? DEFAULT_CONFIG.timeout,
    debug: userConfig?.debug ?? DEFAULT_CONFIG.debug,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Required<AnthropicConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate API key
  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push(
      'API key is required. Set ANTHROPIC_API_KEY env var or pass apiKey in config'
    );
  }

  // Validate temperature
  if (config.temperature < 0 || config.temperature > 1) {
    errors.push('Temperature must be between 0 and 1');
  }

  // Validate maxTokens
  if (config.maxTokens < 1) {
    errors.push('maxTokens must be at least 1');
  }

  const contextWindow = MODEL_CONTEXT_WINDOWS[config.model];
  if (config.maxTokens > contextWindow) {
    errors.push(
      `maxTokens (${config.maxTokens}) exceeds model context window (${contextWindow})`
    );
  }

  // Validate topP
  if (config.topP < 0 || config.topP > 1) {
    errors.push('topP must be between 0 and 1');
  }

  // Validate timeout
  if (config.timeout < 1000) {
    errors.push('timeout must be at least 1000ms');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate estimated cost for a request
 */
export function calculateCost(
  model: AnthropicModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Get recommended model for a task
 */
export function getRecommendedModel(options: {
  complexity?: 'low' | 'medium' | 'high';
  speed?: 'fast' | 'balanced' | 'quality';
  budget?: 'low' | 'medium' | 'high';
}): AnthropicModel {
  const {
    complexity = 'medium',
    speed = 'balanced',
    budget = 'medium',
  } = options;

  // High complexity always needs Opus
  if (complexity === 'high') {
    return DEFAULT_MODELS.opus;
  }

  // Low complexity can use Haiku
  if (complexity === 'low') {
    return DEFAULT_MODELS.haiku;
  }

  // Medium complexity - consider speed and budget
  if (speed === 'fast' || budget === 'low') {
    return DEFAULT_MODELS.haiku;
  }

  if (budget === 'high' || speed === 'quality') {
    return DEFAULT_MODELS.opus;
  }

  // Default to Sonnet for balanced performance
  return DEFAULT_MODELS.sonnet;
}
