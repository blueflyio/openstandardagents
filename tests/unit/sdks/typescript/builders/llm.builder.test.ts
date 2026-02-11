/**
 * Tests for LLMConfigBuilder
 */

import { describe, it, expect } from '@jest/globals';
import { LLMConfigBuilder } from '../../../../../src/sdks/typescript/builders/llm.builder.js';

describe('LLMConfigBuilder', () => {
  describe('Anthropic', () => {
    it('should build Anthropic config', () => {
      const config = LLMConfigBuilder.anthropic('claude-sonnet-4')
        .temperature(0.7)
        .maxTokens(4096)
        .build();

      expect(config.provider).toBe('anthropic');
      expect(config.model).toBe('claude-sonnet-4');
      expect(config.temperature).toBe(0.7);
      expect(config.max_tokens).toBe(4096);
    });

    it('should build Anthropic config with profile', () => {
      const config = LLMConfigBuilder.anthropic('claude-opus-4')
        .profile('production')
        .build();

      expect(config.provider).toBe('anthropic');
      expect(config.model).toBe('claude-opus-4');
      expect(config.profile).toBe('production');
    });
  });

  describe('OpenAI', () => {
    it('should build OpenAI config', () => {
      const config = LLMConfigBuilder.openai('gpt-4')
        .temperature(0.5)
        .maxTokens(2048)
        .build();

      expect(config.provider).toBe('openai');
      expect(config.model).toBe('gpt-4');
      expect(config.temperature).toBe(0.5);
      expect(config.max_tokens).toBe(2048);
    });
  });

  describe('Azure', () => {
    it('should build Azure config', () => {
      const config = LLMConfigBuilder.azure('gpt-4-turbo')
        .temperature(0.3)
        .build();

      expect(config.provider).toBe('azure');
      expect(config.model).toBe('gpt-4-turbo');
      expect(config.temperature).toBe(0.3);
    });
  });

  describe('Google', () => {
    it('should build Google config', () => {
      const config = LLMConfigBuilder.google('gemini-pro')
        .temperature(0.8)
        .maxTokens(8192)
        .build();

      expect(config.provider).toBe('google');
      expect(config.model).toBe('gemini-pro');
      expect(config.temperature).toBe(0.8);
      expect(config.max_tokens).toBe(8192);
    });
  });

  describe('Bedrock', () => {
    it('should build Bedrock config', () => {
      const config = LLMConfigBuilder.bedrock('claude-3-sonnet')
        .temperature(0.6)
        .build();

      expect(config.provider).toBe('bedrock');
      expect(config.model).toBe('claude-3-sonnet');
      expect(config.temperature).toBe(0.6);
    });
  });

  describe('Groq', () => {
    it('should build Groq config', () => {
      const config = LLMConfigBuilder.groq('mixtral-8x7b')
        .temperature(0.4)
        .build();

      expect(config.provider).toBe('groq');
      expect(config.model).toBe('mixtral-8x7b');
      expect(config.temperature).toBe(0.4);
    });
  });

  describe('Ollama', () => {
    it('should build Ollama config', () => {
      const config = LLMConfigBuilder.ollama('llama2')
        .temperature(0.7)
        .maxTokens(4096)
        .build();

      expect(config.provider).toBe('ollama');
      expect(config.model).toBe('llama2');
      expect(config.temperature).toBe(0.7);
      expect(config.max_tokens).toBe(4096);
    });
  });

  describe('Custom Provider', () => {
    it('should build custom provider config', () => {
      const config = LLMConfigBuilder.custom('custom-provider', 'custom-model')
        .temperature(0.9)
        .build();

      expect(config.provider).toBe('custom-provider');
      expect(config.model).toBe('custom-model');
      expect(config.temperature).toBe(0.9);
    });
  });

  describe('Validation', () => {
    it('should validate temperature range', () => {
      expect(() => {
        LLMConfigBuilder.anthropic('claude-sonnet-4')
          .temperature(-0.1)
          .build();
      }).toThrow('Temperature must be between 0.0 and 1.0');

      expect(() => {
        LLMConfigBuilder.anthropic('claude-sonnet-4')
          .temperature(1.1)
          .build();
      }).toThrow('Temperature must be between 0.0 and 1.0');
    });

    it('should validate maxTokens is positive', () => {
      expect(() => {
        LLMConfigBuilder.anthropic('claude-sonnet-4')
          .maxTokens(0)
          .build();
      }).toThrow('maxTokens must be positive');

      expect(() => {
        LLMConfigBuilder.anthropic('claude-sonnet-4')
          .maxTokens(-1)
          .build();
      }).toThrow('maxTokens must be positive');
    });

    it('should require provider and model', () => {
      const builder = new (LLMConfigBuilder as any)();
      builder.config = {};
      expect(() => builder.build()).toThrow('Provider and model are required');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal config', () => {
      const config = LLMConfigBuilder.anthropic('claude-sonnet-4').build();

      expect(config.provider).toBe('anthropic');
      expect(config.model).toBe('claude-sonnet-4');
      expect(config.temperature).toBeUndefined();
      expect(config.max_tokens).toBeUndefined();
      expect(config.profile).toBeUndefined();
    });

    it('should handle temperature of 0', () => {
      const config = LLMConfigBuilder.anthropic('claude-sonnet-4')
        .temperature(0)
        .build();

      expect(config.temperature).toBe(0);
    });

    it('should handle temperature of 1', () => {
      const config = LLMConfigBuilder.anthropic('claude-sonnet-4')
        .temperature(1)
        .build();

      expect(config.temperature).toBe(1);
    });

    it('should handle maxTokens of 1', () => {
      const config = LLMConfigBuilder.anthropic('claude-sonnet-4')
        .maxTokens(1)
        .build();

      expect(config.max_tokens).toBe(1);
    });
  });

  describe('Fluent API', () => {
    it('should support method chaining', () => {
      const config = LLMConfigBuilder.anthropic('claude-sonnet-4')
        .temperature(0.7)
        .maxTokens(4096)
        .profile('production')
        .build();

      expect(config.provider).toBe('anthropic');
      expect(config.model).toBe('claude-sonnet-4');
      expect(config.temperature).toBe(0.7);
      expect(config.max_tokens).toBe(4096);
      expect(config.profile).toBe('production');
    });
  });
});
