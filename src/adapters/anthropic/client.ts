/**
 * Anthropic Client using Official SDK
 * Replaces custom serialization with SDK client methods
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { AnthropicConfig } from './config.js';
import type { OssaAgent } from '../../types/index.js';

/**
 * Anthropic Client Wrapper
 * Uses official SDK for all API calls
 */
export class AnthropicClient {
  private client: Anthropic;
  private config: AnthropicConfig;
  private stats = {
    requestCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
  };

  constructor(config: AnthropicConfig) {
    // Validate config
    if (
      config.temperature !== undefined &&
      (config.temperature < 0 || config.temperature > 1)
    ) {
      throw new Error('Temperature must be between 0 and 1');
    }
    this.config = { ...config };

    // Initialize SDK client
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseURL: config.baseURL,
      timeout: config.timeout,
    });
  }

  /**
   * Create a message using SDK
   */
  async createMessage(params: {
    system?: string;
    messages: MessageParam[];
    tools?: Tool[];
    max_tokens?: number;
  }) {
    const response = await this.client.messages.create({
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      system: params.system,
      messages: params.messages,
      tools: params.tools,
      max_tokens: params.max_tokens || this.config.maxTokens || 4096,
      temperature: this.config.temperature,
      top_p: this.config.topP,
      stop_sequences: this.config.stopSequences,
    });

    // Update stats
    this.stats.requestCount++;
    this.stats.totalInputTokens += response.usage.input_tokens;
    this.stats.totalOutputTokens += response.usage.output_tokens;

    return response;
  }

  /**
   * Create a streaming message using SDK
   */
  async createMessageStream(params: {
    system?: string;
    messages: MessageParam[];
    tools?: Tool[];
    max_tokens?: number;
  }) {
    const stream = await this.client.messages.stream({
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      system: params.system,
      messages: params.messages,
      tools: params.tools,
      max_tokens: params.max_tokens || this.config.maxTokens || 4096,
      temperature: this.config.temperature,
      top_p: this.config.topP,
      stop_sequences: this.config.stopSequences,
    });

    this.stats.requestCount++;
    return stream;
  }

  /**
   * Get SDK client instance
   */
  getClient(): Anthropic {
    return this.client;
  }

  getConfig(): AnthropicConfig {
    return { ...this.config };
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      requestCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    };
  }

  updateConfig(config: Partial<AnthropicConfig>): void {
    this.config = { ...this.config, ...config };

    // Recreate client with new config
    this.client = new Anthropic({
      apiKey: this.config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });
  }
}

/**
 * Create Anthropic client from OSSA agent
 */
export function createAnthropicClient(agent: OssaAgent): AnthropicClient {
  const anthropicExt = agent.extensions?.anthropic as
    | AnthropicConfig
    | undefined;

  return new AnthropicClient(anthropicExt || {});
}
