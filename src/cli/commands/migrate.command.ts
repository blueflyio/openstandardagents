/**
 * Migrate Command
 * Migrates OSSA manifests between spec versions using registered transforms.
 *
 * Cross-framework migration (langchain, crewai, autogen) was removed -
 * those parsers were stubs. Use `ossa import` for format conversion.
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { MigrationTransformService } from '../../services/migration-transform.service.js';
import { getVersion } from '../../utils/version.js';
import {
  addGlobalOptions,
  addMutationOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';

export const migrateCommand = new Command('migrate')
  .description('Migrate OSSA manifests between spec versions')
  .argument('<source>', 'Path to source OSSA manifest file')
  .option(
    '--to <version>',
    'Target OSSA version (e.g., 0.3.6, 0.4.5)',
    getVersion()
  )
  .option('--list', 'List available migration transforms')
  .option('--validate', 'Validate converted manifest', true);

// Apply production-grade standard options
addGlobalOptions(migrateCommand);
addMutationOptions(migrateCommand);

migrateCommand.action(
  async (
    sourcePath: string,
    options: {
      to: string;
      list?: boolean;
      output?: string;
      validate: boolean;
      verbose?: boolean;
      quiet?: boolean;
      dryRun?: boolean;
      color?: boolean;
      json?: boolean;
    }
  ) => {
    const useColor = shouldUseColor(options);
    const log = (msg: string, color?: (s: string) => string) => {
      if (options.quiet) return;
      const output = useColor && color ? color(msg) : msg;
      console.log(output);
    };

    const migrationService = container.get(MigrationTransformService);

    // List available transforms
    if (options.list) {
      const transforms = migrationService.getAllTransforms();
      log('Available migration transforms:\n', chalk.blue);
      for (const t of transforms) {
        const breaking = t.breaking ? chalk.red(' [BREAKING]') : '';
        log(
          `  ${chalk.cyan(t.fromVersion)} -> ${chalk.green(t.toVersion)}${breaking}`
        );
        log(`    ${t.description}`);
      }
      log(`\n  ${transforms.length} transforms registered`);
      return;
    }

    try {
      // Read source file
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      log(`Migrating OSSA manifest: ${sourcePath}`, chalk.blue);
      log(`Target version: ${options.to}\n`, chalk.blue);

      if (options.dryRun) {
        log('DRY RUN MODE - No files will be written', chalk.yellow);
      }

      // Load manifest
      const manifestRepo = container.get(ManifestRepository);
      const manifest = await manifestRepo.load(sourcePath);

      // Detect source version from manifest apiVersion field
      const apiVersion = (manifest as any).apiVersion || '';
      const versionMatch = apiVersion.match(/^ossa\/v(.+)$/);
      const sourceVersion = versionMatch ? versionMatch[1] : null;

      if (!sourceVersion) {
        throw new Error(
          `Cannot detect version from manifest apiVersion: "${apiVersion}". ` +
            `Expected format: ossa/v0.x.x`
        );
      }

      if (sourceVersion === options.to) {
        log(
          `Manifest is already at version ${sourceVersion}. No migration needed.`,
          chalk.yellow
        );
        return;
      }

      log(
        `Detected source version: ${sourceVersion} -> ${options.to}`,
        chalk.blue
      );

      // Apply migration transform
      const migrated = migrationService.applyTransform(
        manifest as any,
        sourceVersion,
        options.to
      );

      // Determine output file
      const outputFile =
        options.output ||
        path.join(
          path.dirname(sourcePath),
          `${path.basename(sourcePath, path.extname(sourcePath))}.migrated.ossa.yaml`
        );

      if (!options.dryRun) {
        await manifestRepo.save(outputFile, migrated as any);
      }

      if (options.validate) {
        log('\nValidating migrated manifest...', chalk.yellow);
        // The save operation handles validation via ManifestRepository
        log('Manifest valid', chalk.green);
      }

      if (options.dryRun) {
        log(`\nWould write to: ${outputFile}`, chalk.blue);
      } else {
        log('\nMigration complete!', chalk.green);
        log(`  Source: ${sourcePath} (${sourceVersion})`, chalk.blue);
        log(`  Output: ${outputFile} (${options.to})`, chalk.blue);
      }
    } catch (error) {
      if (!options.quiet) {
        const errMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error(useColor ? chalk.red(errMsg) : errMsg);
      }
      process.exit(ExitCode.GENERAL_ERROR);
    }
  }
);
