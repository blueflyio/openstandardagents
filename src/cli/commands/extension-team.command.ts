/**
 * Extension Team Command - CRUD Operations for Extension Development Teams
 *
 * Subcommands:
 *   ossa extension-team spawn [platform]  - Spawn agent team for platform(s)
 *   ossa extension-team list               - List all platforms
 *   ossa extension-team status            - Check team status
 *
 * SOLID: Uses ExtensionTeamKickoffService (dependency injection)
 * Zod: Validates inputs via service schemas
 * OpenAPI: Command contract defined in openapi/cli-commands.openapi.yaml
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../di-container.js';
import { ExtensionTeamKickoffService } from '../../services/extension-team/extension-team-kickoff.service.js';

export const extensionTeamCommand = new Command('extension-team').description(
  'Manage extension development teams'
);

// ============================================================================
// Subcommand: spawn
// ============================================================================

extensionTeamCommand
  .command('spawn')
  .description('Spawn agent teams for extension development')
  .argument(
    '[platform]',
    'Specific platform to spawn (optional, defaults to all critical)'
  )
  .option('--priority <priority>', 'Filter by priority', 'critical')
  .action(async (platform?: string, _options?: { priority?: string }) => {
    try {
      const service = container.get<ExtensionTeamKickoffService>(
        ExtensionTeamKickoffService
      );

      console.log(
        chalk.bold.blue('🚀 OSSA Extension Development Team - SPAWNING')
      );
      console.log(chalk.gray('='.repeat(50)));
      console.log(`Date: ${new Date().toISOString()}`);
      console.log('Priority: CRITICAL - Build ASAP\n');

      if (platform) {
        // Spawn specific platform
        const platforms = service.listPlatforms();
        const allPlatforms = [...platforms.critical, ...platforms.high];
        const targetPlatform = allPlatforms.find((p) => p.name === platform);

        if (!targetPlatform) {
          console.error(chalk.red(`❌ Platform "${platform}" not found`));
          process.exit(1);
        }

        await service.spawnPlatform(targetPlatform);
        console.log(chalk.green(`✅ Agent team spawned for: ${platform}`));
      } else {
        // Spawn all critical platforms
        const platforms = service.listPlatforms();

        console.log(chalk.bold('📋 Critical Platforms (Spawning Now):'));
        platforms.critical.forEach((p) => {
          console.log(`  - ${p.name} (deadline: ${p.deadline})`);
        });

        console.log(chalk.bold('\n📋 High Priority Platforms (Next):'));
        platforms.high.forEach((p) => {
          console.log(`  - ${p.name} (deadline: ${p.deadline})`);
        });

        console.log(chalk.bold('\n🤖 Spawning agent teams...\n'));

        await service.spawnCriticalPlatforms();

        console.log(chalk.green('\n✅ All critical agent teams spawned!'));
        console.log(chalk.bold('\n📊 Next Steps:'));
        console.log('  1. Execute workflows via GitLab Agents');
        console.log(
          '  2. Or run: npm run extension:build -- --platform <name>'
        );
        console.log('  3. Monitor progress in GitLab CI/CD pipelines');
        console.log(
          chalk.gray(
            '\n🎯 Expected completion: 2-4 weeks for critical platforms'
          )
        );
      }
    } catch (error) {
      console.error(chalk.red('❌ Error spawning agent teams:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: list
// ============================================================================

extensionTeamCommand
  .command('list')
  .description('List all platforms by priority')
  .action(() => {
    try {
      const service = container.get<ExtensionTeamKickoffService>(
        ExtensionTeamKickoffService
      );

      const platforms = service.listPlatforms();

      console.log(chalk.bold.blue('📋 Extension Development Platforms\n'));

      console.log(chalk.bold.red('🔴 Critical Platforms:'));
      platforms.critical.forEach((p) => {
        console.log(`  - ${chalk.bold(p.name)} (deadline: ${p.deadline})`);
      });

      console.log(chalk.bold.yellow('\n🟡 High Priority Platforms:'));
      platforms.high.forEach((p) => {
        console.log(`  - ${chalk.bold(p.name)} (deadline: ${p.deadline})`);
      });
    } catch (error) {
      console.error(chalk.red('❌ Error listing platforms:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: status
// ============================================================================

extensionTeamCommand
  .command('status')
  .description('Check extension team status')
  .option('--platform <platform>', 'Check specific platform status')
  .action(async (_options?: { platform?: string }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _service = container.get<ExtensionTeamKickoffService>(
        ExtensionTeamKickoffService
      );

      // TODO: Implement status checking via GitLab API
      console.log(chalk.yellow('⚠️  Status checking not yet implemented'));
      console.log('This will check workflow execution status via GitLab API');
    } catch (error) {
      console.error(chalk.red('❌ Error checking status:'), error);
      process.exit(1);
    }
  });
