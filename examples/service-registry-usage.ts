/**
 * OSSA Service Registry Usage Example
 * Demonstrates how to use the service registry for service discovery and management
 */

import ServiceRegistry, {
  ServiceDefinition,
  ServiceHealthStatus,
  ServiceCapability,
  DEFAULT_SERVICE_REGISTRY_CONFIG,
} from '../src/services/ServiceRegistry.js';
import createRegistryApiRouter, {
  SimpleRedisClient,
} from '../src/api/registry.js';
import express from 'express';

/**
 * Example: Basic Service Registry Usage
 */
async function basicRegistryExample() {
  console.log('=== Basic Service Registry Example ===');

  // Create a Redis client (using simple in-memory client for demo)
  const redisClient = new SimpleRedisClient();

  // Create service registry with custom configuration
  const config = {
    ...DEFAULT_SERVICE_REGISTRY_CONFIG,
    healthCheck: {
      intervalMs: 15000, // Check every 15 seconds
      timeoutMs: 3000, // 3 second timeout
      failureThreshold: 3,
      successThreshold: 2,
    },
    serviceTtlSeconds: 600, // 10 minute TTL
  };

  const registry = new ServiceRegistry(config, redisClient);

  // Register a service
  const aiService: Omit<ServiceDefinition, 'registeredAt' | 'updatedAt'> = {
    name: 'ai-text-processor',
    endpoint: 'https://ai-service.company.com:8080',
    version: '2.1.0',
    capabilities: [
      {
        name: 'text-analysis',
        version: '2.0.0',
        description: 'Advanced text analysis with sentiment detection',
        inputs: {
          text: {
            type: 'string',
            description: 'Text to analyze',
          },
          options: {
            type: 'object',
            description: 'Analysis options',
          },
        },
        outputs: {
          sentiment: {
            type: 'object',
            description: 'Sentiment analysis results',
          },
          entities: {
            type: 'array',
            description: 'Detected entities',
          },
        },
      },
      {
        name: 'text-translation',
        version: '1.5.0',
        description: 'Multi-language text translation',
      },
    ],
    health: {
      status: ServiceHealthStatus.UNKNOWN,
      lastCheck: new Date(),
    },
    metadata: {
      description: 'High-performance AI text processing service',
      tags: ['ai', 'nlp', 'text-processing', 'production'],
      author: 'AI Engineering Team',
      documentation: 'https://docs.company.com/ai-text-processor',
      environment: 'production',
    },
  };

  console.log('Registering AI service...');
  const registeredService = await registry.register(aiService);
  console.log(
    `✓ Registered: ${registeredService.name} at ${registeredService.endpoint}`
  );

  // Register another service
  const dataService: Omit<ServiceDefinition, 'registeredAt' | 'updatedAt'> = {
    name: 'data-processor',
    endpoint: 'https://data-service.company.com:9090',
    version: '3.0.1',
    capabilities: [
      {
        name: 'data-transformation',
        version: '3.0.0',
        description: 'ETL data transformation pipeline',
      },
      {
        name: 'data-validation',
        version: '2.1.0',
        description: 'Data quality validation and cleansing',
      },
    ],
    health: {
      status: ServiceHealthStatus.HEALTHY,
      lastCheck: new Date(),
      responseTime: 150,
    },
    metadata: {
      description: 'Enterprise data processing pipeline',
      tags: ['data', 'etl', 'processing', 'production'],
      author: 'Data Engineering Team',
      environment: 'production',
    },
  };

  console.log('Registering Data service...');
  await registry.register(dataService);
  console.log(`✓ Registered: ${dataService.name} at ${dataService.endpoint}`);

  // Discover all services
  console.log('\n--- Service Discovery ---');
  const allServices = await registry.discover();
  console.log(`Found ${allServices.length} services:`);
  allServices.forEach((service) => {
    console.log(
      `  - ${service.name} v${service.version} (${service.health.status})`
    );
    console.log(
      `    Capabilities: ${service.capabilities.map((c) => c.name).join(', ')}`
    );
  });

  // Discover services by capability
  console.log('\n--- Discover by Capability ---');
  const textServices = await registry.discover({ capability: 'text-analysis' });
  console.log(`Services with text-analysis capability: ${textServices.length}`);
  textServices.forEach((service) => {
    console.log(`  - ${service.name}: ${service.endpoint}`);
  });

  // Discover services by tags
  console.log('\n--- Discover by Tags ---');
  const aiServices = await registry.discover({ tags: ['ai', 'nlp'] });
  console.log(`Services with AI/NLP tags: ${aiServices.length}`);
  aiServices.forEach((service) => {
    console.log(`  - ${service.name}: ${service.metadata?.tags?.join(', ')}`);
  });

  // Get registry statistics
  console.log('\n--- Registry Statistics ---');
  const stats = await registry.getStats();
  console.log(`Total Services: ${stats.totalServices}`);
  console.log(
    `Healthy: ${stats.healthyServices}, Unhealthy: ${stats.unhealthyServices}`
  );
  console.log(
    `Degraded: ${stats.degradedServices}, Unknown: ${stats.unknownServices}`
  );

  // Update a service
  console.log('\n--- Service Update ---');
  const updatedService = await registry.updateService('ai-text-processor', {
    version: '2.1.1',
    metadata: {
      ...aiService.metadata,
      description: 'Updated AI text processing service with bug fixes',
    },
  });
  console.log(
    `✓ Updated ${updatedService?.name} to version ${updatedService?.version}`
  );

  // Clean up
  await registry.close();
  console.log('\n✓ Registry closed');
}

/**
 * Example: REST API Server with Service Registry
 */
async function apiServerExample() {
  console.log('\n=== REST API Server Example ===');

  const redisClient = new SimpleRedisClient();
  const registry = new ServiceRegistry(
    DEFAULT_SERVICE_REGISTRY_CONFIG,
    redisClient
  );

  // Create Express app
  const app = express();
  app.use(express.json());

  // Add registry API routes
  app.use('/api/v1/registry', createRegistryApiRouter(registry));

  // Add a simple health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ossa-registry-api',
    });
  });

  // Start server
  const port = process.env.PORT || 3002;
  const server = app.listen(port, () => {
    console.log(`✓ Registry API server running on port ${port}`);
    console.log(`  - Health: http://localhost:${port}/health`);
    console.log(
      `  - Registry API: http://localhost:${port}/api/v1/registry/services`
    );
    console.log(
      `  - OpenAPI spec available in: src/api/service-registry.openapi.yml`
    );
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    server.close();
    await registry.close();
    console.log('✓ Server shut down gracefully');
    process.exit(0);
  });

  return { app, server, registry };
}

/**
 * Example: Health Monitoring with Events
 */
async function healthMonitoringExample() {
  console.log('\n=== Health Monitoring Example ===');

  const redisClient = new SimpleRedisClient();
  const config = {
    ...DEFAULT_SERVICE_REGISTRY_CONFIG,
    healthCheck: {
      intervalMs: 5000, // Fast for demo
      timeoutMs: 1000,
      failureThreshold: 2,
      successThreshold: 1,
    },
  };

  const registry = new ServiceRegistry(config, redisClient);

  // Set up event listeners
  registry.on('service:registered', (service) => {
    console.log(`🎯 Service registered: ${service.name}`);
  });

  registry.on('service:health:changed', (serviceName, oldStatus, newStatus) => {
    console.log(
      `🏥 Health changed: ${serviceName} ${oldStatus} → ${newStatus}`
    );
  });

  registry.on('service:unregistered', (serviceName) => {
    console.log(`👋 Service unregistered: ${serviceName}`);
  });

  registry.on('registry:error', (error) => {
    console.error(`❌ Registry error: ${error.message}`);
  });

  // Register a test service
  await registry.register({
    name: 'test-health-service',
    endpoint: 'https://test.example.com',
    version: '1.0.0',
    capabilities: [
      {
        name: 'test-capability',
        version: '1.0.0',
        description: 'Test capability',
      },
    ],
    health: {
      status: ServiceHealthStatus.UNKNOWN,
      lastCheck: new Date(),
    },
    metadata: {
      description: 'Test service for health monitoring',
      tags: ['test'],
      environment: 'development',
    },
  });

  // Start health monitoring
  console.log('Starting health monitoring...');
  await registry.startHealthMonitoring();

  // Simulate running for a while then cleanup
  setTimeout(async () => {
    console.log('Stopping health monitoring...');
    registry.stopHealthMonitoring();
    await registry.unregister('test-health-service');
    await registry.close();
    console.log('✓ Health monitoring example completed');
  }, 15000);
}

/**
 * Example: Service Capability Discovery
 */
async function capabilityDiscoveryExample() {
  console.log('\n=== Capability Discovery Example ===');

  const redisClient = new SimpleRedisClient();
  const registry = new ServiceRegistry(
    DEFAULT_SERVICE_REGISTRY_CONFIG,
    redisClient
  );

  // Register services with various capabilities
  const services = [
    {
      name: 'nlp-service-a',
      capabilities: ['text-analysis', 'sentiment-detection'],
      tags: ['ai', 'nlp'],
    },
    {
      name: 'nlp-service-b',
      capabilities: ['text-analysis', 'entity-extraction'],
      tags: ['ai', 'nlp'],
    },
    {
      name: 'vision-service',
      capabilities: ['image-recognition', 'object-detection'],
      tags: ['ai', 'vision'],
    },
    {
      name: 'data-service',
      capabilities: ['data-transformation', 'data-validation'],
      tags: ['data', 'etl'],
    },
  ];

  for (const serviceInfo of services) {
    await registry.register({
      name: serviceInfo.name,
      endpoint: `https://${serviceInfo.name}.example.com`,
      version: '1.0.0',
      capabilities: serviceInfo.capabilities.map((cap) => ({
        name: cap,
        version: '1.0.0',
        description: `${cap} capability`,
      })),
      health: {
        status: ServiceHealthStatus.HEALTHY,
        lastCheck: new Date(),
      },
      metadata: {
        tags: serviceInfo.tags,
        environment: 'production',
      },
    });
  }

  // Discover services by different criteria
  console.log('Services with text-analysis capability:');
  const textServices = await registry.discover({ capability: 'text-analysis' });
  textServices.forEach((s) => console.log(`  - ${s.name}`));

  console.log('\nServices with AI tag:');
  const aiServices = await registry.discover({ tags: ['ai'] });
  aiServices.forEach((s) =>
    console.log(`  - ${s.name}: ${s.metadata?.tags?.join(', ')}`)
  );

  console.log('\nHealthy production services:');
  const healthyServices = await registry.discover({
    healthStatus: ServiceHealthStatus.HEALTHY,
    environment: 'production',
  });
  healthyServices.forEach((s) =>
    console.log(`  - ${s.name} (${s.capabilities.length} capabilities)`)
  );

  await registry.close();
  console.log('✓ Capability discovery example completed');
}

// Run examples
async function runExamples() {
  try {
    await basicRegistryExample();
    await capabilityDiscoveryExample();

    // Uncomment to run health monitoring example (runs for 15 seconds)
    // await healthMonitoringExample();

    // Uncomment to start the API server (runs until Ctrl+C)
    // await apiServerExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}

export {
  basicRegistryExample,
  apiServerExample,
  healthMonitoringExample,
  capabilityDiscoveryExample,
};
