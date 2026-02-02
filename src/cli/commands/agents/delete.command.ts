/**
 * Agents Delete Command
 * Delete an agent manifest file
 *
 * SOLID: Single Responsibility - Agent deletion only
 * Safety: Requires confirmation, supports dry-run
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import yaml from 'yaml';
import type { OssaAgent } from '../../../types/index.js';

export const agentsDeleteCommand = new Command('delete')
  .description('Delete an agent manifest file')
  .argument('<name-or-path>', 'Agent name or path to manifest file')
  .option('--force', 'Skip confirmation prompt')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .option('--backup', 'Create backup before deleting')
  .action(async (nameOrPath: string, options) => {
    try {
      const filePath = await findAgentFile(nameOrPath);

      // Load manifest to show what's being deleted
      const content = fs.readFileSync(filePath, 'utf-8');
      const manifest = yaml.parse(content) as OssaAgent;

      // Display agent info
      console.log(chalk.yellow.bold('\n⚠️  About to delete:'));
      console.log(
        chalk.cyan(`  Name: ${manifest.metadata?.name || 'Unknown'}`)
      );
      console.log(
        chalk.cyan(`  Version: ${manifest.metadata?.version || 'Unknown'}`)
      );
      console.log(
        chalk.cyan(`  File: ${path.relative(process.cwd(), filePath)}`)
      );

      if (options.dryRun) {
        console.log(chalk.green('\n✓ Dry-run mode: File would be deleted'));
        return;
      }

      // Confirm deletion
      if (!options.force) {
        const confirmed = await askConfirmation(
          '\nAre you sure you want to delete this agent?'
        );
        if (!confirmed) {
          console.log(chalk.gray('Deletion cancelled'));
          return;
        }
      }

      // Create backup if requested
      if (options.backup) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        console.log(
          chalk.gray(
            `\n Backup created: ${path.relative(process.cwd(), backupPath)}`
          )
        );
      }

      // Delete file
      fs.unlinkSync(filePath);

      console.log(chalk.green(`\n✓ Agent deleted successfully`));
      console.log(
        chalk.gray(`  File: ${path.relative(process.cwd(), filePath)}`)
      );

      if (options.backup) {
        console.log(
          chalk.gray(`\n  Restore with: mv ${filePath}.backup.* ${filePath}`)
        );
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to delete agent: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

/**
 * Find agent file by name or path
 */
async function findAgentFile(nameOrPath: string): Promise<string> {
  // Check if it's a file path
  if (fs.existsSync(nameOrPath)) {
    return nameOrPath;
  }

  // Search for agent by name
  const glob = await import('glob');
  const patterns = [
    `**/${nameOrPath}.ossa.yaml`,
    `**/${nameOrPath}.ossa.yml`,
    `**/${nameOrPath}/agent.yaml`,
    `**/${nameOrPath}/agent.yml`,
  ];

  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**'],
      absolute: true,
    });

    if (files.length > 0) {
      return files[0];
    }
  }

  throw new Error(`Agent not found: ${nameOrPath}`);
}

/**
 * Ask for user confirmation
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(`${question} (y/N) `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}
