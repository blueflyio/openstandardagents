import { describe, it, expect, beforeEach } from '@jest/globals';
import { SpecificationValidator } from '../../src/specification/validator';
import { components } from '../../src/types/api';

type AgentManifest = components['schemas']['AgentManifest'];
type ValidationResult = components['schemas']['ValidationResult'];
type ValidationError = components['schemas']['ValidationError'];

describe('SpecificationValidator', () => {
  let validator: SpecificationValidator;

  beforeEach(() => {
    validator = new SpecificationValidator();
  });

  describe('validate()', () => {
    it('should validate a correct agent manifest', async () => {
      const manifest: AgentManifest = {
        agentId: 'worker-openapi-v1-2-0',
        agentType: 'worker',
        agentSubType: 'worker.openapi',
        version: '1.2.0',
        capabilities: {
          supportedDomains: ['documentation', 'api-design'],
          inputFormats: ['json', 'yaml'],
          outputFormats: ['json', 'markdown']
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect((result as ValidationResult).version).toBe('0.2.0');
        expect((result as ValidationResult).compliance?.ossaVersion).toBe('0.2.0');
      }
    });

    it('should reject manifest with invalid agentId format', async () => {
      const manifest: AgentManifest = {
        agentId: 'Invalid_Agent_ID', // Should be lowercase with hyphens
        agentType: 'worker',
        version: '1.0.0',
        capabilities: {
          supportedDomains: ['test'],
          inputFormats: ['json'],
          outputFormats: ['json']
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect((result as ValidationError).errors).toContainEqual(
          expect.objectContaining({
            field: 'agentId',
            code: 'INVALID_FORMAT'
          })
        );
      }
    });

    it('should reject manifest with invalid agent type', async () => {
      const manifest: AgentManifest = {
        agentId: 'test-agent',
        agentType: 'invalid-type' as any,
        version: '1.0.0',
        capabilities: {
          supportedDomains: ['test'],
          inputFormats: ['json'],
          outputFormats: ['json']
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect((result as ValidationError).errors).toContainEqual(
          expect.objectContaining({
            field: 'agentType',
            code: 'INVALID_TYPE'
          })
        );
      }
    });

    it('should reject manifest with invalid version format', async () => {
      const manifest: AgentManifest = {
        agentId: 'test-agent',
        agentType: 'worker',
        version: '1.0', // Should be semver format
        capabilities: {
          supportedDomains: ['test'],
          inputFormats: ['json'],
          outputFormats: ['json']
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect((result as ValidationError).errors).toContainEqual(
          expect.objectContaining({
            field: 'version',
            code: 'INVALID_VERSION'
          })
        );
      }
    });

    it('should validate capabilities requirements', async () => {
      const manifest: AgentManifest = {
        agentId: 'worker-test',
        agentType: 'worker',
        version: '1.0.0',
        capabilities: {
          supportedDomains: [],  // Empty domains should fail
          inputFormats: ['json'],
          outputFormats: ['json']
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect((result as ValidationError).errors).toContainEqual(
          expect.objectContaining({
            field: 'capabilities.supportedDomains',
            code: 'EMPTY_ARRAY'
          })
        );
      }
    });

    it('should add warnings for deprecated features', async () => {
      const manifest: AgentManifest = {
        agentId: 'worker-legacy',
        agentType: 'worker',
        version: '0.1.0', // Old version format
        capabilities: {
          supportedDomains: ['legacy-domain'],
          inputFormats: ['json'],
          outputFormats: ['json']
        }
      };

      const result = await validator.validate(manifest);
      
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect((result as ValidationResult).warnings).toContain('Version 0.1.0 uses legacy format');
      }
    });
  });

  describe('getTaxonomy()', () => {
    it('should return the complete agent taxonomy', () => {
      const taxonomy = validator.getTaxonomy();
      
      expect(taxonomy.version).toBe('0.2.0');
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
      expect(schema.properties).toHaveProperty('agentId');
      expect(schema.properties).toHaveProperty('capabilities');
    });

    it('should throw error for invalid agent type', () => {
      expect(() => {
        validator.getSchema('invalid-type');
      }).toThrow('Unknown agent type: invalid-type');
    });
  });
});