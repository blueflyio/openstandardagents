/**
 * ServiceRegistry Unit Tests
 * Comprehensive test suite for the OSSA Service Registry
 */

import ServiceRegistry, {
  ServiceDefinition,
  ServiceHealthStatus,
  ServiceCapability,
  ServiceDiscoveryFilter,
  ServiceRegistryConfig,
  RedisClient,
  DEFAULT_SERVICE_REGISTRY_CONFIG
} from '../../src/services/ServiceRegistry.js';
import { SimpleRedisClient } from '../../src/api/registry.js';

describe('ServiceRegistry', () => {
  let serviceRegistry: ServiceRegistry;
  let redisClient: RedisClient;
  let config: ServiceRegistryConfig;

  beforeEach(() => {
    // Use in-memory Redis client for testing
    redisClient = new SimpleRedisClient();
    config = {
      ...DEFAULT_SERVICE_REGISTRY_CONFIG,
      healthCheck: {
        intervalMs: 100, // Faster for testing
        timeoutMs: 1000,
        failureThreshold: 2,
        successThreshold: 1
      },
      serviceTtlSeconds: 10 // Shorter TTL for testing
    };
    serviceRegistry = new ServiceRegistry(config, redisClient);
  });

  afterEach(async () => {
    serviceRegistry.stopHealthMonitoring();
    await serviceRegistry.close();
  });

  describe('Service Registration', () => {
    it('should register a new service successfully', async () => {
      const serviceData = createTestService('test-service');
      const registeredService = await serviceRegistry.register(serviceData);

      expect(registeredService).toBeDefined();
      expect(registeredService.name).toBe('test-service');
      expect(registeredService.registeredAt).toBeInstanceOf(Date);
      expect(registeredService.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate required fields during registration', async () => {
      const invalidService: any = {
        endpoint: 'https://test.com',
        version: '1.0.0',
        capabilities: []
      };

      await expect(serviceRegistry.register(invalidService))
        .rejects
        .toThrow('Service name is required');
    });

    it('should validate endpoint URL format', async () => {
      const serviceData = createTestService('test-service');
      serviceData.endpoint = 'invalid-url';

      await expect(serviceRegistry.register(serviceData))
        .rejects
        .toThrow('Service endpoint must be a valid URL');
    });

    it('should validate capabilities array', async () => {
      const serviceData: any = createTestService('test-service');
      serviceData.capabilities = 'not-an-array';

      await expect(serviceRegistry.register(serviceData))
        .rejects
        .toThrow('Service capabilities must be an array');
    });

    it('should emit registration event', (done) => {
      const serviceData = createTestService('test-service');
      
      serviceRegistry.on('service:registered', (service) => {
        expect(service.name).toBe('test-service');
        done();
      });

      serviceRegistry.register(serviceData);
    });
  });

  describe('Service Discovery', () => {
    beforeEach(async () => {
      // Register test services
      await serviceRegistry.register(createTestService('ai-service', ['ai', 'nlp']));
      await serviceRegistry.register(createTestService('data-service', ['data', 'etl']));
      await serviceRegistry.register(createTestService('text-processor', ['ai', 'text']));
    });

    it('should discover all services when no filter is provided', async () => {
      const services = await serviceRegistry.discover();
      expect(services).toHaveLength(3);
    });

    it('should filter services by name pattern', async () => {
      const services = await serviceRegistry.discover({ namePattern: 'ai-.*' });
      expect(services).toHaveLength(1);
      expect(services[0].name).toBe('ai-service');
    });

    it('should filter services by capability', async () => {
      const services = await serviceRegistry.discover({ capability: 'text-processing' });
      expect(services).toHaveLength(2); // ai-service and text-processor
    });

    it('should filter services by health status', async () => {
      const services = await serviceRegistry.discover({ healthStatus: ServiceHealthStatus.UNKNOWN });
      expect(services).toHaveLength(3); // All start as unknown
    });

    it('should filter services by tags', async () => {
      const services = await serviceRegistry.discover({ tags: ['ai'] });
      expect(services).toHaveLength(2); // ai-service and text-processor
    });

    it('should filter services by version', async () => {
      const services = await serviceRegistry.discover({ version: '1.0.0' });
      expect(services).toHaveLength(3); // All test services have version 1.0.0
    });

    it('should combine multiple filters', async () => {
      const services = await serviceRegistry.discover({
        capability: 'text-processing',
        tags: ['ai']
      });
      expect(services).toHaveLength(2);
    });
  });

  describe('Service Health Management', () => {
    let testService: ServiceDefinition;

    beforeEach(async () => {
      const serviceData = createTestService('health-test-service');
      testService = await serviceRegistry.register(serviceData);
    });

    it('should retrieve service health', async () => {
      const health = await serviceRegistry.health('health-test-service');
      expect(health).toBeDefined();
      expect(health?.status).toBe(ServiceHealthStatus.UNKNOWN);
      expect(health?.lastCheck).toBeInstanceOf(Date);
    });

    it('should return null for non-existent service health', async () => {
      const health = await serviceRegistry.health('non-existent-service');
      expect(health).toBeNull();
    });

    it('should emit health change events', (done) => {
      serviceRegistry.on('service:health:changed', (serviceName, oldStatus, newStatus) => {
        expect(serviceName).toBe('health-test-service');
        expect(oldStatus).toBe(ServiceHealthStatus.UNKNOWN);
        expect(newStatus).toBe(ServiceHealthStatus.UNHEALTHY);
        done();
      });

      // Simulate health check failure
      testService.health.status = ServiceHealthStatus.UNHEALTHY;
      serviceRegistry.updateService('health-test-service', { health: testService.health });
    });
  });

  describe('Service Updates', () => {
    let testService: ServiceDefinition;

    beforeEach(async () => {
      const serviceData = createTestService('update-test-service');
      testService = await serviceRegistry.register(serviceData);
    });

    it('should update service successfully', async () => {
      const updates = {
        version: '2.0.0',
        endpoint: 'https://updated.test.com'
      };

      const updatedService = await serviceRegistry.updateService('update-test-service', updates);
      expect(updatedService).toBeDefined();
      expect(updatedService?.version).toBe('2.0.0');
      expect(updatedService?.endpoint).toBe('https://updated.test.com');
      expect(updatedService?.updatedAt).not.toEqual(testService.updatedAt);
    });

    it('should return null for non-existent service update', async () => {
      const updates = { version: '2.0.0' };
      const result = await serviceRegistry.updateService('non-existent-service', updates);
      expect(result).toBeNull();
    });

    it('should emit update event', (done) => {
      serviceRegistry.on('service:updated', (service) => {
        expect(service.name).toBe('update-test-service');
        expect(service.version).toBe('2.0.0');
        done();
      });

      serviceRegistry.updateService('update-test-service', { version: '2.0.0' });
    });
  });

  describe('Service Unregistration', () => {
    beforeEach(async () => {
      await serviceRegistry.register(createTestService('unregister-test-service'));
    });

    it('should unregister service successfully', async () => {
      const result = await serviceRegistry.unregister('unregister-test-service');
      expect(result).toBe(true);

      const services = await serviceRegistry.discover({ namePattern: 'unregister-test-service' });
      expect(services).toHaveLength(0);
    });

    it('should return false for non-existent service unregistration', async () => {
      const result = await serviceRegistry.unregister('non-existent-service');
      expect(result).toBe(false);
    });

    it('should emit unregistration event', (done) => {
      serviceRegistry.on('service:unregistered', (serviceName) => {
        expect(serviceName).toBe('unregister-test-service');
        done();
      });

      serviceRegistry.unregister('unregister-test-service');
    });
  });

  describe('Registry Statistics', () => {
    beforeEach(async () => {
      // Register services with different health statuses
      const service1 = await serviceRegistry.register(createTestService('healthy-service'));
      service1.health.status = ServiceHealthStatus.HEALTHY;
      await serviceRegistry.updateService('healthy-service', { health: service1.health });

      const service2 = await serviceRegistry.register(createTestService('unhealthy-service'));
      service2.health.status = ServiceHealthStatus.UNHEALTHY;
      await serviceRegistry.updateService('unhealthy-service', { health: service2.health });

      const service3 = await serviceRegistry.register(createTestService('degraded-service'));
      service3.health.status = ServiceHealthStatus.DEGRADED;
      await serviceRegistry.updateService('degraded-service', { health: service3.health });
    });

    it('should return accurate statistics', async () => {
      const stats = await serviceRegistry.getStats();
      
      expect(stats.totalServices).toBe(3);
      expect(stats.healthyServices).toBe(1);
      expect(stats.unhealthyServices).toBe(1);
      expect(stats.degradedServices).toBe(1);
    });
  });

  describe('Service Cleanup', () => {
    beforeEach(async () => {
      // Register services with different ages
      const oldService = await serviceRegistry.register(createTestService('old-service'));
      const newService = await serviceRegistry.register(createTestService('new-service'));

      // Manually set old timestamps to simulate aged services
      const pastDate = new Date(Date.now() - (config.serviceTtlSeconds + 1) * 1000);
      oldService.updatedAt = pastDate;
      await serviceRegistry.updateService('old-service', { updatedAt: pastDate });
    });

    it('should cleanup expired services', async () => {
      const cleanedCount = await serviceRegistry.cleanup();
      expect(cleanedCount).toBe(1);

      const services = await serviceRegistry.getAllServices();
      expect(services).toHaveLength(1);
      expect(services[0].name).toBe('new-service');
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(async () => {
      // Mock fetch for health checks
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should start and stop health monitoring', async () => {
      await serviceRegistry.register(createTestService('monitor-service'));
      
      await serviceRegistry.startHealthMonitoring();
      expect(serviceRegistry['isHealthMonitoringActive']).toBe(true);

      serviceRegistry.stopHealthMonitoring();
      expect(serviceRegistry['isHealthMonitoringActive']).toBe(false);
    });

    it('should perform health checks', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response);

      await serviceRegistry.register(createTestService('health-check-service'));
      await serviceRegistry.startHealthMonitoring();

      // Wait for health check to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/health',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });

  describe('Redis Persistence', () => {
    it('should persist service to Redis during registration', async () => {
      const serviceData = createTestService('redis-test-service');
      await serviceRegistry.register(serviceData);

      const key = 'ossa:services:redis-test-service';
      const storedData = await redisClient.get(key);
      expect(storedData).toBeTruthy();

      const parsedService = JSON.parse(storedData!);
      expect(parsedService.name).toBe('redis-test-service');
    });

    it('should load service from Redis when not in cache', async () => {
      const serviceData = createTestService('load-test-service');
      await serviceRegistry.register(serviceData);

      // Clear local cache
      serviceRegistry['services'].clear();

      // Should load from Redis
      const health = await serviceRegistry.health('load-test-service');
      expect(health).toBeTruthy();
      expect(serviceRegistry['services'].has('load-test-service')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      const errorRegistry = new ServiceRegistry(config, {
        ...redisClient,
        get: jest.fn().mockRejectedValue(new Error('Redis error'))
      });

      let errorEmitted = false;
      errorRegistry.on('registry:error', () => {
        errorEmitted = true;
      });

      await expect(errorRegistry.health('test-service')).rejects.toThrow('Redis error');
      expect(errorEmitted).toBe(true);

      await errorRegistry.close();
    });

    it('should emit errors for invalid operations', (done) => {
      serviceRegistry.on('registry:error', (error) => {
        expect(error).toBeInstanceOf(Error);
        done();
      });

      // Try to register invalid service
      serviceRegistry.register({} as any);
    });
  });

  describe('Event Handling', () => {
    it('should handle all event types correctly', (done) => {
      const events: string[] = [];
      
      serviceRegistry.on('service:registered', () => events.push('registered'));
      serviceRegistry.on('service:updated', () => events.push('updated'));
      serviceRegistry.on('service:unregistered', () => events.push('unregistered'));
      
      // Register, update, and unregister a service
      serviceRegistry.register(createTestService('event-test-service'))
        .then(() => serviceRegistry.updateService('event-test-service', { version: '2.0.0' }))
        .then(() => serviceRegistry.unregister('event-test-service'))
        .then(() => {
          expect(events).toContain('registered');
          expect(events).toContain('updated');
          expect(events).toContain('unregistered');
          done();
        })
        .catch(done);
    });
  });
});

// Helper function to create test service data
function createTestService(
  name: string, 
  tags: string[] = ['test'],
  capabilities: ServiceCapability[] = [
    {
      name: 'text-processing',
      version: '1.0.0',
      description: 'Test text processing capability'
    }
  ]
): Omit<ServiceDefinition, 'registeredAt' | 'updatedAt'> {
  return {
    name,
    endpoint: 'https://test.com',
    version: '1.0.0',
    capabilities,
    health: {
      status: ServiceHealthStatus.UNKNOWN,
      lastCheck: new Date()
    },
    metadata: {
      description: `Test service: ${name}`,
      tags,
      author: 'Test Suite',
      environment: 'test'
    }
  };
}