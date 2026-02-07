/**
 * OSSA Release Command
 *
 * Agent-based release automation integrating semantic-release and Keep a Changelog.
 * FOLLOWS DRY: Single source of truth - OpenAPI spec drives types and validation.
 * FOLLOWS API-FIRST: OpenAPI spec defined FIRST, then implementation.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { z } from 'zod';
import { ReleaseAgentService } from '../../services/release-automation/release-agent.service.js';
import { handleCommandError } from '../utils/index.js';

const ReleaseAnalysisRequestSchema = z.object({
  branch: z.string().min(1),
  fromTag: z.string().optional(),
  toCommit: z.string().optional().default('HEAD'),
  dryRun: z.boolean().optional().default(false),
});

export const releaseCommand = new Command('release').description(
  'Agent-based release automation'
);

releaseCommand
  .command('analyze')
  .description('Analyze commits and determine release type')
  .option('--branch <name>', 'Branch to analyze', (val) => val)
  .option('--from-tag <tag>', 'Start from tag', (val) => val)
  .option('--dry-run', 'Dry run mode', false)
  .action(async (options) => {
    try {
      const request = ReleaseAnalysisRequestSchema.parse({
        branch: options.branch || 'release/v0.3.x',
        fromTag: options.fromTag,
        dryRun: options.dryRun,
      });

      console.log(chalk.blue(`\n🔍 Analyzing release for: ${request.branch}`));
      const releaseService = new ReleaseAgentService();
      const result = await releaseService.analyzeRelease(request);

      if (result.releaseNeeded) {
        console.log(chalk.green(`\n✅ Release needed: ${result.releaseType}`));
        console.log(chalk.gray(`   Current: ${result.currentVersion}`));
        console.log(chalk.gray(`   Next: ${result.nextVersion}`));
      } else {
        console.log(chalk.yellow(`\n⚠️  No release needed`));
      }
    } catch (error) {
      handleCommandError(error as Error);
    }
  });

releaseCommand
  .command('validate-changelog')
  .description('Validate changelog follows Keep a Changelog format')
  .option('--path <path>', 'Changelog path', (val) => val)
  .action(async (options) => {
    try {
      const changelogPath = options.path || 'CHANGELOG.md';
      console.log(chalk.blue(`\n🔍 Validating changelog: ${changelogPath}`));
      const releaseService = new ReleaseAgentService();
      const result = await releaseService.validateChangelog(changelogPath);

      if (result.valid) {
        console.log(chalk.green(`\n✅ Changelog is valid!`));
      } else {
        console.log(chalk.red(`\n❌ Changelog validation failed:`));
        result.errors.forEach((error) => {
          console.log(chalk.red(`   - ${error}`));
        });
      }
    } catch (error) {
      handleCommandError(error as Error);
    }
  });
