/**
 * Build Command
 * Builds OSSA agent for all configured platforms
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { KAgentCRDGenerator } from '../../sdks/kagent/crd-generator.js';
import { LangChainConverter } from '../../adapters/langchain/converter.js';
import { CrewAIConverter } from '../../adapters/crewai/converter.js';
import { TemporalConverter } from '../../adapters/temporal/converter.js';
import { N8NConverter } from '../../adapters/n8n/converter.js';
import { GitLabConverter } from '../../adapters/gitlab/converter.js';
import {
  DockerfileGenerator,
  DockerComposeGenerator,
} from '../../adapters/docker/generators.js';
import { KubernetesManifestGenerator } from '../../adapters/kubernetes/generator.js';
import { getBuildDefaults } from '../../config/defaults.js';
import type { OssaAgent } from '../../types/index.js';

export const buildCommand = new Command('build')
  .description('Build OSSA agent for configured platforms')
  .argument('<manifest>', 'Path to OSSA agent manifest')
  .option(
    '-p, --platform <platform>',
    'Build for specific platform (kagent, langchain, crewai, temporal, docker, kubernetes)',
    'all'
  )
  .option(
    '-o, --output <dir>',
    'Output directory for build artifacts',
    getBuildDefaults().outputDir
  )
  .option('--validate', 'Validate manifest before building', true)
  .action(
    async (
      manifestPath: string,
      options: {
        platform: string;
        output: string;
        validate: boolean;
      }
    ) => {
      try {
        console.log(chalk.blue(`Building agent from: ${manifestPath}`));
        console.log(chalk.blue(`Platform: ${options.platform}`));
        console.log(chalk.blue(`Output: ${options.output}\n`));

        // Load manifest
        const manifestRepo = container.get(ManifestRepository);
        const manifest = await manifestRepo.load(manifestPath);

        if (options.validate) {
          console.log(chalk.yellow('Validating manifest...'));
          // TODO: Add validation
          console.log(chalk.green('✓ Manifest valid\n'));
        }

        // Create output directory
        const outputDir = path.resolve(options.output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const platforms =
          options.platform === 'all'
            ? [
                'kagent',
                'langchain',
                'crewai',
                'temporal',
                'n8n',
                'gitlab',
                'docker',
                'kubernetes',
              ]
            : [options.platform];

        const results: Array<{
          platform: string;
          success: boolean;
          files: string[];
        }> = [];

        for (const platform of platforms) {
          console.log(chalk.blue(`\nBuilding for ${platform}...`));
          try {
            const platformResults = await buildForPlatform(
              manifest,
              platform,
              outputDir
            );
            results.push({ platform, success: true, files: platformResults });
            console.log(
              chalk.green(
                `✓ ${platform} build complete (${platformResults.length} files)`
              )
            );
          } catch (error) {
            results.push({ platform, success: false, files: [] });
            console.error(
              chalk.red(
                `✗ ${platform} build failed: ${error instanceof Error ? error.message : String(error)}`
              )
            );
          }
        }

        // Generate build manifest
        const buildManifest = {
          manifest: manifestPath,
          timestamp: new Date().toISOString(),
          platforms: results,
        };
        fs.writeFileSync(
          path.join(outputDir, 'build-manifest.json'),
          JSON.stringify(buildManifest, null, 2)
        );

        console.log(chalk.green(`\n✓ Build complete!`));
        console.log(chalk.blue(`  Output: ${outputDir}`));
        console.log(
          chalk.blue(
            `  Build manifest: ${path.join(outputDir, 'build-manifest.json')}`
          )
        );

        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        if (failed > 0) {
          console.log(
            chalk.yellow(`\n  ${successful} successful, ${failed} failed`)
          );
        }
      } catch (error) {
        console.error(
          chalk.red(
            `Build failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );

async function buildForPlatform(
  manifest: OssaAgent,
  platform: string,
  outputDir: string
): Promise<string[]> {
  const platformDir = path.join(outputDir, platform);
  if (!fs.existsSync(platformDir)) {
    fs.mkdirSync(platformDir, { recursive: true });
  }

  const files: string[] = [];

  switch (platform) {
    case 'kagent': {
      const generator = new KAgentCRDGenerator();
      const crd = generator.generate(manifest);
      const crdPath = path.join(
        platformDir,
        `${manifest.metadata?.name || 'agent'}-crd.yaml`
      );
      fs.writeFileSync(crdPath, JSON.stringify(crd, null, 2));
      files.push(crdPath);
      break;
    }

    case 'langchain': {
      // TODO: Implement LangChain converter
      console.log(chalk.yellow('  LangChain converter not yet implemented'));
      break;
    }

    case 'crewai': {
      // TODO: Implement CrewAI converter
      console.log(chalk.yellow('  CrewAI converter not yet implemented'));
      break;
    }

    case 'temporal': {
      // TODO: Implement Temporal converter
      console.log(chalk.yellow('  Temporal converter not yet implemented'));
      break;
    }

    case 'docker': {
      try {
        // Use manifest parameter directly (already loaded)
        const spec = manifest.spec as any;
        const dockerConfig = spec?.runtime?.bindings?.docker;
        if (!dockerConfig) {
          throw new Error(
            'Docker config not found in manifest. Add spec.runtime.bindings.docker'
          );
        }

        const baseImage = dockerConfig.baseImage || getBuildDefaults().baseImage;
        const agentName = manifest.metadata?.name || 'agent';
        const workdir = dockerConfig.workdir || '/app';

        let dockerfile = `# Dockerfile for ${agentName}
# Generated from OSSA manifest
# DO NOT EDIT MANUALLY - Regenerate from manifest

FROM ${baseImage}

WORKDIR ${workdir}

`;

        if (dockerConfig.buildDependencies) {
          dockerfile += '# Install build dependencies\n';
          if (baseImage.includes('node')) {
            dockerfile += 'RUN npm install -g pnpm typescript\n';
          } else if (baseImage.includes('python')) {
            dockerfile += 'RUN pip install --upgrade pip\n';
          }
          dockerfile += '\n';
        }

        dockerfile += '# Copy package files\n';
        dockerfile += 'COPY package*.json ./\n';
        dockerfile += 'COPY pnpm-lock.yaml* ./\n';
        dockerfile += '\n';

        dockerfile += '# Install dependencies\n';
        if (baseImage.includes('node')) {
          dockerfile += 'RUN npm install || pnpm install\n';
        } else if (baseImage.includes('python')) {
          dockerfile += 'COPY requirements.txt .\n';
          dockerfile += 'RUN pip install -r requirements.txt\n';
        }
        dockerfile += '\n';

        dockerfile += '# Copy source code\n';
        dockerfile += 'COPY . .\n';
        dockerfile += '\n';

        if (dockerConfig.buildCommand) {
          dockerfile += `# Build\n`;
          dockerfile += `RUN ${dockerConfig.buildCommand}\n`;
          dockerfile += '\n';
        }

        if (dockerConfig.ports && dockerConfig.ports.length > 0) {
          dockerfile += '# Expose ports\n';
          for (const port of dockerConfig.ports) {
            dockerfile += `EXPOSE ${port}\n`;
          }
          dockerfile += '\n';
        }

        if (dockerConfig.healthCheck) {
          dockerfile += '# Health check\n';
          dockerfile += `HEALTHCHECK ${dockerConfig.healthCheck}\n`;
          dockerfile += '\n';
        }

        const startCommand = dockerConfig.startCommand || 'npm start';
        dockerfile += `# Start command\n`;
        dockerfile += `CMD ["${startCommand}"]\n`;

        const outputPath = path.join(outputDir, 'Dockerfile');
        fs.writeFileSync(outputPath, dockerfile);
        console.log(chalk.green(`  ✅ Generated Dockerfile: ${outputPath}`));
        files.push(outputPath);

        // Always generate .dockerignore
        {
          const dockerignore = `# .dockerignore for ${agentName}
# Generated from OSSA manifest

node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
*.md
.vscode
.idea
dist
build
coverage
.nyc_output
*.log
.DS_Store
`;
          const dockerignorePath = path.join(outputDir, '.dockerignore');
          fs.writeFileSync(dockerignorePath, dockerignore);
          console.log(
            chalk.green(`  ✅ Generated .dockerignore: ${dockerignorePath}`)
          );
          files.push(dockerignorePath);
        }

        files.push(outputPath);
      } catch (error) {
        console.error(
          chalk.red(`  ❌ Failed to generate Dockerfile: ${error}`)
        );
        throw error;
      }
      break;
    }

    case 'kubernetes': {
      try {
        // Use manifest parameter directly (already loaded)
        const spec = manifest.spec as any;
        const k8sConfig = spec?.runtime?.bindings?.kubernetes;
        if (!k8sConfig) {
          throw new Error(
            'Kubernetes config not found in manifest. Add spec.runtime.bindings.kubernetes'
          );
        }

        const namespace = k8sConfig.namespace || 'default';
        const agentName = manifest.metadata?.name || 'agent';
        const image = k8sConfig.image || `${agentName}:latest`;
        const replicas = k8sConfig.replicas || 1;

        const k8sDir = path.join(outputDir, 'k8s');
        if (!fs.existsSync(k8sDir)) {
          fs.mkdirSync(k8sDir, { recursive: true });
        }

        const deployment = {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: {
            name: agentName,
            namespace: namespace,
            labels: {
              app: agentName,
              'agent-id': agentName,
              'managed-by': 'ossa',
            },
          },
          spec: {
            replicas: replicas,
            selector: {
              matchLabels: {
                app: agentName,
              },
            },
            template: {
              metadata: {
                labels: {
                  app: agentName,
                },
              },
              spec: {
                containers: [
                  {
                    name: agentName,
                    image: image,
                    ports: k8sConfig.ports || [],
                    resources: k8sConfig.resources || {
                      requests: { cpu: '100m', memory: '128Mi' },
                      limits: { cpu: '500m', memory: '512Mi' },
                    },
                    env: k8sConfig.env || [],
                  },
                ],
              },
            },
          },
        };

        const deploymentPath = path.join(k8sDir, 'deployment.yaml');
        fs.writeFileSync(deploymentPath, yaml.dump(deployment));
        console.log(
          chalk.green(`  ✅ Generated deployment: ${deploymentPath}`)
        );
        files.push(deploymentPath);

        // Always generate service if ports are defined
        if (k8sConfig.ports && k8sConfig.ports.length > 0) {
          const service = {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
              name: agentName,
              namespace: namespace,
            },
            spec: {
              selector: {
                app: agentName,
              },
              ports: k8sConfig.servicePorts || [{ port: 80, targetPort: 3000 }],
              type: k8sConfig.serviceType || 'ClusterIP',
            },
          };

          const servicePath = path.join(k8sDir, 'service.yaml');
          fs.writeFileSync(servicePath, yaml.dump(service));
          console.log(chalk.green(`  ✅ Generated service: ${servicePath}`));
          files.push(servicePath);
        }
      } catch (error) {
        console.error(
          chalk.red(`  ❌ Failed to generate Kubernetes manifests: ${error}`)
        );
        throw error;
      }
      break;
    }

    default:
      throw new Error(`Unknown platform: ${platform}`);
  }

  return files;
}
