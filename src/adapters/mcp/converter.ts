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
  readonly platform = 'mcp';
  readonly displayName = 'MCP Server';
  readonly description = 'Export OSSA agents as Model Context Protocol servers';
  readonly supportedVersions = ['{{VERSION}}', '0.3.6'];
  readonly version = '1.0.0';
  readonly supportedOssaVersions = ['{{VERSION}}', '0.3.6'];
  readonly outputFormat = ['typescript'];

  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    return this.convert(manifest, options || {});
  }

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
        agentName: manifest.metadata?.name || 'unnamed-agent',
        agentVersion: manifest.metadata?.version || '1.0.0',
        durationMs: Date.now() - startTime,
        fileCount: files.length,
        totalSizeBytes: files.reduce((sum, f) => sum + f.content.length, 0),
      };

      return this.createResult(true, files, undefined, metadata);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.createResult(false, [], `MCP export failed: ${errorMessage}`);
    }
  }

  private generateServerFile(manifest: OssaAgent): ExportFile {
    const tools = manifest.spec?.tools || [];

    const content = `#!/usr/bin/env node
/**
 * ${manifest.metadata?.name || 'unnamed-agent'} - MCP Server
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
    name: '${manifest.metadata?.name || 'unnamed-agent'}',
    version: '${manifest.metadata?.version || '1.0.0'}',
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
  console.error('${manifest.metadata?.name || 'unnamed-agent'} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;

    return this.createFile('server.ts', content, 'code', 'typescript');
  }

  private generateToolsFile(manifest: OssaAgent): ExportFile {
    const tools = manifest.spec?.tools || [];

    const toolDefinitions = tools
      .map(
        (tool) => `{
  name: '${tool.name}',
  description: '${tool.description || tool.name}',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input data for ${tool.name}',
      },
    },
    required: ['input'],
  },
}`
      )
      .join(',\n  ');

    const toolImplementations = tools
      .map((tool) => {
        const toolName = tool.name || 'unnamed_tool';
        return `
async function ${this.toCamelCase(toolName)}(args: any): Promise<any> {
  // TODO: Implement ${toolName}
  console.log('Executing ${toolName} with args:', args);
  return { result: 'Success', tool: '${toolName}', input: args.input };
}`;
      })
      .join('\n');

    const toolMap = tools
      .map((tool) => {
        const toolName = tool.name || 'unnamed_tool';
        return `    case '${toolName}': return ${this.toCamelCase(toolName)}(args);`;
      })
      .join('\n');

    const content = `/**
 * Tool implementations for ${manifest.metadata?.name || 'unnamed-agent'}
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
 * Type definitions for ${manifest.metadata?.name || 'unnamed-agent'}
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
        name: manifest.metadata?.name || 'unnamed-agent',
        version: manifest.metadata?.version || '1.0.0',
        description:
          manifest.metadata?.description || 'OSSA-generated MCP server',
        type: 'module',
        bin: {
          [manifest.metadata?.name || 'unnamed-agent']: './dist/server.js',
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
    const content = `# ${manifest.metadata?.name || 'unnamed-agent'} - MCP Server

${manifest.metadata?.description || 'OSSA-generated MCP server' || 'MCP server generated from OSSA manifest'}

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
  "${manifest.metadata?.name || 'unnamed-agent'}": {
    "command": "node",
    "args": ["/path/to/${manifest.metadata?.name || 'unnamed-agent'}/dist/server.js"]
  }
}
\`\`\`

### Test Locally

\`\`\`bash
npm start
\`\`\`

## Available Tools

${(manifest.spec?.tools || [])
  .map(
    (tool: any) => `- **${tool.name}**: ${tool.description || 'No description'}`
  )
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

describe('${manifest.metadata?.name || 'unnamed-agent'} MCP Server', () => {
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
