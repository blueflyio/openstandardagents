/**
 * OSSA Migrate LangChain Command
 * Migrate LangChain agents (Python/TypeScript) to OSSA manifests
 *
 * Supported formats:
 * - Python LangChain (.py)
 * - TypeScript LangChain (.ts, .js)
 * - JSON/YAML config files (.json, .yaml, .yml)
 *
 * Usage:
 *   ossa migrate langchain <source> [options]
 *
 * Options:
 *   -o, --output <path>      Output path for migrated manifest
 *   --report <path>          Save migration report to file
 *   --format <json|yaml>     Report format (default: json)
 *   --validate               Validate generated manifest (default: true)
 *   --dry-run                Preview migration without writing files
 *   -v, --verbose            Verbose output
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LangChainMigrationService } from '../../services/migration/langchain-migration.service.js';
import { ValidationService } from '../../services/validation.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { container } from '../../di-container.js';

interface MigrateLangChainOptions {
  output?: string;
  report?: string;
  format?: 'json' | 'yaml';
  validate?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export const migrateLangchainCommand = new Command('langchain')
  .argument(
    '<source>',
    'Path to LangChain code file (Python/TypeScript) or config (JSON/YAML)'
  )
  .option('-o, --output <path>', 'Output path for migrated manifest')
  .option('--report <path>', 'Save migration report to file')
  .option('--format <format>', 'Report format: json or yaml', 'json')
  .option('--validate', 'Validate generated manifest', true)
  .option('--dry-run', 'Preview migration without writing files')
  .option('-v, --verbose', 'Verbose output')
  .description('Migrate LangChain agents to OSSA manifests')
  .action(async (source: string, options: MigrateLangChainOptions) => {
    try {
      console.log(chalk.blue(`Migrating LangChain agent from ${source}...`));

      // Initialize services
      const migrationService = new LangChainMigrationService();
      const validationService = container.get(ValidationService);
      const manifestRepo = container.get(ManifestRepository);

      // Determine output path
      const outputPath = options.output || generateOutputPath(source);

      // Perform migration
      const { manifest, report } = await migrationService.migrate(
        source,
        outputPath
      );

      // Display migration summary
      console.log(chalk.cyan('\nMigration Summary:'));
      console.log(chalk.gray(`  Source: ${report.sourceFile}`));
      console.log(chalk.gray(`  Format: ${report.sourceFormat}`));
      console.log(chalk.gray(`  Target: ${outputPath}`));
      console.log(chalk.gray(`  Confidence: ${report.confidence}%`));

      // Display detected components
      if (options.verbose) {
        console.log(chalk.cyan('\nDetected Components:'));
        report.components.detected.forEach((comp) => {
          const type = comp.type.toUpperCase();
          const detail =
            comp.agentType || comp.chainType || comp.llmConfig?.model || '';
          console.log(chalk.gray(`  - ${type}: ${detail}`));
        });
      }

      // Display mappings
      console.log(chalk.cyan('\nMappings:'));
      report.components.mapped.forEach((mapping) => {
        const icon =
          mapping.confidence === 'high'
            ? '✓'
            : mapping.confidence === 'medium'
              ? '~'
              : '?';
        const color =
          mapping.confidence === 'high'
            ? chalk.green
            : mapping.confidence === 'medium'
              ? chalk.yellow
              : chalk.red;
        console.log(color(`  ${icon} ${mapping.source} → ${mapping.target}`));
      });

      // Display unmapped features
      if (report.components.unmapped.length > 0) {
        console.log(chalk.yellow('\nUnmapped Features:'));
        report.components.unmapped.forEach((feature) => {
          console.log(chalk.yellow(`  ⚠ ${feature}`));
        });
      }

      // Display warnings
      if (report.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        report.warnings.forEach((warning) => {
          console.log(chalk.yellow(`  ⚠ ${warning}`));
        });
      }

      // Display recommendations
      if (report.recommendations.length > 0) {
        console.log(chalk.cyan('\nRecommendations:'));
        report.recommendations.forEach((rec) => {
          console.log(chalk.gray(`  • ${rec}`));
        });
      }

      // Validate if requested
      if (options.validate) {
        console.log(chalk.blue('\nValidating manifest...'));
        const validationResult = await validationService.validate(
          manifest,
          'current'
        );

        if (!validationResult.valid) {
          console.error(chalk.red('✗ Generated manifest is invalid:'));
          validationResult.errors.forEach((error) => {
            console.error(
              chalk.red(`  - ${error.instancePath}: ${error.message}`)
            );
          });
          process.exit(1);
        }

        console.log(chalk.green('✓ Manifest is valid'));

        if (validationResult.warnings.length > 0) {
          console.log(chalk.yellow('\nValidation Warnings:'));
          validationResult.warnings.forEach((warning) => {
            console.log(chalk.yellow(`  ⚠ ${warning}`));
          });
        }
      }

      // Save files if not dry-run
      if (options.dryRun) {
        console.log(chalk.yellow('\n[DRY RUN] No files written'));
        console.log(chalk.gray('\nGenerated Manifest Preview:'));
        console.log(
          chalk.white(yaml.dump(manifest, { indent: 2, lineWidth: 120 }))
        );
      } else {
        // Save manifest
        await manifestRepo.save(outputPath, manifest);
        console.log(chalk.green(`\n✓ Manifest saved to: ${outputPath}`));

        // Save report if requested
        if (options.report) {
          const reportContent =
            options.format === 'yaml'
              ? yaml.dump(report, { indent: 2, lineWidth: 120 })
              : JSON.stringify(report, null, 2);

          await fs.writeFile(options.report, reportContent, 'utf-8');
          console.log(chalk.green(`✓ Report saved to: ${options.report}`));
        }
      }

      // Display next steps
      console.log(chalk.cyan('\nNext Steps:'));
      console.log(
        chalk.gray(`  1. Review the generated manifest: ${outputPath}`)
      );
      console.log(chalk.gray(`  2. Implement tool functions/endpoints`));
      console.log(chalk.gray(`  3. Test the agent: ossa run ${outputPath}`));

      process.exit(0);
    } catch (error) {
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : String(error)
      );

      if (options.verbose && error instanceof Error) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  });

/**
 * Generate output path from source file
 */
function generateOutputPath(sourcePath: string): string {
  const dir = path.dirname(sourcePath);
  const basename = path.basename(sourcePath, path.extname(sourcePath));
  const outputName = `${basename}.ossa.yaml`;

  // If source has -before suffix, use -after
  if (basename.endsWith('-before')) {
    return path.join(dir, basename.replace('-before', '-after') + '.ossa.yaml');
  }

  return path.join(dir, outputName);
}
