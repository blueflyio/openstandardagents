/**
 * Enhanced Deploy Command
 * One-click deployment automation to Kubernetes, Docker, or Cloud
 *
 * Features:
 * - Interactive platform selection
 * - Multi-environment support (production, staging, dev)
 * - Health check verification
 * - Rollback capability
 * - CI/CD integration
 * - Real-time status monitoring
 */

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { DockerDeploymentDriver } from '../../deploy/docker-driver.js';
import { KubernetesDeploymentDriver } from '../../deploy/k8s-driver.js';
import type { DeploymentConfig, DeploymentTarget } from '../../deploy/types.js';
import type { OssaAgent } from '../../types/index.js';

interface DeployOptions {
  platform?: DeploymentTarget | 'cloud';
  cloud?: 'aws' | 'gcp' | 'azure';
  env: string;
  registry?: string;
  namespace?: string;
  replicas?: number;
  healthCheck?: boolean;
  verify?: boolean;
  interactive?: boolean;
  dryRun?: boolean;
}

export const deployEnhancedCommand = new Command('deploy')
  .description('One-click deployment to Kubernetes, Docker, or Cloud')
  .argument('<manifest>', 'Path to OSSA agent manifest')
  .option(
    '-p, --platform <platform>',
    'Target platform (kubernetes, docker, cloud)',
    'kubernetes'
  )
  .option(
    '--cloud <provider>',
    'Cloud provider (aws, gcp, azure) - requires --platform cloud'
  )
  .option(
    '-e, --env <environment>',
    'Environment (production, staging, dev)',
    'production'
  )
  .option(
    '--registry <registry>',
    'Container registry (e.g., ghcr.io/org, docker.io/user)'
  )
  .option('--namespace <namespace>', 'Kubernetes namespace', 'default')
  .option('--replicas <count>', 'Number of replicas', '1')
  .option('--no-health-check', 'Skip health check verification')
  .option('--no-verify', 'Skip deployment verification')
  .option('-i, --interactive', 'Interactive mode with prompts', false)
  .option('--dry-run', 'Preview deployment without executing', false)
  .action(async (manifestPath: string, options: DeployOptions) => {
    const spinner = ora('Initializing deployment...').start();

    try {
      // Load manifest
      const manifestRepo = container.get(ManifestRepository);
      const manifest = await manifestRepo.load(manifestPath);

      spinner.succeed('Manifest loaded');

      // Interactive mode
      if (options.interactive) {
        const answers = await promptDeploymentOptions(manifest, options);
        Object.assign(options, answers);
      }

      // Validate options
      validateDeploymentOptions(options);

      // Display deployment plan
      displayDeploymentPlan(manifest, options);

      // Confirm deployment (unless dry-run or non-interactive)
      if (!options.dryRun && options.interactive) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Proceed with deployment?',
            default: true,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Deployment cancelled'));
          return;
        }
      }

      // Execute deployment
      spinner.start('Deploying agent...');
      const result = await executeDeployment(manifest, options);

      if (result.success) {
        spinner.succeed(chalk.green(`✓ ${result.message}`));

        // Display deployment info
        console.log('\n' + chalk.bold('Deployment Details:'));
        console.log(`  Instance ID: ${chalk.cyan(result.instanceId)}`);
        console.log(`  Endpoint: ${chalk.cyan(result.endpoint || 'N/A')}`);
        console.log(`  Environment: ${chalk.cyan(options.env)}`);
        console.log(`  Platform: ${chalk.cyan(options.platform)}`);

        if (result.metadata) {
          console.log('\n' + chalk.bold('Platform Details:'));
          Object.entries(result.metadata).forEach(([key, value]) => {
            console.log(`  ${key}: ${chalk.gray(String(value))}`);
          });
        }

        // Health check
        if (options.healthCheck && !options.dryRun) {
          await performHealthCheck(result.instanceId!, options);
        }

        // Display rollback command
        console.log(
          '\n' +
            chalk.bold('Rollback:') +
            ` ${chalk.gray(`ossa rollback ${result.instanceId}`)}`
        );
      } else {
        spinner.fail(chalk.red(`✗ ${result.message}`));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(
        chalk.red(
          `Deployment failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

/**
 * Prompt for deployment options
 */
async function promptDeploymentOptions(
  manifest: OssaAgent,
  currentOptions: DeployOptions
): Promise<Partial<DeployOptions>> {
  const questions = [];

  // Platform selection
  if (!currentOptions.platform) {
    questions.push({
      type: 'list',
      name: 'platform',
      message: 'Select deployment platform:',
      choices: [
        { name: 'Kubernetes (K8s)', value: 'kubernetes' },
        { name: 'Docker', value: 'docker' },
        { name: 'Cloud (AWS/GCP/Azure)', value: 'cloud' },
      ],
    });
  }

  // Cloud provider (if cloud platform)
  if (currentOptions.platform === 'cloud' || !currentOptions.cloud) {
    questions.push({
      type: 'list',
      name: 'cloud',
      message: 'Select cloud provider:',
      choices: [
        { name: 'AWS (ECS/Fargate/Lambda)', value: 'aws' },
        { name: 'Google Cloud (Cloud Run/GKE)', value: 'gcp' },
        { name: 'Azure (Container Instances/AKS)', value: 'azure' },
      ],
      when: (answers: any) =>
        answers.platform === 'cloud' || currentOptions.platform === 'cloud',
    });
  }

  // Environment
  if (!currentOptions.env || currentOptions.env === 'production') {
    questions.push({
      type: 'list',
      name: 'env',
      message: 'Select environment:',
      choices: ['production', 'staging', 'dev'],
      default: currentOptions.env || 'production',
    });
  }

  // Kubernetes-specific
  if (currentOptions.platform === 'kubernetes') {
    questions.push(
      {
        type: 'input',
        name: 'namespace',
        message: 'Kubernetes namespace:',
        default: currentOptions.namespace || 'default',
      },
      {
        type: 'number',
        name: 'replicas',
        message: 'Number of replicas:',
        default: parseInt(String(currentOptions.replicas || '1'), 10),
        validate: (input: number) => input > 0 || 'Must be greater than 0',
      }
    );
  }

  // Container registry
  if (currentOptions.platform !== 'local' && !currentOptions.registry) {
    questions.push({
      type: 'input',
      name: 'registry',
      message: 'Container registry (e.g., ghcr.io/org):',
      default: 'ghcr.io/' + (manifest.metadata?.name || 'agent'),
    });
  }

  const answers = await inquirer.prompt(questions);
  return answers;
}

/**
 * Validate deployment options
 */
function validateDeploymentOptions(options: DeployOptions): void {
  if (options.platform === 'cloud' && !options.cloud) {
    throw new Error('Cloud provider must be specified with --cloud option');
  }

  if (options.cloud && options.platform !== 'cloud') {
    throw new Error('Cloud provider can only be used with --platform cloud');
  }

  const replicas = parseInt(String(options.replicas || '1'), 10);
  if (isNaN(replicas) || replicas < 1) {
    throw new Error('Replicas must be a positive number');
  }
}

/**
 * Display deployment plan
 */
function displayDeploymentPlan(
  manifest: OssaAgent,
  options: DeployOptions
): void {
  console.log('\n' + chalk.bold.blue('Deployment Plan:'));
  console.log('─'.repeat(60));
  console.log(`  Agent: ${chalk.cyan(manifest.metadata?.name || 'unnamed')}`);
  console.log(
    `  Version: ${chalk.cyan(manifest.metadata?.version || '1.0.0')}`
  );
  console.log(`  Environment: ${chalk.cyan(options.env)}`);
  console.log(`  Platform: ${chalk.cyan(options.platform)}`);

  if (options.platform === 'cloud') {
    console.log(`  Cloud Provider: ${chalk.cyan(options.cloud)}`);
  }

  if (options.platform === 'kubernetes') {
    console.log(`  Namespace: ${chalk.cyan(options.namespace)}`);
    console.log(`  Replicas: ${chalk.cyan(options.replicas)}`);
  }

  if (options.registry) {
    console.log(`  Registry: ${chalk.cyan(options.registry)}`);
  }

  if (options.dryRun) {
    console.log(`  ${chalk.yellow('DRY RUN MODE - No changes will be made')}`);
  }

  console.log('─'.repeat(60) + '\n');
}

/**
 * Execute deployment
 */
async function executeDeployment(manifest: OssaAgent, options: DeployOptions) {
  const config: DeploymentConfig = {
    target: (options.platform === 'cloud'
      ? 'kubernetes'
      : options.platform) as DeploymentTarget,
    environment: options.env,
    version: manifest.metadata?.version,
    dryRun: options.dryRun,
    namespace: options.namespace,
    replicas: parseInt(String(options.replicas || '1'), 10),
    dockerImage: options.registry
      ? `${options.registry}:${manifest.metadata?.version || 'latest'}`
      : undefined,
  };

  switch (options.platform) {
    case 'kubernetes': {
      const driver = new KubernetesDeploymentDriver();
      return await driver.deploy(manifest, config);
    }

    case 'docker': {
      const driver = new DockerDeploymentDriver();
      return await driver.deploy(manifest, config);
    }

    case 'cloud': {
      return await deployToCloud(manifest, config, options.cloud!);
    }

    default:
      throw new Error(`Unsupported platform: ${options.platform}`);
  }
}

/**
 * Deploy to cloud provider
 */
async function deployToCloud(
  manifest: OssaAgent,
  config: DeploymentConfig,
  provider: 'aws' | 'gcp' | 'azure'
) {
  switch (provider) {
    case 'aws':
      const { AWSDeploymentDriver } =
        await import('../../deploy/cloud/aws-driver.js');
      const awsDriver = new AWSDeploymentDriver();
      return await awsDriver.deploy(manifest, config);

    case 'gcp':
      const { GCPDeploymentDriver } =
        await import('../../deploy/cloud/gcp-driver.js');
      const gcpDriver = new GCPDeploymentDriver();
      return await gcpDriver.deploy(manifest, config);

    case 'azure':
      const { AzureDeploymentDriver } =
        await import('../../deploy/cloud/azure-driver.js');
      const azureDriver = new AzureDeploymentDriver();
      return await azureDriver.deploy(manifest, config);

    default:
      throw new Error(`Unsupported cloud provider: ${provider}`);
  }
}

/**
 * Perform health check after deployment
 */
async function performHealthCheck(
  instanceId: string,
  options: DeployOptions
): Promise<void> {
  const spinner = ora('Performing health check...').start();

  try {
    // Wait a few seconds for service to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    let driver;
    switch (options.platform) {
      case 'kubernetes':
        driver = new KubernetesDeploymentDriver();
        break;
      case 'docker':
        driver = new DockerDeploymentDriver();
        break;
      default:
        spinner.warn('Health check not supported for this platform');
        return;
    }

    const health = await driver.healthCheck(instanceId);

    if (health.healthy) {
      spinner.succeed(chalk.green(`✓ Health check passed - ${health.status}`));
      if (health.message) {
        console.log(`  ${chalk.gray(health.message)}`);
      }
    } else {
      spinner.fail(chalk.yellow(`⚠ Health check degraded - ${health.status}`));
      if (health.message) {
        console.log(`  ${chalk.gray(health.message)}`);
      }
    }

    // Display metrics
    if (health.metrics) {
      console.log('\n' + chalk.bold('Metrics:'));
      if (health.metrics.uptime !== undefined) {
        console.log(
          `  Uptime: ${chalk.cyan(formatUptime(health.metrics.uptime))}`
        );
      }
      if (health.metrics.memoryUsage !== undefined) {
        console.log(
          `  Memory: ${chalk.cyan(health.metrics.memoryUsage.toFixed(2))}%`
        );
      }
      if (health.metrics.cpuUsage !== undefined) {
        console.log(
          `  CPU: ${chalk.cyan(health.metrics.cpuUsage.toFixed(2))}%`
        );
      }
    }
  } catch (error) {
    spinner.fail(
      chalk.red(
        `Health check failed: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
