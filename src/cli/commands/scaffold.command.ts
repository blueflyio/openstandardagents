/**
 * OSSA Scaffold Command
 *
 * Scaffold complete agent structure with all required files and directories.
 *
 * Creates:
 * - .agents/{agent-name}/manifest.ossa.yaml
 * - .agents/{agent-name}/prompts/ (optional)
 * - .agents/{agent-name}/tools/ (optional)
 * - .agents/{agent-name}/README.md
 *
 * DRY: Uses existing services (GenerationService, ManifestRepository)
 * SOLID: Single responsibility - only scaffolds structure
 *
 * @module commands/scaffold.command
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { fileURLToPath } from 'url';
import { container } from '../../di-container.js';
import { GenerationService } from '../../services/generation.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { getApiVersion } from '../../utils/version.js';
import { handleCommandError } from '../utils/index.js';
import {
  getDefaultAgentVersion,
  getDefaultAgentType,
  getDefaultLLMProvider,
  getDefaultLLMModel,
  getDefaultAgentKind,
  getDefaultScaffoldName,
  getDefaultOutputDir,
  getDefaultRoleTemplate,
  getDefaultDescriptionTemplate,
  getAgentTypeConfigs,
  getDNS1123Regex,
} from '../../config/defaults.js';
import type { OssaAgent } from '../../types/index.js';

export const scaffoldCommand = new Command('scaffold')
  .description('Scaffold complete agent structure with all required files')
  .argument('[name]', 'Agent name/identifier')
  .option('-d, --description <desc>', 'Agent description')
  .option('-r, --role <role>', 'Agent role/system prompt')
  .option(
    '-t, --type <type>',
    'Agent type (worker, orchestrator, judge, etc.)',
    getDefaultAgentType()
  )
  .option(
    '-p, --platform <platform>',
    'Platform template (drupal, gitlab, kubernetes, cursor, langflow)'
  )
  .option('-o, --output <dir>', 'Output directory', getDefaultOutputDir())
  .option('--with-prompts', 'Create prompts/ directory')
  .option('--with-tools', 'Create tools/ directory')
  .option('--with-readme', 'Create README.md')
  .option('-y, --yes', 'Use defaults without prompting')
  .action(
    async (
      name?: string,
      options?: {
        description?: string;
        role?: string;
        type?: string;
        platform?: string;
        output?: string;
        withPrompts?: boolean;
        withTools?: boolean;
        withReadme?: boolean;
        yes?: boolean;
      }
    ) => {
      try {
        const cwd = process.cwd();
        const outputDir = path.resolve(
          cwd,
          options?.output || getDefaultOutputDir()
        );

        // Get agent name
        let agentName = name;
        if (!agentName) {
          if (options?.yes) {
            agentName = getDefaultScaffoldName();
          } else {
            const readline = await import('readline');
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });
            const question = (q: string): Promise<string> =>
              new Promise((resolve) => rl.question(q, resolve));

            agentName = await question(
              chalk.blue('Agent ID (DNS-1123 format): ')
            );
            rl.close();
          }
        }

        if (!agentName) {
          console.log(chalk.red('✗ Agent name is required'));
          process.exit(1);
        }

        // Validate agent name (DNS-1123)
        if (!getDNS1123Regex().test(agentName)) {
          console.log(
            chalk.red(
              '✗ Agent name must be DNS-1123 compliant (lowercase alphanumeric with hyphens)'
            )
          );
          process.exit(1);
        }

        const agentDir = path.join(outputDir, agentName);
        const manifestPath = path.join(agentDir, 'manifest.ossa.yaml');

        // Check if agent already exists
        if (fs.existsSync(agentDir)) {
          console.log(
            chalk.yellow(`⚠ Agent directory already exists: ${agentDir}`)
          );
          console.log(
            chalk.gray('  Use a different name or remove existing directory')
          );
          process.exit(1);
        }

        console.log(chalk.blue(`Scaffolding agent: ${agentName}`));
        if (options?.platform) {
          console.log(chalk.gray(`  Platform: ${options.platform}`));
        }
        console.log(chalk.gray('─'.repeat(50)));

        // Create agent directory
        fs.mkdirSync(agentDir, { recursive: true });
        console.log(chalk.gray(`  Created ${agentDir}/`));

        // Get services
        const generationService = container.get(GenerationService);
        const manifestRepo = container.get(ManifestRepository);

        // Load platform template if specified
        let manifest: OssaAgent;
        if (options?.platform) {
          // Resolve templates directory from package root (works in both src and dist)
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          // Go up from dist/cli/commands or src/cli/commands to package root
          const packageRoot = path.resolve(__dirname, '../../../..');
          const platformTemplatesDir = path.join(
            packageRoot,
            'templates/platforms'
          );
          const platformDir = path.join(
            platformTemplatesDir,
            options.platform.toLowerCase()
          );

          // Determine agent type based on platform
          let agentTypeForPlatform = 'worker';
          if (options.platform === 'drupal') agentTypeForPlatform = 'content-agent';
          else if (options.platform === 'gitlab') agentTypeForPlatform = 'ci-agent';
          else if (options.platform === 'kubernetes') agentTypeForPlatform = 'operator-agent';
          else if (options.platform === 'cursor') agentTypeForPlatform = 'code-assistant';
          else if (options.platform === 'langflow') agentTypeForPlatform = 'workflow-agent';

          const templatePath = path.join(
            platformDir,
            agentTypeForPlatform,
            'manifest.ossa.yaml'
          );

          if (fs.existsSync(templatePath)) {
            const templateContent = fs.readFileSync(templatePath, 'utf-8');
            const templateManifest = yaml.parse(
              templateContent.replace(/\$\{AGENT_NAME\}/g, agentName)
            ) as OssaAgent;
            manifest = templateManifest;
            console.log(
              chalk.gray(`  Loaded platform template: ${options.platform}/${agentTypeForPlatform}`)
            );
          } else {
            console.log(
              chalk.yellow(
                `  ⚠ Platform template not found: ${templatePath}, using default`
              )
            );
            manifest = createDefaultManifest(agentName, options);
          }
        } else {
          manifest = createDefaultManifest(agentName, options);
        }

        // Helper function to create default manifest
        function createDefaultManifest(
          agentName: string,
          opts?: typeof options
        ): OssaAgent {
          const agentType = opts?.type || getDefaultAgentType();
          const typeConfigs = getAgentTypeConfigs();
          const typeConfig =
            typeConfigs[agentType] || typeConfigs[getDefaultAgentType()];

          const defaultManifest: OssaAgent = {
            apiVersion: getApiVersion(),
            kind: getDefaultAgentKind(),
            metadata: {
              name: agentName,
              version: getDefaultAgentVersion(),
              description:
                opts?.description || getDefaultDescriptionTemplate(agentName),
            },
            spec: {
              role: opts?.role || getDefaultRoleTemplate(agentName),
              llm: {
                provider: getDefaultLLMProvider(),
                model: getDefaultLLMModel(),
              },
              tools: [],
            },
          };

          // Add type-specific configuration via tools
          if (typeConfig.capabilityName && defaultManifest.spec) {
            defaultManifest.spec.tools = defaultManifest.spec.tools || [];
            defaultManifest.spec.tools.push({
              type: 'capability',
              name: typeConfig.capabilityName,
            });
          }

          return defaultManifest;
        }

        // Save manifest
        await manifestRepo.save(manifestPath, manifest);
        console.log(chalk.gray(`  Created manifest.ossa.yaml`));

        // Create prompts directory
        if (options?.withPrompts) {
          const promptsDir = path.join(agentDir, 'prompts');
          fs.mkdirSync(promptsDir, { recursive: true });
          fs.writeFileSync(
            path.join(promptsDir, '.gitkeep'),
            '# Agent prompts directory\n'
          );
          console.log(chalk.gray(`  Created prompts/`));
        }

        // Create complete folder structure using service
        const { AgentsFolderService } =
          await import('../../services/structure/agents-folder.service.js');
        const structureService = new AgentsFolderService();
        const structureBasePath = options?.output || getDefaultOutputDir();
        const structure = structureService.generateStructure(
          agentName,
          structureBasePath
        );

        // Create structure
        structureService.createStructure(structure, false);
        console.log(chalk.gray(`  Created complete folder structure`));

        // Create tools directory (legacy support)
        if (options?.withTools) {
          const toolsDir = path.join(agentDir, 'tools');
          if (!fs.existsSync(toolsDir)) {
            fs.mkdirSync(toolsDir, { recursive: true });
            fs.writeFileSync(
              path.join(toolsDir, '.gitkeep'),
              '# Agent-specific tools directory\n'
            );
            console.log(chalk.gray(`  Created tools/`));
          }
        }

        // Create README (default: true, unless explicitly disabled)
        const shouldCreateReadme =
          options?.withReadme !== undefined ? options.withReadme : true;
        if (shouldCreateReadme) {
          const readmePath = path.join(agentDir, 'README.md');
          const agentType = options?.type || getDefaultAgentType();
          const readmeContent = `# ${agentName}

${options?.description || getDefaultDescriptionTemplate(agentName)}

## Overview

This agent is defined using the OSSA (Open Standard for Scalable AI Agents) specification.
${options?.platform ? `\n**Platform**: ${options.platform}` : ''}

## Manifest

- **Manifest**: \`manifest.ossa.yaml\`
- **Version**: ${manifest.metadata?.version || 'unknown'}
- **Type**: ${agentType}

## Usage

\`\`\`bash
# Validate manifest
ossa validate ${manifestPath}

# Generate documentation
ossa agents-md
\`\`\`

## Structure

\`\`\`
${agentName}/
├── manifest.ossa.yaml    # OSSA manifest (required)
${options?.withPrompts ? '├── prompts/              # Agent prompts (optional)\n' : ''}${options?.withTools ? '├── tools/                # Agent-specific tools (optional)\n' : ''}└── README.md             # This file
\`\`\`
`;
          fs.writeFileSync(readmePath, readmeContent);
          console.log(chalk.gray(`  Created README.md`));
        }

        console.log('');
        console.log(chalk.green(`✓ Agent scaffolded successfully`));
        console.log('');
        console.log(chalk.blue('Next steps:'));
        console.log(chalk.gray(`  1. Edit ${manifestPath} to customize agent`));
        console.log(
          chalk.gray(`  2. Run \`ossa validate ${manifestPath}\` to validate`)
        );
        console.log(
          chalk.gray(
            `  3. Run \`ossa workspace discover\` to register in workspace`
          )
        );

        process.exit(0);
      } catch (error) {
        handleCommandError(error);
      }
    }
  );
