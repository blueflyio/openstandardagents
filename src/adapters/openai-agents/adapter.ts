/**
 * OpenAI Agents SDK Platform Adapter
 *
 * Exports OSSA agent manifests to runnable @openai/agents TypeScript packages.
 * Generates: agent definition, MCP bridge config, guardrails, package.json, and README.
 *
 * This makes OSSA the universal contract — define once, run on OpenAI.
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

export class OpenAIAgentsAdapter extends BaseAdapter {
  readonly platform = 'openai-agents-sdk';
  readonly displayName = 'OpenAI Agents SDK';
  readonly description =
    'Runnable @openai/agents TypeScript package with MCP support, guardrails, and handoffs';
  readonly status = 'beta' as const;
  readonly supportedVersions = ['0.4', '0.5'];

  async export(
    manifest: OssaAgent,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      if (options?.validate !== false) {
        const validation = await this.validate(manifest);
        if (!validation.valid) {
          return this.createResult(
            false,
            [],
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`,
            { duration: Date.now() - startTime, warnings: validation.warnings?.map((w) => w.message) }
          );
        }
      }

      const agentName = manifest.metadata?.name || 'openai-agent';
      const safeName = agentName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      const files = [];

      // 1. Agent definition (main entry point)
      files.push(
        this.createFile(
          `${safeName}/src/agent.ts`,
          this.generateAgentCode(manifest),
          'code',
          'typescript'
        )
      );

      // 2. MCP bridge config
      if (this.hasMcpServers(manifest)) {
        files.push(
          this.createFile(
            `${safeName}/src/mcp-config.ts`,
            this.generateMcpConfig(manifest),
            'code',
            'typescript'
          )
        );
      }

      // 3. Guardrails
      if (this.hasGuardrails(manifest)) {
        files.push(
          this.createFile(
            `${safeName}/src/guardrails.ts`,
            this.generateGuardrails(manifest),
            'code',
            'typescript'
          )
        );
      }

      // 4. Runner (CLI entry point)
      files.push(
        this.createFile(
          `${safeName}/src/run.ts`,
          this.generateRunner(manifest),
          'code',
          'typescript'
        )
      );

      // 5. package.json
      files.push(
        this.createFile(
          `${safeName}/package.json`,
          this.generatePackageJson(manifest, safeName),
          'config',
          'json'
        )
      );

      // 6. tsconfig.json
      files.push(
        this.createFile(
          `${safeName}/tsconfig.json`,
          JSON.stringify(
            {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                moduleResolution: 'NodeNext',
                outDir: 'dist',
                rootDir: 'src',
                strict: true,
                esModuleInterop: true,
                declaration: true,
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

      // 7. OSSA manifest copy
      files.push(this.createManifestFile(manifest));

      return this.createResult(true, files, undefined, {
        duration: Date.now() - startTime,
        version: '0.4.6',
        warnings: [],
      });
    } catch (error: any) {
      return this.createResult(false, [], error.message, {
        duration: Date.now() - startTime,
      });
    }
  }

  async validate(manifest: OssaAgent): Promise<ValidationResult> {
    const result = await super.validate(manifest);
    const errors: ValidationError[] = [...(result.errors || [])];
    const warnings: ValidationWarning[] = [...(result.warnings || [])];

    if (!manifest.spec?.personality?.system_prompt && !manifest.spec?.personality) {
      warnings.push({
        message: 'No personality/instructions defined — agent will use generic instructions',
        path: 'spec.personality',
        code: 'MISSING_INSTRUCTIONS',
      });
    }

    if (!manifest.spec?.llm?.model) {
      warnings.push({
        message: 'No model specified — will default to gpt-4o',
        path: 'spec.llm.model',
        code: 'DEFAULT_MODEL',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  getExample(): OssaAgent {
    return {
      ossa_version: '0.4.5',
      kind: 'Agent',
      metadata: {
        name: 'platform-assistant',
        version: '1.0.0',
        description: 'BlueFly Platform Assistant with Drupal MCP tools',
      },
      spec: {
        role: 'assistant',
        personality: {
          system_prompt:
            'You are the BlueFly Platform Assistant. Use MCP tools to manage content and query data on the Drupal agent platform.',
        },
        llm: {
          provider: 'openai',
          model: 'gpt-4o',
        },
        tools: [
          { name: 'web_search', description: 'Search the web for information' },
        ],
        mcp: {
          servers: [
            {
              label: 'Drupal Platform',
              url: 'https://agentdash.bluefly.io/jsonrpc',
              transport: 'streamable-http',
            },
          ],
        },
        safety: {
          guardrails: [
            {
              name: 'no-destructive-ops',
              type: 'input',
              blocked_patterns: ['DROP TABLE', 'DELETE FROM', 'rm -rf'],
            },
          ],
        },
      },
      extensions: {
        openai_agents_sdk: {
          model_override: 'gpt-4o',
          handoff_targets: ['research-agent', 'code-agent'],
          mcp_servers: [
            {
              label: 'Drupal Platform',
              url: 'https://agentdash.bluefly.io/jsonrpc',
            },
          ],
        },
      },
    } as OssaAgent;
  }

  // ── Code Generators ─────────────────────────────────────────────

  private generateAgentCode(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'agent';
    const model = this.resolveModel(manifest);
    const instructions = this.resolveInstructions(manifest);
    const hasMcp = this.hasMcpServers(manifest);
    const hasGuards = this.hasGuardrails(manifest);

    const imports = [
      `import { Agent } from '@openai/agents';`,
    ];
    if (hasMcp) imports.push(`import { mcpServers } from './mcp-config.js';`);
    if (hasGuards) imports.push(`import { guardrails } from './guardrails.js';`);

    const agentConfig: string[] = [
      `  name: ${JSON.stringify(name)},`,
      `  instructions: ${JSON.stringify(instructions)},`,
      `  model: ${JSON.stringify(model)},`,
    ];

    if (hasMcp) agentConfig.push(`  mcp_servers: mcpServers,`);

    // Add function tools from manifest
    const tools = manifest.spec?.tools || [];
    if (tools.length > 0) {
      const toolDefs = tools.map(
        (t: any) =>
          `    { type: 'function', name: ${JSON.stringify(t.name)}, description: ${JSON.stringify(t.description || t.name)}, parameters: ${JSON.stringify(t.parameters || { type: 'object', properties: {} })} }`
      );
      agentConfig.push(`  tools: [\n${toolDefs.join(',\n')}\n  ],`);
    }

    return `${imports.join('\n')}

/**
 * ${name} — Generated from OSSA manifest v${manifest.metadata?.version || '1.0.0'}
 * ${manifest.metadata?.description || ''}
 */
export const agent = new Agent({
${agentConfig.join('\n')}
});

export default agent;
`;
  }

  private generateMcpConfig(manifest: OssaAgent): string {
    const servers = [
      ...(manifest.spec?.mcp?.servers || []),
      ...(manifest.extensions?.openai_agents_sdk?.mcp_servers || []),
    ];

    const serverDefs = servers.map(
      (s: any) => `  new MCPServerStreamableHttp({
    url: ${JSON.stringify(s.url)},
    name: ${JSON.stringify(s.label || 'MCP Server')},
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.DRUPAL_MCP_TOKEN ? { Authorization: \`Bearer \${process.env.DRUPAL_MCP_TOKEN}\` } : {}),
    },
  })`
    );

    return `import { MCPServerStreamableHttp } from '@openai/agents';

/**
 * MCP Server connections — bridges to external tool providers.
 * Each server exposes tools that agents can call.
 */
export const mcpServers = [
${serverDefs.join(',\n')}
];
`;
  }

  private generateGuardrails(manifest: OssaAgent): string {
    const guards = manifest.spec?.safety?.guardrails || [];

    const guardDefs = guards.map((g: any) => {
      const patterns = (g.blocked_patterns || [])
        .map((p: string) => `    ${JSON.stringify(p)}`)
        .join(',\n');
      return `{
  name: ${JSON.stringify(g.name)},
  type: ${JSON.stringify(g.type || 'input')},
  blockedPatterns: [
${patterns}
  ],
}`;
    });

    return `/**
 * Agent guardrails — safety checks for input/output.
 */

export interface GuardrailDef {
  name: string;
  type: 'input' | 'output';
  blockedPatterns: string[];
  maxLength?: number;
}

export const guardrails: GuardrailDef[] = [
  ${guardDefs.join(',\n  ')}
];

/**
 * Check input against guardrails. Returns null if safe, error string if blocked.
 */
export function checkGuardrails(text: string, type: 'input' | 'output'): string | null {
  for (const guard of guardrails) {
    if (guard.type !== type) continue;
    for (const pattern of guard.blockedPatterns) {
      if (new RegExp(pattern, 'i').test(text)) {
        return \`Blocked by guardrail "\${guard.name}": matched pattern "\${pattern}"\`;
      }
    }
    if (guard.maxLength && text.length > guard.maxLength) {
      return \`Blocked by guardrail "\${guard.name}": exceeds max length \${guard.maxLength}\`;
    }
  }
  return null;
}
`;
  }

  private generateRunner(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'agent';
    return `import { run } from '@openai/agents';
import { agent } from './agent.js';

/**
 * CLI runner for ${name}
 * Usage: npx tsx src/run.ts "Your prompt here"
 */
async function main() {
  const input = process.argv.slice(2).join(' ') || 'Hello, what can you do?';

  console.log(\`Running ${name} with input: \${input}\`);
  console.log('---');

  const result = await run(agent, input, { maxTurns: 10 });

  console.log('Output:', result.final_output);

  if (result.new_items) {
    const toolCalls = result.new_items.filter((i: any) => i.type === 'tool_call_item');
    if (toolCalls.length > 0) {
      console.log(\`\\nTool calls: \${toolCalls.length}\`);
      for (const call of toolCalls) {
        console.log(\`  - \${(call as any).name}: \${(call as any).arguments}\`);
      }
    }
  }
}

main().catch(console.error);
`;
  }

  private generatePackageJson(manifest: OssaAgent, safeName: string): string {
    return JSON.stringify(
      {
        name: `@ossa/${safeName}`,
        version: manifest.metadata?.version || '1.0.0',
        description: manifest.metadata?.description || `OSSA agent: ${manifest.metadata?.name}`,
        type: 'module',
        main: 'dist/agent.js',
        types: 'dist/agent.d.ts',
        scripts: {
          build: 'tsc',
          start: 'tsx src/run.ts',
          dev: 'tsx watch src/run.ts',
        },
        dependencies: {
          '@openai/agents': '^0.4.6',
          openai: '^6.21.0',
        },
        devDependencies: {
          tsx: '^4.0.0',
          typescript: '^5.9.0',
        },
      },
      null,
      2
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private resolveModel(manifest: OssaAgent): string {
    return (
      manifest.extensions?.openai_agents_sdk?.model_override ||
      manifest.spec?.llm?.model ||
      'gpt-4o'
    );
  }

  private resolveInstructions(manifest: OssaAgent): string {
    const parts: string[] = [];
    const p = manifest.spec?.personality;
    if (p?.system_prompt) parts.push(p.system_prompt);
    if (p?.tone) parts.push(`Communication style: ${p.tone}`);
    if (p?.expertise?.length) parts.push(`Expertise: ${p.expertise.join(', ')}`);
    return parts.join('\n\n') || 'You are a helpful assistant.';
  }

  private hasMcpServers(manifest: OssaAgent): boolean {
    return (
      (manifest.spec?.mcp?.servers?.length || 0) > 0 ||
      (manifest.extensions?.openai_agents_sdk?.mcp_servers?.length || 0) > 0
    );
  }

  private hasGuardrails(manifest: OssaAgent): boolean {
    return (manifest.spec?.safety?.guardrails?.length || 0) > 0;
  }
}

export default OpenAIAgentsAdapter;
