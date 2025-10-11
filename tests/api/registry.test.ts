/**
 * Registry API Unit Tests
 * Comprehensive test suite for the OSSA Service Registry REST API
 */

import request from 'supertest';
import express from 'express';
import createRegistryApiRouter, {
  SimpleRedisClient,
  ApiError,
  RegisterServiceRequest,
  UpdateServiceRequest
} from '../../src/api/registry.js';
import ServiceRegistry, {
  ServiceHealthStatus,
  ServiceRegistryConfig,
  DEFAULT_SERVICE_REGISTRY_CONFIG
} from '../../src/services/ServiceRegistry.js';

describe('Registry API', () => {
  let app: express.Application;
  let serviceRegistry: ServiceRegistry;
  let redisClient: SimpleRedisClient;

  beforeEach(() => {
    // Setup test environment
    redisClient = new SimpleRedisClient();
    const config: ServiceRegistryConfig = {
      ...DEFAULT_SERVICE_REGISTRY_CONFIG,
      healthCheck: {
        intervalMs: 1000,
        timeoutMs: 500,
        failureThreshold: 2,
        successThreshold: 1
      },
      serviceTtlSeconds: 30
    };

    serviceRegistry = new ServiceRegistry(config, redisClient);
    
    // Create Express app with registry router
    app = express();
    app.use(express.json());
    app.use('/api/v1/registry', createRegistryApiRouter(serviceRegistry));
    
    // Global error handler for testing
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({ success: false, error: { message: err.message } });
    });
  });

  afterEach(async () => {
    serviceRegistry.stopHealthMonitoring();
    await serviceRegistry.close();
  });

  describe('POST /services', () => {
    it('should register a new service successfully', async () => {
      const serviceData: RegisterServiceRequest = {
        name: 'test-api-service',
        endpoint: 'https://test-api.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'api-processing',
          version: '1.0.0',
          description: 'Test API processing capability'
        }],
        metadata: {
          description: 'Test API service',
          tags: ['api', 'test'],
          author: 'Test Team',
          environment: 'test'
        }
      };

      const response = await request(app)
        .post('/api/v1/registry/services')
        .send(serviceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test-api-service');
      expect(response.body.data.registeredAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
      expect(response.body.meta.version).toBe('0.1.9');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        endpoint: 'https://test.example.com',
        capabilities: []
      };

      const response = await request(app)
        .post('/api/v1/registry/services')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
      expect(response.body.error.message).toContain('name, endpoint, and version are required');
    });

    it('should return 400 for invalid capabilities', async () => {
      const invalidData = {
        name: 'test-service',
        endpoint: 'https://test.example.com',
        version: '1.0.0',
        capabilities: 'not-an-array'
      };

      const response = await request(app)
        .post('/api/v1/registry/services')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Capabilities must be an array');
    });
  });

  describe('GET /services', () => {
    beforeEach(async () => {
      // Register test services
      await serviceRegistry.register({
        name: 'ai-service',
        endpoint: 'https://ai.example.com',
        version: '1.2.0',
        capabilities: [{
          name: 'text-processing',
          version: '1.0.0',
          description: 'AI text processing'
        }],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        },
        metadata: {
          tags: ['ai', 'nlp'],
          environment: 'production'
        }
      });

      await serviceRegistry.register({
        name: 'data-service',
        endpoint: 'https://data.example.com',
        version: '2.1.0',
        capabilities: [{
          name: 'data-processing',
          version: '2.0.0',
          description: 'Data transformation'
        }],
        health: {
          status: ServiceHealthStatus.UNHEALTHY,
          lastCheck: new Date()
        },
        metadata: {
          tags: ['data', 'etl'],
          environment: 'production'
        }
      });
    });

    it('should return all services when no filters applied', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.services).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
    });

    it('should filter services by name pattern', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services?name=ai-.*')
        .expect(200);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].name).toBe('ai-service');
    });

    it('should filter services by capability', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services?capability=text-processing')
        .expect(200);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].name).toBe('ai-service');
    });

    it('should filter services by health status', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services?health=healthy')
        .expect(200);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].health.status).toBe(ServiceHealthStatus.HEALTHY);
    });

    it('should filter services by tags', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services?tags=ai,nlp')
        .expect(200);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].metadata.tags).toContain('ai');
    });

    it('should filter services by version', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services?version=1.2.0')
        .expect(200);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].version).toBe('1.2.0');
    });

    it('should filter services by environment', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services?environment=production')
        .expect(200);

      expect(response.body.data.services).toHaveLength(2);
    });
  });

  describe('GET /services/:serviceName', () => {
    beforeEach(async () => {
      await serviceRegistry.register({
        name: 'specific-service',
        endpoint: 'https://specific.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'specific-capability',
          version: '1.0.0',
          description: 'Specific capability'
        }],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        }
      });
    });

    it('should return specific service details', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services/specific-service')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('specific-service');
      expect(response.body.data.endpoint).toBe('https://specific.example.com');
    });

    it('should return 404 for non-existent service', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services/non-existent-service')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('PUT /services/:serviceName', () => {
    beforeEach(async () => {
      await serviceRegistry.register({
        name: 'update-service',
        endpoint: 'https://update.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'update-capability',
          version: '1.0.0',
          description: 'Update capability'
        }],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        }
      });
    });

    it('should update service successfully', async () => {
      const updates: UpdateServiceRequest = {
        version: '2.0.0',
        endpoint: 'https://updated.example.com',
        metadata: {
          description: 'Updated service',
          tags: ['updated']
        }
      };

      const response = await request(app)
        .put('/api/v1/registry/services/update-service')
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe('2.0.0');
      expect(response.body.data.endpoint).toBe('https://updated.example.com');
      expect(response.body.data.metadata.description).toBe('Updated service');
    });

    it('should return 404 for non-existent service update', async () => {
      const updates: UpdateServiceRequest = {
        version: '2.0.0'
      };

      const response = await request(app)
        .put('/api/v1/registry/services/non-existent-service')
        .send(updates)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('DELETE /services/:serviceName', () => {
    beforeEach(async () => {
      await serviceRegistry.register({
        name: 'delete-service',
        endpoint: 'https://delete.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'delete-capability',
          version: '1.0.0',
          description: 'Delete capability'
        }],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        }
      });
    });

    it('should unregister service successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/registry/services/delete-service')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('delete-service');

      // Verify service is actually removed
      const getResponse = await request(app)
        .get('/api/v1/registry/services/delete-service')
        .expect(404);
    });

    it('should return 404 for non-existent service deletion', async () => {
      const response = await request(app)
        .delete('/api/v1/registry/services/non-existent-service')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('GET /services/:serviceName/health', () => {
    beforeEach(async () => {
      await serviceRegistry.register({
        name: 'health-service',
        endpoint: 'https://health.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'health-capability',
          version: '1.0.0',
          description: 'Health capability'
        }],
        health: {
          status: ServiceHealthStatus.DEGRADED,
          lastCheck: new Date(),
          responseTime: 250,
          error: 'Slow response time'
        }
      });
    });

    it('should return service health status', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services/health-service/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ServiceHealthStatus.DEGRADED);
      expect(response.body.data.responseTime).toBe(250);
      expect(response.body.data.error).toBe('Slow response time');
    });

    it('should return 404 for non-existent service health', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services/non-existent-service/health')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('GET /health', () => {
    beforeEach(async () => {
      await serviceRegistry.register({
        name: 'healthy-service',
        endpoint: 'https://healthy.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'healthy-capability',
          version: '1.0.0',
          description: 'Healthy capability'
        }],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        }
      });

      await serviceRegistry.register({
        name: 'unhealthy-service',
        endpoint: 'https://unhealthy.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'unhealthy-capability',
          version: '1.0.0',
          description: 'Unhealthy capability'
        }],
        health: {
          status: ServiceHealthStatus.UNHEALTHY,
          lastCheck: new Date()
        }
      });
    });

    it('should return registry health status', async () => {
      const response = await request(app)
        .get('/api/v1/registry/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('degraded'); // Has unhealthy services
      expect(response.body.data.statistics.totalServices).toBe(2);
      expect(response.body.data.statistics.healthyServices).toBe(1);
      expect(response.body.data.statistics.unhealthyServices).toBe(1);
    });
  });

  describe('POST /cleanup', () => {
    it('should cleanup expired services', async () => {
      const response = await request(app)
        .post('/api/v1/registry/cleanup')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Cleanup completed');
      expect(typeof response.body.data.servicesRemoved).toBe('number');
    });
  });

  describe('GET /stats', () => {
    beforeEach(async () => {
      await serviceRegistry.register({
        name: 'stats-service-1',
        endpoint: 'https://stats1.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'stats-capability',
          version: '1.0.0',
          description: 'Stats capability'
        }],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        },
        metadata: {
          tags: ['stats', 'test']
        }
      });

      await serviceRegistry.register({
        name: 'stats-service-2',
        endpoint: 'https://stats2.example.com',
        version: '2.0.0',
        capabilities: [
          {
            name: 'stats-capability',
            version: '2.0.0',
            description: 'Advanced stats capability'
          },
          {
            name: 'analytics-capability',
            version: '1.0.0',
            description: 'Analytics capability'
          }
        ],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        },
        metadata: {
          tags: ['stats', 'analytics']
        }
      });
    });

    it('should return detailed registry statistics', async () => {
      const response = await request(app)
        .get('/api/v1/registry/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalServices).toBe(2);
      expect(response.body.data.uniqueCapabilities).toBe(2);
      expect(response.body.data.totalCapabilities).toBe(3);
      expect(response.body.data.uniqueVersions).toBe(2);
      expect(response.body.data.uniqueTags).toBe(3); // stats, test, analytics
      expect(response.body.data.averageCapabilitiesPerService).toBe(1.5);
    });
  });

  describe('GET /capabilities', () => {
    beforeEach(async () => {
      await serviceRegistry.register({
        name: 'cap-service-1',
        endpoint: 'https://cap1.example.com',
        version: '1.0.0',
        capabilities: [{
          name: 'shared-capability',
          version: '1.0.0',
          description: 'Shared capability v1'
        }],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        }
      });

      await serviceRegistry.register({
        name: 'cap-service-2',
        endpoint: 'https://cap2.example.com',
        version: '1.0.0',
        capabilities: [
          {
            name: 'shared-capability',
            version: '2.0.0',
            description: 'Shared capability v2'
          },
          {
            name: 'unique-capability',
            version: '1.0.0',
            description: 'Unique capability'
          }
        ],
        health: {
          status: ServiceHealthStatus.HEALTHY,
          lastCheck: new Date()
        }
      });
    });

    it('should return all available capabilities', async () => {
      const response = await request(app)
        .get('/api/v1/registry/capabilities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.capabilities).toHaveLength(2);
      expect(response.body.data.totalCapabilities).toBe(2);

      const sharedCap = response.body.data.capabilities.find(
        (cap: any) => cap.name === 'shared-capability'
      );
      expect(sharedCap).toBeDefined();
      expect(sharedCap.versions).toHaveLength(2);
      expect(sharedCap.services).toContain('cap-service-1');
      expect(sharedCap.services).toContain('cap-service-2');
      expect(sharedCap.serviceCount).toBe(2);

      const uniqueCap = response.body.data.capabilities.find(
        (cap: any) => cap.name === 'unique-capability'
      );
      expect(uniqueCap).toBeDefined();
      expect(uniqueCap.serviceCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle registry errors gracefully', async () => {
      // Create a registry that will throw errors
      const errorRegistry = new ServiceRegistry(
        DEFAULT_SERVICE_REGISTRY_CONFIG,
        {
          ...redisClient,
          get: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
        }
      );

      const errorApp = express();
      errorApp.use(express.json());
      errorApp.use('/api/v1/registry', createRegistryApiRouter(errorRegistry));

      const response = await request(errorApp)
        .get('/api/v1/registry/services')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Redis connection failed');

      await errorRegistry.close();
    });

    it('should format API responses consistently', async () => {
      const response = await request(app)
        .get('/api/v1/registry/services')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
      expect(response.body.meta.version).toBe('0.1.9');
      expect(response.body.data).toBeDefined();
    });
  });

  describe('ApiError class', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError(404, 'NOT_FOUND', 'Resource not found', { id: '123' });
      
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.details).toEqual({ id: '123' });
      expect(error.name).toBe('ApiError');
    });
  });

  describe('SimpleRedisClient', () => {
    let client: SimpleRedisClient;

    beforeEach(() => {
      client = new SimpleRedisClient();
    });

    afterEach(async () => {
      await client.quit();
    });

    it('should store and retrieve values', async () => {
      await client.set('test-key', 'test-value');
      const value = await client.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should handle TTL expiry', async () => {
      await client.set('ttl-key', 'ttl-value', 1); // 1 second TTL
      
      // Should exist initially
      const exists = await client.exists('ttl-key');
      expect(exists).toBe(1);
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const expiredValue = await client.get('ttl-key');
      expect(expiredValue).toBeNull();
    });

    it('should match key patterns', async () => {
      await client.set('prefix:key1', 'value1');
      await client.set('prefix:key2', 'value2');
      await client.set('other:key3', 'value3');
      
      const keys = await client.keys('prefix:.*');
      expect(keys).toHaveLength(2);
      expect(keys).toContain('prefix:key1');
      expect(keys).toContain('prefix:key2');
    });

    it('should handle hash operations', async () => {
      await client.hset('hash:key', 'field1', 'value1');
      await client.hset('hash:key', 'field2', 'value2');
      
      const hash = await client.hgetall('hash:key');
      expect(hash).toEqual({
        field1: 'value1',
        field2: 'value2'
      });
      
      const deleted = await client.hdel('hash:key', 'field1');
      expect(deleted).toBe(1);
      
      const updatedHash = await client.hgetall('hash:key');
      expect(updatedHash).toEqual({ field2: 'value2' });
    });

    it('should respond to ping', async () => {
      const response = await client.ping();
      expect(response).toBe('PONG');
    });
  });
});