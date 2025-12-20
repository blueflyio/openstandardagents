/**
 * OSSA Runtime Implementation
 * Manages agent lifecycle and execution
 */

import type {
  Runtime as IRuntime,
  OssaAgent,
  AgentManifest,
  ExecutionContext,
  ExecutionResult,
} from './types.js';
import { createAgent } from './agent.js';
import { ManifestLoader } from './manifest.js';

/**
 * Runtime configuration options
 */
export interface RuntimeConfig {
  /** Maximum number of concurrent agents */
  maxAgents?: number;
  /** Default execution timeout in seconds */
  defaultTimeout?: number;
  /** Enable execution tracing */
  enableTracing?: boolean;
}

/**
 * Default runtime implementation
 */
export class OssaRuntime implements IRuntime {
  private agents: Map<string, OssaAgent> = new Map();
  private manifestLoader: ManifestLoader;
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig = {}) {
    this.config = {
      maxAgents: 100,
      defaultTimeout: 30,
      enableTracing: false,
      ...config,
    };
    this.manifestLoader = new ManifestLoader();
  }

  /**
   * Load an agent from a manifest file or object
   */
  async loadAgent(
    manifestPath: string | AgentManifest
  ): Promise<OssaAgent> {
    // Check agent limit
    if (this.config.maxAgents && this.agents.size >= this.config.maxAgents) {
      throw new Error(
        `Maximum number of agents (${this.config.maxAgents}) reached`
      );
    }

    // Load manifest
    let manifest: AgentManifest;
    if (typeof manifestPath === 'string') {
      manifest = await this.manifestLoader.loadFromFile(manifestPath);
    } else {
      manifest = await this.manifestLoader.loadFromObject(manifestPath);
    }

    // Create agent instance
    const agent = createAgent(manifest);

    // Check if agent with same ID already exists
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID '${agent.id}' already loaded`);
    }

    // Register agent
    this.agents.set(agent.id, agent);

    return agent;
  }

  /**
   * Execute a capability on a loaded agent
   */
  async executeCapability<TInput = unknown, TOutput = unknown>(
    agent: OssaAgent,
    capabilityName: string,
    input: TInput,
    context?: Partial<ExecutionContext>
  ): Promise<ExecutionResult<TOutput>> {
    // Verify agent is loaded
    if (!this.agents.has(agent.id)) {
      return {
        success: false,
        error: {
          code: 'AGENT_NOT_LOADED',
          message: `Agent '${agent.id}' is not loaded in this runtime`,
        },
      };
    }

    // Execute capability
    return agent.execute<TInput, TOutput>(capabilityName, input, context);
  }

  /**
   * Get all loaded agents
   */
  getAgents(): Map<string, OssaAgent> {
    return new Map(this.agents);
  }

  /**
   * Get a specific agent by ID
   */
  getAgent(id: string): OssaAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Unload an agent
   */
  unloadAgent(id: string): void {
    this.agents.delete(id);
  }

  /**
   * Unload all agents
   */
  unloadAll(): void {
    this.agents.clear();
  }

  /**
   * Get runtime statistics
   */
  getStats(): {
    loadedAgents: number;
    maxAgents: number;
    agentIds: string[];
  } {
    return {
      loadedAgents: this.agents.size,
      maxAgents: this.config.maxAgents || 0,
      agentIds: Array.from(this.agents.keys()),
    };
  }

  /**
   * Check if an agent is loaded
   */
  isAgentLoaded(id: string): boolean {
    return this.agents.has(id);
  }

  /**
   * Reload an agent (unload and load again)
   */
  async reloadAgent(
    id: string,
    manifestPath: string | AgentManifest
  ): Promise<OssaAgent> {
    // Unload if exists
    if (this.agents.has(id)) {
      this.unloadAgent(id);
    }

    // Load new agent
    return this.loadAgent(manifestPath);
  }
}

/**
 * Create a new runtime instance
 */
export function createRuntime(config?: RuntimeConfig): OssaRuntime {
  return new OssaRuntime(config);
}
