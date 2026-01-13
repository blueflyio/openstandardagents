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
  .option('-t, --type <type>', 'Agent type (worker, orchestrator, judge, etc.)', getDefaultAgentType())
  .option('-o, --output <dir>', 'Output directory', getDefaultOutputDir())
  .option('--with-prompts', 'Create prompts/ directory')
  .option('--with-tools', 'Create tools/ directory')
  .option('--with-readme', 'Create README.md')
  .option('-y, --yes', 'Use defaults without prompting')
  .action(async (name?: string, options?: {
    description?: string;
    role?: string;
    type?: string;
    output?: string;
    withPrompts?: boolean;
    withTools?: boolean;
    withReadme?: boolean;
    yes?: boolean;
  }) => {
    try {
      const cwd = process.cwd();
      const outputDir = path.resolve(cwd, options?.output || getDefaultOutputDir());

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
          
          agentName = await question(chalk.blue('Agent ID (DNS-1123 format): '));
          rl.close();
        }
      }

      if (!agentName) {
        console.log(chalk.red('✗ Agent name is required'));
        process.exit(1);
      }

      // Validate agent name (DNS-1123)
      if (!getDNS1123Regex().test(agentName)) {
        console.log(chalk.red('✗ Agent name must be DNS-1123 compliant (lowercase alphanumeric with hyphens)'));
        process.exit(1);
      }

      const agentDir = path.join(outputDir, agentName);
      const manifestPath = path.join(agentDir, 'manifest.ossa.yaml');

      // Check if agent already exists
      if (fs.existsSync(agentDir)) {
        console.log(chalk.yellow(`⚠ Agent directory already exists: ${agentDir}`));
        console.log(chalk.gray('  Use a different name or remove existing directory'));
        process.exit(1);
      }

      console.log(chalk.blue(`Scaffolding agent: ${agentName}`));
      console.log(chalk.gray('─'.repeat(50)));

      // Create agent directory
      fs.mkdirSync(agentDir, { recursive: true });
      console.log(chalk.gray(`  Created ${agentDir}/`));

      // Get services
      const generationService = container.get(GenerationService);
      const manifestRepo = container.get(ManifestRepository);

      // Generate manifest
      const agentType = options?.type || getDefaultAgentType();
      const typeConfigs = getAgentTypeConfigs();
      const typeConfig = typeConfigs[agentType] || typeConfigs[getDefaultAgentType()];

      const manifest: OssaAgent = {
        apiVersion: getApiVersion(),
        kind: getDefaultAgentKind(),
        metadata: {
          name: agentName,
          version: getDefaultAgentVersion(),
          description: options?.description || getDefaultDescriptionTemplate(agentName),
        },
        spec: {
          role: options?.role || getDefaultRoleTemplate(agentName),
          llm: {
            provider: getDefaultLLMProvider(),
            model: getDefaultLLMModel(),
          },
          tools: [],
        },
      };

      // Add type-specific configuration via tools
      if (typeConfig.capabilityName && manifest.spec) {
        manifest.spec.tools = manifest.spec.tools || [];
        manifest.spec.tools.push({
          type: 'capability',
          name: typeConfig.capabilityName,
        });
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

      // Create tools directory
      if (options?.withTools) {
        const toolsDir = path.join(agentDir, 'tools');
        fs.mkdirSync(toolsDir, { recursive: true });
        fs.writeFileSync(
          path.join(toolsDir, '.gitkeep'),
          '# Agent-specific tools directory\n'
        );
        console.log(chalk.gray(`  Created tools/`));
      }

      // Create README (default: true, unless explicitly disabled)
      const shouldCreateReadme = options?.withReadme !== undefined ? options.withReadme : true;
      if (shouldCreateReadme) {
        const readmePath = path.join(agentDir, 'README.md');
        const readmeContent = `# ${agentName}

${options?.description || getDefaultDescriptionTemplate(agentName)}

## Overview

This agent is defined using the OSSA (Open Standard for Scalable AI Agents) specification.

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
      console.log(chalk.gray(`  2. Run \`ossa validate ${manifestPath}\` to validate`));
      console.log(chalk.gray(`  3. Run \`ossa workspace discover\` to register in workspace`));

      process.exit(0);
    } catch (error) {
      handleCommandError(error);
    }
  });
