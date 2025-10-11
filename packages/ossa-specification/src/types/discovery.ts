/**
 * OSSA Discovery Protocol Type Definitions
 */

import { ConformanceLevel } from './agent';

export interface Registry {
  /** UADP version */
  version: '1.0';
  /** Registry last update timestamp */
  timestamp: string;
  /** Workspace information */
  workspace: WorkspaceInfo;
  /** List of discovered agents */
  agents?: RegisteredAgent[];
  /** Capability to agent mapping */
  capabilities?: Record<string, CapabilityIndex>;
  /** Agent dependency graph */
  dependencies?: Record<string, DependencyInfo>;
}

export interface WorkspaceInfo {
  /** Workspace root path */
  root: string;
  /** Discovery protocol */
  protocol: 'uadp';
  /** Workspace conformance level */
  conformance?: ConformanceLevel;
  /** Remote registry URL */
  registry?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

export interface RegisteredAgent {
  /** Unique agent identifier (name@version) */
  id: string;
  /** Agent name */
  name: string;
  /** Agent version */
  version: string;
  /** Relative path to agent directory */
  path: string;
  /** Agent capabilities */
  capabilities: string[];
  /** Agent API endpoints */
  endpoints?: EndpointInfo[];
  /** Supported protocol bridges */
  bridge?: {
    mcp?: boolean;
    a2a?: boolean;
    openapi?: boolean;
    langchain?: boolean;
  };
  /** Agent conformance level */
  conformance?: ConformanceLevel;
  /** Agent status */
  status?: AgentStatus;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

export interface EndpointInfo {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Endpoint path */
  path: string;
  /** Associated capability or capabilities */
  capability?: string | string[];
  /** Endpoint description */
  description?: string;
}

export interface AgentStatus {
  /** Agent state */
  state?: 'active' | 'inactive' | 'maintenance' | 'deprecated';
  /** Health status */
  health?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  /** Last seen timestamp */
  lastSeen?: string;
  /** Error messages */
  errors?: string[];
}

export interface CapabilityIndex {
  /** List of agent IDs that provide this capability */
  agents: string[];
  /** Capability description */
  description?: string;
  /** Capability category */
  category?: string;
  /** Preferred agent ID for this capability */
  preferred?: string;
}

export interface DependencyInfo {
  /** Required runtime dependencies */
  runtime?: string[];
  /** Optional dependencies */
  optional?: string[];
  /** Conflicting agents */
  conflicts?: string[];
}

// Discovery utilities
export class DiscoveryScanner {
  private registry: Registry;

  constructor(workspace: string) {
    this.registry = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      workspace: {
        root: workspace,
        protocol: 'uadp'
      }
    };
  }

  addAgent(agent: RegisteredAgent): void {
    if (!this.registry.agents) {
      this.registry.agents = [];
    }
    this.registry.agents.push(agent);
    this.updateCapabilityIndex(agent);
  }

  private updateCapabilityIndex(agent: RegisteredAgent): void {
    if (!this.registry.capabilities) {
      this.registry.capabilities = {};
    }

    for (const capability of agent.capabilities) {
      if (!this.registry.capabilities[capability]) {
        this.registry.capabilities[capability] = { agents: [] };
      }
      this.registry.capabilities[capability].agents.push(agent.id);
    }
  }

  findAgentsByCapability(capability: string): RegisteredAgent[] {
    const agentIds = this.registry.capabilities?.[capability]?.agents || [];
    return this.registry.agents?.filter(a => agentIds.includes(a.id)) || [];
  }

  getRegistry(): Registry {
    return this.registry;
  }
}

// Agent ID utilities
export function createAgentId(name: string, version: string): string {
  return `${name}@${version}`;
}

export function parseAgentId(id: string): { name: string; version: string } {
  const [name, version] = id.split('@');
  return { name, version };
}

// Discovery path patterns
export const DISCOVERY_PATTERNS = {
  AGENT_DIR: '.agents',
  MANIFEST_FILE: 'agent.yml',
  OPENAPI_FILE: 'openapi.yaml',
  REGISTRY_FILE: 'registry.yml',
  WORKSPACE_FILE: '.ossa-workspace'
} as const;

// Type guards
export function isValidAgentId(id: string): boolean {
  return /^[a-z0-9-]+@\d+\.\d+\.\d+$/.test(id);
}

export function isHealthyAgent(agent: RegisteredAgent): boolean {
  return agent.status?.health === 'healthy' && agent.status?.state === 'active';
}

export function hasProtocolSupport(
  agent: RegisteredAgent,
  protocol: 'mcp' | 'a2a' | 'openapi' | 'langchain'
): boolean {
  return agent.bridge?.[protocol] === true;
}