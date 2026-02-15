/**
 * Agent Mesh Network
 *
 * Service mesh for agents (like Istio for microservices)
 * Handles service discovery, load balancing, circuit breaking, and observability
 *
 * @module adapters/a2a/agent-mesh
 */

import type {
  AgentIdentity,
  AgentNode,
  A2AMessage,
  A2AError,
  A2AErrorType,
} from './a2a-protocol.js';

/**
 * Service Discovery Configuration
 */
export interface ServiceDiscoveryConfig {
  /** Discovery provider */
  provider: 'dns' | 'consul' | 'kubernetes' | 'static' | 'gossip';
  /** Refresh interval (milliseconds) */
  refreshInterval: number;
  /** Enable caching */
  cache: boolean;
  /** Cache TTL (milliseconds) */
  cacheTTL: number;
}

/**
 * Load Balancing Configuration
 */
export interface LoadBalancingConfig {
  /** Load balancing strategy */
  strategy:
    | 'round-robin'
    | 'least-connections'
    | 'weighted-round-robin'
    | 'random'
    | 'ip-hash';
  /** Health check enabled */
  healthCheck: boolean;
  /** Health check interval (milliseconds) */
  healthCheckInterval: number;
  /** Health check timeout (milliseconds) */
  healthCheckTimeout: number;
}

/**
 * Circuit Breaker State
 */
export enum CircuitBreakerState {
  /** Circuit is closed, requests flow normally */
  CLOSED = 'closed',
  /** Circuit is open, requests are rejected */
  OPEN = 'open',
  /** Circuit is half-open, testing if service recovered */
  HALF_OPEN = 'half-open',
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  /** Enable circuit breaker */
  enabled: boolean;
  /** Failure threshold to open circuit */
  failureThreshold: number;
  /** Success threshold to close circuit from half-open */
  successThreshold: number;
  /** Timeout before attempting half-open (milliseconds) */
  timeout: number;
  /** Number of requests allowed in half-open state */
  halfOpenRequests: number;
  /** Window size for tracking failures (milliseconds) */
  windowSize: number;
}

/**
 * Circuit Breaker
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenAttempts: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Check if request is allowed
   */
  isAllowed(): boolean {
    if (!this.config.enabled) {
      return true;
    }

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        // Check if timeout has passed
        if (Date.now() - this.lastFailureTime > this.config.timeout) {
          this.state = CircuitBreakerState.HALF_OPEN;
          this.halfOpenAttempts = 0;
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return this.halfOpenAttempts < this.config.halfOpenRequests;
    }
  }

  /**
   * Record successful request
   */
  recordSuccess(): void {
    this.failures = 0;

    switch (this.state) {
      case CircuitBreakerState.HALF_OPEN:
        this.successes++;
        this.halfOpenAttempts++;

        if (this.successes >= this.config.successThreshold) {
          this.state = CircuitBreakerState.CLOSED;
          this.successes = 0;
        }
        break;
    }
  }

  /**
   * Record failed request
   */
  recordFailure(): void {
    this.lastFailureTime = Date.now();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        this.failures++;

        if (this.failures >= this.config.failureThreshold) {
          this.state = CircuitBreakerState.OPEN;
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.state = CircuitBreakerState.OPEN;
        this.halfOpenAttempts = 0;
        this.successes = 0;
        break;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
  }
}

/**
 * Trace Information
 */
export interface Trace {
  /** Trace ID */
  traceId: string;
  /** Span ID */
  spanId: string;
  /** Parent span ID */
  parentSpanId?: string;
  /** From agent */
  from: AgentIdentity;
  /** To agent */
  to: AgentIdentity;
  /** Request payload */
  payload: unknown;
  /** Start timestamp */
  startTime: string;
  /** End timestamp */
  endTime?: string;
  /** Duration (milliseconds) */
  duration?: number;
  /** Status */
  status: 'pending' | 'success' | 'error';
  /** Error details */
  error?: A2AError;
  /** Trace metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Agent Mesh
 * Service mesh for agent-to-agent communication
 */
export class AgentMesh {
  private agents: Map<string, AgentNode> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private traces: Map<string, Trace> = new Map();
  private loadBalancerIndex: Map<string, number> = new Map();

  constructor(
    private discoveryConfig: ServiceDiscoveryConfig,
    private loadBalancingConfig: LoadBalancingConfig,
    private circuitBreakerConfig: CircuitBreakerConfig
  ) {}

  /**
   * Discover agents with specific capabilities
   */
  discoverAgents(capabilities: string[]): AgentNode[] {
    const matchingAgents: AgentNode[] = [];

    for (const agent of this.agents.values()) {
      // Check if agent has all required capabilities
      const hasCapabilities = capabilities.every((cap) =>
        agent.identity.capabilities.includes(cap)
      );

      // Check if agent is healthy
      const isHealthy = agent.status === 'healthy';

      if (hasCapabilities && isHealthy) {
        matchingAgents.push(agent);
      }
    }

    return matchingAgents;
  }

  /**
   * Route request to best available agent
   */
  routeRequest(message: A2AMessage): AgentNode {
    // Get target agent(s)
    const targets = Array.isArray(message.to) ? message.to : [message.to];

    // Find available agents
    const availableAgents = targets
      .map((target) => this.agents.get(target.id))
      .filter((agent): agent is AgentNode => {
        if (!agent) return false;

        // Check circuit breaker
        const breaker = this.getCircuitBreaker(agent.identity.id);
        if (!breaker.isAllowed()) {
          return false;
        }

        // Check agent status
        return agent.status === 'healthy' || agent.status === 'degraded';
      });

    if (availableAgents.length === 0) {
      throw new Error('No available agents for routing');
    }

    // Select agent based on load balancing strategy
    return this.selectAgent(availableAgents);
  }

  /**
   * Circuit break an agent
   */
  circuitBreak(agent: AgentNode): void {
    const breaker = this.getCircuitBreaker(agent.identity.id);
    breaker.recordFailure();

    // Update agent status
    if (breaker.getState() === CircuitBreakerState.OPEN) {
      agent.status = 'unavailable';
    }
  }

  /**
   * Trace agent-to-agent call
   */
  traceCall(from: AgentNode, to: AgentNode, payload: unknown): Trace {
    const traceId = crypto.randomUUID();
    const spanId = this.generateSpanId();

    const trace: Trace = {
      traceId,
      spanId,
      from: from.identity,
      to: to.identity,
      payload,
      startTime: new Date().toISOString(),
      status: 'pending',
    };

    this.traces.set(traceId, trace);

    return trace;
  }

  /**
   * Complete a trace
   */
  completeTrace(traceId: string, success: boolean, error?: A2AError): void {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return;
    }

    const endTime = new Date();
    trace.endTime = endTime.toISOString();
    trace.duration = endTime.getTime() - new Date(trace.startTime).getTime();
    trace.status = success ? 'success' : 'error';
    trace.error = error;

    // Update circuit breaker
    const toAgent = this.agents.get(trace.to.id);
    if (toAgent) {
      const breaker = this.getCircuitBreaker(toAgent.identity.id);
      if (success) {
        breaker.recordSuccess();
      } else {
        breaker.recordFailure();
      }
    }
  }

  /**
   * Register agent in mesh
   */
  registerAgent(agent: AgentNode): void {
    this.agents.set(agent.identity.id, agent);
  }

  /**
   * Unregister agent from mesh
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.circuitBreakers.delete(agentId);
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: AgentNode['status']): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastHeartbeat = new Date().toISOString();
    }
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentNode[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all traces
   */
  getAllTraces(): Trace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentNode | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Health check all agents
   */
  async healthCheckAll(): Promise<void> {
    if (!this.loadBalancingConfig.healthCheck) {
      return;
    }

    const healthCheckPromises = Array.from(this.agents.values()).map(
      async (agent) => {
        try {
          const isHealthy = await this.performHealthCheck(agent);
          agent.status = isHealthy ? 'healthy' : 'degraded';
          agent.lastHeartbeat = new Date().toISOString();
        } catch (error) {
          agent.status = 'unavailable';
        }
      }
    );

    await Promise.all(healthCheckPromises);
  }

  // Private helper methods

  private getCircuitBreaker(agentId: string): CircuitBreaker {
    let breaker = this.circuitBreakers.get(agentId);

    if (!breaker) {
      breaker = new CircuitBreaker(this.circuitBreakerConfig);
      this.circuitBreakers.set(agentId, breaker);
    }

    return breaker;
  }

  private selectAgent(agents: AgentNode[]): AgentNode {
    switch (this.loadBalancingConfig.strategy) {
      case 'round-robin':
        return this.roundRobin(agents);

      case 'least-connections':
        return this.leastConnections(agents);

      case 'weighted-round-robin':
        return this.weightedRoundRobin(agents);

      case 'random':
        return this.random(agents);

      default:
        return agents[0];
    }
  }

  private roundRobin(agents: AgentNode[]): AgentNode {
    const key = 'global';
    const index = this.loadBalancerIndex.get(key) || 0;
    const agent = agents[index % agents.length];
    this.loadBalancerIndex.set(key, index + 1);
    return agent;
  }

  private leastConnections(agents: AgentNode[]): AgentNode {
    // Sort by load (ascending)
    const sorted = [...agents].sort((a, b) => a.load - b.load);
    return sorted[0];
  }

  private weightedRoundRobin(agents: AgentNode[]): AgentNode {
    // Weight by capacity (higher capacity = more likely to be selected)
    const totalCapacity = agents.reduce((sum, a) => sum + a.capacity, 0);
    let random = Math.random() * totalCapacity;

    for (const agent of agents) {
      random -= agent.capacity;
      if (random <= 0) {
        return agent;
      }
    }

    return agents[0];
  }

  private random(agents: AgentNode[]): AgentNode {
    const index = Math.floor(Math.random() * agents.length);
    return agents[index];
  }

  private async performHealthCheck(agent: AgentNode): Promise<boolean> {
    try {
      // Simulate health check (in real implementation, would call agent.healthCheck endpoint)
      const response = await fetch(agent.healthCheck, {
        signal: AbortSignal.timeout(
          this.loadBalancingConfig.healthCheckTimeout
        ),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}
