/**
 * OSSA v0.3.1 Messaging Extension - Message Broker
 * Core message broker interface and base implementation
 */

import { randomUUID } from 'crypto';
import {
  Message,
  MessageBroker,
  MessageHandler,
  Subscription,
  SubscriptionHandle,
  Channel,
  DeliveryReceipt,
} from './types.js';
import { ChannelManager } from './channels.js';

/**
 * Abstract base class for message brokers
 */
export abstract class AbstractMessageBroker implements MessageBroker {
  protected channelManager: ChannelManager;
  protected subscriptions: Map<string, Set<SubscriptionHandle>>;

  constructor(channelManager: ChannelManager) {
    this.channelManager = channelManager;
    this.subscriptions = new Map();
  }

  /**
   * Publish a message to a channel
   */
  abstract publish(channel: string, message: Message): Promise<void>;

  /**
   * Subscribe to messages on a channel
   */
  abstract subscribe(subscription: Subscription, handler: MessageHandler): Promise<SubscriptionHandle>;

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(handle: SubscriptionHandle): Promise<void> {
    const channelSubs = this.subscriptions.get(handle.channel);
    if (channelSubs) {
      channelSubs.delete(handle);
      if (channelSubs.size === 0) {
        this.subscriptions.delete(handle.channel);
      }
    }
  }

  /**
   * Create a new channel
   */
  async createChannel(channel: Channel): Promise<void> {
    await this.channelManager.create(channel);
  }

  /**
   * Delete a channel
   */
  async deleteChannel(channelName: string): Promise<void> {
    await this.channelManager.delete(channelName);
    this.subscriptions.delete(channelName);
  }

  /**
   * Acknowledge message receipt
   */
  abstract acknowledge(messageId: string): Promise<void>;

  /**
   * Negative acknowledge (reject) a message
   */
  abstract nack(messageId: string, requeue?: boolean): Promise<void>;

  /**
   * Close the broker connection
   */
  abstract close(): Promise<void>;

  /**
   * Validate message format
   */
  protected validateMessage(message: Message): void {
    if (!message.id) {
      throw new Error('Message ID is required');
    }
    if (!message.channel) {
      throw new Error('Message channel is required');
    }
    if (!message.sender) {
      throw new Error('Message sender is required');
    }
    if (!message.timestamp) {
      throw new Error('Message timestamp is required');
    }
    if (!message.type) {
      throw new Error('Message type is required');
    }
    if (!message.payload) {
      throw new Error('Message payload is required');
    }

    // Validate channel name format
    const channelPattern = /^agents\.(([a-z0-9-]+|\*)\\.)+([a-z0-9-]+|#)$/;
    if (!channelPattern.test(message.channel)) {
      throw new Error(`Invalid channel name: ${message.channel}`);
    }

    // Validate sender format
    const senderPattern = /^ossa:\/\/agents\/[a-z0-9-]+$/;
    if (!senderPattern.test(message.sender)) {
      throw new Error(`Invalid sender format: ${message.sender}`);
    }
  }

  /**
   * Check if message matches subscription filter
   */
  protected matchesFilter(message: Message, filter?: Record<string, unknown>): boolean {
    if (!filter) {
      return true;
    }

    for (const [key, value] of Object.entries(filter)) {
      const messagePath = this.getNestedValue(message as Record<string, unknown>, key);
      if (messagePath !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object using dot notation
   */
  protected getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  /**
   * Create a delivery receipt
   */
  protected createDeliveryReceipt(
    message: Message,
    status: DeliveryReceipt['status'],
    error?: DeliveryReceipt['error']
  ): DeliveryReceipt {
    return {
      messageId: message.id,
      receiptId: randomUUID(),
      status,
      timestamp: new Date().toISOString(),
      channel: message.channel,
      error,
    };
  }

  /**
   * Check if channel matches pattern (supports wildcards)
   */
  protected channelMatches(channel: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/#/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(channel);
  }
}

/**
 * Broker factory for creating broker instances
 */
export class BrokerFactory {
  /**
   * Create a message broker based on transport type
   */
  static async create(type: 'redis' | 'memory', config: Record<string, unknown>): Promise<MessageBroker> {
    switch (type) {
      case 'redis':
        const { RedisMessageBroker } = await import('./protocols/redis.js');
        return new RedisMessageBroker(config);
      case 'memory':
        const { MemoryMessageBroker } = await import('./protocols/memory.js');
        return new MemoryMessageBroker(config);
      default:
        throw new Error(`Unsupported transport type: ${type}`);
    }
  }
}
