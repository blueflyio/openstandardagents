/**
 * OSSA Agents.md Command
 * Generate, validate, and sync OpenAI agents.md files from OSSA manifests
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { AgentsMdService } from '../../services/agents-md/agents-md.service.js';
import type { OssaAgent } from '../../types/index.js';
import { handleCommandError } from '../utils/index.js';

export const agentsMdCommand = new Command('agents-md').description(
  'Generate, validate, and sync OpenAI agents.md files from OSSA manifests'
);

// Generate subcommand
agentsMdCommand
  .command('generate')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('-o, --output <path>', 'Output path for AGENTS.md', 'AGENTS.md')
  .option('-v, --verbose', 'Verbose output')
  .description('Generate AGENTS.md from OSSA manifest')
  .action(async (manifestPath: string, options: { output: string; verbose?: boolean }) => {
    try {
      console.log(chalk.blue(`Generating AGENTS.md from ${manifestPath}...`));

      // Get services
      const manifestRepo = container.get(ManifestRepository);
      const agentsMdService = container.get(AgentsMdService);

      // Load manifest
      const manifest = (await manifestRepo.load(manifestPath)) as OssaAgent;

      // Check if agents_md extension is enabled
      if (!manifest.extensions?.agents_md?.enabled) {
        console.error(chalk.red('Error: agents_md extension is not enabled in manifest'));
        console.log(chalk.yellow('\n[TIP] Add the following to your manifest to enable:'));
        console.log(
          chalk.gray(`
extensions:
  agents_md:
    enabled: true
    generate: true
    sections:
      dev_environment:
        enabled: true
      testing:
        enabled: true
      pr_instructions:
        enabled: true
`)
        );
        process.exit(1);
      }

      // Generate AGENTS.md
      await agentsMdService.writeAgentsMd(manifest, options.output);

      console.log(chalk.green(`✓ AGENTS.md generated successfully`));
      console.log(chalk.gray(`\nOutput: ${chalk.cyan(options.output)}`));

      if (options.verbose) {
        const content = await agentsMdService.generateAgentsMd(manifest);
        console.log(chalk.gray('\nGenerated content:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(content);
        console.log(chalk.gray('─'.repeat(50)));
      }

      console.log(chalk.yellow('\n[TIP] Next steps:'));
      console.log(chalk.gray(`  1. Review the generated AGENTS.md file`));
      console.log(
        chalk.gray(
          `  2. Validate: ${chalk.white(`ossa agents-md validate ${options.output} ${manifestPath}`)}`
        )
      );
      console.log(chalk.gray(`  3. Commit to your repository for AI coding agents to use`));

      process.exit(0);
    } catch (error) {
      handleCommandError(error);
    }
  });

// Validate subcommand
agentsMdCommand
  .command('validate')
  .argument('<agents-md>', 'Path to AGENTS.md file')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('-v, --verbose', 'Verbose output')
  .description('Validate AGENTS.md against OSSA manifest')
  .action(async (agentsMdPath: string, manifestPath: string, _options: { verbose?: boolean }) => {
    try {
      console.log(chalk.blue(`Validating ${agentsMdPath}...`));

      // Get services
      const manifestRepo = container.get(ManifestRepository);
      const agentsMdService = container.get(AgentsMdService);

      // Load manifest
      const manifest = (await manifestRepo.load(manifestPath)) as OssaAgent;

      // Validate
      const result = await agentsMdService.validateAgentsMd(agentsMdPath, manifest);

      if (result.valid) {
        console.log(chalk.green('✓ AGENTS.md is valid'));
        process.exit(0);
      } else {
        console.log(chalk.yellow('⚠  AGENTS.md has warnings:\n'));
        result.warnings.forEach((warning, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${warning}`));
        });

        console.log(chalk.yellow('\n[TIP] Suggestion:'));
        console.log(
          chalk.gray(
            `  Regenerate AGENTS.md: ${chalk.white(`ossa agents-md generate ${manifestPath} -o ${agentsMdPath}`)}`
          )
        );

        process.exit(1);
      }
    } catch (error) {
      handleCommandError(error);
    }
  });

// Sync subcommand
agentsMdCommand
  .command('sync')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('-w, --watch', 'Watch for manifest changes and auto-sync')
  .option('-v, --verbose', 'Verbose output')
  .description('Sync AGENTS.md with manifest changes')
  .action(async (manifestPath: string, options: { watch?: boolean; verbose?: boolean }) => {
    try {
      console.log(chalk.blue(`Syncing AGENTS.md from ${manifestPath}...`));

      // Get services
      const manifestRepo = container.get(ManifestRepository);
      const agentsMdService = container.get(AgentsMdService);

      // Load manifest
      const manifest = (await manifestRepo.load(manifestPath)) as OssaAgent;

      // Check if sync is enabled
      if (!manifest.extensions?.agents_md?.sync?.on_manifest_change) {
        console.error(chalk.red('Error: Sync on manifest change is not enabled'));
        console.log(chalk.yellow('\n[TIP] Add the following to your manifest to enable:'));
        console.log(
          chalk.gray(`
extensions:
  agents_md:
    enabled: true
    sync:
      on_manifest_change: true
`)
        );
        process.exit(1);
      }

      // Sync
      await agentsMdService.syncAgentsMd(manifestPath, options.watch || false);

      console.log(chalk.green('✓ AGENTS.md synced successfully'));

      if (options.watch) {
        console.log(chalk.blue('\n👀 Watching for changes... (Press Ctrl+C to stop)'));
        // Keep process alive for watching
        await new Promise(() => {});
      } else {
        process.exit(0);
      }
    } catch (error) {
      handleCommandError(error);
    }
  });
