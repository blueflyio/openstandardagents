/**
 * OSSA Tool List Command
 * List available tool types and show examples
 */

import chalk from 'chalk';
import { Command } from 'commander';
import type { ToolType } from '../../../types/tool.js';

interface ListToolOptions {
  available?: boolean;
  examples?: boolean;
  type?: string;
  json?: boolean;
}

// All 19 tool types from OSSA v0.4.4
const TOOL_TYPES: { type: ToolType; description: string; category: string }[] =
  [
    {
      type: 'mcp',
      description: 'Model Context Protocol servers',
      category: 'Integration',
    },
    {
      type: 'browser',
      description: 'Browser automation (Puppeteer/Playwright)',
      category: 'Automation',
    },
    {
      type: 'kubernetes',
      description: 'Kubernetes API integration',
      category: 'Infrastructure',
    },
    { type: 'http', description: 'HTTP endpoints', category: 'Integration' },
    {
      type: 'api',
      description: 'REST API integration',
      category: 'Integration',
    },
    { type: 'grpc', description: 'gRPC services', category: 'Integration' },
    {
      type: 'function',
      description: 'Local function calls',
      category: 'Runtime',
    },
    {
      type: 'a2a',
      description: 'Agent-to-agent communication',
      category: 'Communication',
    },
    {
      type: 'webhook',
      description: 'Event-driven webhooks',
      category: 'Triggers',
    },
    {
      type: 'schedule',
      description: 'Cron-based scheduling',
      category: 'Triggers',
    },
    {
      type: 'pipeline',
      description: 'CI/CD pipeline events',
      category: 'Triggers',
    },
    {
      type: 'workflow',
      description: 'Workflow status changes',
      category: 'Triggers',
    },
    {
      type: 'artifact',
      description: 'Build artifact outputs',
      category: 'Output',
    },
    {
      type: 'git-commit',
      description: 'Git commit events',
      category: 'Output',
    },
    {
      type: 'ci-status',
      description: 'CI pipeline status',
      category: 'Output',
    },
    {
      type: 'comment',
      description: 'MR/Issue comments',
      category: 'Output',
    },
    {
      type: 'library',
      description: 'Reusable logic libraries',
      category: 'Runtime',
    },
    {
      type: 'custom',
      description: 'Custom tool implementation',
      category: 'Custom',
    },
  ];

export const toolListCommand = new Command('list')
  .description('List available OSSA tool types and examples')
  .option('-a, --available', 'List all available tool types', false)
  .option('-e, --examples', 'Show example configurations', false)
  .option('-t, --type <type>', 'Show details for specific tool type')
  .option('--json', 'Output as JSON', false)
  .action(async (options: ListToolOptions) => {
    try {
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              toolTypes: TOOL_TYPES,
              count: TOOL_TYPES.length,
            },
            null,
            2
          )
        );
        return;
      }

      // Show specific type details
      if (options.type) {
        showToolTypeDetails(options.type);
        return;
      }

      // Show available types
      if (options.available || !options.examples) {
        showAvailableTypes();
      }

      // Show examples
      if (options.examples) {
        console.log(); // spacing
        showExamples();
      }
    } catch (error) {
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

function showAvailableTypes(): void {
  console.log(chalk.bold.blue('\nOSSA Tool Types (v0.4.4)\n'));
  console.log(
    chalk.gray(
      `${TOOL_TYPES.length} tool types available across 7 categories\n`
    )
  );

  // Group by category
  const byCategory = TOOL_TYPES.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, typeof TOOL_TYPES>
  );

  // Display by category
  Object.entries(byCategory).forEach(([category, tools]) => {
    console.log(chalk.yellow(`${category}:`));
    tools.forEach((tool) => {
      console.log(
        `  ${chalk.cyan(tool.type.padEnd(15))} ${chalk.gray(tool.description)}`
      );
    });
    console.log();
  });

  console.log(chalk.gray('Use --examples to see configuration examples'));
  console.log(
    chalk.gray('Use --type <type> to see details for a specific type')
  );
}

function showExamples(): void {
  console.log(chalk.bold.blue('Tool Configuration Examples\n'));

  const examples = [
    {
      name: 'MCP Server',
      config: {
        type: 'mcp',
        name: 'filesystem',
        description: 'Access local filesystem via MCP',
        server: 'npx @modelcontextprotocol/server-filesystem',
      },
    },
    {
      name: 'HTTP API',
      config: {
        type: 'http',
        name: 'weather-api',
        description: 'Fetch weather data',
        endpoint: 'https://api.weather.com/v1',
        auth: {
          type: 'api-key',
          credentials: '${WEATHER_API_KEY}',
        },
      },
    },
    {
      name: 'Webhook Trigger',
      config: {
        type: 'webhook',
        name: 'github-push',
        description: 'Triggered on GitHub push events',
        endpoint: 'https://api.github.com/webhooks',
        config: {
          events: ['push', 'pull_request'],
        },
      },
    },
    {
      name: 'Scheduled Task',
      config: {
        type: 'schedule',
        name: 'daily-report',
        description: 'Generate daily report at 9am',
        config: {
          schedule: '0 9 * * *',
          timezone: 'UTC',
        },
      },
    },
    {
      name: 'Kubernetes Integration',
      config: {
        type: 'kubernetes',
        name: 'pod-manager',
        description: 'Manage Kubernetes pods',
        config: {
          namespace: 'default',
          resource: 'pods',
        },
      },
    },
    {
      name: 'Browser Automation',
      config: {
        type: 'browser',
        name: 'web-scraper',
        description: 'Scrape web content',
        config: {
          headless: true,
          timeout: 30000,
        },
      },
    },
  ];

  examples.forEach((example, index) => {
    console.log(chalk.yellow(`${index + 1}. ${example.name}`));
    console.log(chalk.gray(JSON.stringify(example.config, null, 2)));
    console.log();
  });

  console.log(
    chalk.gray(
      'Create a tool with: ossa tool create --type <type> --name <name>'
    )
  );
}

function showToolTypeDetails(type: string): void {
  const tool = TOOL_TYPES.find((t) => t.type === type);

  if (!tool) {
    console.error(chalk.red(`Unknown tool type: ${type}`));
    console.log(chalk.gray('Available types:'));
    TOOL_TYPES.forEach((t) => {
      console.log(chalk.gray(`  - ${t.type}`));
    });
    process.exit(1);
  }

  console.log(chalk.bold.blue(`\nTool Type: ${tool.type}\n`));
  console.log(chalk.gray(`Category: ${tool.category}`));
  console.log(chalk.gray(`Description: ${tool.description}\n`));

  // Show type-specific requirements
  console.log(chalk.yellow('Required Fields:'));
  console.log(chalk.gray('  - type (always required)'));
  console.log(chalk.gray('  - name (always required)'));

  switch (tool.type) {
    case 'mcp':
      console.log(chalk.gray('  - server (MCP server command)'));
      break;
    case 'http':
    case 'api':
    case 'webhook':
    case 'grpc':
      console.log(chalk.gray('  - endpoint (URL)'));
      break;
    case 'schedule':
      console.log(chalk.gray('  - config.schedule (cron expression)'));
      break;
    case 'kubernetes':
      console.log(chalk.gray('  - config.namespace'));
      console.log(chalk.gray('  - config.resource'));
      break;
  }

  console.log();
  console.log(
    chalk.gray(`Create this tool with: ossa tool create --type ${tool.type}`)
  );
}
