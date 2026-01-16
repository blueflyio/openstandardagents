/**
 * Migration Commands
 *
 * SOLID: Single Responsibility - Agent migration only
 * DRY: Reuses Zod schemas from schemas/migrate.schema.ts
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { AgentMigrationService } from '../services/agent-migration.service.js';

export const migrateCommand = new Command('migrate')
  .alias('mig')
  .alias('m')
  .description('Migration commands for agents and specs');

// migrate:agents - Migrate agent manifests to latest version
migrateCommand
  .command('agents')
  .alias('a')
  .description('Migrate agent manifests to latest or specified version')
  .option(
    '--version <version>',
    'Target version (defaults to .version.json current)'
  )
  .option(
    '--paths <paths...>',
    'Specific paths to search (defaults to .gitlab, .ossa, examples, spec)'
  )
  .option('--dry-run', 'Dry run mode (show what would be changed)', false)
  .option('--force', 'Force upgrade even if already at target version', false)
  .action(
    async (options: {
      version?: string;
      paths?: string[];
      dryRun: boolean;
      force: boolean;
    }) => {
      console.log(chalk.blue('🔄 OSSA Agent Migration'));
      console.log(chalk.gray('========================\n'));

      const service = new AgentMigrationService();
      try {
        const result = await service.migrateAgents({
          targetVersion: options.version,
          paths: options.paths,
          dryRun: options.dryRun,
          force: options.force,
        });

        if (result.dryRun) {
          console.log(chalk.yellow('🔍 DRY RUN - No files were modified\n'));
        }

        console.log(
          chalk.blue(`Target Version: ${chalk.bold(result.targetVersion)}`)
        );
        console.log(chalk.gray(`Total Files: ${result.totalFiles}`));
        console.log(chalk.green(`✅ Upgraded: ${result.upgraded}`));
        console.log(chalk.gray(`⏭️  Skipped: ${result.skipped}`));
        if (result.failed > 0) {
          console.log(chalk.red(`❌ Failed: ${result.failed}`));
        }

        // Show detailed results
        if (result.upgraded > 0 || result.failed > 0) {
          console.log(chalk.gray('\nDetailed Results:'));
          for (const item of result.results) {
            if (item.oldVersion === item.newVersion) {
              // Skip already up-to-date files
              continue;
            }

            if (item.success) {
              console.log(
                chalk.green(
                  `  ✅ ${item.path}: ${item.oldVersion} → ${item.newVersion}`
                )
              );
            } else {
              console.log(chalk.red(`  ❌ ${item.path}: ${item.error}`));
            }
          }
        }

        if (result.success) {
          if (result.dryRun) {
            console.log(
              chalk.yellow(
                '\n✅ Dry run complete. Run without --dry-run to apply changes.'
              )
            );
          } else {
            console.log(
              chalk.green(
                `\n✅ Migration complete! ${result.upgraded} agent(s) upgraded to v${result.targetVersion}`
              )
            );
          }
        } else {
          console.error(
            chalk.red(
              `\n❌ Migration completed with ${result.failed} error(s)`
            )
          );
          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red(
            `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );
