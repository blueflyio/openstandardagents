#!/usr/bin/env tsx

/**
 * OSSA Schema Migration Tools v0.1.8
 * API-First Schema Transformation Utilities
 * 
 * Transforms legacy agent schemas to OpenAPI 3.1+ compliant specifications
 * with full API-first architectural patterns
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import ora from 'ora';

interface SchemaTransformOptions {
  outputFormat?: 'yaml' | 'json';
  apiVersion?: string;
  generateDocs?: boolean;
  strict?: boolean;
  verbose?: boolean;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  security?: Array<Record<string, string[]>>;
}

interface AgentCapability {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  returns?: any;
  category?: string;
}

class SchemaTransformationEngine {
  private options: SchemaTransformOptions;

  constructor(options: SchemaTransformOptions = {}) {
    this.options = {
      outputFormat: 'yaml',
      apiVersion: '3.1.0',
      generateDocs: true,
      ...options
    };
  }

  /**
   * Transform agent configuration to OpenAPI specification
   */
  async transformAgentToAPI(agentPath: string, outputPath?: string): Promise<OpenAPISpec> {
    const spinner = ora(`Transforming ${path.basename(agentPath)} to OpenAPI...`).start();

    try {
      const agentContent = await fs.readFile(agentPath, 'utf8');
      const agent = yaml.load(agentContent) as any;

      const openApiSpec = this.createOpenAPISpec(agent);
      
      if (outputPath) {
        await this.writeSpec(openApiSpec, outputPath);
        spinner.succeed(`OpenAPI spec generated: ${path.basename(outputPath)}`);
      } else {
        spinner.succeed('OpenAPI transformation completed');
      }

      return openApiSpec;

    } catch (error) {
      spinner.fail(`Failed to transform ${path.basename(agentPath)}`);
      throw error;
    }
  }

  /**
   * Create OpenAPI specification from agent configuration
   */
  private createOpenAPISpec(agent: any): OpenAPISpec {
    const metadata = agent.metadata || {};
    const spec = agent.spec || {};

    const openApiSpec: OpenAPISpec = {
      openapi: this.options.apiVersion || '3.1.0',
      info: {
        title: `${metadata.name || 'Agent'} API`,
        version: metadata.version || '1.0.0',
        description: metadata.description || `API for ${metadata.name} agent`
      },
      servers: this.generateServers(spec),
      paths: this.generatePaths(spec),
      components: this.generateComponents(spec),
      security: this.generateSecurity(spec)
    };

    return openApiSpec;
  }

  /**
   * Generate server configurations
   */
  private generateServers(spec: any): Array<{url: string; description?: string}> {
    const servers = [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.ossa.agents/v1',
        description: 'Production server'
      }
    ];

    // Add custom servers from spec
    if (spec.endpoints?.servers) {
      servers.push(...spec.endpoints.servers);
    }

    return servers;
  }

  /**
   * Generate API paths from agent capabilities
   */
  private generatePaths(spec: any): Record<string, any> {
    const paths: Record<string, any> = {};

    // Add standard agent endpoints
    this.addStandardPaths(paths);

    // Transform capabilities to API endpoints
    if (spec.capabilities) {
      this.addCapabilityPaths(paths, spec.capabilities);
    }

    // Add custom operations if defined
    if (spec.operations) {
      this.addOperationPaths(paths, spec.operations);
    }

    return paths;
  }

  /**
   * Add standard agent API paths
   */
  private addStandardPaths(paths: Record<string, any>): void {
    // Health check endpoint
    paths['/health'] = {
      get: {
        operationId: 'getHealth',
        summary: 'Agent health check',
        description: 'Check if the agent is healthy and operational',
        responses: {
          '200': {
            description: 'Agent is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' }
                  }
                }
              }
            }
          },
          '503': {
            description: 'Agent is unhealthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    };

    // Capabilities endpoint
    paths['/capabilities'] = {
      get: {
        operationId: 'getCapabilities',
        summary: 'List agent capabilities',
        description: 'Get all available capabilities of this agent',
        responses: {
          '200': {
            description: 'List of capabilities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    capabilities: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Capability'
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

    // Discovery endpoint
    paths['/discovery'] = {
      get: {
        operationId: 'getDiscoveryInfo',
        summary: 'Agent discovery information',
        description: 'Get UADP discovery information for this agent',
        responses: {
          '200': {
            description: 'Discovery information',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DiscoveryInfo'
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Transform capabilities to API paths
   */
  private addCapabilityPaths(paths: Record<string, any>, capabilities: string[] | AgentCapability[]): void {
    const capabilityList = Array.isArray(capabilities) ? capabilities : [];

    capabilityList.forEach(capability => {
      const cap = typeof capability === 'string' 
        ? { name: capability, description: `Execute ${capability} capability` }
        : capability;

      const pathKey = `/execute/${this.kebabCase(cap.name)}`;
      
      paths[pathKey] = {
        post: {
          operationId: this.generateOperationId(cap.name),
          summary: cap.description || `Execute ${cap.name}`,
          description: `Perform ${cap.name} operation`,
          tags: [cap.category || 'capabilities'],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: cap.parameters || {
                  type: 'object',
                  properties: {
                    input: { type: 'string', description: 'Input data' },
                    options: { type: 'object', description: 'Execution options' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Capability executed successfully',
              content: {
                'application/json': {
                  schema: cap.returns || {
                    type: 'object',
                    properties: {
                      result: { type: 'string', description: 'Execution result' },
                      status: { type: 'string', enum: ['success'] },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': {
              description: 'Execution failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      };
    });
  }

  /**
   * Add custom operations to paths
   */
  private addOperationPaths(paths: Record<string, any>, operations: any[]): void {
    operations.forEach(operation => {
      const pathKey = operation.path || `/operations/${operation.operationId}`;
      const method = (operation.method || 'post').toLowerCase();

      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }

      paths[pathKey][method] = {
        operationId: operation.operationId,
        summary: operation.summary || 'Custom operation',
        description: operation.description || 'Execute custom operation',
        ...operation.spec
      };
    });
  }

  /**
   * Generate OpenAPI components
   */
  private generateComponents(spec: any): any {
    return {
      schemas: {
        Error: {
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' },
            details: { type: 'object', description: 'Additional error details' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Capability: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', description: 'Capability name' },
            description: { type: 'string', description: 'Capability description' },
            category: { type: 'string', description: 'Capability category' },
            parameters: { type: 'object', description: 'Required parameters' },
            returns: { type: 'object', description: 'Return type specification' }
          }
        },
        DiscoveryInfo: {
          type: 'object',
          properties: {
            agent: { type: 'string', description: 'Agent identifier' },
            version: { type: 'string', description: 'Agent version' },
            capabilities: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Available capabilities'
            },
            endpoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Available API endpoints'
            },
            uadp: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                tags: { type: 'array', items: { type: 'string' } },
                discoveryUrl: { type: 'string', format: 'uri' }
              }
            }
          }
        }
      },
      securitySchemes: this.generateSecuritySchemes(spec)
    };
  }

  /**
   * Generate security schemes
   */
  private generateSecuritySchemes(spec: any): Record<string, any> {
    const schemes: Record<string, any> = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    };

    // Add custom security schemes from spec
    if (spec.security?.schemes) {
      Object.assign(schemes, spec.security.schemes);
    }

    return schemes;
  }

  /**
   * Generate security requirements
   */
  private generateSecurity(spec: any): Array<Record<string, string[]>> {
    if (spec.security?.required === false) {
      return [];
    }

    // Default security requirements
    return [
      { bearerAuth: [] },
      { apiKey: [] }
    ];
  }

  /**
   * Write OpenAPI specification to file
   */
  private async writeSpec(spec: OpenAPISpec, outputPath: string): Promise<void> {
    await fs.ensureDir(path.dirname(outputPath));

    const content = this.options.outputFormat === 'json'
      ? JSON.stringify(spec, null, 2)
      : yaml.dump(spec, { indent: 2, lineWidth: -1 });

    await fs.writeFile(outputPath, content, 'utf8');

    // Generate documentation if enabled
    if (this.options.generateDocs) {
      await this.generateDocumentation(spec, outputPath);
    }
  }

  /**
   * Generate API documentation
   */
  private async generateDocumentation(spec: OpenAPISpec, specPath: string): Promise<void> {
    const docPath = specPath.replace(/\.(yaml|yml|json)$/, '.html');
    
    try {
      // Generate ReDoc HTML documentation
      const htmlDoc = this.generateReDocHTML(spec, specPath);
      await fs.writeFile(docPath, htmlDoc, 'utf8');
      
      if (this.options.verbose) {
        console.log(chalk.dim(`  Generated docs: ${path.basename(docPath)}`));
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(chalk.yellow(`  Warning: Could not generate docs: ${error}`));
      }
    }
  }

  /**
   * Generate ReDoc HTML documentation
   */
  private generateReDocHTML(spec: OpenAPISpec, specPath: string): string {
    const specFileName = path.basename(specPath);
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>${spec.info.title} - API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <redoc spec-url="./${specFileName}"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;
  }

  /**
   * Utility functions
   */
  private kebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private generateOperationId(capability: string): string {
    return 'execute' + capability
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

/**
 * Batch transform multiple agents
 */
async function batchTransformAgents(
  pattern: string, 
  outputDir: string, 
  options: SchemaTransformOptions
): Promise<void> {
  const spinner = ora('Finding agent files...').start();
  
  try {
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/__DELETE_LATER/**']
    });

    spinner.succeed(`Found ${files.length} agent files`);

    if (files.length === 0) {
      console.log(chalk.yellow('No agent files found matching pattern.'));
      return;
    }

    const engine = new SchemaTransformationEngine(options);
    
    await fs.ensureDir(outputDir);

    for (const file of files) {
      const baseName = path.basename(file, path.extname(file));
      const outputFile = path.join(
        outputDir, 
        `${baseName}-api.${options.outputFormat || 'yaml'}`
      );
      
      await engine.transformAgentToAPI(file, outputFile);
    }

    console.log(chalk.green(`\n✅ Transformed ${files.length} agents to OpenAPI specs`));
    console.log(chalk.cyan(`📁 Output directory: ${outputDir}`));

  } catch (error) {
    spinner.fail('Batch transformation failed');
    throw error;
  }
}

/**
 * Export schema migration commands
 */
export function createSchemaMigrationCommands(): Command {
  const schemaMigration = new Command('schema-migration')
    .description('Transform agent schemas to OpenAPI 3.1+ specifications');

  // Transform single agent
  schemaMigration
    .command('transform <agentFile>')
    .description('Transform single agent to OpenAPI specification')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Output format (yaml|json)', 'yaml')
    .option('--api-version <version>', 'OpenAPI version', '3.1.0')
    .option('--no-docs', 'Skip documentation generation')
    .option('-v, --verbose', 'Verbose output')
    .action(async (agentFile, options) => {
      console.log(chalk.blue.bold('🔄 Schema Transformation'));
      console.log(chalk.gray(`Converting ${agentFile} to OpenAPI ${options.apiVersion}\n`));

      try {
        const engine = new SchemaTransformationEngine(options);
        const outputPath = options.output || 
          agentFile.replace(/\.(yaml|yml)$/, `-api.${options.format}`);
        
        await engine.transformAgentToAPI(agentFile, outputPath);
        
        console.log(chalk.green(`\n✅ Transformation completed`));
        console.log(chalk.cyan(`📄 Output: ${outputPath}`));
        
      } catch (error) {
        console.error(chalk.red('Transformation failed:'), error);
        process.exit(1);
      }
    });

  // Batch transformation
  schemaMigration
    .command('batch [pattern]')
    .description('Transform multiple agents to OpenAPI specifications')
    .option('-o, --output-dir <dir>', 'Output directory', './api-specs')
    .option('-f, --format <format>', 'Output format (yaml|json)', 'yaml')
    .option('--api-version <version>', 'OpenAPI version', '3.1.0')
    .option('--no-docs', 'Skip documentation generation')
    .option('-v, --verbose', 'Verbose output')
    .action(async (pattern = '**/*agent*.{yml,yaml}', options) => {
      console.log(chalk.blue.bold('🔄 Batch Schema Transformation'));
      console.log(chalk.gray(`Pattern: ${pattern}\n`));

      try {
        await batchTransformAgents(pattern, options.outputDir, options);
      } catch (error) {
        console.error(chalk.red('Batch transformation failed:'), error);
        process.exit(1);
      }
    });

  return schemaMigration;
}

export { SchemaTransformationEngine, SchemaTransformOptions, OpenAPISpec };