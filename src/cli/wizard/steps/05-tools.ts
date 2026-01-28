/**
 * Step 5: Tools Configuration
 * Configure tools, MCP servers, and integrations
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

const MCP_SERVERS = [
  {
    name: 'Filesystem',
    server: 'npx -y @modelcontextprotocol/server-filesystem',
    args: ['./'],
  },
  { name: 'Git', server: 'npx -y @modelcontextprotocol/server-git', args: [] },
  {
    name: 'GitHub',
    server: 'npx -y @modelcontextprotocol/server-github',
    args: [],
  },
  { name: 'GitLab', server: 'npx -y @ossa/mcp-gitlab', args: [] },
  {
    name: 'PostgreSQL',
    server: 'npx -y @modelcontextprotocol/server-postgres',
    args: [],
  },
  {
    name: 'Puppeteer',
    server: 'npx -y @modelcontextprotocol/server-puppeteer',
    args: [],
  },
  {
    name: 'Fetch (HTTP)',
    server: 'npx -y @modelcontextprotocol/server-fetch',
    args: [],
  },
  { name: 'Custom MCP Server', server: 'custom', args: [] },
];

export async function configureToolsStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(5, state.totalSteps, 'Tools & Capabilities');

  console_ui.info(
    'Tools allow your agent to interact with external systems.\n'
  );

  const { addTools } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addTools',
      message: 'Add tools?',
      default: true,
    },
  ]);

  if (!addTools) return state;

  const tools: any[] = state.agent.spec?.tools || [];

  while (true) {
    const { toolType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'toolType',
        message: 'Select tool type:',
        choices: [
          { name: 'MCP Server', value: 'mcp' },
          { name: 'Function Tool', value: 'function' },
          { name: 'API Integration', value: 'api' },
          { name: 'Done adding tools', value: 'done' },
        ],
      },
    ]);

    if (toolType === 'done') break;

    if (toolType === 'mcp') {
      const { mcpChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'mcpChoice',
          message: 'Select MCP server:',
          choices: MCP_SERVERS.map((s) => ({ name: s.name, value: s })),
        },
      ]);

      let serverCommand = mcpChoice.server;
      let serverArgs = mcpChoice.args;

      if (mcpChoice.server === 'custom') {
        const customAnswers = await inquirer.prompt([
          { type: 'input', name: 'server', message: 'MCP server command:' },
          {
            type: 'input',
            name: 'args',
            message: 'Arguments (comma-separated, optional):',
            filter: (input: string) =>
              input
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean),
          },
        ]);
        serverCommand = customAnswers.server;
        serverArgs = customAnswers.args;
      }

      const { mcpName, mcpDesc } = await inquirer.prompt([
        {
          type: 'input',
          name: 'mcpName',
          message: 'Tool name:',
          default: mcpChoice.name.toLowerCase().replace(/\s+/g, '-'),
        },
        {
          type: 'input',
          name: 'mcpDesc',
          message: 'Description (optional):',
          default: `${mcpChoice.name} integration`,
        },
      ]);

      tools.push({
        type: 'mcp',
        name: mcpName,
        description: mcpDesc,
        config: {
          server: serverCommand,
          args: serverArgs,
        },
      });

      console_ui.success(`Added MCP server: ${mcpName}`);
    } else if (toolType === 'function') {
      const funcAnswers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Function name (snake_case):' },
        { type: 'input', name: 'description', message: 'Description:' },
        {
          type: 'editor',
          name: 'inputSchema',
          message: 'Input schema (JSON, optional):',
          default:
            '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
        },
      ]);

      try {
        const inputSchema = JSON.parse(funcAnswers.inputSchema);
        tools.push({
          type: 'function',
          name: funcAnswers.name,
          description: funcAnswers.description,
          input_schema: inputSchema,
        });
        console_ui.success(`Added function: ${funcAnswers.name}`);
      } catch (e) {
        console_ui.error('Invalid JSON schema, skipping tool');
      }
    } else if (toolType === 'api') {
      const apiAnswers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'API name:' },
        { type: 'input', name: 'baseUrl', message: 'Base URL:' },
        {
          type: 'input',
          name: 'authType',
          message: 'Auth type (bearer, api-key, none):',
          default: 'none',
        },
      ]);

      tools.push({
        type: 'api',
        name: apiAnswers.name,
        config: {
          base_url: apiAnswers.baseUrl,
          auth_type: apiAnswers.authType,
        },
      });

      console_ui.success(`Added API integration: ${apiAnswers.name}`);
    }
  }

  if (tools.length > 0) {
    state.agent.spec!.tools = tools;
    console_ui.success(`Configured ${tools.length} tool(s)`);
  }

  return state;
}
