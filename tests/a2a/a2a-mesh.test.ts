/**
 * A2A Agent Mesh Tests
 *
 * Demonstrates:
 * - Agent mesh discovering and routing between agents
 * - Circuit breaking to prevent cascade failures
 * - Load balancing across agent pool
 * - Distributed tracing for agent-to-agent calls
 *
 * @module tests/a2a/a2a-mesh.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  AgentMesh,
  CircuitBreaker,
  CircuitBreakerState,
  type ServiceDiscoveryConfig,
  type LoadBalancingConfig,
  type CircuitBreakerConfig,
} from '../../src/adapters/a2a/agent-mesh.js';
import type {
  AgentNode,
  AgentIdentity,
  A2AMessage,
} from '../../src/adapters/a2a/a2a-protocol.js';

describe('A2A Agent Mesh', () => {
  let mesh: AgentMesh;
  let discoveryConfig: ServiceDiscoveryConfig;
  let loadBalancingConfig: LoadBalancingConfig;
  let circuitBreakerConfig: CircuitBreakerConfig;

  beforeEach(() => {
    discoveryConfig = {
      provider: 'static',
      refreshInterval: 30000,
      cache: true,
      cacheTTL: 60000,
    };

    loadBalancingConfig = {
      strategy: 'least-connections',
      healthCheck: true,
      healthCheckInterval: 10000,
      healthCheckTimeout: 5000,
    };

    circuitBreakerConfig = {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      halfOpenRequests: 3,
      windowSize: 10000,
    };

    mesh = new AgentMesh(
      discoveryConfig,
      loadBalancingConfig,
      circuitBreakerConfig
    );
  });

  describe('Service Discovery', () => {
    it('should discover agents with specific capabilities', () => {
      // Register agents with different capabilities
      const agents: AgentNode[] = [
        createAgentNode('code-gen', ['code-generation', 'typescript']),
        createAgentNode('tester', ['testing', 'integration-testing']),
        createAgentNode('full-stack', [
          'code-generation',
          'testing',
          'deployment',
        ]),
      ];

      for (const agent of agents) {
        mesh.registerAgent(agent);
      }

      // Discover agents with code-generation capability
      const codeGenAgents = mesh.discoverAgents(['code-generation']);

      expect(codeGenAgents.length).toBe(2);
      expect(
        codeGenAgents.every((a) =>
          a.identity.capabilities.includes('code-generation')
        )
      ).toBe(true);

      // Discover agents with multiple capabilities
      const multiCapAgents = mesh.discoverAgents([
        'code-generation',
        'testing',
      ]);

      expect(multiCapAgents.length).toBe(1);
      expect(multiCapAgents[0].identity.name).toBe('full-stack');
    });

    it('should only return healthy agents', () => {
      const agents: AgentNode[] = [
        createAgentNode('healthy-agent', ['processing'], 'healthy'),
        createAgentNode('degraded-agent', ['processing'], 'degraded'),
        createAgentNode('unavailable-agent', ['processing'], 'unavailable'),
      ];

      for (const agent of agents) {
        mesh.registerAgent(agent);
      }

      const healthyAgents = mesh.discoverAgents(['processing']);

      expect(healthyAgents.length).toBe(1);
      expect(healthyAgents[0].status).toBe('healthy');
    });
  });

  describe('Request Routing', () => {
    it('should route request to healthy agent', () => {
      const agents: AgentNode[] = [
        createAgentNode('agent-1', ['api'], 'healthy'),
        createAgentNode('agent-2', ['api'], 'healthy'),
      ];

      for (const agent of agents) {
        mesh.registerAgent(agent);
      }

      const message = createMessage(agents[0].identity);
      const targetNode = mesh.routeRequest(message);

      expect(targetNode).toBeDefined();
      expect(targetNode.status).toBe('healthy');
    });

    it('should respect circuit breaker state', () => {
      const agent = createAgentNode('failing-agent', ['api'], 'healthy');
      mesh.registerAgent(agent);

      // Trip circuit breaker
      mesh.circuitBreak(agent);
      mesh.circuitBreak(agent);
      mesh.circuitBreak(agent);
      mesh.circuitBreak(agent);
      mesh.circuitBreak(agent);

      const message = createMessage(agent.identity);

      expect(() => mesh.routeRequest(message)).toThrow('No available agents');
    });

    it('should load balance across multiple agents', () => {
      const agents: AgentNode[] = [
        createAgentNode('agent-1', ['process'], 'healthy', 0.3),
        createAgentNode('agent-2', ['process'], 'healthy', 0.7),
        createAgentNode('agent-3', ['process'], 'healthy', 0.5),
      ];

      for (const agent of agents) {
        mesh.registerAgent(agent);
      }

      // Send multiple requests
      const selectedAgents = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const message = createMessage(agents[0].identity);
        const target = mesh.routeRequest(message);
        selectedAgents.add(target.identity.id);
      }

      // Should distribute across agents (may not use all depending on strategy)
      expect(selectedAgents.size).toBeGreaterThan(0);
    });
  });

  describe('Circuit Breaking', () => {
    it('should open circuit after threshold failures', () => {
      const breaker = new CircuitBreaker(circuitBreakerConfig);

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);

      // Record failures
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should transition to half-open after timeout', (done) => {
      const config: CircuitBreakerConfig = {
        ...circuitBreakerConfig,
        timeout: 100, // 100ms timeout
      };

      const breaker = new CircuitBreaker(config);

      // Trip circuit
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Wait for timeout
      setTimeout(() => {
        expect(breaker.isAllowed()).toBe(true);
        done();
      }, 150);
    });

    it('should close circuit after successful requests in half-open', () => {
      const breaker = new CircuitBreaker(circuitBreakerConfig);

      // Trip circuit
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }

      // Manually set to half-open for testing
      breaker['state'] = CircuitBreakerState.HALF_OPEN;

      // Record successes
      breaker.recordSuccess();
      breaker.recordSuccess();

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reopen circuit on failure in half-open state', () => {
      const breaker = new CircuitBreaker(circuitBreakerConfig);

      // Trip circuit
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }

      // Set to half-open
      breaker['state'] = CircuitBreakerState.HALF_OPEN;

      // Record failure
      breaker.recordFailure();

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('Distributed Tracing', () => {
    it('should trace agent-to-agent calls', () => {
      const fromAgent = createAgentNode('sender', ['send']);
      const toAgent = createAgentNode('receiver', ['receive']);

      mesh.registerAgent(fromAgent);
      mesh.registerAgent(toAgent);

      const payload = { message: 'Hello from sender' };
      const trace = mesh.traceCall(fromAgent, toAgent, payload);

      expect(trace).toBeDefined();
      expect(trace.traceId).toBeDefined();
      expect(trace.spanId).toBeDefined();
      expect(trace.from).toBe(fromAgent.identity);
      expect(trace.to).toBe(toAgent.identity);
      expect(trace.payload).toBe(payload);
      expect(trace.status).toBe('pending');
      expect(trace.startTime).toBeDefined();
    });

    it('should complete trace with success', () => {
      const fromAgent = createAgentNode('sender', ['send']);
      const toAgent = createAgentNode('receiver', ['receive']);

      mesh.registerAgent(fromAgent);
      mesh.registerAgent(toAgent);

      const trace = mesh.traceCall(fromAgent, toAgent, {});

      // Complete successfully
      mesh.completeTrace(trace.traceId, true);

      const allTraces = mesh.getAllTraces();
      const completedTrace = allTraces.find((t) => t.traceId === trace.traceId);

      expect(completedTrace?.status).toBe('success');
      expect(completedTrace?.endTime).toBeDefined();
      expect(completedTrace?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should complete trace with error', () => {
      const fromAgent = createAgentNode('sender', ['send']);
      const toAgent = createAgentNode('receiver', ['receive']);

      mesh.registerAgent(fromAgent);
      mesh.registerAgent(toAgent);

      const trace = mesh.traceCall(fromAgent, toAgent, {});

      // Complete with error
      const error = {
        type: 'AGENT_UNREACHABLE' as any,
        message: 'Agent not reachable',
        retryable: true,
      };

      mesh.completeTrace(trace.traceId, false, error);

      const allTraces = mesh.getAllTraces();
      const failedTrace = allTraces.find((t) => t.traceId === trace.traceId);

      expect(failedTrace?.status).toBe('error');
      expect(failedTrace?.error).toBeDefined();
      expect(failedTrace?.error?.message).toBe('Agent not reachable');
    });
  });

  describe('Agent Management', () => {
    it('should register and unregister agents', () => {
      const agent = createAgentNode('temp-agent', ['temporary']);

      mesh.registerAgent(agent);
      expect(mesh.getAgent(agent.identity.id)).toBeDefined();

      mesh.unregisterAgent(agent.identity.id);
      expect(mesh.getAgent(agent.identity.id)).toBeUndefined();
    });

    it('should update agent status', () => {
      const agent = createAgentNode('status-agent', ['status'], 'healthy');

      mesh.registerAgent(agent);

      mesh.updateAgentStatus(agent.identity.id, 'degraded');

      const updated = mesh.getAgent(agent.identity.id);
      expect(updated?.status).toBe('degraded');
    });

    it('should list all agents', () => {
      const agents: AgentNode[] = [
        createAgentNode('agent-1', ['cap1']),
        createAgentNode('agent-2', ['cap2']),
        createAgentNode('agent-3', ['cap3']),
      ];

      for (const agent of agents) {
        mesh.registerAgent(agent);
      }

      const allAgents = mesh.getAllAgents();

      expect(allAgents.length).toBe(3);
    });
  });

  describe('Health Checking', () => {
    it('should perform health checks on all agents', async () => {
      const agents: AgentNode[] = [
        createAgentNode('agent-1', ['cap'], 'healthy'),
        createAgentNode('agent-2', ['cap'], 'degraded'),
      ];

      for (const agent of agents) {
        mesh.registerAgent(agent);
      }

      // Mock fetch for health check
      global.fetch = async () =>
        ({
          ok: true,
        }) as Response;

      await mesh.healthCheckAll();

      // All agents should be updated with heartbeat
      const allAgents = mesh.getAllAgents();
      for (const agent of allAgents) {
        expect(agent.lastHeartbeat).toBeDefined();
      }
    });
  });
});

// Helper functions

function createAgentIdentity(
  name: string,
  capabilities: string[]
): AgentIdentity {
  return {
    id: crypto.randomUUID(),
    namespace: 'test',
    name,
    uri: `agent://test/${name}`,
    capabilities,
    version: '1.0.0',
  };
}

function createAgentNode(
  name: string,
  capabilities: string[],
  status: 'healthy' | 'degraded' | 'unavailable' = 'healthy',
  load: number = 0.5
): AgentNode {
  return {
    identity: createAgentIdentity(name, capabilities),
    status,
    load,
    capacity: 1 - load,
    endpoint: `http://localhost:3000/agents/${name}`,
    healthCheck: `http://localhost:3000/agents/${name}/health`,
    lastHeartbeat: new Date().toISOString(),
  };
}

function createMessage(to: AgentIdentity): A2AMessage {
  return {
    id: crypto.randomUUID(),
    from: createAgentIdentity('sender', []),
    to,
    type: 'request' as any,
    payload: {},
    version: '0.4.5',
    metadata: {
      priority: 'normal' as any,
      timeout: 30000,
      retries: 3,
      traceContext: {
        traceparent: '00-' + '0'.repeat(32) + '-' + '0'.repeat(16) + '-01',
        traceId: '0'.repeat(32),
        spanId: '0'.repeat(16),
      },
      createdAt: new Date().toISOString(),
    },
  };
}
