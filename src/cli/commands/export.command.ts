/**
 * Export Command
 * Exports OSSA manifest to platform-specific format
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { LangChainConverter } from '../../adapters/langchain/converter.js';
import { CrewAIConverter } from '../../adapters/crewai/converter.js';
import { TemporalConverter } from '../../adapters/temporal/converter.js';
import { N8NConverter } from '../../adapters/n8n/converter.js';
import { GitLabConverter } from '../../adapters/gitlab/converter.js';
import { DockerfileGenerator } from '../../adapters/docker/generators.js';
import { KubernetesManifestGenerator } from '../../adapters/kubernetes/generator.js';
import { KAgentCRDGenerator } from '../../sdks/kagent/crd-generator.js';
import { registry } from '../../adapters/registry/platform-registry.js';
import type { OssaAgent } from '../../types/index.js';

export const exportCommand = new Command('export')
  .description('Export OSSA manifest to platform-specific format')
  .argument('<manifest>', 'Path to OSSA agent manifest')
  .requiredOption(
    '-p, --platform <platform>',
    'Target platform (kagent, langchain, crewai, temporal, n8n, gitlab, docker, kubernetes, npm)'
  )
  .option('-o, --output <file>', 'Output file path')
  .option('--format <format>', 'Output format (yaml, json, python)', 'yaml')
  .option('--skill', 'Include Claude Skill (SKILL.md) - NPM platform only')
  .action(
    async (
      manifestPath: string,
      options: {
        platform: string;
        output?: string;
        format: string;
        skill?: boolean;
      }
    ) => {
      try {
        console.log(chalk.blue(`Exporting agent: ${manifestPath}`));
        console.log(chalk.blue(`Platform: ${options.platform}`));
        console.log(chalk.blue(`Format: ${options.format}\n`));

        // Load manifest
        const manifestRepo = container.get(ManifestRepository);
        const manifest = await manifestRepo.load(manifestPath);

        let output: string;
        let defaultExtension: string;

        switch (options.platform) {
          case 'kagent': {
            const generator = new KAgentCRDGenerator();
            const crd = generator.generate(manifest);
            output =
              options.format === 'json'
                ? JSON.stringify(crd, null, 2)
                : JSON.stringify(crd, null, 2);
            defaultExtension = 'yaml';
            break;
          }

          case 'langchain': {
            const converter = new LangChainConverter();
            if (options.format === 'python') {
              output = converter.generatePythonCode(manifest);
              defaultExtension = 'py';
            } else {
              const config = converter.convert(manifest);
              output = JSON.stringify(config, null, 2);
              defaultExtension = 'json';
            }
            break;
          }

          case 'crewai': {
            const converter = new CrewAIConverter();
            if (options.format === 'python') {
              output = converter.generatePythonCode(manifest);
              defaultExtension = 'py';
            } else {
              const config = converter.convert(manifest);
              output = JSON.stringify(config, null, 2);
              defaultExtension = 'json';
            }
            break;
          }

          case 'temporal': {
            const converter = new TemporalConverter();
            const workflow = { ...manifest } as any;
            if (options.format === 'typescript') {
              output = converter.generateTypeScriptCode(workflow);
              defaultExtension = 'ts';
            } else {
              const config = converter.convert(workflow);
              output = JSON.stringify(config, null, 2);
              defaultExtension = 'json';
            }
            break;
          }

          case 'n8n': {
            const converter = new N8NConverter();
            const workflow = { ...manifest } as any;
            output = converter.generateJSON(workflow);
            defaultExtension = 'json';
            break;
          }

          case 'gitlab': {
            const converter = new GitLabConverter();
            output = converter.generateYAML(manifest);
            defaultExtension = 'yml';
            break;
          }

          case 'docker': {
            const generator = new DockerfileGenerator();
            output = generator.generate(manifest);
            defaultExtension = 'Dockerfile';
            break;
          }

          case 'kubernetes': {
            const generator = new KubernetesManifestGenerator();
            const manifests = generator.generateAll(manifest);
            output = JSON.stringify(manifests, null, 2);
            defaultExtension = 'json';
            break;
          }

          case 'npm': {
            // Use registry adapter for npm export
            const adapter = registry.getAdapter('npm');
            if (!adapter) {
              throw new Error('NPM adapter not registered');
            }

            const result = await adapter.export(manifest, {
              validate: true,
              outputDir: path.dirname(options.output || './npm-package'),
              includeSkill: options.skill || false,
            });

            if (!result.success) {
              throw new Error(result.error || 'NPM export failed');
            }

            // Create output directory
            const outputDir = options.output || `./npm-${manifest.metadata?.name || 'agent'}`;
            fs.mkdirSync(outputDir, { recursive: true });

            // Write all generated files
            for (const file of result.files) {
              const filePath = path.join(outputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
            }

            console.log(chalk.green(`✓ NPM package exported to: ${outputDir}`));
            console.log(chalk.gray(`  Files: ${result.files.map(f => f.path).join(', ')}`));
            if (options.skill) {
              console.log(chalk.green(`✓ Claude Skill included: SKILL.md`));
            }
            return; // Early return to skip single-file write
          }

          default:
            throw new Error(`Unsupported platform: ${options.platform}`);
        }

        // Determine output file
        const outputFile =
          options.output ||
          `${manifest.metadata?.name || 'agent'}.${defaultExtension}`;
        const outputPath = path.resolve(outputFile);

        // Write output
        fs.writeFileSync(outputPath, output);

        console.log(chalk.green(`✓ Exported to: ${outputPath}`));
      } catch (error) {
        console.error(
          chalk.red(
            `Export failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );
