/**
 * Agent Mesh - Service Discovery
 * Implements agent discovery through registry-based, broadcast, and multicast mechanisms
 */

import { AgentCard, AgentStatus } from './types.js';

/**
 * Discovery Method Types
 */
export type DiscoveryMethod = 'registry' | 'broadcast' | 'multicast';

/**
 * Agent Registry Interface
 * Central registry for agent registration and discovery
 */
export interface AgentRegistry {
  /**
   * Register an agent with the registry
   */
  register(agentCard: AgentCard, ttl?: number): Promise<void>;

  /**
   * Unregister an agent from the registry
   */
  unregister(agentUri: string): Promise<void>;

  /**
   * Update agent heartbeat
   */
  heartbeat(agentUri: string): Promise<void>;

  /**
   * Find agents by capability
   */
  findByCapability(capability: string): Promise<AgentCard[]>;

  /**
   * Find agent by URI
   */
  findByUri(uri: string): Promise<AgentCard | null>;

  /**
   * List all registered agents
   */
  listAll(): Promise<AgentCard[]>;

  /**
   * Find healthy agents
   */
  findHealthy(): Promise<AgentCard[]>;
}

/**
 * In-Memory Agent Registry Implementation
 */
export class InMemoryAgentRegistry implements AgentRegistry {
  private agents: Map<
    string,
    { card: AgentCard; lastHeartbeat: Date; ttl: number }
  > = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly cleanupIntervalMs: number = 60000) {
    this.startCleanup();
  }

  async register(agentCard: AgentCard, ttl: number = 60): Promise<void> {
    this.agents.set(agentCard.uri, {
      card: {
        ...agentCard,
        lastHeartbeat: new Date().toISOString(),
        status: 'healthy',
      },
      lastHeartbeat: new Date(),
      ttl,
    });
  }

  async unregister(agentUri: string): Promise<void> {
    this.agents.delete(agentUri);
  }

  async heartbeat(agentUri: string): Promise<void> {
    const entry = this.agents.get(agentUri);
    if (entry) {
      entry.lastHeartbeat = new Date();
      entry.card.lastHeartbeat = new Date().toISOString();
      entry.card.status = 'healthy';
    }
  }

  async findByCapability(capability: string): Promise<AgentCard[]> {
    const agents: AgentCard[] = [];
    for (const entry of this.agents.values()) {
      if (
        entry.card.capabilities.includes(capability) &&
        this.isHealthy(entry)
      ) {
        agents.push(entry.card);
      }
    }
    return agents;
  }

  async findByUri(uri: string): Promise<AgentCard | null> {
    const entry = this.agents.get(uri);
    return entry ? entry.card : null;
  }

  async listAll(): Promise<AgentCard[]> {
    return Array.from(this.agents.values()).map((entry) => entry.card);
  }

  async findHealthy(): Promise<AgentCard[]> {
    const agents: AgentCard[] = [];
    for (const entry of this.agents.values()) {
      if (this.isHealthy(entry)) {
        agents.push(entry.card);
      }
    }
    return agents;
  }

  private isHealthy(entry: {
    card: AgentCard;
    lastHeartbeat: Date;
    ttl: number;
  }): boolean {
    const now = new Date();
    const elapsedSeconds =
      (now.getTime() - entry.lastHeartbeat.getTime()) / 1000;
    return elapsedSeconds <= entry.ttl;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      for (const [uri, entry] of this.agents.entries()) {
        const elapsedSeconds =
          (now.getTime() - entry.lastHeartbeat.getTime()) / 1000;
        if (elapsedSeconds > entry.ttl) {
          entry.card.status = 'unavailable';
          // Remove after 2x TTL
          if (elapsedSeconds > entry.ttl * 2) {
            this.agents.delete(uri);
          }
        } else if (elapsedSeconds > entry.ttl * 0.8) {
          entry.card.status = 'degraded';
        }
      }
    }, this.cleanupIntervalMs);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.agents.clear();
  }
}

/**
 * Discovery Service
 * Provides agent discovery across multiple discovery methods
 */
export class DiscoveryService {
  private registry: AgentRegistry;
  private localAgent?: AgentCard;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(registry?: AgentRegistry) {
    this.registry = registry || new InMemoryAgentRegistry();
  }

  /**
   * Register this agent with the discovery service
   */
  async registerSelf(
    agentCard: AgentCard,
    heartbeatIntervalMs: number = 30000
  ): Promise<void> {
    this.localAgent = agentCard;
    await this.registry.register(agentCard);

    // Start automatic heartbeat
    this.heartbeatInterval = setInterval(async () => {
      if (this.localAgent) {
        await this.registry.heartbeat(this.localAgent.uri);
      }
    }, heartbeatIntervalMs);
  }

  /**
   * Unregister this agent from the discovery service
   */
  async unregisterSelf(): Promise<void> {
    if (this.localAgent) {
      await this.registry.unregister(this.localAgent.uri);
      this.localAgent = undefined;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Discover agents by capability
   */
  async discoverByCapability(capability: string): Promise<AgentCard[]> {
    return await this.registry.findByCapability(capability);
  }

  /**
   * Discover agent by URI
   */
  async discoverByUri(uri: string): Promise<AgentCard | null> {
    return await this.registry.findByUri(uri);
  }

  /**
   * List all registered agents
   */
  async listAgents(): Promise<AgentCard[]> {
    return await this.registry.listAll();
  }

  /**
   * Find healthy agents only
   */
  async findHealthyAgents(): Promise<AgentCard[]> {
    return await this.registry.findHealthy();
  }

  /**
   * Check if an agent is available
   */
  async isAgentAvailable(uri: string): Promise<boolean> {
    const agent = await this.registry.findByUri(uri);
    return agent !== null && agent.status === 'healthy';
  }

  /**
   * Get the local agent card
   */
  getLocalAgent(): AgentCard | undefined {
    return this.localAgent;
  }

  /**
   * Destroy the discovery service
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.registry instanceof InMemoryAgentRegistry) {
      this.registry.destroy();
    }
  }
}

/**
 * Agent URI Parser
 * Utility for parsing and validating agent URIs
 */
export class AgentUriParser {
  private static readonly URI_PATTERN =
    /^agent:\/\/([a-z0-9-]+)\/([a-z0-9-]+)$/;

  /**
   * Parse an agent URI into namespace and name
   */
  static parse(uri: string): { namespace: string; name: string } | null {
    const match = uri.match(this.URI_PATTERN);
    if (!match) {
      return null;
    }
    return {
      namespace: match[1],
      name: match[2],
    };
  }

  /**
   * Build an agent URI from namespace and name
   */
  static build(namespace: string, name: string): string {
    return `agent://${namespace}/${name}`;
  }

  /**
   * Validate an agent URI
   */
  static isValid(uri: string): boolean {
    return this.URI_PATTERN.test(uri);
  }

  /**
   * Extract namespace from URI
   */
  static getNamespace(uri: string): string | null {
    const parsed = this.parse(uri);
    return parsed ? parsed.namespace : null;
  }

  /**
   * Extract name from URI
   */
  static getName(uri: string): string | null {
    const parsed = this.parse(uri);
    return parsed ? parsed.name : null;
  }
}

/**
 * Topic URI Parser
 * Utility for parsing and validating topic URIs
 */
export class TopicUriParser {
  private static readonly TOPIC_PATTERN = /^topic:\/\/([a-z0-9.-]+)$/;
  private static readonly BROADCAST_PATTERN =
    /^broadcast:\/\/([a-z0-9-]+)\/\*$/;

  /**
   * Parse a topic URI
   */
  static parseTopic(uri: string): string | null {
    const match = uri.match(this.TOPIC_PATTERN);
    return match ? match[1] : null;
  }

  /**
   * Parse a broadcast URI
   */
  static parseBroadcast(uri: string): string | null {
    const match = uri.match(this.BROADCAST_PATTERN);
    return match ? match[1] : null;
  }

  /**
   * Check if URI is a topic
   */
  static isTopic(uri: string): boolean {
    return this.TOPIC_PATTERN.test(uri);
  }

  /**
   * Check if URI is a broadcast
   */
  static isBroadcast(uri: string): boolean {
    return this.BROADCAST_PATTERN.test(uri);
  }

  /**
   * Build a topic URI
   */
  static buildTopic(topic: string): string {
    return `topic://${topic}`;
  }

  /**
   * Build a broadcast URI
   */
  static buildBroadcast(namespace: string): string {
    return `broadcast://${namespace}/*`;
  }

  /**
   * Check if a channel matches a subscription pattern
   * Supports wildcards (e.g., security.* matches security.vulnerabilities)
   */
  static matchesPattern(channel: string, pattern: string): boolean {
    if (pattern === channel) {
      return true;
    }

    // Convert pattern to regex
    const regexPattern = pattern
      .split('.')
      .map((part) => (part === '*' ? '[^.]+' : part))
      .join('\\.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(channel);
  }
}
