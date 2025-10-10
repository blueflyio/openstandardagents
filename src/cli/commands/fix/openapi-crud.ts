/**
 * OpenAPI CRUD Operations
 * Comprehensive Create, Read, Update, Delete operations for OpenAPI specifications
 * Integrated into OSSA CLI for spec management
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { z } from 'zod';

// OpenAPI 3.1 Schema
const OpenAPISchema = z.object({
  openapi: z.string(),
  info: z.object({
    title: z.string(),
    version: z.string(),
    description: z.string().optional()
  }),
  servers: z
    .array(
      z.object({
        url: z.string(),
        description: z.string().optional()
      })
    )
    .optional(),
  paths: z.record(z.string(), z.any()),
  components: z
    .object({
      schemas: z.record(z.string(), z.any()).optional(),
      securitySchemes: z.record(z.string(), z.any()).optional()
    })
    .optional()
});

export type OpenAPISpec = z.infer<typeof OpenAPISchema>;

export class OpenAPICRUD {
  private rootDir: string;
  private specsDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.specsDir = path.join(rootDir, 'specifications');
  }

  /**
   * CREATE - Create a new OpenAPI specification
   */
  async create(options: {
    name: string;
    title?: string;
    version?: string;
    description?: string;
    template?: 'minimal' | 'rest-api' | 'microservice';
  }): Promise<string> {
    const specPath = path.join(this.specsDir, `${options.name}.openapi.yaml`);

    if (fs.existsSync(specPath)) {
      throw new Error(`Specification already exists: ${specPath}`);
    }

    const spec = this.generateTemplate(options);

    // Ensure directory exists
    if (!fs.existsSync(this.specsDir)) {
      fs.mkdirSync(this.specsDir, { recursive: true });
    }

    // Write spec
    fs.writeFileSync(specPath, yaml.dump(spec, { indent: 2, noRefs: true }), 'utf8');

    console.log(chalk.green(`✅ Created OpenAPI spec: ${path.relative(this.rootDir, specPath)}`));

    return specPath;
  }

  /**
   * READ - Read and validate an OpenAPI specification
   */
  async read(specName: string): Promise<OpenAPISpec> {
    const specPath = this.resolveSpecPath(specName);

    if (!fs.existsSync(specPath)) {
      throw new Error(`Specification not found: ${specPath}`);
    }

    const content = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(content);

    // Validate
    try {
      return OpenAPISchema.parse(spec);
    } catch (error) {
      throw new Error(`Invalid OpenAPI specification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * UPDATE - Update an existing OpenAPI specification
   */
  async update(specName: string, updates: Partial<OpenAPISpec>): Promise<string> {
    const specPath = this.resolveSpecPath(specName);
    const existing = await this.read(specName);

    // Merge updates
    const updated = {
      ...existing,
      ...updates,
      info: {
        ...existing.info,
        ...(updates.info || {})
      },
      paths: {
        ...existing.paths,
        ...(updates.paths || {})
      },
      components: {
        ...(existing.components || {}),
        ...(updates.components || {}),
        schemas: {
          ...(existing.components?.schemas || {}),
          ...(updates.components?.schemas || {})
        }
      }
    };

    // Validate merged spec
    OpenAPISchema.parse(updated);

    // Backup original
    const backupPath = `${specPath}.backup`;
    fs.copyFileSync(specPath, backupPath);

    // Write updated spec
    fs.writeFileSync(specPath, yaml.dump(updated, { indent: 2, noRefs: true }), 'utf8');

    console.log(chalk.green(`✅ Updated OpenAPI spec: ${path.relative(this.rootDir, specPath)}`));
    console.log(chalk.gray(`   Backup saved: ${path.basename(backupPath)}`));

    return specPath;
  }

  /**
   * DELETE - Delete an OpenAPI specification
   */
  async delete(specName: string, options: { backup?: boolean } = {}): Promise<void> {
    const specPath = this.resolveSpecPath(specName);

    if (!fs.existsSync(specPath)) {
      throw new Error(`Specification not found: ${specPath}`);
    }

    if (options.backup) {
      const backupDir = path.join(this.rootDir, '.deleted-specs');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, `${path.basename(specPath)}.${Date.now()}`);
      fs.copyFileSync(specPath, backupPath);

      console.log(chalk.gray(`   Backup saved: ${path.relative(this.rootDir, backupPath)}`));
    }

    fs.unlinkSync(specPath);

    console.log(chalk.green(`✅ Deleted OpenAPI spec: ${path.relative(this.rootDir, specPath)}`));
  }

  /**
   * LIST - List all OpenAPI specifications
   */
  async list(): Promise<string[]> {
    if (!fs.existsSync(this.specsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.specsDir);
    return files.filter((f) => f.endsWith('.openapi.yaml') || f.endsWith('.openapi.yml'));
  }

  /**
   * VALIDATE - Validate an OpenAPI specification
   */
  async validate(specName: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const spec = await this.read(specName);

      // Additional validation rules
      if (!spec.paths || Object.keys(spec.paths).length === 0) {
        errors.push('Specification has no paths defined');
      }

      if (!spec.info.title) {
        errors.push('Missing required field: info.title');
      }

      if (!spec.info.version) {
        errors.push('Missing required field: info.version');
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return { valid: false, errors };
    }
  }

  /**
   * MERGE - Merge multiple OpenAPI specifications
   */
  async merge(specNames: string[], outputName: string): Promise<string> {
    const specs = await Promise.all(specNames.map((name) => this.read(name)));

    // Merge specs
    const merged: OpenAPISpec = {
      openapi: '3.1.0',
      info: {
        title: `Merged API: ${specNames.join(', ')}`,
        version: '1.0.0',
        description: `Merged from ${specNames.length} specifications`
      },
      paths: {},
      components: {
        schemas: {}
      }
    };

    for (const spec of specs) {
      // Merge paths
      Object.assign(merged.paths, spec.paths);

      // Merge schemas
      if (spec.components?.schemas) {
        Object.assign(merged.components!.schemas!, spec.components.schemas);
      }
    }

    // Create merged spec
    return await this.create({
      name: outputName,
      title: merged.info.title,
      version: merged.info.version,
      description: merged.info.description
    });
  }

  /**
   * Helper: Resolve spec path
   */
  private resolveSpecPath(specName: string): string {
    // If already a full path
    if (specName.includes('/')) {
      return path.resolve(this.rootDir, specName);
    }

    // Add extension if missing
    if (!specName.endsWith('.yaml') && !specName.endsWith('.yml')) {
      specName += '.openapi.yaml';
    }

    return path.join(this.specsDir, specName);
  }

  /**
   * Helper: Generate template
   */
  private generateTemplate(options: {
    name: string;
    title?: string;
    version?: string;
    description?: string;
    template?: 'minimal' | 'rest-api' | 'microservice';
  }): OpenAPISpec {
    const baseSpec: OpenAPISpec = {
      openapi: '3.1.0',
      info: {
        title: options.title || options.name,
        version: options.version || '1.0.0',
        description: options.description || `API specification for ${options.name}`
      },
      paths: {}
    };

    switch (options.template) {
      case 'rest-api':
        return {
          ...baseSpec,
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
                responses: {
                  '200': {
                    description: 'Service is healthy',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            status: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' }
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
            schemas: {
              Error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' }
                },
                required: ['code', 'message']
              }
            }
          }
        };

      case 'microservice':
        return {
          ...baseSpec,
          servers: [
            {
              url: 'http://localhost:3000',
              description: 'Development'
            },
            {
              url: 'https://api.example.com',
              description: 'Production'
            }
          ],
          paths: {
            '/health': {
              get: {
                summary: 'Health check',
                operationId: 'healthCheck',
                tags: ['System'],
                responses: {
                  '200': {
                    description: 'Service is healthy'
                  }
                }
              }
            },
            '/metrics': {
              get: {
                summary: 'Prometheus metrics',
                operationId: 'getMetrics',
                tags: ['System'],
                responses: {
                  '200': {
                    description: 'Metrics data'
                  }
                }
              }
            }
          },
          components: {
            schemas: {
              Error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'object' }
                }
              }
            },
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
              }
            }
          }
        };

      default:
        return baseSpec;
    }
  }
}

/**
 * CLI Command Handlers
 */

export async function createSpecCommand(options: any): Promise<void> {
  const crud = new OpenAPICRUD();

  try {
    await crud.create({
      name: options.name,
      title: options.title,
      version: options.version,
      description: options.description,
      template: options.template || 'minimal'
    });
  } catch (error) {
    console.error(chalk.red(`❌ Failed to create spec: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

export async function readSpecCommand(specName: string): Promise<void> {
  const crud = new OpenAPICRUD();

  try {
    const spec = await crud.read(specName);
    console.log(yaml.dump(spec, { indent: 2 }));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to read spec: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

export async function listSpecsCommand(): Promise<void> {
  const crud = new OpenAPICRUD();

  try {
    const specs = await crud.list();

    if (specs.length === 0) {
      console.log(chalk.yellow('No OpenAPI specifications found'));
      return;
    }

    console.log(chalk.bold.cyan('\n📋 OpenAPI Specifications\n'));
    specs.forEach((spec) => {
      console.log(`  • ${spec}`);
    });
    console.log(`\n  Total: ${specs.length} specification(s)\n`);
  } catch (error) {
    console.error(chalk.red(`❌ Failed to list specs: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

export async function validateSpecCommand(specName: string): Promise<void> {
  const crud = new OpenAPICRUD();

  try {
    const result = await crud.validate(specName);

    if (result.valid) {
      console.log(chalk.green(`✅ Specification is valid: ${specName}`));
    } else {
      console.log(chalk.red(`❌ Specification is invalid: ${specName}`));
      result.errors.forEach((error) => {
        console.log(chalk.red(`   • ${error}`));
      });
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
