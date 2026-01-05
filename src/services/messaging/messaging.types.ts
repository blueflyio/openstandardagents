/**
 * OSSA Messaging Runtime - Type Definitions
 * Production-quality types for agent-to-agent messaging
 *
 * @fileoverview Core types for pub/sub messaging, message routing, and delivery guarantees
 * @module @ossa/messaging/types
 */

import {
  MessageEnvelope,
  PublishedChannel,
  Subscription,
  Command,
  ReliabilityConfig,
} from '../../types/messaging.js';

/**
 * Re-export core types from messaging.ts
 */
export {
  MessageEnvelope,
  PublishedChannel,
  Subscription,
  Command,
  ReliabilityConfig,
};

/**
 * Delivery guarantee levels for message routing
 */
export enum DeliveryGuarantee {
  /** Message delivered zero or one time (best-effort, fire-and-forget) */
  AT_MOST_ONCE = 'at-most-once',
  /** Message delivered one or more times (retry until acknowledged) */
  AT_LEAST_ONCE = 'at-least-once',
  /** Message delivered exactly once (idempotent delivery with deduplication) */
  EXACTLY_ONCE = 'exactly-once',
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Message acknowledgment modes
 */
export enum AcknowledgmentMode {
  /** Handler must manually acknowledge messages */
  MANUAL = 'manual',
  /** Messages automatically acknowledged on successful return */
  AUTOMATIC = 'automatic',
}

/**
 * Backoff strategies for retry logic
 */
export enum BackoffStrategy {
  /** Fixed delay between retries */
  CONSTANT = 'constant',
  /** Linearly increasing delay */
  LINEAR = 'linear',
  /** Exponentially increasing delay */
  EXPONENTIAL = 'exponential',
}

/**
 * Message processing state
 */
export enum MessageState {
  /** Message pending delivery */
  PENDING = 'pending',
  /** Message currently being processed */
  PROCESSING = 'processing',
  /** Message successfully delivered and acknowledged */
  ACKNOWLEDGED = 'acknowledged',
  /** Message delivery failed and moved to dead letter queue */
  DEAD_LETTERED = 'dead-lettered',
  /** Message expired before delivery */
  EXPIRED = 'expired',
}

/**
 * Channel metadata and configuration
 */
export interface Channel {
  /** Channel name (dot-separated namespace: e.g., 'security.vulnerabilities') */
  name: string;

  /** Human-readable description */
  description?: string;

  /** JSON Schema for message validation */
  schema?: Record<string, unknown>;

  /** Message content type */
  contentType?: string;

  /** Tags for categorization */
  tags?: string[];

  /** Number of active subscriptions */
  subscriptionCount: number;

  /** Message retention policy (ISO 8601 duration) */
  retentionPeriod?: string;

  /** Created timestamp */
  createdAt: Date;

  /** Last message timestamp */
  lastMessageAt?: Date;

  /** Total messages published */
  messageCount: number;
}

/**
 * Active subscription with runtime state
 */
export interface ActiveSubscription extends Subscription {
  /** Unique subscription ID */
  id: string;

  /** Agent that owns this subscription */
  agentId: string;

  /** Message handler function */
  handlerFn: MessageHandler;

  /** Subscription created timestamp */
  createdAt: Date;

  /** Currently processing messages count */
  activeMessages: number;

  /** Total messages processed */
  processedCount: number;

  /** Failed message count */
  errorCount: number;

  /** Last message processing timestamp */
  lastProcessedAt?: Date;

  /** Subscription enabled state */
  enabled: boolean;
}

/**
 * Message handler function signature
 */
export type MessageHandler = (message: MessageEnvelope) => Promise<void> | void;

/**
 * Message acknowledgment result
 */
export interface MessageAcknowledgment {
  /** Message ID being acknowledged */
  messageId: string;

  /** Whether message was successfully processed */
  success: boolean;

  /** Optional error if processing failed */
  error?: Error;

  /** Timestamp of acknowledgment */
  timestamp: Date;

  /** Processing duration in milliseconds */
  durationMs: number;
}

/**
 * Subscription filter for message routing
 */
export interface SubscriptionFilter {
  /** Filter expression (e.g., JSONPath or custom DSL) */
  expression?: string;

  /** Field-based equality filters */
  fields?: Record<string, unknown>;

  /** Compiled filter function (internal use) */
  evaluateFn?: (message: MessageEnvelope) => boolean;
}

/**
 * Message broker adapter interface
 * Implementations: in-memory, Redis, Kafka, RabbitMQ, etc.
 */
export interface MessageBroker {
  /**
   * Initialize the broker
   */
  connect(): Promise<void>;

  /**
   * Shutdown the broker gracefully
   */
  disconnect(): Promise<void>;

  /**
   * Publish a message to a channel
   */
  publish(channel: string, message: MessageEnvelope): Promise<void>;

  /**
   * Subscribe to a channel
   */
  subscribe(
    channel: string,
    handler: MessageHandler,
    options?: SubscriptionOptions,
  ): Promise<string>;

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Acknowledge message processing
   */
  acknowledge(messageId: string, success: boolean): Promise<void>;

  /**
   * Get broker health status
   */
  getHealth(): Promise<BrokerHealth>;

  /**
   * Get channel statistics
   */
  getChannelStats(channel: string): Promise<ChannelStats>;
}

/**
 * Subscription options for broker
 */
export interface SubscriptionOptions {
  /** Message filter */
  filter?: SubscriptionFilter;

  /** Message priority */
  priority?: MessagePriority;

  /** Maximum concurrent message processing */
  maxConcurrency?: number;

  /** Acknowledgment mode */
  acknowledgmentMode?: AcknowledgmentMode;

  /** Message prefetch count */
  prefetchCount?: number;

  /** Subscription group for competing consumers */
  consumerGroup?: string;
}

/**
 * Broker health status
 */
export interface BrokerHealth {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** Number of active connections */
  connections: number;

  /** Number of active channels */
  channels: number;

  /** Number of active subscriptions */
  subscriptions: number;

  /** Pending messages count */
  pendingMessages: number;

  /** Uptime in milliseconds */
  uptimeMs: number;

  /** Last health check timestamp */
  timestamp: Date;

  /** Optional error details */
  error?: string;
}

/**
 * Channel statistics
 */
export interface ChannelStats {
  /** Channel name */
  channel: string;

  /** Total messages published */
  messagesPublished: number;

  /** Total messages consumed */
  messagesConsumed: number;

  /** Pending messages in queue */
  messagesPending: number;

  /** Failed deliveries */
  messagesFailed: number;

  /** Active subscriptions */
  subscriptions: number;

  /** Average message size in bytes */
  avgMessageSizeBytes: number;

  /** Messages per second (last minute) */
  messagesPerSecond: number;

  /** Last activity timestamp */
  lastActivityAt?: Date;
}

/**
 * Message routing context
 */
export interface RoutingContext {
  /** Source agent ID */
  sourceAgentId: string;

  /** Target channel */
  channel: string;

  /** Delivery guarantee */
  deliveryGuarantee: DeliveryGuarantee;

  /** Reliability configuration */
  reliability?: ReliabilityConfig;

  /** Trace context for distributed tracing */
  traceContext?: {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
  };
}

/**
 * Dead letter queue entry
 */
export interface DeadLetterEntry {
  /** Original message */
  message: MessageEnvelope;

  /** Reason for dead lettering */
  reason: string;

  /** Number of retry attempts */
  retryCount: number;

  /** Last error */
  lastError?: string;

  /** Dead lettered timestamp */
  deadLetteredAt: Date;

  /** Expiry timestamp */
  expiresAt: Date;
}

/**
 * Message metrics for observability
 */
export interface MessageMetrics {
  /** Total messages published */
  published: number;

  /** Total messages delivered */
  delivered: number;

  /** Total messages failed */
  failed: number;

  /** Total messages dead lettered */
  deadLettered: number;

  /** Average delivery latency in milliseconds */
  avgLatencyMs: number;

  /** 95th percentile latency */
  p95LatencyMs: number;

  /** 99th percentile latency */
  p99LatencyMs: number;

  /** Messages per second */
  throughput: number;

  /** Metrics time window */
  windowMs: number;

  /** Timestamp of metrics collection */
  timestamp: Date;
}

/**
 * Message validation result
 */
export interface ValidationResult {
  /** Whether message is valid */
  valid: boolean;

  /** Validation errors if invalid */
  errors?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}
