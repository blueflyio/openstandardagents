// OSSA v{{VERSION}} - MCP (Model Context Protocol) Export Adapter
import {
  BaseAdapter,
  ExportOptions,
  ExportResult,
  ExportFile,
  OssaAgent,
} from '../base/adapter.interface.js';

/**
 * MCP export adapter - generates JSON-RPC 2.0 MCP servers
 * Compatible with Claude Code, Cursor, and other MCP clients
 */
export class MCPAdapter extends BaseAdapter {
  readonly name = 'mcp';
  readonly version = '1.0.0';
  readonly supportedOssaVersions = ['{{VERSION}}', '0.3.6'];
  readonly outputFormat = ['typescript'];

  async convert(
    manifest: OssaAgent,
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const files: ExportFile[] = [];

    try {
      // Generate MCP server files
      files.push(this.generateServerFile(manifest));
      files.push(this.generateToolsFile(manifest));
      files.push(this.generateTypesFile(manifest));
      files.push(this.generatePackageJson(manifest));
      files.push(this.generateTsConfig());

      if (options.includeDocs) {
        files.push(this.generateReadme(manifest));
      }

      if (options.includeTests) {
        files.push(this.generateTests(manifest));
      }

      const metadata = {
        timestamp: new Date().toISOString(),
        ossaVersion: manifest.apiVersion,
        adapterVersion: this.version,
        agentName: manifest.metadata?.name || 'unknown',
        agentVersion: manifest.metadata?.version || '0.0.0',
        durationMs: Date.now() - startTime,
        fileCount: files.length,
        totalSizeBytes: files.reduce((sum, f) => sum + f.content.length, 0),
      };

      return this.createResult(true, files, undefined, metadata);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createResult(false, [], `MCP export failed: ${errorMessage}`);
    }
  }

  private generateServerFile(manifest: OssaAgent): ExportFile {
    const tools =
      manifest.agent?.capabilities?.filter((c) => c.type === 'tool') || [];

    const content = `#!/usr/bin/env node
/**
 * ${manifest.metadata?.name || 'unknown'} - MCP Server
 * Generated from OSSA v${manifest.apiVersion}
 * Protocol: JSON-RPC 2.0 (Model Context Protocol)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, executeTool } from './tools.js';

const server = new Server(
  {
    name: '${manifest.metadata?.name || 'unknown'}',
    version: '${manifest.metadata?.version || '0.0.0'}',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await executeTool(name, args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: \`Error executing tool: \${error.message}\`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${manifest.metadata?.name} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;

    return this.createFile('server.ts', content, 'code', 'typescript');
  }

  private generateToolsFile(manifest: OssaAgent): ExportFile {
    const tools =
      manifest.agent?.capabilities?.filter((c) => c.type === 'tool') || [];

    const toolDefinitions = tools
      .map(
        (tool) => `{
  name: '${tool.id}',
  description: '${tool.description || tool.id}',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input data for ${tool.id}',
      },
    },
    required: ['input'],
  },
}`
      )
      .join(',\n  ');

    const toolImplementations = tools
      .map(
        (tool) => `
async function ${this.toCamelCase(tool.id)}(args: any): Promise<any> {
  // TODO: Implement ${tool.id}
  console.log('Executing ${tool.id} with args:', args);
  return { result: 'Success', tool: '${tool.id}', input: args.input };
}`
      )
      .join('\n');

    const toolMap = tools
      .map(
        (tool) =>
          `    case '${tool.id}': return ${this.toCamelCase(tool.id)}(args);`
      )
      .join('\n');

    const content = `/**
 * Tool implementations for ${manifest.metadata?.name}
 */

export const tools = [
  ${toolDefinitions}
];

${toolImplementations}

export async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
${toolMap}
    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
}
`;

    return this.createFile('tools.ts', content, 'code', 'typescript');
  }

  private generateTypesFile(manifest: OssaAgent): ExportFile {
    const content = `/**
 * Type definitions for ${manifest.metadata?.name}
 */

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface MCPRequest {
  method: string;
  params: any;
}

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}
`;

    return this.createFile('types.ts', content, 'code', 'typescript');
  }

  private generatePackageJson(manifest: OssaAgent): ExportFile {
    const content = JSON.stringify(
      {
        name: manifest.metadata?.name,
        version: manifest.metadata?.version,
        description: manifest.metadata?.description,
        type: 'module',
        bin: {
          [manifest.metadata?.name || 'mcp-server']: './dist/server.js',
        },
        scripts: {
          build: 'tsc',
          start: 'node dist/server.js',
          dev: 'tsx watch src/server.ts',
        },
        dependencies: {
          '@modelcontextprotocol/sdk': '^0.5.0',
        },
        devDependencies: {
          '@types/node': '^20.0.0',
          typescript: '^5.3.0',
          tsx: '^4.7.0',
        },
      },
      null,
      2
    );

    return this.createFile('package.json', content, 'config', 'json');
  }

  private generateTsConfig(): ExportFile {
    const content = JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'Node16',
          moduleResolution: 'Node16',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2
    );

    return this.createFile('tsconfig.json', content, 'config', 'json');
  }

  private generateReadme(manifest: OssaAgent): ExportFile {
    const content = `# ${manifest.metadata?.name} - MCP Server

${manifest.metadata?.description || 'MCP server generated from OSSA manifest'}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

### As MCP Server (Claude Code/Cursor)

Add to your MCP config (\`~/.claude/mcp_servers.json\` or \`.cursor/mcp_servers.json\`):

\`\`\`json
{
  "${manifest.metadata?.name}": {
    "command": "node",
    "args": ["/path/to/${manifest.metadata?.name}/dist/server.js"]
  }
}
\`\`\`

### Test Locally

\`\`\`bash
npm start
\`\`\`

## Available Tools

${manifest.agent?.capabilities
  ?.filter((c) => c.type === 'tool')
  .map((tool) => `- **${tool.id}**: ${tool.description || 'No description'}`)
  .join('\n')}

## Generated from OSSA

This MCP server was generated from an OSSA v${manifest.apiVersion} manifest.

Learn more: https://openstandardagents.org
`;

    return this.createFile('README.md', content, 'documentation');
  }

  private generateTests(manifest: OssaAgent): ExportFile {
    const content = `import { describe, test, expect } from 'vitest';
import { tools, executeTool } from './tools';

describe('${manifest.metadata?.name} MCP Server', () => {
  test('exports tools array', () => {
    expect(tools).toBeDefined();
    expect(Array.isArray(tools)).toBe(true);
  });

  test('can execute tools', async () => {
    const toolName = tools[0]?.name;
    if (toolName) {
      const result = await executeTool(toolName, { input: 'test' });
      expect(result).toBeDefined();
    }
  });
});
`;

    return this.createFile('server.test.ts', content, 'test', 'typescript');
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[-:]/g, '_')
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  getCapabilities() {
    return {
      typescript: true,
      simulation: true,
      incremental: false,
      hotReload: true,
    };
  }
}
