// @ts-nocheck
/**
 * Registry Index Service
 * Manages registry index.json for agent discovery
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { injectable } from 'inversify';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export interface RegistryIndex {
  registry_version: string;
  last_updated: string;
  agents: AgentEntry[];
}

export interface Artifacts {
  bundle: {
    sha256: string;
    size?: number;
  };
  sbom?: {
    sha256: string;
    format?: 'spdx' | 'cyclonedx';
  };
}

export interface SecurityPosture {
  compliance_level?: 'baseline' | 'enterprise' | 'fedramp' | 'hipaa' | 'soc2';
  audit_logging?: boolean;
  encryption_at_rest?: boolean;
  encryption_in_transit?: boolean;
  network?: {
    egress?: boolean;
    ingress?: boolean;
  };
  secrets?: {
    required?: string[];
  };
  tools?: {
    exec?: boolean;
    file_system?: boolean;
  };
  k8s?: {
    rbac_summary?: string;
  };
}

export interface Entrypoint {
  type: 'cli' | 'api' | 'webhook' | 'grpc';
  command?: string;
  endpoint?: string;
}

export interface AgentEntry {
  id: string;
  name: string;
  version: string;
  description?: string;
  license?: string;
  frameworks?: string[];
  capabilities?: string[];
  artifacts?: Artifacts;
  security_posture?: SecurityPosture;
  entrypoints?: Entrypoint[];
  sbom_sha256?: string; // deprecated - use artifacts.sbom.sha256
  schema_version: string;
  manifest_url: string;
  bundle_url?: string;
  git_url?: string;
  published_at: string;
  published_by?: string;
  tags?: string[];
}

@injectable()
export class IndexService {
  private ajv: Ajv;

  constructor() {
    // @ts-expect-error - Ajv v8 API compatibility
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
  }

  async loadIndex(registryPath: string): Promise<RegistryIndex> {
    const indexPath = path.join(registryPath, 'index.json');

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      return JSON.parse(content);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return {
          registry_version: '0.3.5',
          last_updated: new Date().toISOString(),
          agents: [],
        };
      }
      throw err;
    }
  }

  async saveIndex(registryPath: string, index: RegistryIndex): Promise<void> {
    await fs.mkdir(registryPath, { recursive: true });
    const indexPath = path.join(registryPath, 'index.json');
    index.last_updated = new Date().toISOString();
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  async addAgent(registryPath: string, entry: AgentEntry): Promise<void> {
    const index = await this.loadIndex(registryPath);

    const existingIdx = index.agents.findIndex(
      (a) => a.id === entry.id && a.version === entry.version
    );

    if (existingIdx >= 0) {
      index.agents[existingIdx] = entry;
    } else {
      index.agents.push(entry);
    }

    index.agents.sort((a, b) => a.id.localeCompare(b.id));
    await this.saveIndex(registryPath, index);
  }

  async searchAgents(
    registryPath: string,
    query: string
  ): Promise<AgentEntry[]> {
    const index = await this.loadIndex(registryPath);
    const lowerQuery = query.toLowerCase();

    return index.agents.filter(
      (agent) =>
        agent.id.toLowerCase().includes(lowerQuery) ||
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.description?.toLowerCase().includes(lowerQuery) ||
        agent.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  async getAgentInfo(
    registryPath: string,
    agentId: string
  ): Promise<AgentEntry | null> {
    const index = await this.loadIndex(registryPath);
    return index.agents.find((a) => a.id === agentId) || null;
  }

  // Alias methods for compatibility
  async search(registryPath: string, query: string): Promise<AgentEntry[]> {
    return this.searchAgents(registryPath, query);
  }

  async getAgent(
    registryPath: string,
    agentId: string
  ): Promise<AgentEntry | null> {
    return this.getAgentInfo(registryPath, agentId);
  }
}
