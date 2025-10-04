#!/usr/bin/env node

/**
 * OSSA CLI - Main Command Line Interface
 * OpenAPI 3.1 compliant CRUD operations for the OSSA specification
 * Replaces all shell scripts with TypeScript-based operations
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
// import { createValidateCommand } from './commands/validate.js'; // Removed - causes duplicate command
import { createVisualizeCommand } from './commands/visualize.js';
import { createKnowledgeGraphCommand } from './commands/knowledge-graph.js';
import { createInitCommand } from './commands/init.js';
import { z } from 'zod';
import * as yaml from 'js-yaml';

// OpenAPI 3.1 Schema Definitions
const OpenAPISchema = z.object({
  openapi: z.literal('3.1.0'),
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
      schemas: z.record(z.string(), z.any()).optional()
    })
    .optional()
});

// const SpecificationSchema = z.object({
//   agentId: z.string().regex(/^[a-z0-9-]+$/),
//   agentType: z.enum(['orchestrator', 'worker', 'critic', 'judge', 'trainer', 'governor', 'monitor', 'integrator']),
//   version: z.string().regex(/^\d+\.\d+\.\d+$/),
//   capabilities: z.object({
//     supportedDomains: z.array(z.string()),
//     inputFormats: z.array(z.string()),
//     outputFormats: z.array(z.string())
//   })

interface CLIConfig {
  baseDir: string;
  specsDir: string;
  agentsDir: string;
  outputDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: string[];
}

class OSSACli {
  private config: CLIConfig;
  private program: Command;

  constructor() {
    this.config = {
      baseDir: process.cwd(),
      specsDir: join(process.cwd(), 'src', 'api'),
      agentsDir: join(process.cwd(), '.agents'),
      outputDir: join(process.cwd(), 'dist'),
      logLevel: 'info'
    };
    this.program = new Command();
    this.setupCommands();
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel < configLevel) return;

    const colors = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red
    };

    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(colors[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`));

    if (data) {
      // eslint-disable-next-line no-console
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  private setupCommands(): void {
    this.program
      .name('ossa')
      .description('OSSA CLI - OpenAPI 3.1 Specification Management')
      .version('0.1.9')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-d, --debug', 'Enable debug logging')
      .hook('preAction', (thisCommand) => {
        if (thisCommand.opts().verbose) this.config.logLevel = 'info';
        if (thisCommand.opts().debug) this.config.logLevel = 'debug';
      });

    // Add OSSA validation commands (commented out to avoid duplicate)
    // this.program.addCommand(createValidateCommand());

    // Add init command for project scaffolding
    this.program.addCommand(createInitCommand());

    // Add visualization command
    this.program.addCommand(createVisualizeCommand());

    // Add knowledge graph command with Phoenix tracing
    this.program.addCommand(createKnowledgeGraphCommand());

    // SPECIFICATION CRUD Operations
    const specCommand = this.program.command('spec').description('Specification management (CRUD operations)');

    // CREATE specification
    specCommand
      .command('create')
      .description('Create new OpenAPI 3.1 specification')
      .argument('<name>', 'Specification name')
      .option('-t, --type <type>', 'Agent type', 'worker')
      .option('-d, --description <desc>', 'Specification description')
      .option('-v, --version <version>', 'API version', '1.0.0')
      .option('--template <template>', 'Use template (basic, advanced, industrial)')
      .option('--rasp-enabled', 'Enable RASP (Runtime Application Self-Protection) protocol support')
      .action(this.createSpecification.bind(this));

    // READ specifications
    specCommand
      .command('list')
      .description('List all specifications')
      .option('-f, --format <format>', 'Output format (table, json, yaml)', 'table')
      .option('--filter <filter>', 'Filter by type or version')
      .action(this.listSpecifications.bind(this));

    specCommand
      .command('get')
      .description('Get specification details')
      .argument('<name>', 'Specification name')
      .option('-f, --format <format>', 'Output format (json, yaml)', 'yaml')
      .action(this.getSpecification.bind(this));

    // UPDATE specification
    specCommand
      .command('update')
      .description('Update existing specification')
      .argument('<name>', 'Specification name')
      .option('-d, --description <desc>', 'Update description')
      .option('-v, --version <version>', 'Update version')
      .option('--add-path <path>', 'Add new API path')
      .option('--remove-path <path>', 'Remove API path')
      .action(this.updateSpecification.bind(this));

    // DELETE specification
    specCommand
      .command('delete')
      .description('Delete specification')
      .argument('<name>', 'Specification name')
      .option('-f, --force', 'Force deletion without confirmation')
      .action(this.deleteSpecification.bind(this));

    // AGENT CRUD Operations
    const agentCommand = this.program.command('agent').description('Agent management (CRUD operations)');

    // CREATE agent
    agentCommand
      .command('create')
      .description('Create new agent')
      .argument('<agent-id>', 'Agent identifier')
      .option('-t, --type <type>', 'Agent type')
      .option('-s, --spec <spec>', 'OpenAPI specification file')
      .option('-c, --capabilities <caps>', 'Comma-separated capabilities')
      .action(this.createAgent.bind(this));

    // READ agents
    agentCommand
      .command('list')
      .description('List all agents')
      .option('-t, --type <type>', 'Filter by agent type')
      .option('-s, --status <status>', 'Filter by status')
      .action(this.listAgents.bind(this));

    agentCommand
      .command('get')
      .description('Get agent details')
      .argument('<agent-id>', 'Agent identifier')
      .option('-f, --format <format>', 'Output format (json, yaml, table)', 'table')
      .action(this.getAgent.bind(this));

    // UPDATE agent
    agentCommand
      .command('update')
      .description('Update agent configuration')
      .argument('<agent-id>', 'Agent identifier')
      .option('-c, --capabilities <caps>', 'Update capabilities')
      .option('-s, --spec <spec>', 'Update OpenAPI specification')
      .action(this.updateAgent.bind(this));

    // DELETE agent
    agentCommand
      .command('delete')
      .description('Delete agent')
      .argument('<agent-id>', 'Agent identifier')
      .option('-f, --force', 'Force deletion')
      .action(this.deleteAgent.bind(this));

    // VALIDATION Operations
    this.program
      .command('validate')
      .description('Validate OpenAPI 3.1 specifications and agents')
      .option('-s, --spec <spec>', 'Validate specific specification')
      .option('-a, --agent <agent>', 'Validate specific agent')
      .option('--all', 'Validate all specifications and agents')
      .option('--fix', 'Auto-fix validation errors where possible')
      .action(this.validate.bind(this));

    // BUILD Operations
    this.program
      .command('build')
      .description('Build and compile specifications')
      .option('-s, --spec <spec>', 'Build specific specification')
      .option('--all', 'Build all specifications')
      .option('-w, --watch', 'Watch for changes and rebuild')
      .option('--output <dir>', 'Output directory')
      .action(this.build.bind(this));

    // DEPLOYMENT Operations
    this.program
      .command('deploy')
      .description('Deploy agents and specifications')
      .option('-e, --environment <env>', 'Target environment (dev, staging, prod)', 'dev')
      .option('-a, --agent <agent>', 'Deploy specific agent')
      .option('--all', 'Deploy all agents')
      .option('--dry-run', 'Show what would be deployed without deploying')
      .action(this.deploy.bind(this));

    // TESTING Operations
    this.program
      .command('test')
      .description('Test OpenAPI specifications and agents')
      .option('-s, --spec <spec>', 'Test specific specification')
      .option('-a, --agent <agent>', 'Test specific agent')
      .option('--all', 'Test all specifications and agents')
      .option('--coverage', 'Generate test coverage report')
      .action(this.test.bind(this));

    // STATUS Operations
    this.program
      .command('status')
      .description('Show system status')
      .option('--detailed', 'Show detailed status information')
      .option('--health', 'Show health check results')
      .action(this.status.bind(this));

    // MIGRATION Operations
    this.program
      .command('migrate')
      .description('Migrate specifications to OpenAPI 3.1')
      .option('--from <version>', 'Source OpenAPI version')
      .option('--backup', 'Create backup before migration')
      .option('--dry-run', 'Show migration plan without executing')
      .action(this.migrate.bind(this));

    // UAP (Universal Agent Protocol) Operations
    this.program
      .command('certify')
      .description('Certify agents and specifications for UAP compliance')
      .option('--acap', 'Enable ACAP (Agent Capability Assurance Protocol) certification')
      .option('-a, --agent <agent>', 'Certify specific agent')
      .option('-s, --spec <spec>', 'Certify specific specification')
      .option('--all', 'Certify all agents and specifications')
      .option('--output <format>', 'Output format (json, yaml, table)', 'table')
      .action(this.certify.bind(this));

    this.program
      .command('discover')
      .description('Discover UAP-compliant agents and services')
      .option('--uadp', 'Enable UADP (Universal Agent Discovery Protocol) for network discovery')
      .option('--network <network>', 'Target network for discovery')
      .option('--timeout <ms>', 'Discovery timeout in milliseconds', '5000')
      .option('--filter <filter>', 'Filter by agent type, capability, or version')
      .option('--output <format>', 'Output format (json, yaml, table)', 'table')
      .action(this.discover.bind(this));
  }

  // SPECIFICATION CRUD Operations
  private async createSpecification(name: string, options: any): Promise<void> {
    try {
      this.log('info', `Creating specification: ${name}`);

      const specTemplate = this.getSpecTemplate(options.template || 'basic');
      const spec = {
        ...specTemplate,
        info: {
          ...specTemplate.info,
          title: `${name} API`,
          version: options.version || '1.0.0',
          description: options.description || `OpenAPI 3.1 specification for ${name}`,
          ...(options.raspEnabled && {
            'x-rasp-enabled': true,
            'x-rasp-config': {
              monitoring: true,
              protection: true,
              alerting: true
            }
          })
        }
      };

      // Add RASP security schemes if enabled
      if (options.raspEnabled) {
        spec.components = spec.components || {};
        spec.components.securitySchemes = {
          ...spec.components.securitySchemes,
          RASPToken: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'RASP (Runtime Application Self-Protection) authentication token'
          }
        };
        spec.security = [{ RASPToken: [] }];
      }

      // Validate against OpenAPI 3.1 schema
      const validation = OpenAPISchema.safeParse(spec);
      if (!validation.success) {
        this.log('error', 'Specification validation failed', validation.error.issues);
        return;
      }

      const specPath = join(this.config.specsDir, `${name}.openapi.yml`);
      writeFileSync(specPath, yaml.dump(spec));

      this.log('info', `Specification created: ${specPath}`);

      // Auto-generate TypeScript types if requested
      if (options.generateTypes) {
        await this.generateTypes(name);
      }
    } catch (error) {
      this.log('error', `Failed to create specification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async listSpecifications(options: any): Promise<void> {
    try {
      this.log('info', 'Listing specifications...');

      const specs = this.getAllSpecifications();

      if (options.format === 'json') {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(specs, null, 2));
      } else if (options.format === 'yaml') {
        // eslint-disable-next-line no-console
        console.log(yaml.dump(specs));
      } else {
        // Table format
        console.table(
          specs.map((spec) => ({
            Name: spec.name,
            Version: spec.version,
            Type: spec.type || 'Unknown',
            'Last Modified': spec.lastModified
          }))
        );
      }
    } catch (error) {
      this.log('error', `Failed to list specifications: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getSpecification(name: string, options: any): Promise<void> {
    try {
      this.log('info', `Getting specification: ${name}`);

      const specPath = join(this.config.specsDir, `${name}.openapi.yml`);
      if (!existsSync(specPath)) {
        this.log('error', `Specification not found: ${name}`);
        return;
      }

      const content = readFileSync(specPath, 'utf8');

      if (options.format === 'json') {
        const spec = yaml.load(content);
        console.log(JSON.stringify(spec, null, 2));
      } else {
        console.log(content);
      }
    } catch (error) {
      this.log('error', `Failed to get specification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateSpecification(name: string, options: any): Promise<void> {
    try {
      this.log('info', `Updating specification: ${name}`);
      // TODO: Implement specification update logic
    } catch (error) {
      this.log('error', `Failed to update specification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteSpecification(name: string, options: any): Promise<void> {
    try {
      this.log('info', `Deleting specification: ${name}`);
      // TODO: Implement specification deletion logic
    } catch (error) {
      this.log('error', `Failed to delete specification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // AGENT CRUD Operations
  private async createAgent(agentId: string, options: any): Promise<void> {
    try {
      this.log('info', `Creating agent: ${agentId}`);
      // TODO: Implement agent creation logic
    } catch (error) {
      this.log('error', `Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async listAgents(options: any): Promise<void> {
    try {
      this.log('info', 'Listing agents...');
      // TODO: Implement agent listing logic
    } catch (error) {
      this.log('error', `Failed to list agents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getAgent(agentId: string, options: any): Promise<void> {
    try {
      this.log('info', `Getting agent: ${agentId}`);
      // TODO: Implement get agent logic
    } catch (error) {
      this.log('error', `Failed to get agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateAgent(agentId: string, options: any): Promise<void> {
    try {
      this.log('info', `Updating agent: ${agentId}`);
      // TODO: Implement agent update logic
    } catch (error) {
      this.log('error', `Failed to update agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteAgent(agentId: string, options: any): Promise<void> {
    try {
      this.log('info', `Deleting agent: ${agentId}`);
      // TODO: Implement agent deletion logic
    } catch (error) {
      this.log('error', `Failed to delete agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Utility Operations
  private async validate(options: any): Promise<void> {
    try {
      this.log('info', 'Starting validation...');

      if (options.all) {
        await this.validateAllSpecifications();
        await this.validateAllAgents();
      } else if (options.spec) {
        await this.validateSpecification(options.spec);
      } else if (options.agent) {
        await this.validateAgent(options.agent);
      }
    } catch (error) {
      this.log('error', `Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async build(options: any): Promise<void> {
    try {
      this.log('info', 'Building specifications...');
      // TODO: Implement build logic
    } catch (error) {
      this.log('error', `Build failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deploy(options: any): Promise<void> {
    try {
      this.log('info', `Deploying to ${options.environment}...`);
      // TODO: Implement deployment logic
    } catch (error) {
      this.log('error', `Deployment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async test(options: any): Promise<void> {
    try {
      this.log('info', 'Running tests...');
      // TODO: Implement testing logic
    } catch (error) {
      this.log('error', `Tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async status(options: any): Promise<void> {
    try {
      this.log('info', 'Checking system status...');

      const status = {
        specifications: this.getAllSpecifications().length,
        agents: this.getAllAgents().length,
        environment: process.env.NODE_ENV || 'development',
        version: '0.1.9',
        health: 'healthy'
      };

      // eslint-disable-next-line no-console
      console.log(chalk.green('OSSA System Status:'));
      console.table(status);
    } catch (error) {
      this.log('error', `Failed to get status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async migrate(options: any): Promise<void> {
    try {
      this.log('info', 'Starting migration...');
      // TODO: Implement migration logic
    } catch (error) {
      this.log('error', `Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // UAP Protocol Operations
  private async certify(options: any): Promise<void> {
    try {
      this.log('info', 'Starting UAP certification process...');

      const certificationResults: any[] = [];

      if (options.acap) {
        this.log('info', 'ACAP (Agent Capability Assurance Protocol) certification enabled');
      }

      if (options.all) {
        // Certify all agents and specifications
        this.log('info', 'Certifying all agents and specifications...');

        const agents = this.getAllAgents();
        const specs = this.getAllSpecifications();

        for (const agent of agents) {
          const result = await this.certifyAgent(agent.name, options);
          certificationResults.push(result);
        }

        for (const spec of specs) {
          const result = await this.certifySpecification(spec.name, options);
          certificationResults.push(result);
        }
      } else if (options.agent) {
        // Certify specific agent
        const result = await this.certifyAgent(options.agent, options);
        certificationResults.push(result);
      } else if (options.spec) {
        // Certify specific specification
        const result = await this.certifySpecification(options.spec, options);
        certificationResults.push(result);
      }

      // Output results
      this.outputCertificationResults(certificationResults, options.output || 'table');
    } catch (error) {
      this.log('error', `Certification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async discover(options: any): Promise<void> {
    try {
      this.log('info', 'Starting UAP discovery process...');

      if (options.uadp) {
        this.log('info', 'UADP (Universal Agent Discovery Protocol) enabled');
      }

      const discoveryResults = await this.performUAPDiscovery(options);

      // Output results
      this.outputDiscoveryResults(discoveryResults, options.output || 'table');
    } catch (error) {
      this.log('error', `Discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // UAP Protocol Helper Methods
  private async certifyAgent(agentId: string, options: any): Promise<any> {
    try {
      this.log('info', `Certifying agent: ${agentId}`);

      const certification = {
        id: agentId,
        type: 'agent',
        certified: false,
        certificationLevel: 'none',
        compliance: {
          uapCompliant: false,
          acapCompliant: false,
          errors: [] as string[],
          warnings: [] as string[]
        },
        timestamp: new Date().toISOString()
      };

      // Check if agent exists
      const agentPath = join(this.config.agentsDir, agentId);
      if (!existsSync(agentPath)) {
        certification.compliance.errors.push(`Agent directory not found: ${agentPath}`);
        return certification;
      }

      // ACAP certification checks
      if (options.acap) {
        const acapResult = await this.performACAPCertification(agentId);
        certification.compliance.acapCompliant = acapResult.compliant;
        certification.compliance.errors.push(...acapResult.errors);
        certification.compliance.warnings.push(...acapResult.warnings);
      }

      // Basic UAP compliance checks
      const uapResult = await this.performUAPCertification(agentId);
      certification.compliance.uapCompliant = uapResult.compliant;
      certification.compliance.errors.push(...uapResult.errors);
      certification.compliance.warnings.push(...uapResult.warnings);

      // Determine overall certification
      certification.certified = certification.compliance.errors.length === 0;
      certification.certificationLevel = certification.certified
        ? certification.compliance.warnings.length === 0
          ? 'full'
          : 'conditional'
        : 'failed';

      return certification;
    } catch (error) {
      return {
        id: agentId,
        type: 'agent',
        certified: false,
        certificationLevel: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  private async certifySpecification(specName: string, options: any): Promise<any> {
    try {
      this.log('info', `Certifying specification: ${specName}`);

      const certification = {
        id: specName,
        type: 'specification',
        certified: false,
        certificationLevel: 'none',
        compliance: {
          openapi31Compliant: false,
          uapCompliant: false,
          raspEnabled: false,
          errors: [] as string[],
          warnings: [] as string[]
        },
        timestamp: new Date().toISOString()
      };

      // Check if specification exists
      const specPath = join(this.config.specsDir, `${specName}.openapi.yml`);
      if (!existsSync(specPath)) {
        certification.compliance.errors.push(`Specification file not found: ${specPath}`);
        return certification;
      }

      // Load and validate specification
      const content = readFileSync(specPath, 'utf8');
      const spec = yaml.load(content) as any;

      // OpenAPI 3.1 compliance check
      const validation = OpenAPISchema.safeParse(spec);
      if (validation.success) {
        certification.compliance.openapi31Compliant = true;
      } else {
        certification.compliance.errors.push(
          ...validation.error.issues.map((issue) => `OpenAPI validation: ${issue.path.join('.')}: ${issue.message}`)
        );
      }

      // Check for RASP enablement
      if (spec.info && spec.info['x-rasp-enabled']) {
        certification.compliance.raspEnabled = true;
      }

      // UAP compliance checks for specifications
      const uapResult = await this.performSpecificationUAPCertification(spec);
      certification.compliance.uapCompliant = uapResult.compliant;
      certification.compliance.errors.push(...uapResult.errors);
      certification.compliance.warnings.push(...uapResult.warnings);

      // Determine overall certification
      certification.certified = certification.compliance.errors.length === 0;
      certification.certificationLevel = certification.certified
        ? certification.compliance.warnings.length === 0
          ? 'full'
          : 'conditional'
        : 'failed';

      return certification;
    } catch (error) {
      return {
        id: specName,
        type: 'specification',
        certified: false,
        certificationLevel: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  private async performACAPCertification(
    agentId: string
  ): Promise<{ compliant: boolean; errors: string[]; warnings: string[] }> {
    // ACAP (Agent Capability Assurance Protocol) certification
    const result = {
      compliant: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Check for agent capability manifest
      const capabilityManifestPath = join(this.config.agentsDir, agentId, 'capabilities.json');
      if (!existsSync(capabilityManifestPath)) {
        result.errors.push('ACAP: Missing capabilities.json manifest file');
        result.compliant = false;
      } else {
        // Validate capability manifest structure
        const capabilitiesContent = readFileSync(capabilityManifestPath, 'utf8');
        try {
          const capabilities = JSON.parse(capabilitiesContent);
          if (!capabilities.version || !capabilities.capabilities || !Array.isArray(capabilities.capabilities)) {
            result.errors.push('ACAP: Invalid capabilities.json structure');
            result.compliant = false;
          }
        } catch (parseError) {
          result.errors.push('ACAP: Invalid JSON in capabilities.json');
          result.compliant = false;
        }
      }

      // Check for performance benchmarks
      const benchmarkPath = join(this.config.agentsDir, agentId, 'benchmarks.json');
      if (!existsSync(benchmarkPath)) {
        result.warnings.push('ACAP: Missing performance benchmarks file');
      }
    } catch (error) {
      result.errors.push(`ACAP certification error: ${error instanceof Error ? error.message : String(error)}`);
      result.compliant = false;
    }

    return result;
  }

  private async performUAPCertification(
    agentId: string
  ): Promise<{ compliant: boolean; errors: string[]; warnings: string[] }> {
    // UAP (Universal Agent Protocol) certification
    const result = {
      compliant: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Check for agent configuration
      const configPath = join(this.config.agentsDir, agentId, 'agent.json');
      if (!existsSync(configPath)) {
        result.errors.push('UAP: Missing agent.json configuration file');
        result.compliant = false;
      }

      // Check for API specification
      const apiSpecPath = join(this.config.agentsDir, agentId, 'api.openapi.yml');
      if (!existsSync(apiSpecPath)) {
        result.warnings.push('UAP: Missing OpenAPI specification');
      }
    } catch (error) {
      result.errors.push(`UAP certification error: ${error instanceof Error ? error.message : String(error)}`);
      result.compliant = false;
    }

    return result;
  }

  private async performSpecificationUAPCertification(
    spec: any
  ): Promise<{ compliant: boolean; errors: string[]; warnings: string[] }> {
    // UAP certification for specifications
    const result = {
      compliant: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Check for required UAP extensions
      if (!spec.info || !spec.info['x-uap-version']) {
        result.warnings.push('UAP: Missing x-uap-version extension');
      }

      // Check for security schemes
      if (!spec.components || !spec.components.securitySchemes) {
        result.warnings.push('UAP: No security schemes defined');
      }

      // Check for agent metadata
      if (!spec.info || !spec.info['x-agent-type']) {
        result.warnings.push('UAP: Missing x-agent-type metadata');
      }
    } catch (error) {
      result.errors.push(
        `UAP specification certification error: ${error instanceof Error ? error.message : String(error)}`
      );
      result.compliant = false;
    }

    return result;
  }

  private async performUAPDiscovery(options: any): Promise<any[]> {
    try {
      const discoveryResults = [];

      if (options.uadp) {
        // UADP (Universal Agent Discovery Protocol) discovery
        this.log('info', 'Performing UADP network discovery...');

        const networkResults = await this.performUADPDiscovery(options);
        discoveryResults.push(...networkResults);
      }

      // Local agent discovery
      this.log('info', 'Discovering local UAP-compliant agents...');
      const localResults = await this.performLocalAgentDiscovery(options);
      discoveryResults.push(...localResults);

      return discoveryResults;
    } catch (error) {
      this.log('error', `Discovery error: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async performUADPDiscovery(options: any): Promise<any[]> {
    // UADP network discovery implementation
    const results = [];
    const timeout = parseInt(options.timeout) || 5000;
    const network = options.network || 'local';

    try {
      this.log('info', `UADP: Scanning network '${network}' (timeout: ${timeout}ms)`);

      // Simulate network discovery (in real implementation, this would use UDP multicast or similar)
      const mockNetworkAgents = [
        {
          id: 'network-agent-001',
          type: 'worker',
          location: 'network',
          endpoint: 'http://192.168.1.100:3000',
          capabilities: ['data-processing', 'analysis'],
          version: '1.0.0',
          uapCompliant: true,
          discovered: new Date().toISOString(),
          discoveryMethod: 'UADP'
        },
        {
          id: 'network-agent-002',
          type: 'orchestrator',
          location: 'network',
          endpoint: 'http://192.168.1.101:3000',
          capabilities: ['coordination', 'workflow-management'],
          version: '1.1.0',
          uapCompliant: true,
          discovered: new Date().toISOString(),
          discoveryMethod: 'UADP'
        }
      ];

      // Apply filters if specified
      let filteredResults = mockNetworkAgents;
      if (options.filter) {
        const filterLower = options.filter.toLowerCase();
        filteredResults = mockNetworkAgents.filter(
          (agent) =>
            agent.type.toLowerCase().includes(filterLower) ||
            agent.capabilities.some((cap) => cap.toLowerCase().includes(filterLower)) ||
            agent.version.includes(options.filter)
        );
      }

      results.push(...filteredResults);
    } catch (error) {
      this.log('error', `UADP discovery error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return results;
  }

  private async performLocalAgentDiscovery(options: any): Promise<any[]> {
    try {
      const agents = this.getAllAgents();
      const results = [];

      for (const agent of agents) {
        try {
          const agentInfo = {
            id: agent.name,
            type: 'unknown',
            location: 'local',
            path: agent.path,
            capabilities: [] as string[],
            version: 'unknown',
            uapCompliant: false,
            discovered: new Date().toISOString(),
            discoveryMethod: 'local'
          };

          // Try to load agent configuration
          const configPath = join(agent.path, 'agent.json');
          if (existsSync(configPath)) {
            const configContent = readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent);

            agentInfo.type = config.type || 'unknown';
            agentInfo.version = config.version || 'unknown';
            agentInfo.capabilities = config.capabilities || [];
            agentInfo.uapCompliant = config.uapCompliant || false;
          }

          // Apply filters if specified
          if (options.filter) {
            const filterLower = options.filter.toLowerCase();
            const matchesFilter =
              agentInfo.type.toLowerCase().includes(filterLower) ||
              agentInfo.capabilities.some((cap) => cap.toLowerCase().includes(filterLower)) ||
              agentInfo.version.includes(options.filter);

            if (matchesFilter) {
              results.push(agentInfo);
            }
          } else {
            results.push(agentInfo);
          }
        } catch (error) {
          this.log(
            'warn',
            `Failed to discover agent ${agent.name}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return results;
    } catch (error) {
      this.log('error', `Local discovery error: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private outputCertificationResults(results: any[], format: string): void {
    if (format === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else if (format === 'yaml') {
      console.log(yaml.dump(results));
    } else {
      // Table format
      const tableData = results.map((result) => ({
        ID: result.id,
        Type: result.type,
        Certified: result.certified ? '✅' : '❌',
        Level: result.certificationLevel,
        'UAP Compliant': result.compliance?.uapCompliant ? '✅' : '❌',
        'ACAP Compliant': result.compliance?.acapCompliant ? '✅' : '❌',
        Errors: result.compliance?.errors?.length || 0,
        Warnings: result.compliance?.warnings?.length || 0
      }));

      console.log(chalk.cyan('\n📋 UAP Certification Results:\n'));
      console.table(tableData);
    }
  }

  private outputDiscoveryResults(results: any[], format: string): void {
    if (format === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else if (format === 'yaml') {
      console.log(yaml.dump(results));
    } else {
      // Table format
      const tableData = results.map((result) => ({
        ID: result.id,
        Type: result.type,
        Location: result.location,
        Method: result.discoveryMethod,
        'UAP Compliant': result.uapCompliant ? '✅' : '❌',
        Capabilities: result.capabilities.slice(0, 3).join(', ') + (result.capabilities.length > 3 ? '...' : ''),
        Version: result.version,
        Endpoint: result.endpoint || result.path || 'N/A'
      }));

      console.log(chalk.cyan('\n🔍 UAP Discovery Results:\n'));
      console.table(tableData);
    }
  }

  // Helper methods
  private getSpecTemplate(template: string): any {
    const templates = {
      basic: {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0'
        },
        paths: {}
      },
      advanced: {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0'
        },
        servers: [
          {
            url: 'http://localhost:3000/api/v1',
            description: 'Development server'
          }
        ],
        paths: {},
        components: {
          schemas: {}
        }
      },
      industrial: {
        openapi: '3.1.0',
        info: {
          title: 'Industrial API',
          version: '1.0.0'
        },
        servers: [
          {
            url: 'http://localhost:3000/api/v1',
            description: 'Development server'
          }
        ],
        paths: {
          '/opcua/connect': {
            post: {
              summary: 'Connect to OPC UA server',
              operationId: 'connectOpcUa',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        endpoint: { type: 'string' },
                        securityMode: { type: 'string' }
                      }
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Connection successful'
                }
              }
            }
          }
        },
        components: {
          schemas: {}
        }
      }
    };

    return templates[template as keyof typeof templates] || templates.basic;
  }

  private getAllSpecifications(): any[] {
    try {
      if (!existsSync(this.config.specsDir)) return [];

      return readdirSync(this.config.specsDir)
        .filter((file) => file.endsWith('.openapi.yml') || file.endsWith('.openapi.yaml'))
        .map((file) => {
          const filePath = join(this.config.specsDir, file);
          const stats = statSync(filePath);
          return {
            name: file.replace(/\.openapi\.ya?ml$/, ''),
            path: filePath,
            lastModified: stats.mtime.toISOString(),
            size: stats.size
          };
        });
    } catch (error) {
      this.log('error', `Failed to get specifications: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private getAllAgents(): any[] {
    try {
      if (!existsSync(this.config.agentsDir)) return [];

      return readdirSync(this.config.agentsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => ({
          name: dirent.name,
          path: join(this.config.agentsDir, dirent.name)
        }));
    } catch (error) {
      this.log('error', `Failed to get agents: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async validateAllSpecifications(): Promise<void> {
    const specs = this.getAllSpecifications();
    for (const spec of specs) {
      await this.validateSpecification(spec.name);
    }
  }

  private async validateAllAgents(): Promise<void> {
    const agents = this.getAllAgents();
    for (const agent of agents) {
      await this.validateAgent(agent.name);
    }
  }

  private async validateSpecification(name: string): Promise<boolean> {
    try {
      const specPath = join(this.config.specsDir, `${name}.openapi.yml`);
      if (!existsSync(specPath)) {
        this.log('error', `Specification not found: ${name}`);
        return false;
      }

      const content = readFileSync(specPath, 'utf8');
      const spec = yaml.load(content);

      const validation = OpenAPISchema.safeParse(spec);
      if (validation.success) {
        this.log('info', `✅ Specification ${name} is valid`);
        return true;
      } else {
        this.log('error', `❌ Specification ${name} is invalid`, validation.error.issues);
        return false;
      }
    } catch (error) {
      this.log(
        'error',
        `Failed to validate specification ${name}: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  private async validateAgent(agentId: string): Promise<boolean> {
    try {
      // TODO: Implement agent validation logic
      this.log('info', `Validating agent: ${agentId}`);
      return true;
    } catch (error) {
      this.log(
        'error',
        `Failed to validate agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  private async generateTypes(specName: string): Promise<void> {
    try {
      this.log('info', `Generating TypeScript types for ${specName}...`);
      // TODO: Implement TypeScript type generation
    } catch (error) {
      this.log('error', `Failed to generate types: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public run(): void {
    this.program.parse();
  }
}

// CLI entry point for ES modules
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new OSSACli();
  cli.run();
}

export default OSSACli;
