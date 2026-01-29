import { injectable, inject, optional } from 'inversify';
import { OssaAgent } from '../types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AgentEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  schema_version: string;
  manifest_url: string;
  bundle_url?: string;
  published_at: string;
  metadata?: Record<string, unknown>;
}

export interface SearchFilters {
  query?: string;
  domain?: string;
  type?: string;
  limit?: number;
}

export interface PublishRequest {
  manifest: OssaAgent;
  version?: string;
}

@injectable()
export class RegistryService {
  private registryPath: string;
  private agentsPath: string;

  constructor(@inject('registryPath') @optional() registryPath?: string) {
    this.registryPath =
      registryPath || path.join(process.cwd(), '.ossa-registry');
    this.agentsPath = path.join(this.registryPath, 'agents');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.agentsPath, { recursive: true });
  }

  async search(filters: SearchFilters = {}): Promise<AgentEntry[]> {
    await this.initialize();
    const indexPath = path.join(this.registryPath, 'index.json');

    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent) as { agents: AgentEntry[] };
      let results = index.agents || [];

      // Apply filters
      if (filters.query) {
        const query = filters.query.toLowerCase();
        results = results.filter(
          (agent) =>
            agent.name.toLowerCase().includes(query) ||
            agent.description.toLowerCase().includes(query) ||
            agent.id.toLowerCase().includes(query)
        );
      }

      if (filters.domain) {
        results = results.filter(
          (agent) => agent.metadata?.domain === filters.domain
        );
      }

      if (filters.type) {
        results = results.filter(
          (agent) => agent.metadata?.type === filters.type
        );
      }

      // Limit results
      const limit = filters.limit || 20;
      return results.slice(0, limit);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async publish(request: PublishRequest): Promise<AgentEntry> {
    await this.initialize();
    const manifest = request.manifest;
    const agentId = manifest.metadata?.name || 'unknown-agent';
    const version = request.version || manifest.metadata?.version || '1.0.0';

    // Generate agent entry
    const entry: AgentEntry = {
      id: agentId,
      name: manifest.metadata?.name || agentId,
      version,
      description: manifest.spec?.role || '',
      schema_version: manifest.apiVersion || 'ossa/v0.3.6',
      manifest_url: `agents/${agentId}/${version}/manifest.yaml`,
      bundle_url: `agents/${agentId}/${version}/bundle.tar.gz`,
      published_at: new Date().toISOString(),
      metadata: {
        domain: manifest.metadata?.labels?.['ossa.ai/domain'],
        type: manifest.metadata?.labels?.['ossa.ai/type'],
        ...manifest.metadata,
      },
    };

    // Save manifest
    const agentDir = path.join(this.agentsPath, agentId, version);
    await fs.mkdir(agentDir, { recursive: true });
    const manifestPath = path.join(agentDir, 'manifest.yaml');
    const yaml = await import('yaml');
    await fs.writeFile(manifestPath, yaml.stringify(manifest), 'utf-8');

    // Update index
    await this.updateIndex(entry);

    return entry;
  }

  async get(agentId: string, version?: string): Promise<AgentEntry | null> {
    await this.initialize();
    const indexPath = path.join(this.registryPath, 'index.json');

    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent) as { agents: AgentEntry[] };
      const agents = index.agents || [];

      if (version) {
        return (
          agents.find((a) => a.id === agentId && a.version === version) || null
        );
      }

      // Return latest version
      const versions = agents.filter((a) => a.id === agentId);
      if (versions.length === 0) return null;

      versions.sort((a, b) => {
        return b.version.localeCompare(a.version, undefined, { numeric: true });
      });

      return versions[0];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async listVersions(agentId: string): Promise<string[]> {
    await this.initialize();
    const indexPath = path.join(this.registryPath, 'index.json');

    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent) as { agents: AgentEntry[] };
      const agents = index.agents || [];
      const versions = agents
        .filter((a) => a.id === agentId)
        .map((a) => a.version);
      return [...new Set(versions)].sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true })
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async updateIndex(entry: AgentEntry): Promise<void> {
    const indexPath = path.join(this.registryPath, 'index.json');
    let index: { agents: AgentEntry[] } = { agents: [] };

    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(indexContent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    // Remove existing entry with same id+version
    index.agents = index.agents.filter(
      (a) => !(a.id === entry.id && a.version === entry.version)
    );

    // Add new entry
    index.agents.push(entry);

    // Save index
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }
}
