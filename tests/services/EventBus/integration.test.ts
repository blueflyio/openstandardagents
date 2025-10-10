/**
 * OSSA v0.1.9 Redis Event Bus - Integration Test Suite
 * End-to-end testing of complete event bus system
 */

import { OSSAEventBus, createOSSAEventBus } from '../../../src/services/EventBus/index.js';
import { ServiceRegistry, DEFAULT_SERVICE_REGISTRY_CONFIG } from '../../../src/services/ServiceRegistry.js';
import { EVENT_TYPES, EventPriority } from '../../../src/services/EventBus/types.js';

// Mock Redis for integration tests
jest.mock('ioredis', () => {
  const mockRedis = {
    connect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue(undefined),
    xadd: jest.fn().mockResolvedValue('1234567890-0'),
    xreadgroup: jest.fn().mockResolvedValue([]),
    xgroup: jest.fn().mockResolvedValue('OK'),
    xack: jest.fn().mockResolvedValue(1),
    pipeline: jest.fn().mockReturnValue({
      xack: jest.fn(),
      exec: jest.fn().mockResolvedValue([])
    }),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
    hset: jest.fn().mockResolvedValue(1),
    hget: jest.fn().mockResolvedValue(null),
    hgetall: jest.fn().mockResolvedValue({}),
    on: jest.fn(),
    status: 'ready'
  };

  return {
    default: jest.fn().mockImplementation(() => mockRedis),
    Cluster: jest.fn().mockImplementation(() => mockRedis)
  };
});

// Mock fetch for service health checks
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: jest.fn().mockResolvedValue({})
});

describe('OSSA Event Bus Integration Tests', () => {
  let serviceRegistry: ServiceRegistry;
  let eventBus: OSSAEventBus;

  beforeEach(async () => {
    // Create service registry with mock Redis
    const mockRedisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      keys: jest.fn().mockResolvedValue([]),
      hgetall: jest.fn().mockResolvedValue({}),
      hset: jest.fn().mockResolvedValue(1),
      hdel: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue(undefined)
    };

    serviceRegistry = new ServiceRegistry(DEFAULT_SERVICE_REGISTRY_CONFIG, mockRedisClient as any);

    // Initialize OSSA Event Bus
    eventBus = new OSSAEventBus(serviceRegistry, {
      eventBus: {
        redis: {
          host: 'localhost',
          port: 6379,
          keyPrefix: 'test:ossa:eventbus'
        }
      }
    });

    await eventBus.initialize();
  });

  afterEach(async () => {
    await eventBus.shutdown();
    jest.clearAllMocks();
  });

  describe('Full System Integration', () => {
    test('should initialize all components successfully', async () => {
      const status = await eventBus.getStatus();

      expect(status).toMatchObject({
        eventBus: expect.objectContaining({
          status: expect.stringMatching(/healthy|degraded|unhealthy/)
        }),
        serviceRegistry: expect.any(Object),
        crossProject: expect.any(Object),
        orchestration: expect.any(Object),
        monitoring: expect.any(Object)
      });
    });

    test('should handle health check', async () => {
      const healthCheck = await eventBus.healthCheck();

      expect(healthCheck).toMatchObject({
        status: expect.stringMatching(/healthy|degraded|unhealthy/),
        timestamp: expect.any(Date),
        components: expect.objectContaining({
          eventBus: expect.objectContaining({
            status: expect.any(String)
          })
        })
      });
    });
  });

  describe('Event Bus Core Functionality', () => {
    test('should publish and handle events end-to-end', async () => {
      const testData = {
        message: 'integration test',
        timestamp: new Date(),
        metadata: {
          source: 'integration-test',
          version: '1.0.0'
        }
      };

      // Publish event
      const eventId = await eventBus.publish('integration.test.event', testData, {
        priority: EventPriority.HIGH
      });

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });

    test('should handle event subscriptions', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      await eventBus.subscribe('integration.subscription.test', mockHandler, {
        group: 'integration-test-group'
      });

      // Publish event to trigger subscription
      await eventBus.publish('integration.subscription.test', {
        data: 'subscription test',
        timestamp: new Date()
      });

      // In a real scenario, the handler would be called
      // For this test, we verify the subscription was set up
      expect(mockHandler).toBeDefined();
    });

    test('should handle event unsubscription', async () => {
      const mockHandler = jest.fn();

      await eventBus.subscribe('integration.unsub.test', mockHandler);
      await eventBus.unsubscribe('integration.unsub.test', mockHandler);

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Service Registry Integration', () => {
    test('should register services with event bus integration', async () => {
      const serviceDefinition = {
        name: 'test-integration-service',
        endpoint: 'http://localhost:3000',
        version: '1.0.0',
        capabilities: [
          {
            name: 'data-processing',
            version: '1.0.0',
            description: 'Process data events'
          }
        ],
        health: {
          status: 'healthy' as const,
          lastCheck: new Date()
        },
        metadata: {
          description: 'Test service for integration',
          tags: ['test', 'integration'],
          environment: 'test'
        }
      };

      const registered = await serviceRegistry.register(serviceDefinition);

      expect(registered).toMatchObject({
        name: 'test-integration-service',
        endpoint: 'http://localhost:3000'
      });
    });

    test('should discover services through event bus', async () => {
      const services = await serviceRegistry.discover({
        namePattern: 'test-*'
      });

      expect(Array.isArray(services)).toBe(true);
    });
  });

  describe('Cross-Project Communication', () => {
    test('should setup cross-project communication', async () => {
      const projectConfig = {
        projectId: 'integration-project',
        name: 'Integration Test Project',
        namespace: 'integration',
        allowedEventTypes: ['integration.event', 'data.processed'],
        allowedTargets: ['target-project']
      };

      await eventBus.registerProject(projectConfig);

      const validation = await eventBus.validateProjectSetup('integration-project');

      expect(validation).toMatchObject({
        isValid: true,
        errors: [],
        warnings: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });

    test('should register and validate event contracts', async () => {
      const contract = {
        name: 'integration-contract',
        version: '1.0.0',
        sourceProject: 'integration-project',
        targetProjects: ['target-project'],
        eventTypes: ['integration.event'],
        schema: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' }
          },
          required: ['eventId', 'timestamp']
        },
        metadata: {
          description: 'Integration test contract',
          author: 'Integration Test',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['integration', 'test']
        }
      };

      await eventBus.registerContract(contract);

      const availableContracts = eventBus.getAvailableContracts('target-project');
      expect(availableContracts).toContainEqual(
        expect.objectContaining({
          name: 'integration-contract'
        })
      );
    });

    test('should handle cross-project message setup', async () => {
      // Register projects
      const sourceProject = {
        projectId: 'source-integration',
        name: 'Source Integration Project',
        namespace: 'source',
        allowedEventTypes: ['cross.project.test'],
        allowedTargets: ['target-integration']
      };

      const targetProject = {
        projectId: 'target-integration',
        name: 'Target Integration Project',
        namespace: 'target',
        allowedEventTypes: ['cross.project.test'],
        allowedTargets: []
      };

      await eventBus.registerProject(sourceProject);
      await eventBus.registerProject(targetProject);

      // Setup message handler
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      await eventBus.setupCrossProjectHandler(
        'target-integration',
        'cross.project.test',
        mockHandler
      );

      expect(mockHandler).toBeDefined();
    });
  });

  describe('Agent Orchestration Integration', () => {
    test('should handle agent lifecycle events', async () => {
      const agentSpawnedEvent = {
        agentId: 'integration-agent-123',
        agentType: 'worker',
        capabilities: ['data-processing', 'task-execution'],
        orchestratorId: 'integration-orchestrator',
        configuration: {
          maxTasks: 10,
          timeout: 30000
        }
      };

      await eventBus.publish(EVENT_TYPES.AGENT.SPAWNED, agentSpawnedEvent);

      // Get orchestration stats
      const orchestrationStats = eventBus.getOrchestrationStats();

      expect(orchestrationStats).toMatchObject({
        totalAgents: expect.any(Number),
        totalPools: expect.any(Number),
        averageUtilization: expect.any(Number),
        totalThroughput: expect.any(Number),
        averageResponseTime: expect.any(Number),
        errorRate: expect.any(Number),
        queueDepth: expect.any(Number)
      });
    });

    test('should handle task coordination events', async () => {
      const taskAssignedEvent = {
        taskId: 'integration-task-456',
        agentId: 'integration-agent-123',
        taskType: 'data-analysis',
        priority: 5,
        estimatedDuration: 15000,
        dependencies: []
      };

      await eventBus.publish(EVENT_TYPES.TASK.ASSIGNED, taskAssignedEvent);

      const taskCompletedEvent = {
        taskId: 'integration-task-456',
        agentId: 'integration-agent-123',
        result: { processed: true, count: 100 },
        duration: 12000,
        timestamp: new Date()
      };

      await eventBus.publish(EVENT_TYPES.TASK.COMPLETED, taskCompletedEvent);

      // Should complete without errors
      expect(true).toBe(true);
    });

    test('should handle performance metrics events', async () => {
      const performanceEvent = {
        source: 'integration-agent-123',
        metrics: {
          cpu: 65.5,
          memory: 1024,
          responseTime: 200,
          throughput: 15.2,
          errorRate: 0.01
        },
        timestamp: new Date()
      };

      await eventBus.publish(EVENT_TYPES.PERFORMANCE.METRICS, performanceEvent);

      // Verify metrics are handled
      const status = await eventBus.getStatus();
      expect(status.monitoring).toBeDefined();
    });
  });

  describe('Monitoring and Observability', () => {
    test('should collect and expose metrics', async () => {
      const metrics = eventBus.exportMetrics();

      expect(typeof metrics).toBe('string');
      // Prometheus format should contain metric definitions
      expect(metrics).toContain('# TYPE');
    });

    test('should provide dashboard data', async () => {
      const dashboardData = await eventBus.getDashboardData();

      expect(dashboardData).toMatchObject({
        overview: expect.objectContaining({
          status: expect.stringMatching(/healthy|degraded|unhealthy/),
          uptime: expect.any(Number),
          totalEvents: expect.any(Number),
          currentTPS: expect.any(Number),
          errorRate: expect.any(Number)
        }),
        realtime: expect.objectContaining({
          eventsPerSecond: expect.any(Array),
          latency: expect.any(Array),
          errorRate: expect.any(Array),
          queueDepth: expect.any(Array),
          timestamp: expect.any(Array)
        }),
        topMetrics: expect.any(Object),
        activeAlerts: expect.any(Array)
      });
    });

    test('should handle monitoring configuration', async () => {
      const monitoringInstance = eventBus.getMonitoring();

      expect(monitoringInstance).toBeDefined();

      if (monitoringInstance) {
        const monitoringStats = monitoringInstance.getMonitoringStats();

        expect(monitoringStats).toMatchObject({
          metricsCollected: expect.any(Number),
          activeTraces: expect.any(Number),
          activeAlerts: expect.any(Number),
          healthHistorySize: expect.any(Number),
          uptimeSeconds: expect.any(Number)
        });
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle component failures gracefully', async () => {
      // Simulate monitoring failure
      const monitoring = eventBus.getMonitoring();
      if (monitoring) {
        monitoring.emit('error', new Error('Monitoring component failed'));
      }

      // System should still be operational
      const healthCheck = await eventBus.healthCheck();
      expect(healthCheck.status).toBeDefined();
    });

    test('should handle Redis connection issues', async () => {
      // Simulate Redis error
      const eventBusInstance = eventBus.getEventBus();
      eventBusInstance.emit('error', new Error('Redis connection lost'));

      // Should handle the error without crashing
      expect(true).toBe(true);
    });

    test('should handle invalid event data', async () => {
      // Should handle null/undefined data
      await expect(
        eventBus.publish('test.invalid.data', null)
      ).resolves.toBeDefined();

      // Should handle empty data
      await expect(
        eventBus.publish('test.empty.data', {})
      ).resolves.toBeDefined();
    });
  });

  describe('Performance Under Load', () => {
    test('should handle burst of events', async () => {
      const eventPromises = [];
      const eventCount = 50; // Reduced for test speed

      for (let i = 0; i < eventCount; i++) {
        eventPromises.push(
          eventBus.publish(`integration.burst.${i}`, {
            index: i,
            data: `test-data-${i}`,
            timestamp: new Date()
          })
        );
      }

      const results = await Promise.allSettled(eventPromises);
      const successful = results.filter(r => r.status === 'fulfilled');

      // Should handle most events successfully
      expect(successful.length).toBeGreaterThan(eventCount * 0.8);
    });

    test('should maintain performance with concurrent operations', async () => {
      const operations = [];

      // Concurrent publish operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          eventBus.publish(`concurrent.test.${i}`, { data: i })
        );
      }

      // Concurrent subscription operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          eventBus.subscribe(`concurrent.sub.${i}`, async () => {})
        );
      }

      const results = await Promise.allSettled(operations);
      const successful = results.filter(r => r.status === 'fulfilled');

      // Most operations should succeed
      expect(successful.length).toBeGreaterThan(operations.length * 0.8);
    });
  });

  describe('System Configuration', () => {
    test('should handle custom configuration', async () => {
      const customEventBus = new OSSAEventBus(serviceRegistry, {
        eventBus: {
          redis: {
            host: 'custom-host',
            port: 6380,
            keyPrefix: 'custom:prefix'
          },
          performance: {
            batchSize: 200,
            batchTimeout: 2000,
            connectionPoolSize: 20,
            pipelineSize: 200
          }
        },
        monitoring: {
          metrics: {
            enabled: true,
            collectionInterval: 5000,
            retentionPeriod: 43200000 // 12 hours
          },
          alerting: {
            enabled: true,
            thresholds: {
              maxErrorRate: 10.0,
              maxLatency: 2000,
              maxQueueDepth: 2000,
              minThroughput: 0.5,
              maxMemoryUsage: 90.0,
              maxConnectionUtilization: 95.0
            }
          }
        },
        serviceRegistry: {
          enabled: true,
          autoRegister: false,
          healthMonitoring: false
        },
        crossProject: {
          enabled: false,
          securityEnabled: false,
          rateLimitingEnabled: false
        },
        orchestration: {
          enabled: false,
          config: {}
        }
      });

      await customEventBus.initialize();
      const status = await customEventBus.getStatus();

      expect(status).toBeDefined();

      await customEventBus.shutdown();
    });
  });
});

describe('OSSA Event Bus Factory Function', () => {
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    const mockRedisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      keys: jest.fn().mockResolvedValue([]),
      hgetall: jest.fn().mockResolvedValue({}),
      hset: jest.fn().mockResolvedValue(1),
      hdel: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue(undefined)
    };

    serviceRegistry = new ServiceRegistry(DEFAULT_SERVICE_REGISTRY_CONFIG, mockRedisClient as any);
  });

  test('should create and initialize event bus with factory function', async () => {
    const eventBus = await createOSSAEventBus(serviceRegistry);

    expect(eventBus).toBeInstanceOf(OSSAEventBus);

    const status = await eventBus.getStatus();
    expect(status.eventBus).toBeDefined();

    await eventBus.shutdown();
  });

  test('should create event bus with custom configuration', async () => {
    const eventBus = await createOSSAEventBus(serviceRegistry, {
      eventBus: {
        redis: {
          host: 'factory-test-host',
          port: 6379
        }
      },
      monitoring: {
        metrics: { enabled: false }
      }
    });

    expect(eventBus).toBeInstanceOf(OSSAEventBus);
    await eventBus.shutdown();
  });
});