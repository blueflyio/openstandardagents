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
import * as yaml from 'yaml';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { LangChainAdapter } from '../../adapters/langchain/adapter.js';
import { CrewAIAdapter } from '../../adapters/crewai/adapter.js';
import { TemporalConverter } from '../../adapters/temporal/converter.js';
import { N8NConverter } from '../../adapters/n8n/converter.js';
import { GitLabConverter } from '../../adapters/gitlab/converter.js';
import { GitLabDuoPackageGenerator } from '../../adapters/gitlab/package-generator.js';
import { DockerExporter } from '../../adapters/docker/docker-exporter.js';
import { KubernetesManifestGenerator } from '../../adapters/kubernetes/generator.js';
import { KAgentCRDGenerator } from '../../sdks/kagent/crd-generator.js';
import { LangflowAdapter } from '../../adapters/langflow-adapter.js';
import { registry } from '../../adapters/registry/platform-registry.js';
import { DrupalManifestExporter } from '../../adapters/drupal/manifest-exporter.js';
import { OpenAIAgentsAdapter } from '../../adapters/openai-agents/adapter.js';
import type { OssaAgent } from '../../types/index.js';
import { generatePerfectAgentBundle } from '../../adapters/base/common-file-generator.js';
import { getPlatformsForExport } from '../../data/platform-matrix.js';
import {
  addGlobalOptions,
  addMutationOptions,
  addBackupOptions,
  shouldUseColor,
} from '../utils/standard-options.js';

export const exportCommand = new Command('export')
  .description('Export OSSA manifest to platform-specific format')
  .argument('[manifest]', 'Path to OSSA agent manifest')
  .option(
    '-p, --platform <platform>',
    'Target platform (kagent, langchain, langflow, crewai, symfony, temporal, n8n, gitlab, gitlab-agent, docker, kubernetes, npm, drupal, agent-skills)'
  )
  .option('-o, --output <file>', 'Output file path')
  .option('--format <format>', 'Output format (yaml, json, python)', 'yaml')
  .option(
    '--crd-version <version>',
    'Kagent CRD version (v1alpha1 | v1alpha2). v1alpha2 = Declarative Agent for native kagent installs',
    'v1alpha1'
  )
  .option(
    '--namespace <ns>',
    'Kubernetes/kagent namespace (kagent platform)',
    'kagent'
  )
  .option('--skill', 'Include Claude Skill (SKILL.md) - NPM platform only')
  .option(
    '--perfect-agent',
    'Enable full "perfect agent" export (AGENTS.md, team scaffolding, evals, governance, observability)'
  )
  .option('--include-agent-card', 'Generate .well-known/agent-card.json')
  .option('--include-agents-md', 'Include AGENTS.md team documentation')
  .option('--include-team', 'Include multi-agent team scaffolding')
  .option('--include-evals', 'Include CLEAR framework eval stubs')
  .option('--include-governance', 'Include compliance/policy config')
  .option('--include-observability', 'Include OTel observability config')
  .option(
    '--list-platforms',
    'Show all supported export platforms and their status'
  );

// Add production-grade standard options
addGlobalOptions(exportCommand);
addMutationOptions(exportCommand);
addBackupOptions(exportCommand);

// Add validation skip option
exportCommand.option('--no-validate', 'Skip manifest validation before export');

exportCommand.action(
  async (
    manifestPath: string | undefined,
    options: {
      platform?: string;
      output?: string;
      format: string;
      crdVersion?: string;
      namespace?: string;
      skill?: boolean;
      perfectAgent?: boolean;
      includeTeam?: boolean;
      includeEvals?: boolean;
      includeAgentsMd?: boolean;
      includeAgentCard?: boolean;
      includeGovernance?: boolean;
      includeObservability?: boolean;
      verbose?: boolean;
      quiet?: boolean;
      color?: boolean;
      json?: boolean;
      dryRun?: boolean;
      force?: boolean;
      backup?: boolean;
      backupDir?: string;
      validate?: boolean;
      listPlatforms?: boolean;
    }
  ) => {
    const useColor = shouldUseColor(options);

    // Handle --list-platforms (single source of truth: platform-matrix)
    if (options.listPlatforms) {
      const platforms = getPlatformsForExport();

      console.log(
        useColor
          ? chalk.bold('\nOSSA Export Platforms\n')
          : '\nOSSA Export Platforms\n'
      );

      for (const p of platforms) {
        const statusColor =
          p.status === 'production'
            ? chalk.green
            : p.status === 'beta'
              ? chalk.yellow
              : p.status === 'alpha'
                ? chalk.magenta
                : chalk.gray;
        const statusLabel = useColor
          ? statusColor(`[${p.status}]`)
          : `[${p.status}]`;
        const nameLabel = useColor
          ? chalk.cyan(p.id.padEnd(20))
          : p.id.padEnd(20);
        console.log(
          `  ${nameLabel} ${statusLabel.padEnd(useColor ? 30 : 14)} ${p.description}`
        );
      }

      console.log('');
      return;
    }

    // Validate required args when not listing platforms
    if (!manifestPath) {
      console.error(
        useColor
          ? chalk.red('Error: manifest path is required')
          : 'Error: manifest path is required'
      );
      process.exit(1);
    }

    const hasPerfectAgentOnly =
      !options.platform &&
      (options.perfectAgent ||
        options.includeAgentCard ||
        options.includeAgentsMd ||
        options.includeEvals ||
        options.includeGovernance ||
        options.includeObservability ||
        options.includeTeam);

    if (!options.platform && !hasPerfectAgentOnly) {
      console.error(
        useColor
          ? chalk.red(
              'Error: --platform is required. Use --list-platforms to see available platforms.'
            )
          : 'Error: --platform is required'
      );
      process.exit(1);
    }

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

      // Perfect Agent generation (standalone or appended to platform export)
      const hasPerfectAgentFlags =
        options.perfectAgent ||
        options.includeAgentCard ||
        options.includeAgentsMd ||
        options.includeEvals ||
        options.includeGovernance ||
        options.includeObservability ||
        options.includeTeam;

      if (hasPerfectAgentFlags) {
        const { generatePerfectAgentFiles } =
          await import('../../adapters/base/common-file-generator.js');

        const perfectOpts = {
          includeAgentCard: options.perfectAgent || options.includeAgentCard,
          includeAgentsMd: options.perfectAgent || options.includeAgentsMd,
          includeEvals: options.perfectAgent || options.includeEvals,
          includeGovernance: options.perfectAgent || options.includeGovernance,
          includeObservability:
            options.perfectAgent || options.includeObservability,
          includeSkill: options.perfectAgent || options.skill,
          includeTeam: options.perfectAgent || options.includeTeam,
          platform: options.platform,
        };

        log(
          options.perfectAgent
            ? 'Generating Perfect Agent structure...'
            : 'Generating selected agent artifacts...'
        );

        const perfectFiles = await generatePerfectAgentFiles(
          manifest,
          perfectOpts
        );

        if (perfectFiles.length > 0) {
          const agentName = manifest.metadata?.name || 'agent';
          const outputDir = options.output || `./${agentName}`;

          if (!options.dryRun) {
            for (const file of perfectFiles) {
              const filePath = path.join(outputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }

            logSuccess(
              `\nPerfect Agent artifacts: ${perfectFiles.length} files`
            );
          } else {
            log(
              `\nDRY RUN: Would generate ${perfectFiles.length} Perfect Agent files:`
            );
            for (const file of perfectFiles) {
              logVerbose(`  - ${file.path} (${file.content.length} bytes)`);
            }
          }

          // If no platform specified, we're done
          if (!options.platform || options.platform === 'perfect-agent') {
            return;
          }
        }
      }

      let output: string;
      let defaultExtension: string;

      switch (options.platform) {
        case 'kagent': {
          const agentName = manifest.metadata?.name || 'agent';
          const outputDir = options.output || `./${agentName}-kagent`;
          const useV1Alpha2 =
            (options.crdVersion ?? 'v1alpha1') === 'v1alpha2';
          const kagentOpts = {
            namespace: options.namespace || 'kagent',
          };

          if (useV1Alpha2) {
            log('Generating kagent.dev v1alpha2 Declarative Agent...');
            const kagentGenerator = new KAgentCRDGenerator();
            const { agent, modelConfig } =
              kagentGenerator.generateV1Alpha2(manifest, kagentOpts);

            if (!options.dryRun) {
              fs.mkdirSync(outputDir, { recursive: true });
              fs.writeFileSync(
                path.join(outputDir, 'agent.yaml'),
                yaml.stringify(agent)
              );
              if (modelConfig) {
                fs.writeFileSync(
                  path.join(outputDir, 'model-config.yaml'),
                  yaml.stringify(modelConfig)
                );
              }
              fs.writeFileSync(
                path.join(outputDir, 'agent.ossa.yaml'),
                yaml.stringify(manifest)
              );
              logSuccess(
                `\nkagent.dev v1alpha2 bundle exported to: ${outputDir}`
              );
              log(
                `  agent.yaml${modelConfig ? ', model-config.yaml' : ''}, agent.ossa.yaml`
              );
            } else {
              log(`\nDRY RUN: Would write agent.yaml (v1alpha2) to ${outputDir}`);
            }
            return;
          }

          log('Generating kagent.dev Kubernetes manifest bundle (v1alpha1)...');
          const kagentGenerator = new KAgentCRDGenerator();
          const bundle = kagentGenerator.generateBundle(manifest, kagentOpts);

          if (!options.dryRun) {
            fs.mkdirSync(outputDir, { recursive: true });

            // Write CRD
            fs.writeFileSync(
              path.join(outputDir, 'agent-crd.yaml'),
              yaml.stringify(bundle.crd)
            );

            // Write Deployment
            fs.writeFileSync(
              path.join(outputDir, 'deployment.yaml'),
              yaml.stringify(bundle.deployment)
            );

            // Write Service
            fs.writeFileSync(
              path.join(outputDir, 'service.yaml'),
              yaml.stringify(bundle.service)
            );

            // Write ConfigMap
            fs.writeFileSync(
              path.join(outputDir, 'configmap.yaml'),
              yaml.stringify(bundle.configMap)
            );

            // Write Secret
            fs.writeFileSync(
              path.join(outputDir, 'secret.yaml'),
              yaml.stringify(bundle.secret)
            );

            // Write RBAC
            fs.mkdirSync(path.join(outputDir, 'rbac'), { recursive: true });
            fs.writeFileSync(
              path.join(outputDir, 'rbac/serviceaccount.yaml'),
              yaml.stringify(bundle.serviceAccount)
            );
            fs.writeFileSync(
              path.join(outputDir, 'rbac/role.yaml'),
              yaml.stringify(bundle.role)
            );
            fs.writeFileSync(
              path.join(outputDir, 'rbac/rolebinding.yaml'),
              yaml.stringify(bundle.roleBinding)
            );

            // Write HPA (if present)
            if (bundle.horizontalPodAutoscaler) {
              fs.writeFileSync(
                path.join(outputDir, 'hpa.yaml'),
                yaml.stringify(bundle.horizontalPodAutoscaler)
              );
            }

            // Write NetworkPolicy
            fs.writeFileSync(
              path.join(outputDir, 'networkpolicy.yaml'),
              yaml.stringify(bundle.networkPolicy)
            );

            // Write README
            fs.writeFileSync(path.join(outputDir, 'README.md'), bundle.readme);

            // Write source OSSA manifest for provenance
            fs.writeFileSync(
              path.join(outputDir, 'agent.ossa.yaml'),
              yaml.stringify(manifest)
            );

            logSuccess(
              `\nkagent.dev manifest bundle exported to: ${outputDir}`
            );
            const fileCount = 10 + (bundle.horizontalPodAutoscaler ? 1 : 0);
            log(`  ${fileCount} files generated`);
          } else {
            log(`\nDRY RUN: Would generate kagent bundle in: ${outputDir}`);
          }

          return;
        }

        case 'langchain': {
          log('Generating LangChain agent package (Python + TypeScript)...');

          const langchainAdapter = new LangChainAdapter();
          const langchainResult = await langchainAdapter.export(manifest, {
            validate: true,
          });

          if (!langchainResult.success) {
            throw new Error(langchainResult.error || 'LangChain export failed');
          }

          const langchainOutputDir =
            options.output ||
            `./langchain-${manifest.metadata?.name || 'agent'}`;

          if (!options.dryRun) {
            fs.mkdirSync(langchainOutputDir, { recursive: true });

            for (const file of langchainResult.files) {
              const filePath = path.join(langchainOutputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }

            logSuccess(
              `\nLangChain package exported to: ${langchainOutputDir}`
            );
            log(`  ${langchainResult.files.length} files generated`);

            // Perfect agent supplementary files
            if (
              options.perfectAgent ||
              options.includeTeam ||
              options.includeAgentsMd ||
              options.includeEvals
            ) {
              const perfectFiles = generatePerfectAgentBundle(
                manifest,
                {
                  perfectAgent: options.perfectAgent,
                  includeTeam: options.includeTeam,
                  includeEvals: options.includeEvals,
                  includeAgentsMd: options.includeAgentsMd,
                  includeGovernance: options.includeGovernance,
                  includeObservability: options.includeObservability,
                },
                'langchain'
              );
              for (const file of perfectFiles) {
                const filePath = path.join(langchainOutputDir, file.path);
                const fileDir = path.dirname(filePath);
                fs.mkdirSync(fileDir, { recursive: true });
                fs.writeFileSync(filePath, file.content);
                logVerbose(`  Created: ${file.path}`);
              }
              if (perfectFiles.length > 0) {
                logSuccess(`  + ${perfectFiles.length} perfect agent files`);
              }
            }
          } else {
            log(
              `\nDRY RUN: Would generate ${langchainResult.files.length} files in: ${langchainOutputDir}`
            );
            logVerbose('Files to be created:');
            for (const file of langchainResult.files) {
              logVerbose(`  - ${file.path} (${file.content.length} bytes)`);
            }
          }

          return;
        }

        case 'langflow': {
          log('Exporting OSSA manifest to Langflow flow JSON...');

          const langflowAdapter = registry.getAdapter('langflow');
          if (!langflowAdapter) {
            throw new Error(
              'LangFlow adapter not registered. Ensure initializeAdapters() was called.'
            );
          }

          const langflowResult = await langflowAdapter.export(manifest, {
            validate: options.validate !== false,
            dryRun: options.dryRun,
            outputDir: options.output ? path.dirname(options.output) : '.',
          });

          if (!langflowResult.success) {
            throw new Error(
              langflowResult.error || 'LangFlow export failed'
            );
          }

          const outDir = options.output
            ? path.dirname(options.output)
            : '.';
          const outPath =
            options.output ||
            path.join(
              outDir,
              langflowResult.files[0]?.path ||
                `${(manifest.metadata?.name || 'agent').replace(/[^a-z0-9-_]/gi, '-')}-langflow.json`
            );

          if (!options.dryRun && langflowResult.files.length > 0) {
            const outDirAbs = path.dirname(outPath);
            if (outDirAbs !== '.') fs.mkdirSync(outDirAbs, { recursive: true });
            fs.writeFileSync(
              outPath,
              langflowResult.files[0].content,
              'utf-8'
            );
            logSuccess(`\nLangflow flow exported to: ${outPath}`);
            log(
              useColor
                ? chalk.gray(
                    '  Import in Langflow: Projects > Upload a flow, or drag-and-drop the JSON file.'
                  )
                : '  Import in Langflow: Projects > Upload a flow, or drag-and-drop the JSON file.'
            );
            log(
              useColor
                ? chalk.gray(
                    '  Langflow: https://langflow.blueflyagents.com or http://127.0.0.1:7860'
                  )
                : '  Langflow: https://langflow.blueflyagents.com or http://127.0.0.1:7860'
            );
          } else if (options.dryRun) {
            log(`\nDRY RUN: Would write Langflow JSON to: ${outPath}`);
          }

          if (options.json && langflowResult.files[0]) {
            console.log(
              JSON.stringify(JSON.parse(langflowResult.files[0].content))
            );
          }
          return;
        }

        case 'crewai': {
          log('Generating CrewAI multi-agent package...');

          const crewaiAdapter = new CrewAIAdapter();
          const crewaiResult = await crewaiAdapter.export(manifest, {
            validate: true,
            includeTests: true,
          });

          if (!crewaiResult.success) {
            throw new Error(crewaiResult.error || 'CrewAI export failed');
          }

          const crewaiOutputDir =
            options.output || `./crewai-${manifest.metadata?.name || 'agent'}`;

          if (!options.dryRun) {
            fs.mkdirSync(crewaiOutputDir, { recursive: true });

            for (const file of crewaiResult.files) {
              const filePath = path.join(crewaiOutputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }

            logSuccess(`\nCrewAI package exported to: ${crewaiOutputDir}`);
            log(`  ${crewaiResult.files.length} files generated`);
            log('\n  Package includes:');
            log('  - agents/ (agent definitions)');
            log('  - tasks/ (task definitions)');
            log('  - tools/ (custom tools)');
            log('  - crew/ (orchestration)');
            log('  - examples/ (usage examples)');
            log('  - tests/ (test suite)');
            log('  - README.md, DEPLOYMENT.md');

            // Perfect agent supplementary files
            if (
              options.perfectAgent ||
              options.includeTeam ||
              options.includeAgentsMd ||
              options.includeEvals
            ) {
              const perfectFiles = generatePerfectAgentBundle(
                manifest,
                {
                  perfectAgent: options.perfectAgent,
                  includeTeam: options.includeTeam,
                  includeEvals: options.includeEvals,
                  includeAgentsMd: options.includeAgentsMd,
                  includeGovernance: options.includeGovernance,
                  includeObservability: options.includeObservability,
                },
                'crewai'
              );
              for (const file of perfectFiles) {
                const filePath = path.join(crewaiOutputDir, file.path);
                const fileDir = path.dirname(filePath);
                fs.mkdirSync(fileDir, { recursive: true });
                fs.writeFileSync(filePath, file.content);
                logVerbose(`  Created: ${file.path}`);
              }
              if (perfectFiles.length > 0) {
                logSuccess(`  + ${perfectFiles.length} perfect agent files`);
              }
            }
          } else {
            log(
              `\nDRY RUN: Would generate ${crewaiResult.files.length} files in: ${crewaiOutputDir}`
            );
            logVerbose('Files to be created:');
            for (const file of crewaiResult.files) {
              logVerbose(`  - ${file.path} (${file.content.length} bytes)`);
            }
          }

          return;
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
          log(
            'Generating GitLab Duo agent package (triggers, flows, routers, MCP)...'
          );

          // Use GitLabDuoPackageGenerator for complete 34-file package
          const agentName = manifest.metadata?.name || 'agent';
          const outputDir = options.output || `./${agentName}`;
          const duoGenerator = new GitLabDuoPackageGenerator();
          const result = await duoGenerator.generate(manifest, {
            outputDir: path.dirname(outputDir),
            overwrite: true,
            includeSourceTemplates: true,
          });

          if (!result.success) {
            throw new Error(
              result.errors?.join(', ') ||
                'GitLab Duo package generation failed'
            );
          }

          if (!options.dryRun) {
            logSuccess(
              `✓ GitLab Duo package exported to: ${result.packagePath}`
            );
            log(`  ${result.generatedFiles?.length || 0} files generated`);

            log('\n📦 Package includes:');
            log(
              '  - 7 triggers (mention, assign, reviewer, schedule, pipeline, webhook, file_pattern)'
            );
            log('  - 4 flows (main, error, monitor, governance)');
            log('  - 2 routers (conditional, multi-agent orchestration)');
            log('  - MCP server configuration');
            log('  - 8 documentation files');
            log('  - CI/CD, Docker, source templates');

            log(`\n📚 Documentation: ${result.packagePath}/README.md`);
          } else {
            log(
              `\n🔍 DRY RUN: Would generate ${result.generatedFiles?.length || 0} files in: ${outputDir}`
            );
            logVerbose('Files to be created:');
            for (const file of result.generatedFiles || []) {
              logVerbose(`  - ${file}`);
            }
          }

          return; // Early return to skip single-file write
        }

        case 'docker': {
          log('Generating Docker deployment package...');

          const dockerExporter = new DockerExporter();
          const dockerResult = await dockerExporter.export(manifest);

          if (!dockerResult.success) {
            throw new Error(dockerResult.error || 'Docker export failed');
          }

          const agentName = manifest.metadata?.name || 'agent';
          const dockerOutputDir = options.output || `./${agentName}-docker`;

          if (!options.dryRun) {
            fs.mkdirSync(dockerOutputDir, { recursive: true });

            for (const file of dockerResult.files) {
              const filePath = path.join(dockerOutputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }

            logSuccess(`\nDocker package exported to: ${dockerOutputDir}`);
            log(`  ${dockerResult.files.length} files generated`);
          } else {
            log(
              `\nDRY RUN: Would generate ${dockerResult.files.length} files in: ${dockerOutputDir}`
            );
            logVerbose('Files to be created:');
            for (const file of dockerResult.files) {
              logVerbose(`  - ${file.path} (${file.content.length} bytes)`);
            }
          }

          return;
        }

        case 'kubernetes': {
          log('Generating Kubernetes Kustomize deployment structure...');

          const k8sGenerator = new KubernetesManifestGenerator();
          const kustomizeStructure =
            await k8sGenerator.generateKustomizeStructure(manifest);

          const agentName = manifest.metadata?.name || 'agent';
          const k8sOutputDir = options.output || `./${agentName}-kubernetes`;

          if (!options.dryRun) {
            // Use the generator's built-in write method for proper Kustomize structure
            await k8sGenerator.writeKustomizeStructure(
              kustomizeStructure,
              k8sOutputDir
            );

            // Write source OSSA manifest for provenance
            fs.writeFileSync(
              path.join(k8sOutputDir, 'agent.ossa.yaml'),
              yaml.stringify(manifest)
            );

            logSuccess(
              `\nKubernetes Kustomize package exported to: ${k8sOutputDir}`
            );
            log('  Package includes:');
            log(
              '  - base/ (deployment, service, configmap, secret, kustomization)'
            );
            log('  - rbac/ (serviceaccount, role, rolebinding)');
            log('  - overlays/dev/ (development patches)');
            log('  - overlays/staging/ (staging patches)');
            log(
              '  - overlays/production/ (production patches, HPA, NetworkPolicy)'
            );
            log('  - monitoring/ (ServiceMonitor, Grafana dashboard)');
            log('  - examples/ (deployment, customization)');
            log('  - docs/ (README, DEPLOYMENT)');
          } else {
            log(
              `\nDRY RUN: Would generate Kustomize structure in: ${k8sOutputDir}`
            );
            log(
              '  Directories: base/, rbac/, overlays/{dev,staging,production}/, monitoring/, examples/, docs/'
            );
          }

          return;
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
          const { AgentSkillsExporter } =
            await import('../../adapters/agent-skills/exporter.js');
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
            log(
              `  3. Share on GitHub: https://github.com/anthropics/awesome-agent-skills`
            );
            log(
              `  4. Compatible with 25+ AI tools (OpenAI Codex, Cursor, etc.)`
            );
          } else {
            log('DRY RUN: Would generate:');
            result.files.forEach((file) => log(`  - ${file.path}`));
          }

          return; // Early return to skip single-file write
        }

        case 'symfony': {
          log('Exporting OSSA manifest to Symfony AI Agent (PHP bootstrap)...');

          const symfonyAdapter = registry.getAdapter('symfony');
          if (!symfonyAdapter) {
            throw new Error(
              'Symfony adapter not registered. Ensure initializeAdapters() was called.'
            );
          }

          const symfonyResult = await symfonyAdapter.export(manifest, {
            validate: options.validate !== false,
          });

          if (!symfonyResult.success) {
            throw new Error(
              symfonyResult.error || 'Symfony export failed'
            );
          }

          const symfonyName =
            (manifest.metadata?.name || 'agent')
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '_') || 'ossa_agent';
          const symfonyOutputDir = options.output || `./${symfonyName}`;

          if (!options.dryRun && symfonyResult.files.length > 0) {
            fs.mkdirSync(symfonyOutputDir, { recursive: true });
            for (const file of symfonyResult.files) {
              const filePath = path.join(symfonyOutputDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }
            logSuccess(`\nSymfony AI Agent package exported to: ${symfonyOutputDir}`);
            log(`  ${symfonyResult.files.length} files generated`);
            log('  Run: composer require symfony/ai-agent symfony/ai-platform');
          } else if (options.dryRun) {
            log(`\nDRY RUN: Would generate ${symfonyResult.files.length} files in: ${symfonyOutputDir}`);
            symfonyResult.files.forEach((f) => logVerbose(`  - ${f.path}`));
          }
          return;
        }

        case 'openai-agents-sdk': {
          log('Generating OpenAI Agents SDK package from OSSA manifest...');

          const openaiAdapter = new OpenAIAgentsAdapter();
          const openaiResult = await openaiAdapter.export(manifest, {
            validate: true,
          });

          if (!openaiResult.success) {
            throw new Error(
              openaiResult.error || 'OpenAI Agents SDK export failed'
            );
          }

          const openaiAgentName =
            manifest.metadata?.name
              ?.toLowerCase()
              .replace(/[^a-z0-9-]/g, '-') || 'openai-agent';
          const openaiOutputDir = options.output || openaiAgentName;

          if (!options.dryRun) {
            const fsSync = await import('fs');
            for (const file of openaiResult.files) {
              const filePath = path.join(openaiOutputDir, file.path);
              const dir = path.dirname(filePath);
              if (!fsSync.existsSync(dir)) {
                fsSync.mkdirSync(dir, { recursive: true });
              }
              fsSync.writeFileSync(filePath, file.content);
              log(`  Created: ${filePath}`);
            }
            log(
              `\nOpenAI Agents SDK package generated at: ${openaiOutputDir}/`
            );
            log(
              `Run: cd ${openaiOutputDir} && npm install && npx tsx src/run.ts "Hello"`
            );
          } else {
            log('DRY RUN: Would generate:');
            openaiResult.files.forEach((file) => log(`  - ${file.path}`));
          }

          return; // Early return to skip single-file write
        }

        default:
          throw new Error(`Unsupported platform: ${options.platform}`);
      }

      // Generate perfect agent supplementary files if requested
      if (
        options.perfectAgent ||
        options.includeTeam ||
        options.includeEvals ||
        options.includeAgentsMd ||
        options.includeGovernance ||
        options.includeObservability
      ) {
        const perfectFiles = generatePerfectAgentBundle(manifest, {
          perfectAgent: options.perfectAgent,
          includeTeam: options.includeTeam,
          includeEvals: options.includeEvals,
          includeAgentsMd: options.includeAgentsMd,
          includeGovernance: options.includeGovernance,
          includeObservability: options.includeObservability,
        });

        if (perfectFiles.length > 0) {
          const perfectDir =
            options.output || `./${manifest.metadata?.name || 'agent'}-perfect`;
          if (!options.dryRun) {
            fs.mkdirSync(perfectDir, { recursive: true });
            for (const file of perfectFiles) {
              const filePath = path.join(perfectDir, file.path);
              const fileDir = path.dirname(filePath);
              fs.mkdirSync(fileDir, { recursive: true });
              fs.writeFileSync(filePath, file.content);
              logVerbose(`  Created: ${file.path}`);
            }
            logSuccess(
              `\nPerfect agent files generated: ${perfectFiles.length} files in ${perfectDir}`
            );
          } else {
            log(
              `\nDRY RUN: Would generate ${perfectFiles.length} perfect agent files`
            );
          }
        }
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
        if (!options.json) {
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
        }
      } else {
        fs.writeFileSync(outputPath, output);
        if (!options.json) {
          logSuccess(`✓ Exported to: ${outputPath}`);
          logVerbose(`Output size: ${output.length} bytes`);
        }
      }

      if (options.json) {
        const result = {
          success: true,
          manifest: manifestPath,
          platform: options.platform,
          output: outputPath,
          dryRun: options.dryRun || false,
          size: output.length,
        };
        console.log(JSON.stringify(result, null, options.quiet ? 0 : 2));
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
