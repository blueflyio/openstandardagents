# OSSA Modules & Components

## Overview

This document provides detailed information about the OSSA (Open Standards Scalable Agents) package architecture, including its core modules, component structure, and extension points for developers building agent-based systems.

## Package Architecture

OSSA is distributed as a single NPM package `@bluefly/open-standards-scalable-agents` containing multiple integrated modules that work together to provide comprehensive agent orchestration capabilities.

### Core Module Structure

```
@bluefly/open-standards-scalable-agents/
├── src/
│   ├── core/           # Core orchestration engine
│   ├── mcp/            # Model Context Protocol
│   ├── gitlab/         # GitLab CI/CD integration
│   ├── drupal/         # Drupal CMS bridge
│   ├── cli/            # Command-line interface
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Shared utilities
│   └── index.ts        # Main package exports
├── bin/
│   └── ossa.js         # CLI executable
├── docs/               # Documentation
├── examples/           # Usage examples
└── package.json        # Package configuration
```

## Module Details

### 1. Core Module (`src/core/`)

The core orchestration engine providing fundamental agent management and workflow execution capabilities.

#### Components

##### Orchestrator (`src/core/orchestrator/`)
```typescript
// Core orchestrator class
export class Orchestrator extends EventEmitter {
  private agents: Map<string, Agent>;
  private workflows: Map<string, Workflow>;
  private taskQueue: TaskQueue;
  private scheduler: Scheduler;
  
  async registerAgent(agent: Agent): Promise<void>
  async executeWorkflow(workflow: Workflow): Promise<WorkflowResult>
  async scheduleTask(task: Task): Promise<void>
}

// Usage example
import { Orchestrator } from '@bluefly/open-standards-scalable-agents';

const orchestrator = new Orchestrator({
  workspace: '.agent-workspace',
  maxConcurrentTasks: 10
});
```

##### Registry (`src/core/registry/`)
```typescript
// Agent registry for discovery and management
export class Registry extends EventEmitter {
  private agents: Map<string, AgentRegistration>;
  private capabilities: Map<string, string[]>;
  
  async register(agent: Agent): Promise<RegistrationResult>
  async discover(query: DiscoveryQuery): Promise<Agent[]>
  async getCapabilities(agentId: string): Promise<Capability[]>
}

// Registry configuration
const registry = new Registry({
  storage: 'memory', // or 'redis', 'file'
  ttl: 300000, // 5 minutes
  syncInterval: 30000 // 30 seconds
});
```

##### Scheduler (`src/core/scheduler/`)
```typescript
// Task scheduling and priority management
export class Scheduler extends EventEmitter {
  private queue: PriorityQueue<Task>;
  private workers: Map<string, Worker>;
  
  async schedule(task: Task): Promise<void>
  async execute(): Promise<void>
  setStrategy(strategy: SchedulingStrategy): void
}

// Scheduling strategies
export enum SchedulingStrategy {
  FIFO = 'fifo',
  PRIORITY = 'priority',
  FAIR = 'fair',
  LOAD_BALANCED = 'load_balanced'
}
```

##### State Manager (`src/core/state/`)
```typescript
// Event-sourced state management
export class StateManager extends EventEmitter {
  private eventStore: EventStore;
  private snapshots: Map<string, Snapshot>;
  
  async saveEvent(event: Event): Promise<void>
  async getState(aggregateId: string): Promise<State>
  async createSnapshot(aggregateId: string): Promise<Snapshot>
}
```

### 2. MCP Module (`src/mcp/`)

Model Context Protocol implementation for seamless LLM integration.

#### Components

##### MCP Server (`src/mcp/server/`)
```typescript
// MCP protocol server implementation
export class MCPServer extends EventEmitter {
  private tools: Map<string, Tool>;
  private transport: Transport;
  
  async initialize(): Promise<void>
  async registerTool(tool: Tool): Promise<void>
  async handleRequest(request: MCPRequest): Promise<MCPResponse>
}

// Tool registration example
const server = new MCPServer({
  transport: 'stdio' // or 'websocket'
});

server.registerTool({
  name: 'text-processor',
  description: 'Process text using various algorithms',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string' },
      operation: { type: 'string', enum: ['tokenize', 'summarize', 'translate'] }
    }
  },
  handler: async (args) => {
    // Tool implementation
    return processText(args.text, args.operation);
  }
});
```

##### MCP Client (`src/mcp/client/`)
```typescript
// MCP client for connecting to other MCP servers
export class MCPClient extends EventEmitter {
  private connection: Connection;
  private availableTools: Map<string, ToolSpec>;
  
  async connect(endpoint: string): Promise<void>
  async listTools(): Promise<ToolSpec[]>
  async executeTool(name: string, args: any): Promise<any>
}

// Client usage
const client = new MCPClient();
await client.connect('stdio://./my-mcp-server');

const tools = await client.listTools();
const result = await client.executeTool('text-processor', {
  text: 'Hello, world!',
  operation: 'tokenize'
});
```

##### Transport Layer (`src/mcp/transport/`)
```typescript
// Transport implementations for MCP
export abstract class Transport extends EventEmitter {
  abstract send(message: MCPMessage): Promise<void>
  abstract receive(): Promise<MCPMessage>
  abstract close(): Promise<void>
}

export class StdioTransport extends Transport {
  // Standard I/O implementation
}

export class WebSocketTransport extends Transport {
  // WebSocket implementation
}
```

### 3. GitLab Module (`src/gitlab/`)

GitLab CI/CD integration for agent lifecycle management and deployment.

#### Components

##### GitLab Client (`src/gitlab/client/`)
```typescript
// GitLab API client
export class GitLabClient {
  private api: GitLabAPI;
  private projectId: string;
  
  async createPipeline(config: PipelineConfig): Promise<Pipeline>
  async deployAgent(agent: Agent): Promise<Deployment>
  async trackExperiment(experiment: MLExperiment): Promise<void>
}

// Pipeline configuration
const client = new GitLabClient({
  url: 'https://gitlab.com',
  token: process.env.GITLAB_TOKEN,
  projectId: '12345'
});

const pipeline = await client.createPipeline({
  name: 'agent-validation',
  stages: ['validate', 'test', 'deploy'],
  agents: ['my-worker-agent']
});
```

##### CI Components (`src/gitlab/components/`)
```typescript
// Reusable GitLab CI components
export class AgentValidator {
  async validateManifest(manifest: AgentManifest): Promise<ValidationResult>
  async validateCapabilities(agent: Agent): Promise<CapabilityResult>
}

export class MCPTester {
  async testCompliance(server: MCPServer): Promise<ComplianceResult>
  async benchmarkPerformance(server: MCPServer): Promise<PerformanceResult>
}

export class SecurityScanner {
  async scanAgent(agent: Agent): Promise<SecurityResult>
  async checkVulnerabilities(dependencies: string[]): Promise<VulnerabilityResult>
}
```

##### ML Tracking (`src/gitlab/ml/`)
```typescript
// ML experiment tracking integration
export class MLExperiment {
  private experimentId: string;
  private metrics: Map<string, number>;
  
  async logMetric(name: string, value: number): Promise<void>
  async logArtifact(name: string, data: Buffer): Promise<void>
  async complete(status: ExperimentStatus): Promise<void>
}

// Usage example
const experiment = new MLExperiment({
  name: 'agent-performance-test',
  tags: ['agent', 'performance', 'v0.1.9']
});

await experiment.logMetric('accuracy', 0.95);
await experiment.logMetric('latency_ms', 123);
await experiment.complete('success');
```

### 4. Drupal Module (`src/drupal/`)

Drupal CMS integration providing content management capabilities for agent systems.

#### Components

##### Drupal Bridge (`src/drupal/bridge/`)
```typescript
// Bridge between OSSA and Drupal
export class DrupalBridge {
  private drupalApi: DrupalAPI;
  private mcpAdapter: MCPAdapter;
  
  async syncContent(entities: Entity[]): Promise<SyncResult>
  async executeWorkflow(workflow: DrupalWorkflow): Promise<void>
  async manageTaxonomy(vocabulary: Vocabulary): Promise<void>
}

// Drupal integration example
const bridge = new DrupalBridge({
  drupalUrl: 'https://my-site.com',
  credentials: {
    username: 'admin',
    password: 'secret'
  }
});

await bridge.syncContent([
  {
    type: 'node',
    bundle: 'agent_definition',
    fields: {
      title: 'My Agent',
      field_capabilities: ['text-processing']
    }
  }
]);
```

##### MCP Adapter (`src/drupal/adapter/`)
```typescript
// Adapter for MCP-Drupal protocol translation
export class MCPAdapter {
  private drupalBridge: DrupalBridge;
  
  async translateMCPToDrupal(request: MCPRequest): Promise<DrupalRequest>
  async translateDrupalToMCP(response: DrupalResponse): Promise<MCPResponse>
}
```

##### Experience Builder (`src/drupal/xb/`)
```typescript
// Drupal Experience Builder integration
export class ExperienceBuilder {
  private components: Map<string, XBComponent>;
  
  async createAgentComponent(agent: Agent): Promise<XBComponent>
  async renderWorkflow(workflow: Workflow): Promise<string>
}
```

### 5. CLI Module (`src/cli/`)

Command-line interface for OSSA development and management.

#### Components

##### Command Structure (`src/cli/commands/`)
```typescript
// Base command class
export abstract class BaseCommand {
  abstract name: string;
  abstract description: string;
  abstract execute(args: any[]): Promise<void>;
}

// Workspace commands
export class InitCommand extends BaseCommand {
  name = 'init';
  description = 'Initialize new OSSA workspace';
  
  async execute(args: string[]): Promise<void> {
    const name = args[0] || 'my-workspace';
    await this.createWorkspace(name);
  }
}

// Agent commands
export class CreateAgentCommand extends BaseCommand {
  name = 'agent:create';
  description = 'Create new agent';
  
  async execute(args: string[]): Promise<void> {
    const [name, type] = args;
    await this.createAgent(name, type as AgentType);
  }
}
```

##### Interactive Mode (`src/cli/interactive/`)
```typescript
// Interactive CLI prompts
export class InteractivePrompts {
  async promptForWorkspaceConfig(): Promise<WorkspaceConfig>
  async promptForAgentDetails(): Promise<AgentConfig>
  async confirmDeployment(details: DeploymentDetails): Promise<boolean>
}
```

## Shared Components

### Type Definitions (`src/types/`)

```typescript
// Core type definitions
export interface Agent {
  id: string;
  name: string;
  version: string;
  type: AgentType;
  capabilities: Capability[];
  status: AgentStatus;
  metadata: AgentMetadata;
  config: AgentConfig;
}

export interface Workflow {
  id: string;
  name: string;
  version: string;
  steps: WorkflowStep[];
  triggers: Trigger[];
  policies: string[];
  metadata: WorkflowMetadata;
}

export interface Task {
  id: string;
  workflowId: string;
  stepId: string;
  agentId: string;
  status: TaskStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: TaskError;
  startTime?: Date;
  endTime?: Date;
  retries: number;
}
```

### Utilities (`src/utils/`)

```typescript
// Shared utility functions
export class Logger {
  static info(message: string, meta?: any): void
  static warn(message: string, meta?: any): void
  static error(message: string, error?: Error): void
}

export class Validator {
  static validateAgentManifest(manifest: any): ValidationResult
  static validateWorkflow(workflow: any): ValidationResult
  static validateCapability(capability: any): ValidationResult
}

export class Crypto {
  static encrypt(data: string, key: string): string
  static decrypt(encrypted: string, key: string): string
  static hash(data: string): string
}
```

## Extension Points

### Plugin System

OSSA provides several extension points for custom functionality:

#### 1. Custom Agent Types
```typescript
// Register custom agent type
export class CustomWorkerAgent extends BaseAgent {
  type = 'custom-worker' as AgentType;
  
  protected async processTask(task: Task): Promise<void> {
    // Custom task processing logic
  }
}

// Register with orchestrator
orchestrator.registerAgentType('custom-worker', CustomWorkerAgent);
```

#### 2. Custom Schedulers
```typescript
// Implement custom scheduling strategy
export class CustomScheduler implements SchedulingStrategy {
  name = 'custom';
  
  async schedule(tasks: Task[]): Promise<Task[]> {
    // Custom scheduling logic
    return sortedTasks;
  }
}

// Register scheduler
scheduler.addStrategy('custom', new CustomScheduler());
```

#### 3. Custom Transports
```typescript
// Implement custom MCP transport
export class CustomTransport extends Transport {
  async send(message: MCPMessage): Promise<void> {
    // Custom transport implementation
  }
  
  async receive(): Promise<MCPMessage> {
    // Custom receive logic
  }
}

// Use custom transport
const server = new MCPServer({
  transport: new CustomTransport(config)
});
```

#### 4. Event Hooks
```typescript
// Register event listeners
orchestrator.on('agent:registered', (agent: Agent) => {
  console.log(`Agent registered: ${agent.name}`);
});

orchestrator.on('task:completed', (task: Task) => {
  console.log(`Task completed: ${task.id}`);
});

orchestrator.on('workflow:failed', (workflow: Workflow, error: Error) => {
  console.error(`Workflow failed: ${workflow.name}`, error);
});
```

## Configuration

### Package Configuration
```typescript
// OSSA configuration interface
export interface OSSAConfig {
  workspace: {
    path: string;
    maxConcurrentTasks: number;
    taskTimeout: number;
  };
  orchestrator: {
    strategy: SchedulingStrategy;
    retryPolicy: RetryPolicy;
  };
  mcp: {
    transport: TransportType;
    timeout: number;
  };
  gitlab: {
    url?: string;
    token?: string;
    projectId?: string;
  };
  drupal: {
    url?: string;
    credentials?: DrupalCredentials;
  };
}

// Default configuration
const defaultConfig: OSSAConfig = {
  workspace: {
    path: '.agent-workspace',
    maxConcurrentTasks: 10,
    taskTimeout: 300000
  },
  orchestrator: {
    strategy: SchedulingStrategy.PRIORITY,
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000,
      maxDelay: 10000
    }
  },
  mcp: {
    transport: 'stdio',
    timeout: 30000
  }
};
```

### Environment Variables
```bash
# OSSA Configuration
OSSA_WORKSPACE_PATH=.agent-workspace
OSSA_MAX_CONCURRENT_TASKS=10
OSSA_TASK_TIMEOUT=300000
OSSA_LOG_LEVEL=info

# MCP Configuration
OSSA_MCP_TRANSPORT=stdio
OSSA_MCP_TIMEOUT=30000

# GitLab Integration
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=your-token
GITLAB_PROJECT_ID=12345

# Drupal Integration
DRUPAL_URL=https://your-drupal-site.com
DRUPAL_USERNAME=admin
DRUPAL_PASSWORD=secret
```

## Performance Considerations

### Memory Management
- Event-sourced state management with configurable snapshot intervals
- Automatic cleanup of completed tasks and expired registrations
- Connection pooling for external integrations
- Lazy loading of large components

### Scalability
- Horizontal scaling through agent distribution
- Load balancing for task distribution
- Caching strategies for frequently accessed data
- Asynchronous processing for non-blocking operations

### Monitoring
- Built-in metrics collection (Prometheus compatible)
- Health checks for all modules
- Performance profiling capabilities
- Distributed tracing support (Jaeger compatible)

This modular architecture allows developers to use OSSA components individually or as a complete orchestration platform, with extensive customization options through the plugin system and configuration framework.