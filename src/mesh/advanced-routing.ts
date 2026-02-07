/**
 * Advanced Agent Routing
 * Sophisticated routing logic for agent-to-agent communication
 *
 * Features:
 * - Capability-based routing (find agent with capability X)
 * - Load balancing across multiple instances
 * - Health-aware routing (exclude unhealthy agents)
 * - Geographic routing (nearest agent)
 * - Priority routing
 * - Circuit breaker pattern
 */

import { AgentCard, MessageEnvelope, AgentStatus } from './types.js';
import { DiscoveryService } from './discovery.js';
import { AgentGraph } from './agent-graph.js';

/**
 * Routing Strategy
 */
export type RoutingStrategy =
  | 'round-robin' // Cycle through available agents
  | 'random' // Random selection
  | 'least-connections' // Route to agent with fewest active connections
  | 'least-latency' // Route to agent with lowest latency
  | 'weighted' // Route based on agent weights
  | 'geographic' // Route to nearest agent
  | 'capability-match'; // Route based on best capability match

/**
 * Load Balancer Interface
 */
export interface LoadBalancer {
  /**
   * Select an agent from available candidates
   */
  select(candidates: AgentCard[], context?: RoutingContext): AgentCard | null;

  /**
   * Record routing decision
   */
  recordRouting(agentUri: string, success: boolean, latencyMs?: number): void;

  /**
   * Get statistics
   */
  getStats(): LoadBalancerStats;
}

/**
 * Routing Context
 */
export interface RoutingContext {
  message?: MessageEnvelope;
  requiredCapabilities?: string[];
  preferredRegion?: string;
  excludeAgents?: string[];
  maxLatencyMs?: number;
}

/**
 * Load Balancer Statistics
 */
export interface LoadBalancerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  agentStats: Map<string, {
    requests: number;
    successes: number;
    failures: number;
    avgLatencyMs: number;
  }>;
}

/**
 * Agent Connection Tracker
 */
class ConnectionTracker {
  private connections: Map<string, number> = new Map();

  increment(agentUri: string): void {
    this.connections.set(agentUri, (this.connections.get(agentUri) || 0) + 1);
  }

  decrement(agentUri: string): void {
    const count = this.connections.get(agentUri) || 0;
    if (count > 0) {
      this.connections.set(agentUri, count - 1);
    }
  }

  getCount(agentUri: string): number {
    return this.connections.get(agentUri) || 0;
  }

  getAll(): Map<string, number> {
    return new Map(this.connections);
  }
}

/**
 * Round-Robin Load Balancer
 */
export class RoundRobinLoadBalancer implements LoadBalancer {
  private currentIndex = 0;
  private stats: LoadBalancerStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgLatencyMs: 0,
    agentStats: new Map(),
  };

  select(candidates: AgentCard[], context?: RoutingContext): AgentCard | null {
    if (candidates.length === 0) return null;

    // Filter excluded agents
    const filtered = context?.excludeAgents
      ? candidates.filter(a => !context.excludeAgents!.includes(a.uri))
      : candidates;

    if (filtered.length === 0) return null;

    // Select next agent
    const agent = filtered[this.currentIndex % filtered.length];
    this.currentIndex = (this.currentIndex + 1) % filtered.length;

    this.stats.totalRequests++;
    return agent;
  }

  recordRouting(agentUri: string, success: boolean, latencyMs?: number): void {
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    if (latencyMs !== undefined) {
      const totalLatency = this.stats.avgLatencyMs * (this.stats.totalRequests - 1) + latencyMs;
      this.stats.avgLatencyMs = totalLatency / this.stats.totalRequests;
    }

    // Update agent stats
    const agentStat = this.stats.agentStats.get(agentUri) || {
      requests: 0,
      successes: 0,
      failures: 0,
      avgLatencyMs: 0,
    };

    agentStat.requests++;
    if (success) {
      agentStat.successes++;
    } else {
      agentStat.failures++;
    }

    if (latencyMs !== undefined) {
      agentStat.avgLatencyMs =
        (agentStat.avgLatencyMs * (agentStat.requests - 1) + latencyMs) / agentStat.requests;
    }

    this.stats.agentStats.set(agentUri, agentStat);
  }

  getStats(): LoadBalancerStats {
    return { ...this.stats };
  }
}

/**
 * Least Connections Load Balancer
 */
export class LeastConnectionsLoadBalancer implements LoadBalancer {
  private connectionTracker = new ConnectionTracker();
  private stats: LoadBalancerStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgLatencyMs: 0,
    agentStats: new Map(),
  };

  select(candidates: AgentCard[], context?: RoutingContext): AgentCard | null {
    if (candidates.length === 0) return null;

    // Filter excluded agents
    const filtered = context?.excludeAgents
      ? candidates.filter(a => !context.excludeAgents!.includes(a.uri))
      : candidates;

    if (filtered.length === 0) return null;

    // Find agent with least connections
    let minConnections = Infinity;
    let selectedAgent: AgentCard | null = null;

    for (const agent of filtered) {
      const connections = this.connectionTracker.getCount(agent.uri);
      if (connections < minConnections) {
        minConnections = connections;
        selectedAgent = agent;
      }
    }

    if (selectedAgent) {
      this.connectionTracker.increment(selectedAgent.uri);
      this.stats.totalRequests++;
    }

    return selectedAgent;
  }

  recordRouting(agentUri: string, success: boolean, latencyMs?: number): void {
    this.connectionTracker.decrement(agentUri);

    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    if (latencyMs !== undefined) {
      const totalLatency = this.stats.avgLatencyMs * (this.stats.totalRequests - 1) + latencyMs;
      this.stats.avgLatencyMs = totalLatency / this.stats.totalRequests;
    }

    // Update agent stats
    const agentStat = this.stats.agentStats.get(agentUri) || {
      requests: 0,
      successes: 0,
      failures: 0,
      avgLatencyMs: 0,
    };

    agentStat.requests++;
    if (success) {
      agentStat.successes++;
    } else {
      agentStat.failures++;
    }

    if (latencyMs !== undefined) {
      agentStat.avgLatencyMs =
        (agentStat.avgLatencyMs * (agentStat.requests - 1) + latencyMs) / agentStat.requests;
    }

    this.stats.agentStats.set(agentUri, agentStat);
  }

  getStats(): LoadBalancerStats {
    return { ...this.stats };
  }
}

/**
 * Weighted Load Balancer
 * Routes based on agent weights (performance, capacity, etc.)
 */
export class WeightedLoadBalancer implements LoadBalancer {
  private stats: LoadBalancerStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgLatencyMs: 0,
    agentStats: new Map(),
  };

  select(candidates: AgentCard[], context?: RoutingContext): AgentCard | null {
    if (candidates.length === 0) return null;

    // Filter excluded agents
    const filtered = context?.excludeAgents
      ? candidates.filter(a => !context.excludeAgents!.includes(a.uri))
      : candidates;

    if (filtered.length === 0) return null;

    // Calculate weights (default weight is 1.0)
    const weights = filtered.map(agent => {
      const agentStat = this.stats.agentStats.get(agent.uri);
      if (!agentStat) return 1.0;

      // Weight based on success rate and latency
      const successRate = agentStat.successes / agentStat.requests;
      const latencyPenalty = Math.max(0, 1 - (agentStat.avgLatencyMs / 1000));

      return successRate * latencyPenalty;
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < filtered.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        this.stats.totalRequests++;
        return filtered[i];
      }
    }

    // Fallback to first agent
    this.stats.totalRequests++;
    return filtered[0];
  }

  recordRouting(agentUri: string, success: boolean, latencyMs?: number): void {
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    if (latencyMs !== undefined) {
      const totalLatency = this.stats.avgLatencyMs * (this.stats.totalRequests - 1) + latencyMs;
      this.stats.avgLatencyMs = totalLatency / this.stats.totalRequests;
    }

    // Update agent stats
    const agentStat = this.stats.agentStats.get(agentUri) || {
      requests: 0,
      successes: 0,
      failures: 0,
      avgLatencyMs: 0,
    };

    agentStat.requests++;
    if (success) {
      agentStat.successes++;
    } else {
      agentStat.failures++;
    }

    if (latencyMs !== undefined) {
      agentStat.avgLatencyMs =
        (agentStat.avgLatencyMs * (agentStat.requests - 1) + latencyMs) / agentStat.requests;
    }

    this.stats.agentStats.set(agentUri, agentStat);
  }

  getStats(): LoadBalancerStats {
    return { ...this.stats };
  }
}

/**
 * Circuit Breaker State
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit Breaker
 * Prevents cascading failures by temporarily blocking requests to failing agents
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private nextRetryTime?: Date;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeoutMs: number = 60000,
    private readonly halfOpenRequests: number = 3
  ) {}

  /**
   * Check if circuit allows request
   */
  allowRequest(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Check if timeout has elapsed
      if (this.nextRetryTime && new Date() >= this.nextRetryTime) {
        this.state = 'half-open';
        this.successCount = 0;
        return true;
      }
      return false;
    }

    // Half-open: allow limited requests
    return this.successCount < this.halfOpenRequests;
  }

  /**
   * Record successful request
   */
  recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.halfOpenRequests) {
        this.state = 'closed';
      }
    }
  }

  /**
   * Record failed request
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'half-open') {
      this.state = 'open';
      this.nextRetryTime = new Date(Date.now() + this.timeoutMs);
    } else if (this.failureCount >= this.threshold) {
      this.state = 'open';
      this.nextRetryTime = new Date(Date.now() + this.timeoutMs);
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextRetryTime = undefined;
  }
}

/**
 * Advanced Agent Router
 * Combines discovery, load balancing, and routing strategies
 */
export class AdvancedAgentRouter {
  private loadBalancer: LoadBalancer;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private discovery: DiscoveryService;
  private graph?: AgentGraph;

  constructor(config: {
    discovery: DiscoveryService;
    loadBalancer?: LoadBalancer;
    graph?: AgentGraph;
    circuitBreakerThreshold?: number;
    circuitBreakerTimeoutMs?: number;
  }) {
    this.discovery = config.discovery;
    this.loadBalancer = config.loadBalancer || new RoundRobinLoadBalancer();
    this.graph = config.graph;
  }

  /**
   * Route message to best agent based on capability
   */
  async routeByCapability(
    capability: string,
    context?: RoutingContext
  ): Promise<AgentCard | null> {
    // Discover agents with capability
    const candidates = await this.discovery.discoverByCapability(capability);

    // Filter by health status
    const healthyCandidates = candidates.filter(agent => {
      // Check circuit breaker
      const breaker = this.getCircuitBreaker(agent.uri);
      if (!breaker.allowRequest()) {
        return false;
      }

      // Check agent health
      return agent.status === 'healthy';
    });

    // Apply additional filtering from context
    let filtered = healthyCandidates;

    if (context?.preferredRegion) {
      const regional = healthyCandidates.filter(
        a => a.metadata?.region === context.preferredRegion
      );
      if (regional.length > 0) {
        filtered = regional;
      }
    }

    if (context?.maxLatencyMs && this.graph) {
      // Filter by latency if we have graph data
      filtered = filtered.filter(agent => {
        const node = this.graph!.getNode(agent.uri);
        if (!node) return true;

        const avgLatency =
          node.communicationPatterns.reduce((sum, p) => sum + p.latencyMs, 0) /
          node.communicationPatterns.length || 0;

        return avgLatency <= context.maxLatencyMs!;
      });
    }

    // Use load balancer to select final agent
    return this.loadBalancer.select(filtered, context);
  }

  /**
   * Route to multiple agents (broadcast)
   */
  async routeToMultiple(
    capability: string,
    count: number,
    context?: RoutingContext
  ): Promise<AgentCard[]> {
    const candidates = await this.discovery.discoverByCapability(capability);

    // Filter healthy agents with open circuit breakers
    const healthyCandidates = candidates.filter(agent => {
      const breaker = this.getCircuitBreaker(agent.uri);
      return breaker.allowRequest() && agent.status === 'healthy';
    });

    // Select up to 'count' agents
    const selected: AgentCard[] = [];
    const exclude: string[] = [...(context?.excludeAgents || [])];

    for (let i = 0; i < count && selected.length < healthyCandidates.length; i++) {
      const agent = this.loadBalancer.select(
        healthyCandidates,
        { ...context, excludeAgents: exclude }
      );

      if (agent) {
        selected.push(agent);
        exclude.push(agent.uri);
      }
    }

    return selected;
  }

  /**
   * Find nearest agent geographically
   */
  async routeNearest(
    capability: string,
    region: string,
    context?: RoutingContext
  ): Promise<AgentCard | null> {
    const candidates = await this.discovery.discoverByCapability(capability);

    // Prefer agents in same region
    const regionalAgents = candidates.filter(
      agent =>
        agent.status === 'healthy' &&
        agent.metadata?.region === region &&
        this.getCircuitBreaker(agent.uri).allowRequest()
    );

    if (regionalAgents.length > 0) {
      return this.loadBalancer.select(regionalAgents, context);
    }

    // Fall back to any healthy agent
    const healthyAgents = candidates.filter(
      agent =>
        agent.status === 'healthy' &&
        this.getCircuitBreaker(agent.uri).allowRequest()
    );

    return this.loadBalancer.select(healthyAgents, context);
  }

  /**
   * Record routing result
   */
  recordResult(agentUri: string, success: boolean, latencyMs?: number): void {
    const breaker = this.getCircuitBreaker(agentUri);

    if (success) {
      breaker.recordSuccess();
    } else {
      breaker.recordFailure();
    }

    this.loadBalancer.recordRouting(agentUri, success, latencyMs);
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    return this.loadBalancer.getStats();
  }

  /**
   * Get circuit breaker for agent
   */
  private getCircuitBreaker(agentUri: string): CircuitBreaker {
    let breaker = this.circuitBreakers.get(agentUri);
    if (!breaker) {
      breaker = new CircuitBreaker();
      this.circuitBreakers.set(agentUri, breaker);
    }
    return breaker;
  }

  /**
   * Get all circuit breaker states
   */
  getCircuitBreakerStates(): Map<string, CircuitState> {
    const states = new Map<string, CircuitState>();
    const entries: Array<[string, CircuitBreaker]> = [];
    this.circuitBreakers.forEach((breaker, uri) => entries.push([uri, breaker]));

    for (const [uri, breaker] of entries) {
      states.set(uri, breaker.getState());
    }
    return states;
  }

  /**
   * Reset circuit breaker for agent
   */
  resetCircuitBreaker(agentUri: string): void {
    const breaker = this.circuitBreakers.get(agentUri);
    if (breaker) {
      breaker.reset();
    }
  }
}
