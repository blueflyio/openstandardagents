import { describe, it, expect, beforeEach } from '@jest/globals';
import { LangGraphValidator } from '../../../../src/services/validators/langgraph.validator.js';
import type { OssaAgent } from '../../../../src/types/index.js';

describe('LangGraphValidator', () => {
  let validator: LangGraphValidator;
  let baseManifest: OssaAgent;

  beforeEach(() => {
    validator = new LangGraphValidator();
    baseManifest = {
      apiVersion: 'ossa/v0.3.3',
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
    it('should return valid for manifest without langgraph extension', () => {
      const result = validator.validate(baseManifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should return valid for disabled langgraph extension', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: false,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate valid langgraph extension with full config', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: ['start', 'process', 'end'],
              edges: [
                { from: 'start', to: 'process' },
                { from: 'process', to: 'end' },
              ],
            },
            checkpoint_config: {
              type: 'memory',
            },
            max_iterations: 10,
            interrupt_before: ['process'],
            interrupt_after: ['process'],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate graph_config is an object', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: 'not an object',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        'graph_config must be an object'
      );
    });

    it('should validate nodes is an array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: 'not an array',
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('nodes must be an array');
    });

    it('should accept valid nodes array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: ['node1', 'node2', 'node3'],
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept empty nodes array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: [],
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate edges is an array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              edges: 'not an array',
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('edges must be an array');
    });

    it('should accept valid edges array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              edges: [
                { from: 'a', to: 'b' },
                { from: 'b', to: 'c' },
              ],
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept empty edges array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              edges: [],
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate checkpoint_config is an object', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            checkpoint_config: 'not an object',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        'checkpoint_config must be an object'
      );
    });

    it('should accept valid checkpoint_config', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            checkpoint_config: {
              type: 'redis',
              host: 'localhost',
              port: 6379,
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate max_iterations is at least 1', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            max_iterations: 0,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        'max_iterations must be at least 1'
      );
    });

    it('should validate max_iterations is a number', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            max_iterations: 'not a number',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain(
        'max_iterations must be at least 1'
      );
    });

    it('should accept valid max_iterations', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            max_iterations: 100,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate interrupt_before is an array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            interrupt_before: 'not an array',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        'interrupt_before must be an array'
      );
    });

    it('should accept valid interrupt_before array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            interrupt_before: ['step1', 'step2'],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept empty interrupt_before array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            interrupt_before: [],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate interrupt_after is an array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            interrupt_after: 'not an array',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        'interrupt_after must be an array'
      );
    });

    it('should accept valid interrupt_after array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            interrupt_after: ['step1', 'step2'],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept empty interrupt_after array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            interrupt_after: [],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should warn if graph_config is missing', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Best practice: Define graph_config for LangGraph state machine'
      );
    });

    it('should warn if checkpoint_config is missing', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: ['node1'],
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Best practice: Configure checkpoint_config for state persistence'
      );
    });

    it('should not warn when both graph_config and checkpoint_config are provided', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: ['node1'],
            },
            checkpoint_config: {
              type: 'memory',
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('should handle multiple validation errors', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: 'invalid',
            checkpoint_config: 'invalid',
            max_iterations: -1,
            interrupt_before: 'invalid',
            interrupt_after: 'invalid',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should validate graph_config with nodes and edges together', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: ['start', 'middle', 'end'],
              edges: [
                { from: 'start', to: 'middle' },
                { from: 'middle', to: 'end' },
              ],
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate graph_config with additional properties', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: ['node1'],
              edges: [],
              custom_property: 'value',
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate checkpoint_config with additional properties', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            checkpoint_config: {
              type: 'postgres',
              connection_string: 'postgresql://localhost/db',
              table_name: 'checkpoints',
            },
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate all interrupt options together', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          langgraph: {
            enabled: true,
            graph_config: {
              nodes: ['a', 'b', 'c'],
            },
            interrupt_before: ['b'],
            interrupt_after: ['b'],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });
});
