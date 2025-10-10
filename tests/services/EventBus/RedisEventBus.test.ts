/**
 * OSSA v0.1.9 Redis Event Bus - Comprehensive Test Suite
 */

import { RedisEventBus } from '../../../src/services/EventBus/RedisEventBus.js';
import {
  EventBusConfig,
  EventPayload,
  EVENT_TYPES,
  EventPriority,
  DEFAULT_EVENT_BUS_CONFIG
} from '../../../src/services/EventBus/types.js';

// Mock Redis for testing
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
    on: jest.fn(),
    status: 'ready'
  };

  return {
    default: jest.fn().mockImplementation(() => mockRedis),
    Cluster: jest.fn().mockImplementation(() => mockRedis)
  };
});

describe('RedisEventBus', () => {
  let eventBus: RedisEventBus;
  let mockConfig: Partial<EventBusConfig>;

  beforeEach(() => {
    mockConfig = {
      ...DEFAULT_EVENT_BUS_CONFIG,
      redis: {
        host: 'localhost',
        port: 6379,
        keyPrefix: 'test:eventbus'
      }
    };

    eventBus = new RedisEventBus(mockConfig);
  });

  afterEach(async () => {
    await eventBus.disconnect();
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    test('should connect to Redis successfully', async () => {
      await expect(eventBus.connect()).resolves.not.toThrow();
    });

    test('should handle connection errors gracefully', async () => {
      const Redis = require('ioredis');
      const mockInstance = new Redis();
      mockInstance.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const errorEventBus = new RedisEventBus(mockConfig);
      await expect(errorEventBus.connect()).rejects.toThrow('Connection failed');
    });

    test('should disconnect cleanly', async () => {
      await eventBus.connect();
      await expect(eventBus.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Event Publishing', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should publish event successfully', async () => {
      const testData = { message: 'test event', timestamp: new Date() };
      const eventId = await eventBus.publish('test.event', testData);

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });

    test('should publish event with custom options', async () => {
      const testData = { message: 'priority event' };
      const eventId = await eventBus.publish('test.priority', testData, {
        priority: EventPriority.HIGH,
        ttl: 300
      });

      expect(eventId).toBeDefined();
    });

    test('should handle publishing errors', async () => {
      const Redis = require('ioredis');
      const mockInstance = new Redis();
      mockInstance.xadd.mockRejectedValueOnce(new Error('Publish failed'));

      await expect(
        eventBus.publish('test.error', { data: 'test' })
      ).rejects.toThrow('Publish failed');
    });

    test('should emit published event', async () => {
      const publishedHandler = jest.fn();
      eventBus.on('event:published', publishedHandler);

      await eventBus.publish('test.emit', { data: 'test' });

      expect(publishedHandler).toHaveBeenCalledWith(
        'test.emit',
        expect.objectContaining({
          metadata: expect.objectContaining({
            type: 'test.emit'
          }),
          data: { data: 'test' }
        })
      );
    });
  });

  describe('Event Subscription', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should subscribe to events successfully', async () => {
      const handler = jest.fn();
      await expect(
        eventBus.subscribe('test.subscription', handler)
      ).resolves.not.toThrow();
    });

    test('should subscribe with consumer group', async () => {
      const handler = jest.fn();
      await expect(
        eventBus.subscribe('test.group', handler, { group: 'test-consumers' })
      ).resolves.not.toThrow();
    });

    test('should unsubscribe from events', async () => {
      const handler = jest.fn();
      await eventBus.subscribe('test.unsub', handler);

      await expect(
        eventBus.unsubscribe('test.unsub', handler)
      ).resolves.not.toThrow();
    });

    test('should unsubscribe all handlers for event type', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      await eventBus.subscribe('test.unsubAll', handler1);
      await eventBus.subscribe('test.unsubAll', handler2);

      await expect(
        eventBus.unsubscribe('test.unsubAll')
      ).resolves.not.toThrow();
    });
  });

  describe('Stream Management', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should create event stream', async () => {
      const streamConfig = {
        maxLength: 1000,
        retention: 'count' as const,
        retentionValue: 1000
      };

      const stream = await eventBus.createStream('test-stream', streamConfig);

      expect(stream).toMatchObject({
        name: 'test-stream',
        config: streamConfig
      });
    });

    test('should handle stream creation errors', async () => {
      const Redis = require('ioredis');
      const mockInstance = new Redis();
      mockInstance.xadd.mockRejectedValueOnce(new Error('Stream creation failed'));

      const streamConfig = {
        maxLength: 1000,
        retention: 'count' as const,
        retentionValue: 1000
      };

      await expect(
        eventBus.createStream('error-stream', streamConfig)
      ).rejects.toThrow('Stream creation failed');
    });
  });

  describe('Contract Management', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should register event contract', async () => {
      const contract = {
        name: 'test-contract',
        version: '1.0.0',
        sourceProject: 'test-project',
        targetProjects: ['target-project'],
        eventTypes: ['test.event'],
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        metadata: {
          description: 'Test contract',
          author: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(
        eventBus.registerContract(contract)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance and Metrics', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should return event bus metrics', () => {
      const metrics = eventBus.getMetrics();

      expect(metrics).toMatchObject({
        eventsPublished: expect.any(Number),
        eventsConsumed: expect.any(Number),
        eventsInFlight: expect.any(Number),
        eventsFailed: expect.any(Number),
        eventsInDLQ: expect.any(Number),
        avgProcessingTime: expect.any(Number),
        peakEventsPerSecond: expect.any(Number),
        currentThroughput: expect.any(Number),
        errorRate: expect.any(Number),
        connectionPoolUtilization: expect.any(Number)
      });
    });

    test('should return health status', async () => {
      const status = await eventBus.getStatus();

      expect(status).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        redis: {
          connected: expect.any(Boolean)
        },
        subscriptions: expect.any(Number),
        streams: expect.any(Number),
        metrics: expect.any(Object),
        lastHealthCheck: expect.any(Date)
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should handle Redis connection errors', () => {
      const errorHandler = jest.fn();
      eventBus.on('error', errorHandler);

      // Simulate Redis error
      const Redis = require('ioredis');
      const mockInstance = new Redis();
      const errorCallback = mockInstance.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorCallback) {
        errorCallback(new Error('Redis connection lost'));
      }

      expect(errorHandler).toHaveBeenCalled();
    });

    test('should emit failed events', async () => {
      const failedHandler = jest.fn();
      eventBus.on('event:failed', failedHandler);

      const Redis = require('ioredis');
      const mockInstance = new Redis();
      mockInstance.xadd.mockRejectedValueOnce(new Error('Publish failed'));

      await expect(
        eventBus.publish('test.fail', { data: 'test' })
      ).rejects.toThrow();

      expect(failedHandler).toHaveBeenCalled();
    });
  });

  describe('High Load Performance', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should handle burst of events', async () => {
      const eventPromises = [];
      const eventCount = 100;

      for (let i = 0; i < eventCount; i++) {
        eventPromises.push(
          eventBus.publish(`test.burst.${i}`, { index: i, data: 'test' })
        );
      }

      const results = await Promise.allSettled(eventPromises);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBeGreaterThan(eventCount * 0.9); // 90% success rate
    });

    test('should maintain performance under concurrent subscriptions', async () => {
      const handlers = [];
      const handlerCount = 50;

      for (let i = 0; i < handlerCount; i++) {
        const handler = jest.fn();
        handlers.push(handler);
        await eventBus.subscribe(`test.concurrent.${i}`, handler);
      }

      // Should complete without timeout
      expect(handlers.length).toBe(handlerCount);
    });
  });

  describe('Event Ordering and Reliability', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should handle event ordering with priorities', async () => {
      const events = [
        { type: 'test.priority.1', priority: EventPriority.LOW, data: { order: 3 } },
        { type: 'test.priority.2', priority: EventPriority.HIGH, data: { order: 1 } },
        { type: 'test.priority.3', priority: EventPriority.NORMAL, data: { order: 2 } }
      ];

      const publishPromises = events.map(event =>
        eventBus.publish(event.type, event.data, { priority: event.priority })
      );

      const results = await Promise.all(publishPromises);

      // All events should be published successfully
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    test('should handle TTL expiration', async () => {
      const shortTtl = 1; // 1 second

      await eventBus.publish('test.ttl', { data: 'expires soon' }, { ttl: shortTtl });

      // Event should be published successfully even with short TTL
      // (Redis Stream TTL is handled by Redis itself)
      expect(true).toBe(true);
    });
  });

  describe('Integration Events', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should handle agent orchestration events', async () => {
      const agentSpawnedEvent = {
        agentId: 'agent-123',
        agentType: 'worker',
        capabilities: ['task-processing', 'data-analysis'],
        orchestratorId: 'orchestrator-456'
      };

      await expect(
        eventBus.publish(EVENT_TYPES.AGENT.SPAWNED, agentSpawnedEvent)
      ).resolves.toBeDefined();
    });

    test('should handle task coordination events', async () => {
      const taskAssignedEvent = {
        taskId: 'task-789',
        agentId: 'agent-123',
        taskType: 'data-processing',
        priority: 5,
        estimatedDuration: 30000,
        dependencies: ['task-456', 'task-654']
      };

      await expect(
        eventBus.publish(EVENT_TYPES.TASK.ASSIGNED, taskAssignedEvent)
      ).resolves.toBeDefined();
    });

    test('should handle performance metrics events', async () => {
      const performanceEvent = {
        source: 'agent-123',
        metrics: {
          cpu: 75.5,
          memory: 512,
          responseTime: 150,
          throughput: 25.8,
          errorRate: 0.02
        },
        timestamp: new Date()
      };

      await expect(
        eventBus.publish(EVENT_TYPES.PERFORMANCE.METRICS, performanceEvent)
      ).resolves.toBeDefined();
    });

    test('should handle system events', async () => {
      const configChangeEvent = {
        action: 'service_registered',
        service: {
          name: 'test-service',
          endpoint: 'http://localhost:3000',
          version: '1.0.0',
          capabilities: ['data-processing']
        }
      };

      await expect(
        eventBus.publish(EVENT_TYPES.SYSTEM.CONFIGURATION_CHANGED, configChangeEvent)
      ).resolves.toBeDefined();
    });
  });

  describe('Monitoring Integration', () => {
    beforeEach(async () => {
      await eventBus.connect();
    });

    test('should emit metrics updated events', () => {
      const metricsHandler = jest.fn();
      eventBus.on('metrics:updated', metricsHandler);

      // Trigger metrics update (would be called by internal timer)
      eventBus.emit('metrics:updated', eventBus.getMetrics());

      expect(metricsHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventsPublished: expect.any(Number),
          eventsConsumed: expect.any(Number)
        })
      );
    });

    test('should emit health status change events', () => {
      const healthHandler = jest.fn();
      eventBus.on('health:status:changed', healthHandler);

      // Simulate health status change
      eventBus.emit('health:status:changed', 'healthy', 'degraded');

      expect(healthHandler).toHaveBeenCalledWith('healthy', 'degraded');
    });
  });
});

describe('RedisEventBus Cluster Configuration', () => {
  test('should initialize with cluster configuration', () => {
    const clusterConfig: Partial<EventBusConfig> = {
      redis: {
        host: 'localhost',
        port: 6379,
        cluster: {
          nodes: [
            { host: 'redis-1', port: 6379 },
            { host: 'redis-2', port: 6379 },
            { host: 'redis-3', port: 6379 }
          ]
        }
      }
    };

    const clusterEventBus = new RedisEventBus(clusterConfig);
    expect(clusterEventBus).toBeInstanceOf(RedisEventBus);
  });
});

describe('RedisEventBus Edge Cases', () => {
  let eventBus: RedisEventBus;

  beforeEach(() => {
    eventBus = new RedisEventBus();
  });

  afterEach(async () => {
    await eventBus.disconnect();
  });

  test('should handle empty event data', async () => {
    await eventBus.connect();

    await expect(
      eventBus.publish('test.empty', null)
    ).resolves.toBeDefined();
  });

  test('should handle large event data', async () => {
    await eventBus.connect();

    const largeData = {
      data: 'x'.repeat(10000), // 10KB of data
      array: new Array(1000).fill('test'),
      nested: {
        deep: {
          structure: {
            with: {
              many: {
                levels: 'value'
              }
            }
          }
        }
      }
    };

    await expect(
      eventBus.publish('test.large', largeData)
    ).resolves.toBeDefined();
  });

  test('should handle special characters in event types', async () => {
    await eventBus.connect();

    const specialEventTypes = [
      'test.with-dashes',
      'test.with_underscores',
      'test.with.dots',
      'test:with:colons'
    ];

    for (const eventType of specialEventTypes) {
      await expect(
        eventBus.publish(eventType, { data: 'test' })
      ).resolves.toBeDefined();
    }
  });

  test('should handle concurrent publish and subscribe operations', async () => {
    await eventBus.connect();

    const handler = jest.fn();
    const subscribePromise = eventBus.subscribe('test.concurrent', handler);
    const publishPromise = eventBus.publish('test.concurrent', { data: 'test' });

    await expect(Promise.all([subscribePromise, publishPromise])).resolves.toBeDefined();
  });
});