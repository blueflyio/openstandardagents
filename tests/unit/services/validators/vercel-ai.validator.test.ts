import { describe, it, expect, beforeEach } from '@jest/globals';
import { VercelAIValidator } from '../../../../src/services/validators/vercel-ai.validator.js';
import type { OssaAgent } from '../../../../src/types/index.js';

describe('VercelAIValidator', () => {
  let validator: VercelAIValidator;
  let baseManifest: OssaAgent;

  beforeEach(() => {
    validator = new VercelAIValidator();
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
    it('should return valid for manifest without vercel_ai extension', () => {
      const result = validator.validate(baseManifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should return valid for disabled vercel_ai extension', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: false,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate valid vercel_ai extension', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            runtime: 'edge',
            stream: true,
            max_tokens: 2048,
            temperature: 0.7,
            tools: [],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept all valid runtime values', () => {
      const validRuntimes = ['edge', 'nodejs', 'cloudflare'];

      for (const runtime of validRuntimes) {
        const manifest = {
          ...baseManifest,
          extensions: {
            vercel_ai: {
              enabled: true,
              runtime,
            },
          },
        };
        const result = validator.validate(manifest);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid runtime', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            runtime: 'invalid',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('runtime must be one of');
    });

    it('should validate stream is boolean', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            stream: 'not a boolean',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('stream must be a boolean');
    });

    it('should accept stream as true', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            stream: true,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept stream as false', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            stream: false,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate max_tokens is at least 1', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            max_tokens: 0,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        'max_tokens must be at least 1'
      );
    });

    it('should validate max_tokens is a number', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            max_tokens: 'not a number',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain(
        'max_tokens must be at least 1'
      );
    });

    it('should accept valid max_tokens', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            max_tokens: 4096,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate temperature is between 0 and 2', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            temperature: -0.1,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        'temperature must be between 0 and 2'
      );
    });

    it('should reject temperature above 2', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            temperature: 2.1,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain(
        'temperature must be between 0 and 2'
      );
    });

    it('should validate temperature is a number', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            temperature: 'hot',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain(
        'temperature must be between 0 and 2'
      );
    });

    it('should accept temperature of 0', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            temperature: 0,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept temperature of 2', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            temperature: 2,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept temperature of 0.7', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            temperature: 0.7,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate tools is an array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            tools: 'not an array',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('tools must be an array');
    });

    it('should accept valid tools array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            tools: [
              { name: 'tool1', description: 'Tool 1' },
              { name: 'tool2', description: 'Tool 2' },
            ],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept empty tools array', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            tools: [],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should warn if runtime is not specified', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Best practice: Specify runtime (edge/nodejs/cloudflare) for Vercel AI SDK'
      );
    });

    it('should warn if edge runtime has high max_tokens', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            runtime: 'edge',
            max_tokens: 8192,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Best practice: Edge runtime has token limits - consider reducing max_tokens'
      );
    });

    it('should not warn about max_tokens for nodejs runtime', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            runtime: 'nodejs',
            max_tokens: 8192,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).not.toContain(
        'Best practice: Edge runtime has token limits - consider reducing max_tokens'
      );
    });

    it('should not warn about max_tokens for cloudflare runtime', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            runtime: 'cloudflare',
            max_tokens: 8192,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).not.toContain(
        'Best practice: Edge runtime has token limits - consider reducing max_tokens'
      );
    });

    it('should not warn if edge runtime has acceptable max_tokens', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            runtime: 'edge',
            max_tokens: 4096,
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).not.toContain(
        'Best practice: Edge runtime has token limits - consider reducing max_tokens'
      );
    });

    it('should handle multiple validation errors', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            runtime: 'invalid',
            stream: 'yes',
            max_tokens: -10,
            temperature: 5,
            tools: 'not an array',
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should validate all fields together', () => {
      const manifest = {
        ...baseManifest,
        extensions: {
          vercel_ai: {
            enabled: true,
            runtime: 'nodejs',
            stream: true,
            max_tokens: 2048,
            temperature: 0.8,
            tools: [{ name: 'search' }],
          },
        },
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
