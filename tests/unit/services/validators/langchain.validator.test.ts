/**
 * LangChain Validator Tests
 */

import { describe, it, expect } from '@jest/globals';
import { LangChainValidator } from '../../../../src/services/validators/langchain.validator.js';

describe('LangChainValidator', () => {
  const validator = new LangChainValidator();

  it('should validate valid LangChain extension', () => {
    const manifest = {
      extensions: {
        langchain: {
          enabled: true,
          chain_type: 'agent',
          memory: {
            type: 'buffer',
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate all chain types', () => {
    const validTypes = ['llm', 'retrieval', 'agent', 'sequential', 'custom'];

    validTypes.forEach((type) => {
      const manifest = {
        extensions: {
          langchain: {
            enabled: true,
            chain_type: type,
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid chain_type', () => {
    const manifest = {
      extensions: {
        langchain: {
          enabled: true,
          chain_type: 'invalid',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
  });

  it('should validate memory types', () => {
    const validMemoryTypes = ['buffer', 'summary', 'conversation', 'vector'];

    validMemoryTypes.forEach((type) => {
      const manifest = {
        extensions: {
          langchain: {
            enabled: true,
            chain_type: 'agent',
            memory: {
              type: type,
            },
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid memory type', () => {
    const manifest = {
      extensions: {
        langchain: {
          enabled: true,
          chain_type: 'agent',
          memory: {
            type: 'invalid',
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
  });

  it('should validate callbacks array', () => {
    const manifest = {
      extensions: {
        langchain: {
          enabled: true,
          chain_type: 'agent',
          callbacks: ['callback1', 'callback2'],
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid callbacks type', () => {
    const manifest = {
      extensions: {
        langchain: {
          enabled: true,
          chain_type: 'agent',
          callbacks: 'not-an-array',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
  });

  it('should return warnings for missing memory', () => {
    const manifest = {
      extensions: {
        langchain: {
          enabled: true,
          chain_type: 'agent',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
