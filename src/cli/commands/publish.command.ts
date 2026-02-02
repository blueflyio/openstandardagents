import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { container } from '../../di-container.js';
import { RegistryService } from '../../services/registry.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { OssaAgent } from '../../types/index.js';
import yaml from 'yaml';
import {
  addGlobalOptions,
  addMutationOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';

export const publishCommand = new Command('publish')
  .description('Publish an OSSA agent to the registry')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option(
    '-v, --version <version>',
    'Version to publish (defaults to manifest version)'
  )
  .option('-r, --registry <path>', 'Registry path (defaults to .ossa-registry)');

// Apply production-grade standard options
addGlobalOptions(publishCommand);
addMutationOptions(publishCommand);

publishCommand.action(
    async (
      manifestPath: string,
      options: {
        version?: string;
        registry?: string;
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

      try {
        // Load manifest
        const manifestRepo = new ManifestRepository();
        const manifest = (await manifestRepo.load(manifestPath)) as OssaAgent;

        if (!manifest) {
          if (!options.quiet) {
            const err = 'Failed to load manifest';
            console.error(useColor ? chalk.red(err) : err);
          }
          process.exit(ExitCode.CANNOT_EXECUTE);
        }

        if (options.dryRun) {
          log('🔍 DRY RUN MODE - Not publishing to registry', chalk.yellow);
        }

        // Initialize registry
        const registryService = container.get<RegistryService>(RegistryService);
        if (options.registry) {
          // Create new instance with custom path
          const customRegistry = new RegistryService(options.registry);
          await customRegistry.initialize();

          // Publish
          if (!options.dryRun) {
            const entry = await customRegistry.publish({
              manifest,
              version: options.version,
            });

            log(`\n✓ Published: ${entry.id}@${entry.version}`, chalk.green);
            if (options.verbose) {
              log(`  Description: ${entry.description}`, chalk.gray);
              log(`  Published at: ${entry.published_at}`, chalk.gray);
            }
          } else {
            const id = manifest.metadata?.name || 'unknown';
            const version = options.version || manifest.metadata?.version || 'unknown';
            log(`\nWould publish: ${id}@${version}`, chalk.blue);
          }
        } else {
          if (!options.dryRun) {
            const entry = await registryService.publish({
              manifest,
              version: options.version,
            });

            log(`\n✓ Published: ${entry.id}@${entry.version}`, chalk.green);
            if (options.verbose) {
              log(`  Description: ${entry.description}`, chalk.gray);
              log(`  Published at: ${entry.published_at}`, chalk.gray);
            }
          } else {
            const id = manifest.metadata?.name || 'unknown';
            const version = options.version || manifest.metadata?.version || 'unknown';
            log(`\nWould publish: ${id}@${version}`, chalk.blue);
          }
        }

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        if (!options.quiet) {
          const errMsg = `\n✗ Error: ${error instanceof Error ? error.message : String(error)}`;
          console.error(useColor ? chalk.red(errMsg) : errMsg);
        }
        process.exit(ExitCode.GENERAL_ERROR);
      }
    }
  );
