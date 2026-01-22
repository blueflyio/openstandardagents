/**
 * Deploy Command
 * Deploys OSSA agent to specified platform(s)
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { KAgentRuntimeAdapter } from '../../sdks/kagent/runtime-adapter.js';

export const deployCommand = new Command('deploy')
  .description('Deploy OSSA agent to specified platform(s)')
  .argument('<manifest>', 'Path to OSSA agent manifest')
  .option(
    '-p, --platform <platform>',
    'Target platform (kagent, docker, kubernetes)',
    'kagent'
  )
  .option('--all', 'Deploy to all configured platforms', false)
  .option(
    '--namespace <namespace>',
    'Kubernetes namespace (for kagent/kubernetes)',
    'default'
  )
  .option(
    '--replicas <number>',
    'Number of replicas (for kagent/kubernetes)',
    '1'
  )
  .action(
    async (
      manifestPath: string,
      options: {
        platform: string;
        all: boolean;
        namespace: string;
        replicas: string;
      }
    ) => {
      try {
        console.log(chalk.blue(`Deploying agent: ${manifestPath}`));
        console.log(
          chalk.blue(`Platform: ${options.all ? 'all' : options.platform}\n`)
        );

        // Load manifest
        const manifestRepo = container.get(ManifestRepository);
        const manifest = await manifestRepo.load(manifestPath);

        const platforms = options.all
          ? ['kagent', 'docker', 'kubernetes']
          : [options.platform];

        for (const platform of platforms) {
          console.log(chalk.blue(`\nDeploying to ${platform}...`));
          try {
            await deployToPlatform(manifest, platform, {
              namespace: options.namespace,
              replicas: parseInt(options.replicas, 10),
            });
            console.log(chalk.green(`✓ ${platform} deployment successful`));
          } catch (error) {
            console.error(
              chalk.red(
                `✗ ${platform} deployment failed: ${error instanceof Error ? error.message : String(error)}`
              )
            );
          }
        }
      } catch (error) {
        console.error(
          chalk.red(
            `Deployment failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );

async function deployToPlatform(
  manifest: { metadata?: { name?: string } },
  platform: string,
  options: { namespace: string; replicas: number }
): Promise<void> {
  switch (platform) {
    case 'kagent': {
      const adapter = new KAgentRuntimeAdapter();
      await adapter.deploy(manifest as any, {
        namespace: options.namespace,
        replicas: options.replicas,
      });
      break;
    }

    case 'docker': {
      console.log(chalk.yellow('  Docker deployment not yet implemented'));
      console.log(
        chalk.yellow('  Use: docker build -t agent . && docker run agent')
      );
      break;
    }

    case 'kubernetes': {
      console.log(chalk.yellow('  Kubernetes deployment not yet implemented'));
      console.log(chalk.yellow('  Use: kubectl apply -f k8s/'));
      break;
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
