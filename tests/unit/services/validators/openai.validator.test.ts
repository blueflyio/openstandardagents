/**
 * OpenAI Validator Tests
 */

import { describe, it, expect } from '@jest/globals';
import { OpenAIValidator } from '../../../../src/services/validators/openai.validator.js';

describe('OpenAIValidator', () => {
  const validator = new OpenAIValidator();

  it('should validate valid OpenAI extension', () => {
    const manifest = {
      extensions: {
        openai_agents: {
          enabled: true,
          model: 'gpt-4o',
          tools_mapping: [
            {
              ossa_capability: 'search_web',
              openai_tool_name: 'web_search',
            },
          ],
          guardrails: {
            enabled: true,
            max_tool_calls: 10,
            timeout_seconds: 300,
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid model', () => {
    const manifest = {
      extensions: {
        openai_agents: {
          enabled: true,
          model: 'invalid-model',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate all valid models', () => {
    const validModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ];

    validModels.forEach((model) => {
      const manifest = {
        extensions: {
          openai_agents: {
            enabled: true,
            model: model,
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid guardrails values', () => {
    const manifest = {
      extensions: {
        openai_agents: {
          enabled: true,
          guardrails: {
            max_tool_calls: 0,
            timeout_seconds: -1,
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate memory configuration', () => {
    const manifest = {
      extensions: {
        openai_agents: {
          enabled: true,
          memory: {
            enabled: true,
            type: 'session',
            max_messages: 50,
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid memory type', () => {
    const manifest = {
      extensions: {
        openai_agents: {
          enabled: true,
          memory: {
            type: 'invalid',
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
  });
});
