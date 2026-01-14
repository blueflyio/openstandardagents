/**
 * OSSA Publish Command - Publish agents to registry
 */
import chalk from 'chalk';
import { Command } from 'commander';
import axios from 'axios';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';

export const publishCommand = new Command('publish')
  .argument('<path>', 'Path to OSSA agent manifest')
  .option('--registry <url>', 'Registry URL', 'gitlab')
  .option('--token <token>', 'GitLab/GitHub token')
  .option('--dry-run', 'Preview without publishing')
  .description('Publish an agent to the OSSA registry')
  .action(
    async (
      manifestPath: string,
      options: { registry?: string; token?: string; dryRun?: boolean }
    ) => {
      try {
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);
        console.log(chalk.blue(`Loading agent: ${manifestPath}`));
        const manifest = await manifestRepo.load(manifestPath);
        const result = await validationService.validate(manifest);
        if (!result.valid) {
          console.error(chalk.red('✗ Validation failed'));
          result.errors.forEach((error) =>
            console.error(chalk.red(`  - ${error}`))
          );
          process.exit(1);
        }
        if (!manifest.metadata) {
          console.error(chalk.red('✗ Invalid manifest: missing metadata'));
          process.exit(1);
        }
        const agentName = manifest.metadata.name;
        const agentVersion = manifest.metadata.version || '1.0.0';
        console.log(chalk.green(`✓ Validated: ${agentName}@${agentVersion}`));
        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY RUN] Would publish:'));
          console.log(`  Agent: ${agentName}@${agentVersion}`);
          console.log(`  Registry: ${options.registry || 'gitlab'}`);
          return;
        }
        const token =
          options.token ||
          process.env.GITLAB_TOKEN ||
          process.env.GITLAB_PRIVATE_TOKEN ||
          process.env.GITHUB_TOKEN;
        if (!token) {
          console.error(chalk.red('✗ No token provided'));
          process.exit(1);
        }
        console.log(
          chalk.blue(`\nPublishing to ${options.registry || 'gitlab'}...`)
        );
        const projectId = process.env.GITLAB_PROJECT_ID || '76265294';
        const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
        const tagName = `${agentName}-v${agentVersion}`;
        try {
          await axios.post(
            `${gitlabUrl}/api/v4/projects/${projectId}/releases`,
            {
              name: `${agentName} v${agentVersion}`,
              tag_name: tagName,
              description: `OSSA Agent: ${agentName}@${agentVersion}\n\nPublished via OSSA CLI`,
            },
            { headers: { 'PRIVATE-TOKEN': token } }
          );
        } catch (error: any) {
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            console.log(chalk.yellow(`Release ${tagName} already exists`));
          } else {
            throw error;
          }
        }
        console.log(chalk.green(`\n✓ Published ${agentName}@${agentVersion}`));
        console.log(
          chalk.gray(`  Install: ossa install ${agentName}@${agentVersion}`)
        );
      } catch (error) {
        console.error(
          chalk.red('✗ Failed:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );
