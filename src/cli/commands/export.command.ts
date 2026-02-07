/**
 * Export Command (Production-Grade)
 * Exports OSSA manifest to platform-specific format
 *
 * Features:
 * - Dry-run mode (preview without writing files)
 * - Verbose/quiet output modes
 * - JSON output for automation
 * - Force mode (skip confirmations)
 * - Backup before overwrite
 * - CI/CD optimized (no color in CI)
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { LangChainConverter } from '../../adapters/langchain/converter.js';
import { LangChainExporter } from '../../services/export/langchain/langchain-exporter.js';
import { CrewAIConverter } from '../../adapters/crewai/converter.js';
import { TemporalConverter } from '../../adapters/temporal/converter.js';
import { N8NConverter } from '../../adapters/n8n/converter.js';
import { GitLabConverter } from '../../adapters/gitlab/converter.js';
import { GitLabAgentGenerator } from '../../adapters/gitlab/agent-generator.js';
import { DockerfileGenerator } from '../../adapters/docker/generators.js';
import { KubernetesManifestGenerator } from '../../adapters/kubernetes/generator.js';
import { KAgentCRDGenerator } from '../../sdks/kagent/crd-generator.js';
import { registry } from '../../adapters/registry/platform-registry.js';
import { DrupalManifestExporter } from '../../adapters/drupal/manifest-exporter.js';
import type { OssaAgent } from '../../types/index.js';
import {
  addGlobalOptions,
  addMutationOptions,
  addPlatformOptions,
  shouldUseColor,
} from '../utils/standard-options.js';

export const exportCommand = new Command('export')
  .description('Export OSSA manifest to platform-specific format')
  .argument('<manifest>', 'Path to OSSA agent manifest')
  .requiredOption(
    '-p, --platform <platform>',
    'Target platform (kagent, langchain, crewai, temporal, n8n, gitlab, gitlab-agent, docker, kubernetes, npm, drupal, agent-skills)'
  )
  .option('-o, --output <file>', 'Output file path')
  .option('--format <format>', 'Output format (yaml, json, python)', 'yaml')
  .option('--skill', 'Include Claude Skill (SKILL.md) - NPM platform only');

// Add production-grade standard options
addGlobalOptions(exportCommand);
addMutationOptions(exportCommand);

exportCommand.action(
  async (
    manifestPath: string,
    options: {
      platform: string;
      output?: string;
      format: string;
      skill?: boolean;
      verbose?: boolean;
      quiet?: boolean;
      color?: boolean;
      json?: boolean;
      dryRun?: boolean;
      force?: boolean;
      backup?: boolean;
      backupDir?: string;
    }
  ) => {
    const useColor = shouldUseColor(options);
    try {
      // Logging helpers
      const log = (msg: string) => {
        if (options.quiet) return;
        console.log(useColor ? chalk.blue(msg) : msg);
      };

      const logVerbose = (msg: string) => {
        if (!options.verbose || options.quiet) return;
        console.log(useColor ? chalk.gray(msg) : msg);
      };

      const logSuccess = (msg: string) => {
        if (options.quiet) return;
        console.log(useColor ? chalk.green(msg) : msg);
      };

      // Dry-run mode
      if (options.dryRun) {
        log('🔍 DRY RUN MODE - No files will be written');
      }

      log(`Exporting agent: ${manifestPath}`);
      log(`Platform: ${options.platform}`);
      log(`Format: ${options.format}\n`);

      logVerbose(`Verbose mode enabled`);
      logVerbose(`Color: ${useColor ? 'enabled' : 'disabled'}`);

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
          // Use comprehensive LangChain exporter for full Python package
          if (options.format === 'python') {
            const exporter = new LangChainExporter();
            const result = await exporter.export(manifest, {
              includeApi: true,
              includeOpenApi: true,
              includeDocker: true,
              includeTests: true,
            });

            if (!result.success) {
              throw new Error(result.error || 'LangChain export failed');
            }

            // Create output directory
            const outputDir =
              options.output ||
              `./langchain-${manifest.metadata?.name || 'agent'}`;
            fs.mkdirSync(outputDir, { recursive: true });

            // Write all generated files
            for (const file of result.files) {
              const filePath = path.join(outputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
            }

            logSuccess(`✓ LangChain Python package exported to: ${outputDir}`);
            logVerbose(
              `  Files: ${result.files.map((f) => f.path).join(', ')}`
            );
            logVerbose(`  Python version: ${result.metadata?.pythonVersion}`);
            logVerbose(
              `  LangChain version: ${result.metadata?.langchainVersion}`
            );
            logVerbose(`  Tools: ${result.metadata?.toolsCount}`);
            return; // Early return to skip single-file write
          } else {
            // Simple JSON export for non-Python format
            const converter = new LangChainConverter();
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

        case 'gitlab-agent': {
          log('Generating GitLab agent package with webhook handlers...');

          // Use GitLabAgentGenerator for complete agent package
          const generator = new GitLabAgentGenerator();
          const result = await generator.generate(manifest);

          if (!result.success) {
            throw new Error(result.error || 'GitLab agent generation failed');
          }

          // Create output directory
          const agentName = manifest.metadata?.name || 'agent';
          const outputDir = options.output || `./${agentName}`;

          if (!options.dryRun) {
            fs.mkdirSync(outputDir, { recursive: true });

            // Write all generated files
            for (const file of result.files) {
              const filePath = path.join(outputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }

            logSuccess(`✓ GitLab agent exported to: ${outputDir}`);
            logVerbose(`  Files: ${result.files.length} files generated`);
            logVerbose(`  Agent: ${agentName}`);
            logVerbose(
              `  Has webhook: ${result.metadata?.hasWebhook ? 'Yes' : 'No'}`
            );
            logVerbose(`  Has LLM: ${result.metadata?.hasLLM ? 'Yes' : 'No'}`);
            logVerbose(`  Tools: ${result.metadata?.toolsCount || 0}`);

            log('\n📦 Installation instructions:');
            log(`  1. Install dependencies: cd ${outputDir} && npm install`);
            log(
              `  2. Configure environment: cp .env.example .env && edit .env`
            );
            log(`  3. Build agent: npm run build`);
            log(`  4. Run agent: npm start\n`);
            log('🐳 Docker deployment:');
            log(`  docker build -t ${agentName} ${outputDir}`);
            log(
              `  docker run -p 9090:9090 --env-file ${outputDir}/.env ${agentName}\n`
            );
            log('📚 Documentation:');
            log(`  README: ${outputDir}/README.md`);
            if (result.metadata?.hasWebhook) {
              log(`  Webhook config: ${outputDir}/webhook-config.json`);
            }
          } else {
            log(
              `\n🔍 DRY RUN: Would generate ${result.files.length} files in: ${outputDir}`
            );
            logVerbose('Files to be created:');
            for (const file of result.files) {
              logVerbose(`  - ${file.path} (${file.content.length} bytes)`);
            }
          }

          return; // Early return to skip single-file write
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
          const outputDir =
            options.output || `./npm-${manifest.metadata?.name || 'agent'}`;
          fs.mkdirSync(outputDir, { recursive: true });

          // Write all generated files
          for (const file of result.files) {
            const filePath = path.join(outputDir, file.path);
            const fileDir = path.dirname(filePath);
            fs.mkdirSync(fileDir, { recursive: true });
            fs.writeFileSync(filePath, file.content);
          }

          console.log(chalk.green(`✓ NPM package exported to: ${outputDir}`));
          console.log(
            chalk.gray(`  Files: ${result.files.map((f) => f.path).join(', ')}`)
          );
          if (options.skill) {
            console.log(chalk.green(`✓ Claude Skill included: SKILL.md`));
          }
          return; // Early return to skip single-file write
        }

        case 'drupal': {
          log(
            'Generating OSSA manifest package for Drupal (import via ai_agents_ossa)...'
          );

          // Use DrupalManifestExporter for minimal manifest package
          // Drupal integration is handled by contrib modules:
          //   drupal/ai_agents, drupal/ai_agents_ossa, drupal/eca, drupal/charts
          const exporter = new DrupalManifestExporter();
          const result = await exporter.export(manifest, {
            validate: true,
          });

          if (!result.success) {
            throw new Error(result.error || 'Drupal manifest export failed');
          }

          // Create output directory
          const agentName =
            manifest.metadata?.name
              ?.toLowerCase()
              .replace(/[^a-z0-9_]/g, '_') || 'ossa_agent';
          const outputDir = options.output || `./${agentName}`;

          if (!options.dryRun) {
            fs.mkdirSync(outputDir, { recursive: true });

            // Write all generated files
            for (const file of result.files) {
              const filePath = path.join(outputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }

            logSuccess(`\nDrupal manifest package exported to: ${outputDir}`);
            logVerbose(`  Files: ${result.files.length} files generated`);
            logVerbose(`  Agent name: ${agentName}`);
            log('\nInstallation instructions:');
            log(
              `  1. Install contrib: composer require drupal/ai_agents drupal/ai_agents_ossa drupal/eca drupal/charts`
            );
            log(
              `  2. Enable modules: drush en ai_agents ai_agents_ossa eca charts`
            );
            log(
              `  3. Import manifest: drush ai-agents:import ${agentName}/agent.ossa.yaml`
            );
            log(`  4. Configure at: /admin/config/ai/agents\n`);
            log('Documentation:');
            log(`  README: ${agentName}/README.md`);
            log(`  Quick start: ${agentName}/INSTALL.txt`);
          } else {
            log(
              `\nDRY RUN: Would generate ${result.files.length} files in: ${outputDir}`
            );
            logVerbose('Files to be created:');
            for (const file of result.files) {
              logVerbose(`  - ${file.path} (${file.content.length} bytes)`);
            }
          }

          return; // Early return to skip single-file write
        }

        case 'agent-skills': {
          log('Generating Agent Skills package (SKILL.md format)...');

          // Use AgentSkillsExporter for complete skills package
          const { AgentSkillsExporter } = await import('../../adapters/agent-skills/exporter.js');
          const exporter = new AgentSkillsExporter();
          const result = await exporter.export(manifest, {
            includeScripts: true,
            includeReferences: true,
            includeAssets: false,
          });

          if (!result.success) {
            throw new Error(result.error || 'Agent Skills export failed');
          }

          // Create output directory
          const skillName = manifest.metadata?.name || 'agent-skill';
          const outputDir = options.output || `./${skillName}`;

          if (!options.dryRun) {
            fs.mkdirSync(outputDir, { recursive: true });

            // Write all generated files
            for (const file of result.files) {
              const filePath = path.join(outputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }

            logSuccess(`✓ Agent Skills package exported to: ${outputDir}`);
            logVerbose(`  Files: ${result.files.length} files generated`);
            logVerbose(`  Skill name: ${skillName}`);
            logVerbose(`  Version: ${result.metadata?.version}`);
            logVerbose(`  Tools: ${result.metadata?.toolsCount || 0}`);

            log('\n📦 Usage instructions:');
            log(`  1. Review SKILL.md in ${outputDir}/`);
            log(`  2. Use with Claude Code: claude --skill ${skillName}`);
            log(`  3. Share on GitHub: https://github.com/anthropics/awesome-agent-skills`);
            log(`  4. Compatible with 25+ AI tools (OpenAI Codex, Cursor, etc.)`);
          } else {
            log('DRY RUN: Would generate:');
            result.files.forEach(file => log(`  - ${file.path}`));
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

      // Backup existing file if requested
      if (!options.dryRun && options.backup && fs.existsSync(outputPath)) {
        const backupDir = options.backupDir || './backups';
        fs.mkdirSync(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(
          backupDir,
          `${path.basename(outputFile)}.${timestamp}.bak`
        );
        fs.copyFileSync(outputPath, backupPath);
        logVerbose(`Backup created: ${backupPath}`);
      }

      // Write output (or simulate if dry-run)
      if (options.dryRun) {
        log(`\n📄 Would write to: ${outputPath}`);
        logVerbose(`Output size: ${output.length} bytes`);
        if (options.verbose) {
          log('\n--- Preview (first 500 chars) ---');
          console.log(output.substring(0, 500));
          if (output.length > 500) {
            console.log('...');
          }
          log('--- End Preview ---\n');
        }
      } else {
        fs.writeFileSync(outputPath, output);
        logSuccess(`✓ Exported to: ${outputPath}`);
        logVerbose(`Output size: ${output.length} bytes`);
      }

      // JSON output for automation
      if (options.json) {
        const result = {
          success: true,
          manifest: manifestPath,
          platform: options.platform,
          output: outputPath,
          dryRun: options.dryRun || false,
          size: output.length,
        };
        console.log(JSON.stringify(result, null, 2));
      }
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
