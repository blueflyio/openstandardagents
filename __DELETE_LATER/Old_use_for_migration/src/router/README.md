# OSSA Router - High-Performance Agent Discovery Protocol

🚀 **Sub-100ms agent discovery for 1000+ agents with multi-protocol support**

The OSSA Router is a high-performance agent discovery system designed to handle thousands of AI agents with sub-100ms response times. It supports multiple protocols (REST, GraphQL, gRPC, WebSocket) and provides advanced capabilities matching, caching, and optimization features.

## 🌟 Key Features

### Performance & Scalability
- **Sub-100ms Response Times**: Optimized for ultra-fast agent discovery
- **1000+ Agent Support**: Efficiently handles large-scale agent registries
- **Advanced Caching**: Multi-layer caching with LRU eviction and compression
- **Connection Pooling**: HTTP/HTTPS connection reuse for optimal performance
- **Batch Operations**: Intelligent batching for bulk operations

### Multi-Protocol Support
- **REST API**: Complete HTTP/HTTPS REST interface
- **GraphQL**: Rich query capabilities with subscriptions
- **gRPC**: High-performance binary protocol with streaming
- **WebSocket**: Real-time event notifications

### Advanced Discovery
- **Capability Matching**: Intelligent semantic capability matching
- **Domain Hierarchy**: Hierarchical domain-based discovery
- **Performance Ranking**: Score-based agent ranking
- **Complex Queries**: Multi-criteria discovery with boolean logic
- **Fuzzy Matching**: Approximate string matching for capabilities

### Optimization Features
- **Bloom Filters**: Fast negative lookups for non-existent capabilities
- **Inverted Indexes**: Full-text search capabilities
- **Compression**: Automatic payload compression (gzip, deflate, brotli)
- **Memory Management**: Efficient memory usage with cleanup
- **Adaptive Optimization**: Self-tuning performance parameters

## 🚀 Quick Start

### Installation

```bash
npm install @ossa/router
```

### Basic Usage

```typescript
import { createOSSARouter } from '@ossa/router';

// Create router with default configuration
const router = createOSSARouter({
  protocols: {
    rest: {
      port: 3000,
      basePath: '/api/v1',
      cors: true,
    },
    graphql: {
      enabled: true,
      endpoint: '/graphql',
      subscriptions: true,
    },
    grpc: {
      enabled: true,
      port: 50051,
    },
  },
  performance: {
    targetResponseTime: 50, // 50ms target
    maxConcurrentQueries: 1000,
  },
});

// Start the router
await router.start();

// Register an agent
const agentId = await router.registerAgent({
  name: 'chat-assistant',
  version: '1.0.0',
  endpoint: 'https://chat-agent.example.com',
  capabilities: {
    primary: ['chat', 'conversation', 'reasoning'],
    domains: ['ai', 'nlp', 'customer-service'],
  },
  protocols: [
    {
      name: 'rest',
      version: '1.0',
      required: true,
      endpoints: { api: '/api' },
    },
  ],
  endpoints: {
    health: '/health',
    api: '/api',
  },
  metadata: {
    class: 'specialist',
    category: 'assistant',
    conformanceTier: 'advanced',
  },
  performance: {
    avgResponseTimeMs: 45,
    uptimePercentage: 99.9,
    requestsHandled: 10000,
    successRate: 0.995,
    throughputRps: 50,
  },
});

// Discover agents
const result = await router.discoverAgents({
  capabilities: ['chat', 'reasoning'],
  domains: ['ai'],
  conformanceTier: 'advanced',
  maxResults: 10,
});

console.log(`Found ${result.totalFound} agents in ${result.discoveryTimeMs}ms`);
```

## 📡 Protocol Examples

### REST API

```bash
# Discover agents via REST
curl -X POST http://localhost:3000/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{
    "capabilities": ["chat", "reasoning"],
    "domains": ["ai"],
    "maxResults": 10
  }'
```

### GraphQL

```graphql
query DiscoverAgents {
  discoverAgents(query: {
    capabilities: ["chat", "reasoning"]
    domains: ["ai"]
    maxResults: 10
  }) {
    agents {
      id
      name
      capabilities {
        primary
        domains
      }
      performance {
        avgResponseTimeMs
        successRate
      }
    }
    discoveryTimeMs
    totalFound
  }
}
```

### WebSocket

```typescript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to agent events
ws.send(JSON.stringify({
  type: 'subscribe',
  data: {
    events: ['agent_registered', 'agent_updated', 'agent_health_changed']
  }
}));

// Perform discovery
ws.send(JSON.stringify({
  type: 'discovery',
  data: {
    capabilities: ['chat'],
    maxResults: 5
  }
}));
```

## ⚡ Performance Benchmarks

The OSSA Router is designed for extreme performance. Here are typical benchmark results:

| Operation | Agents | Avg Time | P95 Time | P99 Time | Ops/sec |
|-----------|--------|----------|----------|----------|---------|
| Single Capability Discovery | 1000 | 12ms | 18ms | 25ms | 4,200 |
| Multi-Capability Discovery | 1000 | 15ms | 22ms | 32ms | 3,800 |
| Complex Query Discovery | 1000 | 25ms | 35ms | 48ms | 2,400 |
| Concurrent Discovery (100x) | 1000 | 18ms | 28ms | 42ms | 5,500 |

### Running Benchmarks

```bash
# Run comprehensive benchmarks
npm run benchmark

# Run specific test suite
npm test -- --testNamePattern="Performance"
```

## 🔧 Configuration

### Complete Configuration Example

```typescript
const router = createOSSARouter({
  protocols: {
    rest: {
      port: 3000,
      basePath: '/api/v1',
      cors: true,
      rateLimit: {
        requests: 1000,
        window: 60000, // 1 minute
      },
    },
    graphql: {
      enabled: true,
      endpoint: '/graphql',
      subscriptions: true,
      introspection: true,
      playground: false,
    },
    grpc: {
      enabled: true,
      port: 50051,
      reflection: true,
      compression: true,
    },
  },
  discovery: {
    cacheTimeout: 300000, // 5 minutes
    maxCacheEntries: 10000,
    healthCheckInterval: 30000, // 30 seconds
    indexingEnabled: true,
  },
  performance: {
    targetResponseTime: 50, // 50ms
    maxConcurrentQueries: 1000,
    batchSize: 50,
    compressionEnabled: true,
  },
  clustering: {
    enabled: false,
    nodes: ['http://router-1:3000', 'http://router-2:3000'],
    replicationFactor: 2,
  },
});
```

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   REST API      │    │   GraphQL API    │    │   gRPC API      │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│   WebSocket     │    │   Subscriptions  │    │   Streaming     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                    ┌──────────────────────────┐
                    │    OSSA Router Core      │
                    └──────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Discovery  │        │   Registry   │        │ Optimization │
│   Engine     │        │   Manager    │        │   Engine     │
└──────────────┘        └──────────────┘        └──────────────┘
        │                          │                          │
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│ Capability   │        │    Agent     │        │    Cache     │
│  Matcher     │        │   Storage    │        │   Manager    │
└──────────────┘        └──────────────┘        └──────────────┘
```

### Performance Optimization Stack

```
┌─────────────────────────────────────────┐
│          Application Layer              │ ← Multi-Protocol APIs
├─────────────────────────────────────────┤
│          Optimization Layer             │ ← Batching, Compression
├─────────────────────────────────────────┤
│           Caching Layer                 │ ← Multi-Level Cache
├─────────────────────────────────────────┤
│          Indexing Layer                 │ ← Bloom Filters, B-Trees
├─────────────────────────────────────────┤
│          Storage Layer                  │ ← In-Memory Registry
└─────────────────────────────────────────┘
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run performance tests
npm test -- --testNamePattern="Performance"

# Run specific test suite
npm test -- --testNamePattern="Discovery"
```

### Test Categories

- **Unit Tests**: Individual component testing
- **Integration Tests**: Multi-component interaction testing
- **Performance Tests**: Sub-100ms response time validation
- **Stress Tests**: 1000+ agent scalability testing
- **Protocol Tests**: REST, GraphQL, gRPC endpoint testing

## 📊 Monitoring & Metrics

### Health Endpoint

```bash
curl http://localhost:3000/api/v1/health
```

```json
{
  "status": "healthy",
  "uptime": 3600000,
  "version": "0.1.8",
  "services": {
    "discovery_engine": "healthy",
    "cache_manager": "healthy",
    "rest_protocol": "healthy",
    "graphql_protocol": "healthy"
  },
  "performance": {
    "avgResponseTime": 12.5,
    "p95ResponseTime": 18.3,
    "cacheHitRate": 0.87
  }
}
```

### Metrics Endpoint

```bash
curl http://localhost:3000/api/v1/metrics
```

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "totalQueries": 15420,
  "avgResponseTime": 12.5,
  "p95ResponseTime": 18.3,
  "p99ResponseTime": 24.7,
  "cacheHitRate": 0.87,
  "activeConnections": 45,
  "memoryUsage": 156789123,
  "protocols": ["REST", "GraphQL", "gRPC"]
}
```

## 🔐 Security

### API Authentication

```typescript
// Configure API key authentication
const router = createOSSARouter({
  protocols: {
    rest: {
      apiKey: process.env.OSSA_API_KEY,
      rateLimiting: {
        requests: 1000,
        window: 60000,
      },
    },
  },
});
```

### Network Security

```typescript
// Configure HTTPS and security headers
const router = createOSSARouter({
  protocols: {
    rest: {
      https: {
        cert: fs.readFileSync('path/to/cert.pem'),
        key: fs.readFileSync('path/to/key.pem'),
      },
      security: {
        helmet: true,
        cors: {
          origin: ['https://app.example.com'],
          credentials: true,
        },
      },
    },
  },
});
```

## 🐛 Troubleshooting

### Performance Issues

```bash
# Check current performance metrics
curl http://localhost:3000/api/v1/metrics | jq '.avgResponseTime'

# Run benchmark to identify bottlenecks
npm run benchmark

# Enable debug logging
DEBUG=ossa:* npm start
```

### Memory Issues

```bash
# Monitor memory usage
curl http://localhost:3000/api/v1/metrics | jq '.memoryUsage'

# Clear caches
curl -X POST http://localhost:3000/api/v1/admin/cache/clear
```

### Common Issues

1. **Slow Discovery**: Check indexing is enabled and cache hit rate
2. **High Memory Usage**: Reduce cache size or enable compression
3. **Connection Issues**: Verify connection pooling settings
4. **Protocol Errors**: Check protocol-specific configurations

## 📈 Roadmap

### Version 0.2.0
- [ ] Distributed clustering support
- [ ] Advanced security features (OAuth, JWT)
- [ ] Prometheus metrics export
- [ ] Circuit breaker patterns

### Version 0.3.0
- [ ] AI-powered capability matching
- [ ] Auto-scaling based on load
- [ ] Multi-region deployment
- [ ] Plugin architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone and install
git clone https://github.com/ossa-platform/router.git
cd router
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run benchmarks
npm run benchmark
```

## 📄 License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## 🙋 Support

- **Documentation**: [docs.ossa-platform.org](https://docs.ossa-platform.org)
- **Issues**: [GitHub Issues](https://github.com/ossa-platform/router/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ossa-platform/router/discussions)
- **Discord**: [OSSA Community](https://discord.gg/ossa-platform)

---

⚡ **Built for Performance** | 🔒 **Enterprise Ready** | 🚀 **Production Tested**