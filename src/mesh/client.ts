/**
 * Agent Mesh Client
 * Main interface for sending and receiving agent-to-agent messages
 */

import { randomUUID } from 'crypto';
import {
  MessageEnvelope,
  MessageType,
  MessagePriority,
  MessageHandler,
  CommandHandler,
  AgentCard,
  Subscription,
  Command,
  A2AError,
  RetryPolicy,
  ReliabilityConfig,
  TaskStatus,
} from './types.js';
import { DiscoveryService } from './discovery.js';
import {
  MessageRouter,
  SubscriptionManager,
  DefaultMessageRouter,
  DefaultSubscriptionManager,
  MessagePriorityQueue,
  RoutingStatsCollector,
} from './routing.js';

/**
 * Transport Interface
 * Abstraction for different transport mechanisms (HTTP, gRPC, WebSocket, MQTT)
 */
export interface Transport {
  /**
   * Send a message to a specific endpoint
   */
  send(endpoint: string, message: MessageEnvelope): Promise<void>;

  /**
   * Close the transport
   */
  close(): Promise<void>;
}

/**
 * HTTP Transport Implementation
 */
export class HttpTransport implements Transport {
  constructor(private readonly timeout: number = 30000) {}

  async send(endpoint: string, message: MessageEnvelope): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${endpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(message.traceContext?.traceparent && {
            traceparent: message.traceContext.traceparent,
          }),
          ...(message.traceContext?.tracestate && {
            tracestate: message.traceContext.tracestate,
          }),
        },
        body: JSON.stringify(message),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async close(): Promise<void> {
    // No cleanup needed for fetch-based transport
  }
}

/**
 * Agent Mesh Client Configuration
 */
export interface AgentMeshClientConfig {
  localAgent: AgentCard;
  discovery: DiscoveryService;
  transport?: Transport;
  router?: MessageRouter;
  subscriptionManager?: SubscriptionManager;
  reliability?: ReliabilityConfig;
  enableStats?: boolean;
}

/**
 * Agent Mesh Client
 * Main client for agent-to-agent communication
 */
export class AgentMeshClient {
  private readonly localAgent: AgentCard;
  private readonly discovery: DiscoveryService;
  private readonly transport: Transport;
  private readonly router: MessageRouter;
  private readonly subscriptionManager: SubscriptionManager;
  private readonly reliability: ReliabilityConfig;
  private readonly messageQueue: MessagePriorityQueue;
  private readonly pendingRequests: Map<
    string,
    {
      resolve: (value: MessageEnvelope) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();
  private readonly commands: Map<string, CommandHandler> = new Map();
  private readonly stats: RoutingStatsCollector;
  private processingInterval?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(config: AgentMeshClientConfig) {
    this.localAgent = config.localAgent;
    this.discovery = config.discovery;
    this.transport = config.transport || new HttpTransport();
    this.router = config.router || new DefaultMessageRouter();
    this.subscriptionManager =
      config.subscriptionManager || new DefaultSubscriptionManager();
    this.reliability = config.reliability || this.getDefaultReliability();
    this.messageQueue = new MessagePriorityQueue();
    this.stats = new RoutingStatsCollector();

    // Start message processing
    this.startProcessing();
  }

  /**
   * Send a message to another agent or topic
   */
  async send(
    to: string,
    payload: unknown,
    options?: {
      type?: MessageType;
      priority?: MessagePriority;
      correlationId?: string;
      replyTo?: string;
      ttl?: number;
    }
  ): Promise<void> {
    const message = this.createMessage(to, payload, options);
    this.messageQueue.enqueue(message);
  }

  /**
   * Send a request and wait for a response
   */
  async request<TResponse = unknown>(
    to: string,
    payload: unknown,
    options?: {
      priority?: MessagePriority;
      timeoutMs?: number;
    }
  ): Promise<TResponse> {
    const correlationId = randomUUID();
    const timeoutMs = options?.timeoutMs || 30000;

    const message = this.createMessage(to, payload, {
      type: 'request',
      priority: options?.priority,
      correlationId,
      replyTo: this.localAgent.uri,
    });

    return new Promise<TResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(correlationId, {
        resolve: (response: MessageEnvelope) => {
          clearTimeout(timeout);
          resolve(response.payload as TResponse);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout,
      });

      this.messageQueue.enqueue(message);
    });
  }

  /**
   * Publish an event to a topic
   */
  async publish(
    channel: string,
    payload: unknown,
    options?: {
      priority?: MessagePriority;
      correlationId?: string;
    }
  ): Promise<void> {
    await this.send(`topic://${channel}`, payload, {
      type: 'event',
      priority: options?.priority,
      correlationId: options?.correlationId,
    });
  }

  /**
   * Broadcast a message to all agents in a namespace
   */
  async broadcast(
    namespace: string,
    payload: unknown,
    options?: {
      priority?: MessagePriority;
    }
  ): Promise<void> {
    await this.send(`broadcast://${namespace}/*`, payload, {
      type: 'event',
      priority: options?.priority,
    });
  }

  /**
   * Subscribe to a channel
   */
  subscribe(subscription: Subscription, handler: MessageHandler): void {
    this.subscriptionManager.subscribe(subscription, handler);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string, handler: MessageHandler): void {
    this.subscriptionManager.unsubscribe(channel, handler);
  }

  /**
   * Register a command handler
   */
  registerCommand<TInput = unknown, TOutput = unknown>(
    command: Command,
    handler: CommandHandler<TInput, TOutput>
  ): void {
    this.commands.set(command.name, handler as CommandHandler);
  }

  /**
   * Invoke a command on another agent
   */
  async invokeCommand<TInput = unknown, TOutput = unknown>(
    agentUri: string,
    commandName: string,
    input: TInput,
    timeoutMs?: number
  ): Promise<TOutput> {
    return await this.request<TOutput>(
      agentUri,
      { command: commandName, input },
      { timeoutMs: timeoutMs || 30000 }
    );
  }

  /**
   * Handle incoming message
   */
  async handleMessage(message: MessageEnvelope): Promise<void> {
    try {
      // Check if it's a response to a pending request
      if (message.type === 'response' && message.correlationId) {
        const pending = this.pendingRequests.get(message.correlationId);
        if (pending) {
          this.pendingRequests.delete(message.correlationId);
          pending.resolve(message);
          return;
        }
      }

      // Check if it's a command invocation
      if (
        message.type === 'request' &&
        typeof message.payload === 'object' &&
        message.payload !== null
      ) {
        const payload = message.payload as {
          command?: string;
          input?: unknown;
        };
        if (payload.command && this.commands.has(payload.command)) {
          const handler = this.commands.get(payload.command)!;
          const result = await handler(payload.input);

          // Send response
          if (message.replyTo) {
            await this.send(message.replyTo, result, {
              type: 'response',
              correlationId: message.correlationId,
            });
          }
          return;
        }
      }

      // Find and invoke subscription handlers
      const channel = this.extractChannel(message.to);
      if (channel) {
        const handlers = this.subscriptionManager.getHandlers(channel);
        await Promise.all(handlers.map((handler) => handler(message)));
      }
    } catch (error) {
      console.error('Error handling message:', error);
      // Optionally send error response
      if (message.type === 'request' && message.replyTo) {
        await this.send(
          message.replyTo,
          {
            error: {
              code: 'PROCESSING_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          },
          {
            type: 'response',
            correlationId: message.correlationId,
          }
        );
      }
    }
  }

  /**
   * Get routing statistics
   */
  getStats() {
    return this.stats.getStats();
  }

  /**
   * Close the client
   */
  async close(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.isProcessing = false;
    await this.transport.close();
  }

  private createMessage(
    to: string,
    payload: unknown,
    options?: {
      type?: MessageType;
      priority?: MessagePriority;
      correlationId?: string;
      replyTo?: string;
      ttl?: number;
    }
  ): MessageEnvelope {
    return {
      version: 'ossa/a2a/v0.3.0',
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      from: this.localAgent.uri,
      to,
      type: options?.type || 'event',
      payload,
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
      ttl: options?.ttl || 300,
      priority: options?.priority || 'normal',
    };
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (this.isProcessing || this.messageQueue.isEmpty()) {
        return;
      }

      this.isProcessing = true;
      try {
        const message = this.messageQueue.dequeue();
        if (message) {
          await this.processMessage(message);
        }
      } finally {
        this.isProcessing = false;
      }
    }, 10); // Process messages every 10ms
  }

  private async processMessage(message: MessageEnvelope): Promise<void> {
    const startTime = Date.now();

    try {
      // Check TTL
      const messageAge =
        (Date.now() - new Date(message.timestamp).getTime()) / 1000;
      if (message.ttl && messageAge > message.ttl) {
        console.warn(
          `Message ${message.id} expired (age: ${messageAge}s, ttl: ${message.ttl}s)`
        );
        return;
      }

      // Route the message
      const destinations = await this.router.route(message);

      // Send to each destination
      for (const destination of destinations) {
        await this.sendWithRetry(destination, message);
      }

      const routingTime = Date.now() - startTime;
      this.stats.recordMessage(message, routingTime);
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
      this.stats.recordError();

      // Send to DLQ if configured
      if (this.reliability.dlq?.enabled) {
        await this.sendToDLQ(message, error);
      }
    }
  }

  private async sendWithRetry(
    destination: string,
    message: MessageEnvelope
  ): Promise<void> {
    const maxAttempts = this.reliability.retry.maxAttempts;
    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt < maxAttempts) {
      try {
        // Discover the agent
        const agent = await this.discovery.discoverByUri(destination);
        if (!agent) {
          throw new Error(`Agent not found: ${destination}`);
        }

        // Send the message
        const endpoint =
          agent.endpoints.http ||
          agent.endpoints.grpc ||
          agent.endpoints.websocket;
        if (!endpoint) {
          throw new Error(`No endpoint available for agent: ${destination}`);
        }

        await this.transport.send(endpoint, message);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        if (attempt < maxAttempts) {
          // Calculate backoff delay
          const delay = this.calculateBackoff(attempt, this.reliability.retry);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to send message after ${maxAttempts} attempts: ${lastError?.message}`
    );
  }

  private calculateBackoff(attempt: number, policy: RetryPolicy): number {
    switch (policy.backoff) {
      case 'exponential': {
        const delay =
          policy.initialDelayMs * Math.pow(policy.multiplier || 2, attempt - 1);
        return Math.min(delay, policy.maxDelayMs);
      }
      case 'linear':
        return Math.min(policy.initialDelayMs * attempt, policy.maxDelayMs);
      case 'constant':
      default:
        return policy.initialDelayMs;
    }
  }

  private async sendToDLQ(
    message: MessageEnvelope,
    error: unknown
  ): Promise<void> {
    if (!this.reliability.dlq?.channel) {
      return;
    }

    try {
      await this.publish(this.reliability.dlq.channel, {
        originalMessage: message,
        error: {
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (dlqError) {
      console.error('Failed to send message to DLQ:', dlqError);
    }
  }

  private extractChannel(uri: string): string | null {
    // Extract channel from topic:// or broadcast:// URIs
    const topicMatch = uri.match(/^topic:\/\/(.+)$/);
    if (topicMatch) {
      return topicMatch[1];
    }

    const broadcastMatch = uri.match(/^broadcast:\/\/(.+)\/\*$/);
    if (broadcastMatch) {
      return broadcastMatch[1];
    }

    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getDefaultReliability(): ReliabilityConfig {
    return {
      deliveryGuarantee: 'at-least-once',
      retry: {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        multiplier: 2,
      },
      dlq: {
        enabled: false,
        channel: 'messaging.dlq',
        retentionDays: 30,
      },
    };
  }
}

/**
 * Agent Mesh Client Builder
 * Fluent builder for creating AgentMeshClient instances
 */
export class AgentMeshClientBuilder {
  private config: Partial<AgentMeshClientConfig> = {};

  withLocalAgent(agent: AgentCard): this {
    this.config.localAgent = agent;
    return this;
  }

  withDiscovery(discovery: DiscoveryService): this {
    this.config.discovery = discovery;
    return this;
  }

  withTransport(transport: Transport): this {
    this.config.transport = transport;
    return this;
  }

  withRouter(router: MessageRouter): this {
    this.config.router = router;
    return this;
  }

  withSubscriptionManager(subscriptionManager: SubscriptionManager): this {
    this.config.subscriptionManager = subscriptionManager;
    return this;
  }

  withReliability(reliability: ReliabilityConfig): this {
    this.config.reliability = reliability;
    return this;
  }

  enableStats(): this {
    this.config.enableStats = true;
    return this;
  }

  build(): AgentMeshClient {
    if (!this.config.localAgent) {
      throw new Error('Local agent is required');
    }
    if (!this.config.discovery) {
      throw new Error('Discovery service is required');
    }

    return new AgentMeshClient(this.config as AgentMeshClientConfig);
  }
}
