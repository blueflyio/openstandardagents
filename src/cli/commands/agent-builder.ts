#!/usr/bin/env node

/**
 * OSSA Agent Builder Commands
 * Generate OSSA-compliant agents from schemas
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, resolve, basename } from 'path';
import chalk from 'chalk';
import * as yaml from 'js-yaml';

export interface AgentOptions {
  type: 'orchestrator' | 'worker' | 'critic' | 'judge' | 'trainer' | 'governor' | 'monitor' | 'integrator' | 'voice';
  schema?: string;
  output: string;
  template?: string;
}

export interface AgentManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    uuid: string;
    type: string;
    version: string;
    description: string;
  };
  spec: {
    capabilities: string[];
    dependencies: string[];
    endpoints: Record<string, string>;
    integrations: {
      workspace: Record<string, string>;
      registry: Record<string, string>;
    };
    behaviors: {
      primary: string;
      additional: string[];
    };
    validation: {
      schema: string;
      openapi: string;
    };
  };
}

/**
 * Create new agent from OSSA schema
 */
export async function createAgent(name: string, options: AgentOptions): Promise<void> {
  console.log(chalk.green(`🤖 Creating ${options.type} agent: ${name}...`));

  try {
    const agentDir = join(resolve(options.output), name);

    // Create agent directory structure
    console.log(chalk.gray('📁 Creating agent directory structure...'));
    const dirs = [
      'behaviors',
      'data/state',
      'data/cache',
      'data/models',
      'handlers',
      'integrations/gitlab',
      'integrations/agents',
      'integrations/mcp',
      'schemas/input',
      'schemas/output',
      'src/core',
      'tests/unit',
      'tests/integration',
      'tests/fixtures',
      'training-modules/datasets',
      'training-modules/models',
      'training-modules/configs',
      'config',
      'deployments/k8s',
      'deployments/helm'
    ];

    dirs.forEach((dir) => {
      mkdirSync(join(agentDir, dir), { recursive: true });
    });

    // Generate agent.yml
    console.log(chalk.gray('⚙️  Generating agent manifest...'));
    const manifest = generateAgentManifest(name, options.type);
    writeFileSync(join(agentDir, 'agent.yml'), yaml.dump(manifest));

    // Generate OpenAPI spec
    console.log(chalk.gray('📋 Generating OpenAPI specification...'));
    const openapi = generateOpenAPISpec(name, options.type);
    writeFileSync(join(agentDir, 'openapi.yml'), yaml.dump(openapi));

    // Generate behavior definition
    console.log(chalk.gray('🎭 Generating behavior definition...'));
    const behavior = generateBehaviorDefinition(name, options.type);
    writeFileSync(join(agentDir, `behaviors/${name}.behavior.yml`), yaml.dump(behavior));

    // Generate TypeScript handler
    console.log(chalk.gray('🔧 Generating TypeScript handler...'));
    const handlerCode = generateTypeScriptHandler(name, options.type);
    writeFileSync(join(agentDir, `handlers/${name}.handlers.ts`), handlerCode);

    // Generate schemas
    console.log(chalk.gray('📊 Generating JSON schemas...'));
    const inputSchema = generateInputSchema(name, options.type);
    const outputSchema = generateOutputSchema(name, options.type);
    writeFileSync(join(agentDir, `schemas/input/${name}.input.json`), JSON.stringify(inputSchema, null, 2));
    writeFileSync(join(agentDir, `schemas/output/${name}.output.json`), JSON.stringify(outputSchema, null, 2));

    // Generate package.json
    console.log(chalk.gray('📦 Generating package.json...'));
    const packageJson = generatePackageJson(name, options.type);
    writeFileSync(join(agentDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Generate TypeScript config
    console.log(chalk.gray('⚙️  Generating TypeScript configuration...'));
    const tsconfig = generateTsConfig();
    writeFileSync(join(agentDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    // Generate README
    console.log(chalk.gray('📄 Generating README...'));
    const readme = generateAgentReadme(name, options.type);
    writeFileSync(join(agentDir, 'README.md'), readme);

    // Generate basic test
    console.log(chalk.gray('🧪 Generating basic test...'));
    const testCode = generateBasicTest(name, options.type);
    writeFileSync(join(agentDir, `tests/unit/${name}.test.ts`), testCode);

    // Generate metadata
    console.log(chalk.gray('📋 Generating OSSA metadata...'));
    const metadata = generateOSSAMetadata(name, options.type);
    writeFileSync(join(agentDir, '.agents-metadata.json'), JSON.stringify(metadata, null, 2));

    console.log(chalk.green(`✅ Agent '${name}' created successfully!`));
    console.log(chalk.blue('\n📋 Next steps:'));
    console.log(chalk.gray(`1. cd ${agentDir}`));
    console.log(chalk.gray('2. npm install'));
    console.log(chalk.gray('3. npm run build'));
    console.log(chalk.gray('4. npm test'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to create agent:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Generate agent from existing OpenAPI specification
 */
export async function generateAgentFromOpenAPI(openapiFile: string, options: any): Promise<void> {
  console.log(chalk.blue(`📋 Generating agent from OpenAPI spec: ${openapiFile}...`));

  try {
    // Read and parse OpenAPI spec
    const openapiContent = readFileSync(resolve(openapiFile), 'utf8');
    const openapiSpec = yaml.load(openapiContent) as any;

    // Extract agent name from spec or use provided name
    const agentName =
      options.name || openapiSpec.info?.title?.toLowerCase().replace(/\s+/g, '-') || basename(openapiFile, '.yml');

    // Determine agent type from spec (basic heuristics)
    const agentType = determineAgentTypeFromSpec(openapiSpec);

    // Create agent with extracted information
    await createAgent(agentName, {
      type: agentType,
      output: options.output,
      schema: openapiFile
    });

    console.log(chalk.green(`✅ Agent '${agentName}' generated from OpenAPI specification!`));
  } catch (error) {
    console.error(
      chalk.red('❌ Failed to generate agent from OpenAPI:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

/**
 * Determine agent type from OpenAPI spec
 */
function determineAgentTypeFromSpec(spec: any): AgentOptions['type'] {
  const title = spec.info?.title?.toLowerCase() || '';
  const description = spec.info?.description?.toLowerCase() || '';
  const paths = Object.keys(spec.paths || {});

  // Simple heuristics to determine agent type
  if (title.includes('orchestrator') || title.includes('coordinator')) return 'orchestrator';
  if (title.includes('monitor') || paths.some((p) => p.includes('monitor'))) return 'monitor';
  if (title.includes('critic') || title.includes('validator')) return 'critic';
  if (title.includes('governor') || title.includes('policy')) return 'governor';
  if (title.includes('integrator') || title.includes('bridge')) return 'integrator';

  // Default to worker
  return 'worker';
}

/**
 * Generate agent manifest
 */
function generateAgentManifest(name: string, type: string): AgentManifest {
  return {
    apiVersion: '@bluefly/ossa/v0.1.9',
    kind: 'Agent',
    metadata: {
      name,
      uuid: `project-${name}-${type}-v1`,
      type,
      version: '1.0.0',
      description: `OSSA-compliant ${type} agent: ${name}`
    },
    spec: {
      capabilities: getCapabilitiesForType(type),
      dependencies: ['@ossa/core@0.1.9', 'express@^4.18.0'],
      endpoints: {
        health: '/health',
        execute: '/execute',
        status: '/status',
        metrics: '/metrics'
      },
      integrations: {
        workspace: {
          local: '.agents-workspace',
          global: '../.agent-workspace'
        },
        registry: {
          local: '../registry.yml',
          global: '../.agent-workspace/registry.yml'
        }
      },
      behaviors: {
        primary: `${name}.behavior.yml`,
        additional: []
      },
      validation: {
        schema: `schemas/${name}.schema.json`,
        openapi: 'openapi.yml'
      }
    }
  };
}

/**
 * Get capabilities for agent type
 */
function getCapabilitiesForType(type: string): string[] {
  const capabilities: Record<string, string[]> = {
    orchestrator: ['multi_agent_coordination', 'workflow_orchestration', 'resource_allocation'],
    worker: ['task_execution', 'data_processing', 'api_interaction'],
    critic: ['output_validation', 'quality_assessment', 'compliance_checking'],
    governor: ['policy_enforcement', 'resource_management', 'access_control'],
    monitor: ['health_monitoring', 'performance_tracking', 'alert_generation'],
    integrator: ['external_integration', 'protocol_bridging', 'data_transformation']
  };

  return capabilities[type] || capabilities.worker;
}

/**
 * Generate OpenAPI specification
 */
function generateOpenAPISpec(name: string, type: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: `${name} Agent API`,
      version: '1.0.0',
      description: `OSSA-compliant API for ${name} ${type} agent`
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          operationId: 'getHealth',
          responses: {
            '200': {
              description: 'Agent is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'healthy' },
                      agent: { type: 'string', example: name },
                      type: { type: 'string', example: type },
                      version: { type: 'string', example: '1.0.0' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/execute': {
        post: {
          summary: 'Execute agent task',
          operationId: 'executeTask',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    task: { type: 'string', description: 'Task to execute' },
                    parameters: {
                      type: 'object',
                      description: 'Task parameters'
                    }
                  },
                  required: ['task']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Task executed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      result: { type: 'object' },
                      execution_id: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
}

/**
 * Generate behavior definition
 */
function generateBehaviorDefinition(name: string, type: string) {
  return {
    apiVersion: '@bluefly/ossa/v0.1.9',
    kind: 'AgentBehavior',
    metadata: {
      name: `${name}-behavior`,
      agent: name,
      version: '1.0.0'
    },
    spec: {
      behavior_type: type,
      triggers: [
        { type: 'api_request', endpoint: '/execute', method: 'POST' },
        { type: 'event_driven', events: ['task.assigned'] },
        { type: 'scheduled', cron: '0 */6 * * *' }
      ],
      capabilities: getCapabilitiesForType(type),
      quality_gates: [
        {
          name: 'input_validation',
          required: true,
          schema: `schemas/input/${name}.input.json`
        },
        {
          name: 'output_verification',
          required: true,
          schema: `schemas/output/${name}.output.json`
        }
      ],
      artifacts: {
        outputs: [`${name}_logs`, `${name}_results`],
        storage: {
          local: '.agents-workspace/data/artifacts',
          global: '../.agent-workspace/data/artifacts'
        }
      }
    }
  };
}

/**
 * Generate TypeScript handler
 */
function generateTypeScriptHandler(name: string, type: string): string {
  const className = name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `import { Request, Response } from 'express';

/**
 * ${className} Agent Handler
 * OSSA v0.1.9 compliant ${type} implementation
 */
export class ${className}Handler {

  async health(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'healthy',
      agent: '${name}',
      type: '${type}',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  async execute(req: Request, res: Response): Promise<void> {
    const { task, parameters } = req.body;

    try {
      const result = await this.processTask(task, parameters);
      res.json({
        status: 'success',
        result,
        execution_id: this.generateExecutionId(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  private async processTask(task: string, parameters: any): Promise<any> {
    // TODO: Implement ${type}-specific logic
    console.log(\`Processing task: \${task}\`, parameters);

    return {
      task,
      processed: true,
      agent: '${name}',
      type: '${type}',
      timestamp: new Date().toISOString()
    };
  }

  private generateExecutionId(): string {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }
}
`;
}

// Additional helper functions for schema generation, package.json, etc.
function generateInputSchema(name: string, type: string) {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: `${name} Input Schema`,
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'Task to execute'
      },
      parameters: {
        type: 'object',
        description: 'Task parameters'
      }
    },
    required: ['task']
  };
}

function generateOutputSchema(name: string, type: string) {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: `${name} Output Schema`,
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['success', 'error', 'processing']
      },
      result: {
        type: 'object'
      },
      execution_id: {
        type: 'string'
      },
      timestamp: {
        type: 'string',
        format: 'date-time'
      }
    },
    required: ['status']
  };
}

function generatePackageJson(name: string, type: string) {
  return {
    name: `@agents/${name}`,
    version: '1.0.0',
    description: `OSSA-compliant ${type} agent: ${name}`,
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      start: 'node dist/index.js',
      dev: 'ts-node src/index.ts',
      test: 'jest',
      lint: 'eslint src/**/*.ts'
    },
    dependencies: {
      '@ossa/core': '^0.1.9',
      express: '^4.18.0',
      zod: '^3.22.0'
    },
    devDependencies: {
      '@types/express': '^4.17.0',
      '@types/node': '^20.0.0',
      typescript: '^5.0.0',
      'ts-node': '^10.9.0',
      jest: '^29.0.0',
      '@types/jest': '^29.0.0',
      eslint: '^8.0.0'
    }
  };
}

function generateTsConfig() {
  return {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'tests']
  };
}

function generateBasicTest(name: string, type: string): string {
  const className = name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `import { ${className}Handler } from '../handlers/${name}.handlers';

describe('${className}Handler', () => {
  let handler: ${className}Handler;

  beforeEach(() => {
    handler = new ${className}Handler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(${className}Handler);
  });

  test('should handle health check', async () => {
    const req = {} as any;
    const res = {
      json: jest.fn()
    } as any;

    await handler.health(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'healthy',
        agent: '${name}',
        type: '${type}',
        version: '1.0.0'
      })
    );
  });

  test('should handle task execution', async () => {
    const req = {
      body: {
        task: 'test-task',
        parameters: { test: true }
      }
    } as any;
    const res = {
      json: jest.fn()
    } as any;

    await handler.execute(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        result: expect.any(Object)
      })
    );
  });
});
`;
}

function generateOSSAMetadata(name: string, type: string) {
  return {
    ossa_version: '0.1.9',
    agent: {
      name,
      type,
      compliance_level: 'full',
      api_version: '1.0.0',
      last_updated: new Date().toISOString(),
      structure_complete: true
    },
    directories: {
      behaviors: true,
      data: true,
      handlers: true,
      integrations: true,
      schemas: true,
      src: true,
      tests: true,
      config: true,
      deployments: true
    },
    files: {
      'agent.yml': true,
      'openapi.yml': true,
      'README.md': true,
      'package.json': true,
      'tsconfig.json': true
    }
  };
}

function generateAgentReadme(name: string, type: string): string {
  return `# ${name} Agent

OSSA-compliant ${type} agent generated by OSSA CLI v0.1.9-alpha.1.

## Overview

This agent handles ${type} operations within the OSSA ecosystem.

## API

See \`openapi.yml\` for complete API specification.

## Structure

- \`behaviors/\` - Agent behavior definitions
- \`handlers/\` - TypeScript request handlers
- \`integrations/\` - External system integrations
- \`schemas/\` - JSON Schema definitions
- \`src/\` - Core implementation
- \`tests/\` - Unit and integration tests

## Development

\`\`\`bash
# Install dependencies
npm install

# Build the agent
npm run build

# Run tests
npm test

# Start development server
npm run dev
\`\`\`

## Deployment

\`\`\`bash
# Build for production
npm run build

# Start production server
npm start
\`\`\`

## OSSA Compliance

This agent follows OSSA v0.1.9-alpha.1 specification:
- ✅ OpenAPI 3.1 specification
- ✅ Structured behaviors
- ✅ JSON Schema validation
- ✅ TypeScript implementation
- ✅ Comprehensive testing
- ✅ Metadata tracking

Generated by OSSA CLI v0.1.9-alpha.1
`;
}
