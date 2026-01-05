/**
 * OSSA Deploy and Status Commands
 * Enhanced deployment and lifecycle management with runtime drivers
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import {
  createDeploymentDriver,
  type DeploymentTarget,
  type DeploymentConfig,
} from '../../deploy/index.js';

/**
 * Load deployment configuration from file
 */
function loadConfig(configPath: string): Partial<DeploymentConfig> {
  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to load config file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deploy command - deploy agent to runtime
 */
export const deployCommand = new Command('deploy')
  .argument('<path>', 'Path to agent manifest')
  .option(
    '--target <target>',
    'Deployment target (local|docker|kubernetes)',
    'local'
  )
  .option('--env <environment>', 'Target environment', 'dev')
  .option('--version <version>', 'Version to deploy')
  .option('--config <config-file>', 'Configuration file path')
  .option('--dry-run', 'Simulate deployment without executing', false)
  .option('--port <port>', 'Port number for local/docker deployment')
  .option('--docker-image <image>', 'Docker image to use')
  .option('--docker-network <network>', 'Docker network', 'bridge')
  .option('--namespace <namespace>', 'Kubernetes namespace', 'default')
  .option('--replicas <count>', 'Number of replicas (K8s)', '1')
  .description('Deploy agent to specified runtime')
  .action(
    async (
      manifestPath: string,
      options: {
        target: string;
        env: string;
        version?: string;
        config?: string;
        dryRun?: boolean;
        port?: string;
        dockerImage?: string;
        dockerNetwork?: string;
        namespace?: string;
        replicas?: string;
      }
    ) => {
      try {
        // Validate target
        const validTargets: DeploymentTarget[] = ['local', 'docker', 'kubernetes'];
        const target = options.target as DeploymentTarget;
        if (!validTargets.includes(target)) {
          console.error(
            chalk.red(`✗ Invalid target: ${options.target}`),
            chalk.gray(`\n  Valid targets: ${validTargets.join(', ')}`)
          );
          process.exit(1);
        }

        // Load and validate manifest
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        console.log(chalk.blue(`Loading agent manifest: ${manifestPath}`));
        const manifest = await manifestRepo.load(manifestPath);

        const result = await validationService.validate(manifest);
        if (!result.valid) {
          console.error(chalk.red('✗ Manifest validation failed:'));
          result.errors.forEach((error) =>
            console.error(chalk.red(`  - ${error.message}`))
          );
          process.exit(1);
        }

        console.log(chalk.green('✓ Manifest is valid'));

        // Build deployment config
        let deployConfig: DeploymentConfig = {
          target,
          environment: options.env,
          version: options.version,
          dryRun: options.dryRun,
        };

        // Load config file if provided
        if (options.config) {
          console.log(chalk.blue(`Loading config from: ${options.config}`));
          const fileConfig = loadConfig(options.config);
          deployConfig = { ...deployConfig, ...fileConfig };
        }

        // Apply CLI options (override config file)
        if (options.port) {
          const port = parseInt(options.port);
          if (isNaN(port) || port <= 0 || port > 65535) {
            console.error(chalk.red(`✗ Invalid port: ${options.port}`));
            process.exit(1);
          }
          deployConfig.port = port;
        }
        if (options.dockerImage) deployConfig.dockerImage = options.dockerImage;
        if (options.dockerNetwork)
          deployConfig.dockerNetwork = options.dockerNetwork;
        if (options.namespace) deployConfig.namespace = options.namespace;
        if (options.replicas) {
          const replicas = parseInt(options.replicas);
          if (isNaN(replicas) || replicas <= 0) {
            console.error(chalk.red(`✗ Invalid replicas count: ${options.replicas}`));
            process.exit(1);
          }
          deployConfig.replicas = replicas;
        }

        // Create driver and deploy
        console.log(
          chalk.blue(`\nDeploying to ${chalk.bold(target)} runtime...`)
        );
        if (deployConfig.dryRun) {
          console.log(chalk.yellow('Running in DRY RUN mode\n'));
        }

        const driver = createDeploymentDriver(target);
        const deployResult = await driver.deploy(manifest, deployConfig);

        if (deployResult.success) {
          console.log(chalk.green(`\n✓ ${deployResult.message}`));
          if (deployResult.instanceId) {
            console.log(chalk.cyan(`  Instance ID: ${deployResult.instanceId}`));
          }
          if (deployResult.endpoint) {
            console.log(chalk.cyan(`  Endpoint: ${deployResult.endpoint}`));
          }
          if (deployResult.metadata) {
            console.log(chalk.gray('\n  Deployment details:'));
            Object.entries(deployResult.metadata).forEach(([key, value]) => {
              console.log(
                chalk.gray(`    ${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2).split('\n').join('\n    ') : value}`)
              );
            });
          }

          // Update manifest with deployment info
          if (!manifest.spec) {
            manifest.spec = { role: 'unknown' };
          }
          if (!manifest.spec.environments) {
            manifest.spec.environments = {};
          }
          manifest.spec.environments[deployConfig.environment] = {
            version:
              deployConfig.version || manifest.metadata?.version || '1.0.0',
            deployedAt: new Date().toISOString(),
            deployedBy: process.env.USER || 'unknown',
            status: 'deployed',
            endpoint: deployResult.endpoint,
          };
          await manifestRepo.save(manifestPath, manifest);

          process.exit(0);
        } else {
          console.error(chalk.red(`\n✗ ${deployResult.message}`));
          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red('✗ Deployment failed:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );

/**
 * Status command - check deployment status
 */
export const statusCommand = new Command('status')
  .option(
    '--target <target>',
    'Deployment target (local|docker|kubernetes)',
    'local'
  )
  .option('--instance <id>', 'Specific instance ID')
  .option('--list', 'List all running instances')
  .option('--health', 'Include health metrics')
  .description('Check agent deployment status')
  .action(
    async (options: {
      target: string;
      instance?: string;
      list?: boolean;
      health?: boolean;
    }) => {
      try {
        const validTargets: DeploymentTarget[] = ['local', 'docker', 'kubernetes'];
        const target = options.target as DeploymentTarget;
        if (!validTargets.includes(target)) {
          console.error(chalk.red(`✗ Invalid target: ${options.target}`));
          process.exit(1);
        }

        const driver = createDeploymentDriver(target);

        if (options.list) {
          // List all instances
          console.log(
            chalk.cyan.bold(`\nRunning Instances (${target}):\n`)
          );
          const instances = await driver.listInstances();

          if (instances.length === 0) {
            console.log(chalk.yellow('  No running instances found'));
            return;
          }

          for (const instance of instances) {
            const statusColor =
              instance.status === 'running'
                ? chalk.green
                : instance.status === 'failed'
                  ? chalk.red
                  : chalk.yellow;

            console.log(chalk.cyan(`  ${instance.name}`));
            console.log(`    ID:       ${instance.id}`);
            console.log(`    Status:   ${statusColor(instance.status)}`);
            console.log(`    Version:  ${instance.version}`);
            console.log(`    Deployed: ${new Date(instance.deployedAt).toLocaleString()}`);
            if (instance.endpoint) {
              console.log(`    Endpoint: ${instance.endpoint}`);
            }

            if (options.health && instance.health) {
              const healthColor = instance.health.healthy
                ? chalk.green
                : chalk.red;
              console.log(`    Health:   ${healthColor(instance.health.status)}`);
              if (instance.health.metrics?.uptime !== undefined) {
                console.log(
                  `    Uptime:   ${Math.floor(instance.health.metrics.uptime / 60)}m`
                );
              }
            }
            console.log('');
          }
        } else if (options.instance) {
          // Get specific instance status
          const instance = await driver.getStatus(options.instance);

          console.log(chalk.cyan.bold(`\nInstance Status:\n`));
          console.log(chalk.cyan(`  ${instance.name}`));
          console.log(`  ID:       ${instance.id}`);
          const statusColor =
            instance.status === 'running'
              ? chalk.green
              : instance.status === 'failed'
                ? chalk.red
                : chalk.yellow;
          console.log(`  Status:   ${statusColor(instance.status)}`);
          console.log(`  Version:  ${instance.version}`);
          console.log(`  Deployed: ${new Date(instance.deployedAt).toLocaleString()}`);
          if (instance.endpoint) {
            console.log(`  Endpoint: ${instance.endpoint}`);
          }

          // Show health metrics
          if (options.health) {
            console.log(chalk.cyan.bold('\n  Health Metrics:'));
            const health = await driver.healthCheck(options.instance);
            const healthColor = health.healthy ? chalk.green : chalk.red;
            console.log(`    Status:  ${healthColor(health.status)}`);
            if (health.message) {
              console.log(`    Message: ${health.message}`);
            }
            if (health.metrics) {
              const uptime = health.metrics.uptime ?? 0;
              const memoryUsage = health.metrics.memoryUsage ?? 0;
              const cpuUsage = health.metrics.cpuUsage ?? 0;
              const errorRate = health.metrics.errorRate ?? 0;
              console.log(
                `    Uptime:  ${Math.floor(uptime / 60)}m ${uptime % 60}s`
              );
              console.log(`    Memory:  ${memoryUsage.toFixed(2)}%`);
              console.log(`    CPU:     ${cpuUsage.toFixed(2)}%`);
              console.log(`    Errors:  ${errorRate.toFixed(2)}%`);
            }
          }

          // Show metadata
          if (instance.metadata) {
            console.log(chalk.cyan.bold('\n  Metadata:'));
            Object.entries(instance.metadata).forEach(([key, value]) => {
              console.log(`    ${key}: ${value}`);
            });
          }
        } else {
          console.error(
            chalk.red('✗ Please specify --instance <id> or --list')
          );
          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red('✗ Status check failed:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );

/**
 * Rollback command - rollback to previous version
 */
export const rollbackCommand = new Command('rollback')
  .argument('<instance-id>', 'Instance ID to rollback')
  .option(
    '--target <target>',
    'Deployment target (local|docker|kubernetes)',
    'local'
  )
  .option('--to-version <version>', 'Specific version to rollback to')
  .option('--steps <number>', 'Number of versions to rollback', '1')
  .description('Rollback agent to previous version')
  .action(
    async (
      instanceId: string,
      options: {
        target: string;
        toVersion?: string;
        steps?: string;
      }
    ) => {
      try {
        const validTargets: DeploymentTarget[] = ['local', 'docker', 'kubernetes'];
        const target = options.target as DeploymentTarget;
        if (!validTargets.includes(target)) {
          console.error(chalk.red(`✗ Invalid target: ${options.target}`));
          process.exit(1);
        }

        const driver = createDeploymentDriver(target);

        console.log(chalk.blue(`Rolling back instance: ${instanceId}...`));

        const result = await driver.rollback(instanceId, {
          toVersion: options.toVersion,
          steps: options.steps ? parseInt(options.steps) : 1,
        });

        if (result.success) {
          console.log(chalk.green(`\n✓ ${result.message}`));
          if (result.metadata) {
            console.log(chalk.gray('\n  Rollback details:'));
            Object.entries(result.metadata).forEach(([key, value]) => {
              console.log(chalk.gray(`    ${key}: ${value}`));
            });
          }
        } else {
          console.error(chalk.red(`\n✗ ${result.message}`));
          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red('✗ Rollback failed:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );

/**
 * Stop command - stop a running instance
 */
export const stopCommand = new Command('stop')
  .argument('<instance-id>', 'Instance ID to stop')
  .option(
    '--target <target>',
    'Deployment target (local|docker|kubernetes)',
    'local'
  )
  .description('Stop a running agent instance')
  .action(
    async (
      instanceId: string,
      options: {
        target: string;
      }
    ) => {
      try {
        const validTargets: DeploymentTarget[] = ['local', 'docker', 'kubernetes'];
        const target = options.target as DeploymentTarget;
        if (!validTargets.includes(target)) {
          console.error(chalk.red(`✗ Invalid target: ${options.target}`));
          process.exit(1);
        }

        const driver = createDeploymentDriver(target);

        console.log(chalk.blue(`Stopping instance: ${instanceId}...`));
        await driver.stop(instanceId);

        console.log(chalk.green(`✓ Instance stopped successfully`));
      } catch (error) {
        console.error(
          chalk.red('✗ Stop failed:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );
