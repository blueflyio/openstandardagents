/**
 * OSSA Tool Create Command
 * Create tool configurations for OSSA agents
 *
 * Supports all 19 tool types from OSSA v0.4.4 spec:
 * - mcp, browser, kubernetes, http, api, grpc, function, a2a
 * - webhook, schedule, pipeline, workflow, artifact, git-commit
 * - ci-status, comment, library, custom
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import type { Tool } from '../../../types/tool.js';

// All 19 tool types from OSSA v0.4.4 spec
const TOOL_TYPES = [
  'mcp',
  'browser',
  'kubernetes',
  'http',
  'api',
  'grpc',
  'function',
  'a2a',
  'webhook',
  'schedule',
  'pipeline',
  'workflow',
  'artifact',
  'git-commit',
  'ci-status',
  'comment',
  'library',
  'custom',
] as const;

type ToolType = (typeof TOOL_TYPES)[number];

interface CreateToolOptions {
  type?: ToolType;
  name?: string;
  server?: string;
  url?: string;
  cron?: string;
  output?: string;
  interactive?: boolean;
}

export const toolCreateCommand = new Command('create')
  .description('Create a new OSSA tool configuration')
  .option(
    '-t, --type <type>',
    `Tool type: ${TOOL_TYPES.join(', ')}`,
    'function'
  )
  .option('-n, --name <name>', 'Tool name/identifier')
  .option('-s, --server <command>', 'MCP server command (for type: mcp)')
  .option('-u, --url <url>', 'HTTP/API endpoint URL (for type: http/api)')
  .option('-c, --cron <expression>', 'Cron schedule (for type: schedule)')
  .option('-o, --output <path>', 'Output file path', 'tool.json')
  .option('-i, --interactive', 'Interactive mode with prompts', false)
  .action(async (options: CreateToolOptions) => {
    try {
      let toolConfig: Partial<Tool>;

      if (options.interactive) {
        toolConfig = await createToolInteractive();
      } else {
        toolConfig = await createToolFromOptions(options);
      }

      // Write to file
      const outputPath = options.output || 'tool.json';
      fs.writeFileSync(outputPath, JSON.stringify(toolConfig, null, 2));

      console.log(chalk.green(`✓ Created tool configuration: ${outputPath}`));
      console.log(chalk.gray(`  Type: ${toolConfig.type}`));
      console.log(chalk.gray(`  Name: ${toolConfig.name}`));

      if (toolConfig.description) {
        console.log(chalk.gray(`  Description: ${toolConfig.description}`));
      }

      // Show usage example
      console.log(chalk.blue('\nUsage:'));
      console.log(
        chalk.gray(
          `  Add this tool to your agent manifest in spec.tools array`
        )
      );
      console.log(
        chalk.gray(`  or validate with: ossa tool validate ${outputPath}`)
      );
    } catch (error) {
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

async function createToolInteractive(): Promise<Partial<Tool>> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Select tool type:',
      choices: TOOL_TYPES.map((t) => ({
        name: `${t} - ${getToolTypeDescription(t)}`,
        value: t,
      })),
    },
    {
      type: 'input',
      name: 'name',
      message: 'Tool name:',
      validate: (input) => (input ? true : 'Name is required'),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Tool description:',
    },
  ]);

  // Type-specific configuration
  const typeSpecific = await getTypeSpecificConfig(answers.type);

  return {
    type: answers.type,
    name: answers.name,
    description: answers.description,
    ...typeSpecific,
  };
}

async function createToolFromOptions(
  options: CreateToolOptions
): Promise<Partial<Tool>> {
  const type = options.type || 'function';

  if (!TOOL_TYPES.includes(type)) {
    throw new Error(
      `Invalid tool type: ${type}. Must be one of: ${TOOL_TYPES.join(', ')}`
    );
  }

  if (!options.name) {
    throw new Error('Tool name is required. Use --name <name>');
  }

  const tool: Partial<Tool> = {
    type,
    name: options.name,
  };

  // Type-specific configuration
  switch (type) {
    case 'mcp':
      if (!options.server) {
        throw new Error('MCP server command is required. Use --server <cmd>');
      }
      tool.server = options.server;
      break;

    case 'http':
    case 'api':
      if (!options.url) {
        throw new Error('URL is required for HTTP/API tools. Use --url <url>');
      }
      tool.endpoint = options.url;
      break;

    case 'webhook':
      if (!options.url) {
        throw new Error('Webhook URL is required. Use --url <url>');
      }
      tool.endpoint = options.url;
      break;

    case 'schedule':
      if (!options.cron) {
        throw new Error('Cron expression is required. Use --cron "0 9 * * *"');
      }
      tool.config = { schedule: options.cron };
      break;

    case 'grpc':
      if (!options.url) {
        throw new Error('gRPC endpoint is required. Use --url <url>');
      }
      tool.endpoint = options.url;
      break;

    case 'kubernetes':
      tool.config = {
        namespace: 'default',
        resource: 'pods',
      };
      break;

    case 'browser':
      tool.config = {
        headless: true,
        timeout: 30000,
      };
      break;
  }

  return tool;
}

async function getTypeSpecificConfig(type: ToolType): Promise<any> {
  switch (type) {
    case 'mcp': {
      const { server } = await inquirer.prompt([
        {
          type: 'input',
          name: 'server',
          message: 'MCP server command (e.g., npx @modelcontextprotocol/server-filesystem):',
          validate: (input) => (input ? true : 'Server command is required'),
        },
      ]);
      return { server };
    }

    case 'http':
    case 'api':
    case 'webhook':
    case 'grpc': {
      const { endpoint, authType } = await inquirer.prompt([
        {
          type: 'input',
          name: 'endpoint',
          message: 'Endpoint URL:',
          validate: (input) => (input ? true : 'URL is required'),
        },
        {
          type: 'list',
          name: 'authType',
          message: 'Authentication type:',
          choices: ['none', 'bearer', 'basic', 'api-key', 'oauth2'],
        },
      ]);

      const config: any = { endpoint };

      if (authType !== 'none') {
        config.auth = {
          type: authType,
          credentials: '${SECRET_NAME}',
        };
      }

      return config;
    }

    case 'schedule': {
      const { schedule } = await inquirer.prompt([
        {
          type: 'input',
          name: 'schedule',
          message: 'Cron expression (e.g., "0 9 * * *" for daily at 9am):',
          validate: (input) => (input ? true : 'Cron expression is required'),
        },
      ]);
      return { config: { schedule } };
    }

    case 'kubernetes': {
      const { namespace, resource } = await inquirer.prompt([
        {
          type: 'input',
          name: 'namespace',
          message: 'Kubernetes namespace:',
          default: 'default',
        },
        {
          type: 'input',
          name: 'resource',
          message: 'Resource type (e.g., pods, deployments):',
          default: 'pods',
        },
      ]);
      return { config: { namespace, resource } };
    }

    case 'browser': {
      const { headless, timeout } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'headless',
          message: 'Run in headless mode?',
          default: true,
        },
        {
          type: 'number',
          name: 'timeout',
          message: 'Timeout (milliseconds):',
          default: 30000,
        },
      ]);
      return { config: { headless, timeout } };
    }

    default:
      return {};
  }
}

function getToolTypeDescription(type: ToolType): string {
  const descriptions: Record<ToolType, string> = {
    mcp: 'Model Context Protocol servers',
    browser: 'Browser automation (Puppeteer/Playwright)',
    kubernetes: 'Kubernetes API integration',
    http: 'HTTP endpoints',
    api: 'REST API integration',
    grpc: 'gRPC services',
    function: 'Local function calls',
    a2a: 'Agent-to-agent communication',
    webhook: 'Event-driven webhooks',
    schedule: 'Cron-based scheduling',
    pipeline: 'CI/CD pipeline events',
    workflow: 'Workflow status changes',
    artifact: 'Build artifact outputs',
    'git-commit': 'Git commit events',
    'ci-status': 'CI pipeline status',
    comment: 'MR/Issue comments',
    library: 'Reusable logic libraries',
    custom: 'Custom tool implementation',
  };
  return descriptions[type] || 'Custom tool';
}
