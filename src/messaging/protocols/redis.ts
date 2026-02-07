/**
 * OSSA v0.3.3 Messaging Extension - Redis Transport
 * Redis-based message broker for production use
 */

import { randomUUID } from 'crypto';
import {
  Message,
  MessageHandler,
  Subscription,
  SubscriptionHandle,
  RedisTransportConfig,
} from '../types.js';
import { AbstractMessageBroker } from '../broker.js';
import { ChannelManager } from '../channels.js';

/**
 * Redis message broker
 * Uses Redis Pub/Sub for broadcast and Redis Streams for persistent queues
 *
 * Note: This is a reference implementation. In production, use actual Redis client.
 * Install: npm install redis@^4.0.0
 */
export class RedisMessageBroker extends AbstractMessageBroker {
  private config: RedisTransportConfig;
  private client: any; // Redis client (would be RedisClientType in production)
  private subscriber: any; // Separate client for subscriptions
  private activeSubscriptions: Map<string, SubscriptionHandle>;
  private connected: boolean;

  constructor(config: Record<string, unknown>) {
    super(new ChannelManager());
    this.config = this.validateConfig(config);
    this.activeSubscriptions = new Map();
    this.connected = false;
  }

  /**
   * Initialize Redis connections
   */
  private async connect(): Promise<void> {
    if (this.connected) return;

    try {
      // In production, use actual Redis client:
      // const redis = await import('redis');
      // this.client = redis.createClient({ url: this.config.url });
      // this.subscriber = this.client.duplicate();
      // await this.client.connect();
      // await this.subscriber.connect();

      // For reference implementation, we simulate the connection
      this.client = this.createMockRedisClient();
      this.subscriber = this.createMockRedisClient();

      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Redis: ${error}`);
    }
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: Message): Promise<void> {
    await this.connect();
    this.validateMessage(message);

    const key = this.getChannelKey(channel);
    const serialized = JSON.stringify(message);

    try {
      // For persistent messages, use Redis Streams
      if (message.qos?.persistent) {
        await this.publishToStream(key, message);
      } else {
        // For non-persistent, use Pub/Sub
        await this.publishToPubSub(key, serialized);
      }
    } catch (error) {
      throw new Error(`Failed to publish message: ${error}`);
    }
  }

  /**
   * Subscribe to messages on a channel
   */
  async subscribe(
    subscription: Subscription,
    handler: MessageHandler
  ): Promise<SubscriptionHandle> {
    await this.connect();

    const handle: SubscriptionHandle = {
      id: randomUUID(),
      channel: subscription.channel,
      unsubscribe: async () => {
        await this.unsubscribe(handle);
      },
    };

    this.activeSubscriptions.set(handle.id, handle);

    // Subscribe using pattern matching for wildcards
    const pattern = this.channelToRedisPattern(subscription.channel);
    await this.subscribePattern(pattern, subscription, handler);

    return handle;
  }

  /**
   * Acknowledge message receipt
   */
  async acknowledge(messageId: string): Promise<void> {
    await this.connect();

    // In production: XACK stream group messageId
    // For reference implementation, we simulate acknowledgment
    console.log(`Acknowledged message: ${messageId}`);
  }

  /**
   * Negative acknowledge (reject) a message
   */
  async nack(messageId: string, requeue = true): Promise<void> {
    await this.connect();

    if (!requeue) {
      // Move to dead letter queue
      // In production: use XADD to DLQ stream
      console.log(`Moved message to DLQ: ${messageId}`);
    }
    // If requeue, message stays in pending list for redelivery
  }

  /**
   * Close the broker connection
   */
  async close(): Promise<void> {
    if (!this.connected) return;

    try {
      // In production: await this.client.quit(); await this.subscriber.quit();
      this.connected = false;
      this.activeSubscriptions.clear();
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }

  /**
   * Publish to Redis Pub/Sub
   */
  private async publishToPubSub(
    channel: string,
    message: string
  ): Promise<void> {
    // In production: await this.client.publish(channel, message);
    console.log(`Publishing to ${channel}:`, message);
  }

  /**
   * Publish to Redis Stream
   */
  private async publishToStream(
    streamKey: string,
    message: Message
  ): Promise<void> {
    // In production:
    // await this.client.xAdd(streamKey, '*', {
    //   data: JSON.stringify(message),
    //   id: message.id,
    //   type: message.type,
    //   timestamp: message.timestamp,
    // });

    console.log(`Publishing to stream ${streamKey}:`, message.id);
  }

  /**
   * Subscribe to a pattern
   */
  private async subscribePattern(
    pattern: string,
    subscription: Subscription,
    handler: MessageHandler
  ): Promise<void> {
    // In production: use PSUBSCRIBE for pub/sub or consumer groups for streams
    // this.subscriber.pSubscribe(pattern, async (message, channel) => {
    //   const msg = JSON.parse(message);
    //   if (this.matchesFilter(msg, subscription.filter)) {
    //     await handler(msg);
    //   }
    // });

    console.log(`Subscribed to pattern: ${pattern}`);
  }

  /**
   * Convert channel pattern to Redis pattern
   */
  private channelToRedisPattern(channel: string): string {
    return channel.replace(/\*/g, '*').replace(/#/g, '*');
  }

  /**
   * Get Redis key for channel
   */
  private getChannelKey(channel: string): string {
    const prefix = this.config.keyPrefix || 'ossa:messages:';
    return `${prefix}${channel}`;
  }

  /**
   * Validate configuration
   */
  private validateConfig(
    config: Record<string, unknown>
  ): RedisTransportConfig {
    if (!config.url || typeof config.url !== 'string') {
      throw new Error('Redis URL is required');
    }

    return {
      url: config.url,
      db: (config.db as number) || 0,
      keyPrefix: (config.keyPrefix as string) || 'ossa:messages:',
      connectionTimeout: (config.connectionTimeout as number) || 5000,
      retryStrategy:
        (config.retryStrategy as RedisTransportConfig['retryStrategy']) || {
          maxRetries: 3,
          backoff: 'exponential',
        },
    };
  }

  /**
   * Create mock Redis client for reference implementation
   * In production, remove this and use actual Redis client
   */
  private createMockRedisClient(): any {
    return {
      publish: async (channel: string, message: string) => {
        console.log(
          `[Mock Redis] PUBLISH ${channel}: ${message.substring(0, 100)}...`
        );
      },
      xAdd: async (key: string, id: string, fields: Record<string, string>) => {
        console.log(`[Mock Redis] XADD ${key} ${id}:`, fields);
      },
      pSubscribe: async (
        pattern: string,
        _callback: (message: string, channel: string) => void
      ) => {
        console.log(`[Mock Redis] PSUBSCRIBE ${pattern}`);
      },
      xAck: async (key: string, group: string, id: string) => {
        console.log(`[Mock Redis] XACK ${key} ${group} ${id}`);
      },
      quit: async () => {
        console.log('[Mock Redis] QUIT');
      },
    };
  }

  /**
   * Get broker statistics (for monitoring)
   */
  async getStats(): Promise<{
    connected: boolean;
    activeSubscriptions: number;
    url: string;
  }> {
    return {
      connected: this.connected,
      activeSubscriptions: this.activeSubscriptions.size,
      url: this.config.url,
    };
  }
}
