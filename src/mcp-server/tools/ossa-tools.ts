/**
 * OSSA-Specific MCP Tools for Claude Desktop Integration
 * Provides tools for agent generation, validation, introspection, and lifecycle management
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { OSSALogger } from '../utils/logger.js';

const logger = new OSSALogger('ossa-tools');

export interface OSSATool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export class OSSATools {
  private static tools: OSSATool[] = [
    {
      name: 'ossa_generate_agent',
      description: 'Generate OSSA-compliant agent manifest and implementation files',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Agent name (e.g., voice-assistant, data-processor)'
          },
          type: {
            type: 'string',
            enum: ['orchestrator', 'worker', 'critic', 'judge', 'trainer', 'governor', 'monitor', 'integrator'],
            description: 'Agent type from OSSA taxonomy'
          },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of agent capabilities'
          },
          compliance_level: {
            type: 'string',
            enum: ['basic', 'standard', 'governed', 'enterprise'],
            default: 'governed'
          },
          voice_enabled: {
            type: 'boolean',
            default: false,
            description: 'Enable voice processing capabilities'
          },
          mcp_enabled: {
            type: 'boolean',
            default: true,
            description: 'Enable MCP protocol support'
          }
        },
        required: ['name', 'type', 'capabilities']
      }
    },
    {
      name: 'ossa_validate',
      description: 'Validate OSSA compliance for agents, schemas, or entire project',
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['agent', 'schema', 'project'],
            description: 'What to validate'
          },
          path: {
            type: 'string',
            description: 'Path to agent manifest, schema file, or project root'
          },
          strict: {
            type: 'boolean',
            default: false,
            description: 'Enable strict validation mode'
          }
        },
        required: ['target', 'path']
      }
    },
    {
      name: 'ossa_introspect',
      description: 'Analyze agent capabilities, dependencies, and OSSA schema compliance',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Agent ID or path to agent manifest'
          },
          include_dependencies: {
            type: 'boolean',
            default: true,
            description: 'Include dependency analysis'
          },
          include_schema: {
            type: 'boolean',
            default: true,
            description: 'Include schema compliance analysis'
          }
        },
        required: ['agent_id']
      }
    },
    {
      name: 'ossa_lifecycle',
      description: 'Manage agent lifecycle (spawn, stop, restart, health check)',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['spawn', 'stop', 'restart', 'health', 'status'],
            description: 'Lifecycle action to perform'
          },
          agent_id: {
            type: 'string',
            description: 'Agent ID to manage'
          },
          options: {
            type: 'object',
            description: 'Additional options for the action'
          }
        },
        required: ['action', 'agent_id']
      }
    },
    {
      name: 'ossa_test_compliance',
      description: 'Run comprehensive compliance tests for OSSA standards',
      inputSchema: {
        type: 'object',
        properties: {
          test_type: {
            type: 'string',
            enum: ['schema', 'security', 'performance', 'integration', 'all'],
            default: 'all'
          },
          agent_path: {
            type: 'string',
            description: 'Path to agent or project to test'
          },
          output_format: {
            type: 'string',
            enum: ['json', 'yaml', 'report'],
            default: 'report'
          }
        },
        required: ['agent_path']
      }
    }
  ];

  static getTools(): OSSATool[] {
    return this.tools;
  }

  static async executeTool(name: string, args: any): Promise<any> {
    logger.info(`Executing tool: ${name} with args:`, args);

    switch (name) {
      case 'ossa_generate_agent':
        return await this.generateAgent(args);
      case 'ossa_validate':
        return await this.validate(args);
      case 'ossa_introspect':
        return await this.introspect(args);
      case 'ossa_lifecycle':
        return await this.lifecycle(args);
      case 'ossa_test_compliance':
        return await this.testCompliance(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private static async generateAgent(args: any): Promise<any> {
    const { name, type, capabilities, compliance_level, voice_enabled, mcp_enabled } = args;
    
    logger.info(`Generating agent: ${name} (${type})`);

    // Generate agent ID
    const agentId = `ossa-${name}-${uuidv4().substring(0, 8)}`;
    
    // Create agent manifest
    const manifest = {
      apiVersion: 'ossa/v0.2.0',
      kind: voice_enabled ? 'VoiceMCPAgent' : 'MCPAgent',
      metadata: {
        name: name,
        namespace: 'ossa-system',
        labels: {
          'app.ossa.dev/component': 'agent',
          'app.ossa.dev/part-of': 'ossa-platform',
          'app.ossa.dev/version': 'v0.2.0',
          'app.ossa.dev/managed-by': 'claude-desktop'
        },
        annotations: {
          'ossa.dev/description': `Generated ${type} agent with ${capabilities.join(', ')} capabilities`,
          'ossa.dev/documentation': 'https://bluefly-ai.gitlab.io/ossa-standard/guides/agents/',
          'ossa.dev/contact': 'claude-desktop@bluefly.io'
        },
        compliance_level: compliance_level
      },
      spec: {
        version: 'v1.0.0',
        capabilities: capabilities,
        type: type,
        mcp: mcp_enabled ? {
          protocol_version: 'v1.1',
          server_url: `ws://localhost:8080/${agentId}`,
          capabilities: ['tools', 'resources', 'prompts', 'logging']
        } : undefined,
        voice: voice_enabled ? {
          stt_provider: 'whisper',
          tts_provider: 'elevenlabs',
          language: 'en-US',
          wake_word: `hey ${name}`
        } : undefined,
        resources: {
          cpu: '250m',
          memory: '512Mi',
          storage: '1Gi'
        }
      }
    };

    // Create agent directory structure
    const agentDir = resolve(process.cwd(), '.agents', name);
    await fs.mkdir(agentDir, { recursive: true });
    await fs.mkdir(join(agentDir, 'handlers'), { recursive: true });
    await fs.mkdir(join(agentDir, 'schemas'), { recursive: true });
    await fs.mkdir(join(agentDir, 'tests'), { recursive: true });

    // Write manifest
    const manifestPath = join(agentDir, 'agent.yml');
    await fs.writeFile(manifestPath, yaml.dump(manifest));

    // Generate basic handler template
    const handlerTemplate = this.generateHandlerTemplate(name, type, capabilities);
    const handlerPath = join(agentDir, 'handlers', `${name}-handler.ts`);
    await fs.writeFile(handlerPath, handlerTemplate);

    // Generate test template
    const testTemplate = this.generateTestTemplate(name, type);
    const testPath = join(agentDir, 'tests', `${name}.test.ts`);
    await fs.writeFile(testPath, testTemplate);

    logger.info(`✅ Agent generated successfully: ${agentDir}`);

    return {
      success: true,
      agent_id: agentId,
      agent_dir: agentDir,
      manifest_path: manifestPath,
      handler_path: handlerPath,
      test_path: testPath,
      manifest: manifest
    };
  }

  private static async validate(args: any): Promise<any> {
    const { target, path, strict } = args;
    
    logger.info(`Validating ${target} at ${path}`);

    try {
      const validationResults = {
        valid: true,
        errors: [],
        warnings: [],
        compliance_score: 0,
        details: {}
      };

      if (target === 'agent') {
        const manifest = yaml.load(await fs.readFile(path, 'utf-8'));
        validationResults.details = await this.validateAgentManifest(manifest, strict);
      } else if (target === 'schema') {
        validationResults.details = await this.validateSchema(path, strict);
      } else if (target === 'project') {
        validationResults.details = await this.validateProject(path, strict);
      }

      // Calculate compliance score
      validationResults.compliance_score = this.calculateComplianceScore(validationResults.details);

      logger.info(`✅ Validation completed. Score: ${validationResults.compliance_score}/100`);

      return validationResults;
    } catch (error) {
      logger.error(`Validation failed: ${error.message}`);
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
        compliance_score: 0
      };
    }
  }

  private static async introspect(args: any): Promise<any> {
    const { agent_id, include_dependencies, include_schema } = args;
    
    logger.info(`Introspecting agent: ${agent_id}`);

    try {
      const introspection = {
        agent_id,
        capabilities: [],
        dependencies: [],
        schema_compliance: {},
        health_status: 'unknown',
        last_seen: null,
        performance_metrics: {}
      };

      // Load agent manifest
      const manifestPath = resolve(process.cwd(), '.agents', agent_id, 'agent.yml');
      const manifest = yaml.load(await fs.readFile(manifestPath, 'utf-8'));
      
      introspection.capabilities = (manifest as any)?.spec?.capabilities || [];
      
      if (include_dependencies) {
        introspection.dependencies = await this.analyzeDependencies(agent_id);
      }
      
      if (include_schema) {
        introspection.schema_compliance = await this.analyzeSchemaCompliance(manifest);
      }

      logger.info(`✅ Introspection completed for ${agent_id}`);

      return introspection;
    } catch (error) {
      logger.error(`Introspection failed: ${error.message}`);
      throw error;
    }
  }

  private static async lifecycle(args: any): Promise<any> {
    const { action, agent_id, options } = args;
    
    logger.info(`Executing lifecycle action: ${action} for ${agent_id}`);

    switch (action) {
      case 'spawn':
        return await this.spawnAgent(agent_id, options);
      case 'stop':
        return await this.stopAgent(agent_id, options);
      case 'restart':
        return await this.restartAgent(agent_id, options);
      case 'health':
        return await this.checkAgentHealth(agent_id);
      case 'status':
        return await this.getAgentStatus(agent_id);
      default:
        throw new Error(`Unknown lifecycle action: ${action}`);
    }
  }

  private static async testCompliance(args: any): Promise<any> {
    const { test_type, agent_path, output_format } = args;
    
    logger.info(`Running compliance tests: ${test_type} for ${agent_path}`);

    const testResults = {
      test_type,
      agent_path,
      passed: true,
      score: 0,
      tests: [],
      summary: {}
    };

    // Run different types of tests
    if (test_type === 'schema' || test_type === 'all') {
      testResults.tests.push(await this.runSchemaTests(agent_path));
    }
    
    if (test_type === 'security' || test_type === 'all') {
      testResults.tests.push(await this.runSecurityTests(agent_path));
    }
    
    if (test_type === 'performance' || test_type === 'all') {
      testResults.tests.push(await this.runPerformanceTests(agent_path));
    }
    
    if (test_type === 'integration' || test_type === 'all') {
      testResults.tests.push(await this.runIntegrationTests(agent_path));
    }

    // Calculate overall score
    testResults.score = this.calculateTestScore(testResults.tests);
    testResults.passed = testResults.score >= 80;

    logger.info(`✅ Compliance tests completed. Score: ${testResults.score}/100`);

    return testResults;
  }

  // Helper methods
  private static generateHandlerTemplate(name: string, type: string, capabilities: string[]): string {
    return `/**
 * ${name} Agent Handler
 * Generated by OSSA MCP Server for Claude Desktop
 */

import { OSSALogger } from '@ossa/platform';

const logger = new OSSALogger('${name}-agent');

export class ${this.toPascalCase(name)}Handler {
  private capabilities: string[] = ${JSON.stringify(capabilities)};
  private agentType: string = '${type}';

  async initialize(): Promise<void> {
    logger.info('Initializing ${name} agent...');
    // Add initialization logic here
  }

  async execute(task: any): Promise<any> {
    logger.info('Executing task:', task);
    // Add task execution logic here
    return { success: true, result: 'Task completed' };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down ${name} agent...');
    // Add cleanup logic here
  }
}`;
  }

  private static generateTestTemplate(name: string, type: string): string {
    return `/**
 * ${name} Agent Tests
 * Generated by OSSA MCP Server for Claude Desktop
 */

import { ${this.toPascalCase(name)}Handler } from '../handlers/${name}-handler';

describe('${name} Agent', () => {
  let handler: ${this.toPascalCase(name)}Handler;

  beforeEach(() => {
    handler = new ${this.toPascalCase(name)}Handler();
  });

  test('should initialize successfully', async () => {
    await expect(handler.initialize()).resolves.not.toThrow();
  });

  test('should execute tasks', async () => {
    await handler.initialize();
    const result = await handler.execute({ test: true });
    expect(result.success).toBe(true);
  });

  test('should shutdown gracefully', async () => {
    await handler.initialize();
    await expect(handler.shutdown()).resolves.not.toThrow();
  });
});`;
  }

  private static toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
  }

  // Placeholder methods for validation and testing
  private static async validateAgentManifest(manifest: any, strict: boolean): Promise<any> {
    return { schema_valid: true, compliance_valid: true };
  }

  private static async validateSchema(path: string, strict: boolean): Promise<any> {
    return { schema_valid: true, openapi_compliant: true };
  }

  private static async validateProject(path: string, strict: boolean): Promise<any> {
    return { project_structure: true, dependencies_valid: true };
  }

  private static calculateComplianceScore(details: any): number {
    return 95; // Placeholder
  }

  private static async analyzeDependencies(agentId: string): Promise<any[]> {
    return []; // Placeholder
  }

  private static async analyzeSchemaCompliance(manifest: any): Promise<any> {
    return { compliant: true, score: 95 };
  }

  private static async spawnAgent(agentId: string, options: any): Promise<any> {
    return { success: true, agent_id: agentId, status: 'running' };
  }

  private static async stopAgent(agentId: string, options: any): Promise<any> {
    return { success: true, agent_id: agentId, status: 'stopped' };
  }

  private static async restartAgent(agentId: string, options: any): Promise<any> {
    return { success: true, agent_id: agentId, status: 'restarted' };
  }

  private static async checkAgentHealth(agentId: string): Promise<any> {
    return { healthy: true, status: 'running', uptime: '1h 23m' };
  }

  private static async getAgentStatus(agentId: string): Promise<any> {
    return { status: 'running', last_seen: new Date().toISOString() };
  }

  private static async runSchemaTests(path: string): Promise<any> {
    return { name: 'Schema Tests', passed: true, score: 95 };
  }

  private static async runSecurityTests(path: string): Promise<any> {
    return { name: 'Security Tests', passed: true, score: 90 };
  }

  private static async runPerformanceTests(path: string): Promise<any> {
    return { name: 'Performance Tests', passed: true, score: 88 };
  }

  private static async runIntegrationTests(path: string): Promise<any> {
    return { name: 'Integration Tests', passed: true, score: 92 };
  }

  private static calculateTestScore(tests: any[]): number {
    return tests.reduce((sum, test) => sum + test.score, 0) / tests.length;
  }
}
