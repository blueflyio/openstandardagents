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
 * DRY: Extends BaseExporter for orchestration, validation, and common files
 */

import { BaseExporter } from '../base/base-exporter.js';
import type {
  OssaAgent,
  ExportOptions,
  ExportFile,
  ValidationError,
  ValidationWarning,
} from '../base/adapter.interface.js';

export class MCPAdapter extends BaseExporter {
  readonly platform = 'mcp';
  readonly displayName = 'Model Context Protocol';
  readonly description = 'MCP server for Claude Code and other MCP clients';
  readonly status = 'production' as const;
  readonly supportedVersions = ['v{{VERSION}}'];

  /**
   * Platform-specific validation for MCP compatibility
   */
  protected platformValidate(manifest: OssaAgent): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

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

    // ── MCP 2026-07-28 transport-mode guards ─────────────────────────────
    const mcp = this.getMcpProtocol(manifest);
    const specVersion = (mcp?.specVersion as string) || '2026-07-28';

    // Hard error: stateful transport is removed in 2026-07-28 (SEP-2567).
    if (mcp?.transport === 'stateful' && specVersion === '2026-07-28') {
      errors.push({
        message:
          "MCP 2026-07-28 does not support stateful transport. Use specVersion: '2025-11-25' or switch to transport: 'stateless'.",
        path: 'protocols.mcp.transport',
        code: 'MCP_STATEFUL_UNSUPPORTED',
      });
    }

    // Deprecation warnings: a 2025-11-25 manifest still using sampling, roots,
    // or protocol logging — deprecated in 2026-07-28 (12-month migration window).
    if (specVersion === '2025-11-25') {
      const deprecated = (mcp?.deprecated as Record<string, boolean>) || {};
      const caps = (mcp?.capabilities as Record<string, boolean>) || {};
      const uses: Array<[string, boolean]> = [
        ['sampling', Boolean(deprecated.sampling || caps.sampling)],
        ['roots', Boolean(deprecated.roots)],
        ['logging', Boolean(deprecated.logging)],
      ];
      for (const [feature, used] of uses) {
        if (used) {
          warnings.push({
            message: `MCP feature '${feature}' is deprecated in spec 2026-07-28. The 12-month migration window has started.`,
            path: `protocols.mcp.deprecated.${feature}`,
            suggestion: `Migrate off ${feature} before adopting specVersion 2026-07-28.`,
            code: 'MCP_FEATURE_DEPRECATED',
          });
        }
      }
    }

    return { errors, warnings };
  }

  /** Safely read the protocols.mcp declaration block from a manifest. */
  private getMcpProtocol(
    manifest: OssaAgent
  ): Record<string, unknown> | undefined {
    return (
      manifest as { protocols?: { mcp?: Record<string, unknown> } }
    ).protocols?.mcp;
  }

  /**
   * Resolve the effective MCP spec version: CLI flag override
   * (platformOptions.mcpSpecVersion) > manifest protocols.mcp.specVersion >
   * default '2026-07-28'.
   */
  private resolveMcpSpecVersion(
    manifest: OssaAgent,
    options?: ExportOptions
  ): string {
    const flag = options?.platformOptions?.mcpSpecVersion as string | undefined;
    const declared = this.getMcpProtocol(manifest)?.specVersion as
      | string
      | undefined;
    return flag || declared || '2026-07-28';
  }

  /**
   * Generate a client `.mcp.json` for the target spec version.
   *
   * - 2026-07-28 → stateless HTTP: { url, transport, specVersion, headers, auth }.
   *   No command/args (those are stdio/stateful patterns); no session management.
   * - 2025-11-25 → legacy stateful stdio launcher: { command, args, env }.
   */
  private generateMcpJson(
    manifest: OssaAgent,
    agentName: string,
    options?: ExportOptions
  ): string {
    const mcp = this.getMcpProtocol(manifest);
    const specVersion = this.resolveMcpSpecVersion(manifest, options);

    let serverConfig: Record<string, unknown>;

    if (specVersion === '2025-11-25') {
      // Legacy stateful stdio launcher.
      serverConfig = {
        command: 'npx',
        args: ['-y', '@bluefly/openstandardagents', 'serve', '--mcp'],
        env: {},
      };
    } else {
      // Stateless 2026-07-28 HTTP client config.
      const servers = mcp?.servers as Array<Record<string, unknown>> | undefined;
      const endpoint =
        (mcp?.endpoint as string) ||
        (servers?.[0]?.url as string) ||
        'https://REPLACE_ME/mcp';
      serverConfig = {
        url: endpoint,
        transport: 'http',
        specVersion: '2026-07-28',
        headers: {
          'MCP-Protocol-Version': '2026-07-28',
        },
        ...(mcp?.auth ? { auth: mcp.auth } : {}),
      };
    }

    return (
      JSON.stringify({ mcpServers: { [agentName]: serverConfig } }, null, 2) +
      '\n'
    );
  }

  /**
   * Generate MCP-specific files
   */
  protected async generateFiles(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportFile[]> {
    const agentName = this.getAgentName(manifest, 'mcp-server');
    const prefix = `mcp/${agentName}`;
    const files: ExportFile[] = [];

    // Generate server.ts - Main MCP server entry point
    files.push(
      this.createFile(
        `${prefix}/server.ts`,
        this.generateServerCode(manifest),
        'code',
        'typescript'
      )
    );

    // Generate tools.ts - Tool implementations
    files.push(
      this.createFile(
        `${prefix}/tools.ts`,
        this.generateToolsCode(manifest),
        'code',
        'typescript'
      )
    );

    // Generate types.ts - TypeScript types
    files.push(
      this.createFile(
        `${prefix}/types.ts`,
        this.generateTypesCode(manifest),
        'code',
        'typescript'
      )
    );

    // Use shared generators for common files
    files.push(
      this.generatePackageJsonFile(manifest, prefix, {
        main: 'server.js',
        bin: { [agentName]: './server.js' },
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
        extraKeywords: ['mcp', 'model-context-protocol', 'claude'],
      })
    );

    files.push(this.generateTsConfigFile(prefix));

    const tools = this.getTools(manifest);
    const toolsList = tools
      .map(
        (t) =>
          `- **${t.name || 'unknown'}**: ${t.description || 'No description'}`
      )
      .join('\n');

    files.push(
      this.generateReadmeFile(manifest, prefix, {
        installation: 'npm install\nnpm run build',
        usage: `### With Claude Code\n\nAdd to your \`.mcp.json\`:\n\n\`\`\`json\n{\n  "mcpServers": {\n    "${agentName}": {\n      "command": "node",\n      "args": ["./server.js"]\n    }\n  }\n}\`\`\`\n\n### Standalone\n\n\`\`\`bash\nnpm start\n\`\`\``,
        additional: toolsList
          ? [{ title: 'Available Tools', content: toolsList }]
          : undefined,
      })
    );

    // Generate .mcp.json — client config for the target MCP spec version.
    // Stateless (2026-07-28) by default; legacy stateful (2025-11-25) on request.
    files.push(
      this.createFile(
        `${prefix}/.mcp.json`,
        this.generateMcpJson(manifest, agentName, options),
        'config',
        'json'
      )
    );

    return files;
  }

  /**
   * Get example MCP-optimized manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
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
        ] as any,
        tools: [
          {
            type: 'mcp',
            name: 'read_file',
            description: 'Read contents of a file',
          },
          {
            type: 'mcp',
            name: 'write_file',
            description: 'Write contents to a file',
          },
        ],
      },
    };
  }

  /**
   * Generate server.ts - MCP server entry point
   */
  private generateServerCode(manifest: OssaAgent): string {
    const agentName = this.getAgentName(manifest, 'mcp-server');
    const description = this.getAgentDescription(manifest);

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
    const tools = this.getTools(manifest);

    const toolDefinitions = tools.map((tool) => {
      const name = (tool.name as string) || 'unknown';
      const description = (tool.description as string) || `Tool: ${name}`;
      const schema = (tool.inputSchema ||
        tool.schema || {
          type: 'object',
          properties: {},
        }) as Record<string, unknown>;

      return { name, description, inputSchema: schema };
    });

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

    const toolCases = toolDefinitions
      .map(
        (t) =>
          `    case '${t.name}':
      return runTool('${t.name}', input);`
      )
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
 * Default tool runner. Customize to call your MCP server or API.
 */
async function runTool(name: ToolName, input: ToolInput): Promise<ToolOutput> {
  return { result: input };
}

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
    const tools = this.getTools(manifest);
    const toolNames = tools
      .map((t) => `'${(t.name as string) || 'unknown'}'`)
      .join(' | ');

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
}
