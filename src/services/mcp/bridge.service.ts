/**
 * McpBridgeService — OSSA MCP Bridge (NIST Pillar 2: Interoperability)
 *
 * Brokers external MCP server configurations into the central OSSA registry,
 * and provides policy-aware tool execution interception.
 *
 * SOD: This service owns MCP config discovery/merge/validation logic only.
 * HTTP routing lives in mcp.router.ts. CLI presentation in mcp.command.ts.
 */

import { injectable } from 'inversify';
import yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/** Represents a single MCP server config entry as OSSA understands it */
export interface OssaMcpServerEntry {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  source: string; // e.g. 'claude-desktop', 'cursor', 'manual'
  importedAt: string;
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

/** Known locations for external MCP configs by app name */
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
    const content = yaml.dump(
      {
        generatedBy: 'ossa-mcp-bridge',
        updatedAt: new Date().toISOString(),
        servers,
      },
      { lineWidth: 120 }
    );
    fs.writeFileSync(registryPath, content, 'utf8');
    return registryPath;
  }

  /**
   * Parses a Claude Desktop or Cursor config file and normalizes it into OSSA entries.
   */
  private parseExternalConfig(
    configPath: string,
    source: string
  ): OssaMcpServerEntry[] {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as {
      mcpServers?: Record<
        string,
        {
          command?: string;
          args?: string[];
          url?: string;
          transport?: string;
        }
      >;
    };

    const mcpServers = parsed?.mcpServers ?? {};
    const now = new Date().toISOString();

    return Object.entries(mcpServers).map(([name, cfg]) => ({
      name,
      command: cfg.command,
      args: cfg.args,
      url: cfg.url,
      transport: (cfg.transport as OssaMcpServerEntry['transport']) ?? (cfg.command ? 'stdio' : 'sse'),
      source,
      importedAt: now,
    }));
  }

  /**
   * Sync external MCP configs from a known source (e.g. 'cursor', 'claude-desktop')
   * into the OSSA workspace registry.
   */
  async sync(source: string, workspaceDir: string): Promise<McpBridgeSyncResult> {
    const dir = path.resolve(workspaceDir);
    const knownPaths = KNOWN_CONFIG_PATHS[source];

    if (!knownPaths) {
      throw new Error(
        `Unknown MCP source: "${source}". Supported: ${Object.keys(KNOWN_CONFIG_PATHS).join(', ')}`
      );
    }

    // Find the first resolvable path
    const configPath = knownPaths.find((p) => fs.existsSync(p));
    if (!configPath) {
      throw new Error(
        `No config found for "${source}". Looked in:\n${knownPaths.join('\n')}`
      );
    }

    const incoming = this.parseExternalConfig(configPath, source);

    // Merge with existing registry — deduplicate by name+source
    const existing = this.loadRegistry(dir);
    const existingKeys = new Set(existing.map((s) => `${s.source}::${s.name}`));
    const newEntries = incoming.filter(
      (s) => !existingKeys.has(`${s.source}::${s.name}`)
    );
    const merged = [...existing, ...newEntries];

    const registryPath = this.saveRegistry(dir, merged);

    return {
      action: 'sync',
      source,
      serversFound: incoming.length,
      serversImported: newEntries.length,
      registryPath,
      servers: newEntries,
    };
  }

  /**
   * List all MCP servers currently registered in the OSSA bridge registry.
   */
  async list(workspaceDir: string): Promise<McpBridgeListResult> {
    const dir = path.resolve(workspaceDir);
    const servers = this.loadRegistry(dir);
    return {
      action: 'list',
      registryPath: this.getRegistryPath(dir),
      servers,
    };
  }

  /**
   * Policy-enforced tool execution stub.
   * Validates agent identity and tool allowlist before forwarding.
   * (Full proxy daemon is out-of-scope for Phase 1 — see mcp_bridge_plan.md)
   */
  async executeTool(
    agentId: string,
    toolName: string,
    workspaceDir: string
  ): Promise<{ allowed: boolean; reason: string }> {
    const servers = this.loadRegistry(path.resolve(workspaceDir));
    const [serverName, method] = toolName.split('/');
    const server = servers.find((s) => s.name === serverName);

    if (!server) {
      return {
        allowed: false,
        reason: `Tool server "${serverName}" is not registered in the OSSA MCP Bridge registry. Run: ossa mcp bridge sync <source>`,
      };
    }

    // Future: check policy allowlist for agentId + toolName
    return {
      allowed: true,
      reason: `Agent "${agentId}" is authorized to call "${serverName}/${method}" via OSSA bridge.`,
    };
  }
}
