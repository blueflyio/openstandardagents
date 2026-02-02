/**
 * OSSA Messaging Runtime - Core Messaging Service
 * Production-quality agent-to-agent messaging service
 *
 * @fileoverview Main service for pub/sub messaging, routing, and agent coordination
 * @module @ossa/messaging/service
 */

import { randomUUID } from 'crypto';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import {
  MessageBroker,
  MessageEnvelope,
  MessageHandler,
  ActiveSubscription,
  Channel,
  DeliveryGuarantee,
  MessagePriority,
  ValidationResult,
  RoutingContext,
  MessageMetrics,
  ChannelStats,
} from './messaging.types.js';
import {
  MessagingExtension,
  PublishedChannel,
  Subscription,
  Command,
} from '../../types/messaging.js';
import { MemoryBroker } from './memory-broker.js';

/**
 * Agent messaging configuration
 */
export interface AgentMessagingConfig {
  /** Unique agent identifier */
  agentId: string;

  /** Agent name for display */
  agentName: string;

  /** Messaging extension from agent manifest */
  messaging?: MessagingExtension;

  /** Message broker implementation */
  broker?: MessageBroker;

  /** Enable metrics collection */
  enableMetrics?: boolean;

  /** Enable schema validation */
  enableValidation?: boolean;

  /** Default delivery guarantee */
  defaultDeliveryGuarantee?: DeliveryGuarantee;
}

/**
 * Core messaging service for agent-to-agent communication
 *
 * Features:
 * - Pub/sub messaging with schema validation
 * - Message routing between agents
 * - Channel management and discovery
 * - Subscription lifecycle management
 * - Delivery guarantees (at-most-once, at-least-once, exactly-once)
 * - Dead letter queue handling
 * - Metrics and observability
 * - Command (RPC) support
 *
 * Supports multiple broker backends:
 * - In-memory (development/testing)
 * - Redis (production)
 * - Kafka (high-throughput)
 * - RabbitMQ (enterprise)
 */
export class MessagingService {
  private readonly agentId: string;
  private readonly agentName: string;
  private readonly messaging?: MessagingExtension;
  private readonly broker: MessageBroker;
  private readonly enableMetrics: boolean;
  private readonly enableValidation: boolean;
  private readonly defaultDeliveryGuarantee: DeliveryGuarantee;

  private readonly channels: Map<string, Channel>;
  private readonly subscriptions: Map<string, ActiveSubscription>;
  private readonly publishedChannels: Map<string, PublishedChannel>;
  private readonly schemaValidators: Map<string, ValidateFunction>;
  private readonly commandHandlers: Map<string, MessageHandler>;

  private readonly ajv: Ajv;
  private readonly metrics: MessageMetrics;

  private started: boolean = false;

  constructor(config: AgentMessagingConfig) {
    this.agentId = config.agentId;
    this.agentName = config.agentName;
    this.messaging = config.messaging;
    this.broker = config.broker || new MemoryBroker();
    this.enableMetrics = config.enableMetrics ?? true;
    this.enableValidation = config.enableValidation ?? true;
    this.defaultDeliveryGuarantee =
      config.defaultDeliveryGuarantee || DeliveryGuarantee.AT_LEAST_ONCE;

    this.channels = new Map();
    this.subscriptions = new Map();
    this.publishedChannels = new Map();
    this.schemaValidators = new Map();
    this.commandHandlers = new Map();

    // Initialize JSON Schema validator
    // @ts-expect-error - Ajv v8 API compatibility
    this.ajv = new Ajv({
      strict: false,
      allErrors: true,
      verbose: true,
    });
    addFormats(this.ajv);

    // Initialize metrics
    this.metrics = {
      published: 0,
      delivered: 0,
      failed: 0,
      deadLettered: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      throughput: 0,
      windowMs: 60000, // 1 minute
      timestamp: new Date(),
    };
  }

  /**
   * Start the messaging service
   * Connects to broker and registers channels/subscriptions from manifest
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    // Connect to broker
    await this.broker.connect();

    // Register published channels from manifest
    if (this.messaging?.publishes) {
      for (const channel of this.messaging.publishes) {
        await this.registerPublishedChannel(channel);
      }
    }

    // Subscribe to channels from manifest
    if (this.messaging?.subscribes) {
      for (const subscription of this.messaging.subscribes) {
        // Handler will be registered separately via registerSubscriptionHandler
        await this.registerSubscription(subscription);
      }
    }

    // Register command handlers from manifest
    if (this.messaging?.commands) {
      for (const command of this.messaging.commands) {
        await this.registerCommand(command);
      }
    }

    this.started = true;
  }

  /**
   * Stop the messaging service gracefully
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    // Unsubscribe from all channels
    for (const [subId] of this.subscriptions) {
      await this.unsubscribe(subId);
    }

    // Disconnect from broker
    await this.broker.disconnect();

    this.started = false;
  }

  /**
   * Publish a message to a channel
   */
  async publish(
    channel: string,
    payload: Record<string, unknown>,
    options: {
      priority?: MessagePriority;
      ttlSeconds?: number;
      correlationId?: string;
      headers?: Record<string, string>;
    } = {}
  ): Promise<string> {
    if (!this.started) {
      throw new Error('Messaging service not started');
    }

    // Validate channel is registered
    const publishedChannel = this.publishedChannels.get(channel);
    if (!publishedChannel && this.enableValidation) {
      throw new Error(
        `Channel '${channel}' not registered for publishing by agent '${this.agentId}'`
      );
    }

    // Validate message against schema
    if (this.enableValidation && publishedChannel?.schema) {
      const result = this.validateMessage(channel, payload);
      if (!result.valid) {
        throw new Error(
          `Message validation failed for channel '${channel}': ${JSON.stringify(result.errors)}`
        );
      }
    }

    // Create message envelope
    const message: MessageEnvelope = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      source: this.agentId,
      channel,
      payload,
      metadata: {
        correlationId: options.correlationId,
        priority: options.priority || MessagePriority.NORMAL,
        ttlSeconds: options.ttlSeconds,
        contentType: publishedChannel?.contentType || 'application/json',
        headers: options.headers,
        retryCount: 0,
      },
    };

    // Publish to broker
    await this.broker.publish(channel, message);

    // Update metrics
    if (this.enableMetrics) {
      this.metrics.published++;
    }

    return message.id;
  }

  /**
   * Subscribe to a channel with a handler
   */
  async subscribe(
    channel: string,
    handler: MessageHandler,
    options: {
      filter?: {
        expression?: string;
        fields?: Record<string, unknown>;
      };
      priority?: MessagePriority;
      maxConcurrency?: number;
    } = {}
  ): Promise<string> {
    if (!this.started) {
      throw new Error('Messaging service not started');
    }

    // Check if subscription is declared in manifest
    const declaredSub = this.messaging?.subscribes?.find(
      (s) => s.channel === channel
    );
    if (!declaredSub && this.enableValidation) {
      console.warn(
        `[MessagingService] Channel '${channel}' not declared in manifest for agent '${this.agentId}'`
      );
    }

    // Wrap handler with metrics and error handling
    const wrappedHandler: MessageHandler = async (message: MessageEnvelope) => {
      const startTime = Date.now();

      try {
        // Validate message if schema is available
        if (this.enableValidation && declaredSub?.schema) {
          const result = this.validateMessage(channel, message.payload);
          if (!result.valid) {
            console.error(
              `[MessagingService] Message validation failed:`,
              result.errors
            );
            return; // Skip invalid messages
          }
        }

        // Execute handler
        await handler(message);

        // Update metrics
        if (this.enableMetrics) {
          this.metrics.delivered++;
          const latency = Date.now() - startTime;
          this.updateLatencyMetrics(latency);
        }
      } catch (error) {
        console.error(
          `[MessagingService] Error handling message ${message.id}:`,
          error
        );

        if (this.enableMetrics) {
          this.metrics.failed++;
        }

        throw error; // Re-throw for broker retry handling
      }
    };

    // Subscribe via broker
    const subscriptionId = await this.broker.subscribe(
      channel,
      wrappedHandler,
      {
        filter: options.filter,
        priority: options.priority,
        maxConcurrency: options.maxConcurrency || 10,
      }
    );

    // Track subscription
    const activeSubscription: ActiveSubscription = {
      id: subscriptionId,
      agentId: this.agentId,
      channel,
      handler: declaredSub?.handler,
      handlerFn: wrappedHandler,
      createdAt: new Date(),
      activeMessages: 0,
      processedCount: 0,
      errorCount: 0,
      enabled: true,
      priority: options.priority || MessagePriority.NORMAL,
      maxConcurrency: options.maxConcurrency,
      filter: options.filter,
    };

    this.subscriptions.set(subscriptionId, activeSubscription);

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

    await this.broker.unsubscribe(subscriptionId);
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Send a command (RPC-style) to an agent
   */
  async sendCommand(
    targetAgentId: string,
    commandName: string,
    input: Record<string, unknown>,
    options: {
      timeoutSeconds?: number;
      correlationId?: string;
    } = {}
  ): Promise<Record<string, unknown>> {
    if (!this.started) {
      throw new Error('Messaging service not started');
    }

    const commandChannel = `agent.${targetAgentId}.commands.${commandName}`;
    const responseChannel = `agent.${this.agentId}.responses`;

    const correlationId = options.correlationId || randomUUID();
    const timeoutMs = (options.timeoutSeconds || 30) * 1000;

    // Create response promise
    const responsePromise = new Promise<Record<string, unknown>>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          this.unsubscribe(subscriptionId).catch(() => {});
          reject(
            new Error(
              `Command '${commandName}' to agent '${targetAgentId}' timed out`
            )
          );
        }, timeoutMs);

        const handler: MessageHandler = async (message: MessageEnvelope) => {
          if (message.metadata?.correlationId === correlationId) {
            clearTimeout(timeout);
            await this.unsubscribe(subscriptionId);
            resolve(message.payload);
          }
        };

        let subscriptionId: string;
        this.subscribe(responseChannel, handler)
          .then((id) => {
            subscriptionId = id;
          })
          .catch(reject);
      }
    );

    // Send command
    await this.publish(commandChannel, input, {
      correlationId,
      headers: {
        'x-command-name': commandName,
        'x-response-channel': responseChannel,
      },
    });

    return responsePromise;
  }

  /**
   * Register a command handler
   */
  async registerCommandHandler(
    commandName: string,
    handler: (
      input: Record<string, unknown>
    ) => Promise<Record<string, unknown>>
  ): Promise<void> {
    if (!this.started) {
      throw new Error('Messaging service not started');
    }

    const commandChannel = `agent.${this.agentId}.commands.${commandName}`;

    const wrappedHandler: MessageHandler = async (message: MessageEnvelope) => {
      const responseChannel = message.metadata?.headers?.['x-response-channel'];
      const correlationId = message.metadata?.correlationId;

      if (!responseChannel || !correlationId) {
        console.error(
          `[MessagingService] Invalid command message, missing response channel or correlation ID`
        );
        return;
      }

      try {
        const result = await handler(message.payload);

        // Send response
        await this.publish(responseChannel, result, {
          correlationId,
        });
      } catch (error) {
        console.error(
          `[MessagingService] Error executing command '${commandName}':`,
          error
        );

        // Send error response
        await this.publish(
          responseChannel,
          {
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: 'COMMAND_EXECUTION_ERROR',
            },
          },
          {
            correlationId,
          }
        );
      }
    };

    await this.subscribe(commandChannel, wrappedHandler);
    this.commandHandlers.set(commandName, wrappedHandler);
  }

  /**
   * Get list of available channels
   */
  async listChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  /**
   * Get active subscriptions
   */
  async listSubscriptions(): Promise<ActiveSubscription[]> {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(channel: string): Promise<ChannelStats> {
    return this.broker.getChannelStats(channel);
  }

  /**
   * Get messaging metrics
   */
  getMetrics(): MessageMetrics {
    return { ...this.metrics };
  }

  /**
   * Get broker health
   */
  async getHealth(): Promise<any> {
    return this.broker.getHealth();
  }

  /**
   * Register a published channel from manifest
   */
  private async registerPublishedChannel(
    channel: PublishedChannel
  ): Promise<void> {
    this.publishedChannels.set(channel.channel, channel);

    // Compile schema validator
    if (channel.schema && this.enableValidation) {
      const validator = this.ajv.compile(channel.schema);
      this.schemaValidators.set(channel.channel, validator);
    }

    // Initialize channel metadata
    const channelMetadata: Channel = {
      name: channel.channel,
      description: channel.description,
      schema: channel.schema,
      contentType: channel.contentType,
      tags: channel.tags,
      subscriptionCount: 0,
      createdAt: new Date(),
      messageCount: 0,
    };

    this.channels.set(channel.channel, channelMetadata);
  }

  /**
   * Register a subscription from manifest
   */
  private async registerSubscription(
    subscription: Subscription
  ): Promise<void> {
    // Compile schema validator
    if (subscription.schema && this.enableValidation) {
      const validator = this.ajv.compile(subscription.schema);
      this.schemaValidators.set(subscription.channel, validator);
    }

    // Channel metadata will be created when first message is published
    if (!this.channels.has(subscription.channel)) {
      const channelMetadata: Channel = {
        name: subscription.channel,
        description: subscription.description,
        subscriptionCount: 0,
        createdAt: new Date(),
        messageCount: 0,
      };
      this.channels.set(subscription.channel, channelMetadata);
    }
  }

  /**
   * Register a command from manifest
   */
  private async registerCommand(command: Command): Promise<void> {
    // Command handlers will be registered via registerCommandHandler
    // This just validates the command schema

    if (this.enableValidation) {
      if (command.inputSchema) {
        this.ajv.compile(command.inputSchema);
      }
      if (command.outputSchema) {
        this.ajv.compile(command.outputSchema);
      }
    }
  }

  /**
   * Validate message against schema
   */
  private validateMessage(
    channel: string,
    payload: Record<string, unknown>
  ): ValidationResult {
    const validator = this.schemaValidators.get(channel);
    if (!validator) {
      return { valid: true };
    }

    const valid = validator(payload);
    if (valid) {
      return { valid: true };
    }

    return {
      valid: false,
      errors: validator.errors?.map((err) => ({
        path: err.instancePath,
        message: err.message || 'Validation error',
        code: err.keyword,
      })),
    };
  }

  /**
   * Update latency metrics with exponential moving average
   */
  private updateLatencyMetrics(latencyMs: number): void {
    // Simple exponential moving average (alpha = 0.1)
    const alpha = 0.1;
    this.metrics.avgLatencyMs =
      alpha * latencyMs + (1 - alpha) * this.metrics.avgLatencyMs;

    // For percentiles, we'd need a proper histogram
    // This is a simplified approximation
    if (latencyMs > this.metrics.p95LatencyMs) {
      this.metrics.p95LatencyMs = latencyMs;
    }
    if (latencyMs > this.metrics.p99LatencyMs) {
      this.metrics.p99LatencyMs = latencyMs;
    }
  }
}
