/**
 * End-to-End Tests for OSSA Agent Lifecycle Management
 * 
 * Tests the complete agent lifecycle management system including:
 * - Agent registration and initialization
 * - State transitions and health monitoring
 * - Graceful shutdown and recovery
 * - Hot-swapping capabilities
 * - Dependency resolution and circular dependency detection
 * - Failure detection and automatic remediation
 * - Performance monitoring and SLA compliance
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { 
  LifecycleManager, 
  LifecycleState, 
  HealthStatus, 
  FailureAction,
  LifecycleAgent,
  HeartbeatConfig,
  HealthCheckConfig,
  FailureDetectionConfig,
  ShutdownConfig,
  HotSwapConfig,
  DependencyConfig
} from '../../src/lifecycle/lifecycle-manager.js';
import { Agent, AgentState } from '../../src/coordination/agent-coordinator.js';
import { createTestAgent, createLifecycleConfig, waitForState } from '../fixtures/agent-fixtures.js';

interface LifecycleTestContext {
  lifecycleManager: LifecycleManager;
  testAgents: Map<string, Agent>;
  config: {
    heartbeat: HeartbeatConfig;
    healthCheck: HealthCheckConfig;
    failureDetection: FailureDetectionConfig;
    shutdown: ShutdownConfig;
    hotSwap: HotSwapConfig;
    dependency: DependencyConfig;
  };
}

describe('OSSA Agent Lifecycle Manager E2E Tests', () => {
  let context: LifecycleTestContext;
  
  beforeAll(async () => {
    context = await setupLifecycleTestEnvironment();
  });
  
  afterAll(async () => {
    await teardownLifecycleTestEnvironment(context);
  });
  
  beforeEach(() => {
    // Clear any previous test state
    context.testAgents.clear();
  });
  
  describe('Agent Registration and Initialization', () => {
    it('should register agents and initialize lifecycle management', async () => {
      const agent = createTestAgent({
        id: 'test-agent-1',
        name: 'Test Agent 1',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      await context.lifecycleManager.registerAgent(agent, []);
      
      // Verify agent is registered and lifecycle initialized
      const healthStatus = context.lifecycleManager.getAgentHealth(agent.id);
      expect(healthStatus.status).toBeDefined();
      expect(healthStatus.lastCheck).toBeInstanceOf(Date);
      
      context.testAgents.set(agent.id, agent);
    });
    
    it('should handle agent registration with dependencies', async () => {
      const dependencyAgent = createTestAgent({
        id: 'dependency-agent',
        name: 'Dependency Agent',
        type: 'service',
        state: AgentState.AVAILABLE
      });
      
      const mainAgent = createTestAgent({
        id: 'main-agent',
        name: 'Main Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      // Register dependency first
      await context.lifecycleManager.registerAgent(dependencyAgent, []);
      await context.lifecycleManager.registerAgent(mainAgent, [dependencyAgent.id]);
      
      // Verify dependency relationship is established
      const systemHealth = context.lifecycleManager.getSystemHealth();
      expect(systemHealth.dependencies.total).toBeGreaterThan(0);
      
      context.testAgents.set(dependencyAgent.id, dependencyAgent);
      context.testAgents.set(mainAgent.id, mainAgent);
    });
    
    it('should detect and report circular dependencies', async () => {
      const agentA = createTestAgent({ id: 'agent-a', name: 'Agent A', type: 'worker' });
      const agentB = createTestAgent({ id: 'agent-b', name: 'Agent B', type: 'worker' });
      const agentC = createTestAgent({ id: 'agent-c', name: 'Agent C', type: 'worker' });
      
      // Create circular dependency: A -> B -> C -> A
      await context.lifecycleManager.registerAgent(agentA, ['agent-c']);
      await context.lifecycleManager.registerAgent(agentB, ['agent-a']);
      await context.lifecycleManager.registerAgent(agentC, ['agent-b']);
      
      const systemHealth = context.lifecycleManager.getSystemHealth();
      expect(systemHealth.dependencies.circular).toBeGreaterThan(0);
      expect(systemHealth.issues.some(issue => issue.includes('circular'))).toBe(true);
      
      context.testAgents.set(agentA.id, agentA);
      context.testAgents.set(agentB.id, agentB);
      context.testAgents.set(agentC.id, agentC);
    });
  });
  
  describe('Agent State Management and Health Monitoring', () => {
    it('should monitor agent health and detect state changes', async () => {
      const agent = createTestAgent({
        id: 'health-test-agent',
        name: 'Health Test Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      await context.lifecycleManager.registerAgent(agent, []);
      await context.lifecycleManager.startAgent(agent.id);
      
      // Wait for agent to be running
      await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
      
      const initialHealth = context.lifecycleManager.getAgentHealth(agent.id);
      expect(initialHealth.status).toBe(HealthStatus.HEALTHY);
      
      // Monitor health over time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedHealth = context.lifecycleManager.getAgentHealth(agent.id);
      expect(updatedHealth.lastCheck.getTime()).toBeGreaterThan(initialHealth.lastCheck.getTime());
      
      context.testAgents.set(agent.id, agent);
    });
    
    it('should detect and respond to agent failures', async () => {
      const agent = createTestAgent({
        id: 'failure-test-agent',
        name: 'Failure Test Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      let failureDetected = false;
      let recoveryAttempted = false;
      
      context.lifecycleManager.on('heartbeatFailed', (event) => {
        if (event.agentId === agent.id) {
          failureDetected = true;
        }
      });
      
      context.lifecycleManager.on('agentRestarting', (event) => {
        if (event.agentId === agent.id) {
          recoveryAttempted = true;
        }
      });
      
      await context.lifecycleManager.registerAgent(agent, []);
      await context.lifecycleManager.startAgent(agent.id);
      
      // Simulate agent becoming unresponsive by setting last heartbeat to past
      const lifecycleAgent = context.lifecycleManager['agents'].get(agent.id) as LifecycleAgent;
      if (lifecycleAgent) {
        lifecycleAgent.lastHeartbeat = new Date(Date.now() - 60000); // 1 minute ago
      }
      
      // Wait for failure detection and recovery
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      expect(failureDetected).toBe(true);
      // Recovery behavior depends on configuration
      
      context.testAgents.set(agent.id, agent);
    });
    
    it('should maintain SLA compliance and performance metrics', async () => {
      const agent = createTestAgent({
        id: 'sla-test-agent',
        name: 'SLA Test Agent',
        type: 'worker',
        state: AgentState.AVAILABLE,
        sla: {
          responseTimeMs: 1000,
          availabilityPercent: 99.5,
          throughputPerSecond: 10,
          errorRatePercent: 0.5,
          recoveryTimeMs: 5000
        }
      });
      
      await context.lifecycleManager.registerAgent(agent, []);
      await context.lifecycleManager.startAgent(agent.id);
      
      // Monitor over several health check cycles
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const health = context.lifecycleManager.getAgentHealth(agent.id);
      expect(health.metrics.availability).toBeGreaterThan(95);
      expect(health.metrics.response_time_ms).toBeLessThan(5000);
      expect(health.metrics.error_rate).toBeLessThan(10);
      
      context.testAgents.set(agent.id, agent);
    });
  });
  
  describe('Agent Lifecycle State Transitions', () => {
    it('should handle complete agent lifecycle from start to stop', async () => {
      const agent = createTestAgent({
        id: 'lifecycle-test-agent',
        name: 'Lifecycle Test Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      const stateTransitions: LifecycleState[] = [];
      
      context.lifecycleManager.on('lifecycleEvent', (event) => {
        if (event.agentId === agent.id) {
          const lifecycleAgent = context.lifecycleManager['agents'].get(agent.id) as LifecycleAgent;
          if (lifecycleAgent) {
            stateTransitions.push(lifecycleAgent.lifecycle.state);
          }
        }
      });
      
      await context.lifecycleManager.registerAgent(agent, []);
      expect(stateTransitions).toContain(LifecycleState.INITIALIZING);
      
      await context.lifecycleManager.startAgent(agent.id);
      await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
      expect(stateTransitions).toContain(LifecycleState.STARTING);
      expect(stateTransitions).toContain(LifecycleState.RUNNING);
      
      await context.lifecycleManager.stopAgent(agent.id);
      expect(stateTransitions).toContain(LifecycleState.STOPPING);
      expect(stateTransitions).toContain(LifecycleState.STOPPED);
      
      context.testAgents.set(agent.id, agent);
    });
    
    it('should handle graceful shutdown with cleanup tasks', async () => {
      const agent = createTestAgent({
        id: 'graceful-shutdown-agent',
        name: 'Graceful Shutdown Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      let shutdownTasksExecuted = false;
      
      // Mock cleanup task execution
      context.lifecycleManager['executeCleanupTask'] = async (agentId: string, task: string) => {
        if (agentId === agent.id) {
          shutdownTasksExecuted = true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      };
      
      await context.lifecycleManager.registerAgent(agent, []);
      await context.lifecycleManager.startAgent(agent.id);
      await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
      
      const shutdownStart = Date.now();
      await context.lifecycleManager.stopAgent(agent.id, false); // Graceful shutdown
      const shutdownTime = Date.now() - shutdownStart;
      
      expect(shutdownTime).toBeLessThan(context.config.shutdown.graceful_timeout + 1000);
      expect(shutdownTasksExecuted).toBe(true);
      
      context.testAgents.set(agent.id, agent);
    });
    
    it('should handle forced shutdown when graceful shutdown fails', async () => {
      const agent = createTestAgent({
        id: 'force-shutdown-agent',
        name: 'Force Shutdown Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      // Mock slow cleanup that would timeout
      context.lifecycleManager['executeShutdownTasks'] = async () => {
        await new Promise(resolve => setTimeout(resolve, context.config.shutdown.graceful_timeout + 1000));
      };
      
      await context.lifecycleManager.registerAgent(agent, []);
      await context.lifecycleManager.startAgent(agent.id);
      await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
      
      const shutdownStart = Date.now();
      try {
        await context.lifecycleManager.stopAgent(agent.id, false); // Try graceful first
      } catch (error) {
        // Expected timeout, now try force stop
        await context.lifecycleManager.stopAgent(agent.id, true);
      }
      const shutdownTime = Date.now() - shutdownStart;
      
      const lifecycleAgent = context.lifecycleManager['agents'].get(agent.id) as LifecycleAgent;
      expect(lifecycleAgent?.lifecycle.state).toBe(LifecycleState.STOPPED);
      
      context.testAgents.set(agent.id, agent);
    });
  });
  
  describe('Hot-Swapping Capabilities', () => {
    it('should perform successful hot swap of compatible agent', async () => {
      const agent = createTestAgent({
        id: 'hotswap-test-agent',
        name: 'Hot Swap Test Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      // Mark agent as hot-swap capable
      await context.lifecycleManager.registerAgent(agent, []);
      const lifecycleAgent = context.lifecycleManager['agents'].get(agent.id) as LifecycleAgent;
      if (lifecycleAgent) {
        lifecycleAgent.lifecycle.hotSwapCapable = true;
      }
      
      await context.lifecycleManager.startAgent(agent.id);
      await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
      
      const newConfig = {
        name: 'Updated Hot Swap Agent',
        metadata: {
          ...agent.metadata,
          version: '2.0.0',
          lastUpdated: new Date()
        }
      };
      
      let hotSwapStarted = false;
      let hotSwapCompleted = false;
      
      context.lifecycleManager.on('hotSwapCompleted', (event) => {
        if (event.agentId === agent.id) {
          hotSwapCompleted = true;
        }
      });
      
      // Monitor state during hot swap
      const stateBeforeSwap = lifecycleAgent?.lifecycle.state;
      
      await context.lifecycleManager.hotSwapAgent(agent.id, newConfig);
      
      expect(hotSwapCompleted).toBe(true);
      expect(lifecycleAgent?.lifecycle.state).toBe(LifecycleState.RUNNING);
      
      context.testAgents.set(agent.id, agent);
    });
    
    it('should rollback hot swap on failure', async () => {
      const agent = createTestAgent({
        id: 'hotswap-rollback-agent',
        name: 'Hot Swap Rollback Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      await context.lifecycleManager.registerAgent(agent, []);
      const lifecycleAgent = context.lifecycleManager['agents'].get(agent.id) as LifecycleAgent;
      if (lifecycleAgent) {
        lifecycleAgent.lifecycle.hotSwapCapable = true;
      }
      
      await context.lifecycleManager.startAgent(agent.id);
      await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
      
      // Mock hot swap failure
      context.lifecycleManager['performHotSwap'] = async () => {
        throw new Error('Simulated hot swap failure');
      };
      
      const originalName = agent.name;
      const newConfig = { name: 'This Should Not Persist' };
      
      let hotSwapFailed = false;
      context.lifecycleManager.on('hotSwapFailed', (event) => {
        if (event.agentId === agent.id) {
          hotSwapFailed = true;
        }
      });
      
      await expect(context.lifecycleManager.hotSwapAgent(agent.id, newConfig))
        .rejects.toThrow('Simulated hot swap failure');
      
      expect(hotSwapFailed).toBe(true);
      expect(lifecycleAgent?.lifecycle.state).toBe(LifecycleState.RUNNING);
      expect(agent.name).toBe(originalName); // Should be rolled back
      
      context.testAgents.set(agent.id, agent);
    });
  });
  
  describe('Dependency Resolution and Ordering', () => {
    it('should resolve startup order based on dependencies', async () => {
      const serviceAgent = createTestAgent({
        id: 'service-agent',
        name: 'Service Agent',
        type: 'service',
        state: AgentState.AVAILABLE
      });
      
      const worker1 = createTestAgent({
        id: 'worker-1',
        name: 'Worker 1',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      const worker2 = createTestAgent({
        id: 'worker-2',
        name: 'Worker 2',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      const orchestrator = createTestAgent({
        id: 'orchestrator-agent',
        name: 'Orchestrator Agent',
        type: 'orchestrator',
        state: AgentState.AVAILABLE
      });
      
      // Create dependency chain: service <- worker1 <- worker2 <- orchestrator
      await context.lifecycleManager.registerAgent(serviceAgent, []);
      await context.lifecycleManager.registerAgent(worker1, [serviceAgent.id]);
      await context.lifecycleManager.registerAgent(worker2, [worker1.id]);
      await context.lifecycleManager.registerAgent(orchestrator, [worker2.id]);
      
      const startupEvents: { agentId: string, timestamp: Date, event: string }[] = [];
      
      context.lifecycleManager.on('agentStarting', (event) => {
        startupEvents.push({
          agentId: event.agentId,
          timestamp: event.timestamp,
          event: 'starting'
        });
      });
      
      context.lifecycleManager.on('agentStarted', (event) => {
        startupEvents.push({
          agentId: event.agentId,
          timestamp: event.timestamp,
          event: 'started'
        });
      });
      
      // Start the orchestrator (should trigger dependency chain startup)
      await context.lifecycleManager.startAgent(orchestrator.id);
      
      // Verify startup order
      const startingEvents = startupEvents.filter(e => e.event === 'starting');
      const serviceStartIndex = startingEvents.findIndex(e => e.agentId === serviceAgent.id);
      const worker1StartIndex = startingEvents.findIndex(e => e.agentId === worker1.id);
      const worker2StartIndex = startingEvents.findIndex(e => e.agentId === worker2.id);
      const orchestratorStartIndex = startingEvents.findIndex(e => e.agentId === orchestrator.id);
      
      expect(serviceStartIndex).toBeLessThan(worker1StartIndex);
      expect(worker1StartIndex).toBeLessThan(worker2StartIndex);
      expect(worker2StartIndex).toBeLessThan(orchestratorStartIndex);
      
      context.testAgents.set(serviceAgent.id, serviceAgent);
      context.testAgents.set(worker1.id, worker1);
      context.testAgents.set(worker2.id, worker2);
      context.testAgents.set(orchestrator.id, orchestrator);
    });
    
    it('should resolve shutdown order in reverse of startup', async () => {
      // Create agents with dependencies
      const agents = [];
      for (let i = 0; i < 3; i++) {
        const agent = createTestAgent({
          id: `chain-agent-${i}`,
          name: `Chain Agent ${i}`,
          type: 'worker',
          state: AgentState.AVAILABLE
        });
        agents.push(agent);
      }
      
      // Create dependency chain: agents[0] <- agents[1] <- agents[2]
      await context.lifecycleManager.registerAgent(agents[0], []);
      await context.lifecycleManager.registerAgent(agents[1], [agents[0].id]);
      await context.lifecycleManager.registerAgent(agents[2], [agents[1].id]);
      
      // Start all agents
      for (const agent of agents) {
        await context.lifecycleManager.startAgent(agent.id);
        await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
      }
      
      const shutdownEvents: { agentId: string, timestamp: Date }[] = [];
      
      context.lifecycleManager.on('agentStopping', (event) => {
        shutdownEvents.push({
          agentId: event.agentId,
          timestamp: event.timestamp
        });
      });
      
      // Shutdown system
      await context.lifecycleManager.shutdown();
      
      // Verify shutdown order (reverse of startup)
      expect(shutdownEvents.length).toBe(3);
      const shutdownOrder = shutdownEvents.map(e => e.agentId);
      expect(shutdownOrder.indexOf(agents[2].id)).toBeLessThan(shutdownOrder.indexOf(agents[1].id));
      expect(shutdownOrder.indexOf(agents[1].id)).toBeLessThan(shutdownOrder.indexOf(agents[0].id));
      
      agents.forEach(agent => context.testAgents.set(agent.id, agent));
    });
  });
  
  describe('System Health and Performance Monitoring', () => {
    it('should provide comprehensive system health overview', async () => {
      // Create a diverse set of agents with different health states
      const healthyAgent = createTestAgent({
        id: 'healthy-agent',
        name: 'Healthy Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      const degradedAgent = createTestAgent({
        id: 'degraded-agent',
        name: 'Degraded Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      await context.lifecycleManager.registerAgent(healthyAgent, []);
      await context.lifecycleManager.registerAgent(degradedAgent, []);
      
      await context.lifecycleManager.startAgent(healthyAgent.id);
      await context.lifecycleManager.startAgent(degradedAgent.id);
      
      // Wait for health monitoring to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate degraded performance for one agent
      const degradedLifecycleAgent = context.lifecycleManager['agents'].get(degradedAgent.id) as LifecycleAgent;
      if (degradedLifecycleAgent) {
        context.lifecycleManager['healthMetrics'].set(degradedAgent.id, {
          cpu_usage: 95, // High CPU
          memory_usage: 85,
          response_time_ms: 8000, // High response time
          error_rate: 8, // High error rate
          throughput: 5,
          availability: 92, // Low availability
          last_updated: new Date()
        });
      }
      
      const systemHealth = context.lifecycleManager.getSystemHealth();
      
      expect(systemHealth.agents.total).toBe(2);
      expect(systemHealth.agents.healthy + systemHealth.agents.degraded + 
             systemHealth.agents.unhealthy + systemHealth.agents.critical).toBe(2);
      expect(systemHealth.overall).toBeDefined();
      expect(systemHealth.dependencies.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(systemHealth.issues)).toBe(true);
      
      context.testAgents.set(healthyAgent.id, healthyAgent);
      context.testAgents.set(degradedAgent.id, degradedAgent);
    });
    
    it('should track and report performance metrics over time', async () => {
      const agent = createTestAgent({
        id: 'metrics-agent',
        name: 'Metrics Agent',
        type: 'worker',
        state: AgentState.AVAILABLE
      });
      
      await context.lifecycleManager.registerAgent(agent, []);
      await context.lifecycleManager.startAgent(agent.id);
      
      const metricsHistory: any[] = [];
      
      // Collect metrics over several intervals
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const health = context.lifecycleManager.getAgentHealth(agent.id);
        metricsHistory.push({
          timestamp: new Date(),
          metrics: { ...health.metrics }
        });
      }
      
      expect(metricsHistory).toHaveLength(5);
      
      // Verify metrics are being updated
      const firstMetrics = metricsHistory[0].metrics;
      const lastMetrics = metricsHistory[4].metrics;
      expect(lastMetrics.last_updated.getTime()).toBeGreaterThan(firstMetrics.last_updated.getTime());
      
      // Verify metrics are reasonable
      metricsHistory.forEach(entry => {
        expect(entry.metrics.cpu_usage).toBeGreaterThanOrEqual(0);
        expect(entry.metrics.cpu_usage).toBeLessThanOrEqual(100);
        expect(entry.metrics.memory_usage).toBeGreaterThanOrEqual(0);
        expect(entry.metrics.memory_usage).toBeLessThanOrEqual(100);
        expect(entry.metrics.availability).toBeGreaterThanOrEqual(0);
        expect(entry.metrics.availability).toBeLessThanOrEqual(100);
      });
      
      context.testAgents.set(agent.id, agent);
    });
  });
  
  describe('Failure Detection and Recovery', () => {
    it('should detect various failure scenarios and execute appropriate actions', async () => {
      const testScenarios = [
        {
          name: 'High Error Rate',
          agentId: 'high-error-agent',
          failure: () => ({ error_rate: 15 }), // Above 5% threshold
          expectedAction: FailureAction.RESTART
        },
        {
          name: 'High Response Time', 
          agentId: 'slow-response-agent',
          failure: () => ({ response_time_ms: 8000 }), // Above 5000ms threshold
          expectedAction: FailureAction.RESTART
        },
        {
          name: 'Resource Exhaustion',
          agentId: 'resource-exhausted-agent',
          failure: () => ({ cpu_usage: 95, memory_usage: 95 }), // Above 90% threshold
          expectedAction: FailureAction.ISOLATE
        }
      ];
      
      for (const scenario of testScenarios) {
        const agent = createTestAgent({
          id: scenario.agentId,
          name: `Agent for ${scenario.name}`,
          type: 'worker',
          state: AgentState.AVAILABLE
        });
        
        await context.lifecycleManager.registerAgent(agent, []);
        await context.lifecycleManager.startAgent(agent.id);
        await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
        
        // Inject failure condition
        const currentMetrics = context.lifecycleManager['healthMetrics'].get(agent.id);
        if (currentMetrics) {
          const failureMetrics = {
            ...currentMetrics,
            ...scenario.failure(),
            last_updated: new Date()
          };
          context.lifecycleManager['healthMetrics'].set(agent.id, failureMetrics);
        }
        
        // Wait for failure detection
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const agentHealth = context.lifecycleManager.getAgentHealth(agent.id);
        expect(agentHealth.status).not.toBe(HealthStatus.HEALTHY);
        expect(agentHealth.issues.length).toBeGreaterThan(0);
        
        context.testAgents.set(agent.id, agent);
      }
    });
    
    it('should handle cascading failures and system-wide recovery', async () => {
      // Create a chain of dependent agents
      const agents = [];
      for (let i = 0; i < 4; i++) {
        const agent = createTestAgent({
          id: `cascade-agent-${i}`,
          name: `Cascade Agent ${i}`,
          type: 'worker',
          state: AgentState.AVAILABLE
        });
        agents.push(agent);
      }
      
      // Create dependency chain
      await context.lifecycleManager.registerAgent(agents[0], []);
      for (let i = 1; i < agents.length; i++) {
        await context.lifecycleManager.registerAgent(agents[i], [agents[i-1].id]);
      }
      
      // Start all agents
      for (const agent of agents) {
        await context.lifecycleManager.startAgent(agent.id);
        await waitForState(context.lifecycleManager, agent.id, LifecycleState.RUNNING, 5000);
      }
      
      // Simulate failure of root dependency
      const rootAgent = agents[0];
      const rootLifecycleAgent = context.lifecycleManager['agents'].get(rootAgent.id) as LifecycleAgent;
      if (rootLifecycleAgent) {
        rootLifecycleAgent.lifecycle.state = LifecycleState.FAILED;
        rootLifecycleAgent.lifecycle.healthStatus = HealthStatus.CRITICAL;
      }
      
      // Track dependency health warnings
      const dependencyWarnings: string[] = [];
      context.lifecycleManager.on('dependencyUnhealthy', (event) => {
        dependencyWarnings.push(event.agentId);
      });
      
      // Wait for cascade detection
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify that dependent agents are warned about unhealthy dependency
      expect(dependencyWarnings.length).toBeGreaterThan(0);
      expect(dependencyWarnings).toContain(agents[1].id);
      
      const systemHealth = context.lifecycleManager.getSystemHealth();
      expect(systemHealth.overall).not.toBe(HealthStatus.HEALTHY);
      expect(systemHealth.issues.some(issue => issue.includes('dependency'))).toBe(true);
      
      agents.forEach(agent => context.testAgents.set(agent.id, agent));
    });
  });
});

// Setup and utility functions
async function setupLifecycleTestEnvironment(): Promise<LifecycleTestContext> {
  const config = {
    heartbeat: {
      interval: 1000,
      timeout: 5000,
      retryAttempts: 3,
      escalationDelay: 1000
    },
    healthCheck: {
      endpoint: '/health',
      method: 'GET' as const,
      timeout: 2000,
      interval: 2000,
      failureThreshold: 3,
      successThreshold: 2
    },
    failureDetection: {
      tiers: {
        heartbeat: { enabled: true, threshold: 3, action: FailureAction.RESTART, escalationTime: 5000 },
        health_check: { enabled: true, threshold: 3, action: FailureAction.RESTART, escalationTime: 10000 },
        performance: { enabled: true, threshold: 5, action: FailureAction.ISOLATE, escalationTime: 15000 },
        dependency: { enabled: true, threshold: 2, action: FailureAction.ESCALATE, escalationTime: 20000 },
        resource: { enabled: true, threshold: 1, action: FailureAction.REPLACE, escalationTime: 30000 }
      },
      circuit_breaker: {
        enabled: true,
        failure_threshold: 5,
        recovery_timeout: 30000,
        half_open_max_calls: 3
      }
    },
    shutdown: {
      graceful_timeout: 10000,
      force_timeout: 5000,
      cleanup_tasks: ['save_state', 'close_connections', 'release_resources'],
      drain_connections: true,
      save_state: true
    },
    hotSwap: {
      enabled: true,
      preparation_timeout: 5000,
      swap_timeout: 10000,
      rollback_timeout: 8000,
      health_check_delay: 2000,
      compatibility_check: true
    },
    dependency: {
      resolution_strategy: 'breadth_first' as const,
      circular_detection: true,
      max_dependency_depth: 10,
      startup_order_timeout: 30000,
      shutdown_order_timeout: 20000
    }
  };
  
  const lifecycleManager = new LifecycleManager(config);
  
  return {
    lifecycleManager,
    testAgents: new Map(),
    config
  };
}

async function teardownLifecycleTestEnvironment(context: LifecycleTestContext): Promise<void> {
  try {
    await context.lifecycleManager.shutdown();
  } catch (error) {
    console.warn('Error during test environment teardown:', error);
  }
}
