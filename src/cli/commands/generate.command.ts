/**
 * OSSA Generate Command
 * Generate OSSA agent manifest from template
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../di-container';
import { GenerationService } from '../../services/generation.service';
import { ManifestRepository } from '../../repositories/manifest.repository';
import type { AgentTemplate } from '../../types/index';

export const generateCommand = new Command('generate')
  .argument(
    '<type>',
    'Agent role type (chat, workflow, compliance, audit, monitoring, etc.)'
  )
  .option('-n, --name <name>', 'Agent name', 'My Agent')
  .option(
    '-i, --id <id>',
    'Agent ID (auto-generated from name if not provided)'
  )
  .option('-d, --description <desc>', 'Agent description')
  .option('-r, --runtime <type>', 'Runtime type (docker, k8s, local)', 'docker')
  .option('-o, --output <file>', 'Output file path', './agent.ossa.yaml')
  .description('Generate OSSA agent manifest from template')
  .action(
    async (
      type: string,
      options: {
        name: string;
        id?: string;
        description?: string;
        runtime: string;
        output: string;
      }
    ) => {
      try {
        // Get services
        const generationService = container.get(GenerationService);
        const manifestRepo = container.get(ManifestRepository);

        console.log(chalk.blue(`Generating ${type} agent...`));

        // Create template
        const template: AgentTemplate = {
          id: options.id || options.name,
          name: options.name,
          role: type,
          description: options.description,
          runtimeType: options.runtime,
        };

        // Generate manifest
        const manifest = await generationService.generate(template);

        // Save to file
        await manifestRepo.save(options.output, manifest);

        console.log(chalk.green(`✓ Agent manifest generated successfully`));
        console.log(chalk.gray(`\nGenerated Agent:`));
        console.log(`  ID: ${chalk.cyan(manifest.agent.id)}`);
        console.log(`  Name: ${chalk.cyan(manifest.agent.name)}`);
        console.log(`  Role: ${chalk.cyan(manifest.agent.role)}`);
        console.log(`  Runtime: ${chalk.cyan(manifest.agent.runtime.type)}`);
        console.log(
          `  Capabilities: ${chalk.cyan(manifest.agent.capabilities.length)}`
        );
        console.log(`\nSaved to: ${chalk.cyan(options.output)}`);

        console.log(chalk.yellow('\n💡 Next steps:'));
        console.log(
          chalk.gray('  1. Review and customize the generated manifest')
        );
        console.log(
          chalk.gray(
            `  2. Validate: ${chalk.white(`ossa validate ${options.output}`)}`
          )
        );
        console.log(
          chalk.gray(
            `  3. Deploy: ${chalk.white(`buildkit agents deploy ${options.output}`)}`
          )
        );

        process.exit(0);
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );
