import { describe, it, expect, beforeEach } from '@jest/globals';
import { SpecificationValidator } from '../../src/specification/validator';
import { components } from '../../src/types/api';

type ValidationResult = components['schemas']['ValidationResult'];
type ValidationError = components['schemas']['ValidationError'];

// OSSA v0.1.9-alpha.1 compliant agent manifest
interface OSSAAgentManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version: string;
    description?: string;
    author?: string;
  };
  spec: {
    type: string;
    subtype?: string;
    capabilities: {
      domains: string[];
      operations?: any[];
      inputFormats?: string[];
      outputFormats?: string[];
    };
    protocols?: {
      supported: Array<{
        name: string;
        version: string;
        endpoint: string;
        authentication?: any;
        tls?: boolean;
      }>;
      preferred?: string;
    };
    conformance?: {
      level: string;
      auditLogging?: boolean;
      feedbackLoop?: boolean;
      propsTokens?: boolean;
      learningSignals?: boolean;
    };
    performance?: any;
    budgets?: any;
  };
}

describe('SpecificationValidator', () => {
  let validator: SpecificationValidator;

  beforeEach(() => {
    validator = new SpecificationValidator();
  });

  describe('validate()', () => {
    it('should validate a correct agent manifest', async () => {
      const manifest: OSSAAgentManifest = {
        apiVersion: 'ossa.io/v0.1.9-alpha.1',
        kind: 'Agent',
        metadata: {
          name: 'worker-openapi',
          version: '1.2.0',
          description: 'OpenAPI specification worker agent',
          author: 'OSSA Platform'
        },
        spec: {
          type: 'worker',
          subtype: 'worker.openapi',
          capabilities: {
            domains: ['documentation', 'api-design'],
            inputFormats: ['json', 'yaml'],
            outputFormats: ['json', 'markdown']
          },
          protocols: {
            supported: [{
              name: 'rest',
              version: '1.0',
              endpoint: 'http://localhost:3000/api/v1',
              tls: true
            }]
          },
          conformance: {
            level: 'bronze',
            auditLogging: false,
            feedbackLoop: false
          }
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect((result as ValidationResult).version).toBe('0.1.9-alpha.1');
        expect((result as ValidationResult).compliance?.ossaVersion).toBe('0.1.9-alpha.1');
      }
    });

    it('should reject manifest with invalid name format', async () => {
      const manifest: OSSAAgentManifest = {
        apiVersion: 'ossa.io/v0.1.9-alpha.1',
        kind: 'Agent',
        metadata: {
          name: 'Invalid_Agent_Name_With_Underscores', // Should be lowercase with hyphens
          version: '1.0.0'
        },
        spec: {
          type: 'worker',
          capabilities: {
            domains: ['api-design']
          },
          protocols: {
            supported: [{
              name: 'rest',
              version: '1.0',
              endpoint: 'http://localhost:3000/api/v1'
            }]
          },
          conformance: {
            level: 'bronze'
          }
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect((result as ValidationError).errors).toContainEqual(
          expect.objectContaining({
            field: expect.stringContaining('name'),
            code: 'PATTERN'
          })
        );
      }
    });

    it('should reject manifest with invalid agent type', async () => {
      const manifest: OSSAAgentManifest = {
        apiVersion: 'ossa.io/v0.1.9-alpha.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          type: 'invalid-type' as any,
          capabilities: {
            domains: ['api-design']
          },
          protocols: {
            supported: [{
              name: 'rest',
              version: '1.0',
              endpoint: 'http://localhost:3000/api/v1'
            }]
          },
          conformance: {
            level: 'bronze'
          }
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect((result as ValidationError).errors).toContainEqual(
          expect.objectContaining({
            field: 'spec.type',
            code: 'INVALID_AGENT_TYPE'
          })
        );
      }
    });

    it('should reject manifest with invalid version format', async () => {
      const manifest: OSSAAgentManifest = {
        apiVersion: 'ossa.io/v0.1.9-alpha.1',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0' // Should be semver format
        },
        spec: {
          type: 'worker',
          capabilities: {
            domains: ['api-design']
          },
          protocols: {
            supported: [{
              name: 'rest',
              version: '1.0',
              endpoint: 'http://localhost:3000/api/v1'
            }]
          },
          conformance: {
            level: 'bronze'
          }
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect((result as ValidationError).errors).toContainEqual(
          expect.objectContaining({
            field: expect.stringContaining('version'),
            code: 'PATTERN'
          })
        );
      }
    });

    it('should validate capabilities requirements', async () => {
      const manifest: OSSAAgentManifest = {
        apiVersion: 'ossa.io/v0.1.9-alpha.1',
        kind: 'Agent',
        metadata: {
          name: 'worker-test',
          version: '1.0.0'
        },
        spec: {
          type: 'worker',
          capabilities: {
            domains: []  // Empty domains should fail
          },
          protocols: {
            supported: [{
              name: 'rest',
              version: '1.0',
              endpoint: 'http://localhost:3000/api/v1'
            }]
          },
          conformance: {
            level: 'bronze'
          }
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect((result as ValidationError).errors).toContainEqual(
          expect.objectContaining({
            field: expect.stringContaining('domains'),
            code: 'MINITEMS'
          })
        );
      }
    });

    it('should add warnings for deprecated features', async () => {
      const manifest: OSSAAgentManifest = {
        apiVersion: 'ossa.io/v0.1.9-alpha.1',
        kind: 'Agent',
        metadata: {
          name: 'worker-legacy',
          version: '0.1.0' // Old version format
        },
        spec: {
          type: 'worker',
          capabilities: {
            domains: ['documentation']
          },
          protocols: {
            supported: [{
              name: 'rest',
              version: '1.0',
              endpoint: 'http://localhost:3000/api/v1'
            }]
          },
          conformance: {
            level: 'bronze'
          }
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect((result as ValidationResult).warnings).toContain('Version 0.1.0 uses legacy 0.1.x format');
      }
    });
  });

  describe('getTaxonomy()', () => {
    it('should return the complete agent taxonomy', () => {
      const taxonomy = validator.getTaxonomy();
      
      expect(taxonomy.version).toBe('0.1.9-alpha.1');
      expect(taxonomy.feedbackLoop?.phases).toEqual([
        'plan', 'execute', 'review', 'judge', 'learn', 'govern'
      ]);
      expect(taxonomy.types).toContainEqual(
        expect.objectContaining({
          name: 'orchestrator',
          description: expect.any(String),
          capabilities: expect.arrayContaining([
            'goal-decomposition',
            'task-planning',
            'workflow-management'
          ])
        })
      );
    });
  });

  describe('getSchema()', () => {
    it('should return schema for valid agent type', () => {
      const schema = validator.getSchema('worker');
      
      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('apiVersion');
      expect(schema.properties).toHaveProperty('kind');
      expect(schema.properties).toHaveProperty('metadata');
      expect(schema.properties).toHaveProperty('spec');
    });

    it('should throw error for invalid agent type', () => {
      expect(() => {
        validator.getSchema('invalid-type');
      }).toThrow('Unknown agent type: invalid-type');
    });
  });
});