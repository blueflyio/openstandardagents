/**
 * LLMConfigBuilder - Fluent API for building LLM configuration
 *
 * @example
 * ```typescript
 * const llmConfig = LLMConfigBuilder.anthropic('claude-sonnet-4')
 *   .temperature(0.7)
 *   .maxTokens(4096)
 *   .build();
 *
 * const openaiConfig = LLMConfigBuilder.openai('gpt-4')
 *   .temperature(0.5)
 *   .build();
 *
 * const azureConfig = LLMConfigBuilder.azure('gpt-4-turbo')
 *   .profile('production')
 *   .build();
 * ```
 */

import type { LLMConfig } from '../types.js';
import type { LLMProviderType } from '../constants.js';

export class LLMConfigBuilder {
  private config: Partial<LLMConfig>;

  private constructor(provider: LLMProviderType | string, model: string) {
    this.config = {
      provider,
      model,
    };
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Create Anthropic LLM configuration
   */
  static anthropic(model: string): LLMConfigBuilder {
    return new LLMConfigBuilder('anthropic', model);
  }

  /**
   * Create OpenAI LLM configuration
   */
  static openai(model: string): LLMConfigBuilder {
    return new LLMConfigBuilder('openai', model);
  }

  /**
   * Create Azure OpenAI LLM configuration
   */
  static azure(model: string): LLMConfigBuilder {
    return new LLMConfigBuilder('azure', model);
  }

  /**
   * Create Google LLM configuration
   */
  static google(model: string): LLMConfigBuilder {
    return new LLMConfigBuilder('google', model);
  }

  /**
   * Create AWS Bedrock LLM configuration
   */
  static bedrock(model: string): LLMConfigBuilder {
    return new LLMConfigBuilder('bedrock', model);
  }

  /**
   * Create Groq LLM configuration
   */
  static groq(model: string): LLMConfigBuilder {
    return new LLMConfigBuilder('groq', model);
  }

  /**
   * Create Ollama LLM configuration
   */
  static ollama(model: string): LLMConfigBuilder {
    return new LLMConfigBuilder('ollama', model);
  }

  /**
   * Create custom provider LLM configuration
   */
  static custom(provider: string, model: string): LLMConfigBuilder {
    return new LLMConfigBuilder(provider, model);
  }

  // ============================================================================
  // Builder Methods
  // ============================================================================

  /**
   * Set temperature (0.0 to 1.0)
   * Higher values make output more random, lower values more deterministic
   */
  temperature(temperature: number): this {
    if (temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be between 0.0 and 1.0');
    }
    this.config.temperature = temperature;
    return this;
  }

  /**
   * Set maximum tokens for response
   */
  maxTokens(maxTokens: number): this {
    if (maxTokens < 1) {
      throw new Error('maxTokens must be positive');
    }
    this.config.max_tokens = maxTokens;
    return this;
  }

  /**
   * Set profile (e.g., 'production', 'development', 'testing')
   */
  profile(profile: string): this {
    this.config.profile = profile;
    return this;
  }

  // ============================================================================
  // Build Method
  // ============================================================================

  /**
   * Build the LLM configuration object
   */
  build(): LLMConfig {
    if (!this.config.provider || !this.config.model) {
      throw new Error('Provider and model are required');
    }

    return this.config as LLMConfig;
  }
}
