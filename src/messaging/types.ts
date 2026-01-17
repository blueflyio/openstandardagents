/**
 * OSSA v0.3.3 Messaging Extension - Type Definitions
 * Extended types for Agent-to-Agent messaging
 */

/**
 * Message envelope conforming to OSSA v0.3.3 spec
 */
export interface Message {
  id: string;
  channel: string;
  sender: string;
  timestamp: string;
  type: string;
  payload: Record<string, unknown>;
  metadata?: MessageMetadata;
  qos?: QualityOfService;
}

export interface MessageMetadata {
  correlationId?: string;
  replyTo?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number;
  contentType?: string;
  contentEncoding?: string;
  headers?: Record<string, string>;
}

export interface QualityOfService {
  deliveryMode: 'at-most-once' | 'at-least-once' | 'exactly-once';
  persistent?: boolean;
  ordered?: boolean;
}

/**
 * Channel configuration
 */
export interface Channel {
  name: string;
  type: 'direct' | 'topic' | 'broadcast';
  description?: string;
  schema?: string;
  qos?: ChannelQoS;
  config?: ChannelConfig;
  metadata?: Record<string, unknown>;
}

export interface ChannelQoS {
  deliveryMode?: 'at-most-once' | 'at-least-once' | 'exactly-once';
  persistent?: boolean;
  ordered?: boolean;
  maxRetries?: number;
  retryBackoff?: 'none' | 'linear' | 'exponential';
}

export interface ChannelConfig {
  maxMessageSize?: number;
  maxSubscribers?: number;
  messageRetention?: number;
  deadLetterQueue?: boolean;
  dlqChannel?: string;
  rateLimiting?: {
    enabled: boolean;
    maxMessagesPerSecond?: number;
    burstSize?: number;
  };
  encryption?: {
    enabled: boolean;
    algorithm?: 'AES-256-GCM' | 'ChaCha20-Poly1305';
    keyRef?: string;
  };
}

/**
 * Subscription configuration
 */
export interface Subscription {
  channel: string;
  schema?: string;
  handler: string;
  filter?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  config?: SubscriptionConfig;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionConfig {
  autoAcknowledge?: boolean;
  maxConcurrentMessages?: number;
  prefetchCount?: number;
  timeout?: number;
  retryOnError?: boolean;
  maxRetries?: number;
  retryBackoff?: {
    strategy: 'none' | 'linear' | 'exponential';
    initialDelay?: number;
    maxDelay?: number;
    multiplier?: number;
  };
  deadLetterQueue?: boolean;
  messageOrdering?: 'strict' | 'relaxed' | 'none';
}

/**
 * Delivery receipt
 */
export interface DeliveryReceipt {
  messageId: string;
  receiptId?: string;
  status:
    | 'accepted'
    | 'delivered'
    | 'acknowledged'
    | 'processed'
    | 'failed'
    | 'rejected'
    | 'expired';
  timestamp: string;
  subscriber?: string;
  channel?: string;
  deliveryAttempt?: number;
  processingTime?: number;
  error?: DeliveryError;
  metadata?: Record<string, unknown>;
}

export interface DeliveryError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stackTrace?: string;
  retryable?: boolean;
}

/**
 * Message broker interface
 */
export interface MessageBroker {
  publish(channel: string, message: Message): Promise<void>;
  subscribe(
    subscription: Subscription,
    handler: MessageHandler
  ): Promise<SubscriptionHandle>;
  unsubscribe(handle: SubscriptionHandle): Promise<void>;
  createChannel(channel: Channel): Promise<void>;
  deleteChannel(channelName: string): Promise<void>;
  acknowledge(messageId: string): Promise<void>;
  nack(messageId: string, requeue?: boolean): Promise<void>;
  close(): Promise<void>;
}

/**
 * Message handler function signature
 */
export type MessageHandler = (message: Message) => Promise<void> | void;

/**
 * Subscription handle for managing subscriptions
 */
export interface SubscriptionHandle {
  id: string;
  channel: string;
  unsubscribe(): Promise<void>;
}

/**
 * Transport configuration
 */
export interface TransportConfig {
  type: 'redis' | 'memory' | 'nats';
  config: Record<string, unknown>;
}

/**
 * Redis transport specific config
 */
export interface RedisTransportConfig {
  url: string;
  db?: number;
  keyPrefix?: string;
  connectionTimeout?: number;
  retryStrategy?: {
    maxRetries: number;
    backoff: 'none' | 'linear' | 'exponential';
  };
}

/**
 * In-memory transport specific config
 */
export interface MemoryTransportConfig {
  maxMessages?: number;
  pruneInterval?: number;
}

/**
 * Channel manager interface
 */
export interface ChannelManager {
  create(channel: Channel): Promise<void>;
  get(channelName: string): Promise<Channel | undefined>;
  delete(channelName: string): Promise<void>;
  list(): Promise<Channel[]>;
  exists(channelName: string): Promise<boolean>;
}
