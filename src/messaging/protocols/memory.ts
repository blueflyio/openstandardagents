/**
 * OSSA v0.3.1 Messaging Extension - In-Memory Transport
 * In-memory message broker for development and testing
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import {
  Message,
  MessageHandler,
  Subscription,
  SubscriptionConfig,
  SubscriptionHandle,
  MemoryTransportConfig,
} from '../types.js';
import { AbstractMessageBroker } from '../broker.js';
import { ChannelManager } from '../channels.js';

interface StoredMessage {
  message: Message;
  timestamp: number;
  acknowledged: boolean;
}

interface ActiveSubscription extends SubscriptionHandle {
  subscription: Subscription;
  handler: MessageHandler;
  pattern: RegExp;
}

/**
 * In-memory message broker
 * Non-persistent, single-process only
 */
export class MemoryMessageBroker extends AbstractMessageBroker {
  private eventBus: EventEmitter;
  private messages: Map<string, StoredMessage[]>;
  private activeSubscriptions: Map<string, ActiveSubscription>;
  private config: MemoryTransportConfig;
  private pruneTimer?: NodeJS.Timeout;

  constructor(config: Record<string, unknown> = {}) {
    super(new ChannelManager());
    this.eventBus = new EventEmitter();
    this.eventBus.setMaxListeners(1000); // Support many subscriptions
    this.messages = new Map();
    this.activeSubscriptions = new Map();
    this.config = {
      maxMessages: (config.maxMessages as number) || 10000,
      pruneInterval: (config.pruneInterval as number) || 60000,
    };

    // Start periodic pruning of old messages
    this.startPruning();
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: Message): Promise<void> {
    this.validateMessage(message);

    // Store message
    const stored: StoredMessage = {
      message,
      timestamp: Date.now(),
      acknowledged: false,
    };

    if (!this.messages.has(channel)) {
      this.messages.set(channel, []);
    }

    const channelMessages = this.messages.get(channel)!;
    channelMessages.push(stored);

    // Enforce max messages limit
    if (channelMessages.length > this.config.maxMessages!) {
      channelMessages.shift(); // Remove oldest message
    }

    // Emit to matching subscribers
    await this.deliverMessage(channel, message);
  }

  /**
   * Subscribe to messages on a channel
   */
  async subscribe(subscription: Subscription, handler: MessageHandler): Promise<SubscriptionHandle> {
    const handle: ActiveSubscription = {
      id: randomUUID(),
      channel: subscription.channel,
      subscription,
      handler,
      pattern: this.channelPatternToRegex(subscription.channel),
      unsubscribe: async () => {
        await this.unsubscribe(handle);
      },
    };

    this.activeSubscriptions.set(handle.id, handle);

    // Add to channel subscriptions map
    if (!this.subscriptions.has(subscription.channel)) {
      this.subscriptions.set(subscription.channel, new Set());
    }
    this.subscriptions.get(subscription.channel)!.add(handle);

    return handle;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(handle: SubscriptionHandle): Promise<void> {
    // Remove from active subscriptions
    this.activeSubscriptions.delete(handle.id);
    
    // Remove from channel subscriptions (base class handles this)
    await super.unsubscribe(handle);
  }

  /**
   * Acknowledge message receipt
   */
  async acknowledge(messageId: string): Promise<void> {
    // Find and mark message as acknowledged
    for (const channelMessages of this.messages.values()) {
      const message = channelMessages.find((m) => m.message.id === messageId);
      if (message) {
        message.acknowledged = true;
        return;
      }
    }
  }

  /**
   * Negative acknowledge (reject) a message
   */
  async nack(messageId: string, requeue = true): Promise<void> {
    if (!requeue) {
      // Remove message from storage
      for (const [channel, channelMessages] of this.messages.entries()) {
        const index = channelMessages.findIndex((m) => m.message.id === messageId);
        if (index !== -1) {
          const [message] = channelMessages.splice(index, 1);

          // Send to DLQ if configured
          const dlqChannel = `${channel}.dlq`;
          await this.publish(dlqChannel, message.message);
          return;
        }
      }
    }
    // If requeue is true, message stays in storage for redelivery
  }

  /**
   * Close the broker connection
   */
  async close(): Promise<void> {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }
    this.eventBus.removeAllListeners();
    this.messages.clear();
    this.activeSubscriptions.clear();
    this.subscriptions.clear();
  }

  /**
   * Deliver message to matching subscribers
   */
  private async deliverMessage(channel: string, message: Message): Promise<void> {
    const matchingSubscriptions = this.findMatchingSubscriptions(channel);

    for (const sub of matchingSubscriptions) {
      // Check filter
      if (!this.matchesFilter(message, sub.subscription.filter)) {
        continue;
      }

      // Execute handler with error handling
      try {
        await this.executeHandler(sub, message);
      } catch (error) {
        console.error(`Error in message handler for channel ${channel}:`, error);

        // Handle retry logic
        if (sub.subscription.config?.retryOnError) {
          await this.handleRetry(sub, message, error as Error);
        }
      }
    }
  }

  /**
   * Execute message handler
   */
  private async executeHandler(sub: ActiveSubscription, message: Message): Promise<void> {
    const timeout = sub.subscription.config?.timeout || 30000;

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Handler timeout')), timeout);
    });

    // Execute handler with timeout
    await Promise.race([
      sub.handler(message),
      timeoutPromise,
    ]);

    // Auto-acknowledge if configured
    if (sub.subscription.config?.autoAcknowledge) {
      await this.acknowledge(message.id);
    }
  }

  /**
   * Handle message retry
   */
  private async handleRetry(sub: ActiveSubscription, message: Message, error: Error): Promise<void> {
    const maxRetries = sub.subscription.config?.maxRetries || 3;
    const retryCount = parseInt(String(message.metadata?.headers?.['x-retry-count'] || '0'), 10) || 0;

    if (retryCount < maxRetries) {
      // Calculate backoff delay
      const backoff = sub.subscription.config?.retryBackoff;
      const delay = this.calculateBackoffDelay(retryCount, backoff);

      // Schedule retry
      setTimeout(async () => {
        const retryMessage = {
          ...message,
          metadata: {
            ...message.metadata,
            headers: {
              ...message.metadata?.headers,
              'x-retry-count': String(retryCount + 1),
            },
          },
        };
        await this.deliverMessage(message.channel, retryMessage);
      }, delay);
    } else {
      // Max retries exceeded, send to DLQ
      const dlqChannel = `${message.channel}.dlq`;
      await this.publish(dlqChannel, message);
    }
  }

  /**
   * Calculate backoff delay for retries
   */
  private calculateBackoffDelay(retryCount: number, backoff?: SubscriptionConfig['retryBackoff']): number {
    if (!backoff || backoff.strategy === 'none') {
      return 0;
    }

    const initialDelay = backoff.initialDelay || 1000;
    const maxDelay = backoff.maxDelay || 30000;

    let delay: number;
    if (backoff.strategy === 'linear') {
      delay = initialDelay * (retryCount + 1);
    } else {
      // exponential
      const multiplier = backoff.multiplier || 2;
      delay = initialDelay * Math.pow(multiplier, retryCount);
    }

    return Math.min(delay, maxDelay);
  }

  /**
   * Find subscriptions matching a channel
   */
  private findMatchingSubscriptions(channel: string): ActiveSubscription[] {
    const matching: ActiveSubscription[] = [];

    for (const sub of this.activeSubscriptions.values()) {
      if (sub.pattern.test(channel)) {
        matching.push(sub);
      }
    }

    // Sort by priority
    return matching.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.subscription.priority || 'normal'];
      const bPriority = priorityOrder[b.subscription.priority || 'normal'];
      return bPriority - aPriority;
    });
  }

  /**
   * Convert channel pattern to regex
   */
  private channelPatternToRegex(pattern: string): RegExp {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/#/g, '.*');
    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Start periodic pruning of old messages
   */
  private startPruning(): void {
    this.pruneTimer = setInterval(() => {
      this.pruneOldMessages();
    }, this.config.pruneInterval);
  }

  /**
   * Prune old acknowledged messages
   */
  private pruneOldMessages(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [channel, messages] of this.messages.entries()) {
      const filtered = messages.filter((m) => {
        // Keep unacknowledged messages
        if (!m.acknowledged) return true;
        // Keep recent messages
        return (now - m.timestamp) < maxAge;
      });

      if (filtered.length !== messages.length) {
        this.messages.set(channel, filtered);
      }
    }
  }

  /**
   * Get statistics (for testing/debugging)
   */
  getStats(): {
    channels: number;
    totalMessages: number;
    activeSubscriptions: number;
  } {
    let totalMessages = 0;
    for (const messages of this.messages.values()) {
      totalMessages += messages.length;
    }

    return {
      channels: this.messages.size,
      totalMessages,
      activeSubscriptions: this.activeSubscriptions.size,
    };
  }
}
