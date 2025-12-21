/**
 * Anthropic API Client Wrapper
 * Wraps @anthropic-ai/sdk with additional features
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageCreateParams,
  MessageStreamEvent,
  Message,
} from '@anthropic-ai/sdk/resources/messages';
import type { AnthropicConfig } from './config.js';
import { mergeConfig, validateConfig, calculateCost } from './config.js';

/**
 * Rate limiter for API requests
 */
class RateLimiter {
  private requests: number[] = [];
  private tokens: number[] = [];
  private dailyTokens = 0;
  private lastResetDate = new Date().toDateString();

  constructor(
    private requestsPerMinute: number,
    private tokensPerMinute: number,
    private tokensPerDay: number
  ) {}

  /**
   * Check if request can proceed
   */
  canProceed(estimatedTokens: number): boolean {
    this.cleanup();

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Check requests per minute
    const recentRequests = this.requests.filter((t) => t > oneMinuteAgo);
    if (recentRequests.length >= this.requestsPerMinute) {
      return false;
    }

    // Check tokens per minute
    const recentTokens = this.tokens.filter((t) => t > oneMinuteAgo);
    const tokensThisMinute = recentTokens.length;
    if (tokensThisMinute + estimatedTokens > this.tokensPerMinute) {
      return false;
    }

    // Check daily tokens
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyTokens = 0;
      this.lastResetDate = today;
    }

    if (this.dailyTokens + estimatedTokens > this.tokensPerDay) {
      return false;
    }

    return true;
  }

  /**
   * Record a request
   */
  recordRequest(tokens: number): void {
    const now = Date.now();
    this.requests.push(now);
    for (let i = 0; i < tokens; i++) {
      this.tokens.push(now);
    }
    this.dailyTokens += tokens;
  }

  /**
   * Clean up old records
   */
  private cleanup(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.requests = this.requests.filter((t) => t > oneMinuteAgo);
    this.tokens = this.tokens.filter((t) => t > oneMinuteAgo);
  }

  /**
   * Get time until next available request (ms)
   */
  getWaitTime(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const oldestRequest = this.requests.find((t) => t <= oneMinuteAgo);
    if (oldestRequest) {
      return oldestRequest + 60000 - now;
    }

    return 0;
  }
}

/**
 * Usage statistics
 */
export interface UsageStats {
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  averageLatency: number;
}

/**
 * Anthropic client wrapper with enhanced features
 */
export class AnthropicClient {
  private client: Anthropic;
  private config: Required<AnthropicConfig>;
  private rateLimiter?: RateLimiter;
  private stats: UsageStats = {
    requestCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    averageLatency: 0,
  };

  constructor(config?: AnthropicConfig) {
    this.config = mergeConfig(config);

    // Validate configuration
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      throw new Error(
        `Invalid Anthropic configuration:\n${validation.errors.join('\n')}`
      );
    }

    // Initialize Anthropic SDK client
    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });

    // Initialize rate limiter if enabled
    if (this.config.rateLimit.enableRetry) {
      const rl = this.config.rateLimit;
      this.rateLimiter = new RateLimiter(
        rl.requestsPerMinute || 50,
        rl.tokensPerMinute || 40000,
        rl.tokensPerDay || 1000000
      );
    }

    if (this.config.debug) {
      console.log('[AnthropicClient] Initialized with config:', {
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        streaming: this.config.streaming,
      });
    }
  }

  /**
   * Create a message
   */
  async createMessage(
    params: Omit<MessageCreateParams, 'model' | 'max_tokens'>
  ): Promise<Message> {
    const startTime = Date.now();

    // Apply rate limiting with retry
    if (this.rateLimiter) {
      let retries = 0;
      while (!this.rateLimiter.canProceed(this.config.maxTokens || 4096)) {
        if (retries >= (this.config.rateLimit?.maxRetries || 3)) {
          throw new Error('Rate limit exceeded and max retries reached');
        }

        const waitTime = this.rateLimiter.getWaitTime();
        const rl = this.config.rateLimit;
        const initialDelay = rl?.initialRetryDelay || 1000;
        const maxDelay = rl?.maxRetryDelay || 60000;
        const delay = Math.min(
          initialDelay * Math.pow(2, retries),
          maxDelay
        );

        if (this.config.debug) {
          console.log(
            `[AnthropicClient] Rate limited, waiting ${delay}ms (attempt ${retries + 1}/${this.config.rateLimit.maxRetries})`
          );
        }

        await this.sleep(Math.max(waitTime, delay));
        retries++;
      }
    }

    // Make the API call
    try {
      const response = await this.client.messages.create({
        ...params,
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: params.temperature ?? this.config.temperature,
        top_p: params.top_p ?? this.config.topP,
        stop_sequences: params.stop_sequences ?? this.config.stopSequences,
      });

      // Update statistics
      const latency = Date.now() - startTime;
      if ('usage' in response && response.usage) {
        this.updateStats(
          response.usage.input_tokens,
          response.usage.output_tokens,
          latency
        );
      }

      // Record rate limit usage
      if (this.rateLimiter && 'usage' in response && response.usage) {
        this.rateLimiter.recordRequest(
          response.usage.input_tokens + response.usage.output_tokens
        );
      }

      if (this.config.debug && 'id' in response) {
        console.log(`[AnthropicClient] Message created:`, {
          id: response.id,
          model: 'model' in response ? response.model : 'unknown',
          stopReason: 'stop_reason' in response ? response.stop_reason : 'unknown',
          usage: 'usage' in response ? response.usage : undefined,
          latency: `${latency}ms`,
        });
      }

      return response;
    } catch (error) {
      if (this.config.debug) {
        console.error('[AnthropicClient] Error creating message:', error);
      }
      throw error;
    }
  }

  /**
   * Create a streaming message
   */
  async createMessageStream(
    params: Omit<MessageCreateParams, 'model' | 'max_tokens'>
  ): Promise<AsyncIterable<MessageStreamEvent>> {
    const startTime = Date.now();

    // Apply rate limiting
    if (this.rateLimiter) {
      let retries = 0;
      while (!this.rateLimiter.canProceed(this.config.maxTokens || 4096)) {
        if (retries >= (this.config.rateLimit?.maxRetries || 3)) {
          throw new Error('Rate limit exceeded and max retries reached');
        }

        const waitTime = this.rateLimiter.getWaitTime();
        const rl = this.config.rateLimit;
        const initialDelay = rl?.initialRetryDelay || 1000;
        const maxDelay = rl?.maxRetryDelay || 60000;
        const delay = Math.min(
          initialDelay * Math.pow(2, retries),
          maxDelay
        );

        await this.sleep(Math.max(waitTime, delay));
        retries++;
      }
    }

    try {
      const stream = await this.client.messages.stream({
        ...params,
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: params.temperature ?? this.config.temperature,
        top_p: params.top_p ?? this.config.topP,
        stop_sequences: params.stop_sequences ?? this.config.stopSequences,
      });

      if (this.config.debug) {
        console.log('[AnthropicClient] Streaming message created');
      }

      // Track usage when stream completes
      let inputTokens = 0;
      let outputTokens = 0;

      const wrappedStream = (async function* (
        this: AnthropicClient
      ): AsyncIterable<MessageStreamEvent> {
        for await (const event of stream) {
          if (event.type === 'message_start') {
            inputTokens = event.message.usage.input_tokens;
          } else if (event.type === 'message_delta') {
            outputTokens += event.usage.output_tokens;
          }
          yield event;
        }

        // Update stats after stream completes
        const latency = Date.now() - startTime;
        this.updateStats(inputTokens, outputTokens, latency);

        if (this.rateLimiter) {
          this.rateLimiter.recordRequest(inputTokens + outputTokens);
        }
      }.bind(this))();

      return wrappedStream;
    } catch (error) {
      if (this.config.debug) {
        console.error('[AnthropicClient] Error creating stream:', error);
      }
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  getStats(): Readonly<UsageStats> {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      requestCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      averageLatency: 0,
    };
  }

  /**
   * Get the underlying Anthropic client
   */
  getClient(): Anthropic {
    return this.client;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<AnthropicConfig>> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AnthropicConfig>): void {
    this.config = mergeConfig({ ...this.config, ...updates });

    const validation = validateConfig(this.config);
    if (!validation.valid) {
      throw new Error(
        `Invalid configuration update:\n${validation.errors.join('\n')}`
      );
    }

    // Recreate rate limiter if settings changed
    if (updates.rateLimit && this.config.rateLimit.enableRetry) {
      const rl = this.config.rateLimit;
      this.rateLimiter = new RateLimiter(
        rl.requestsPerMinute || 50,
        rl.tokensPerMinute || 40000,
        rl.tokensPerDay || 1000000
      );
    }
  }

  /**
   * Update usage statistics
   */
  private updateStats(
    inputTokens: number,
    outputTokens: number,
    latency: number
  ): void {
    this.stats.requestCount++;
    this.stats.totalInputTokens += inputTokens;
    this.stats.totalOutputTokens += outputTokens;
    this.stats.totalCost += calculateCost(
      this.config.model,
      inputTokens,
      outputTokens
    );

    // Update average latency
    this.stats.averageLatency =
      (this.stats.averageLatency * (this.stats.requestCount - 1) + latency) /
      this.stats.requestCount;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
