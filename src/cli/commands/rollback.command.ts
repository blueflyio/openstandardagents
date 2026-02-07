/**
 * Rollback Command
 * Rollback agent deployment to previous version with verification
 *
 * Features:
 * - Automatic rollback to previous version
 * - Specify target version or steps
 * - Health verification after rollback
 * - Support for all deployment platforms
 */

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { DockerDeploymentDriver } from '../../deploy/docker-driver.js';
import { KubernetesDeploymentDriver } from '../../deploy/k8s-driver.js';
import type { RollbackOptions } from '../../deploy/types.js';

interface RollbackCommandOptions {
  version?: string;
  steps?: number;
  platform?: 'kubernetes' | 'docker' | 'cloud';
  cloud?: 'aws' | 'gcp' | 'azure';
  verify?: boolean;
  force?: boolean;
  interactive?: boolean;
}

export const rollbackCommand = new Command('rollback')
  .description('Rollback agent deployment to previous version')
  .argument('<instance-id>', 'Instance ID to rollback')
  .option('--version <version>', 'Target version to rollback to')
  .option(
    '--steps <number>',
    'Number of versions to rollback (default: 1)',
    '1'
  )
  .option(
    '-p, --platform <platform>',
    'Deployment platform (kubernetes, docker, cloud)',
    'kubernetes'
  )
  .option(
    '--cloud <provider>',
    'Cloud provider (aws, gcp, azure) - requires --platform cloud'
  )
  .option('--no-verify', 'Skip health verification after rollback')
  .option('-f, --force', 'Force rollback without confirmation', false)
  .option('-i, --interactive', 'Interactive mode with prompts', false)
  .action(
    async (instanceId: string, options: RollbackCommandOptions) => {
      const spinner = ora('Preparing rollback...').start();

      try {
        // Validate options
        validateRollbackOptions(options);

        spinner.succeed('Configuration validated');

        // Get instance info
        const driver = getDeploymentDriver(options);
        const instance = await driver.getStatus(instanceId);

        console.log('\n' + chalk.bold.blue('Rollback Plan:'));
        console.log('─'.repeat(60));
        console.log(`  Instance: ${chalk.cyan(instanceId)}`);
        console.log(`  Agent: ${chalk.cyan(instance.name)}`);
        console.log(`  Current Version: ${chalk.cyan(instance.version)}`);
        console.log(`  Platform: ${chalk.cyan(options.platform)}`);

        if (options.version) {
          console.log(`  Target Version: ${chalk.cyan(options.version)}`);
        } else {
          console.log(`  Rollback Steps: ${chalk.cyan(options.steps)}`);
        }

        console.log('─'.repeat(60) + '\n');

        // Confirm rollback
        if (!options.force && (options.interactive || !options.version)) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: chalk.yellow(
                'Are you sure you want to rollback? This will affect production traffic.'
              ),
              default: false,
            },
          ]);

          if (!confirm) {
            console.log(chalk.yellow('Rollback cancelled'));
            return;
          }
        }

        // Execute rollback
        spinner.start('Rolling back deployment...');

        const rollbackOptions: RollbackOptions = {
          toVersion: options.version,
          steps: parseInt(String(options.steps || '1'), 10),
        };

        const result = await driver.rollback(instanceId, rollbackOptions);

        if (result.success) {
          spinner.succeed(chalk.green(`✓ ${result.message}`));

          if (result.metadata) {
            console.log('\n' + chalk.bold('Rollback Details:'));
            Object.entries(result.metadata).forEach(([key, value]) => {
              console.log(`  ${key}: ${chalk.cyan(String(value))}`);
            });
          }

          // Verify health after rollback
          if (options.verify) {
            await verifyRollbackHealth(driver, instanceId);
          }
        } else {
          spinner.fail(chalk.red(`✗ ${result.message}`));
          process.exit(1);
        }
      } catch (error) {
        spinner.fail(
          chalk.red(
            `Rollback failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );

/**
 * Validate rollback options
 */
function validateRollbackOptions(options: RollbackCommandOptions): void {
  if (options.platform === 'cloud' && !options.cloud) {
    throw new Error('Cloud provider must be specified with --cloud option');
  }

  if (options.version && options.steps && options.steps !== 1) {
    throw new Error('Cannot specify both --version and --steps');
  }

  const steps = parseInt(String(options.steps || '1'), 10);
  if (isNaN(steps) || steps < 1) {
    throw new Error('Steps must be a positive number');
  }
}

/**
 * Get deployment driver based on platform
 */
function getDeploymentDriver(options: RollbackCommandOptions) {
  switch (options.platform) {
    case 'kubernetes':
      return new KubernetesDeploymentDriver();

    case 'docker':
      return new DockerDeploymentDriver();

    case 'cloud':
      // Dynamic import for cloud drivers
      throw new Error('Cloud rollback not yet implemented');

    default:
      throw new Error(`Unsupported platform: ${options.platform}`);
  }
}

/**
 * Verify health after rollback
 */
async function verifyRollbackHealth(
  driver: any,
  instanceId: string
): Promise<void> {
  const spinner = ora('Verifying deployment health...').start();

  try {
    // Wait for service to stabilize
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const health = await driver.healthCheck(instanceId);

    if (health.healthy) {
      spinner.succeed(
        chalk.green(`✓ Health verification passed - ${health.status}`)
      );

      if (health.metrics) {
        console.log('\n' + chalk.bold('Health Metrics:'));
        if (health.metrics.uptime !== undefined) {
          console.log(`  Uptime: ${chalk.cyan(health.metrics.uptime)}s`);
        }
        if (health.metrics.errorRate !== undefined) {
          console.log(
            `  Error Rate: ${chalk.cyan(health.metrics.errorRate.toFixed(2))}%`
          );
        }
      }
    } else {
      spinner.fail(
        chalk.yellow(`⚠ Health verification failed - ${health.status}`)
      );
      console.log(
        chalk.yellow(
          '\nWarning: Rollback completed but service is not healthy.'
        )
      );
      console.log(chalk.yellow('Please check logs and metrics.'));
    }
  } catch (error) {
    spinner.fail(
      chalk.yellow(
        `Health verification error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}
