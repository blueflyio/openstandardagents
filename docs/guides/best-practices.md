# Best Practices
## Production Deployment Guidelines for OAAS

> **Focus**: Battle-tested practices for deploying Universal Translator in production  
> **Based on**: Real-world experience with 402+ agents in production

---

## 🏗️ **Architecture Best Practices**

### **Project Organization**

```
your-project/
├── agents/                     # OAAS-native agents
│   ├── core/                  # Core business agents
│   ├── integrations/          # Third-party integrations
│   └── experimental/          # New agent testing
├── legacy/                    # Existing agents (unchanged)
│   ├── drupal-plugins/       # Existing Drupal agents
│   ├── mcp-tools/           # Existing MCP tools
│   └── langchain-tools/     # Existing LangChain tools
├── config/
│   ├── oaas.config.js       # OAAS configuration
│   ├── discovery.config.js   # Discovery settings
│   └── environments/        # Environment-specific configs
└── tests/
    ├── integration/         # Cross-format testing
    └── performance/         # Performance benchmarks
```

### **Configuration Management**

```javascript
// config/oaas.config.js - Production configuration
export default {
  production: {
    projectRoot: process.cwd(),
    runtimeTranslation: true,
    cacheEnabled: true,
    validationStrict: true,          // Strict validation in production
    discoveryPaths: [
      'agents/core',
      'agents/integrations',
      'legacy/drupal-plugins',
      'legacy/mcp-tools'
    ],
    excludePatterns: [
      'node_modules/**',
      'tests/**',
      '**/*.test.*',
      'agents/experimental/**'        // Exclude experimental in prod
    ],
    performance: {
      maxConcurrentDiscoveries: 10,
      discoveryTimeout: 30000,
      translationTimeout: 5000,
      cacheTimeout: 300000            // 5 minutes
    },
    monitoring: {
      enabled: true,
      metricsEndpoint: '/metrics',
      healthEndpoint: '/health'
    }
  },
  
  development: {
    projectRoot: process.cwd(),
    runtimeTranslation: true,
    cacheEnabled: true,
    validationStrict: false,         // Relaxed validation for dev
    debug: true,
    discoveryPaths: [
      'agents',
      'legacy',
      'experiments'                   // Include experiments in dev
    ]
  }
};
```

---

## ⚡ **Performance Optimization**

### **Caching Strategies**

```typescript
// Intelligent caching configuration
const service = new OAASService({
  projectRoot: process.cwd(),
  cacheEnabled: true,
  cacheStrategy: {
    // Discovery cache
    discovery: {
      enabled: true,
      ttl: 300000,                   // 5 minutes
      maxSize: 1000,                 // Max 1000 agents in cache
      persistToDisk: true            // Survive restarts
    },
    
    // Translation cache  
    translation: {
      enabled: true,
      ttl: 600000,                   // 10 minutes
      maxSize: 500,                  // Max 500 translations
      invalidateOnSourceChange: true  // Smart invalidation
    },
    
    // Execution cache (for idempotent operations)
    execution: {
      enabled: true,
      ttl: 60000,                    // 1 minute
      maxSize: 100,
      keyGenerator: (agentId, capability, input) => {
        // Custom cache key generation
        return `${agentId}:${capability}:${hash(input)}`;
      }
    }
  }
});
```

### **Batch Operations**

```typescript
// Efficient batch discovery
class OptimizedOAASService extends OAASService {
  async discoverAgentsBatch(batchSize: number = 50): Promise<DiscoveredAgent[]> {
    const discoveryPaths = this.config.discoveryPaths || ['.'];
    const batches = this.chunkArray(discoveryPaths, batchSize);
    
    const results = await Promise.all(
      batches.map(batch => this.discovery.discoverPathsBatch(batch))
    );
    
    return results.flat();
  }
  
  async executeCapabilitiesBatch(
    executions: Array<{agentId: string, capability: string, input: any}>
  ): Promise<any[]> {
    // Parallel execution with concurrency control
    const semaphore = new Semaphore(this.config.maxConcurrentExecutions || 10);
    
    return Promise.all(
      executions.map(async (exec) => {
        await semaphore.acquire();
        try {
          return await this.executeCapability(exec.agentId, exec.capability, exec.input);
        } finally {
          semaphore.release();
        }
      })
    );
  }
}
```

---

## 🛡️ **Security Best Practices**

### **Input Validation**

```typescript
// Comprehensive input validation
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

class SecureOAASService extends OAASService {
  private ajv = addFormats(new Ajv({ strict: false }));
  
  async executeCapability(
    agentId: string, 
    capabilityName: string, 
    input: any,
    options: ExecutionOptions = {}
  ): Promise<any> {
    // 1. Validate agent exists and is trusted
    const agent = await this.registry.getAgent(agentId);
    if (!agent) {
      throw new OAASSecurityError(`Agent ${agentId} not found`);
    }
    
    if (agent.metadata?.trusted !== true && !options.allowUntrusted) {
      throw new OAASSecurityError(`Agent ${agentId} is not trusted`);
    }
    
    // 2. Validate capability exists
    const capability = agent.capabilities.find(c => c.name === capabilityName);
    if (!capability) {
      throw new OAASSecurityError(`Capability ${capabilityName} not found`);
    }
    
    // 3. Validate input against schema
    if (capability.input_schema) {
      const validate = this.ajv.compile(capability.input_schema);
      if (!validate(input)) {
        throw new OAASValidationError(`Invalid input: ${validate.errors}`);
      }
    }
    
    // 4. Apply security constraints
    const secureOptions = {
      ...options,
      timeout: Math.min(options.timeout || 30000, 60000), // Max 60s
      memoryLimit: options.memoryLimit || '128MB',
      networkAccess: options.networkAccess || false,
      filesystemAccess: options.filesystemAccess || 'readonly'
    };
    
    return super.executeCapability(agentId, capabilityName, input, secureOptions);
  }
}
```

### **Sandboxing**

```typescript
// Execution sandboxing
interface SandboxOptions {
  timeout: number;
  memoryLimit: string;
  cpuLimit: number;
  networkAccess: boolean;
  filesystemAccess: 'none' | 'readonly' | 'restricted';
  allowedDomains?: string[];
  tempDirectory?: string;
}

class SandboxedRuntimeBridge extends RuntimeBridge {
  async executeCapability(
    agent: DiscoveredAgent,
    capability: AgentCapability,
    input: any,
    sandbox: SandboxOptions
  ): Promise<any> {
    // Create isolated execution environment
    const isolate = await this.createIsolate(sandbox);
    
    try {
      return await isolate.execute({
        agent,
        capability,
        input,
        constraints: sandbox
      });
    } finally {
      await isolate.cleanup();
    }
  }
  
  private async createIsolate(options: SandboxOptions): Promise<ExecutionIsolate> {
    // Implementation depends on your sandboxing solution
    // Options: Docker containers, VM2, Worker threads, etc.
    return new DockerExecutionIsolate(options);
  }
}
```

---

## 📊 **Monitoring & Observability**

### **Metrics Collection**

```typescript
// Comprehensive metrics collection
import { createPrometheusMetrics } from '@prometheus/client';

class MonitoredOAASService extends OAASService {
  private metrics = createPrometheusMetrics({
    // Discovery metrics
    discoveryDuration: new Histogram({
      name: 'oaas_discovery_duration_seconds',
      help: 'Time spent discovering agents',
      labelNames: ['format', 'status']
    }),
    
    discoveredAgents: new Gauge({
      name: 'oaas_discovered_agents_total',
      help: 'Total number of discovered agents',
      labelNames: ['format']
    }),
    
    // Translation metrics
    translationDuration: new Histogram({
      name: 'oaas_translation_duration_seconds',
      help: 'Time spent translating agents',
      labelNames: ['from_format', 'to_format', 'status']
    }),
    
    // Execution metrics
    executionDuration: new Histogram({
      name: 'oaas_execution_duration_seconds',
      help: 'Time spent executing capabilities',
      labelNames: ['agent_id', 'capability', 'status']
    }),
    
    executionErrors: new Counter({
      name: 'oaas_execution_errors_total',
      help: 'Total execution errors',
      labelNames: ['agent_id', 'capability', 'error_type']
    }),
    
    // Cache metrics
    cacheHits: new Counter({
      name: 'oaas_cache_hits_total',
      help: 'Cache hits',
      labelNames: ['cache_type']
    })
  });
  
  async discoverAgents(): Promise<DiscoveredAgent[]> {
    const timer = this.metrics.discoveryDuration.startTimer();
    
    try {
      const agents = await super.discoverAgents();
      
      // Record metrics
      timer({ status: 'success' });
      
      const formatCounts = agents.reduce((acc, agent) => {
        acc[agent.format] = (acc[agent.format] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(formatCounts).forEach(([format, count]) => {
        this.metrics.discoveredAgents.set({ format }, count);
      });
      
      return agents;
    } catch (error) {
      timer({ status: 'error' });
      throw error;
    }
  }
}
```

### **Health Checks**

```typescript
// Comprehensive health checking
class HealthCheckedOAASService extends OAASService {
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDiscoveryHealth(),
      this.checkTranslationHealth(),
      this.checkExecutionHealth(),
      this.checkCacheHealth(),
      this.checkDependencyHealth()
    ]);
    
    return {
      status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        discovery: this.getCheckResult(checks[0]),
        translation: this.getCheckResult(checks[1]),
        execution: this.getCheckResult(checks[2]),
        cache: this.getCheckResult(checks[3]),
        dependencies: this.getCheckResult(checks[4])
      },
      metrics: await this.getHealthMetrics()
    };
  }
  
  private async checkDiscoveryHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Quick discovery test
      const testAgents = await this.discovery.discoverAll({ limit: 5, timeout: 5000 });
      const duration = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: `Discovered ${testAgents.length} test agents in ${duration}ms`,
        duration
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Discovery failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}
```

---

## 🚀 **Deployment Strategies**

### **Blue-Green Deployment**

```typescript
// Blue-green deployment support
class DeploymentAwareOAASService extends OAASService {
  constructor(config: OAASServiceConfig & { deploymentSlot?: 'blue' | 'green' }) {
    super({
      ...config,
      cachePrefix: `oaas_${config.deploymentSlot || 'default'}`,
      discoveryPaths: config.discoveryPaths?.map(path => 
        `${config.deploymentSlot || 'current'}/${path}`
      )
    });
  }
  
  async warmup(): Promise<void> {
    // Pre-warm the service before switching traffic
    console.log('🔥 Warming up OAAS service...');
    
    // 1. Discover all agents
    await this.discoverAgents();
    
    // 2. Pre-translate common combinations
    const agents = await this.getAgentRegistry();
    const commonFrameworks = ['langchain', 'openai'];
    
    await Promise.all(
      agents.slice(0, 10).map(agent =>  // Warm up top 10 agents
        Promise.all(
          commonFrameworks.map(framework =>
            this.getAgentForFramework(agent.id, framework as any)
          )
        )
      )
    );
    
    console.log('✅ OAAS service warmed up and ready');
  }
}
```

### **Canary Deployment**

```typescript
// Canary deployment with feature flags
class CanaryOAASService extends OAASService {
  constructor(
    config: OAASServiceConfig, 
    private featureFlags: FeatureFlags,
    private canaryPercentage: number = 10
  ) {
    super(config);
  }
  
  async executeCapability(
    agentId: string,
    capabilityName: string,
    input: any
  ): Promise<any> {
    // Route percentage of traffic to canary version
    const useCanary = Math.random() * 100 < this.canaryPercentage;
    
    if (useCanary && this.featureFlags.canaryEnabled) {
      return this.executeCapabilityCanary(agentId, capabilityName, input);
    }
    
    return super.executeCapability(agentId, capabilityName, input);
  }
  
  private async executeCapabilityCanary(
    agentId: string,
    capabilityName: string,
    input: any
  ): Promise<any> {
    // Execute on canary version with enhanced monitoring
    const timer = Date.now();
    
    try {
      const result = await super.executeCapability(agentId, capabilityName, input);
      
      // Log success
      this.logCanaryMetric('success', agentId, capabilityName, Date.now() - timer);
      return result;
      
    } catch (error) {
      // Log failure and fallback to stable
      this.logCanaryMetric('error', agentId, capabilityName, Date.now() - timer, error);
      
      // Fallback to stable version
      return super.executeCapability(agentId, capabilityName, input);
    }
  }
}
```

---

## 🧪 **Testing Strategies**

### **Integration Testing**

```typescript
// Comprehensive integration tests
describe('OAAS Production Integration', () => {
  let service: OAASService;
  
  beforeAll(async () => {
    service = new OAASService({
      projectRoot: './test-fixtures',
      runtimeTranslation: true,
      cacheEnabled: false  // Disable cache for testing
    });
  });
  
  describe('Discovery', () => {
    it('should discover all expected agents', async () => {
      const agents = await service.discoverAgents();
      
      // Test agent counts by format
      const formatCounts = agents.reduce((acc, agent) => {
        acc[agent.format] = (acc[agent.format] || 0) + 1;
        return acc;
      }, {});
      
      expect(formatCounts.drupal).toBeGreaterThanOrEqual(5);
      expect(formatCounts.mcp).toBeGreaterThanOrEqual(3);
      expect(formatCounts.langchain).toBeGreaterThanOrEqual(2);
    });
    
    it('should complete discovery within performance limits', async () => {
      const startTime = Date.now();
      await service.discoverAgents();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });
  });
  
  describe('Cross-format Translation', () => {
    it('should translate agents between all supported formats', async () => {
      const agents = await service.discoverAgents();
      const testAgent = agents[0];
      
      const frameworks = ['langchain', 'crewai', 'openai', 'anthropic'] as const;
      
      for (const framework of frameworks) {
        const translated = await service.getAgentForFramework(
          testAgent.id, framework
        );
        
        expect(translated).toBeDefined();
        expect(translated.format).toBe(framework);
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle non-existent agents gracefully', async () => {
      await expect(
        service.executeCapability('non-existent', 'test', {})
      ).rejects.toThrow('Agent non-existent not found');
    });
    
    it('should handle malformed input gracefully', async () => {
      const agents = await service.discoverAgents();
      const testAgent = agents[0];
      
      // Test with invalid input
      await expect(
        service.executeCapability(testAgent.id, 'invalid-capability', null)
      ).rejects.toThrow();
    });
  });
});
```

### **Performance Testing**

```typescript
// Load testing
describe('OAAS Performance', () => {
  it('should handle concurrent discovery requests', async () => {
    const concurrentRequests = 10;
    const startTime = Date.now();
    
    const promises = Array(concurrentRequests).fill(null).map(() =>
      service.discoverAgents()
    );
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    // All requests should succeed
    expect(results).toHaveLength(concurrentRequests);
    
    // Should complete within reasonable time
    expect(duration).toBeLessThan(15000); // 15 seconds for 10 concurrent
  });
  
  it('should maintain performance under load', async () => {
    const agents = await service.discoverAgents();
    const testAgent = agents[0];
    
    // Execute 50 concurrent capability calls
    const executions = Array(50).fill(null).map(() =>
      service.executeCapability(testAgent.id, testAgent.capabilities[0].name, {})
    );
    
    const startTime = Date.now();
    await Promise.all(executions);
    const duration = Date.now() - startTime;
    
    const avgLatency = duration / 50;
    expect(avgLatency).toBeLessThan(200); // <200ms average
  });
});
```

---

## 🔧 **Troubleshooting Guide**

### **Common Issues & Solutions**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Slow Discovery** | Discovery takes >10 seconds | Enable caching, optimize discoveryPaths, reduce excludePatterns |
| **Translation Failures** | Agents fail to translate | Check agent format compliance, enable debug mode |
| **Execution Timeouts** | Capabilities timeout | Increase timeout limits, check agent resource usage |
| **Memory Issues** | Out of memory errors | Reduce batch sizes, enable garbage collection, limit cache size |
| **Cache Invalidation** | Stale cached results | Implement file watching, reduce cache TTL |

### **Debug Configuration**

```typescript
// Enhanced debugging
const debugService = new OAASService({
  projectRoot: process.cwd(),
  debug: true,
  logging: {
    level: 'debug',
    format: 'detailed',
    enableTracing: true,
    logFile: 'oaas-debug.log'
  },
  profiling: {
    enabled: true,
    sampleRate: 0.1,
    memoryTracking: true
  }
});
```

---

## 📋 **Production Checklist**

### **Pre-Deployment**
- [ ] Run full test suite
- [ ] Performance benchmarking completed
- [ ] Security audit passed
- [ ] Monitoring dashboards configured
- [ ] Alerting rules defined
- [ ] Rollback plan tested

### **Deployment**
- [ ] Feature flags configured
- [ ] Canary percentage set appropriately
- [ ] Health checks responding
- [ ] Metrics being collected
- [ ] Logs being aggregated
- [ ] Cache warmed up

### **Post-Deployment**
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify agent discovery working
- [ ] Test cross-format translation
- [ ] Validate critical workflows
- [ ] Document any issues

---

**🎯 Following these best practices ensures reliable, performant, and secure OAAS deployment in production environments.**