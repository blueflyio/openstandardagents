/**
 * OAAS Schema Validation Tests
 * Comprehensive test suite for validating agent and workspace schemas
 */

import { OAASValidator } from '@bluefly/oaas';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Initialize AJV with formats
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

// Load schema files
const SCHEMA_DIR = path.join(__dirname, '../../schemas');
const EXAMPLES_DIR = path.join(__dirname, '../../examples');

describe('OAAS Schema Validation', () => {
  let validator: OAASValidator;
  
  beforeAll(() => {
    validator = new OAASValidator({ strict: true });
  });
  
  describe('Agent Schema Validation', () => {
    describe('Minimal Agent (Level 0)', () => {
      const minimalSchema = yaml.load(
        fs.readFileSync(path.join(SCHEMA_DIR, 'agent-minimal.yml'), 'utf8')
      );
      
      it('should validate a minimal agent configuration', () => {
        const agent = {
          name: 'test-agent',
          version: '1.0.0',
          expertise: 'Testing capabilities',
          capabilities: ['test_capability']
        };
        
        const validate = ajv.compile(minimalSchema);
        const valid = validate(agent);
        expect(valid).toBe(true);
      });
      
      it('should reject agent missing required fields', () => {
        const agent = {
          name: 'test-agent'
          // Missing version, expertise, capabilities
        };
        
        const validate = ajv.compile(minimalSchema);
        const valid = validate(agent);
        expect(valid).toBe(false);
        expect(validate.errors).toContainEqual(
          expect.objectContaining({ 
            keyword: 'required',
            params: expect.objectContaining({ missingProperty: 'version' })
          })
        );
      });
    });
    
    describe('Basic Agent (Level 1)', () => {
      const basicSchema = yaml.load(
        fs.readFileSync(path.join(SCHEMA_DIR, 'agent-basic.yml'), 'utf8')
      );
      
      it('should validate a basic agent with frameworks', () => {
        const agent = {
          name: 'basic-agent',
          version: '1.0.0', 
          expertise: 'Basic testing agent',
          capabilities: [
            { name: 'analyze', description: 'Analyze data' },
            { name: 'report', description: 'Generate reports' }
          ],
          frameworks: {
            mcp: { enabled: true },
            langchain: { enabled: false }
          }
        };
        
        const validate = ajv.compile(basicSchema);
        const valid = validate(agent);
        expect(valid).toBe(true);
      });
      
      it('should validate context paths', () => {
        const agent = {
          name: 'context-agent',
          version: '1.0.0',
          expertise: 'Context-aware agent',
          capabilities: ['process'],
          context_paths: [
            { path: './src', description: 'Source code' },
            { path: './docs', description: 'Documentation' }
          ]
        };
        
        const validate = ajv.compile(basicSchema);
        const valid = validate(agent);
        expect(valid).toBe(true);
      });
    });
    
    describe('Enterprise Agent (Level 4)', () => {
      const enterpriseSchema = yaml.load(
        fs.readFileSync(path.join(SCHEMA_DIR, 'agent-enterprise.yml'), 'utf8')
      );
      
      it('should validate complete enterprise agent', () => {
        const agent = yaml.load(
          fs.readFileSync(
            path.join(EXAMPLES_DIR, '04-agent-enterprise/agent.yml'),
            'utf8'
          )
        );
        
        const validate = ajv.compile(enterpriseSchema);
        const valid = validate(agent);
        if (!valid) {
          console.error('Validation errors:', JSON.stringify(validate.errors, null, 2));
        }
        expect(valid).toBe(true);
      });
      
      it('should validate security configuration', () => {
        const agentWithSecurity = {
          apiVersion: 'openapi-ai-agents/v0.1.1',
          kind: 'Agent',
          metadata: {
            name: 'secure-agent',
            version: '1.0.0'
          },
          spec: {
            agent: {
              name: 'Secure Agent',
              expertise: 'Security-focused operations'
            },
            security: {
              authentication: {
                required: true,
                methods: ['api_key', 'jwt', 'oauth2']
              },
              authorization: {
                enabled: true,
                model: 'rbac',
                policies: [
                  { role: 'admin', permissions: ['read', 'write', 'execute'] },
                  { role: 'user', permissions: ['read', 'execute'] }
                ]
              },
              encryption: {
                in_transit: true,
                at_rest: true
              }
            }
          }
        };
        
        const validate = ajv.compile(enterpriseSchema);
        const valid = validate(agent);
        expect(valid).toBe(true);
      });
      
      it('should validate compliance frameworks', () => {
        const compliantAgent = {
          apiVersion: 'openapi-ai-agents/v0.1.1',
          kind: 'Agent',
          metadata: {
            name: 'compliant-agent',
            version: '1.0.0',
            annotations: {
              'oaas/compliance-level': 'gold'
            }
          },
          spec: {
            agent: {
              name: 'Compliant Agent',
              expertise: 'Regulatory compliance'
            },
            compliance: {
              frameworks: ['iso_42001', 'nist_ai_rmf', 'eu_ai_act'],
              certifications: [
                {
                  framework: 'iso_42001',
                  level: 'gold',
                  valid_until: '2025-12-31',
                  certificate_id: 'ISO-2024-12345'
                }
              ],
              audit: {
                enabled: true,
                level: 'comprehensive',
                retention: '7y'
              }
            }
          }
        };
        
        const validate = ajv.compile(enterpriseSchema);
        const valid = validate(agent);
        expect(valid).toBe(true);
      });
    });
  });
  
  describe('Workspace Schema Validation', () => {
    const workspaceSchema = yaml.load(
      fs.readFileSync(path.join(SCHEMA_DIR, 'workspace-enterprise.yml'), 'utf8')
    );
    
    it('should validate enterprise workspace configuration', () => {
      const workspace = yaml.load(
        fs.readFileSync(
          path.join(EXAMPLES_DIR, '06-workspace-enterprise/workspace.yml'),
          'utf8'
        )
      );
      
      const validate = ajv.compile(workspaceSchema);
      const valid = validate(workspace);
      if (!valid) {
        console.error('Validation errors:', JSON.stringify(validate.errors, null, 2));
      }
      expect(valid).toBe(true);
    });
    
    it('should validate orchestration rules', () => {
      const orchestrationRules = {
        apiVersion: 'openapi-ai-agents/v0.1.1',
        kind: 'OrchestrationRules',
        metadata: {
          name: 'test-rules'
        },
        spec: {
          patterns: [
            {
              name: 'sequential-processing',
              type: 'sequential',
              stages: [
                { agent: 'analyzer', capability: 'analyze' },
                { agent: 'processor', capability: 'process' },
                { agent: 'reporter', capability: 'report' }
              ]
            },
            {
              name: 'parallel-validation',
              type: 'parallel',
              agents: ['validator-1', 'validator-2', 'validator-3'],
              aggregation: 'consensus'
            }
          ]
        }
      };
      
      const orchestrationSchema = yaml.load(
        fs.readFileSync(path.join(SCHEMA_DIR, 'orchestration-rules.yml'), 'utf8')
      );
      
      const validate = ajv.compile(orchestrationSchema);
      const valid = validate(orchestrationRules);
      expect(valid).toBe(true);
    });
  });
  
  describe('Capability Schema Validation', () => {
    it('should validate structured capabilities', () => {
      const capability = {
        name: 'data_analysis',
        description: 'Comprehensive data analysis',
        input_schema: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            options: { type: 'object' }
          },
          required: ['data']
        },
        output_schema: {
          type: 'object',
          properties: {
            results: { type: 'object' },
            metrics: { type: 'object' }
          }
        },
        frameworks: ['langchain', 'crewai'],
        compliance: ['iso-42001'],
        sla: '99.9%'
      };
      
      // Validate capability structure
      expect(capability).toHaveProperty('name');
      expect(capability).toHaveProperty('input_schema');
      expect(capability).toHaveProperty('output_schema');
      expect(capability.frameworks).toBeInstanceOf(Array);
    });
  });
  
  describe('Cross-Schema Validation', () => {
    it('should validate agent references in workspace', () => {
      const workspace = {
        agents: [
          { id: 'agent-1', path: './agents/agent-1' },
          { id: 'agent-2', path: './agents/agent-2' }
        ],
        orchestration: {
          rules: [
            {
              pattern: 'sequential',
              agents: ['agent-1', 'agent-2'] // Should reference existing agents
            }
          ]
        }
      };
      
      // Validate that orchestration rules reference existing agents
      const referencedAgents = workspace.orchestration.rules
        .flatMap(rule => rule.agents);
      const definedAgentIds = workspace.agents.map(a => a.id);
      
      referencedAgents.forEach(agentId => {
        expect(definedAgentIds).toContain(agentId);
      });
    });
  });
  
  describe('Schema Evolution Tests', () => {
    it('should handle backward compatibility', () => {
      // Old format (v0.1.0)
      const oldAgent = {
        name: 'legacy-agent',
        capabilities: ['capability1', 'capability2']
      };
      
      // Should still be valid with relaxed validation
      const relaxedValidator = new OAASValidator({ strict: false });
      const result = relaxedValidator.validateAgent(oldAgent);
      expect(result.valid || result.warnings).toBeTruthy();
    });
    
    it('should provide migration suggestions', () => {
      const oldAgent = {
        name: 'legacy-agent',
        capabilities: ['capability1']
      };
      
      const migrationSuggestions = validator.getMigrationSuggestions(oldAgent);
      expect(migrationSuggestions).toContain('Add version field');
      expect(migrationSuggestions).toContain('Add expertise field');
      expect(migrationSuggestions).toContain('Convert capabilities to structured format');
    });
  });
  
  describe('Performance Tests', () => {
    it('should validate large schemas quickly', () => {
      const largeAgent = {
        apiVersion: 'openapi-ai-agents/v0.1.1',
        kind: 'Agent',
        metadata: { name: 'large-agent', version: '1.0.0' },
        spec: {
          agent: { name: 'Large Agent', expertise: 'Testing' },
          capabilities: Array.from({ length: 100 }, (_, i) => ({
            name: `capability_${i}`,
            description: `Capability ${i} description`
          }))
        }
      };
      
      const startTime = Date.now();
      const validate = ajv.compile(
        yaml.load(fs.readFileSync(path.join(SCHEMA_DIR, 'agent-enterprise.yml'), 'utf8'))
      );
      const valid = validate(largeAgent);
      const duration = Date.now() - startTime;
      
      expect(valid).toBe(true);
      expect(duration).toBeLessThan(100); // Should validate in under 100ms
    });
  });
});

describe('Real-World Example Validation', () => {
  it('should validate all example agents', () => {
    const exampleDirs = [
      '01-agent-basic',
      '02-agent-integration',
      '03-agent-production',
      '04-agent-enterprise'
    ];
    
    exampleDirs.forEach(dir => {
      const agentPath = path.join(EXAMPLES_DIR, dir, 'agent.yml');
      if (fs.existsSync(agentPath)) {
        const agent = yaml.load(fs.readFileSync(agentPath, 'utf8'));
        const result = validator.validateAgent(agent);
        expect(result.valid).toBe(true);
      }
    });
  });
  
  it('should validate all example workspaces', () => {
    const workspaceDirs = [
      '05-workspace-basic',
      '06-workspace-enterprise'
    ];
    
    workspaceDirs.forEach(dir => {
      const workspacePath = path.join(EXAMPLES_DIR, dir, 'workspace.yml');
      if (fs.existsSync(workspacePath)) {
        const workspace = yaml.load(fs.readFileSync(workspacePath, 'utf8'));
        const result = validator.validateWorkspace(workspace);
        expect(result.valid).toBe(true);
      }
    });
  });
});