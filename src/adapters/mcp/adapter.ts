/**
 * MCP (Model Context Protocol) Platform Adapter
 * Exports OSSA agent manifests to MCP server format
 *
 * Generates JSON-RPC 2.0 compatible server for use with:
 * - Claude Code
 * - Claude Desktop
 * - Other MCP-compatible clients
 *
 * SOLID: Single Responsibility - MCP server generation only
 * DRY: Reuses BaseAdapter validation and helpers
 */

import { BaseAdapter } from '../base/adapter.interface.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';

export class MCPAdapter extends BaseAdapter {
  readonly platform = 'mcp';
  readonly displayName = 'Model Context Protocol';
  readonly description = 'MCP server for Claude Code and other MCP clients';
  readonly supportedVersions = ['v0.4.0'];

  /**
   * Export OSSA manifest to MCP server format
   */
  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Validate manifest
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            {
              duration: Date.now() - startTime,
              warnings: validation.warnings?.map((w) => w.message),
            }
          );
        }
      }

      const agentName = manifest.metadata?.name || 'mcp-server';
      const files = [];

      // Generate server.ts - Main MCP server entry point
      files.push(
        this.createFile(
          `mcp/${agentName}/server.ts`,
          this.generateServerCode(manifest),
          'code',
          'typescript'
        )
      );

      // Generate tools.ts - Tool implementations
      files.push(
        this.createFile(
          `mcp/${agentName}/tools.ts`,
          this.generateToolsCode(manifest),
          'code',
          'typescript'
        )
      );

      // Generate types.ts - TypeScript types
      files.push(
        this.createFile(
          `mcp/${agentName}/types.ts`,
          this.generateTypesCode(manifest),
          'code',
          'typescript'
        )
      );

      // Generate package.json
      files.push(
        this.createFile(
          `mcp/${agentName}/package.json`,
          this.generatePackageJson(manifest),
          'config'
        )
      );

      // Generate tsconfig.json
      files.push(
        this.createFile(
          `mcp/${agentName}/tsconfig.json`,
          this.generateTsConfig(),
          'config'
        )
      );

      // Generate README.md
      files.push(
        this.createFile(
          `mcp/${agentName}/README.md`,
          this.generateReadme(manifest),
          'documentation'
        )
      );

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '1.0.0',
      });
    } catch (error) {
      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : String(error),
        { duration: Date.now() - startTime }
      );
    }
  }

  /**
   * Validate manifest for MCP compatibility
   */
  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Base validation
    const baseValidation = await super.validate(manifest);
    if (baseValidation.errors) errors.push(...baseValidation.errors);
    if (baseValidation.warnings) warnings.push(...baseValidation.warnings);

    // MCP-specific validation
    const spec = manifest.spec;

    // Check capabilities (MCP uses capabilities as tools)
    if (!spec?.capabilities || !Array.isArray(spec.capabilities)) {
      warnings.push({
        message: 'No capabilities defined, MCP server will have no tools',
        path: 'spec.capabilities',
        suggestion: 'Add spec.capabilities array with tool definitions',
      });
    } else if (spec.capabilities.length === 0) {
      warnings.push({
        message: 'Empty capabilities array, MCP server will have no tools',
        path: 'spec.capabilities',
        suggestion: 'Add at least one capability',
      });
    }

    // Check for role/system prompt
    if (!spec?.role) {
      warnings.push({
        message: 'No role defined, MCP server will have no description',
        path: 'spec.role',
        suggestion: 'Add spec.role with server description',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get example MCP-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v0.4.0',
      kind: 'Agent',
      metadata: {
        name: 'mcp-example-server',
        version: '1.0.0',
        description: 'Example MCP server with multiple tools',
      },
      spec: {
        role: 'Provides file system operations and data processing tools',
        capabilities: [
          'read-file',
          'write-file',
          'list-directory',
          'search-files',
          'process-data',
        ],
        tools: [
          {
            name: 'read_file',
            description: 'Read contents of a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' },
              },
              required: ['path'],
            },
          },
          {
            name: 'write_file',
            description: 'Write contents to a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'File content' },
              },
              required: ['path', 'content'],
            },
          },
        ],
      },
    };
  }

  /**
   * Generate server.ts - MCP server entry point
   */
  private generateServerCode(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'mcp-server';
    const description =
      manifest.spec?.role || manifest.metadata?.description || 'MCP Server';

    return `#!/usr/bin/env node
/**
 * MCP Server: ${agentName}
 * ${description}
 *
 * Generated from OSSA manifest
 * Compatible with Claude Code, Claude Desktop, and other MCP clients
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, executeTool } from './tools.js';
import type { ToolName, ToolInput, ToolOutput } from './types.js';

/**
 * Initialize MCP server
 */
const server = new Server(
  {
    name: '${agentName}',
    version: '${manifest.metadata?.version || '1.0.0'}',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handle list_tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools as Tool[],
  };
});

/**
 * Handle call_tool request
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await executeTool(name as ToolName, args as ToolInput);
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
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${agentName} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
`;
  }

  /**
   * Generate tools.ts - Tool implementations
   */
  private generateToolsCode(manifest: OssaAgent): string {
    const capabilities = (manifest.spec?.capabilities || []) as string[];
    const tools = (manifest.spec?.tools || []) as any[];

    const toolDefinitions = tools.map((tool) => {
      const name = tool.name || 'unknown';
      const description = tool.description || `Tool: ${name}`;
      const schema = tool.inputSchema ||
        tool.schema || {
          type: 'object',
          properties: {},
        };

      return {
        name,
        description,
        inputSchema: schema,
      };
    });

    // Generate tool interface
    const toolsList = toolDefinitions
      .map(
        (t) =>
          `  {
    name: '${t.name}',
    description: '${t.description}',
    inputSchema: ${JSON.stringify(t.inputSchema, null, 6).replace(/\n/g, '\n    ')},
  }`
      )
      .join(',\n');

    // Generate tool implementation cases
    const toolCases = toolDefinitions
      .map((t) => {
        const inputType = `args as { [key: string]: unknown }`;
        return `    case '${t.name}':
      // Implement ${t.name} logic here
      return {
        success: true,
        result: \`Executed ${t.name} with: \${JSON.stringify(${inputType})}\`,
      };`;
      })
      .join('\n\n');

    return `/**
 * Tool Definitions and Implementations
 * Generated from OSSA capabilities
 */

import type { ToolName, ToolInput, ToolOutput } from './types.js';

/**
 * Tool definitions (MCP format)
 */
export const tools = [
${toolsList}
];

/**
 * Execute a tool by name
 */
export async function executeTool(
  name: ToolName,
  input: ToolInput
): Promise<ToolOutput> {
  switch (name) {
${toolCases}

    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
}
`;
  }

  /**
   * Generate types.ts - TypeScript types
   */
  private generateTypesCode(manifest: OssaAgent): string {
    const tools = (manifest.spec?.tools || []) as any[];
    const toolNames = tools.map((t) => `'${t.name || 'unknown'}'`).join(' | ');

    return `/**
 * TypeScript Type Definitions
 * Generated from OSSA manifest
 */

/**
 * Available tool names
 */
export type ToolName = ${toolNames || "'unknown'"};

/**
 * Tool input (generic)
 */
export type ToolInput = Record<string, unknown>;

/**
 * Tool output
 */
export interface ToolOutput {
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  name: string;
  version: string;
  description: string;
}
`;
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(manifest: OssaAgent): string {
    const pkg = {
      name: manifest.metadata?.name || 'mcp-server',
      version: manifest.metadata?.version || '1.0.0',
      description:
        manifest.metadata?.description || 'MCP Server generated from OSSA',
      type: 'module',
      main: 'server.js',
      bin: {
        [manifest.metadata?.name || 'mcp-server']: './server.js',
      },
      scripts: {
        build: 'tsc',
        start: 'node server.js',
        dev: 'tsx server.ts',
        watch: 'tsx watch server.ts',
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^0.5.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        typescript: '^5.0.0',
        tsx: '^4.0.0',
      },
      keywords: ['mcp', 'model-context-protocol', 'claude', 'ossa', 'ai-agent'],
      license: manifest.metadata?.license || 'MIT',
    };

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Generate tsconfig.json
   */
  private generateTsConfig(): string {
    const config = {
      compilerOptions: {
        target: 'ES2022',
        module: 'Node16',
        moduleResolution: 'Node16',
        outDir: '.',
        rootDir: '.',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
      },
      include: ['*.ts'],
      exclude: ['node_modules', '*.js'],
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate README.md
   */
  private generateReadme(manifest: OssaAgent): string {
    const agentName = manifest.metadata?.name || 'mcp-server';
    const description =
      manifest.spec?.role || manifest.metadata?.description || 'MCP Server';
    const tools = (manifest.spec?.tools || []) as any[];

    return `# ${agentName}

${description}

## Model Context Protocol (MCP) Server

This server implements the Model Context Protocol, making it compatible with:
- **Claude Code** CLI
- **Claude Desktop** app
- Any MCP-compatible AI client

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

### With Claude Code

Add to your \`.mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "${agentName}": {
      "command": "node",
      "args": ["./server.js"],
      "cwd": "${process.cwd()}/mcp/${agentName}"
    }
  }
}
\`\`\`

### Standalone

\`\`\`bash
npm start
\`\`\`

## Available Tools

${tools.map((t) => `- **${t.name || 'unknown'}**: ${t.description || 'No description'}`).join('\n')}

## Development

\`\`\`bash
# Watch mode
npm run dev

# Build
npm run build

# Run
npm start
\`\`\`

## Generated from OSSA

This server was generated from an OSSA v${manifest.apiVersion?.split('/')[1] || '0.4.0'} manifest.

Original manifest: \`agent.ossa.yaml\`

## License

${manifest.metadata?.license || 'MIT'}
`;
  }
}
