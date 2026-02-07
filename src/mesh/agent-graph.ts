/**
 * Agent Graph Model
 * Represents the network of agents and their relationships
 *
 * Features:
 * - Agent relationship graph (leader, worker, specialist, peer)
 * - Communication pattern tracking
 * - Capability mapping
 * - Team hierarchies
 * - Path finding for agent-to-agent communication
 */

import { AgentCard } from './types.js';

/**
 * Agent Relationship Types
 */
export type AgentRelationType =
  | 'leader' // Orchestrates and delegates to workers
  | 'worker' // Executes tasks assigned by leaders
  | 'specialist' // Provides specific expertise
  | 'peer' // Equal collaboration
  | 'supervisor' // Monitors and manages
  | 'dependency'; // Required by another agent

/**
 * Communication Pattern
 */
export interface CommunicationPattern {
  from: string; // Agent URI
  to: string; // Agent URI
  channel?: string; // Topic/channel
  frequency: number; // Messages per minute
  latencyMs: number; // Average latency
  errorRate: number; // Error percentage
  lastCommunication: Date;
}

/**
 * Agent Relationship
 */
export interface AgentRelationship {
  from: string; // Agent URI
  to: string; // Agent URI
  type: AgentRelationType;
  weight: number; // Relationship strength (0-1)
  bidirectional: boolean;
  metadata?: {
    established?: Date;
    lastInteraction?: Date;
    interactionCount?: number;
    [key: string]: unknown;
  };
}

/**
 * Agent Team Structure
 */
export interface AgentTeam {
  id: string;
  name: string;
  leader?: string; // Agent URI
  members: string[]; // Agent URIs
  specialists: string[]; // Agent URIs
  capabilities: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Agent Graph Node
 */
export interface AgentNode {
  agent: AgentCard;
  relationships: AgentRelationship[];
  communicationPatterns: CommunicationPattern[];
  team?: string; // Team ID
  capabilities: Set<string>;
  metadata: {
    centrality?: number; // Graph centrality score
    importance?: number; // Overall importance (0-1)
    reliability?: number; // Reliability score (0-1)
    lastSeen?: Date;
  };
}

/**
 * Agent Graph
 * Graph representation of the agent network
 */
export class AgentGraph {
  private nodes: Map<string, AgentNode> = new Map();
  private teams: Map<string, AgentTeam> = new Map();
  private communicationLog: CommunicationPattern[] = [];
  private readonly maxLogSize = 10000;

  /**
   * Add an agent to the graph
   */
  addAgent(agent: AgentCard): void {
    if (!this.nodes.has(agent.uri)) {
      this.nodes.set(agent.uri, {
        agent,
        relationships: [],
        communicationPatterns: [],
        capabilities: new Set(agent.capabilities),
        metadata: {
          lastSeen: new Date(),
        },
      });
    } else {
      // Update existing node
      const node = this.nodes.get(agent.uri)!;
      node.agent = agent;
      node.capabilities = new Set(agent.capabilities);
      node.metadata.lastSeen = new Date();
    }
  }

  /**
   * Remove an agent from the graph
   */
  removeAgent(agentUri: string): void {
    // Remove the node
    this.nodes.delete(agentUri);

    // Remove relationships pointing to this agent
    for (const node of this.nodes.values()) {
      node.relationships = node.relationships.filter(
        rel => rel.to !== agentUri && rel.from !== agentUri
      );
      node.communicationPatterns = node.communicationPatterns.filter(
        pattern => pattern.to !== agentUri && pattern.from !== agentUri
      );
    }

    // Remove from teams
    for (const team of this.teams.values()) {
      team.members = team.members.filter(uri => uri !== agentUri);
      team.specialists = team.specialists.filter(uri => uri !== agentUri);
      if (team.leader === agentUri) {
        team.leader = undefined;
      }
    }
  }

  /**
   * Add a relationship between two agents
   */
  addRelationship(relationship: AgentRelationship): void {
    const fromNode = this.nodes.get(relationship.from);
    if (!fromNode) {
      throw new Error(`Agent ${relationship.from} not found in graph`);
    }

    // Check if relationship already exists
    const existing = fromNode.relationships.findIndex(
      rel => rel.to === relationship.to && rel.type === relationship.type
    );

    if (existing >= 0) {
      // Update existing relationship
      fromNode.relationships[existing] = {
        ...relationship,
        metadata: {
          ...fromNode.relationships[existing].metadata,
          ...relationship.metadata,
          lastInteraction: new Date(),
          interactionCount: (fromNode.relationships[existing].metadata?.interactionCount as number || 0) + 1,
        },
      };
    } else {
      // Add new relationship
      fromNode.relationships.push({
        ...relationship,
        metadata: {
          ...relationship.metadata,
          established: new Date(),
          lastInteraction: new Date(),
          interactionCount: 1,
        },
      });
    }

    // Add reverse relationship if bidirectional
    if (relationship.bidirectional) {
      const toNode = this.nodes.get(relationship.to);
      if (toNode) {
        const reverseExists = toNode.relationships.findIndex(
          rel => rel.to === relationship.from && rel.type === relationship.type
        );

        if (reverseExists < 0) {
          toNode.relationships.push({
            from: relationship.to,
            to: relationship.from,
            type: relationship.type,
            weight: relationship.weight,
            bidirectional: true,
            metadata: relationship.metadata,
          });
        }
      }
    }
  }

  /**
   * Record a communication event
   */
  recordCommunication(pattern: Omit<CommunicationPattern, 'lastCommunication'>): void {
    const fullPattern: CommunicationPattern = {
      ...pattern,
      lastCommunication: new Date(),
    };

    // Add to communication log
    this.communicationLog.push(fullPattern);

    // Maintain log size
    if (this.communicationLog.length > this.maxLogSize) {
      this.communicationLog.shift();
    }

    // Update node's communication patterns
    const fromNode = this.nodes.get(pattern.from);
    if (fromNode) {
      const existing = fromNode.communicationPatterns.findIndex(
        p => p.to === pattern.to && p.channel === pattern.channel
      );

      if (existing >= 0) {
        // Update existing pattern (exponential moving average)
        const alpha = 0.3; // Smoothing factor
        fromNode.communicationPatterns[existing] = {
          ...fullPattern,
          frequency: alpha * pattern.frequency + (1 - alpha) * fromNode.communicationPatterns[existing].frequency,
          latencyMs: alpha * pattern.latencyMs + (1 - alpha) * fromNode.communicationPatterns[existing].latencyMs,
          errorRate: alpha * pattern.errorRate + (1 - alpha) * fromNode.communicationPatterns[existing].errorRate,
        };
      } else {
        fromNode.communicationPatterns.push(fullPattern);
      }
    }
  }

  /**
   * Create or update a team
   */
  defineTeam(team: AgentTeam): void {
    this.teams.set(team.id, team);

    // Update team membership on nodes
    for (const memberUri of [...team.members, ...team.specialists]) {
      const node = this.nodes.get(memberUri);
      if (node) {
        node.team = team.id;
      }
    }
  }

  /**
   * Get agents by capability
   */
  findByCapability(capability: string): AgentCard[] {
    const agents: AgentCard[] = [];

    for (const node of this.nodes.values()) {
      if (node.capabilities.has(capability)) {
        agents.push(node.agent);
      }
    }

    return agents;
  }

  /**
   * Get agents in a team
   */
  getTeamAgents(teamId: string): AgentCard[] {
    const team = this.teams.get(teamId);
    if (!team) return [];

    const allMembers = [...team.members, ...team.specialists];
    return allMembers
      .map(uri => this.nodes.get(uri)?.agent)
      .filter((agent): agent is AgentCard => agent !== undefined);
  }

  /**
   * Get team leader
   */
  getTeamLeader(teamId: string): AgentCard | null {
    const team = this.teams.get(teamId);
    if (!team?.leader) return null;

    return this.nodes.get(team.leader)?.agent || null;
  }

  /**
   * Find agents with specific relationship
   */
  findRelatedAgents(
    agentUri: string,
    relationType?: AgentRelationType
  ): AgentCard[] {
    const node = this.nodes.get(agentUri);
    if (!node) return [];

    const relationships = relationType
      ? node.relationships.filter(rel => rel.type === relationType)
      : node.relationships;

    return relationships
      .map(rel => this.nodes.get(rel.to)?.agent)
      .filter((agent): agent is AgentCard => agent !== undefined);
  }

  /**
   * Find path between two agents
   * Uses BFS to find shortest communication path
   */
  findPath(fromUri: string, toUri: string): string[] | null {
    if (fromUri === toUri) return [fromUri];

    const visited = new Set<string>();
    const queue: { uri: string; path: string[] }[] = [{ uri: fromUri, path: [fromUri] }];

    while (queue.length > 0) {
      const { uri, path } = queue.shift()!;

      if (uri === toUri) {
        return path;
      }

      if (visited.has(uri)) continue;
      visited.add(uri);

      const node = this.nodes.get(uri);
      if (!node) continue;

      // Add connected agents to queue
      for (const rel of node.relationships) {
        if (!visited.has(rel.to)) {
          queue.push({
            uri: rel.to,
            path: [...path, rel.to],
          });
        }
      }

      // Also consider communication patterns
      for (const pattern of node.communicationPatterns) {
        if (!visited.has(pattern.to)) {
          queue.push({
            uri: pattern.to,
            path: [...path, pattern.to],
          });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Calculate agent centrality
   * Measures how important an agent is in the network
   */
  calculateCentrality(): void {
    const n = this.nodes.size;
    if (n === 0) return;

    // Calculate degree centrality for each node
    const entries: Array<[string, AgentNode]> = [];
    this.nodes.forEach((node, uri) => entries.push([uri, node]));

    for (const [uri, node] of entries) {
      // Count incoming and outgoing relationships
      const outDegree = node.relationships.length;

      let inDegree = 0;
      const allNodes: AgentNode[] = [];
      this.nodes.forEach(n => allNodes.push(n));

      for (const otherNode of allNodes) {
        if (otherNode.relationships.some(rel => rel.to === uri)) {
          inDegree++;
        }
      }

      // Normalized centrality (0-1)
      node.metadata.centrality = (inDegree + outDegree) / (2 * (n - 1));
    }
  }

  /**
   * Calculate agent importance
   * Based on centrality, capabilities, and communication patterns
   */
  calculateImportance(): void {
    this.calculateCentrality();

    const allNodes: AgentNode[] = [];
    this.nodes.forEach(node => allNodes.push(node));

    for (const node of allNodes) {
      const centrality = node.metadata.centrality || 0;
      const capabilityScore = node.capabilities.size / 10; // Normalize by max expected capabilities
      const communicationScore = Math.min(
        node.communicationPatterns.reduce((sum, p) => sum + p.frequency, 0) / 100,
        1
      );

      // Weighted average
      node.metadata.importance =
        0.4 * centrality +
        0.3 * capabilityScore +
        0.3 * communicationScore;
    }
  }

  /**
   * Get most important agents
   */
  getTopAgents(limit: number = 10): AgentCard[] {
    this.calculateImportance();

    const allNodes: AgentNode[] = [];
    this.nodes.forEach(node => allNodes.push(node));

    return allNodes
      .sort((a, b) => (b.metadata.importance || 0) - (a.metadata.importance || 0))
      .slice(0, limit)
      .map(node => node.agent);
  }

  /**
   * Get communication statistics
   */
  getCommunicationStats(fromUri?: string, toUri?: string): {
    totalMessages: number;
    avgLatency: number;
    avgErrorRate: number;
    topChannels: Array<{ channel: string; count: number }>;
  } {
    let patterns = this.communicationLog;

    if (fromUri) {
      patterns = patterns.filter(p => p.from === fromUri);
    }
    if (toUri) {
      patterns = patterns.filter(p => p.to === toUri);
    }

    const totalMessages = patterns.length;
    const avgLatency = patterns.reduce((sum, p) => sum + p.latencyMs, 0) / totalMessages || 0;
    const avgErrorRate = patterns.reduce((sum, p) => sum + p.errorRate, 0) / totalMessages || 0;

    // Count messages by channel
    const channelCounts = new Map<string, number>();
    for (const pattern of patterns) {
      if (pattern.channel) {
        channelCounts.set(pattern.channel, (channelCounts.get(pattern.channel) || 0) + 1);
      }
    }

    const topChannels = Array.from(channelCounts.entries())
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMessages,
      avgLatency,
      avgErrorRate,
      topChannels,
    };
  }

  /**
   * Export graph structure
   */
  export(): {
    nodes: AgentNode[];
    teams: AgentTeam[];
    stats: {
      totalAgents: number;
      totalTeams: number;
      totalRelationships: number;
      totalCommunications: number;
    };
  } {
    const nodes: AgentNode[] = [];
    this.nodes.forEach(node => nodes.push(node));

    const totalRelationships = nodes.reduce(
      (sum, node) => sum + node.relationships.length,
      0
    );

    const teams: AgentTeam[] = [];
    this.teams.forEach(team => teams.push(team));

    return {
      nodes,
      teams,
      stats: {
        totalAgents: nodes.length,
        totalTeams: this.teams.size,
        totalRelationships,
        totalCommunications: this.communicationLog.length,
      },
    };
  }

  /**
   * Get agent node
   */
  getNode(agentUri: string): AgentNode | undefined {
    return this.nodes.get(agentUri);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): AgentNode[] {
    const nodes: AgentNode[] = [];
    this.nodes.forEach(node => nodes.push(node));
    return nodes;
  }

  /**
   * Get all teams
   */
  getAllTeams(): AgentTeam[] {
    const teams: AgentTeam[] = [];
    this.teams.forEach(team => teams.push(team));
    return teams;
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes.clear();
    this.teams.clear();
    this.communicationLog = [];
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    agents: number;
    teams: number;
    relationships: number;
    communications: number;
    avgRelationshipsPerAgent: number;
    avgCommunicationsPerAgent: number;
  } {
    const nodes = Array.from(this.nodes.values());
    const totalRelationships = nodes.reduce(
      (sum, node) => sum + node.relationships.length,
      0
    );

    return {
      agents: nodes.length,
      teams: this.teams.size,
      relationships: totalRelationships,
      communications: this.communicationLog.length,
      avgRelationshipsPerAgent: totalRelationships / nodes.length || 0,
      avgCommunicationsPerAgent: this.communicationLog.length / nodes.length || 0,
    };
  }
}

/**
 * Agent Graph Builder
 * Helper for constructing agent graphs
 */
export class AgentGraphBuilder {
  private graph: AgentGraph;

  constructor() {
    this.graph = new AgentGraph();
  }

  /**
   * Add agents from an array
   */
  withAgents(agents: AgentCard[]): this {
    for (const agent of agents) {
      this.graph.addAgent(agent);
    }
    return this;
  }

  /**
   * Define teams
   */
  withTeams(teams: AgentTeam[]): this {
    for (const team of teams) {
      this.graph.defineTeam(team);
    }
    return this;
  }

  /**
   * Add relationships
   */
  withRelationships(relationships: AgentRelationship[]): this {
    for (const rel of relationships) {
      this.graph.addRelationship(rel);
    }
    return this;
  }

  /**
   * Auto-discover relationships from agent metadata
   */
  autoDiscoverRelationships(): this {
    const nodes = this.graph.getAllNodes();

    for (const node of nodes) {
      // Agents in same team are peers
      if (node.team) {
        const teamAgents = this.graph.getTeamAgents(node.team);
        for (const peer of teamAgents) {
          if (peer.uri !== node.agent.uri) {
            this.graph.addRelationship({
              from: node.agent.uri,
              to: peer.uri,
              type: 'peer',
              weight: 0.7,
              bidirectional: true,
            });
          }
        }
      }

      // Agents with overlapping capabilities may collaborate
      for (const otherNode of nodes) {
        if (otherNode.agent.uri === node.agent.uri) continue;

        const commonCapabilities = Array.from(node.capabilities).filter(cap =>
          otherNode.capabilities.has(cap)
        );

        if (commonCapabilities.length > 0) {
          this.graph.addRelationship({
            from: node.agent.uri,
            to: otherNode.agent.uri,
            type: 'specialist',
            weight: commonCapabilities.length / Math.max(node.capabilities.size, otherNode.capabilities.size),
            bidirectional: false,
          });
        }
      }
    }

    return this;
  }

  /**
   * Build the graph
   */
  build(): AgentGraph {
    return this.graph;
  }
}
