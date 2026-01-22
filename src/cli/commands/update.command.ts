import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { container } from '../../di-container.js';
import { RegistryService } from '../../services/registry.service.js';
import yaml from 'yaml';

export const updateCommand = new Command('update')
  .description('Update an installed OSSA agent to the latest version')
  .argument('<agent-id>', 'Agent ID to update')
  .option(
    '-o, --output <path>',
    'Output directory (defaults to current directory)'
  )
  .option('-r, --registry <path>', 'Registry path (defaults to .ossa-registry)')
  .action(
    async (
      agentId: string,
      options: { output?: string; registry?: string }
    ) => {
      try {
        const registryService = options.registry
          ? new RegistryService(options.registry)
          : container.get<RegistryService>(RegistryService);

        await registryService.initialize();

        // Get latest version
        const entry = await registryService.get(agentId);

        if (!entry) {
          console.error(chalk.red(`Agent ${agentId} not found in registry`));
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

        console.log(chalk.green(`\n✓ Updated: ${agentId}@${entry.version}`));
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
