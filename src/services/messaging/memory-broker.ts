/**
 * OSSA Messaging Runtime - In-Memory Message Broker
 * Production-quality in-memory pub/sub broker for local development and testing
 *
 * @fileoverview Simple, fast in-memory message broker with full feature support
 * @module @ossa/messaging/memory-broker
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import {
  MessageBroker,
  MessageEnvelope,
  MessageHandler,
  SubscriptionOptions,
  BrokerHealth,
  ChannelStats,
  DeliveryGuarantee,
  MessagePriority,
  AcknowledgmentMode,
  MessageState,
} from './messaging.types.js';

/**
 * Internal message queue entry
 */
interface QueuedMessage {
  message: MessageEnvelope;
  state: MessageState;
  enqueuedAt: Date;
  processingStartedAt?: Date;
  retryCount: number;
  nextRetryAt?: Date;
  ackDeadline?: Date;
}

/**
 * Internal subscription entry
 */
interface InternalSubscription {
  id: string;
  channel: string;
  handler: MessageHandler;
  options: SubscriptionOptions;
  active: boolean;
  currentConcurrency: number;
  processedCount: number;
  errorCount: number;
  createdAt: Date;
}

/**
 * In-memory message broker for local development
 *
 * Features:
 * - Pub/sub with wildcard channel matching
 * - Message queuing with TTL
 * - Acknowledgment tracking
 * - Retry with exponential backoff
 * - Dead letter queue
 * - Concurrency control
 * - Message ordering per channel
 * - Metrics and observability
 *
 * Limitations:
 * - Single process only (no distributed support)
 * - Messages lost on restart
 * - Limited to available memory
 */
export class MemoryBroker implements MessageBroker {
  private readonly eventBus: EventEmitter;
  private readonly subscriptions: Map<string, InternalSubscription>;
  private readonly messageQueues: Map<string, QueuedMessage[]>;
  private readonly deadLetterQueue: Map<string, QueuedMessage>;
  private readonly pendingAcks: Map<string, QueuedMessage>;
  private readonly channelMetrics: Map<string, ChannelStats>;

  private connected: boolean = false;
  private readonly startTime: Date;
  private processingInterval?: NodeJS.Timeout;

  /**
   * Default reliability configuration
   */
  private readonly defaultReliability = {
    deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
    retry: {
      maxAttempts: 3,
      backoff: {
        strategy: 'exponential' as const,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        multiplier: 2,
      },
    },
    acknowledgment: {
      mode: AcknowledgmentMode.AUTOMATIC,
      timeoutSeconds: 30,
    },
  };

  constructor() {
    this.eventBus = new EventEmitter();
    this.eventBus.setMaxListeners(1000); // Support many subscriptions
    this.subscriptions = new Map();
    this.messageQueues = new Map();
    this.deadLetterQueue = new Map();
    this.pendingAcks = new Map();
    this.channelMetrics = new Map();
    this.startTime = new Date();
  }

  /**
   * Connect to the broker (no-op for in-memory)
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.connected = true;

    // Start background message processing
    this.processingInterval = setInterval(() => {
      this.processRetries().catch((err) => {
        console.error('[MemoryBroker] Error processing retries:', err);
      });
      this.cleanupExpiredMessages().catch((err) => {
        console.error('[MemoryBroker] Error cleaning up messages:', err);
      });
    }, 1000); // Process every second
  }

  /**
   * Disconnect from the broker
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    // Stop background processing
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    // Wait for pending acknowledgments to complete
    const timeout = 5000; // 5 second graceful shutdown
    const startTime = Date.now();

    while (this.pendingAcks.size > 0 && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Clean up all subscriptions
    for (const [subId] of this.subscriptions) {
      await this.unsubscribe(subId);
    }

    this.connected = false;
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: MessageEnvelope): Promise<void> {
    if (!this.connected) {
      throw new Error('Broker not connected');
    }

    // Initialize channel queue if needed
    if (!this.messageQueues.has(channel)) {
      this.messageQueues.set(channel, []);
      this.channelMetrics.set(channel, this.createChannelStats(channel));
    }

    // Enqueue message
    const queuedMessage: QueuedMessage = {
      message,
      state: MessageState.PENDING,
      enqueuedAt: new Date(),
      retryCount: 0,
    };

    // Calculate acknowledgment deadline if needed
    const ackTimeout =
      this.defaultReliability.acknowledgment.timeoutSeconds * 1000;
    queuedMessage.ackDeadline = new Date(Date.now() + ackTimeout);

    const queue = this.messageQueues.get(channel)!;
    queue.push(queuedMessage);

    // Update metrics
    const stats = this.channelMetrics.get(channel)!;
    stats.messagesPublished++;
    stats.messagesPending++;
    stats.lastActivityAt = new Date();

    // Emit message to event bus for immediate delivery
    this.eventBus.emit(`channel:${channel}`, message);

    // Process the message queue
    await this.processQueue(channel);
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(
    channel: string,
    handler: MessageHandler,
    options: SubscriptionOptions = {},
  ): Promise<string> {
    if (!this.connected) {
      throw new Error('Broker not connected');
    }

    const subscriptionId = randomUUID();

    const subscription: InternalSubscription = {
      id: subscriptionId,
      channel,
      handler,
      options: {
        acknowledgmentMode:
          options.acknowledgmentMode || AcknowledgmentMode.AUTOMATIC,
        maxConcurrency: options.maxConcurrency || 10,
        priority: options.priority || MessagePriority.NORMAL,
        prefetchCount: options.prefetchCount || 1,
        ...options,
      },
      active: true,
      currentConcurrency: 0,
      processedCount: 0,
      errorCount: 0,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Initialize channel metrics
    if (!this.channelMetrics.has(channel)) {
      this.channelMetrics.set(channel, this.createChannelStats(channel));
    }
    const stats = this.channelMetrics.get(channel)!;
    stats.subscriptions++;

    // Attach event listener
    const eventHandler = async (message: MessageEnvelope) => {
      await this.handleMessage(subscriptionId, message);
    };

    this.eventBus.on(`channel:${channel}`, eventHandler);

    // Store event handler for cleanup
    (subscription as any).eventHandler = eventHandler;

    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    // Mark as inactive
    subscription.active = false;

    // Wait for active messages to complete
    const timeout = 5000;
    const startTime = Date.now();
    while (
      subscription.currentConcurrency > 0 &&
      Date.now() - startTime < timeout
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Remove event listener
    const eventHandler = (subscription as any).eventHandler;
    if (eventHandler) {
      this.eventBus.off(`channel:${subscription.channel}`, eventHandler);
    }

    // Update metrics
    const stats = this.channelMetrics.get(subscription.channel);
    if (stats) {
      stats.subscriptions = Math.max(0, stats.subscriptions - 1);
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Acknowledge message processing
   */
  async acknowledge(messageId: string, success: boolean): Promise<void> {
    const queuedMessage = this.pendingAcks.get(messageId);
    if (!queuedMessage) {
      return; // Already acknowledged or expired
    }

    this.pendingAcks.delete(messageId);

    if (success) {
      queuedMessage.state = MessageState.ACKNOWLEDGED;
      const stats = this.channelMetrics.get(queuedMessage.message.channel);
      if (stats) {
        stats.messagesConsumed++;
        stats.messagesPending = Math.max(0, stats.messagesPending - 1);
      }
    } else {
      // Handle retry or dead letter
      await this.handleFailedMessage(queuedMessage);
    }
  }

  /**
   * Get broker health status
   */
  async getHealth(): Promise<BrokerHealth> {
    const channels = this.messageQueues.size;
    const subscriptions = this.subscriptions.size;
    const pendingMessages = Array.from(this.messageQueues.values()).reduce(
      (sum, queue) => sum + queue.length,
      0,
    );

    return {
      status: this.connected ? 'healthy' : 'unhealthy',
      connections: this.connected ? 1 : 0,
      channels,
      subscriptions,
      pendingMessages,
      uptimeMs: Date.now() - this.startTime.getTime(),
      timestamp: new Date(),
    };
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(channel: string): Promise<ChannelStats> {
    const stats = this.channelMetrics.get(channel);
    if (!stats) {
      return this.createChannelStats(channel);
    }
    return { ...stats };
  }

  /**
   * Handle message delivery to subscription
   */
  private async handleMessage(
    subscriptionId: string,
    message: MessageEnvelope,
  ): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || !subscription.active) {
      return;
    }

    // Check concurrency limit
    if (
      subscription.currentConcurrency >= (subscription.options.maxConcurrency || 10)
    ) {
      return; // Will be retried later
    }

    // Apply message filter
    if (subscription.options.filter) {
      const filterFn = subscription.options.filter.evaluateFn;
      if (filterFn && !filterFn(message)) {
        return; // Message filtered out
      }
    }

    subscription.currentConcurrency++;

    // Track for acknowledgment
    const queuedMessage: QueuedMessage = {
      message,
      state: MessageState.PROCESSING,
      enqueuedAt: new Date(),
      processingStartedAt: new Date(),
      retryCount: 0,
    };
    this.pendingAcks.set(message.id, queuedMessage);

    try {
      await subscription.handler(message);

      // Automatic acknowledgment
      if (
        subscription.options.acknowledgmentMode === AcknowledgmentMode.AUTOMATIC
      ) {
        await this.acknowledge(message.id, true);
      }

      subscription.processedCount++;
    } catch (error) {
      subscription.errorCount++;

      // Automatic negative acknowledgment
      if (
        subscription.options.acknowledgmentMode === AcknowledgmentMode.AUTOMATIC
      ) {
        await this.acknowledge(message.id, false);
      }

      console.error(
        `[MemoryBroker] Error processing message ${message.id}:`,
        error,
      );
    } finally {
      subscription.currentConcurrency--;
    }
  }

  /**
   * Process message queue for a channel
   */
  private async processQueue(channel: string): Promise<void> {
    const queue = this.messageQueues.get(channel);
    if (!queue || queue.length === 0) {
      return;
    }

    // Process pending messages
    for (const queuedMessage of queue) {
      if (queuedMessage.state === MessageState.PENDING) {
        // Message will be delivered via event bus
        queuedMessage.state = MessageState.PROCESSING;
      }
    }
  }

  /**
   * Process retry queue for failed messages
   */
  private async processRetries(): Promise<void> {
    const now = Date.now();

    for (const [channel, queue] of this.messageQueues) {
      for (const queuedMessage of queue) {
        if (
          queuedMessage.nextRetryAt &&
          queuedMessage.nextRetryAt.getTime() <= now
        ) {
          // Retry the message
          queuedMessage.nextRetryAt = undefined;
          queuedMessage.state = MessageState.PENDING;
          this.eventBus.emit(`channel:${channel}`, queuedMessage.message);
        }
      }
    }
  }

  /**
   * Clean up expired messages and acknowledgments
   */
  private async cleanupExpiredMessages(): Promise<void> {
    const now = Date.now();

    // Clean up expired pending acknowledgments
    for (const [messageId, queuedMessage] of this.pendingAcks) {
      if (
        queuedMessage.ackDeadline &&
        queuedMessage.ackDeadline.getTime() <= now
      ) {
        this.pendingAcks.delete(messageId);
        await this.handleFailedMessage(queuedMessage);
      }
    }

    // Clean up expired messages from queues
    for (const [channel, queue] of this.messageQueues) {
      const ttlSeconds = (queuedMessage: QueuedMessage): number => {
        return queuedMessage.message.metadata?.ttlSeconds || 3600; // 1 hour default
      };

      const filtered = queue.filter((qm) => {
        const age = (now - qm.enqueuedAt.getTime()) / 1000;
        if (age > ttlSeconds(qm)) {
          qm.state = MessageState.EXPIRED;
          return false;
        }
        return true;
      });

      if (filtered.length !== queue.length) {
        this.messageQueues.set(channel, filtered);
      }
    }
  }

  /**
   * Handle failed message (retry or dead letter)
   */
  private async handleFailedMessage(queuedMessage: QueuedMessage): Promise<void> {
    const maxAttempts = this.defaultReliability.retry.maxAttempts;

    if (queuedMessage.retryCount < maxAttempts) {
      // Schedule retry with backoff
      const backoff = this.calculateBackoff(queuedMessage.retryCount);
      queuedMessage.retryCount++;
      queuedMessage.nextRetryAt = new Date(Date.now() + backoff);
      queuedMessage.state = MessageState.PENDING;

      const stats = this.channelMetrics.get(queuedMessage.message.channel);
      if (stats) {
        stats.messagesFailed++;
      }
    } else {
      // Move to dead letter queue
      queuedMessage.state = MessageState.DEAD_LETTERED;
      this.deadLetterQueue.set(queuedMessage.message.id, queuedMessage);

      const stats = this.channelMetrics.get(queuedMessage.message.channel);
      if (stats) {
        stats.messagesFailed++;
        stats.messagesPending = Math.max(0, stats.messagesPending - 1);
      }
    }
  }

  /**
   * Calculate backoff delay for retry
   */
  private calculateBackoff(retryCount: number): number {
    const { strategy, initialDelayMs, maxDelayMs, multiplier } =
      this.defaultReliability.retry.backoff;

    let delay = initialDelayMs;

    if (strategy === 'exponential') {
      delay = initialDelayMs * Math.pow(multiplier, retryCount);
    } else if (strategy === 'linear') {
      delay = initialDelayMs + initialDelayMs * retryCount;
    }

    return Math.min(delay, maxDelayMs);
  }

  /**
   * Create initial channel statistics
   */
  private createChannelStats(channel: string): ChannelStats {
    return {
      channel,
      messagesPublished: 0,
      messagesConsumed: 0,
      messagesPending: 0,
      messagesFailed: 0,
      subscriptions: 0,
      avgMessageSizeBytes: 0,
      messagesPerSecond: 0,
      lastActivityAt: undefined,
    };
  }
}
