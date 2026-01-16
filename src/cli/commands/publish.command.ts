/**
 * OSSA Publish Command - Publish agents to registry
 */
import chalk from 'chalk';
import { Command } from 'commander';
import axios from 'axios';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { mkdir } from 'fs/promises';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { BundleService } from '../../services/registry/bundle.service.js';
import { IndexService } from '../../services/registry/index.service.js';

export const publishCommand = new Command('publish')
  .argument('<path>', 'Path to OSSA agent directory or manifest')
  .option('--registry <path>', 'Local registry path', './registry')
  .option('--output <dir>', 'Output directory for bundles')
  .option('--token <token>', 'GitLab/GitHub token')
  .option('--dry-run', 'Preview without publishing')
  .description('Publish an agent to the OSSA registry')
  .action(
    async (
      agentPath: string,
      options: {
        registry?: string;
        output?: string;
        token?: string;
        dryRun?: boolean;
      }
    ) => {
      try {
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);
        const bundleService = container.get(BundleService);
        const indexService = container.get(IndexService);

        console.log(chalk.blue(`Loading agent: ${agentPath}`));

        // Determine if path is directory or manifest file
        const agentDir =
          agentPath.endsWith('.yaml') || agentPath.endsWith('.yml')
            ? dirname(agentPath)
            : agentPath;

        const manifest = await manifestRepo.load(agentPath);
        const result = await validationService.validate(manifest);

        if (!result.valid) {
          console.error(chalk.red('✗ Validation failed'));
          result.errors.forEach((error) =>
            console.error(chalk.red(`  - ${error.message || error}`))
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
          console.log(`  Registry: ${options.registry || './registry'}`);
          return;
        }

        // Create bundle
        console.log(chalk.blue('\nCreating bundle...'));
        const outputDir = options.output || join(tmpdir(), 'ossa-bundles');
        await mkdir(outputDir, { recursive: true });

        const manifestPath = join(agentDir, 'agent.yaml');
        const bundleMetadata = await bundleService.createBundle(
          manifestPath,
          manifest,
          outputDir
        );

        console.log(chalk.green('✓ Bundle created'));
        console.log(
          chalk.gray(`  Size: ${(bundleMetadata.size / 1024).toFixed(2)} KB`)
        );
        console.log(
          chalk.gray(
            `  Checksum: ${bundleMetadata.checksum.substring(0, 16)}...`
          )
        );

        // Update registry index
        console.log(chalk.blue('\nUpdating registry index...'));
        const registryPath = options.registry || './registry';

        const agentEntry = {
          id: manifest.metadata?.name || 'unknown',
          name: manifest.metadata?.name || 'Unknown Agent',
          version: manifest.metadata?.version || '1.0.0',
          description: manifest.metadata?.description,
          license: (manifest.metadata as any)?.license,
          artifacts: {
            bundle: {
              sha256: bundleMetadata.checksum,
              size: bundleMetadata.size,
            },
            sbom: {
              sha256: bundleMetadata.sbomChecksum,
              format: 'cyclonedx' as const,
            },
          },
          sbom_sha256: bundleMetadata.checksum, // deprecated - kept for backwards compatibility
          schema_version: manifest.apiVersion || 'ossa/v0.3.5',
          manifest_url: bundleMetadata.path,
          bundle_url: bundleMetadata.path,
          published_at: new Date().toISOString(),
        };

        await indexService.addAgent(registryPath, agentEntry);

        console.log(chalk.green('✓ Registry index updated'));

        // Optional: Publish to remote (GitLab/GitHub)
        if (options.token) {
          console.log(chalk.blue('\nPublishing to remote...'));
          const projectId = process.env.GITLAB_PROJECT_ID || '76265294';
          const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
          const tagName = `${agentName}-v${agentVersion}`;

          try {
            await axios.post(
              `${gitlabUrl}/api/v4/projects/${projectId}/releases`,
              {
                name: `${agentName} v${agentVersion}`,
                tag_name: tagName,
                description: `OSSA Agent: ${agentName}@${agentVersion}\n\nPublished via OSSA CLI\n\nChecksum: ${bundleMetadata.checksum}`,
              },
              { headers: { 'PRIVATE-TOKEN': options.token } }
            );
            console.log(chalk.green('✓ Published to remote'));
          } catch (error: any) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
              console.log(chalk.yellow(`Release ${tagName} already exists`));
            } else {
              throw error;
            }
          }
        }

        console.log(chalk.green(`\n✓ Published ${agentName}@${agentVersion}`));
        console.log(
          chalk.gray(
            `  Bundle: ${outputDir}/${agentName}-${agentVersion}.tar.gz`
          )
        );
        console.log(chalk.gray(`  Registry: ${registryPath}/index.json`));
      } catch (error) {
        console.error(
          chalk.red('✗ Failed:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );
