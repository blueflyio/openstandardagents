import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';

const deployGroup = new Command('deploy').description('Deploy and lifecycle management');

deployGroup
  .command('deploy')
  .argument('<path>', 'Path to agent manifest')
  .option('--env <environment>', 'Target environment', 'staging')
  .option('--version <version>', 'Version to deploy')
  .description('Deploy agent to specified environment')
  .action(async (manifestPath: string, options: { env?: string; version?: string }) => {
    try {
      const manifestRepo = container.get(ManifestRepository);
      const validationService = container.get(ValidationService);
      console.log(chalk.blue(`Loading agent: ${manifestPath}`));
      const manifest = await manifestRepo.load(manifestPath);
      const result = await validationService.validate(manifest);
      if (!result.valid) {
        console.error(chalk.red('✗ Validation failed'));
        result.errors.forEach((error) => console.error(chalk.red(`  - ${error}`)));
        process.exit(1);
      }
      if (!manifest.metadata || !manifest.spec) {
        console.error(chalk.red('✗ Invalid manifest: missing metadata or spec'));
        process.exit(1);
      }
      const agentName = manifest.metadata.name;
      const version = options.version || manifest.metadata.version || '1.0.0';
      const env = options.env || 'staging';
      if (!manifest.spec.environments) {
        manifest.spec.environments = {};
      }
      manifest.spec.environments[env] = {
        version,
        deployedAt: new Date().toISOString(),
        deployedBy: process.env.USER || 'unknown',
        status: 'deployed',
      };
      await manifestRepo.save(manifestPath, manifest);
      console.log(chalk.green(`✓ Deployed ${agentName}@${version} to ${env}`));
    } catch (error) {
      console.error(
        chalk.red('✗ Deployment failed:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

deployGroup
  .command('promote')
  .argument('<path>', 'Path to agent manifest')
  .option('--from <env>', 'Source environment', 'staging')
  .option('--to <env>', 'Target environment', 'production')
  .description('Promote agent from one environment to another')
  .action(async (manifestPath: string, options: { from?: string; to?: string }) => {
    try {
      const manifestRepo = container.get(ManifestRepository);
      const fromEnv = options.from || 'staging';
      const toEnv = options.to || 'production';
      const manifest = await manifestRepo.load(manifestPath);
      if (!manifest.spec) {
        console.error(chalk.red('✗ Invalid manifest: missing spec'));
        process.exit(1);
      }
      if (!manifest.spec.environments?.[fromEnv]) {
        console.error(chalk.red(`✗ Agent not deployed to ${fromEnv}`));
        process.exit(1);
      }
      const sourceDeployment = manifest.spec.environments[fromEnv];
      if (!manifest.spec.environments) {
        manifest.spec.environments = {};
      }
      manifest.spec.environments[toEnv] = {
        ...sourceDeployment,
        deployedAt: new Date().toISOString(),
        deployedBy: process.env.USER || 'unknown',
        status: 'deployed',
      };
      await manifestRepo.save(manifestPath, manifest);
      console.log(chalk.green(`✓ Promoted from ${fromEnv} to ${toEnv}`));
    } catch (error) {
      console.error(
        chalk.red('✗ Promotion failed:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

deployGroup
  .command('status')
  .argument('<path>', 'Path to agent manifest')
  .option('--env <environment>', 'Show specific environment')
  .description('Show agent deployment status')
  .action(async (manifestPath: string, options: { env?: string }) => {
    try {
      const manifestRepo = container.get(ManifestRepository);
      const manifest = await manifestRepo.load(manifestPath);
      if (!manifest.metadata || !manifest.spec) {
        console.error(chalk.red('✗ Invalid manifest: missing metadata or spec'));
        process.exit(1);
      }
      const agentName = manifest.metadata.name;
      const environments = manifest.spec.environments || {};
      console.log(chalk.cyan.bold(`\n${agentName} Deployment Status\n`));
      if (Object.keys(environments).length === 0) {
        console.log(chalk.yellow('  No deployments found'));
        return;
      }
      if (options.env) {
        const env = environments[options.env];
        if (!env) {
          console.error(chalk.red(`✗ Not deployed to ${options.env}`));
          process.exit(1);
        }
        console.log(chalk.white(`  Environment: ${options.env}`));
        console.log(chalk.white(`  Version:     ${env.version || 'N/A'}`));
        console.log(chalk.white(`  Status:      ${env.status || 'unknown'}`));
        console.log(
          chalk.white(
            `  Deployed:    ${env.deployedAt ? new Date(env.deployedAt).toLocaleString() : 'N/A'}`
          )
        );
      } else {
        Object.entries(environments).forEach(([envName, env]: [string, any]) => {
          console.log(chalk.cyan(`  ${envName}:`));
          console.log(chalk.white(`    Version:  ${env.version || 'N/A'}`));
          console.log(chalk.white(`    Status:  ${env.status || 'unknown'}`));
          console.log(
            chalk.white(
              `    Deployed: ${env.deployedAt ? new Date(env.deployedAt).toLocaleString() : 'N/A'}`
            )
          );
          console.log('');
        });
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

deployGroup
  .command('retire')
  .argument('<path>', 'Path to agent manifest')
  .option('--effective <date>', 'Effective date', new Date().toISOString().split('T')[0])
  .option('--replacement <agent>', 'Replacement agent identifier')
  .description('Retire an agent')
  .action(async (manifestPath: string, options: { effective?: string; replacement?: string }) => {
    try {
      const manifestRepo = container.get(ManifestRepository);
      const manifest = await manifestRepo.load(manifestPath);
      if (!manifest.metadata) {
        console.error(chalk.red('✗ Invalid manifest: missing metadata'));
        process.exit(1);
      }
      if (!manifest.metadata.lifecycle) {
        manifest.metadata.lifecycle = { state: 'active', maturity: 'alpha' };
      }
      manifest.metadata.lifecycle.state = 'retired';
      if (options.effective) {
        if (!manifest.metadata.lifecycle.deprecation) {
          manifest.metadata.lifecycle.deprecation = {};
        }
        manifest.metadata.lifecycle.deprecation.sunsetDate = options.effective;
      }
      if (options.replacement) {
        if (!manifest.metadata.lifecycle.deprecation) {
          manifest.metadata.lifecycle.deprecation = {};
        }
        manifest.metadata.lifecycle.deprecation.replacement = options.replacement;
      }
      await manifestRepo.save(manifestPath, manifest);
      console.log(chalk.green(`✓ Agent retired`));
    } catch (error) {
      console.error(
        chalk.red('✗ Retirement failed:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

export { deployGroup };
