# OSSA Service Registry

The OSSA Service Registry provides service discovery, registration, and health monitoring capabilities for distributed agent systems. It enables services to register themselves, discover other services, and monitor health status across the ecosystem.

## Features

- **Service Registration**: Register services with capabilities, metadata, and health status
- **Service Discovery**: Find services by name, capability, health status, tags, or environment
- **Health Monitoring**: Automatic health checks with configurable intervals and thresholds
- **Redis Persistence**: Redis-based storage for scalability and persistence
- **REST API**: Complete REST API for service management
- **Event-Driven**: Real-time events for service state changes
- **Statistics & Analytics**: Registry-wide statistics and insights
- **TTL Support**: Automatic cleanup of stale services
- **TypeScript First**: Full TypeScript support with strict typing

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OSSA Service Registry                        │
├─────────────────────────────────────────────────────────────────┤
│  REST API Layer                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Registration│ │ Discovery   │ │ Health      │              │
│  │ Endpoints   │ │ Endpoints   │ │ Endpoints   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  Service Registry Core                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Service     │ │ Health      │ │ Discovery   │              │
│  │ Management  │ │ Monitoring  │ │ Engine      │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  Storage & Events                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Redis       │ │ Event       │ │ Statistics  │              │
│  │ Persistence │ │ Emitter     │ │ Engine      │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```typescript
import ServiceRegistry, { 
  ServiceHealthStatus,
  DEFAULT_SERVICE_REGISTRY_CONFIG 
} from '@ossa/specification/services/ServiceRegistry.js';
import { SimpleRedisClient } from '@ossa/specification/api/registry.js';

// Create registry
const redisClient = new SimpleRedisClient();
const registry = new ServiceRegistry(DEFAULT_SERVICE_REGISTRY_CONFIG, redisClient);

// Register a service
const service = await registry.register({
  name: 'ai-text-processor',
  endpoint: 'https://ai-service.company.com:8080',
  version: '2.1.0',
  capabilities: [
    {
      name: 'text-analysis',
      version: '2.0.0',
      description: 'Advanced text analysis with sentiment detection'
    }
  ],
  health: {
    status: ServiceHealthStatus.UNKNOWN,
    lastCheck: new Date()
  },
  metadata: {
    tags: ['ai', 'nlp'],
    environment: 'production'
  }
});

// Discover services
const aiServices = await registry.discover({ 
  capability: 'text-analysis' 
});

// Start health monitoring
await registry.startHealthMonitoring();
```

### REST API Server

```typescript
import express from 'express';
import createRegistryApiRouter from '@ossa/specification/api/registry.js';

const app = express();
app.use(express.json());
app.use('/api/v1/registry', createRegistryApiRouter(registry));

app.listen(3002, () => {
  console.log('Registry API running on port 3002');
});
```

## API Reference

### Core Classes

#### ServiceRegistry

The main service registry class that manages service registration, discovery, and health monitoring.

**Constructor**
```typescript
new ServiceRegistry(config: ServiceRegistryConfig, redisClient: RedisClient)
```

**Methods**

- `register(service)` - Register a new service
- `discover(filter)` - Discover services with optional filtering
- `health(serviceName)` - Get health status of a specific service
- `unregister(serviceName)` - Remove a service from registry
- `updateService(serviceName, updates)` - Update service registration
- `startHealthMonitoring()` - Start automatic health monitoring
- `stopHealthMonitoring()` - Stop health monitoring
- `getStats()` - Get registry statistics
- `cleanup()` - Remove expired services
- `close()` - Close registry and cleanup resources

### Types

#### ServiceDefinition

```typescript
interface ServiceDefinition {
  name: string;                    // Unique service name
  endpoint: string;               // Service endpoint URL
  capabilities: ServiceCapability[]; // Service capabilities
  version: string;                // Service version
  health: ServiceHealth;          // Current health status
  metadata?: ServiceMetadata;     // Optional metadata
  registeredAt: Date;             // Registration timestamp
  updatedAt: Date;               // Last update timestamp
}
```

#### ServiceCapability

```typescript
interface ServiceCapability {
  name: string;                   // Capability name
  version: string;                // Capability version
  inputs?: Record<string, any>;   // Input schema
  outputs?: Record<string, any>;  // Output schema
  description?: string;           // Description
}
```

#### ServiceHealth

```typescript
interface ServiceHealth {
  status: ServiceHealthStatus;    // Current status
  lastCheck: Date;               // Last check timestamp
  responseTime?: number;         // Response time in ms
  details?: Record<string, any>; // Additional details
  error?: string;               // Error message if unhealthy
}
```

#### ServiceHealthStatus

```typescript
enum ServiceHealthStatus {
  HEALTHY = 'healthy',           // Service operating normally
  UNHEALTHY = 'unhealthy',       // Service not responding
  DEGRADED = 'degraded',         // Performance issues
  UNKNOWN = 'unknown',           // Status not determined
  MAINTENANCE = 'maintenance'    // Temporary maintenance
}
```

## REST API Endpoints

### Service Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/services` | Register new service |
| GET    | `/services` | Discover services (with filtering) |
| GET    | `/services/{name}` | Get specific service |
| PUT    | `/services/{name}` | Update service |
| DELETE | `/services/{name}` | Unregister service |

### Health Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/services/{name}/health` | Get service health |
| GET    | `/health` | Get registry health |

### Registry Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/stats` | Get detailed statistics |
| GET    | `/capabilities` | List all capabilities |
| POST   | `/cleanup` | Trigger cleanup |

### Query Parameters

**Service Discovery (`GET /services`)**
- `name` - Filter by name pattern (regex)
- `capability` - Filter by capability name
- `health` - Filter by health status
- `tags` - Filter by tags (comma-separated)
- `version` - Filter by version
- `environment` - Filter by environment

**Examples:**
```bash
# Get all services
GET /api/v1/registry/services

# Get AI services
GET /api/v1/registry/services?tags=ai,nlp

# Get services with specific capability
GET /api/v1/registry/services?capability=text-processing

# Get healthy production services
GET /api/v1/registry/services?health=healthy&environment=production
```

## Configuration

### ServiceRegistryConfig

```typescript
interface ServiceRegistryConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  healthCheck: {
    intervalMs: number;        // Health check interval
    timeoutMs: number;         // Health check timeout
    failureThreshold: number;  // Failed checks before unhealthy
    successThreshold: number;  // Successful checks before healthy
  };
  serviceTtlSeconds: number;   // Service TTL
}
```

### Default Configuration

```typescript
const DEFAULT_SERVICE_REGISTRY_CONFIG = {
  redis: {
    host: 'localhost',
    port: 6379,
    keyPrefix: 'ossa:services'
  },
  healthCheck: {
    intervalMs: 30000,     // 30 seconds
    timeoutMs: 5000,       // 5 seconds
    failureThreshold: 3,
    successThreshold: 2
  },
  serviceTtlSeconds: 300   // 5 minutes
};
```

## Events

The service registry emits events for real-time monitoring:

```typescript
registry.on('service:registered', (service: ServiceDefinition) => {
  console.log(`Service registered: ${service.name}`);
});

registry.on('service:updated', (service: ServiceDefinition) => {
  console.log(`Service updated: ${service.name}`);
});

registry.on('service:unregistered', (serviceName: string) => {
  console.log(`Service unregistered: ${serviceName}`);
});

registry.on('service:health:changed', (serviceName: string, oldStatus: ServiceHealthStatus, newStatus: ServiceHealthStatus) => {
  console.log(`Health changed: ${serviceName} ${oldStatus} → ${newStatus}`);
});

registry.on('registry:error', (error: Error) => {
  console.error(`Registry error: ${error.message}`);
});
```

## Health Monitoring

The registry automatically monitors service health by making HTTP requests to `{service.endpoint}/health`.

### Health Check Process

1. **Periodic Checks**: Services are checked at configured intervals
2. **Success Threshold**: Service marked healthy after N successful checks
3. **Failure Threshold**: Service marked unhealthy after N failed checks
4. **Timeout Handling**: Requests timeout after configured duration
5. **Status Transitions**: Events emitted when health status changes

### Health Endpoint Requirements

Services should implement a `/health` endpoint that:
- Returns HTTP 200 for healthy status
- Returns 4xx/5xx for unhealthy status
- Responds within the configured timeout

Example health endpoint:
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
```

## Redis Integration

The registry uses Redis for persistent storage with the following key patterns:

- Service data: `ossa:services:{serviceName}`
- Service metadata: Stored as JSON strings
- TTL: Automatic expiration based on configuration

### Redis Client Interface

```typescript
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  // ... other Redis operations
}
```

For production, use a proper Redis client like `ioredis` or `node-redis`. The `SimpleRedisClient` is provided for development and testing.

## Statistics & Analytics

Get comprehensive registry statistics:

```typescript
const stats = await registry.getStats();
// {
//   totalServices: 15,
//   healthyServices: 12,
//   unhealthyServices: 2,
//   degradedServices: 1,
//   uniqueCapabilities: 8,
//   averageCapabilitiesPerService: 1.67
// }
```

## Testing

### Unit Tests

Run the comprehensive test suite:

```bash
npm test
npm run test:coverage
```

### Test Structure

- `tests/services/ServiceRegistry.test.ts` - Core registry functionality
- `tests/api/registry.test.ts` - REST API endpoints
- Uses `SimpleRedisClient` for in-memory testing
- Mocks external dependencies (HTTP requests)

## Examples

See `examples/service-registry-usage.ts` for comprehensive usage examples:

- Basic registration and discovery
- REST API server setup
- Health monitoring with events
- Capability-based discovery
- Production configuration

## Production Considerations

### Scaling

1. **Redis Clustering**: Use Redis cluster for high availability
2. **Load Balancing**: Deploy multiple registry instances behind load balancer
3. **Health Check Tuning**: Adjust intervals based on service count
4. **Monitoring**: Monitor registry performance and Redis metrics

### Security

1. **Authentication**: Implement API authentication (JWT, API keys)
2. **Authorization**: Role-based access control for registry operations
3. **Network Security**: Use TLS for Redis and API connections
4. **Input Validation**: Validate all service registration data

### Monitoring

1. **Metrics**: Export Prometheus metrics for monitoring
2. **Logging**: Structured logging with correlation IDs
3. **Alerting**: Set up alerts for registry health and service failures
4. **Dashboards**: Create Grafana dashboards for visualization

## OpenAPI Specification

The complete OpenAPI specification is available at:
`src/api/service-registry.openapi.yml`

This includes:
- Full API documentation
- Request/response schemas
- Example requests and responses
- Error handling specifications

## Contributing

When contributing to the service registry:

1. Follow TypeScript strict mode requirements
2. Add comprehensive tests for new features
3. Update OpenAPI specification for API changes
4. Include JSDoc comments for public methods
5. Follow existing error handling patterns
6. Add examples for new functionality

## License

MIT License - see LICENSE file for details.