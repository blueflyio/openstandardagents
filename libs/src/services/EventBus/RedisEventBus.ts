/**
 * OSSA v0.1.9 Redis Event Bus
 * Production-ready event bus implementation for cross-project communication
 * and 100-agent orchestration with performance optimizations
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import type { Cluster } from 'ioredis';
import {
  EventBusConfig,
  EventPayload,
  EventHandler,
  EventMetadata,
  EventBusMetrics,
  EventBusStatus,
  SubscriptionOptions,
  PublishOptions,
  EventPriority,
  DEFAULT_EVENT_BUS_CONFIG,
  EventStream,
  StreamConfig,
  CrossProjectEventContract
} from './types.js';

export interface RedisEventBusEvents {
  'event:published': (eventType: string, payload: EventPayload) => void;
  'event:consumed': (eventType: string, payload: EventPayload) => void;
  'event:failed': (eventType: string, payload: EventPayload, error: Error) => void;
  'subscription:created': (eventType: string, options: SubscriptionOptions) => void;
  'subscription:cancelled': (eventType: string) => void;
  'metrics:updated': (metrics: EventBusMetrics) => void;
  'health:status:changed': (oldStatus: string, newStatus: string) => void;
  'error': (error: Error) => void;
}

export class RedisEventBus extends EventEmitter {
  private config: EventBusConfig;
  private redis!: Redis | Cluster;
  private publisher!: Redis | Cluster;
  private subscriber!: Redis | Cluster;

  private subscriptions = new Map<string, Set<EventHandler>>();
  private streams = new Map<string, EventStream>();
  private contracts = new Map<string, CrossProjectEventContract>();

  private metrics: EventBusMetrics = {
    eventsPublished: 0,
    eventsConsumed: 0,
    eventsInFlight: 0,
    eventsFailed: 0,
    eventsInDLQ: 0,
    avgProcessingTime: 0,
    peakEventsPerSecond: 0,
    currentThroughput: 0,
    errorRate: 0,
    connectionPoolUtilization: 0
  };

  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private processingTimes: number[] = [];
  private lastMetricsReset = Date.now();

  constructor(config: Partial<EventBusConfig> = {}) {
    super();
    this.config = { ...DEFAULT_EVENT_BUS_CONFIG, ...config };
    this.setupRedisConnections();
    this.startMonitoring();
  }

  /**
   * Initialize Redis connections with cluster support
   */
  private setupRedisConnections(): void {
    const { redis } = this.config;

    const redisOptions = {
      host: redis.host,
      port: redis.port,
      password: redis.password,
      db: redis.db || 0,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };

    if (redis.cluster) {
      // Redis Cluster setup for production scalability
      this.redis = new Redis.Cluster(redis.cluster.nodes, {
        ...redis.cluster.options,
        redisOptions
      });
      this.publisher = new Redis.Cluster(redis.cluster.nodes, {
        ...redis.cluster.options,
        redisOptions
      });
      this.subscriber = new Redis.Cluster(redis.cluster.nodes, {
        ...redis.cluster.options,
        redisOptions
      });
    } else {
      // Single Redis instance
      this.redis = new Redis(redisOptions);
      this.publisher = new Redis(redisOptions);
      this.subscriber = new Redis(redisOptions);
    }

    this.setupRedisEventHandlers();
  }

  /**
   * Setup Redis connection event handlers
   */
  private setupRedisEventHandlers(): void {
    [this.redis, this.publisher, this.subscriber].forEach(client => {
      client.on('error', (error: Error) => {
        this.emit('error', new Error(`Redis connection error: ${error.message}`));
      });

      client.on('connect', () => {
        console.log('Redis connection established');
      });

      client.on('ready', () => {
        console.log('Redis client ready');
      });

      client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.redis.connect(),
        this.publisher.connect(),
        this.subscriber.connect()
      ]);

      // Test connections
      await Promise.all([
        this.redis.ping(),
        this.publisher.ping(),
        this.subscriber.ping()
      ]);

      console.log('✅ Redis Event Bus connected successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', new Error(`Failed to connect to Redis: ${err.message}`));
      throw err;
    }
  }

  /**
   * Publish an event with optimized performance
   */
  async publish<T>(
    eventType: string,
    data: T,
    options: PublishOptions = {}
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const eventId = uuidv4();
      const metadata: EventMetadata = {
        id: eventId,
        type: eventType,
        source: this.getServiceName(),
        timestamp: new Date(),
        version: '1.0.0',
        priority: options.priority || this.config.defaults.priority,
        ttl: options.ttl || this.config.defaults.ttl,
        retry: options.retry || this.config.defaults.retry,
        correlationId: uuidv4()
      };

      const payload: EventPayload<T> = { metadata, data };
      const serialized = JSON.stringify(payload);

      // Use Redis Streams for high-performance event publishing
      const streamKey = this.getStreamKey(eventType);

      // Publish to stream with automatic partitioning for load balancing
      const messageId = await this.publisher.xadd(
        streamKey,
        'MAXLEN', '~', this.getStreamMaxLength(eventType),
        '*',
        'payload', serialized,
        'priority', metadata.priority,
        'source', metadata.source
      );

      // Update metrics
      this.metrics.eventsPublished++;
      this.updateProcessingTime(Date.now() - startTime);

      this.emit('event:published', eventType, payload);
      return eventId;

    } catch (error) {
      this.metrics.eventsFailed++;
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('event:failed', eventType, { metadata: {} as any, data }, err);
      throw err;
    }
  }

  /**
   * Subscribe to events with consumer group support for load balancing
   */
  async subscribe<T>(
    eventType: string,
    handler: EventHandler<T>['handler'],
    options: SubscriptionOptions = {}
  ): Promise<void> {
    try {
      const streamKey = this.getStreamKey(eventType);
      const consumerGroup = options.group || 'default';
      const consumerName = `${this.getServiceName()}-${uuidv4().slice(0, 8)}`;

      // Create consumer group if it doesn't exist
      try {
        await this.subscriber.xgroup(
          'CREATE', streamKey, consumerGroup, '0', 'MKSTREAM'
        );
      } catch (error) {
        // Group might already exist, continue
      }

      // Add handler to subscriptions
      if (!this.subscriptions.has(eventType)) {
        this.subscriptions.set(eventType, new Set());
      }
      this.subscriptions.get(eventType)!.add({ handler, options: undefined });

      // Start consuming events
      this.startConsumer(streamKey, consumerGroup, consumerName, handler, options);

      this.emit('subscription:created', eventType, options);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', new Error(`Failed to subscribe to ${eventType}: ${err.message}`));
      throw err;
    }
  }

  /**
   * Start consuming events from Redis Stream
   */
  private async startConsumer<T>(
    streamKey: string,
    consumerGroup: string,
    consumerName: string,
    handler: (payload: EventPayload<T>) => Promise<void> | void,
    options: SubscriptionOptions
  ): Promise<void> {
    const consumeEvents = async () => {
      try {
        // Read from consumer group with blocking
        const results = await this.subscriber.xreadgroup(
          'GROUP', consumerGroup, consumerName,
          'COUNT', this.config.performance.batchSize,
          'BLOCK', 1000, // Block for 1 second
          'STREAMS', streamKey, '>'
        );

        if (results && results.length > 0) {
          const [stream, messages] = results[0] as [string, Array<[string, string[]]>];

          // Process messages in batch for performance
          await this.processBatch(messages, handler, streamKey, consumerGroup);
        }

        // Continue consuming
        setImmediate(() => consumeEvents());

      } catch (error) {
        if (error instanceof Error && error.message.includes('NOGROUP')) {
          // Consumer group was deleted, recreate it
          setTimeout(() => consumeEvents(), 5000);
          return;
        }

        this.emit('error', error instanceof Error ? error : new Error(String(error)));

        // Retry after delay
        setTimeout(() => consumeEvents(), 5000);
      }
    };

    // Start consuming
    consumeEvents();
  }

  /**
   * Process batch of events for optimal performance
   */
  private async processBatch<T>(
    messages: Array<[string, string[]]>,
    handler: (payload: EventPayload<T>) => Promise<void> | void,
    streamKey: string,
    consumerGroup: string
  ): Promise<void> {
    const pipeline = this.redis.pipeline();
    const processedIds: string[] = [];

    try {
      // Process all messages in parallel
      const processPromises = messages.map(async ([messageId, fields]) => {
        const startTime = Date.now();

        try {
          // Parse message
          const fieldsObj = this.parseStreamFields(fields);
          const payload: EventPayload<T> = JSON.parse(fieldsObj.payload);

          // Execute handler
          await handler(payload);

          // Track successful processing
          processedIds.push(messageId);
          this.metrics.eventsConsumed++;
          this.updateProcessingTime(Date.now() - startTime);

          this.emit('event:consumed', payload.metadata.type, payload);

        } catch (error) {
          this.metrics.eventsFailed++;

          // Handle failed message based on retry configuration
          await this.handleFailedMessage(messageId, fields, error, streamKey, consumerGroup);

          const payload = { metadata: { type: 'unknown' }, data: null } as EventPayload<T>;
          this.emit('event:failed', payload.metadata.type, payload,
            error instanceof Error ? error : new Error(String(error)));
        }
      });

      await Promise.allSettled(processPromises);

      // Acknowledge processed messages in batch
      if (processedIds.length > 0) {
        pipeline.xack(streamKey, consumerGroup, ...processedIds);
        await pipeline.exec();
      }

    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Handle failed message processing with retry logic
   */
  private async handleFailedMessage(
    messageId: string,
    fields: string[],
    error: unknown,
    streamKey: string,
    consumerGroup: string
  ): Promise<void> {
    try {
      const fieldsObj = this.parseStreamFields(fields);
      const payload = JSON.parse(fieldsObj.payload);
      const retryCount = parseInt(fieldsObj.retryCount || '0');
      const maxRetries = payload.metadata.retry?.maxAttempts || this.config.defaults.retry.maxAttempts;

      if (retryCount < maxRetries) {
        // Schedule retry with exponential backoff
        const delay = this.calculateRetryDelay(retryCount, payload.metadata.retry);

        setTimeout(async () => {
          const retryStreamKey = this.getRetryStreamKey(streamKey);
          await this.publisher.xadd(
            retryStreamKey,
            '*',
            'payload', fieldsObj.payload,
            'originalMessageId', messageId,
            'retryCount', String(retryCount + 1),
            'error', error instanceof Error ? error.message : String(error)
          );
        }, delay);

      } else {
        // Move to dead letter queue
        if (this.config.deadLetterQueue.enabled) {
          await this.moveToDeadLetterQueue(messageId, fields, error);
        }
      }

      // Acknowledge the original message to prevent redelivery
      await this.redis.xack(streamKey, consumerGroup, messageId);

    } catch (dlqError) {
      this.emit('error', dlqError instanceof Error ? dlqError : new Error(String(dlqError)));
    }
  }

  /**
   * Move failed message to dead letter queue
   */
  private async moveToDeadLetterQueue(
    messageId: string,
    fields: string[],
    error: unknown
  ): Promise<void> {
    try {
      const dlqKey = `${this.config.deadLetterQueue.keyPattern}:${Date.now()}`;
      const fieldsObj = this.parseStreamFields(fields);

      await this.redis.hset(dlqKey, {
        originalMessageId: messageId,
        payload: fieldsObj.payload,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        retryCount: fieldsObj.retryCount || '0'
      });

      await this.redis.expire(dlqKey, this.config.deadLetterQueue.retention);
      this.metrics.eventsInDLQ++;

    } catch (dlqError) {
      this.emit('error', dlqError instanceof Error ? dlqError : new Error(String(dlqError)));
    }
  }

  /**
   * Create event stream with configuration
   */
  async createStream(name: string, config: StreamConfig): Promise<EventStream> {
    try {
      const streamKey = this.getStreamKey(name);

      // Create stream with initial message
      await this.publisher.xadd(streamKey, '*', 'init', 'stream_created');

      // Configure stream
      if (config.retention === 'count' || config.retention === 'both') {
        await this.publisher.xtrim(streamKey, 'MAXLEN', config.retentionValue);
      }

      const stream: EventStream = {
        name,
        config,
        stats: {
          messageCount: 0,
          sizeBytes: 0,
          firstMessage: new Date(),
          lastMessage: new Date(),
          consumerGroups: 0,
          activeConsumers: 0
        }
      };

      this.streams.set(name, stream);
      return stream;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', new Error(`Failed to create stream ${name}: ${err.message}`));
      throw err;
    }
  }

  /**
   * Register cross-project event contract
   */
  async registerContract(contract: CrossProjectEventContract): Promise<void> {
    try {
      const contractKey = `${this.config.redis.keyPrefix}:contracts:${contract.name}`;
      const contractData = JSON.stringify(contract);

      await this.redis.set(contractKey, contractData);
      this.contracts.set(contract.name, contract);

      console.log(`✅ Event contract registered: ${contract.name} v${contract.version}`);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', new Error(`Failed to register contract ${contract.name}: ${err.message}`));
      throw err;
    }
  }

  /**
   * Validate event against contract
   */
  private validateEventContract(eventType: string, payload: any): boolean {
    // Find applicable contract
    for (const contract of this.contracts.values()) {
      if (contract.eventTypes.includes(eventType)) {
        // Perform JSON schema validation
        // Implementation would use ajv or similar JSON schema validator
        return true; // Simplified for now
      }
    }
    return true; // No contract found, allow event
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): EventBusMetrics {
    const now = Date.now();
    const timeWindow = (now - this.lastMetricsReset) / 1000; // seconds

    return {
      ...this.metrics,
      currentThroughput: (this.metrics.eventsConsumed + this.metrics.eventsPublished) / timeWindow,
      errorRate: this.metrics.eventsFailed / Math.max(1, this.metrics.eventsPublished) * 100,
      avgProcessingTime: this.processingTimes.length > 0
        ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
        : 0
    };
  }

  /**
   * Get event bus health status
   */
  async getStatus(): Promise<EventBusStatus> {
    try {
      const redisInfo = await this.redis.ping();
      const metrics = this.getMetrics();

      const status: EventBusStatus = {
        status: redisInfo === 'PONG' && metrics.errorRate < 10 ? 'healthy' :
                metrics.errorRate < 25 ? 'degraded' : 'unhealthy',
        redis: {
          connected: redisInfo === 'PONG',
          cluster: this.redis instanceof Redis.Cluster
        },
        subscriptions: this.subscriptions.size,
        streams: this.streams.size,
        metrics,
        lastHealthCheck: new Date()
      };

      return status;

    } catch (error) {
      return {
        status: 'unhealthy',
        redis: { connected: false },
        subscriptions: this.subscriptions.size,
        streams: this.streams.size,
        metrics: this.metrics,
        lastHealthCheck: new Date()
      };
    }
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(eventType: string, handler?: EventHandler['handler']): Promise<void> {
    try {
      if (handler) {
        const handlers = this.subscriptions.get(eventType);
        if (handlers) {
          handlers.forEach(h => {
            if (h.handler === handler) {
              handlers.delete(h);
            }
          });
          if (handlers.size === 0) {
            this.subscriptions.delete(eventType);
          }
        }
      } else {
        this.subscriptions.delete(eventType);
      }

      this.emit('subscription:cancelled', eventType);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', new Error(`Failed to unsubscribe from ${eventType}: ${err.message}`));
      throw err;
    }
  }

  /**
   * Clean shutdown
   */
  async disconnect(): Promise<void> {
    try {
      // Stop monitoring
      if (this.metricsInterval) clearInterval(this.metricsInterval);
      if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);

      // Close all subscriptions
      this.subscriptions.clear();

      // Disconnect Redis clients
      await Promise.all([
        this.redis.quit(),
        this.publisher.quit(),
        this.subscriber.quit()
      ]);

      console.log('✅ Redis Event Bus disconnected successfully');

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', new Error(`Error during disconnect: ${err.message}`));
      throw err;
    }
  }

  // Private utility methods

  private startMonitoring(): void {
    if (this.config.monitoring.enabled) {
      this.metricsInterval = setInterval(() => {
        this.emit('metrics:updated', this.getMetrics());
      }, this.config.monitoring.metricsInterval);

      this.healthCheckInterval = setInterval(async () => {
        const status = await this.getStatus();
        this.emit('health:status:changed', 'unknown', status.status);
      }, this.config.monitoring.healthCheckInterval);
    }
  }

  private getServiceName(): string {
    return process.env.SERVICE_NAME || 'ossa-event-bus';
  }

  private getStreamKey(eventType: string): string {
    return `${this.config.redis.keyPrefix}:streams:${eventType}`;
  }

  private getRetryStreamKey(streamKey: string): string {
    return `${streamKey}:retry`;
  }

  private getStreamMaxLength(eventType: string): number {
    const stream = this.streams.get(eventType);
    return stream?.config.maxLength || 10000;
  }

  private parseStreamFields(fields: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      result[fields[i]] = fields[i + 1];
    }
    return result;
  }

  private calculateRetryDelay(retryCount: number, retryConfig?: any): number {
    const config = retryConfig || this.config.defaults.retry;
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, retryCount);
    return Math.min(delay, config.maxDelay);
  }

  private updateProcessingTime(time: number): void {
    this.processingTimes.push(time);

    // Keep only recent processing times (last 1000)
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-1000);
    }
  }
}

export default RedisEventBus;