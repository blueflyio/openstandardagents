/**
 * Claude Agent SDK Platform Adapter
 * Exports OSSA agent manifests to runnable Claude Agent SDK applications
 *
 * Generates complete, runnable projects for:
 * - TypeScript (@anthropic-ai/claude-agent-sdk)
 * - Python (claude-agent-sdk)
 * - Go (community: github.com/M1n9X/claude-agent-sdk-go)
 * - Rust (community: claude_agent crate)
 *
 * SOLID: Single Responsibility - Claude Agent SDK project generation only
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
import type {
  ClaudeAgentSdkConfig,
  SdkLanguage,
  SdkMcpServerConfig,
  SdkSubAgent,
  SdkToolDefinition,
  ClaudeModel,
  PermissionMode,
  ClaudeAgentSdkExportOptions,
} from './types.js';

export class ClaudeAgentSdkAdapter extends BaseExporter {
  readonly platform = 'claude-agent-sdk';
  readonly displayName = 'Claude Agent SDK';
  readonly description =
    'Runnable Claude Agent SDK applications (TypeScript, Python, Go, Rust)';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['v{{VERSION}}'];

  /**
   * Platform-specific validation for Claude Agent SDK compatibility
   */
  protected platformValidate(manifest: OssaAgent): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const spec = manifest.spec;

    if (!spec?.role) {
      errors.push({
        message: 'spec.role is required for Claude Agent SDK (system prompt)',
        path: 'spec.role',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    // Warn if using non-Anthropic provider
    const llm = spec?.llm as Record<string, unknown> | undefined;
    const provider = typeof llm === 'string' ? llm : (llm?.provider as string);
    if (provider && provider !== 'anthropic' && provider !== 'claude') {
      warnings.push({
        message: `LLM provider '${provider}' detected; Claude Agent SDK uses Anthropic models. Provider will be mapped to closest Claude model.`,
        path: 'spec.llm.provider',
        suggestion: 'Set spec.llm.provider to "anthropic" for native support',
      });
    }

    return { errors, warnings };
  }

  /**
   * Generate Claude Agent SDK project files
   */
  protected async generateFiles(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportFile[]> {
    const agentName = this.getAgentName(manifest, 'claude-agent');
    const prefix = `claude-agent-sdk/${agentName}`;
    const files: ExportFile[] = [];
    const config = this.buildConfig(manifest);

    const sdkOpts = (options?.platformOptions ||
      {}) as ClaudeAgentSdkExportOptions;
    const languages: SdkLanguage[] = sdkOpts.languages || [
      'typescript',
      'python',
    ];

    // Generate for each target language
    for (const lang of languages) {
      switch (lang) {
        case 'typescript':
          files.push(
            ...this.generateTypeScriptProject(config, prefix, sdkOpts)
          );
          break;
        case 'python':
          files.push(...this.generatePythonProject(config, prefix, sdkOpts));
          break;
        case 'go':
          files.push(...this.generateGoProject(config, prefix));
          break;
        case 'rust':
          files.push(...this.generateRustProject(config, prefix));
          break;
      }
    }

    // Shared .env.example
    files.push(
      this.createFile(
        `${prefix}/.env.example`,
        this.generateEnvExample(config),
        'config'
      )
    );

    // README
    files.push(
      this.generateReadmeFile(manifest, prefix, {
        installation: languages
          .map((l) => this.getInstallInstructions(l, agentName))
          .join('\n\n'),
        usage: languages
          .map((l) => this.getUsageInstructions(l, agentName))
          .join('\n\n'),
        additional: [
          {
            title: 'Generated Languages',
            content: languages.map((l) => `- ${l}`).join('\n'),
          },
          {
            title: 'Agent Configuration',
            content: `- **Model:** ${config.model}\n- **Permission Mode:** ${config.permissionMode}\n- **Max Turns:** ${config.maxTurns || 'unlimited'}\n- **Tools:** ${config.allowedTools.length} built-in, ${config.customTools.length} custom\n- **MCP Servers:** ${Object.keys(config.mcpServers).length}\n- **Sub-agents:** ${Object.keys(config.agents).length}`,
          },
        ],
      })
    );

    return files;
  }

  /**
   * Get example manifest
   */
  getExample(): OssaAgent {
    return {
      apiVersion: 'ossa/v{{VERSION}}',
      kind: 'Agent',
      metadata: {
        name: 'claude-sdk-agent',
        version: '1.0.0',
        description: 'AI agent built with Claude Agent SDK',
      },
      spec: {
        role: 'You are a helpful AI assistant that can search the web, read files, and execute code to help users with their tasks.',
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
        } as any,
        tools: [
          {
            type: 'function',
            name: 'web_search',
            description: 'Search the web for information',
          },
          {
            type: 'function',
            name: 'read_file',
            description: 'Read a file from disk',
          },
        ],
        capabilities: ['web-search', 'file-access', 'code-execution'] as any,
      },
    };
  }

  // ── Config Builder ─────────────────────────────────────────────────

  private buildConfig(manifest: OssaAgent): ClaudeAgentSdkConfig {
    const meta = manifest.metadata || { name: 'agent', version: '1.0.0' };
    const spec = (manifest.spec || {}) as Record<string, unknown>;
    const llm = spec.llm as Record<string, unknown> | undefined;

    return {
      name: meta.name || 'claude-agent',
      description:
        meta.description || 'OSSA agent exported to Claude Agent SDK',
      systemPrompt: (spec.role as string) || 'You are a helpful AI assistant.',
      model: this.mapModel(llm),
      permissionMode: this.mapPermissionMode(manifest),
      maxTurns: ((spec as any).max_iterations as number) || undefined,
      maxBudgetUsd: (llm?.maxBudgetUsd as number) || undefined,
      allowedTools: this.mapBuiltInTools(manifest),
      mcpServers: this.mapMcpServers(manifest),
      agents: this.mapSubAgents(manifest),
      customTools: this.mapCustomTools(manifest),
      version: meta.version || '1.0.0',
      ossaVersion: manifest.apiVersion || 'ossa/v0.4',
    };
  }

  private mapModel(llm: Record<string, unknown> | undefined): ClaudeModel {
    if (!llm) return 'claude-sonnet-4-20250514';
    const model = typeof llm === 'string' ? llm : (llm.model as string);
    if (!model) return 'claude-sonnet-4-20250514';

    // Map common model patterns
    if (model.includes('opus')) return 'claude-opus-4-20250514';
    if (model.includes('haiku')) return 'claude-haiku-4-5-20251001';
    if (model.includes('sonnet')) return 'claude-sonnet-4-20250514';
    if (model.includes('claude')) return model; // pass-through exact Claude models

    // Default for non-Claude models
    return 'claude-sonnet-4-20250514';
  }

  private mapPermissionMode(manifest: OssaAgent): PermissionMode {
    const autonomy = manifest.spec?.autonomy as
      | Record<string, unknown>
      | undefined;
    if (!autonomy) return 'default';

    const level = (autonomy.level as string) || '';
    if (level === 'full' || level === 'autonomous') return 'bypassPermissions';
    if (level === 'supervised') return 'acceptEdits';
    if (level === 'planning') return 'planMode';
    return 'default';
  }

  private mapBuiltInTools(manifest: OssaAgent): string[] {
    const capabilities = this.getCapabilities(manifest);
    const tools: string[] = [];

    // Map OSSA capabilities to Claude Agent SDK built-in tools
    const capMap: Record<string, string[]> = {
      'web-search': ['WebSearch', 'WebFetch'],
      'file-access': ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
      'file-read': ['Read', 'Glob', 'Grep'],
      'file-write': ['Read', 'Write', 'Edit'],
      'code-execution': ['Bash'],
      shell: ['Bash'],
      bash: ['Bash'],
      'code-analysis': ['Read', 'Glob', 'Grep'],
      explore: ['Read', 'Glob', 'Grep'],
    };

    for (const cap of capabilities) {
      const mapped = capMap[cap];
      if (mapped) {
        for (const t of mapped) {
          if (!tools.includes(t)) tools.push(t);
        }
      }
    }

    return tools;
  }

  private mapMcpServers(
    manifest: OssaAgent
  ): Record<string, SdkMcpServerConfig> {
    const servers: Record<string, SdkMcpServerConfig> = {};
    const ossaTools = this.getTools(manifest);

    for (const tool of ossaTools) {
      if (tool.type === 'mcp' && tool.server) {
        const name = String(tool.server);
        if (!servers[name]) {
          servers[name] = {
            type: (tool.transport as 'stdio' | 'sse' | 'http') || 'stdio',
            ...(tool.command ? { command: String(tool.command) } : {}),
            ...(tool.args ? { args: tool.args as string[] } : {}),
            ...(tool.url ? { url: String(tool.url) } : {}),
            ...(tool.env ? { env: tool.env as Record<string, string> } : {}),
          };
        }
      }
    }

    // Also check extensions.mcp
    const extensions = (manifest as Record<string, unknown>).extensions as
      | Record<string, unknown>
      | undefined;
    const mcpExt = extensions?.mcp as Record<string, unknown> | undefined;
    if (mcpExt?.servers && typeof mcpExt.servers === 'object') {
      for (const [name, config] of Object.entries(
        mcpExt.servers as Record<string, unknown>
      )) {
        if (!servers[name] && config && typeof config === 'object') {
          const cfg = config as Record<string, unknown>;
          servers[name] = {
            type: (cfg.transport as 'stdio' | 'sse' | 'http') || 'stdio',
            ...(cfg.command ? { command: String(cfg.command) } : {}),
            ...(cfg.args ? { args: cfg.args as string[] } : {}),
            ...(cfg.url ? { url: String(cfg.url) } : {}),
          };
        }
      }
    }

    return servers;
  }

  private mapSubAgents(manifest: OssaAgent): Record<string, SdkSubAgent> {
    const agents: Record<string, SdkSubAgent> = {};

    // Check for team/swarm definitions
    const specAny = manifest.spec as Record<string, unknown> | undefined;
    const team = specAny?.team as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(team)) {
      for (const member of team) {
        const name = String(member.name || member.role || 'agent');
        agents[name] = {
          name,
          description: String(
            member.description || member.goal || `Sub-agent: ${name}`
          ),
          systemPrompt: String(member.role || member.backstory || ''),
          tools: member.tools ? (member.tools as string[]) : undefined,
        };
      }
    }

    return agents;
  }

  private mapCustomTools(manifest: OssaAgent): SdkToolDefinition[] {
    const tools: SdkToolDefinition[] = [];
    const ossaTools = this.getTools(manifest);

    for (const tool of ossaTools) {
      // Skip MCP tools (handled separately)
      if (tool.type === 'mcp') continue;

      const name = String(tool.name || 'unnamed');
      tools.push({
        name,
        description: String(tool.description || `Tool: ${name}`),
        inputSchema: (tool.inputSchema ||
          tool.input_schema ||
          tool.parameters || {
            type: 'object',
            properties: {},
          }) as Record<string, unknown>,
      });
    }

    return tools;
  }

  // ── TypeScript Generator ───────────────────────────────────────────

  private generateTypeScriptProject(
    config: ClaudeAgentSdkConfig,
    prefix: string,
    opts: ClaudeAgentSdkExportOptions
  ): ExportFile[] {
    const files: ExportFile[] = [];
    const tsPrefix = `${prefix}/typescript`;

    // package.json
    files.push(
      this.createFile(
        `${tsPrefix}/package.json`,
        JSON.stringify(
          {
            name: config.name,
            version: config.version,
            type: 'module',
            description: config.description,
            scripts: {
              start: 'npx tsx src/index.ts',
              build: 'tsc',
              typecheck: 'tsc --noEmit',
            },
            dependencies: {
              '@anthropic-ai/claude-agent-sdk': '^0.1.0',
            },
            devDependencies: {
              typescript: '^5.7.0',
              tsx: '^4.0.0',
              '@types/node': '^22.0.0',
            },
          },
          null,
          2
        ),
        'config',
        'json'
      )
    );

    // tsconfig.json
    files.push(
      this.createFile(
        `${tsPrefix}/tsconfig.json`,
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'NodeNext',
              moduleResolution: 'NodeNext',
              strict: true,
              esModuleInterop: true,
              outDir: 'dist',
              rootDir: 'src',
              declaration: true,
              sourceMap: true,
            },
            include: ['src'],
          },
          null,
          2
        ),
        'config',
        'json'
      )
    );

    // src/index.ts - Main entry point
    files.push(
      this.createFile(
        `${tsPrefix}/src/index.ts`,
        this.generateTsEntryPoint(config, opts),
        'code',
        'typescript'
      )
    );

    // src/config.ts - Agent configuration
    files.push(
      this.createFile(
        `${tsPrefix}/src/config.ts`,
        this.generateTsConfig(config),
        'code',
        'typescript'
      )
    );

    // Custom tools file if tools exist
    if (config.customTools.length > 0 && opts.includeCustomTools !== false) {
      files.push(
        this.createFile(
          `${tsPrefix}/src/tools.ts`,
          this.generateTsTools(config),
          'code',
          'typescript'
        )
      );
    }

    return files;
  }

  private generateTsEntryPoint(
    config: ClaudeAgentSdkConfig,
    opts: ClaudeAgentSdkExportOptions
  ): string {
    const hasTools =
      config.customTools.length > 0 && opts.includeCustomTools !== false;

    let imports = `import { query } from '@anthropic-ai/claude-agent-sdk';
import { agentOptions } from './config.js';`;

    if (hasTools) {
      imports += `\nimport { mcpServer } from './tools.js';`;
    }

    let mcpSetup = '';
    if (hasTools) {
      mcpSetup = `
  // Add custom tools MCP server
  const options = {
    ...agentOptions,
    mcpServers: {
      ...agentOptions.mcpServers,
      'custom-tools': mcpServer,
    },
  };`;
    }

    const optionsVar = hasTools ? 'options' : 'agentOptions';

    return `/**
 * ${config.name} - Claude Agent SDK Application
 * Generated from OSSA ${config.ossaVersion} manifest
 *
 * Run: npx tsx src/index.ts
 */
${imports}

async function main() {
  const prompt = process.argv.slice(2).join(' ') || 'Hello! What can you help me with?';
  console.log(\`\\n> \${prompt}\\n\`);
${mcpSetup}

  // Run the agent
  const conversation = query({
    prompt,
    options: ${optionsVar},
  });

  // Stream responses
  for await (const message of conversation) {
    if (message.type === 'assistant') {
      // Assistant text response
      for (const block of message.message.content) {
        if (block.type === 'text') {
          process.stdout.write(block.text);
        }
      }
    } else if (message.type === 'result') {
      // Final result
      console.log(\`\\n\\n--- Session complete (cost: $\${message.costUsd?.toFixed(4) || '?'}) ---\`);
    }
  }
}

main().catch(console.error);
`;
  }

  private generateTsConfig(config: ClaudeAgentSdkConfig): string {
    const mcpEntries = Object.entries(config.mcpServers);
    const agentEntries = Object.entries(config.agents);

    let mcpBlock = '';
    if (mcpEntries.length > 0) {
      const mcpObj = mcpEntries
        .map(([name, cfg]) => {
          if (cfg.type === 'stdio') {
            return `    '${name}': {\n      type: 'stdio' as const,\n      command: '${cfg.command || 'npx'}',\n      args: ${JSON.stringify(cfg.args || [])},${cfg.env ? `\n      env: ${JSON.stringify(cfg.env)},` : ''}\n    }`;
          }
          return `    '${name}': {\n      type: '${cfg.type}' as const,\n      url: '${cfg.url || ''}',${cfg.headers ? `\n      headers: ${JSON.stringify(cfg.headers)},` : ''}\n    }`;
        })
        .join(',\n');
      mcpBlock = `\n  mcpServers: {\n${mcpObj}\n  },`;
    }

    let agentsBlock = '';
    if (agentEntries.length > 0) {
      const agentsObj = agentEntries
        .map(([name, agent]) => {
          return `    '${name}': {\n      description: ${JSON.stringify(agent.description)},\n      prompt: ${JSON.stringify(agent.systemPrompt)},${agent.tools ? `\n      tools: ${JSON.stringify(agent.tools)},` : ''}${agent.model ? `\n      model: '${agent.model}',` : ''}\n    }`;
        })
        .join(',\n');
      agentsBlock = `\n  agents: {\n${agentsObj}\n  },`;
    }

    return `/**
 * Agent configuration for ${config.name}
 * Generated from OSSA ${config.ossaVersion} manifest
 */
import type { Options } from '@anthropic-ai/claude-agent-sdk';

export const agentOptions: Options = {
  systemPrompt: ${JSON.stringify(config.systemPrompt)},
  model: '${config.model}',
  permissionMode: '${config.permissionMode}',${config.maxTurns ? `\n  maxTurns: ${config.maxTurns},` : ''}${config.maxBudgetUsd ? `\n  maxBudgetUsd: ${config.maxBudgetUsd},` : ''}${config.allowedTools.length > 0 ? `\n  allowedTools: ${JSON.stringify(config.allowedTools)},` : ''}${mcpBlock}${agentsBlock}
};
`;
  }

  private generateTsTools(config: ClaudeAgentSdkConfig): string {
    const toolFns = config.customTools
      .map((tool) => {
        const params = Object.keys(
          (tool.inputSchema as Record<string, unknown>).properties || {}
        );
        const paramStr =
          params.length > 0
            ? `{ ${params.join(', ')} }: { ${params.map((p) => `${p}: unknown`).join('; ')} }`
            : '';
        return `
server.tool(
  '${tool.name}',
  ${JSON.stringify(tool.description)},
  ${JSON.stringify(tool.inputSchema, null, 4)},
  async (${paramStr}) => {
    // TODO: Implement ${tool.name}
    return { result: 'Not implemented yet' };
  }
);`;
      })
      .join('\n');

    return `/**
 * Custom tools for ${config.name}
 * Generated from OSSA ${config.ossaVersion} manifest
 */
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';

const server = createSdkMcpServer();
${toolFns}

export { server as mcpServer };
`;
  }

  // ── Python Generator ───────────────────────────────────────────────

  private generatePythonProject(
    config: ClaudeAgentSdkConfig,
    prefix: string,
    opts: ClaudeAgentSdkExportOptions
  ): ExportFile[] {
    const files: ExportFile[] = [];
    const pyPrefix = `${prefix}/python`;

    // requirements.txt
    files.push(
      this.createFile(
        `${pyPrefix}/requirements.txt`,
        'claude-agent-sdk>=0.1.0\npython-dotenv>=1.0.0\n',
        'config'
      )
    );

    // main.py
    files.push(
      this.createFile(
        `${pyPrefix}/main.py`,
        this.generatePyEntryPoint(config, opts),
        'code',
        'python'
      )
    );

    // config.py
    files.push(
      this.createFile(
        `${pyPrefix}/config.py`,
        this.generatePyConfig(config),
        'code',
        'python'
      )
    );

    // Custom tools
    if (config.customTools.length > 0 && opts.includeCustomTools !== false) {
      files.push(
        this.createFile(
          `${pyPrefix}/tools.py`,
          this.generatePyTools(config),
          'code',
          'python'
        )
      );
    }

    return files;
  }

  private generatePyEntryPoint(
    config: ClaudeAgentSdkConfig,
    opts: ClaudeAgentSdkExportOptions
  ): string {
    const hasTools =
      config.customTools.length > 0 && opts.includeCustomTools !== false;

    const lines = [
      '"""',
      `${config.name} - Claude Agent SDK Application`,
      `Generated from OSSA ${config.ossaVersion} manifest`,
      '',
      'Run: python main.py',
      '"""',
      'import asyncio',
      'import sys',
      '',
      'from claude_agent_sdk import query',
      'from config import agent_options',
    ];

    if (hasTools) {
      lines.push('from tools import mcp_server');
    }

    lines.push(
      '',
      '',
      'async def main():',
      '    prompt = " ".join(sys.argv[1:]) or "Hello! What can you help me with?"',
      '    print(f"\\n> {prompt}\\n")',
      '',
      '    options = agent_options'
    );

    if (hasTools) {
      lines.push(
        '',
        '    # Add custom tools MCP server',
        '    options.mcp_servers = {',
        '        **(options.mcp_servers or {}),',
        '        "custom-tools": mcp_server,',
        '    }'
      );
    }

    lines.push(
      '',
      '    # Run the agent',
      '    async for message in query(prompt=prompt, options=options):',
      '        if message.type == "assistant":',
      '            for block in message.message.content:',
      '                if hasattr(block, "text"):',
      '                    print(block.text, end="", flush=True)',
      '        elif message.type == "result":',
      '            cost = getattr(message, "cost_usd", None)',
      '            print(f"\\n\\n--- Session complete (cost: {cost or \'?\'}) ---")',
      '',
      '',
      'if __name__ == "__main__":',
      '    asyncio.run(main())',
      ''
    );

    return lines.join('\n');
  }

  private generatePyConfig(config: ClaudeAgentSdkConfig): string {
    const mcpEntries = Object.entries(config.mcpServers);
    const agentEntries = Object.entries(config.agents);

    let mcpBlock = '';
    if (mcpEntries.length > 0) {
      const items = mcpEntries
        .map(([name, cfg]) => {
          if (cfg.type === 'stdio') {
            return `        "${name}": {\n            "type": "stdio",\n            "command": "${cfg.command || 'npx'}",\n            "args": ${JSON.stringify(cfg.args || [])},\n        }`;
          }
          return `        "${name}": {\n            "type": "${cfg.type}",\n            "url": "${cfg.url || ''}",\n        }`;
        })
        .join(',\n');
      mcpBlock = `\n    mcp_servers={\n${items}\n    },`;
    }

    let agentsBlock = '';
    if (agentEntries.length > 0) {
      const items = agentEntries
        .map(([name, agent]) => {
          return `        "${name}": AgentDefinition(\n            description=${JSON.stringify(agent.description)},\n            prompt=${JSON.stringify(agent.systemPrompt)},\n        )`;
        })
        .join(',\n');
      agentsBlock = `\n    agents={\n${items}\n    },`;
    }

    return `"""
Agent configuration for ${config.name}
Generated from OSSA ${config.ossaVersion} manifest
"""
from claude_agent_sdk import ClaudeAgentOptions${agentEntries.length > 0 ? ', AgentDefinition' : ''}

agent_options = ClaudeAgentOptions(
    system_prompt=${JSON.stringify(config.systemPrompt)},
    model="${config.model}",
    permission_mode="${config.permissionMode}",${config.maxTurns ? `\n    max_turns=${config.maxTurns},` : ''}${config.maxBudgetUsd ? `\n    max_budget_usd=${config.maxBudgetUsd},` : ''}${config.allowedTools.length > 0 ? `\n    allowed_tools=${JSON.stringify(config.allowedTools)},` : ''}${mcpBlock}${agentsBlock}
)
`;
  }

  private generatePyTools(config: ClaudeAgentSdkConfig): string {
    const toolFns = config.customTools
      .map((tool) => {
        const params = Object.keys(
          (tool.inputSchema as Record<string, unknown>).properties || {}
        );
        const paramStr =
          params.length > 0 ? params.map((p) => `${p}: str`).join(', ') : '';
        return `
@tool(
    name="${tool.name}",
    description=${JSON.stringify(tool.description)},
)
async def ${tool.name.replace(/-/g, '_')}(${paramStr}) -> dict:
    """${tool.description}"""
    # TODO: Implement ${tool.name}
    return {"result": "Not implemented yet"}
`;
      })
      .join('\n');

    return `"""
Custom tools for ${config.name}
Generated from OSSA ${config.ossaVersion} manifest
"""
from claude_agent_sdk import tool, create_sdk_mcp_server

${toolFns}

mcp_server = create_sdk_mcp_server()
`;
  }

  // ── Go Generator (community SDK) ──────────────────────────────────

  private generateGoProject(
    config: ClaudeAgentSdkConfig,
    prefix: string
  ): ExportFile[] {
    const files: ExportFile[] = [];
    const goPrefix = `${prefix}/go`;

    // go.mod
    files.push(
      this.createFile(
        `${goPrefix}/go.mod`,
        `module ${config.name.replace(/[^a-z0-9-]/g, '-')}\n\ngo 1.22\n\nrequire github.com/M1n9X/claude-agent-sdk-go v0.1.0\n`,
        'config',
        'go'
      )
    );

    // main.go
    files.push(
      this.createFile(
        `${goPrefix}/main.go`,
        `package main

// ${config.name} - Claude Agent SDK Application (Go - Community SDK)
// Generated from OSSA ${config.ossaVersion} manifest
//
// Community SDK: github.com/M1n9X/claude-agent-sdk-go
// Note: This is a community-maintained SDK, not an official Anthropic product.

import (
	"context"
	"fmt"
	"os"
	"strings"

	claude "github.com/M1n9X/claude-agent-sdk-go"
)

func main() {
	prompt := "Hello! What can you help me with?"
	if len(os.Args) > 1 {
		prompt = strings.Join(os.Args[1:], " ")
	}

	fmt.Printf("\\n> %s\\n\\n", prompt)

	client := claude.NewClient(os.Getenv("ANTHROPIC_API_KEY"))

	resp, err := client.Query(context.Background(), claude.QueryOptions{
		Prompt:       prompt,
		SystemPrompt: ${JSON.stringify(config.systemPrompt)},
		Model:        "${config.model}",
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\\n", err)
		os.Exit(1)
	}

	fmt.Println(resp.Text)
}
`,
        'code',
        'go'
      )
    );

    return files;
  }

  // ── Rust Generator (community crate) ──────────────────────────────

  private generateRustProject(
    config: ClaudeAgentSdkConfig,
    prefix: string
  ): ExportFile[] {
    const files: ExportFile[] = [];
    const rustPrefix = `${prefix}/rust`;
    const crateName = config.name.replace(/[^a-z0-9_-]/g, '-');

    // Cargo.toml
    files.push(
      this.createFile(
        `${rustPrefix}/Cargo.toml`,
        `[package]\nname = "${crateName}"\nversion = "${config.version}"\nedition = "2021"\n\n[dependencies]\nclaude_agent = "0.1"\ntokio = { version = "1", features = ["full"] }\n`,
        'config',
        'toml'
      )
    );

    // src/main.rs
    files.push(
      this.createFile(
        `${rustPrefix}/src/main.rs`,
        `// ${config.name} - Claude Agent SDK Application (Rust - Community Crate)
// Generated from OSSA ${config.ossaVersion} manifest
//
// Community crate: claude_agent
// Note: This is a community-maintained crate, not an official Anthropic product.

use claude_agent::Client;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().skip(1).collect();
    let prompt = if args.is_empty() {
        "Hello! What can you help me with?".to_string()
    } else {
        args.join(" ")
    };

    println!("\\n> {}\\n", prompt);

    let api_key = env::var("ANTHROPIC_API_KEY")
        .expect("ANTHROPIC_API_KEY environment variable must be set");

    let client = Client::new(&api_key);
    let response = client
        .query(&prompt)
        .system_prompt(${JSON.stringify(config.systemPrompt)})
        .model("${config.model}")
        .send()
        .await?;

    println!("{}", response.text());
    Ok(())
}
`,
        'code',
        'rust'
      )
    );

    return files;
  }

  // ── Shared Helpers ─────────────────────────────────────────────────

  private generateEnvExample(config: ClaudeAgentSdkConfig): string {
    let env = `# Claude Agent SDK - ${config.name}
# Generated from OSSA ${config.ossaVersion} manifest
# Get your API key at https://console.anthropic.com/

ANTHROPIC_API_KEY=your_api_key_here
`;

    // Add MCP server env vars
    for (const [name, cfg] of Object.entries(config.mcpServers)) {
      if (cfg.env) {
        for (const [key, val] of Object.entries(cfg.env)) {
          env += `\n# MCP server: ${name}\n${key}=${val}`;
        }
      }
    }

    return env;
  }

  private getInstallInstructions(lang: SdkLanguage, name: string): string {
    switch (lang) {
      case 'typescript':
        return `### TypeScript\n\n\`\`\`bash\ncd ${name}/typescript\nnpm install\ncp ../.env.example .env\n# Edit .env with your API key\nnpm start\n\`\`\``;
      case 'python':
        return `### Python\n\n\`\`\`bash\ncd ${name}/python\npip install -r requirements.txt\ncp ../.env.example .env\n# Edit .env with your API key\npython main.py\n\`\`\``;
      case 'go':
        return `### Go (Community SDK)\n\n\`\`\`bash\ncd ${name}/go\nexport ANTHROPIC_API_KEY=your_key\ngo run main.go\n\`\`\``;
      case 'rust':
        return `### Rust (Community Crate)\n\n\`\`\`bash\ncd ${name}/rust\nexport ANTHROPIC_API_KEY=your_key\ncargo run\n\`\`\``;
    }
  }

  private getUsageInstructions(lang: SdkLanguage, _name: string): string {
    switch (lang) {
      case 'typescript':
        return `### TypeScript\n\n\`\`\`bash\nnpm start -- "Your prompt here"\n\`\`\``;
      case 'python':
        return `### Python\n\n\`\`\`bash\npython main.py "Your prompt here"\n\`\`\``;
      case 'go':
        return `### Go\n\n\`\`\`bash\ngo run main.go "Your prompt here"\n\`\`\``;
      case 'rust':
        return `### Rust\n\n\`\`\`bash\ncargo run -- "Your prompt here"\n\`\`\``;
    }
  }
}
