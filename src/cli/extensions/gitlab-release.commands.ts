/**
 * GitLab-Specific Release Commands
 *
 * These commands require GitLab API access and are part of the GitLab extension.
 * They were moved from the core release command group to keep OSSA CLI platform-agnostic.
 *
 * Included commands:
 * - gitlab-release tag create/list/show/delete
 * - gitlab-release milestone create/list/show
 * - gitlab-release increment-dev
 *
 * SOLID Principles:
 * - Uses shared GitLab config (DRY)
 * - Uses shared output utilities (DRY)
 * - Single Responsibility per command
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  TagService,
  MilestoneService,
} from '../../services/release-automation/index.js';
import type {
  CreateTagRequest,
  CreateMilestoneRequest,
} from '../../services/release-automation/schemas/release.schema.js';
import { loadGitLabConfig, type GitLabConfig } from '../utils/gitlab-config.js';
import { printSuccess, printError, printKeyValue } from '../utils/output.js';

// ============================================================================
// Helper: Get GitLab Config (uses shared utility)
// ============================================================================

function getGitLabConfig(): GitLabConfig {
  return loadGitLabConfig();
}

// ============================================================================
// Tag Subcommands
// ============================================================================

const tagCommand = new Command('tag')
  .description('Manage Git tags via GitLab API')
  .alias('tags');

tagCommand
  .command('create')
  .description('Create a new tag')
  .requiredOption('-n, --name <name>', 'Tag name (e.g., v0.2.5-dev.1)')
  .requiredOption('-r, --ref <ref>', 'Git ref (branch, commit SHA)')
  .option('-m, --message <message>', 'Tag message')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(
    async (options: {
      name: string;
      ref: string;
      message?: string;
      output: string;
    }) => {
      try {
        const config = getGitLabConfig();
        const tagService = new TagService(config.token, config.projectId);

        const tagRequest: CreateTagRequest = {
          name: options.name,
          ref: options.ref,
          message: options.message || `Tag ${options.name}`,
        };

        const tag = await tagService.create(tagRequest);

        if (options.output === 'json') {
          console.log(JSON.stringify(tag, null, 2));
          return;
        }

        console.log(chalk.green('[PASS] Tag created successfully!'));
        console.log(chalk.cyan(`   Name: ${tag.name}`));
        console.log(chalk.cyan(`   Type: ${tag.type}`));
        console.log(chalk.cyan(`   Version: ${tag.version}`));
        console.log(chalk.cyan(`   Commit: ${tag.commitSha.substring(0, 8)}`));
      } catch (error) {
        console.error(chalk.red('[FAIL] Failed to create tag:'), error);
        process.exit(1);
      }
    }
  );

tagCommand
  .command('list')
  .description('List tags with filtering')
  .option('-t, --type <type>', 'Filter by type (dev, rc, release, all)', 'all')
  .option('-v, --version <version>', 'Filter by version')
  .option('-p, --page <page>', 'Page number', '1')
  .option('--per-page <count>', 'Items per page', '20')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(
    async (options: {
      type: string;
      version?: string;
      page: string;
      perPage: string;
      output: string;
    }) => {
      try {
        const config = getGitLabConfig();
        const tagService = new TagService(config.token, config.projectId);

        const result = await tagService.list({
          type: options.type as 'dev' | 'rc' | 'release' | 'all',
          version: options.version,
          page: parseInt(options.page, 10),
          perPage: parseInt(options.perPage, 10),
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log(
          chalk.blue(`[LIST] Tags (${result.pagination.total} total):\n`)
        );

        if (result.items.length === 0) {
          console.log(chalk.yellow('   No tags found'));
          return;
        }

        result.items.forEach((tag) => {
          const typeColor =
            tag.type === 'release'
              ? chalk.green
              : tag.type === 'rc'
                ? chalk.yellow
                : chalk.cyan;
          console.log(
            `   ${typeColor(tag.name.padEnd(25))} ${chalk.gray(tag.type.padEnd(6))} ${chalk.gray(tag.commitSha.substring(0, 8))}`
          );
        });

        console.log(
          chalk.gray(
            `\n   Page ${result.pagination.page} of ${result.pagination.totalPages}`
          )
        );
      } catch (error) {
        console.error(chalk.red('[FAIL] Failed to list tags:'), error);
        process.exit(1);
      }
    }
  );

tagCommand
  .command('show')
  .description('Show tag details')
  .argument('<name>', 'Tag name')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(async (name: string, options: { output: string }) => {
    try {
      const config = getGitLabConfig();
      const tagService = new TagService(config.token, config.projectId);

      const tag = await tagService.read(name);

      if (!tag) {
        console.error(chalk.red(`[FAIL] Tag not found: ${name}`));
        process.exit(1);
      }

      if (options.output === 'json') {
        console.log(JSON.stringify(tag, null, 2));
        return;
      }

      console.log(chalk.blue(`[LIST] Tag: ${tag.name}\n`));
      console.log(chalk.cyan(`   Type: ${tag.type}`));
      console.log(chalk.cyan(`   Version: ${tag.version}`));
      console.log(chalk.cyan(`   Commit: ${tag.commitSha}`));
      console.log(chalk.cyan(`   Ref: ${tag.ref}`));
      console.log(chalk.cyan(`   Message: ${tag.message || '(none)'}`));
      console.log(chalk.cyan(`   Created: ${tag.createdAt}`));
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to show tag:'), error);
      process.exit(1);
    }
  });

tagCommand
  .command('delete')
  .description('Delete a tag')
  .argument('<name>', 'Tag name')
  .option('-f, --force', 'Force deletion without confirmation')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(
    async (name: string, options: { force?: boolean; output: string }) => {
      try {
        if (!options.force) {
          console.log(chalk.yellow(`[WARN]  This will delete tag: ${name}`));
          console.log(chalk.yellow('   Use --force to skip confirmation'));
          process.exit(1);
        }

        const config = getGitLabConfig();
        const tagService = new TagService(config.token, config.projectId);

        await tagService.delete(name);

        if (options.output === 'json') {
          console.log(JSON.stringify({ deleted: name, success: true }));
          return;
        }

        console.log(chalk.green(`[PASS] Tag deleted: ${name}`));
      } catch (error) {
        console.error(chalk.red('[FAIL] Failed to delete tag:'), error);
        process.exit(1);
      }
    }
  );

// ============================================================================
// Milestone Subcommands
// ============================================================================

const milestoneCommand = new Command('milestone')
  .description('Manage GitLab milestones')
  .alias('milestones')
  .alias('ms');

milestoneCommand
  .command('create')
  .description('Create a new milestone')
  .requiredOption('-t, --title <title>', 'Milestone title (e.g., v0.2.5)')
  .option('-d, --description <desc>', 'Milestone description')
  .option('--due-date <date>', 'Due date (YYYY-MM-DD)')
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(
    async (options: {
      title: string;
      description?: string;
      dueDate?: string;
      startDate?: string;
      output: string;
    }) => {
      try {
        const config = getGitLabConfig();
        const milestoneService = new MilestoneService(
          config.token,
          config.projectId
        );

        const milestoneRequest: CreateMilestoneRequest = {
          title: options.title,
          description: options.description,
          dueDate: options.dueDate || undefined,
          startDate: options.startDate || undefined,
        };

        const milestone = await milestoneService.create(milestoneRequest);

        if (options.output === 'json') {
          console.log(JSON.stringify(milestone, null, 2));
          return;
        }

        console.log(chalk.green('[PASS] Milestone created successfully!'));
        console.log(chalk.cyan(`   ID: ${milestone.id}`));
        console.log(chalk.cyan(`   Title: ${milestone.title}`));
        console.log(chalk.cyan(`   State: ${milestone.state}`));
        if (milestone.dueDate) {
          console.log(chalk.cyan(`   Due: ${milestone.dueDate}`));
        }
        console.log(
          chalk.cyan(
            `   Issues: ${milestone.statistics.closedIssues}/${milestone.statistics.totalIssues} closed`
          )
        );
      } catch (error) {
        console.error(chalk.red('[FAIL] Failed to create milestone:'), error);
        process.exit(1);
      }
    }
  );

milestoneCommand
  .command('list')
  .description('List milestones')
  .option('-s, --state <state>', 'Filter by state (active, closed)')
  .option('-p, --page <page>', 'Page number', '1')
  .option('--per-page <count>', 'Items per page', '20')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(
    async (options: {
      state?: string;
      page: string;
      perPage: string;
      output: string;
    }) => {
      try {
        const config = getGitLabConfig();
        const milestoneService = new MilestoneService(
          config.token,
          config.projectId
        );

        const result = await milestoneService.list({
          state: options.state as 'active' | 'closed' | undefined,
          page: parseInt(options.page, 10),
          perPage: parseInt(options.perPage, 10),
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log(
          chalk.blue(`[LIST] Milestones (${result.pagination.total} total):\n`)
        );

        if (result.items.length === 0) {
          console.log(chalk.yellow('   No milestones found'));
          return;
        }

        result.items.forEach((ms) => {
          const stateColor = ms.state === 'closed' ? chalk.green : chalk.yellow;
          const progress = `${ms.statistics.closedIssues}/${ms.statistics.totalIssues}`;
          console.log(
            `   ${chalk.cyan(ms.title.padEnd(20))} ${stateColor(ms.state.padEnd(8))} ${chalk.gray(progress)}`
          );
        });

        console.log(
          chalk.gray(
            `\n   Page ${result.pagination.page} of ${result.pagination.totalPages}`
          )
        );
      } catch (error) {
        console.error(chalk.red('[FAIL] Failed to list milestones:'), error);
        process.exit(1);
      }
    }
  );

milestoneCommand
  .command('show')
  .description('Show milestone details')
  .argument('<id>', 'Milestone ID')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(async (id: string, options: { output: string }) => {
    try {
      const config = getGitLabConfig();
      const milestoneService = new MilestoneService(
        config.token,
        config.projectId
      );

      const milestone = await milestoneService.read(parseInt(id, 10));

      if (!milestone) {
        console.error(chalk.red(`[FAIL] Milestone not found: ${id}`));
        process.exit(1);
      }

      if (options.output === 'json') {
        console.log(JSON.stringify(milestone, null, 2));
        return;
      }

      console.log(chalk.blue(`[LIST] Milestone: ${milestone.title}\n`));
      console.log(chalk.cyan(`   ID: ${milestone.id}`));
      console.log(chalk.cyan(`   State: ${milestone.state}`));
      if (milestone.description) {
        console.log(chalk.cyan(`   Description: ${milestone.description}`));
      }
      if (milestone.dueDate) {
        console.log(chalk.cyan(`   Due Date: ${milestone.dueDate}`));
      }
      if (milestone.startDate) {
        console.log(chalk.cyan(`   Start Date: ${milestone.startDate}`));
      }
      console.log(
        chalk.cyan(
          `   Issues: ${milestone.statistics.closedIssues}/${milestone.statistics.totalIssues} closed`
        )
      );
      console.log(chalk.cyan(`   Created: ${milestone.createdAt}`));
      console.log(chalk.cyan(`   Updated: ${milestone.updatedAt}`));
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to show milestone:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// Increment Dev Subcommand
// ============================================================================

const incrementDevCommand = new Command('increment-dev')
  .description('Increment dev tag version via GitLab API')
  .option('-b, --base-version <version>', 'Base version (e.g., 0.2.5)')
  .option('-r, --ref <ref>', 'Git ref to tag', 'development')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(
    async (options: { baseVersion?: string; ref: string; output: string }) => {
      try {
        const config = getGitLabConfig();
        const tagService = new TagService(config.token, config.projectId);

        // Get current version from package.json if not provided
        let baseVersion = options.baseVersion;
        if (!baseVersion) {
          const fs = await import('fs');
          const packageJson = JSON.parse(
            fs.readFileSync('package.json', 'utf-8')
          );
          baseVersion = packageJson.version.split('-dev.')[0];
        }

        // Find latest dev tag
        const tags = await tagService.list({
          type: 'dev',
          version: baseVersion,
          page: 1,
          perPage: 100,
        });

        let nextNum = 0;
        if (tags.items.length > 0) {
          const latest = tags.items[0];
          const match = latest.name.match(/-dev\.(\d+)$/);
          if (match) {
            nextNum = parseInt(match[1], 10) + 1;
          }
        }

        const tagName = `v${baseVersion}-dev.${nextNum}`;

        const tag = await tagService.create({
          name: tagName,
          ref: options.ref,
          message: `Auto-incremented dev tag ${nextNum}`,
        });

        if (options.output === 'json') {
          console.log(JSON.stringify(tag, null, 2));
          return;
        }

        console.log(chalk.green(`[PASS] Created dev tag: ${tag.name}`));
      } catch (error) {
        console.error(chalk.red('[FAIL] Failed to increment dev tag:'), error);
        process.exit(1);
      }
    }
  );

// ============================================================================
// GitLab Release Command Group (for extension)
// ============================================================================

export const gitlabReleaseCommandGroup = new Command('gitlab-release')
  .description('GitLab release automation (tags, milestones)')
  .alias('gl-release')
  .addCommand(tagCommand)
  .addCommand(milestoneCommand)
  .addCommand(incrementDevCommand);
