/**
 * OSSA v0.1.9 Redis Event Bus - Types and Contracts
 * Production-ready event bus for 40+ projects and 100+ agent orchestration
 */

export interface EventMetadata {
  /** Unique event identifier */
  id: string;
  /** Event type identifier */
  type: string;
  /** Source service/agent name */
  source: string;
  /** Target service/agent name (optional for broadcast events) */
  target?: string;
  /** Event timestamp */
  timestamp: Date;
  /** Correlation ID for event tracing */
  correlationId?: string;
  /** Event version for schema evolution */
  version: string;
  /** Event priority level */
  priority: EventPriority;
  /** TTL in seconds for event expiration */
  ttl?: number;
  /** Retry configuration */
  retry?: EventRetryConfig;
  /** Event tags for filtering */
  tags?: string[];
}

export enum EventPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}

export interface EventRetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
}

export interface EventPayload<T = any> {
  /** Event metadata */
  metadata: EventMetadata;
  /** Event data payload */
  data: T;
}

export interface EventHandler<T = any> {
  /** Handler function */
  handler: (payload: EventPayload<T>) => Promise<void> | void;
  /** Handler options */
  options?: EventHandlerOptions;
}

export interface EventHandlerOptions {
  /** Handler priority (higher numbers processed first) */
  priority?: number;
  /** Concurrent processing limit */
  concurrency?: number;
  /** Handler-specific timeout */
  timeout?: number;
  /** Error handling strategy */
  errorStrategy?: 'retry' | 'dlq' | 'ignore';
}

export interface EventBusConfig {
  /** Redis connection configuration */
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    cluster?: {
      nodes: Array<{ host: string; port: number }>;
      options?: any;
    };
  };

  /** Performance optimization settings */
  performance: {
    /** Maximum events per batch */
    batchSize: number;
    /** Batch processing timeout */
    batchTimeout: number;
    /** Connection pool size */
    connectionPoolSize: number;
    /** Pipeline size for Redis operations */
    pipelineSize: number;
  };

  /** Monitoring and observability */
  monitoring: {
    /** Enable metrics collection */
    enabled: boolean;
    /** Metrics collection interval */
    metricsInterval: number;
    /** Enable distributed tracing */
    tracing: boolean;
    /** Health check interval */
    healthCheckInterval: number;
  };

  /** Default event configuration */
  defaults: {
    /** Default event TTL */
    ttl: number;
    /** Default retry configuration */
    retry: EventRetryConfig;
    /** Default event priority */
    priority: EventPriority;
  };

  /** Dead letter queue configuration */
  deadLetterQueue: {
    /** Enable DLQ */
    enabled: boolean;
    /** DLQ Redis key pattern */
    keyPattern: string;
    /** DLQ retention time */
    retention: number;
  };
}

export interface EventBusMetrics {
  /** Total events published */
  eventsPublished: number;
  /** Total events consumed */
  eventsConsumed: number;
  /** Events in processing */
  eventsInFlight: number;
  /** Failed events */
  eventsFailed: number;
  /** Events in dead letter queue */
  eventsInDLQ: number;
  /** Average processing time */
  avgProcessingTime: number;
  /** Peak events per second */
  peakEventsPerSecond: number;
  /** Current throughput */
  currentThroughput: number;
  /** Error rate percentage */
  errorRate: number;
  /** Connection pool utilization */
  connectionPoolUtilization: number;
}

export interface SubscriptionOptions {
  /** Subscription group name for load balancing */
  group?: string;
  /** Start consuming from specific position */
  startFrom?: 'beginning' | 'latest' | 'timestamp';
  /** Timestamp for startFrom='timestamp' */
  startTimestamp?: Date;
  /** Auto-acknowledge messages */
  autoAck?: boolean;
  /** Max unacknowledged messages */
  maxUnacknowledged?: number;
  /** Consumer timeout */
  consumerTimeout?: number;
}

export interface PublishOptions {
  /** Override default TTL */
  ttl?: number;
  /** Override default retry config */
  retry?: EventRetryConfig;
  /** Override default priority */
  priority?: EventPriority;
  /** Wait for acknowledgment */
  waitForAck?: boolean;
  /** Partition key for consistent routing */
  partitionKey?: string;
}

export interface CrossProjectEventContract {
  /** Contract name */
  name: string;
  /** Contract version */
  version: string;
  /** Source project */
  sourceProject: string;
  /** Target projects */
  targetProjects: string[];
  /** Event types covered by contract */
  eventTypes: string[];
  /** JSON schema for event data */
  schema: any;
  /** Contract metadata */
  metadata: {
    description: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
  };
}

export interface AgentOrchestrationEvent {
  /** Agent lifecycle events */
  agentLifecycle: {
    spawned: AgentSpawnedEvent;
    started: AgentStartedEvent;
    stopped: AgentStoppedEvent;
    failed: AgentFailedEvent;
    terminated: AgentTerminatedEvent;
  };

  /** Task coordination events */
  taskCoordination: {
    assigned: TaskAssignedEvent;
    started: TaskStartedEvent;
    completed: TaskCompletedEvent;
    failed: TaskFailedEvent;
    cancelled: TaskCancelledEvent;
  };

  /** Resource management events */
  resourceManagement: {
    allocated: ResourceAllocatedEvent;
    released: ResourceReleasedEvent;
    exhausted: ResourceExhaustedEvent;
  };

  /** Performance monitoring events */
  performance: {
    metrics: PerformanceMetricsEvent;
    threshold: ThresholdBreachedEvent;
    bottleneck: BottleneckDetectedEvent;
  };
}

export interface AgentSpawnedEvent {
  agentId: string;
  agentType: string;
  capabilities: string[];
  orchestratorId: string;
  configuration: any;
}

export interface TaskAssignedEvent {
  taskId: string;
  agentId: string;
  taskType: string;
  priority: number;
  estimatedDuration: number;
  dependencies: string[];
}

// Missing agent lifecycle event types
export interface AgentStartedEvent {
  agentId: string;
  agentType: string;
  timestamp: Date;
}

export interface AgentStoppedEvent {
  agentId: string;
  reason: string;
  timestamp: Date;
}

export interface AgentFailedEvent {
  agentId: string;
  error: string;
  timestamp: Date;
}

export interface AgentTerminatedEvent {
  agentId: string;
  reason: string;
  timestamp: Date;
}

// Missing task coordination event types
export interface TaskStartedEvent {
  taskId: string;
  agentId: string;
  timestamp: Date;
}

export interface TaskCompletedEvent {
  taskId: string;
  agentId: string;
  result: any;
  duration: number;
  timestamp: Date;
}

export interface TaskFailedEvent {
  taskId: string;
  agentId: string;
  error: string;
  timestamp: Date;
}

export interface TaskCancelledEvent {
  taskId: string;
  agentId: string;
  reason: string;
  timestamp: Date;
}

// Missing resource management event types
export interface ResourceAllocatedEvent {
  resourceId: string;
  resourceType: string;
  agentId: string;
  allocation: any;
  timestamp: Date;
}

export interface ResourceReleasedEvent {
  resourceId: string;
  resourceType: string;
  agentId: string;
  timestamp: Date;
}

export interface ResourceExhaustedEvent {
  resourceType: string;
  threshold: number;
  current: number;
  timestamp: Date;
}

// Missing performance monitoring event types
export interface ThresholdBreachedEvent {
  metric: string;
  threshold: number;
  currentValue: number;
  severity: 'warning' | 'critical';
  source: string;
  timestamp: Date;
}

export interface BottleneckDetectedEvent {
  component: string;
  bottleneckType: string;
  impact: string;
  recommendations: string[];
  timestamp: Date;
}

export interface PerformanceMetricsEvent {
  source: string;
  metrics: {
    cpu: number;
    memory: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  timestamp: Date;
}

export interface EventStream {
  /** Stream name */
  name: string;
  /** Stream configuration */
  config: StreamConfig;
  /** Stream statistics */
  stats: StreamStats;
}

export interface StreamConfig {
  /** Maximum stream length */
  maxLength: number;
  /** Stream retention policy */
  retention: 'time' | 'count' | 'both';
  /** Retention value */
  retentionValue: number;
  /** Partitioning strategy */
  partitioning?: 'none' | 'hash' | 'round-robin';
  /** Number of partitions */
  partitions?: number;
}

export interface StreamStats {
  /** Total messages in stream */
  messageCount: number;
  /** Stream size in bytes */
  sizeBytes: number;
  /** First message timestamp */
  firstMessage: Date;
  /** Last message timestamp */
  lastMessage: Date;
  /** Consumer groups count */
  consumerGroups: number;
  /** Active consumers count */
  activeConsumers: number;
}

export interface EventBusStatus {
  /** Overall status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Redis connection status */
  redis: {
    connected: boolean;
    cluster?: boolean;
    nodes?: Array<{ host: string; port: number; status: string }>;
  };
  /** Active subscriptions count */
  subscriptions: number;
  /** Event streams count */
  streams: number;
  /** Metrics snapshot */
  metrics: EventBusMetrics;
  /** Last health check */
  lastHealthCheck: Date;
}

// Default configurations
export const DEFAULT_EVENT_BUS_CONFIG: EventBusConfig = {
  redis: {
    host: 'localhost',
    port: 6379,
    keyPrefix: 'ossa:eventbus'
  },
  performance: {
    batchSize: 100,
    batchTimeout: 1000,
    connectionPoolSize: 10,
    pipelineSize: 100
  },
  monitoring: {
    enabled: true,
    metricsInterval: 30000,
    tracing: true,
    healthCheckInterval: 15000
  },
  defaults: {
    ttl: 3600, // 1 hour
    priority: EventPriority.NORMAL,
    retry: {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 30000
    }
  },
  deadLetterQueue: {
    enabled: true,
    keyPattern: 'ossa:dlq',
    retention: 86400 // 24 hours
  }
};

// Event type constants for strong typing
export const EVENT_TYPES = {
  AGENT: {
    SPAWNED: 'agent.spawned',
    STARTED: 'agent.started',
    STOPPED: 'agent.stopped',
    FAILED: 'agent.failed',
    TERMINATED: 'agent.terminated'
  },
  TASK: {
    ASSIGNED: 'task.assigned',
    STARTED: 'task.started',
    COMPLETED: 'task.completed',
    FAILED: 'task.failed',
    CANCELLED: 'task.cancelled'
  },
  RESOURCE: {
    ALLOCATED: 'resource.allocated',
    RELEASED: 'resource.released',
    EXHAUSTED: 'resource.exhausted'
  },
  PERFORMANCE: {
    METRICS: 'performance.metrics',
    THRESHOLD: 'performance.threshold',
    BOTTLENECK: 'performance.bottleneck'
  },
  SYSTEM: {
    HEALTH_CHECK: 'system.health_check',
    CONFIGURATION_CHANGED: 'system.configuration_changed',
    SHUTDOWN: 'system.shutdown',
    ERROR: 'system.error'
  }
} as const;