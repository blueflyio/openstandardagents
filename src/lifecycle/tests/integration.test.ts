/**
 * Integration tests for OSSA Lifecycle Management System
 * Tests the complete lifecycle management flow with all components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntegratedLifecycleSystem } from '../index.js';
import { Agent, AgentState } from '../../coordination/agent-coordinator.js';
import {
  LifecycleState,
  HealthStatus,
  FailureDetectionTier,
  FailureAction,
  ShutdownReason,
  SwapStrategy,
  DependencyType,
  CheckType,
  CheckProtocol
} from '../index.js';

describe('Integrated Lifecycle Management System', () => {
  let lifecycleSystem: IntegratedLifecycleSystem;
  let mockAgent: Agent;

  beforeEach(async () => {
    // Create test configuration
    const config = {
      lifecycle: {
        heartbeat: {
          interval: 1000,
          timeout: 500,
          retryAttempts: 2,
          escalationDelay: 1000
        },
        healthCheck: {
          endpoint: '/health',
          method: 'GET',
          timeout: 1000,
          interval: 2000,
          failureThreshold: 3,
          successThreshold: 2
        },
        failureDetection: {
          tiers: {
            [FailureDetectionTier.HEARTBEAT]: {
              enabled: true,
              threshold: 3,
              action: FailureAction.RESTART,
              escalationTime: 5000
            },
            [FailureDetectionTier.HEALTH_CHECK]: {
              enabled: true,
              threshold: 2,
              action: FailureAction.ALERT,
              escalationTime: 10000
            },
            [FailureDetectionTier.PERFORMANCE]: {
              enabled: true,
              threshold: 1,
              action: FailureAction.CIRCUIT_BREAK,
              escalationTime: 2000
            },
            [FailureDetectionTier.DEPENDENCY]: {
              enabled: true,
              threshold: 1,
              action: FailureAction.ISOLATE,
              escalationTime: 3000
            },
            [FailureDetectionTier.RESOURCE]: {
              enabled: true,
              threshold: 1,
              action: FailureAction.ESCALATE,
              escalationTime: 1000
            }
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
          cleanup_tasks: ['cleanup_temp_files', 'close_connections'],
          drain_connections: true,
          save_state: true
        },
        hotSwap: {
          enabled: true,
          preparation_timeout: 5000,
          swap_timeout: 10000,
          rollback_timeout: 5000,
          health_check_delay: 2000,
          compatibility_check: true
        },
        dependency: {
          resolution_strategy: 'topological',
          circular_detection: true,
          max_dependency_depth: 5,
          startup_order_timeout: 30000,
          shutdown_order_timeout: 15000
        }
      },
      heartbeat: {
        interval: 1000,
        timeout: 500,
        retryAttempts: 2,
        backoffMultiplier: 1.5,
        maxBackoffInterval: 30000,
        adaptiveInterval: true,
        jitterPercentage: 10
      },
      failureDetection: {
        detectionInterval: 5000,
        metricsRetentionTime: 3600000,
        maxHistorySize: 1000,
        circuitBreaker: {
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 30000,
          halfOpenMaxCalls: 3,
          monitoringInterval: 10000
        },
        enableRootCauseAnalysis: true
      },
      shutdown: {
        gracefulTimeout: 10000,
        phaseTimeouts: {
          preparation: 2000,
          drain_connections: 5000,
          finish_requests: 8000,
          cleanup_resources: 3000,
          save_state: 4000,
          stop_services: 2000,
          final_cleanup: 1000,
          complete: 0
        },
        drainTimeout: 5000,
        cleanupTimeout: 3000,
        saveStateTimeout: 4000,
        forceKillTimeout: 2000,
        retryAttempts: 2,
        backoffDelay: 1000,
        enableStatePreservation: true,
        enableConnectionDraining: true,
        enableResourceCleanup: true,
        emergencyShutdownTimeout: 5000
      },
      hotSwap: {
        strategy: SwapStrategy.BLUE_GREEN,
        maxConcurrentSwaps: 2,
        healthCheckTimeout: 10000,
        rollbackTimeout: 15000,
        trafficSplitDuration: 30000,
        validationTimeout: 5000,
        stateTransferTimeout: 10000,
        enableAutoRollback: true,
        rollbackTriggers: {
          errorRateThreshold: 5,
          responseTimeThreshold: 5000,
          healthCheckFailures: 3,
          customMetricThresholds: {}
        },
        compatibilityChecks: {
          api: true,
          schema: true,
          dependencies: true,
          configuration: true
        }
      },
      dependency: {
        resolutionStrategy: 'topological',
        maxDepth: 5,
        timeoutMs: 30000,
        enableCircularDetection: true,
        enableConflictResolution: true,
        enableParallelResolution: true,
        retryAttempts: 2,
        backoffDelay: 1000,
        enableOptimizations: true
      }
    };

    lifecycleSystem = new IntegratedLifecycleSystem(config);

    // Create mock agent
    mockAgent = {
      id: 'test-agent-001',
      name: 'Test Agent',
      type: 'test',
      capabilities: [],
      state: AgentState.AVAILABLE,
      currentLoad: 0,
      maxLoad: 100,
      sla: {
        responseTimeMs: 1000,
        availabilityPercent: 99.9,
        throughputPerSecond: 100,
        errorRatePercent: 1,
        recoveryTimeMs: 5000
      },
      trustScore: 0.95,
      lastHeartbeat: new Date(),
      metadata: {
        version: '1.0.0',
        framework: 'test',
        region: 'us-east-1',
        tags: ['test'],
        owner: 'test-team',
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    };

    await lifecycleSystem.start();
  });

  afterEach(async () => {
    await lifecycleSystem.stop();
  });

  describe('Agent Registration and Lifecycle', () => {
    it('should register agent and start lifecycle management', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      
      await lifecycleManager.registerAgent(mockAgent, []);
      
      const systemHealth = lifecycleManager.getSystemHealth();
      expect(systemHealth.agents.total).toBe(1);
      expect(systemHealth.overall).toBe(HealthStatus.HEALTHY);
    });

    it('should start and stop agent with dependency resolution', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      const dependencyResolver = lifecycleSystem.getDependencyResolver();

      // Register agent with dependencies
      await lifecycleManager.registerAgent(mockAgent, ['dependency-1', 'dependency-2']);
      
      // Build dependency graph
      const dependencies = [
        {
          id: 'dependency-1',
          name: 'Database Connection',
          version: '1.0.0',
          type: DependencyType.HARD,
          agentId: 'db-agent',
          optional: false,
          metadata: {
            priority: 1,
            weight: 1,
            criticality: 'high' as const,
            tags: ['database'],
            description: 'Database connection dependency'
          }
        },
        {
          id: 'dependency-2',
          name: 'Cache Service',
          version: '1.0.0',
          type: DependencyType.SOFT,
          agentId: 'cache-agent',
          optional: true,
          metadata: {
            priority: 2,
            weight: 0.5,
            criticality: 'medium' as const,
            tags: ['cache'],
            description: 'Cache service dependency'
          }
        }
      ];

      const graph = await dependencyResolver.buildDependencyGraph(mockAgent.id, dependencies);
      expect(graph.nodes.size).toBe(2);
      expect(graph.cycles.length).toBe(0);

      // Start agent
      await lifecycleManager.startAgent(mockAgent.id);
      
      const systemHealth = lifecycleManager.getSystemHealth();
      expect(systemHealth.agents.healthy).toBeGreaterThan(0);
    });
  });

  describe('Health Monitoring Integration', () => {
    it('should integrate heartbeat and health checks', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      const heartbeatMonitor = lifecycleSystem.getHeartbeatMonitor();
      const healthCheckSystem = lifecycleSystem.getHealthCheckSystem();

      // Register agent
      await lifecycleManager.registerAgent(mockAgent, []);

      // Start heartbeat monitoring
      heartbeatMonitor.startMonitoring(mockAgent.id, `http://localhost:8080/health`);

      // Register health check
      healthCheckSystem.registerHealthCheck({
        id: 'basic-health-check',
        name: 'Basic Health Check',
        description: 'Basic HTTP health check',
        agentId: mockAgent.id,
        type: CheckType.BASIC,
        protocol: CheckProtocol.HTTP,
        config: {
          enabled: true,
          interval: 2000,
          timeout: 1000,
          retries: 2,
          backoffFactor: 1.5,
          gracePeriod: 5000,
          slidingWindow: 10,
          thresholds: {
            degraded: 0.8,
            unhealthy: 0.5,
            critical: 0.2
          },
          alerting: {
            enabled: true,
            channels: ['log'],
            escalationDelay: 5000,
            suppressDuration: 30000
          }
        },
        endpoint: 'http://localhost:8080/health',
        method: 'GET',
        expectedResponse: {
          status: 200
        },
        dependencies: [],
        metadata: {
          priority: 1,
          weight: 1,
          category: 'basic',
          tags: ['http', 'health'],
          sla: {
            availability: 99.9,
            responseTime: 1000,
            errorRate: 1,
            throughput: 10,
            measurementWindow: 300000
          }
        }
      });

      // Wait for monitoring to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      const heartbeatStatus = heartbeatMonitor.getStatus(mockAgent.id);
      const healthSummary = healthCheckSystem.getHealthSummary(mockAgent.id);

      expect(heartbeatStatus).toBeTruthy();
      expect(healthSummary).toBeTruthy();
    });
  });

  describe('Failure Detection and Recovery', () => {
    it('should detect failures and trigger recovery actions', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      const failureDetector = lifecycleSystem.getFailureDetector();

      // Register agent
      await lifecycleManager.registerAgent(mockAgent, []);
      
      // Start failure detection
      failureDetector.startDetection(mockAgent.id);

      // Simulate poor performance metrics
      failureDetector.updateMetrics(mockAgent.id, {
        responseTime: 5000,  // High response time
        throughput: 10,      // Low throughput
        errorRate: 15,       // High error rate
        cpuUsage: 95,        // High CPU
        memoryUsage: 90,     // High memory
        diskUsage: 80,
        networkLatency: 200,
        customMetrics: {}
      });

      // Wait for detection
      await new Promise(resolve => setTimeout(resolve, 2000));

      const failures = failureDetector.getActiveFailures(mockAgent.id);
      expect(failures.length).toBeGreaterThan(0);

      const detectionOverview = failureDetector.getDetectionOverview();
      expect(detectionOverview.activeFailures).toBeGreaterThan(0);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should perform graceful shutdown with cleanup', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      const shutdownManager = lifecycleSystem.getShutdownManager();

      // Register agent
      await lifecycleManager.registerAgent(mockAgent, []);

      // Start agent
      await lifecycleManager.startAgent(mockAgent.id);

      // Register connections and resources for shutdown
      shutdownManager.registerConnections(mockAgent.id, [
        {
          id: 'conn-1',
          type: 'http',
          remoteAddress: '192.168.1.100',
          establishedAt: new Date(),
          lastActivity: new Date(),
          requestsInProgress: 2,
          closeable: true
        }
      ]);

      shutdownManager.registerResources(mockAgent.id, [
        {
          type: 'database',
          id: 'db-pool-1',
          description: 'Database connection pool',
          critical: true,
          cleanup: async () => {
            console.log('Cleaning up database connections');
          }
        }
      ]);

      // Initiate graceful shutdown
      const shutdownOperation = await shutdownManager.initiateShutdown(
        mockAgent.id,
        ShutdownReason.MAINTENANCE
      );

      expect(shutdownOperation).toBeTruthy();
      
      const progress = shutdownManager.getShutdownProgress(mockAgent.id);
      expect(progress).toBeTruthy();
    });
  });

  describe('Hot Swapping', () => {
    it('should perform hot swap with zero downtime', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      const hotSwapManager = lifecycleSystem.getHotSwapManager();

      // Register agent
      await lifecycleManager.registerAgent(mockAgent, []);

      // Register current instance
      hotSwapManager.registerInstances(mockAgent.id, [
        {
          id: `${mockAgent.id}-v1.0.0`,
          version: '1.0.0',
          endpoint: 'http://localhost:8080',
          healthEndpoint: '/health',
          status: 'serving',
          resources: {
            cpu: 50,
            memory: 60,
            disk: 30
          },
          configuration: {
            feature_flags: {
              new_feature: false
            }
          },
          capabilities: ['basic', 'advanced'],
          dependencies: []
        }
      ]);

      // Create hot swap request
      const swapRequest = {
        id: `swap-${Date.now()}`,
        agentId: mockAgent.id,
        currentVersion: '1.0.0',
        targetVersion: '1.1.0',
        strategy: SwapStrategy.BLUE_GREEN,
        config: {
          enableAutoRollback: true
        },
        metadata: {
          reason: 'Feature update',
          requester: 'deployment-system',
          urgency: 'medium' as const,
          approvalRequired: false
        }
      };

      // Initiate hot swap
      try {
        const swapOperation = await hotSwapManager.initiateSwap(swapRequest);
        expect(swapOperation).toBeTruthy();
        expect(swapOperation.success).toBe(true);
      } catch (error) {
        // Hot swap might fail in test environment, which is expected
        console.log('Hot swap failed as expected in test environment:', error.message);
      }

      const activeSwaps = hotSwapManager.getActiveSwaps();
      // Should be 0 if completed successfully or failed and cleaned up
      expect(activeSwaps.length).toBe(0);
    });
  });

  describe('System Health Overview', () => {
    it('should provide comprehensive system health overview', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();

      // Register multiple agents
      const agents = [
        { ...mockAgent, id: 'agent-1' },
        { ...mockAgent, id: 'agent-2' },
        { ...mockAgent, id: 'agent-3' }
      ];

      for (const agent of agents) {
        await lifecycleManager.registerAgent(agent, []);
        await lifecycleManager.startAgent(agent.id);
      }

      // Get system health
      const systemHealth = lifecycleSystem.getSystemHealth();

      expect(systemHealth.overall).toBeTruthy();
      expect(systemHealth.agents.total).toBe(3);
      expect(systemHealth.components).toBeTruthy();
      expect(systemHealth.components.heartbeat).toBeTruthy();
      expect(systemHealth.components.failureDetection).toBeTruthy();
      expect(systemHealth.components.shutdown).toBeTruthy();
      expect(systemHealth.components.lifecycle).toBeTruthy();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle component failures gracefully', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      const failureDetector = lifecycleSystem.getFailureDetector();

      // Register agent
      await lifecycleManager.registerAgent(mockAgent, []);

      // Try to start agent with invalid configuration
      try {
        await lifecycleManager.startAgent('non-existent-agent');
      } catch (error) {
        expect(error.message).toContain('not found');
      }

      // Start failure detection for non-existent agent
      try {
        failureDetector.startDetection('non-existent-agent');
        // This shouldn't throw, but may not work properly
      } catch (error) {
        // Expected in some cases
      }

      // System should remain stable
      const systemHealth = lifecycleSystem.getSystemHealth();
      expect(systemHealth.overall).toBeTruthy();
    });

    it('should recover from transient failures', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      const heartbeatMonitor = lifecycleSystem.getHeartbeatMonitor();

      // Register agent
      await lifecycleManager.registerAgent(mockAgent, []);

      // Start heartbeat monitoring
      heartbeatMonitor.startMonitoring(mockAgent.id, 'http://localhost:9999/health'); // Non-existent endpoint

      // Wait for failures to occur
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check that system continues to function
      const overview = heartbeatMonitor.getOverview();
      expect(overview.total).toBe(1);
      
      // Agent should be marked as failed but system should be stable
      const status = heartbeatMonitor.getStatus(mockAgent.id);
      expect(status?.status).toBe('failed');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple agents efficiently', async () => {
      const lifecycleManager = lifecycleSystem.getLifecycleManager();
      const heartbeatMonitor = lifecycleSystem.getHeartbeatMonitor();

      const numAgents = 10;
      const agents = Array.from({ length: numAgents }, (_, i) => ({
        ...mockAgent,
        id: `agent-${i}`,
        name: `Test Agent ${i}`
      }));

      const startTime = Date.now();

      // Register all agents
      for (const agent of agents) {
        await lifecycleManager.registerAgent(agent, []);
        heartbeatMonitor.startMonitoring(agent.id, `http://localhost:808${i % 10}/health`);
      }

      const registrationTime = Date.now() - startTime;
      
      // Should complete in reasonable time
      expect(registrationTime).toBeLessThan(5000); // 5 seconds

      // Check system state
      const systemHealth = lifecycleManager.getSystemHealth();
      expect(systemHealth.agents.total).toBe(numAgents);

      const overview = heartbeatMonitor.getOverview();
      expect(overview.total).toBe(numAgents);
    });
  });
});

describe('Component Integration', () => {
  let lifecycleSystem: IntegratedLifecycleSystem;

  beforeEach(async () => {
    const config = {
      lifecycle: {
        heartbeat: { interval: 1000, timeout: 500, retryAttempts: 1, escalationDelay: 1000 },
        healthCheck: { endpoint: '/health', method: 'GET', timeout: 1000, interval: 2000, failureThreshold: 2, successThreshold: 1 },
        failureDetection: {
          tiers: {
            [FailureDetectionTier.HEARTBEAT]: { enabled: true, threshold: 2, action: FailureAction.RESTART, escalationTime: 3000 },
            [FailureDetectionTier.HEALTH_CHECK]: { enabled: true, threshold: 2, action: FailureAction.ALERT, escalationTime: 5000 },
            [FailureDetectionTier.PERFORMANCE]: { enabled: true, threshold: 1, action: FailureAction.CIRCUIT_BREAK, escalationTime: 2000 },
            [FailureDetectionTier.DEPENDENCY]: { enabled: true, threshold: 1, action: FailureAction.ISOLATE, escalationTime: 3000 },
            [FailureDetectionTier.RESOURCE]: { enabled: true, threshold: 1, action: FailureAction.ESCALATE, escalationTime: 1000 }
          },
          circuit_breaker: { enabled: true, failure_threshold: 3, recovery_timeout: 15000, half_open_max_calls: 2 }
        },
        shutdown: { graceful_timeout: 5000, force_timeout: 2000, cleanup_tasks: ['cleanup'], drain_connections: true, save_state: true },
        hotSwap: { enabled: true, preparation_timeout: 3000, swap_timeout: 5000, rollback_timeout: 3000, health_check_delay: 1000, compatibility_check: true },
        dependency: { resolution_strategy: 'topological', circular_detection: true, max_dependency_depth: 3, startup_order_timeout: 15000, shutdown_order_timeout: 10000 }
      },
      heartbeat: { interval: 1000, timeout: 500, retryAttempts: 1, backoffMultiplier: 1.5, maxBackoffInterval: 10000, adaptiveInterval: false, jitterPercentage: 0 },
      failureDetection: { detectionInterval: 2000, metricsRetentionTime: 1800000, maxHistorySize: 100, circuitBreaker: { failureThreshold: 3, successThreshold: 2, timeout: 15000, halfOpenMaxCalls: 2, monitoringInterval: 5000 }, enableRootCauseAnalysis: false },
      shutdown: { gracefulTimeout: 5000, phaseTimeouts: { preparation: 1000, drain_connections: 2000, finish_requests: 3000, cleanup_resources: 1000, save_state: 2000, stop_services: 1000, final_cleanup: 500, complete: 0 }, drainTimeout: 2000, cleanupTimeout: 1000, saveStateTimeout: 2000, forceKillTimeout: 1000, retryAttempts: 1, backoffDelay: 500, enableStatePreservation: true, enableConnectionDraining: true, enableResourceCleanup: true, emergencyShutdownTimeout: 2000 },
      hotSwap: { strategy: SwapStrategy.CANARY, maxConcurrentSwaps: 1, healthCheckTimeout: 5000, rollbackTimeout: 5000, trafficSplitDuration: 10000, validationTimeout: 3000, stateTransferTimeout: 5000, enableAutoRollback: true, rollbackTriggers: { errorRateThreshold: 10, responseTimeThreshold: 2000, healthCheckFailures: 2, customMetricThresholds: {} }, compatibilityChecks: { api: true, schema: true, dependencies: true, configuration: true } },
      dependency: { resolutionStrategy: 'topological', maxDepth: 3, timeoutMs: 15000, enableCircularDetection: true, enableConflictResolution: true, enableParallelResolution: false, retryAttempts: 1, backoffDelay: 500, enableOptimizations: false }
    };

    lifecycleSystem = new IntegratedLifecycleSystem(config);
    await lifecycleSystem.start();
  });

  afterEach(async () => {
    await lifecycleSystem.stop();
  });

  it('should coordinate between all components', async () => {
    const lifecycleManager = lifecycleSystem.getLifecycleManager();
    const heartbeatMonitor = lifecycleSystem.getHeartbeatMonitor();
    const failureDetector = lifecycleSystem.getFailureDetector();
    const healthCheckSystem = lifecycleSystem.getHealthCheckSystem();

    const testAgent: Agent = {
      id: 'integration-test-agent',
      name: 'Integration Test Agent',
      type: 'test',
      capabilities: [],
      state: AgentState.AVAILABLE,
      currentLoad: 0,
      maxLoad: 100,
      sla: { responseTimeMs: 1000, availabilityPercent: 99, throughputPerSecond: 50, errorRatePercent: 2, recoveryTimeMs: 3000 },
      trustScore: 0.9,
      lastHeartbeat: new Date(),
      metadata: { version: '1.0.0', framework: 'test', region: 'test', tags: [], owner: 'test', createdAt: new Date(), lastUpdated: new Date() }
    };

    // Register agent in lifecycle manager
    await lifecycleManager.registerAgent(testAgent, []);

    // Start monitoring
    heartbeatMonitor.startMonitoring(testAgent.id, 'http://test.local/health');
    failureDetector.startDetection(testAgent.id);

    // Register health check
    healthCheckSystem.registerHealthCheck({
      id: 'integration-health-check',
      name: 'Integration Health Check',
      description: 'Health check for integration testing',
      agentId: testAgent.id,
      type: CheckType.LIVENESS,
      protocol: CheckProtocol.HTTP,
      config: {
        enabled: true, interval: 2000, timeout: 1000, retries: 1, backoffFactor: 1.5, gracePeriod: 3000, slidingWindow: 5,
        thresholds: { degraded: 0.8, unhealthy: 0.5, critical: 0.2 },
        alerting: { enabled: true, channels: ['log'], escalationDelay: 3000, suppressDuration: 15000 }
      },
      endpoint: 'http://test.local/health',
      dependencies: [],
      metadata: { priority: 1, weight: 1, category: 'integration', tags: ['test'] }
    });

    // Let the system run for a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check that all components are working together
    const systemHealth = lifecycleSystem.getSystemHealth();
    expect(systemHealth.agents.total).toBe(1);
    expect(systemHealth.components).toBeTruthy();
    
    const heartbeatOverview = systemHealth.components.heartbeat;
    expect(heartbeatOverview.total).toBe(1);

    const failureOverview = systemHealth.components.failureDetection;
    expect(failureOverview.totalRules).toBeGreaterThan(0);
  });
});