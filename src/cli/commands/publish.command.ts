import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { container } from '../../di-container.js';
import { RegistryService } from '../../services/registry.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { OssaAgent } from '../../types/index.js';
import yaml from 'yaml';

export const publishCommand = new Command('publish')
  .description('Publish an OSSA agent to the registry')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option(
    '-v, --version <version>',
    'Version to publish (defaults to manifest version)'
  )
  .option('-r, --registry <path>', 'Registry path (defaults to .ossa-registry)')
  .action(
    async (
      manifestPath: string,
      options: { version?: string; registry?: string }
    ) => {
      try {
        // Load manifest
        const manifestRepo = new ManifestRepository();
        const manifest = (await manifestRepo.load(manifestPath)) as OssaAgent;

        if (!manifest) {
          console.error(chalk.red('Failed to load manifest'));
          process.exit(1);
        }

        // Initialize registry
        const registryService = container.get<RegistryService>(RegistryService);
        if (options.registry) {
          // Create new instance with custom path
          const customRegistry = new RegistryService(options.registry);
          await customRegistry.initialize();

          // Publish
          const entry = await customRegistry.publish({
            manifest,
            version: options.version,
          });

          console.log(
            chalk.green(`\n✓ Published: ${entry.id}@${entry.version}`)
          );
          console.log(chalk.gray(`  Description: ${entry.description}`));
          console.log(chalk.gray(`  Published at: ${entry.published_at}`));
        } else {
          const entry = await registryService.publish({
            manifest,
            version: options.version,
          });

          console.log(
            chalk.green(`\n✓ Published: ${entry.id}@${entry.version}`)
          );
          console.log(chalk.gray(`  Description: ${entry.description}`));
          console.log(chalk.gray(`  Published at: ${entry.published_at}`));
        }

        process.exit(0);
      } catch (error) {
        console.error(
          chalk.red(
            `\n✗ Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );
