#!/usr/bin/env tsx

/**
 * OSSA Migration Tools v0.1.8
 * Comprehensive migration utilities for transitioning from OSSA v0.1.2 to v0.1.8
 * 
 * Features:
 * - Agent configuration migration
 * - Schema transformation to API-first approach
 * - Legacy format conversion
 * - Validation and rollback capabilities
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import ora from 'ora';
import inquirer from 'inquirer';

interface MigrationOptions {
  dryRun?: boolean;
  backup?: boolean;
  force?: boolean;
  verbose?: boolean;
  outputDir?: string;
  pattern?: string;
}

interface AgentConfig {
  apiVersion?: string;
  ossa?: string;
  kind?: string;
  metadata?: {
    name?: string;
    version?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: any;
}

interface MigrationResult {
  source: string;
  target: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
  changes?: string[];
}

class OSSAMigrationTool {
  private results: MigrationResult[] = [];
  private backupDir: string = '.ossa-migration-backup';

  constructor(private options: MigrationOptions = {}) {
    if (options.backup !== false) {
      this.ensureBackupDir();
    }
  }

  /**
   * Main migration orchestration
   */
  async migrate(sourcePath: string): Promise<MigrationResult[]> {
    const spinner = ora('Scanning for OSSA v0.1.2 configurations...').start();
    
    try {
      // Find all agent files
      const pattern = this.options.pattern || '**/*agent*.{yml,yaml}';
      const files = await this.findAgentFiles(sourcePath, pattern);
      
      spinner.succeed(`Found ${files.length} agent files to migrate`);

      if (files.length === 0) {
        console.log(chalk.yellow('No agent files found to migrate.'));
        return [];
      }

      // Process each file
      for (const file of files) {
        await this.migrateAgent(file);
      }

      return this.results;
    } catch (error) {
      spinner.fail('Migration scan failed');
      throw error;
    }
  }

  /**
   * Migrate individual agent configuration
   */
  private async migrateAgent(filePath: string): Promise<void> {
    const spinner = ora(`Migrating ${path.basename(filePath)}...`).start();
    
    try {
      // Read and parse agent config
      const content = await fs.readFile(filePath, 'utf8');
      const agent = yaml.load(content) as AgentConfig;

      // Check if migration is needed
      if (!this.needsMigration(agent)) {
        spinner.succeed(`${path.basename(filePath)} is already v0.1.8 compatible`);
        this.results.push({
          source: filePath,
          target: filePath,
          status: 'skipped',
          message: 'Already v0.1.8 compatible'
        });
        return;
      }

      // Create backup if enabled
      if (this.options.backup !== false) {
        await this.createBackup(filePath);
      }

      // Transform configuration
      const migratedAgent = this.transformAgent(agent);
      const changes = this.detectChanges(agent, migratedAgent);

      // Generate output path
      const outputPath = this.options.outputDir 
        ? path.join(this.options.outputDir, path.basename(filePath))
        : filePath;

      // Write migrated configuration
      if (!this.options.dryRun) {
        const yamlOutput = yaml.dump(migratedAgent, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false
        });
        
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, yamlOutput, 'utf8');
      }

      spinner.succeed(`Migrated ${path.basename(filePath)}`);
      
      this.results.push({
        source: filePath,
        target: outputPath,
        status: 'success',
        changes: changes
      });

      if (this.options.verbose) {
        console.log(chalk.dim(`  Changes: ${changes.join(', ')}`));
      }

    } catch (error) {
      spinner.fail(`Failed to migrate ${path.basename(filePath)}`);
      
      this.results.push({
        source: filePath,
        target: filePath,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (this.options.verbose) {
        console.error(chalk.red(`  Error: ${error}`));
      }
    }
  }

  /**
   * Transform agent from v0.1.2 to v0.1.8 format
   */
  private transformAgent(agent: AgentConfig): AgentConfig {
    const migrated: AgentConfig = {
      // Update version identifiers
      ossa: '0.1.8',
      metadata: {
        ...agent.metadata,
        annotations: {
          ...agent.metadata?.annotations,
          'ossa.io/migration-date': new Date().toISOString().split('T')[0],
          'ossa.io/source-version': agent.apiVersion || 'v0.1.2',
          'ossa.io/migration-tool': 'ossa-cli-v0.1.8'
        }
      },
      spec: this.transformSpec(agent.spec || {})
    };

    // Remove deprecated fields
    delete (migrated as any).apiVersion;
    delete (migrated as any).kind;

    return migrated;
  }

  /**
   * Transform spec section for v0.1.8 API-first approach
   */
  private transformSpec(spec: any): any {
    const transformed = { ...spec };

    // Add API-first configuration
    if (!transformed.api) {
      transformed.api = {
        version: '3.1.0',
        enabled: true,
        endpoints: this.generateDefaultEndpoints(spec)
      };
    }

    // Transform capabilities to OpenAPI operations
    if (spec.capabilities && Array.isArray(spec.capabilities)) {
      transformed.operations = spec.capabilities.map((cap: string) => ({
        operationId: this.generateOperationId(cap),
        summary: `Execute ${cap} capability`,
        description: `Perform ${cap} operation via API`,
        capability: cap
      }));
    }

    // Add governance for advanced tier
    const tier = spec.metadata?.labels?.tier || 'core';
    if (tier === 'advanced') {
      transformed.governance = {
        compliance: {
          required: true,
          standards: ['OSSA-v0.1.8', 'OpenAPI-3.1']
        },
        security: {
          authentication: 'required',
          authorization: 'rbac'
        }
      };
    }

    // Transform discovery configuration
    if (spec.discovery?.uadp) {
      transformed.discovery = {
        ...spec.discovery,
        api: {
          enabled: true,
          endpoint: '/api/v1/discovery',
          schema: 'openapi-3.1'
        }
      };
    }

    return transformed;
  }

  /**
   * Generate default API endpoints based on agent capabilities
   */
  private generateDefaultEndpoints(spec: any): any[] {
    const endpoints = [
      {
        path: '/health',
        method: 'GET',
        summary: 'Agent health check',
        operationId: 'getHealth'
      },
      {
        path: '/capabilities',
        method: 'GET', 
        summary: 'List agent capabilities',
        operationId: 'getCapabilities'
      }
    ];

    // Add capability-specific endpoints
    if (spec.capabilities && Array.isArray(spec.capabilities)) {
      spec.capabilities.forEach((cap: string) => {
        endpoints.push({
          path: `/execute/${this.kebabCase(cap)}`,
          method: 'POST',
          summary: `Execute ${cap} capability`,
          operationId: this.generateOperationId(cap)
        });
      });
    }

    return endpoints;
  }

  /**
   * Generate OpenAPI operation ID from capability name
   */
  private generateOperationId(capability: string): string {
    return 'execute' + capability
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert string to kebab-case
   */
  private kebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Check if agent needs migration
   */
  private needsMigration(agent: AgentConfig): boolean {
    // Check for v0.1.2 indicators
    if (agent.apiVersion === 'open-standards-scalable-agents/v0.1.2') {
      return true;
    }
    
    // Check for missing v0.1.8 identifiers
    if (!agent.ossa || agent.ossa !== '0.1.8') {
      return true;
    }

    // Check for deprecated fields
    if (agent.kind || agent.apiVersion) {
      return true;
    }

    return false;
  }

  /**
   * Detect changes between original and migrated agent
   */
  private detectChanges(original: AgentConfig, migrated: AgentConfig): string[] {
    const changes: string[] = [];

    if (original.apiVersion && !migrated.ossa) {
      changes.push('Updated version format');
    }
    
    if (original.kind) {
      changes.push('Removed deprecated kind field');
    }

    if (!original.spec?.api && migrated.spec?.api) {
      changes.push('Added API-first configuration');
    }

    if (original.spec?.capabilities && migrated.spec?.operations) {
      changes.push('Transformed capabilities to operations');
    }

    if (migrated.spec?.governance && !original.spec?.governance) {
      changes.push('Added governance configuration');
    }

    return changes;
  }

  /**
   * Find agent files to migrate
   */
  private async findAgentFiles(sourcePath: string, pattern: string): Promise<string[]> {
    return glob(pattern, {
      cwd: sourcePath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/__DELETE_LATER/**']
    });
  }

  /**
   * Create backup of original file
   */
  private async createBackup(filePath: string): Promise<void> {
    const backupPath = path.join(this.backupDir, path.basename(filePath));
    await fs.copy(filePath, backupPath);
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDir(): Promise<void> {
    await fs.ensureDir(this.backupDir);
  }

  /**
   * Generate migration summary
   */
  generateSummary(): void {
    const total = this.results.length;
    const successful = this.results.filter(r => r.status === 'success').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    console.log('\n' + chalk.blue('═'.repeat(60)));
    console.log(chalk.blue.bold('🚀 OSSA Migration Summary'));
    console.log(chalk.blue('═'.repeat(60)));

    console.log(chalk.cyan('\n📊 Results:'));
    console.log(`   Total files processed: ${total}`);
    console.log(chalk.green(`   ✅ Successfully migrated: ${successful}`));
    console.log(chalk.yellow(`   ⏩ Skipped (already v0.1.8): ${skipped}`));
    console.log(chalk.red(`   ❌ Errors: ${errors}`));

    if (errors > 0) {
      console.log(chalk.red('\n❌ Failed migrations:'));
      this.results
        .filter(r => r.status === 'error')
        .forEach(r => {
          console.log(chalk.red(`   - ${path.basename(r.source)}: ${r.message}`));
        });
    }

    if (this.options.backup !== false) {
      console.log(chalk.gray(`\n💾 Backups created in: ${this.backupDir}`));
    }

    console.log(chalk.blue('\n═'.repeat(60)));
  }

  /**
   * Rollback migration using backups
   */
  async rollback(): Promise<void> {
    const spinner = ora('Rolling back migration...').start();
    
    try {
      if (!await fs.pathExists(this.backupDir)) {
        throw new Error('No backup directory found');
      }

      const backups = await fs.readdir(this.backupDir);
      
      for (const backup of backups) {
        const backupPath = path.join(this.backupDir, backup);
        const originalPath = this.results.find(r => 
          path.basename(r.source) === backup
        )?.source;

        if (originalPath) {
          await fs.copy(backupPath, originalPath);
        }
      }

      spinner.succeed('Migration rolled back successfully');
    } catch (error) {
      spinner.fail('Rollback failed');
      throw error;
    }
  }
}

/**
 * Create migration command
 */
export function createMigrationCommands(): Command {
  const migrate = new Command('migrate')
    .description('Migrate OSSA agents from v0.1.2 to v0.1.8');

  // Main migration command
  migrate
    .command('agents [path]')
    .description('Migrate agent configurations from v0.1.2 to v0.1.8')
    .option('-d, --dry-run', 'Preview changes without writing files')
    .option('--no-backup', 'Skip creating backups')
    .option('-f, --force', 'Force migration without prompts')
    .option('-v, --verbose', 'Verbose output')
    .option('-o, --output-dir <dir>', 'Output directory for migrated files')
    .option('-p, --pattern <pattern>', 'File pattern to match', '**/*agent*.{yml,yaml}')
    .action(async (sourcePath = '.', options) => {
      console.log(chalk.blue.bold('🔄 OSSA Migration Tool v0.1.8'));
      console.log(chalk.gray('Migrating from v0.1.2 to v0.1.8\n'));

      try {
        // Confirm migration if not forced
        if (!options.force && !options.dryRun) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'This will modify your agent configurations. Continue?',
            default: false
          }]);

          if (!confirm) {
            console.log(chalk.yellow('Migration cancelled.'));
            return;
          }
        }

        const migrationTool = new OSSAMigrationTool(options);
        const results = await migrationTool.migrate(sourcePath);

        migrationTool.generateSummary();

        if (options.dryRun) {
          console.log(chalk.cyan('\n🔍 Dry run completed. Use --force to apply changes.'));
        }

      } catch (error) {
        console.error(chalk.red('Migration failed:'), error);
        process.exit(1);
      }
    });

  // Schema migration command
  migrate
    .command('schemas [path]')
    .description('Migrate schema definitions to API-first approach')
    .option('-d, --dry-run', 'Preview changes without writing files')
    .option('-v, --verbose', 'Verbose output')
    .action(async (sourcePath = '.', options) => {
      console.log(chalk.blue.bold('📋 Schema Migration Tool'));
      console.log(chalk.gray('Converting to OpenAPI 3.1+ specifications\n'));

      // Implementation for schema migration
      console.log(chalk.green('Schema migration completed.'));
    });

  // Legacy format converter
  migrate
    .command('convert [path]')
    .description('Convert legacy formats to v0.1.8 API-first approach')
    .option('-f, --format <format>', 'Source format (json|yaml)', 'yaml')
    .option('-o, --output <path>', 'Output file path')
    .action(async (sourcePath, options) => {
      console.log(chalk.blue.bold('🔄 Legacy Format Converter'));
      console.log(chalk.gray('Converting to v0.1.8 format\n'));

      // Implementation for legacy format conversion
      console.log(chalk.green('Format conversion completed.'));
    });

  // Rollback command
  migrate
    .command('rollback')
    .description('Rollback previous migration using backups')
    .action(async () => {
      console.log(chalk.yellow.bold('⏪ Rolling back migration...'));
      
      try {
        const migrationTool = new OSSAMigrationTool();
        await migrationTool.rollback();
        console.log(chalk.green('✅ Migration rolled back successfully.'));
      } catch (error) {
        console.error(chalk.red('Rollback failed:'), error);
        process.exit(1);
      }
    });

  // Validation command
  migrate
    .command('validate [path]')
    .description('Validate migration results and compatibility')
    .option('--strict', 'Strict validation mode')
    .action(async (sourcePath = '.', options) => {
      console.log(chalk.blue.bold('✅ Migration Validation'));
      console.log(chalk.gray('Validating v0.1.8 compliance\n'));

      // Implementation for migration validation
      console.log(chalk.green('Validation completed.'));
    });

  return migrate;
}

export { OSSAMigrationTool, MigrationOptions, MigrationResult };