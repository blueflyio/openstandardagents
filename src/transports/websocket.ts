/**
 * WebSocket Transport Implementation
 * Bidirectional real-time communication for OSSA agents
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

/**
 * WebSocket event types
 */
export type WebSocketEventType =
  | 'message'
  | 'capability_call'
  | 'status_update'
  | 'error'
  | 'ack'
  | 'ping'
  | 'pong'
  | 'register';

/**
 * Event metadata
 */
export interface WebSocketEventMetadata {
  agentId: string;
  correlationId?: string;
  replyTo?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number;
  retryCount?: number;
}

/**
 * Base WebSocket event structure
 */
export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  id: string;
  timestamp: string;
  payload: T;
  metadata: WebSocketEventMetadata;
}

/**
 * Registration payload
 */
export interface RegistrationPayload {
  agentId: string;
  capabilities: string[];
  version: string;
}

/**
 * Capability call payload
 */
export interface CapabilityCallPayload {
  capability: string;
  input: unknown;
}

/**
 * Status update payload
 */
export interface StatusUpdatePayload {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  load?: number;
  activeConnections?: number;
  capabilities?: string[];
  metrics?: Record<string, unknown>;
}

/**
 * Error payload
 */
export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

/**
 * Acknowledgment payload
 */
export interface AckPayload {
  messageId: string;
  status: 'received' | 'processed' | 'failed';
}

/**
 * WebSocket transport configuration
 */
export interface WebSocketTransportConfig {
  url: string;
  agentId: string;
  capabilities: string[];
  version?: string;
  auth?: {
    token?: string;
    type?: 'bearer' | 'query';
  };
  keepalive?: {
    pingInterval?: number;
    pongTimeout?: number;
    maxMissedPongs?: number;
  };
  reconnect?: {
    enabled?: boolean;
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    multiplier?: number;
  };
  maxMessageSize?: number;
}

/**
 * WebSocket Transport
 * Provides bidirectional real-time communication
 */
export class WebSocketTransport extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketTransportConfig>;
  private reconnectAttempt = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;
  private pongTimer?: NodeJS.Timeout;
  private missedPongs = 0;
  private messageQueue: WebSocketEvent[] = [];
  private pendingAcks = new Map<string, {
    resolve: () => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(config: WebSocketTransportConfig) {
    super();
    this.config = {
      url: config.url,
      agentId: config.agentId,
      capabilities: config.capabilities,
      version: config.version || 'ossa/v0.3.0',
      auth: config.auth || {},
      keepalive: {
        pingInterval: config.keepalive?.pingInterval || 30000,
        pongTimeout: config.keepalive?.pongTimeout || 5000,
        maxMissedPongs: config.keepalive?.maxMissedPongs || 3,
      },
      reconnect: {
        enabled: config.reconnect?.enabled ?? true,
        maxAttempts: config.reconnect?.maxAttempts || 10,
        initialDelay: config.reconnect?.initialDelay || 1000,
        maxDelay: config.reconnect?.maxDelay || 30000,
        multiplier: config.reconnect?.multiplier || 2,
      },
      maxMessageSize: config.maxMessageSize || 1048576, // 1MB
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.buildConnectionUrl();
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.onOpen();
          resolve();
        };

        this.ws.onerror = (error) => {
          this.onError(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.onMessage(event);
        };

        this.ws.onclose = (event) => {
          this.onClose(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    this.stopKeepalive();
    this.stopReconnect();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.messageQueue = [];
    this.pendingAcks.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingAcks.clear();
  }

  /**
   * Send message
   */
  async send<T>(
    type: WebSocketEventType,
    payload: T,
    options?: {
      correlationId?: string;
      replyTo?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      ttl?: number;
      waitForAck?: boolean;
    }
  ): Promise<void> {
    const event: WebSocketEvent<T> = {
      type,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      payload,
      metadata: {
        agentId: this.config.agentId,
        correlationId: options?.correlationId,
        replyTo: options?.replyTo,
        priority: options?.priority || 'normal',
        ttl: options?.ttl,
      },
    };

    if (options?.waitForAck) {
      return this.sendWithAck(event);
    }

    return this.sendEvent(event);
  }

  /**
   * Send message and wait for acknowledgment
   */
  private async sendWithAck<T>(event: WebSocketEvent<T>): Promise<void> {
    await this.sendEvent(event);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(event.id);
        reject(new Error('ACK timeout'));
      }, 5000);

      this.pendingAcks.set(event.id, { resolve, reject, timeout });
    });
  }

  /**
   * Send capability call
   */
  async invokeCapability(
    capability: string,
    input: unknown,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      timeout?: number;
    }
  ): Promise<unknown> {
    const correlationId = randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(correlationId);
        reject(new Error('Capability call timeout'));
      }, options?.timeout || 30000);

      this.pendingAcks.set(correlationId, {
        resolve: () => {
          clearTimeout(timeout);
          // Response will be emitted as event
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout,
      });

      const replyHandler = (event: WebSocketEvent) => {
        if (event.metadata.correlationId === correlationId) {
          this.off('message', replyHandler);
          clearTimeout(timeout);
          resolve(event.payload);
        }
      };

      this.on('message', replyHandler);

      this.send<CapabilityCallPayload>('capability_call', {
        capability,
        input,
      }, {
        correlationId,
        replyTo: this.config.agentId,
        priority: options?.priority,
      }).catch(reject);
    });
  }

  /**
   * Send status update
   */
  async sendStatus(status: StatusUpdatePayload): Promise<void> {
    return this.send<StatusUpdatePayload>('status_update', status);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Build connection URL with auth
   */
  private buildConnectionUrl(): string {
    const url = new URL(this.config.url);

    if (this.config.auth?.type === 'query' && this.config.auth?.token) {
      url.searchParams.set('token', this.config.auth.token);
    }

    return url.toString();
  }

  /**
   * Handle connection open
   */
  private onOpen(): void {
    this.reconnectAttempt = 0;
    this.missedPongs = 0;

    // Send registration
    this.sendEvent<RegistrationPayload>({
      type: 'register',
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      payload: {
        agentId: this.config.agentId,
        capabilities: this.config.capabilities,
        version: this.config.version,
      },
      metadata: {
        agentId: this.config.agentId,
      },
    });

    // Send queued messages
    this.messageQueue.forEach((event) => {
      this.sendEvent(event);
    });
    this.messageQueue = [];

    this.startKeepalive();
    this.emit('connected');
  }

  /**
   * Handle connection close
   */
  private onClose(event: CloseEvent): void {
    this.stopKeepalive();
    this.emit('disconnected', event);

    if (this.config.reconnect.enabled && this.reconnectAttempt < this.config.reconnect.maxAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection error
   */
  private onError(error: Event): void {
    this.emit('error', error);
  }

  /**
   * Handle incoming message
   */
  private onMessage(event: MessageEvent): void {
    try {
      const message: WebSocketEvent = JSON.parse(event.data);

      // Handle specific message types
      switch (message.type) {
        case 'pong':
          this.handlePong();
          break;

        case 'ping':
          this.handlePing();
          break;

        case 'ack':
          this.handleAck(message.payload as AckPayload);
          break;

        case 'error':
          this.emit('error', message.payload);
          break;

        default:
          // Emit event for application handling
          this.emit(message.type, message);
          this.emit('*', message);
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`));
    }
  }

  /**
   * Send event to server
   */
  private async sendEvent<T>(event: WebSocketEvent<T>): Promise<void> {
    if (!this.isConnected()) {
      // Queue message for later
      this.messageQueue.push(event as WebSocketEvent);
      return;
    }

    const data = JSON.stringify(event);

    if (data.length > this.config.maxMessageSize) {
      throw new Error(`Message size ${data.length} exceeds limit ${this.config.maxMessageSize}`);
    }

    this.ws!.send(data);
  }

  /**
   * Start keepalive ping/pong
   */
  private startKeepalive(): void {
    this.pingTimer = setInterval(() => {
      if (this.missedPongs >= this.config.keepalive.maxMissedPongs) {
        this.emit('error', new Error('Keepalive timeout'));
        this.ws?.close();
        return;
      }

      this.sendEvent({
        type: 'ping',
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        payload: {},
        metadata: { agentId: this.config.agentId },
      });

      this.missedPongs++;

      this.pongTimer = setTimeout(() => {
        this.emit('error', new Error('Pong timeout'));
      }, this.config.keepalive.pongTimeout);
    }, this.config.keepalive.pingInterval);
  }

  /**
   * Stop keepalive timers
   */
  private stopKeepalive(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }

    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  /**
   * Handle pong response
   */
  private handlePong(): void {
    this.missedPongs = 0;
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  /**
   * Handle ping request
   */
  private handlePing(): void {
    this.sendEvent({
      type: 'pong',
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      payload: {},
      metadata: { agentId: this.config.agentId },
    });
  }

  /**
   * Handle acknowledgment
   */
  private handleAck(ack: AckPayload): void {
    const pending = this.pendingAcks.get(ack.messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve();
      this.pendingAcks.delete(ack.messageId);
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    const delay = Math.min(
      this.config.reconnect.initialDelay *
        Math.pow(this.config.reconnect.multiplier, this.reconnectAttempt),
      this.config.reconnect.maxDelay
    );

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempt++;
      try {
        await this.connect();
      } catch (error) {
        // Will retry if enabled
      }
    }, delay);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.reconnectAttempt = 0;
  }
}
