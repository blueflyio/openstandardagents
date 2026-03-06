/**
 * McpBridgeService — OSSA MCP Bridge (NIST Pillar 2: Interoperability)
 *
 * Uses @modelcontextprotocol/sdk Client to connect to and introspect
 * external MCP servers, then registers them in the OSSA workspace registry.
 *
 * SOD: This service owns MCP connectivity and registry logic only.
 * HTTP routing lives in mcp.router.ts. CLI presentation in mcp.command.ts.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { injectable } from 'inversify';
import yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getApiVersion } from '../../utils/version.js';

export interface OssaMcpServerEntry {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  source: string;
  importedAt: string;
  tools?: string[];  // Tool names discovered via SDK listTools()
}

export interface McpBridgeSyncResult {
  action: 'sync';
  source: string;
  serversFound: number;
  serversImported: number;
  registryPath: string;
  servers: OssaMcpServerEntry[];
}

export interface McpBridgeListResult {
  action: 'list';
  registryPath: string;
  servers: OssaMcpServerEntry[];
}

/** Known config file locations per app — no hardcoding of values, only path resolution */
const KNOWN_CONFIG_PATHS: Record<string, string[]> = {
  'claude-desktop': [
    path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json'),
  ],
  cursor: [
    path.join(os.homedir(), '.cursor', 'mcp.json'),
    path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'mcp.json'),
  ],
};

@injectable()
export class McpBridgeService {
  private getRegistryPath(workspaceDir: string): string {
    return path.join(workspaceDir, '.agents-workspace', 'registry', 'mcp-bridge.yaml');
  }

  private loadRegistry(workspaceDir: string): OssaMcpServerEntry[] {
    const registryPath = this.getRegistryPath(workspaceDir);
    if (!fs.existsSync(registryPath)) return [];
    try {
      const content = fs.readFileSync(registryPath, 'utf8');
      const parsed = yaml.load(content) as { servers?: OssaMcpServerEntry[] };
      return parsed?.servers ?? [];
    } catch {
      return [];
    }
  }

  private saveRegistry(workspaceDir: string, servers: OssaMcpServerEntry[]): string {
    const registryPath = this.getRegistryPath(workspaceDir);
    const registryDir = path.dirname(registryPath);
    if (!fs.existsSync(registryDir)) {
      fs.mkdirSync(registryDir, { recursive: true });
    }
    fs.writeFileSync(
      registryPath,
      yaml.dump({ generatedBy: 'ossa-mcp-bridge', apiVersion: getApiVersion(), updatedAt: new Date().toISOString(), servers }, { lineWidth: 120 }),
      'utf8'
    );
    return registryPath;
  }

  private saveToolManifest(workspaceDir: string, server: OssaMcpServerEntry) {
    const toolsDir = path.join(workspaceDir, '.agents-workspace', 'tools');
    if (!fs.existsSync(toolsDir)) {
      fs.mkdirSync(toolsDir, { recursive: true });
    }

    const manifest = {
      apiVersion: 'ossa.dev/v0.5',
      kind: 'Tool',
      metadata: {
        name: server.name,
        description: `Imported MCP server from ${server.source}`,
        trust_tier: 'experimental',
        created: server.importedAt,
      },
      spec: {
        protocol: 'mcp',
        endpoint: {
          transport: server.transport,
          command: server.command,
          args: server.args,
          url: server.url,
        },
        capabilities: server.tools ?? [],
      },
    };

    const filePath = path.join(toolsDir, `${server.name}.yaml`);
    fs.writeFileSync(filePath, yaml.dump(manifest, { lineWidth: -1 }), 'utf8');
  }

  /**
   * Use @modelcontextprotocol/sdk Client to connect to a stdio server and list its tools.
   * Returns an empty array if connection fails (non-fatal — import still proceeds).
   */
  private async discoverToolsViaSDK(command: string, args: string[]): Promise<string[]> {
    let client: Client | undefined;
    try {
      const transport = new StdioClientTransport({ command, args, env: process.env as Record<string, string> });
      client = new Client({ name: 'ossa-mcp-bridge', version: '1.0.0' }, { capabilities: {} });
      await client.connect(transport);
      const { tools } = await client.listTools();
      return tools.map((t) => t.name);
    } catch {
      // Many MCP servers require API keys or context — graceful fallback
      return [];
    } finally {
      if (client) {
        try { await client.close(); } catch { /* swallow */ }
      }
    }
  }

  /**
   * Parse an external app's MCP config JSON into normalized OSSA entries.
   * Uses the standard `mcpServers` shape from Claude Desktop / Cursor.
   */
  private parseExternalConfig(configPath: string, source: string): Array<{
    name: string;
    command?: string;
    args?: string[];
    url?: string;
    transport: OssaMcpServerEntry['transport'];
  }> {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
      mcpServers?: Record<string, { command?: string; args?: string[]; url?: string; transport?: string }>;
    };
    return Object.entries(raw?.mcpServers ?? {}).map(([name, cfg]) => ({
      name,
      command: cfg.command,
      args: cfg.args,
      url: cfg.url,
      transport: (cfg.transport as OssaMcpServerEntry['transport']) ?? (cfg.command ? 'stdio' : 'sse'),
    }));
  }

  /**
   * Sync an external MCP source into the OSSA workspace registry.
   * Uses SDK Client to introspect available tools where possible.
   */
  async sync(source: string, workspaceDir: string): Promise<McpBridgeSyncResult> {
    const dir = path.resolve(workspaceDir);
    const knownPaths = KNOWN_CONFIG_PATHS[source];
    if (!knownPaths) {
      throw new Error(`Unknown MCP source: "${source}". Supported: ${Object.keys(KNOWN_CONFIG_PATHS).join(', ')}`);
    }

    const configPath = knownPaths.find((p) => fs.existsSync(p));
    if (!configPath) {
      throw new Error(`No config found for "${source}". Looked in:\n${knownPaths.join('\n')}`);
    }

    const parsed = this.parseExternalConfig(configPath, source);
    const existing = this.loadRegistry(dir);
    const existingKeys = new Set(existing.map((s) => `${s.source}::${s.name}`));
    const now = new Date().toISOString();

    const newEntries: OssaMcpServerEntry[] = [];
    for (const cfg of parsed) {
      if (existingKeys.has(`${source}::${cfg.name}`)) continue;

      // Use SDK to discover actual tool names from stdio servers
      const tools = cfg.command
        ? await this.discoverToolsViaSDK(cfg.command, cfg.args ?? [])
        : [];

      newEntries.push({ ...cfg, source, importedAt: now, tools });
    }

    const merged = [...existing, ...newEntries];
    const registryPath = this.saveRegistry(dir, merged);

    for (const entry of newEntries) {
      this.saveToolManifest(dir, entry);
    }

    return { action: 'sync', source, serversFound: parsed.length, serversImported: newEntries.length, registryPath, servers: newEntries };
  }

  async list(workspaceDir: string): Promise<McpBridgeListResult> {
    const dir = path.resolve(workspaceDir);
    const servers = this.loadRegistry(dir);
    return { action: 'list', registryPath: this.getRegistryPath(dir), servers };
  }

  /**
   * Policy-gate check: validates that a tool server is registered in the OSSA bridge.
   * Future: enforce per-agent allowlist from .agents-workspace/policy/tool-allowlist.yaml
   */
  async executeTool(agentId: string, toolName: string, workspaceDir: string): Promise<{ allowed: boolean; reason: string }> {
    const servers = this.loadRegistry(path.resolve(workspaceDir));
    const [serverName, method] = toolName.split('/');
    const server = servers.find((s) => s.name === serverName);

    if (!server) {
      return { allowed: false, reason: `"${serverName}" not in OSSA bridge registry. Run: ossa mcp bridge sync <source>` };
    }

    // Verify the specific tool name if we have a tool list from SDK discovery
    if (server.tools && server.tools.length > 0 && method && !server.tools.includes(method)) {
      return { allowed: false, reason: `Tool "${method}" not found on server "${serverName}". Known tools: ${server.tools.join(', ')}` };
    }

    return { allowed: true, reason: `Agent "${agentId}" is authorized to call "${toolName}" via OSSA bridge.` };
  }
}
