/**
 * OSSA Agents.md Command
 * Generate, validate, and sync OpenAI agents.md files from OSSA manifests
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { AgentsMdService } from '../../services/agents-md/agents-md.service.js';
import { AgentsMdDiscoveryService } from '../../services/agents-md/agents-md-discovery.service.js';
import { RepoAgentsMdService } from '../../services/agents-md/repo-agents-md.service.js';
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
  .action(
    async (
      manifestPath: string,
      options: { output: string; verbose?: boolean }
    ) => {
      try {
        console.log(chalk.blue(`Generating AGENTS.md from ${manifestPath}...`));

        // Get services
        const manifestRepo = container.get(ManifestRepository);
        const agentsMdService = container.get(AgentsMdService);

        // Load manifest
        const manifest = await manifestRepo.load(manifestPath);

        // Check if agents_md extension is enabled
        if (!manifest.extensions?.agents_md?.enabled) {
          console.error(
            chalk.red('Error: agents_md extension is not enabled in manifest')
          );
          console.log(
            chalk.yellow(
              '\n[TIP] Add the following to your manifest to enable:'
            )
          );
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
        console.log(
          chalk.gray(
            `  3. Commit to your repository for AI coding agents to use`
          )
        );

        process.exit(0);
      } catch (error) {
        handleCommandError(error);
      }
    }
  );

// Validate subcommand
agentsMdCommand
  .command('validate')
  .argument('<agents-md>', 'Path to AGENTS.md file')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('-v, --verbose', 'Verbose output')
  .description('Validate AGENTS.md against OSSA manifest')
  .action(
    async (
      agentsMdPath: string,
      manifestPath: string,
      _options: { verbose?: boolean }
    ) => {
      try {
        console.log(chalk.blue(`Validating ${agentsMdPath}...`));

        // Get services
        const manifestRepo = container.get(ManifestRepository);
        const agentsMdService = container.get(AgentsMdService);

        // Load manifest
        const manifest = await manifestRepo.load(manifestPath);

        // Validate
        const result = await agentsMdService.validateAgentsMd(
          agentsMdPath,
          manifest
        );

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
    }
  );

// Sync subcommand
agentsMdCommand
  .command('sync')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('-w, --watch', 'Watch for manifest changes and auto-sync')
  .option('-v, --verbose', 'Verbose output')
  .description('Sync AGENTS.md with manifest changes')
  .action(
    async (
      manifestPath: string,
      options: { watch?: boolean; verbose?: boolean }
    ) => {
      try {
        console.log(chalk.blue(`Syncing AGENTS.md from ${manifestPath}...`));

        // Get services
        const manifestRepo = container.get(ManifestRepository);
        const agentsMdService = container.get(AgentsMdService);

        // Load manifest
        const manifest = await manifestRepo.load(manifestPath);

        // Check if sync is enabled
        if (!manifest.extensions?.agents_md?.sync?.on_manifest_change) {
          console.error(
            chalk.red('Error: Sync on manifest change is not enabled')
          );
          console.log(
            chalk.yellow(
              '\n[TIP] Add the following to your manifest to enable:'
            )
          );
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
        await agentsMdService.syncAgentsMd(
          manifestPath,
          options.watch || false
        );

        console.log(chalk.green('✓ AGENTS.md synced successfully'));

        if (options.watch) {
          console.log(
            chalk.blue('\nWatching for changes... (Press Ctrl+C to stop)')
          );
          await new Promise(() => {});
        } else {
          process.exit(0);
        }
      } catch (error) {
        handleCommandError(error);
      }
    }
  );

// Discover subcommand: find all AGENTS.md files and their manifests
agentsMdCommand
  .command('discover')
  .argument('[dir]', 'Workspace directory to scan', process.cwd())
  .option('-v, --verbose', 'Show validation warnings')
  .description(
    'Discover all AGENTS.md files in workspace (.agents/*/ and root) for update and maintenance'
  )
  .action(async (dir: string, options: { verbose?: boolean }) => {
    try {
      const baseDir = dir || process.cwd();
      console.log(chalk.blue(`Discovering AGENTS.md in ${baseDir}...`));

      const discovery = container.get(AgentsMdDiscoveryService);
      const results = await discovery.discover(baseDir);

      if (results.length === 0) {
        console.log(
          chalk.yellow('No AGENTS.md files or .agents/ agents found.')
        );
        console.log(
          chalk.gray(
            'Create agents with the wizard (step 9c) or run ossa agents-md generate <manifest>'
          )
        );
        process.exit(0);
        return;
      }

      console.log(
        chalk.bold(`\nDiscovered ${results.length} AGENTS.md entry(ies):\n`)
      );
      console.log(
        'Path'.padEnd(60) +
          'Agent'.padEnd(24) +
          'Manifest'.padEnd(12) +
          'Status'
      );
      console.log('─'.repeat(100));

      for (const r of results) {
        const relPath =
          r.agentsMdPath.replace(baseDir, '').replace(/^\//, '') || 'AGENTS.md';
        const agent = (r.agentName ?? '-').padEnd(22);
        const hasManifest = r.manifestPath ? 'yes' : 'no ';
        let status: string;
        if (r.valid === null) status = chalk.yellow('missing');
        else if (r.valid) status = chalk.green('valid');
        else status = chalk.red('invalid');
        console.log(
          `${relPath.padEnd(60)}${agent}${hasManifest.padEnd(12)}${status}`
        );
        if (options.verbose && r.warnings.length > 0) {
          r.warnings.forEach((w) => console.log(chalk.gray(`  - ${w}`)));
        }
      }

      console.log(
        chalk.gray(
          '\nRun ossa agents-md maintain [dir] to validate and regenerate outdated AGENTS.md'
        )
      );
      process.exit(0);
    } catch (error) {
      handleCommandError(error);
    }
  });

// Maintain subcommand: discover then validate/regenerate to update and maintain
agentsMdCommand
  .command('maintain')
  .argument('[dir]', 'Workspace directory to scan', process.cwd())
  .option('-r, --regenerate', 'Regenerate all (not only invalid) from manifest')
  .option('--dry-run', 'Only report what would be updated')
  .option('-v, --verbose', 'Verbose output')
  .description(
    'Discover AGENTS.md files and update/maintain them (validate, regenerate invalid or all)'
  )
  .action(
    async (
      dir: string,
      options: { regenerate?: boolean; dryRun?: boolean; verbose?: boolean }
    ) => {
      try {
        const baseDir = dir || process.cwd();
        console.log(chalk.blue(`Maintaining AGENTS.md in ${baseDir}...`));

        const discovery = container.get(AgentsMdDiscoveryService);
        const { discovered, updated, skipped, failed } =
          await discovery.maintain(baseDir, {
            regenerate: options.regenerate ?? false,
            dryRun: options.dryRun,
          });

        if (discovered.length === 0) {
          console.log(
            chalk.yellow(
              'Nothing to maintain. Run ossa agents-md discover to list.'
            )
          );
          process.exit(0);
          return;
        }

        if (options.verbose || updated.length > 0 || failed.length > 0) {
          console.log(chalk.bold('\nMaintain result:'));
          console.log(chalk.green(`  Updated: ${updated.length}`));
          console.log(
            chalk.gray(`  Skipped (valid/no manifest): ${skipped.length}`)
          );
          if (failed.length > 0) {
            console.log(chalk.red(`  Failed: ${failed.length}`));
            failed.forEach((f) =>
              console.log(chalk.red(`    ${f.path}: ${f.error}`))
            );
          }
        }

        if (updated.length > 0) {
          console.log(chalk.green('\nUpdated:'));
          updated.forEach((p) => console.log(chalk.cyan(`  ${p}`)));
        }
        if (failed.length > 0) process.exit(1);
        process.exit(0);
      } catch (error) {
        handleCommandError(error);
      }
    }
  );
