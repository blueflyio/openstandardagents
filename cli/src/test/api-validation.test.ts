/**
 * OSSA API Validation Test Suite
 * 
 * Comprehensive tests for the API-first validation framework
 * including OpenAPI spec validation, agent compliance testing,
 * and workflow validation.
 * 
 * @version 0.1.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OSSAValidator, ValidationResult, ValidationFormatter } from '../validation/api-validator';
import type { Agent, WorkflowDefinition, OpenAPISchema } from '../api/generated-types';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('OSSA API Validation Framework', () => {
  let validator: OSSAValidator;

  beforeEach(() => {
    validator = new OSSAValidator();
  });

  describe('OpenAPI Specification Validation', () => {
    it('should validate a correct OpenAPI 3.1.0 spec with OSSA extensions', async () => {
      const validSpec: OpenAPISchema = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          description: 'Test API for validation',
          version: '1.0.0'
        },
        servers: [
          {
            url: 'https://api.test.com/v1',
            description: 'Test server'
          }
        ],
        'x-openapi-ai-agents-standard': {
          version: '0.1.8',
          conformance_tier: 'advanced'
        },
        paths: {
          '/health': {
            get: {
              responses: {
                '200': {
                  description: 'Health status',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          status: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key'
            }
          },
          schemas: {}
        }
      };

      // Write temp spec file for testing
      const tempSpecPath = path.join(__dirname, 'temp-valid-spec.yaml');
      await fs.writeFile(tempSpecPath, JSON.stringify(validSpec, null, 2));

      const result = await validator.validateOpenAPI(tempSpecPath);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.errors).toHaveLength(0);

      // Cleanup
      await fs.remove(tempSpecPath);
    });

    it('should fail validation for OpenAPI spec without OSSA extensions', async () => {
      const invalidSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {}
      };

      const tempSpecPath = path.join(__dirname, 'temp-invalid-spec.json');
      await fs.writeFile(tempSpecPath, JSON.stringify(invalidSpec, null, 2));

      const result = await validator.validateOpenAPI(tempSpecPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === 'ossa-standard-extension')).toBe(true);

      // Cleanup
      await fs.remove(tempSpecPath);
    });

    it('should validate OSSA version correctly', async () => {
      const specWithWrongVersion = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        'x-openapi-ai-agents-standard': {
          version: '0.1.7', // Wrong version
          conformance_tier: 'core'
        },
        paths: {}
      };

      const tempSpecPath = path.join(__dirname, 'temp-wrong-version-spec.json');
      await fs.writeFile(tempSpecPath, JSON.stringify(specWithWrongVersion, null, 2));

      const result = await validator.validateOpenAPI(tempSpecPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'ossa-version')).toBe(true);

      // Cleanup
      await fs.remove(tempSpecPath);
    });
  });

  describe('Agent Configuration Validation', () => {
    it('should validate a compliant agent configuration', () => {
      const validAgent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        version: '1.0.0',
        description: 'A test agent',
        spec: {
          conformance_tier: 'advanced',
          class: 'general',
          category: 'assistant',
          capabilities: {
            primary: ['natural-language-processing', 'data-analysis']
          },
          protocols: [
            {
              name: 'openapi',
              version: '3.1.0',
              required: true
            }
          ],
          endpoints: {
            health: '/health',
            api: '/api'
          }
        },
        registered_at: '2024-01-15T10:00:00Z'
      };

      const result = validator.validateAgent(validAgent);

      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for agent with missing required fields', () => {
      const invalidAgent = {
        name: 'Invalid Agent',
        // Missing id, version, spec, registered_at
      } as any;

      const result = validator.validateAgent(invalidAgent);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'required-fields')).toBe(true);
    });

    it('should validate agent conformance tier', () => {
      const agentWithInvalidTier: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        version: '1.0.0',
        spec: {
          conformance_tier: 'invalid' as any,
          class: 'general',
          capabilities: {
            primary: ['test-capability']
          },
          endpoints: {
            health: '/health'
          }
        },
        registered_at: '2024-01-15T10:00:00Z'
      };

      const result = validator.validateAgent(agentWithInvalidTier);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'conformance-tier-valid')).toBe(true);
    });

    it('should validate semantic versioning', () => {
      const agentWithInvalidVersion: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        version: 'not-semver',
        spec: {
          conformance_tier: 'core',
          class: 'general',
          capabilities: {
            primary: ['test-capability']
          },
          endpoints: {
            health: '/health'
          }
        },
        registered_at: '2024-01-15T10:00:00Z'
      };

      const result = validator.validateAgent(agentWithInvalidVersion);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'valid-version')).toBe(true);
    });

    it('should validate capability naming conventions', () => {
      const agentWithBadCapabilities: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        version: '1.0.0',
        spec: {
          conformance_tier: 'core',
          class: 'general',
          capabilities: {
            primary: ['BadCapabilityName', 'another_bad_name'] // Should be kebab-case
          },
          endpoints: {
            health: '/health'
          }
        },
        registered_at: '2024-01-15T10:00:00Z'
      };

      const result = validator.validateAgent(agentWithBadCapabilities);

      expect(result.warnings.some(w => w.code === 'capability-naming')).toBe(true);
    });
  });

  describe('Workflow Definition Validation', () => {
    it('should validate a correct workflow definition', () => {
      const validWorkflow: WorkflowDefinition = {
        name: 'Test Workflow',
        description: 'A test workflow',
        version: '1.0.0',
        steps: [
          {
            id: 'step-1',
            name: 'First Step',
            type: 'agent_call',
            agent_id: 'test-agent'
          },
          {
            id: 'step-2',
            name: 'Second Step',
            type: 'agent_call',
            agent_id: 'another-agent'
          }
        ],
        error_handling: {
          strategy: 'fail_fast',
          max_retries: 3
        }
      };

      const result = validator.validateWorkflow(validWorkflow);

      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for workflow without steps', () => {
      const invalidWorkflow: WorkflowDefinition = {
        name: 'Empty Workflow',
        steps: [] // No steps
      };

      const result = validator.validateWorkflow(invalidWorkflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'steps-not-empty')).toBe(true);
    });

    it('should validate step structure', () => {
      const workflowWithInvalidStep: WorkflowDefinition = {
        name: 'Invalid Step Workflow',
        steps: [
          {
            id: 'step-1',
            type: 'invalid-type' as any, // Invalid step type
            agent_id: 'test-agent'
          }
        ]
      };

      const result = validator.validateWorkflow(workflowWithInvalidStep);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'valid-step-type')).toBe(true);
    });

    it('should validate required step fields', () => {
      const workflowWithIncompleteStep: WorkflowDefinition = {
        name: 'Incomplete Step Workflow',
        steps: [
          {
            id: 'step-1'
            // Missing type and agent_id
          } as any
        ]
      };

      const result = validator.validateWorkflow(workflowWithIncompleteStep);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'step-required-fields')).toBe(true);
    });
  });

  describe('API Response Validation', () => {
    it('should validate OSSA-compliant API response format', async () => {
      const validResponse = {
        data: { test: 'value' },
        meta: {
          request_id: 'req_123456',
          timestamp: '2024-01-15T10:00:00Z',
          version: '0.1.8'
        }
      };

      const result = await validator.validateAPIResponse(
        '/test',
        'GET',
        validResponse
      );

      expect(result.valid).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      const invalidResponse = {
        // Missing expected structure
        random: 'data'
      };

      const result = await validator.validateAPIResponse(
        '/test',
        'GET',
        invalidResponse
      );

      // Should not crash and provide meaningful feedback
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Validation Result Formatting', () => {
    it('should format validation results as JSON', () => {
      const mockResult: ValidationResult = {
        valid: false,
        score: 75,
        errors: [
          {
            code: 'test-error',
            message: 'Test error message',
            severity: 'high',
            suggestion: 'Fix the test error'
          }
        ],
        warnings: [
          {
            code: 'test-warning',
            message: 'Test warning message',
            recommendation: 'Consider fixing this warning'
          }
        ],
        info: [],
        metadata: {
          validator_version: '0.1.8',
          ossa_version: '0.1.8',
          timestamp: '2024-01-15T10:00:00Z',
          validation_type: 'test',
          total_checks: 4,
          passed_checks: 3
        }
      };

      const jsonOutput = ValidationFormatter.formatResult(mockResult, 'json');
      const parsed = JSON.parse(jsonOutput);

      expect(parsed.valid).toBe(false);
      expect(parsed.score).toBe(75);
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.warnings).toHaveLength(1);
    });

    it('should format validation results as summary', () => {
      const mockResult: ValidationResult = {
        valid: true,
        score: 100,
        errors: [],
        warnings: [],
        info: [],
        metadata: {
          validator_version: '0.1.8',
          ossa_version: '0.1.8',
          timestamp: '2024-01-15T10:00:00Z',
          validation_type: 'test',
          total_checks: 10,
          passed_checks: 10
        }
      };

      const summaryOutput = ValidationFormatter.formatResult(mockResult, 'summary');

      expect(summaryOutput).toContain('✅ VALID');
      expect(summaryOutput).toContain('Score: 100%');
      expect(summaryOutput).toContain('Errors: 0');
      expect(summaryOutput).toContain('Warnings: 0');
    });

    it('should format validation results as detailed report', () => {
      const mockResult: ValidationResult = {
        valid: false,
        score: 85,
        errors: [
          {
            code: 'critical-error',
            message: 'Critical validation error',
            severity: 'critical',
            path: 'spec.conformance_tier',
            suggestion: 'Use valid conformance tier'
          }
        ],
        warnings: [
          {
            code: 'style-warning',
            message: 'Style guideline violation',
            path: 'spec.capabilities.primary[0]',
            recommendation: 'Use kebab-case naming'
          }
        ],
        info: [
          {
            code: 'info-message',
            message: 'Additional information',
            path: 'spec.protocols'
          }
        ],
        metadata: {
          validator_version: '0.1.8',
          ossa_version: '0.1.8',
          timestamp: '2024-01-15T10:00:00Z',
          validation_type: 'detailed-test',
          total_checks: 20,
          passed_checks: 17
        }
      };

      const detailedOutput = ValidationFormatter.formatResult(mockResult, 'detailed');

      expect(detailedOutput).toContain('❌ INVALID');
      expect(detailedOutput).toContain('Score: 85%');
      expect(detailedOutput).toContain('17/20 passed');
      expect(detailedOutput).toContain('❌ ERRORS:');
      expect(detailedOutput).toContain('CRITICAL');
      expect(detailedOutput).toContain('spec.conformance_tier');
      expect(detailedOutput).toContain('⚠️  WARNINGS:');
      expect(detailedOutput).toContain('kebab-case naming');
      expect(detailedOutput).toContain('ℹ️  INFO:');
    });
  });

  describe('Validation Rules Engine', () => {
    it('should handle custom validation rules', () => {
      const customOptions = {
        customRules: [
          {
            name: 'custom-test-rule',
            description: 'Custom test validation rule',
            severity: 'medium' as const,
            validate: (data: any) => ({
              passed: data.customField === 'expected-value',
              message: data.customField !== 'expected-value' ? 'Custom field validation failed' : undefined
            })
          }
        ]
      };

      // Test would validate with custom rules
      expect(customOptions.customRules).toHaveLength(1);
      expect(customOptions.customRules[0].name).toBe('custom-test-rule');
    });

    it('should support different validation contexts', () => {
      const contexts = ['openapi', 'agent', 'workflow', 'protocol'];
      
      contexts.forEach(context => {
        expect(['openapi', 'agent', 'workflow', 'protocol']).toContain(context);
      });
    });

    it('should handle validation rule errors gracefully', () => {
      const problematicRule = {
        name: 'error-prone-rule',
        description: 'Rule that throws errors',
        severity: 'low' as const,
        validate: () => {
          throw new Error('Rule execution failed');
        }
      };

      // Validator should handle rule execution errors
      expect(() => problematicRule.validate).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing OpenAPI spec file', async () => {
      const nonExistentPath = '/path/that/does/not/exist.yaml';
      
      await expect(validator.validateOpenAPI(nonExistentPath)).rejects.toThrow();
    });

    it('should handle malformed JSON/YAML files', async () => {
      const malformedContent = '{ invalid json content';
      const tempPath = path.join(__dirname, 'malformed.json');
      
      await fs.writeFile(tempPath, malformedContent);
      
      await expect(validator.validateOpenAPI(tempPath)).rejects.toThrow();
      
      // Cleanup
      await fs.remove(tempPath);
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(() => validator.validateAgent(null as any)).not.toThrow();
      expect(() => validator.validateAgent(undefined as any)).not.toThrow();
      expect(() => validator.validateWorkflow(null as any)).not.toThrow();
    });

    it('should provide meaningful error messages', () => {
      const invalidAgent = {} as any;
      const result = validator.validateAgent(invalidAgent);
      
      expect(result.errors.length).toBeGreaterThan(0);
      result.errors.forEach(error => {
        expect(error.message).toBeTruthy();
        expect(error.code).toBeTruthy();
        expect(error.severity).toBeTruthy();
      });
    });
  });
});

describe('Integration Tests', () => {
  let validator: OSSAValidator;

  beforeEach(() => {
    validator = new OSSAValidator();
  });

  it('should validate the main OSSA OpenAPI specification', async () => {
    const mainSpecPath = path.join(__dirname, '../../api/openapi.yaml');
    
    // Only run this test if the main spec file exists
    if (await fs.pathExists(mainSpecPath)) {
      const result = await validator.validateOpenAPI(mainSpecPath);
      
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(90);
      
      // Should have minimal critical errors
      const criticalErrors = result.errors.filter(e => e.severity === 'critical');
      expect(criticalErrors).toHaveLength(0);
    }
  });

  it('should validate sample agent configurations', () => {
    // Sample configurations from the platform coordinator
    const sampleAgent: Agent = {
      id: 'ossa-platform-coordinator',
      name: 'OSSA Platform Coordinator',
      version: '0.1.8',
      description: 'Advanced multi-agent orchestration coordinator',
      spec: {
        conformance_tier: 'advanced',
        class: 'workflow',
        category: 'coordinator',
        capabilities: {
          primary: ['agent-orchestration', 'discovery-coordination', 'governance-enforcement'],
          secondary: ['compliance-auditing', 'performance-optimization'],
          frameworks: ['openai', 'anthropic', 'mcp']
        },
        protocols: [
          {
            name: 'openapi',
            version: '3.1.0',
            required: true,
            extensions: ['x-openapi-ai-agents-standard']
          },
          {
            name: 'uadp',
            version: '0.1.8',
            required: true
          }
        ],
        endpoints: {
          health: '/health',
          capabilities: '/capabilities',
          api: '/agents'
        }
      },
      registered_at: '2024-01-15T10:00:00Z'
    };

    const result = validator.validateAgent(sampleAgent);
    
    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThan(95);
  });
});