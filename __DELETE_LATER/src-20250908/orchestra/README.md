# OSSA Orchestra v0.1.8

**Advanced Multi-Agent Workflow Orchestration Platform**

OSSA Orchestra is a comprehensive platform for orchestrating complex multi-agent workflows with advanced features including dynamic scaling, intelligent load balancing, compliance validation, and comprehensive monitoring.

## 🚀 Features

### Core Orchestration
- **Multi-Agent Workflow Execution** - Support for sequential, parallel, DAG, pipeline, fanout, scatter-gather, conditional, loop, and event-driven workflows
- **Agent Registry** - Centralized management of agent definitions, capabilities, and health status
- **Workflow Engine** - Advanced execution engine with retry policies, timeouts, and error handling

### Scaling & Performance
- **Dynamic Agent Scaling** - Automatic scaling based on CPU, memory, response time, and queue length metrics
- **Intelligent Load Balancing** - Multiple strategies including round-robin, least connections, performance-based, and resource-aware
- **Circuit Breaker Pattern** - Automatic failure detection and recovery mechanisms

### Compliance & Security
- **Workflow Compliance Validation** - Pre-execution, post-execution, and continuous compliance checking
- **Multi-Level Compliance** - Bronze, Silver, Gold, and Platinum compliance levels
- **Policy Engine** - Flexible policy definitions with custom validators

### Monitoring & Observability
- **Comprehensive Metrics** - Counters, gauges, histograms, and custom metrics collection
- **Health Monitoring** - Real-time agent and system health tracking
- **Prometheus Integration** - Export metrics in Prometheus format

### REST API
- **Complete REST API** - Full CRUD operations for agents, workflows, executions, and configurations
- **OpenAPI 3.0 Compatible** - Well-documented API with schema validation
- **Tracing Support** - Request tracing and correlation IDs

## 📦 Installation

```bash
cd /Users/flux423/Sites/LLM/OSSA/src/orchestra
npm install
```

## 🏗️ Build

```bash
npm run build
```

## 🚀 Quick Start

### 1. Start the Orchestra API Server

```bash
npm start
# or for development
npm run dev
```

The server will start on port 3013 by default.

### 2. Run the Basic Example

```bash
npm run example
```

### 3. Register an Agent

```typescript
import { OrchestrationEngine, AgentDefinition } from '@ossa/orchestra';

const orchestra = new OrchestrationEngine();
await orchestra.initialize();

const agent: AgentDefinition = {
  id: 'my-agent',
  name: 'My Agent',
  type: 'analyzer',
  version: '1.0.0',
  endpoint: 'http://localhost:3001',
  capabilities: [
    {
      id: 'analyze',
      name: 'Analyze Data',
      description: 'Performs data analysis',
      inputSchema: { type: 'object', properties: { data: { type: 'string' } } },
      outputSchema: { type: 'object', properties: { result: { type: 'object' } } },
      performance: {
        responseTime: { target: 1000, max: 3000 },
        throughput: { target: 100, max: 200 },
        errorRate: { max: 5 },
        availability: { target: 99.9 }
      },
      compliance: ['silver'],
      dependencies: []
    }
  ],
  resources: {
    cpu: { min: 1, max: 4 },
    memory: { min: 1024, max: 8192 },
    network: { bandwidth: 1000, latency: 10 }
  },
  healthStatus: {
    status: 'healthy',
    lastCheck: new Date(),
    checks: [],
    score: 100
  },
  metadata: {
    tags: ['analysis'],
    owner: 'team-name',
    created: new Date(),
    updated: new Date(),
    priority: 5,
    environment: 'production'
  }
};

await orchestra.registerAgent(agent);
```

### 4. Define a Workflow

```typescript
import { WorkflowDefinition } from '@ossa/orchestra';

const workflow: WorkflowDefinition = {
  id: 'my-workflow',
  name: 'My Workflow',
  version: '1.0.0',
  type: 'sequential',
  stages: [
    {
      id: 'analyze-stage',
      name: 'Analyze Data',
      agentId: 'my-agent',
      capabilityId: 'analyze',
      input: {
        type: 'from_external',
        schema: { type: 'object', properties: { data: { type: 'string' } } }
      },
      output: {
        type: 'data',
        schema: { type: 'object', properties: { result: { type: 'object' } } }
      },
      retry: {
        maxAttempts: 3,
        backoffType: 'exponential',
        baseDelay: 1000,
        maxDelay: 5000,
        retryOn: ['error', 'timeout']
      },
      timeout: 10000,
      priority: 1
    }
  ],
  dependencies: [],
  resources: {
    cpu: 2,
    memory: 4096,
    network: 500,
    maxConcurrency: 2
  },
  constraints: {
    maxExecutionTime: 30000,
    maxRetries: 3,
    allowedFailures: 0,
    resourceLimits: {
      cpu: 4,
      memory: 8192,
      network: 1000,
      maxConcurrency: 5
    },
    complianceRequired: true
  },
  compliance: [
    {
      level: 'silver',
      policies: ['data-protection'],
      validation: {
        preExecution: ['data-validation'],
        postExecution: ['result-validation'],
        continuous: ['performance-validation']
      }
    }
  ],
  metadata: {
    description: 'Example workflow for data analysis',
    tags: ['analysis', 'example'],
    owner: 'team-name',
    created: new Date(),
    updated: new Date(),
    category: 'analysis'
  }
};

await orchestra.registerWorkflow(workflow);
```

### 5. Execute a Workflow

```typescript
import { OrchestrationRequest } from '@ossa/orchestra';

const request: OrchestrationRequest = {
  id: 'req-001',
  workflowId: 'my-workflow',
  input: { data: 'sample data to analyze' },
  priority: 1,
  metadata: {
    user: 'user-id',
    origin: 'api-call',
    timestamp: new Date(),
    traceId: 'trace-123',
    context: {}
  }
};

const result = await orchestra.execute(request);
console.log('Execution result:', result);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3013
NODE_ENV=production

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com

# Monitoring
PROMETHEUS_ENABLED=true
METRICS_RETENTION_HOURS=24

# Scaling
AUTO_SCALING_ENABLED=true
SCALING_CHECK_INTERVAL_MS=30000

# Load Balancer
HEALTH_CHECK_INTERVAL_MS=30000
CIRCUIT_BREAKER_ENABLED=true

# Compliance
COMPLIANCE_VALIDATION_ENABLED=true
DEFAULT_COMPLIANCE_LEVEL=silver
```

## 📊 API Endpoints

### Health & Metrics
- `GET /api/v1/orchestra/health` - System health status
- `GET /api/v1/orchestra/metrics` - Performance metrics

### Agent Management
- `POST /api/v1/orchestra/agents` - Register agent
- `GET /api/v1/orchestra/agents` - List agents
- `GET /api/v1/orchestra/agents/:id` - Get agent details
- `PUT /api/v1/orchestra/agents/:id` - Update agent
- `DELETE /api/v1/orchestra/agents/:id` - Unregister agent

### Workflow Management
- `POST /api/v1/orchestra/workflows` - Register workflow
- `GET /api/v1/orchestra/workflows` - List workflows
- `GET /api/v1/orchestra/workflows/:id` - Get workflow details
- `DELETE /api/v1/orchestra/workflows/:id` - Unregister workflow

### Execution
- `POST /api/v1/orchestra/execute` - Execute workflow
- `GET /api/v1/orchestra/executions` - List active executions
- `GET /api/v1/orchestra/executions/:id` - Get execution status
- `POST /api/v1/orchestra/executions/:id/cancel` - Cancel execution

### Scaling
- `POST /api/v1/orchestra/scaling/policies` - Add scaling policy
- `GET /api/v1/orchestra/scaling/policies` - List policies
- `DELETE /api/v1/orchestra/scaling/policies/:id` - Remove policy

### Load Balancer
- `POST /api/v1/orchestra/load-balancer/config` - Configure load balancer
- `GET /api/v1/orchestra/load-balancer/config` - Get configuration
- `GET /api/v1/orchestra/load-balancer/status` - Get status

### Compliance
- `POST /api/v1/orchestra/compliance/validate/pre-execution` - Pre-execution validation
- `POST /api/v1/orchestra/compliance/validate/post-execution` - Post-execution validation
- `GET /api/v1/orchestra/compliance/policies` - List policies
- `GET /api/v1/orchestra/compliance/reports/:workflowId` - Get compliance report

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REST API      │    │  Orchestration  │    │  Agent Registry │
│   Server        │───▶│  Engine         │───▶│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │               ┌─────────────────┐             │
         │               │  Workflow       │             │
         │               │  Engine         │             │
         │               └─────────────────┘             │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Compliance     │    │  Scaling        │    │  Load Balancer  │
│  Validator      │    │  Manager        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Metrics Collector                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Monitoring

### Metrics Available

**Execution Metrics:**
- `orchestra.executions.started` - Total executions started
- `orchestra.executions.completed` - Total executions completed
- `orchestra.execution.duration` - Execution duration histogram

**Stage Metrics:**
- `orchestra.stages.executed` - Total stages executed
- `orchestra.stages.success` - Successful stage executions
- `orchestra.stages.failed` - Failed stage executions
- `orchestra.stage.duration` - Stage duration histogram

**Agent Metrics:**
- `orchestra.agent.health_score` - Agent health scores
- `orchestra.agent.health_checks` - Health check counters
- `orchestra.agent.instances` - Current agent instances

**Scaling Metrics:**
- `orchestra.scaling.events` - Scaling events counter
- `orchestra.load_balancer.selections` - Load balancer selections
- `orchestra.load_balancer.response_time` - Response time histogram

**Compliance Metrics:**
- `orchestra.compliance.violations` - Compliance violations

### Prometheus Integration

Access metrics at `/api/v1/orchestra/metrics?format=prometheus`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Create a pull request

## 📝 License

Apache 2.0 - See LICENSE file for details.

## 🆘 Support

- Documentation: [https://docs.ossa.io/orchestra](https://docs.ossa.io/orchestra)
- Issues: [GitHub Issues](https://github.com/ossa-io/orchestra/issues)
- Discussions: [GitHub Discussions](https://github.com/ossa-io/orchestra/discussions)

## 🗺️ Roadmap

- **v0.2.0**: WebSocket support for real-time monitoring
- **v0.3.0**: GraphQL API
- **v0.4.0**: Workflow visual designer
- **v0.5.0**: Multi-cluster orchestration
- **v1.0.0**: Production-ready stable release