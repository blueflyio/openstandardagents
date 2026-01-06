/**
 * OSSA Generate Command - CRUD Operations for Code Generation
 *
 * Subcommands:
 *   ossa generate agent <type>   - Generate agent manifest from template
 *   ossa generate types          - Generate TypeScript types from schema
 *   ossa generate zod            - Generate Zod schemas from schema
 *   ossa generate manifests      - Update apiVersion in all manifests
 *   ossa generate vscode         - Update VSCode extension versions
 *   ossa generate openapi        - Sync OpenAPI spec versions
 *   ossa generate all            - Run all generators
 *   ossa generate list           - List files that would be generated
 *   ossa generate validate       - Check for version drift
 *   ossa generate sync           - Sync all files to current version
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../di-container.js';
import { GenerationService } from '../../services/generation.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { CodegenService, type GeneratorType } from '../../services/codegen/index.js';
import type { AgentTemplate, OssaAgent } from '../../types/index.js';

export const generateCommand = new Command('generate')
  .description('Generate code, types, schemas, and manifests');

// ============================================================================
// Subcommand: generate agent <type>
// ============================================================================
generateCommand
  .command('agent <type>')
  .description('Generate OSSA agent manifest from template')
  .option('-n, --name <name>', 'Agent name', 'My Agent')
  .option('-i, --id <id>', 'Agent ID (auto-generated from name if not provided)')
  .option('-d, --description <desc>', 'Agent description')
  .option('-r, --runtime <type>', 'Runtime type (docker, k8s, local)', 'docker')
  .option('-o, --output <file>', 'Output file path', './agent.ossa.yaml')
  .action(async (type: string, options) => {
    try {
      const generationService = container.get(GenerationService);
      const manifestRepo = container.get(ManifestRepository);

      console.log(chalk.blue(`Generating ${type} agent...`));

      const template: AgentTemplate = {
        id: options.id || options.name,
        name: options.name,
        role: type,
        description: options.description,
        runtimeType: options.runtime,
      };

      const manifest = await generationService.generate(template);
      await manifestRepo.save(options.output, manifest);

      console.log(chalk.green(`✓ Agent manifest generated`));
      console.log(`Saved to: ${chalk.cyan(options.output)}`);
      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: generate types
// ============================================================================
generateCommand
  .command('types')
  .description('Generate TypeScript types from JSON Schema')
  .option('--dry-run', 'Show what would be generated without writing files')
  .action(async (options) => {
    await runGenerator('types', options.dryRun);
  });

// ============================================================================
// Subcommand: generate zod
// ============================================================================
generateCommand
  .command('zod')
  .description('Generate Zod schemas from JSON Schema')
  .option('--dry-run', 'Show what would be generated without writing files')
  .action(async (options) => {
    await runGenerator('zod', options.dryRun);
  });

// ============================================================================
// Subcommand: generate manifests
// ============================================================================
generateCommand
  .command('manifests')
  .description('Update apiVersion in all OSSA manifests (161+ files)')
  .option('--dry-run', 'Show what would be updated without writing files')
  .action(async (options) => {
    await runGenerator('manifests', options.dryRun);
  });

// ============================================================================
// Subcommand: generate vscode
// ============================================================================
generateCommand
  .command('vscode')
  .description('Update versions in VSCode extension files')
  .option('--dry-run', 'Show what would be updated without writing files')
  .action(async (options) => {
    await runGenerator('vscode', options.dryRun);
  });

// ============================================================================
// Subcommand: generate openapi
// ============================================================================
generateCommand
  .command('openapi')
  .description('Sync versions in OpenAPI specification files')
  .option('--dry-run', 'Show what would be updated without writing files')
  .action(async (options) => {
    await runGenerator('openapi', options.dryRun);
  });

// ============================================================================
// Subcommand: generate openapi-zod
// ============================================================================
generateCommand
  .command('openapi-zod')
  .description('Generate Zod schemas from OpenAPI specs (OPENAPI-FIRST)')
  .option('--dry-run', 'Show what would be generated without writing files')
  .action(async (options) => {
    await runGenerator('openapi-zod', options.dryRun);
  });

// ============================================================================
// Subcommand: generate all
// ============================================================================
generateCommand
  .command('all')
  .description('Run ALL generators (types, zod, manifests, vscode, openapi)')
  .option('--dry-run', 'Show what would be generated without writing files')
  .action(async (options) => {
    await runGenerator('all', options.dryRun);
  });

// ============================================================================
// Subcommand: generate list
// ============================================================================
generateCommand
  .command('list [type]')
  .description('List files that would be generated')
  .action(async (type?: string) => {
    try {
      const codegenService = container.get(CodegenService);
      const generatorType = (type || 'all') as GeneratorType;

      console.log(chalk.blue(`Files for generator: ${generatorType}`));
      console.log(chalk.gray('─'.repeat(50)));

      const files = await codegenService.list(generatorType);

      if (files.length === 0) {
        console.log(chalk.yellow('No files found'));
      } else {
        files.forEach(f => console.log(`  ${f}`));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`Total: ${chalk.cyan(files.length)} files`);
      }

      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: generate validate (drift detection)
// ============================================================================
generateCommand
  .command('validate')
  .alias('drift')
  .description('Check for version drift in generated files')
  .action(async () => {
    try {
      const codegenService = container.get(CodegenService);
      const versionInfo = codegenService.getVersionInfo();

      console.log(chalk.blue('Version Drift Detection'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`Current version: ${chalk.cyan(versionInfo.version)}`);
      console.log(`API version: ${chalk.cyan(versionInfo.apiVersion)}`);
      console.log(chalk.gray('─'.repeat(50)));

      const report = await codegenService.validate();

      if (!report.hasDrift) {
        console.log(chalk.green('✓ No version drift detected'));
        process.exit(0);
      }

      console.log(chalk.red(`✗ Version drift detected in ${report.filesWithOldVersion.length} files:`));
      console.log('');

      for (const file of report.filesWithOldVersion) {
        console.log(`  ${chalk.yellow(file.path)}`);
        console.log(`    Found: ${chalk.red(file.foundVersion)} (expected: ${chalk.green(versionInfo.apiVersion)})`);
      }

      console.log('');
      console.log(chalk.yellow('Run `ossa generate sync` to fix version drift'));
      process.exit(1);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: generate sync
// ============================================================================
generateCommand
  .command('sync')
  .description('Sync all files to current version (same as generate all)')
  .option('--dry-run', 'Show what would be synced without writing files')
  .action(async (options) => {
    await runGenerator('all', options.dryRun);
  });

// ============================================================================
// Helper: Run generator
// ============================================================================
async function runGenerator(type: GeneratorType, dryRun = false): Promise<void> {
  try {
    const codegenService = container.get(CodegenService);
    const versionInfo = codegenService.getVersionInfo();

    console.log(chalk.blue(`Running generator: ${type}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Version: ${chalk.cyan(versionInfo.version)}`);
    console.log(`API Version: ${chalk.cyan(versionInfo.apiVersion)}`);
    if (dryRun) {
      console.log(chalk.yellow('Mode: DRY RUN (no files will be written)'));
    }
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');

    const results = await codegenService.generate(type, dryRun);

    let totalUpdated = 0;
    let totalCreated = 0;
    let totalErrors = 0;

    for (const result of results) {
      const status = result.errors.length > 0 ? chalk.red('✗') : chalk.green('✓');
      console.log(`${status} ${result.generator}`);
      console.log(`    Updated: ${chalk.cyan(result.filesUpdated)}`);
      console.log(`    Created: ${chalk.cyan(result.filesCreated)}`);

      if (result.errors.length > 0) {
        console.log(`    Errors: ${chalk.red(result.errors.length)}`);
        result.errors.forEach(e => console.log(`      - ${chalk.red(e)}`));
      }

      totalUpdated += result.filesUpdated;
      totalCreated += result.filesCreated;
      totalErrors += result.errors.length;
    }

    console.log('');
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Total updated: ${chalk.cyan(totalUpdated)}`);
    console.log(`Total created: ${chalk.cyan(totalCreated)}`);

    if (totalErrors > 0) {
      console.log(`Total errors: ${chalk.red(totalErrors)}`);
      process.exit(1);
    }

    console.log(chalk.green('✓ Generation complete'));
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
