/**
 * OSSA Agent Create Command
 * Create new OSSA agent manifests from templates
 *
 * Features:
 * - Interactive prompts for agent metadata
 * - Template-based manifest generation
 * - OSSA v0.3.6 compliant output
 * - Directory structure scaffolding
 *
 * Follows DRY, SOLID, Zod validation principles
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { z } from 'zod';
import { getApiVersion } from '../../utils/version.js';
import { handleCommandError } from '../utils/index.js';
import type { OssaAgent } from '../../types/index.js';

/**
 * Zod schemas for input validation
 */
const AgentNameSchema = z
  .string()
  .min(1)
  .max(63)
  .regex(
    /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
    'Agent name must be DNS-1123 compliant (lowercase alphanumeric with hyphens)'
  );

const AgentVersionSchema = z
  .string()
  .regex(
    /^v?\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/,
    'Version must be semantic version format (e.g., v1.0.0 or 1.0.0)'
  );

const AgentTypeSchema = z.enum([
  'worker',
  'orchestrator',
  'judge',
  'critic',
  'monitor',
  'integrator',
  'governor',
]);

const AgentOutputDirSchema = z.string().min(1);

/**
 * Agent creation options
 */
interface AgentCreateOptions {
  name?: string;
  description?: string;
  version?: string;
  type?: string;
  author?: string;
  outputDir?: string;
  interactive?: boolean;
  dryRun?: boolean;
}

/**
 * Interactive prompts for agent metadata
 */
async function promptForAgentDetails(
  options: AgentCreateOptions
): Promise<{
  name: string;
  description: string;
  version: string;
  type: string;
  author: string;
  capabilities: string[];
  llmProvider: string;
  llmModel: string;
}> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Agent name (DNS-1123 compliant):',
      default: options.name,
      when: () => !options.name,
      validate: (input: string) => {
        try {
          AgentNameSchema.parse(input);
          return true;
        } catch (error) {
          return 'Invalid agent name. Use lowercase alphanumeric with hyphens.';
        }
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Agent description:',
      default: options.description || 'A new OSSA-compliant agent',
      when: () => !options.description,
    },
    {
      type: 'input',
      name: 'version',
      message: 'Agent version:',
      default: options.version || 'v1.0.0',
      when: () => !options.version,
      validate: (input: string) => {
        try {
          AgentVersionSchema.parse(input);
          return true;
        } catch (error) {
          return 'Invalid version. Use semantic versioning (e.g., v1.0.0).';
        }
      },
    },
    {
      type: 'list',
      name: 'type',
      message: 'Agent type:',
      choices: [
        { name: 'Worker - Executes specific tasks', value: 'worker' },
        {
          name: 'Orchestrator - Coordinates multiple agents',
          value: 'orchestrator',
        },
        { name: 'Judge - Evaluates and scores outputs', value: 'judge' },
        { name: 'Critic - Reviews and provides feedback', value: 'critic' },
        {
          name: 'Monitor - Observes and reports on systems',
          value: 'monitor',
        },
        {
          name: 'Integrator - Connects different systems',
          value: 'integrator',
        },
        {
          name: 'Governor - Enforces policies and compliance',
          value: 'governor',
        },
      ],
      default: options.type || 'worker',
      when: () => !options.type,
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author/Team name:',
      default: options.author || process.env.USER || 'OSSA Community',
      when: () => !options.author,
    },
    {
      type: 'checkbox',
      name: 'capabilities',
      message: 'Select capabilities (use spacebar to select):',
      choices: [
        { name: 'Data Processing', value: 'data-processing', checked: true },
        { name: 'API Integration', value: 'api-integration' },
        { name: 'File Operations', value: 'file-operations' },
        { name: 'Database Operations', value: 'database-operations' },
        { name: 'Message Queue', value: 'message-queue' },
        { name: 'Workflow Execution', value: 'workflow-execution' },
        { name: 'Monitoring', value: 'monitoring' },
        { name: 'Security Scanning', value: 'security-scanning' },
      ],
    },
    {
      type: 'list',
      name: 'llmProvider',
      message: 'LLM Provider:',
      choices: [
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic', value: 'anthropic' },
        { name: 'Google Gemini', value: 'google' },
        { name: 'AWS Bedrock', value: 'aws-bedrock' },
        { name: 'Azure OpenAI', value: 'azure-openai' },
        { name: 'Local (Ollama)', value: 'ollama' },
      ],
      default: 'openai',
    },
    {
      type: 'list',
      name: 'llmModel',
      message: 'LLM Model:',
      choices: (answers: { llmProvider: string }) => {
        const modelsByProvider: Record<string, string[]> = {
          openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          anthropic: [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
          ],
          google: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
          'aws-bedrock': [
            'anthropic.claude-3-5-sonnet-20241022-v2:0',
            'anthropic.claude-3-5-haiku-20241022-v1:0',
          ],
          'azure-openai': ['gpt-4o', 'gpt-4-turbo', 'gpt-35-turbo'],
          ollama: ['llama3.1', 'mistral', 'codellama', 'phi3'],
        };
        return modelsByProvider[answers.llmProvider] || ['gpt-4o'];
      },
    },
  ]);

  return {
    name: options.name || answers.name,
    description: options.description || answers.description,
    version: options.version || answers.version,
    type: options.type || answers.type,
    author: options.author || answers.author,
    capabilities: answers.capabilities || ['data-processing'],
    llmProvider: answers.llmProvider,
    llmModel: answers.llmModel,
  };
}

/**
 * Generate OSSA agent manifest from template
 */
function generateAgentManifest(details: {
  name: string;
  description: string;
  version: string;
  type: string;
  author: string;
  capabilities: string[];
  llmProvider: string;
  llmModel: string;
}): OssaAgent {
  const apiVersion = getApiVersion();

  // Determine role based on type
  const rolesByType: Record<string, string> = {
    worker:
      'Execute specific tasks with high performance and reliability. Process data, perform operations, and report results.',
    orchestrator:
      'Coordinate multiple agents and workflows. Delegate tasks, manage dependencies, and ensure completion.',
    judge:
      'Evaluate and score outputs from other agents. Provide objective assessments and quality metrics.',
    critic:
      'Review agent outputs and provide constructive feedback. Identify improvements and best practices.',
    monitor:
      'Observe system health and performance. Track metrics, detect anomalies, and trigger alerts.',
    integrator:
      'Connect different systems and platforms. Transform data, handle protocols, and ensure compatibility.',
    governor:
      'Enforce policies and compliance rules. Validate actions, audit operations, and prevent violations.',
  };

  // Determine LLM temperature based on type
  const temperatureByType: Record<string, number> = {
    worker: 0.3,
    orchestrator: 0.5,
    judge: 0.1,
    critic: 0.4,
    monitor: 0.2,
    integrator: 0.3,
    governor: 0.1,
  };

  const manifest: OssaAgent = {
    apiVersion: apiVersion,
    kind: 'Agent',
    metadata: {
      name: details.name,
      version: details.version,
      description: details.description,
      labels: {
        'agent.ossa.io/type': details.type,
        'agent.ossa.io/author': details.author.toLowerCase().replace(/\s+/g, '-'),
        'agent.ossa.io/version': details.version,
      },
      annotations: {
        'agent.ossa.io/created-with': 'ossa-cli',
        'agent.ossa.io/schema-version': apiVersion,
      },
    },
    spec: {
      role: rolesByType[details.type] || rolesByType.worker,
      llm: {
        provider: details.llmProvider,
        model: details.llmModel,
        temperature: temperatureByType[details.type] || 0.5,
        maxTokens: 4000,
      },
      tools: details.capabilities.map((capability) => ({
        type: 'mcp',
        name: capability,
        server: details.name,
        capabilities: [capability],
      })),
      constraints: {
        cost: {
          maxTokensPerDay: 100000,
          maxTokensPerRequest: 4000,
        },
        performance: {
          maxLatencySeconds: 30,
          timeoutSeconds: 60,
        },
      },
    },
  };

  return manifest;
}

/**
 * Create agent directory structure
 */
async function createAgentStructure(
  agentName: string,
  manifest: OssaAgent,
  outputDir: string
): Promise<string> {
  const agentDir = path.join(outputDir, agentName);

  // Create directories
  const directories = [
    agentDir,
    path.join(agentDir, 'capabilities'),
    path.join(agentDir, 'resources'),
    path.join(agentDir, 'knowledge'),
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Write manifest
  const manifestPath = path.join(agentDir, 'manifest.yaml');
  const manifestYaml = yaml.stringify(manifest, {
    indent: 2,
    lineWidth: 0,
  });
  fs.writeFileSync(manifestPath, manifestYaml, 'utf-8');

  // Create README
  const readme = generateReadme(manifest);
  fs.writeFileSync(path.join(agentDir, 'README.md'), readme, 'utf-8');

  // Create placeholder files
  fs.writeFileSync(
    path.join(agentDir, 'capabilities', 'README.md'),
    '# Capabilities\n\nDefine agent capabilities here.\n',
    'utf-8'
  );

  fs.writeFileSync(
    path.join(agentDir, 'resources', 'README.md'),
    '# Resources\n\nStore agent resources (prompts, configs) here.\n',
    'utf-8'
  );

  fs.writeFileSync(
    path.join(agentDir, 'knowledge', 'README.md'),
    '# Knowledge\n\nStore agent knowledge base here.\n',
    'utf-8'
  );

  return agentDir;
}

/**
 * Generate README content
 */
function generateReadme(manifest: OssaAgent): string {
  const name = manifest.metadata?.name || 'agent';
  const description = manifest.metadata?.description || 'An OSSA agent';
  const version = manifest.metadata?.version || '1.0.0';
  const role = manifest.spec?.role || 'General purpose agent';

  return `# ${name}

${description}

## Overview

- **Version**: ${version}
- **Type**: ${manifest.metadata?.labels?.['agent.ossa.io/type'] || 'worker'}
- **OSSA Version**: ${manifest.apiVersion || 'ossa/v0.3.6'}

## Role

${role}

## Configuration

### LLM Settings

- **Provider**: ${manifest.spec?.llm?.provider || 'openai'}
- **Model**: ${manifest.spec?.llm?.model || 'gpt-4o'}
- **Temperature**: ${manifest.spec?.llm?.temperature || 0.5}
- **Max Tokens**: ${manifest.spec?.llm?.maxTokens || 4000}

### Capabilities

${(manifest.spec?.tools || []).map((tool) => `- ${tool.name}`).join('\\n')}

## Directory Structure

\`\`\`
${name}/
├── manifest.yaml       # OSSA agent manifest
├── capabilities/       # Capability implementations
├── resources/          # Agent resources (prompts, configs)
├── knowledge/          # Knowledge base
└── README.md          # This file
\`\`\`

## Usage

### Validate manifest

\`\`\`bash
ossa validate manifest.yaml
\`\`\`

### Deploy agent

\`\`\`bash
ossa deploy manifest.yaml
\`\`\`

### Run agent locally

\`\`\`bash
ossa run manifest.yaml --port 3000
\`\`\`

## Development

1. Edit \`manifest.yaml\` to customize agent configuration
2. Add capability implementations in \`capabilities/\`
3. Add resources (prompts, configs) in \`resources/\`
4. Add knowledge base content in \`knowledge/\`
5. Validate with \`ossa validate manifest.yaml\`
6. Test with \`ossa run manifest.yaml\`

## License

MIT

---

Generated with OSSA CLI v${getApiVersion()}
`;
}

/**
 * Agent Create Command
 */
export const agentCreateCommand = new Command('create')
  .description('Create a new OSSA agent manifest from template')
  .argument('[name]', 'Agent name (DNS-1123 compliant)')
  .option('-d, --description <desc>', 'Agent description')
  .option('-v, --version <version>', 'Agent version (semantic version)')
  .option(
    '-t, --type <type>',
    'Agent type (worker, orchestrator, judge, critic, monitor, integrator, governor)'
  )
  .option('-a, --author <author>', 'Author/team name')
  .option(
    '-o, --output-dir <dir>',
    'Output directory',
    '.agents'
  )
  .option('-i, --interactive', 'Use interactive mode (default)', true)
  .option('--dry-run', 'Preview without creating files')
  .action(
    async (
      name: string | undefined,
      options: AgentCreateOptions
    ) => {
      try {
        console.log(chalk.blue.bold('\n🤖 OSSA Agent Creator\n'));

        // Get agent details (interactive or from options)
        const details = await promptForAgentDetails({
          ...options,
          name,
        });

        // Validate inputs
        AgentNameSchema.parse(details.name);
        AgentVersionSchema.parse(details.version);
        AgentTypeSchema.parse(details.type);

        console.log(chalk.blue('\nGenerating agent manifest...'));

        // Generate manifest
        const manifest = generateAgentManifest(details);

        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY RUN] Would create:\n'));
          console.log(chalk.gray('─'.repeat(50)));
          console.log(yaml.stringify(manifest, { indent: 2 }));
          console.log(chalk.gray('─'.repeat(50)));
          console.log(
            chalk.gray(
              `\\nOutput directory: ${path.resolve(options.outputDir || '.agents', details.name)}`
            )
          );
          return;
        }

        // Create agent structure
        const outputDir = path.resolve(options.outputDir || '.agents');
        const agentDir = await createAgentStructure(
          details.name,
          manifest,
          outputDir
        );

        console.log(chalk.green('\n✓ Agent created successfully!\n'));
        console.log(chalk.cyan('Agent Details:'));
        console.log(chalk.gray(`  Name:        ${details.name}`));
        console.log(chalk.gray(`  Type:        ${details.type}`));
        console.log(chalk.gray(`  Version:     ${details.version}`));
        console.log(chalk.gray(`  Location:    ${agentDir}`));

        console.log(chalk.cyan('\nNext Steps:'));
        console.log(
          chalk.gray(`  1. Review manifest:  cat ${agentDir}/manifest.yaml`)
        );
        console.log(
          chalk.gray(`  2. Validate:         ossa validate ${agentDir}/manifest.yaml`)
        );
        console.log(
          chalk.gray(`  3. Customize:        Edit ${agentDir}/manifest.yaml`)
        );
        console.log(
          chalk.gray(`  4. Deploy:           ossa deploy ${agentDir}/manifest.yaml\\n`)
        );
      } catch (error) {
        handleCommandError(error, 'Failed to create agent');
      }
    }
  );
