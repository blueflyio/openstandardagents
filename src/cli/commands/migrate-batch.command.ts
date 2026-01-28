/**
 * OSSA Migrate Batch Command
 * Batch migrate OSSA agent manifests across directories
 *
 * Features:
 * - Auto-discover manifests in directories
 * - Dry-run mode for previewing changes
 * - Interactive mode for conflict resolution
 * - Detailed migration reports (console + JSON)
 * - Validation of migrated manifests
 *
 * Usage:
 *   ossa migrate-batch --to v0.3.5 --dir ./agents
 *   ossa migrate-batch --to v0.3.5 --dir ./agents --dry-run
 *   ossa migrate-batch --to v0.3.5 --dir ./agents --interactive
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { MigrationService } from '../../services/migration.service.js';
import { ValidationService } from '../../services/validation.service.js';
import { getVersionInfo } from '../../utils/version.js';
import { discoverManifests } from '../utils/manifest-discovery.js';
import type { DiscoveredManifest } from '../utils/manifest-discovery.js';
import {
  generateReport,
  printReport,
  saveReportToFile,
} from '../utils/migration-reporter.js';
import type { MigrationReport } from '../utils/migration-reporter.js';

// ============================================================================
// Types
// ============================================================================

interface BatchMigrationOptions {
  to: string;
  dir?: string;
  dryRun?: boolean;
  interactive?: boolean;
  validate?: boolean;
  output?: string;
  verbose?: boolean;
}

interface MigrationResult {
  manifest: DiscoveredManifest;
  success: boolean;
  error?: string;
  migratedContent?: unknown;
  validationErrors?: string[];
  skipped?: boolean;
  skipReason?: string;
}

// ============================================================================
// Command
// ============================================================================

export const migrateBatchCommand = new Command('migrate-batch')
  .description('Batch migrate OSSA agent manifests')
  .requiredOption('--to <version>', 'Target OSSA version (e.g., v0.3.5)')
  .option('--dir <path>', 'Directory to scan for manifests', '.')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--interactive', 'Prompt for conflicts and decisions')
  .option('--no-validate', 'Skip validation of migrated manifests')
  .option('-o, --output <path>', 'Output directory for migrated manifests')
  .option('-v, --verbose', 'Verbose output with detailed information')
  .action(async (options: BatchMigrationOptions) => {
    try {
      const startTime = Date.now();

      // Get services
      const migrationService = container.get(MigrationService);
      const manifestRepo = container.get(ManifestRepository);
      const validationService = container.get(ValidationService);

      // Get current version info
      const versionInfo = getVersionInfo();
      const targetVersion = options.to.replace(/^v/, ''); // Remove 'v' prefix if present
      const currentVersion = versionInfo.version;

      console.log(chalk.blue.bold('\nOSSA Batch Migration Tool\n'));
      console.log(
        chalk.gray(`Target Version: ${chalk.white(`v${targetVersion}`)}`)
      );
      console.log(
        chalk.gray(`Scan Directory: ${chalk.white(options.dir || '.')}`)
      );
      console.log(
        chalk.gray(`Dry Run: ${chalk.white(options.dryRun ? 'Yes' : 'No')}`)
      );
      console.log(
        chalk.gray(
          `Interactive: ${chalk.white(options.interactive ? 'Yes' : 'No')}`
        )
      );
      console.log(
        chalk.gray(
          `Validation: ${chalk.white(options.validate !== false ? 'Yes' : 'No')}\n`
        )
      );

      // Discover manifests
      console.log(chalk.cyan('[DISCOVERY] Scanning for OSSA manifests...\n'));
      const discovered = await discoverManifests(options.dir || '.', {
        recursive: true,
        verbose: options.verbose,
      });

      if (discovered.length === 0) {
        console.log(
          chalk.yellow('No OSSA manifests found in the specified directory.')
        );
        process.exit(0);
      }

      console.log(
        chalk.green(
          `\n✓ Found ${discovered.length} manifest${discovered.length !== 1 ? 's' : ''}\n`
        )
      );

      // Show discovered manifests
      if (options.verbose) {
        console.log(chalk.gray('Discovered manifests:'));
        discovered.forEach((m) => {
          console.log(
            chalk.gray(
              `  - ${m.relativePath} (${m.version || 'unknown version'})`
            )
          );
        });
        console.log('');
      }

      // Migrate each manifest
      console.log(chalk.cyan('[MIGRATION] Processing manifests...\n'));
      const results: MigrationResult[] = [];

      for (const manifest of discovered) {
        const result = await migrateSingleManifest(
          manifest,
          targetVersion,
          currentVersion,
          {
            migrationService,
            manifestRepo,
            validationService,
            options,
          }
        );
        results.push(result);
      }

      // Generate report
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const report: MigrationReport = generateReport(results, {
        targetVersion: `v${targetVersion}`,
        dryRun: options.dryRun || false,
        duration,
        directory: options.dir || '.',
      });

      // Print report to console
      console.log('');
      printReport(report);

      // Save JSON report if requested
      if (options.output || !options.dryRun) {
        const reportPath =
          options.output ||
          path.join(
            options.dir || '.',
            `.ossa-migration-report-${Date.now()}.json`
          );
        await saveReportToFile(report, reportPath);
        console.log(
          chalk.gray(`\nReport saved to: ${chalk.white(reportPath)}`)
        );
      }

      // Exit with appropriate code
      const hasErrors = results.some((r) => !r.success && !r.skipped);
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      console.error(
        chalk.red('\n[ERROR] Batch migration failed:'),
        error instanceof Error ? error.message : String(error)
      );
      if (options.verbose && error instanceof Error) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// ============================================================================
// Helper Functions
// ============================================================================

interface MigrationContext {
  migrationService: MigrationService;
  manifestRepo: ManifestRepository;
  validationService: ValidationService;
  options: BatchMigrationOptions;
}

/**
 * Migrate a single manifest file
 */
async function migrateSingleManifest(
  manifest: DiscoveredManifest,
  targetVersion: string,
  currentVersion: string,
  context: MigrationContext
): Promise<MigrationResult> {
  const { migrationService, manifestRepo, validationService, options } =
    context;

  try {
    // Load manifest
    const loadedManifest = await manifestRepo.load(manifest.path);

    // Check if migration is needed
    if (!migrationService.needsMigration(loadedManifest)) {
      console.log(
        chalk.gray(`  ⊙ ${manifest.relativePath} - already at target version`)
      );
      return {
        manifest,
        success: true,
        skipped: true,
        skipReason: 'Already at target version',
      };
    }

    // Interactive prompt if enabled
    if (options.interactive) {
      const shouldMigrate = await promptForMigration(manifest);
      if (!shouldMigrate) {
        console.log(
          chalk.gray(`  ⊙ ${manifest.relativePath} - skipped by user`)
        );
        return {
          manifest,
          success: true,
          skipped: true,
          skipReason: 'Skipped by user',
        };
      }
    }

    // Migrate
    const migrated = await migrationService.migrate(loadedManifest);

    // Validate if enabled
    if (options.validate !== false) {
      const validationResult = await validationService.validate(
        migrated,
        'current'
      );

      if (!validationResult.valid) {
        console.log(
          chalk.red(
            `  ✗ ${manifest.relativePath} - migration produced invalid manifest`
          )
        );
        return {
          manifest,
          success: false,
          error: 'Validation failed',
          validationErrors: validationResult.errors.map(
            (e) => `${e.instancePath}: ${e.message}`
          ),
          migratedContent: migrated,
        };
      }
    }

    // Save migrated manifest (unless dry-run)
    if (!options.dryRun) {
      const outputPath = determineOutputPath(
        manifest.path,
        currentVersion,
        options
      );
      await manifestRepo.save(outputPath, migrated);
      console.log(
        chalk.green(
          `  ✓ ${manifest.relativePath} → ${path.basename(outputPath)}`
        )
      );
    } else {
      console.log(
        chalk.yellow(`  → ${manifest.relativePath} (dry-run - not saved)`)
      );
    }

    return {
      manifest,
      success: true,
      migratedContent: migrated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`  ✗ ${manifest.relativePath} - ${errorMessage}`));
    return {
      manifest,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Determine output path for migrated manifest
 */
function determineOutputPath(
  sourcePath: string,
  targetVersion: string,
  options: BatchMigrationOptions
): string {
  const parsed = path.parse(sourcePath);
  const outputDir = options.output || parsed.dir;

  // Remove existing version suffixes
  let name = parsed.name.replace(/\.v\d+\.\d+\.\d+\.ossa$/, '.ossa');

  // Add new version suffix
  if (name.endsWith('.ossa')) {
    name = name.replace(/\.ossa$/, `.v${targetVersion}.ossa`);
  } else {
    name = `${name}.v${targetVersion}.ossa`;
  }

  return path.join(outputDir, `${name}${parsed.ext}`);
}

/**
 * Prompt user for migration decision (interactive mode)
 */
async function promptForMigration(
  manifest: DiscoveredManifest
): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.yellow(
        `Migrate ${manifest.relativePath} (${manifest.version || 'unknown version'})? (y/n): `
      ),
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    );
  });
}
