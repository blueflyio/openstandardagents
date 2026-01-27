import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { container } from '../../di-container.js';
import { RegistryService } from '../../services/registry.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import yaml from 'yaml';

export const installCommand = new Command('install')
  .description('Install an OSSA agent from the registry')
  .argument('<agent-id>', 'Agent ID to install')
  .option('-v, --version <version>', 'Version to install (defaults to latest)')
  .option(
    '-o, --output <path>',
    'Output directory (defaults to current directory)'
  )
  .option('-r, --registry <path>', 'Registry path (defaults to .ossa-registry)')
  .action(
    async (
      agentId: string,
      options: { version?: string; output?: string; registry?: string }
    ) => {
      try {
        const registryService = options.registry
          ? new RegistryService(options.registry)
          : container.get<RegistryService>(RegistryService);

        await registryService.initialize();

        const entry = await registryService.get(agentId, options.version);

        if (!entry) {
          console.error(
            chalk.red(
              `Agent ${agentId}${options.version ? `@${options.version}` : ''} not found`
            )
          );
          process.exit(1);
        }

        // Load manifest from registry
        const manifestPath = path.join(
          registryService['agentsPath'],
          agentId,
          entry.version,
          'manifest.yaml'
        );
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = yaml.parse(manifestContent);

        // Save to output directory
        const outputDir = options.output || process.cwd();
        await fs.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, `${agentId}.ossa.yaml`);

        await fs.writeFile(outputPath, yaml.stringify(manifest), 'utf-8');

        console.log(chalk.green(`\n✓ Installed: ${agentId}@${entry.version}`));
        console.log(chalk.gray(`  Location: ${outputPath}`));

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
