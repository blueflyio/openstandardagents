import { describe, it, expect, beforeEach } from '@jest/globals';
import { LlamaIndexValidator } from '../../../../src/services/validators/llamaindex.validator.js';
import type { OssaAgent } from '../../../../src/types/index.js';

describe('LlamaIndexValidator', () => {
  let validator: LlamaIndexValidator;
  let baseManifest: OssaAgent;

  beforeEach(() => {
    validator = new LlamaIndexValidator();
    baseManifest = {
      apiVersion: 'ossa/v0.3.0',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Test agent',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
      },
    };
  });

  describe('validate', () => {
    it('should return valid for manifest without llamaindex extension', () => {
      const result = validator.validate(baseManifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should return valid for disabled llamaindex extension', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: false,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate valid llamaindex extension', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            agent_type: 'query_engine',
            index_config: {
              chunk_size: 512,
              chunk_overlap: 50,
            },
            similarity_top_k: 5,
            response_mode: 'compact',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept all valid agent_type values', () => {
      const validTypes = ['query_engine', 'chat_engine', 'retriever', 'custom'];

      for (const agentType of validTypes) {
        const manifest = {
          ...baseManifest,
          extensions: {
            llamaindex: {
              enabled: true,
              agent_type: agentType,
            },
          },
        };
        const result = validator.validate(manifest);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid agent_type', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            agent_type: 'invalid_type',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('agent_type must be one of');
    });

    it('should validate index_config as object', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: 'not an object',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('index_config must be an object');
    });

    it('should validate chunk_size is at least 1', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: {
              chunk_size: 0,
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('chunk_size must be at least 1');
    });

    it('should validate chunk_size is a number', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: {
              chunk_size: 'not a number',
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('chunk_size must be at least 1');
    });

    it('should accept valid chunk_size', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: {
              chunk_size: 1024,
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate chunk_overlap is at least 0', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: {
              chunk_overlap: -1,
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('chunk_overlap must be at least 0');
    });

    it('should validate chunk_overlap is a number', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: {
              chunk_overlap: 'not a number',
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('chunk_overlap must be at least 0');
    });

    it('should accept valid chunk_overlap', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: {
              chunk_overlap: 0,
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate similarity_top_k is at least 1', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            similarity_top_k: 0,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('similarity_top_k must be at least 1');
    });

    it('should validate similarity_top_k is a number', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            similarity_top_k: 'not a number',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('similarity_top_k must be at least 1');
    });

    it('should accept valid similarity_top_k', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            similarity_top_k: 10,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept all valid response_mode values', () => {
      const validModes = ['default', 'compact', 'tree_summarize', 'refine', 'simple_summarize'];

      for (const mode of validModes) {
        const manifest = {
          ...baseManifest,
          extensions: {
            llamaindex: {
              enabled: true,
              response_mode: mode,
            },
          },
        };
        const result = validator.validate(manifest);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid response_mode', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            response_mode: 'invalid_mode',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('response_mode must be one of');
    });

    it('should warn if index_config is missing', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            agent_type: 'query_engine',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Best practice: Configure index_config for LlamaIndex agents'
      );
    });

    it('should warn if similarity_top_k is missing for query_engine', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            agent_type: 'query_engine',
            index_config: {
              chunk_size: 512,
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Best practice: Set similarity_top_k for query engine agents'
      );
    });

    it('should not warn about similarity_top_k for non-query_engine types', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            agent_type: 'chat_engine',
            index_config: {
              chunk_size: 512,
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).not.toContain(
        'Best practice: Set similarity_top_k for query engine agents'
      );
    });

    it('should handle multiple validation errors', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            agent_type: 'invalid_type',
            index_config: {
              chunk_size: -5,
              chunk_overlap: -10,
            },
            similarity_top_k: 0,
            response_mode: 'invalid_mode',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should validate index_config with both chunk_size and chunk_overlap', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: {
              chunk_size: 1024,
              chunk_overlap: 100,
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate index_config with additional properties', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          llamaindex: {
            enabled: true,
            index_config: {
              chunk_size: 512,
              chunk_overlap: 50,
              custom_property: 'value',
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });
});
