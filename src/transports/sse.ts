/**
 * Server-Sent Events (SSE) Transport Implementation
 * Unidirectional server-to-client event streaming for OSSA agents
 */

import { EventEmitter } from 'events';

/**
 * SSE event types
 */
export type SSEEventType = 'message' | 'status' | 'capability_response' | 'error';

/**
 * Event metadata
 */
export interface SSEEventMetadata {
  agentId: string;
  streamId?: string;
  correlationId?: string;
  sequence?: number;
  final?: boolean;
}

/**
 * Base SSE event structure
 */
export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  id: string;
  timestamp: string;
  payload: T;
  metadata: SSEEventMetadata;
}

/**
 * Status update payload
 */
export interface SSEStatusPayload {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  load?: number;
  uptime?: number;
  metrics?: Record<string, unknown>;
}

/**
 * Capability response payload
 */
export interface SSECapabilityResponsePayload {
  capability: string;
  result?: unknown;
  progress?: {
    percent?: number;
    current?: number;
    total?: number;
  };
}

/**
 * Error payload
 */
export interface SSEErrorPayload {
  code: string;
  message: string;
  retryable?: boolean;
}

/**
 * SSE transport configuration
 */
export interface SSETransportConfig {
  url: string;
  auth?: {
    token?: string;
    type?: 'bearer' | 'cookie' | 'query';
  };
  channels?: string[];
  lastEventId?: string;
  withCredentials?: boolean;
  reconnect?: {
    enabled?: boolean;
    maxAttempts?: number;
    retryTime?: number;
  };
}

/**
 * SSE Transport
 * Provides unidirectional server-to-client event streaming
 */
export class SSETransport extends EventEmitter {
  private eventSource: EventSource | null = null;
  private config: SSETransportConfig & { reconnect: Required<NonNullable<SSETransportConfig['reconnect']>> };
  private reconnectAttempt = 0;
  private lastEventId?: string;
  private readonly eventHandlers = new Map<string, (event: MessageEvent) => void>();

  constructor(config: SSETransportConfig) {
    super();
    this.config = {
      url: config.url,
      auth: config.auth || {},
      channels: config.channels || [],
      lastEventId: config.lastEventId,
      withCredentials: config.withCredentials ?? true,
      reconnect: {
        enabled: config.reconnect?.enabled ?? true,
        maxAttempts: config.reconnect?.maxAttempts || 10,
        retryTime: config.reconnect?.retryTime || 3000,
      },
    };
    this.lastEventId = config.lastEventId;
  }

  /**
   * Connect to SSE endpoint
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.buildConnectionUrl();

        // Note: EventSource doesn't support custom headers in browsers
        // For bearer auth, need server-side proxy or use cookie/query param
        const options: EventSourceInit = {
          withCredentials: this.config.withCredentials,
        };

        this.eventSource = new EventSource(url, options);

        this.eventSource.onopen = () => {
          this.onOpen();
          resolve();
        };

        this.eventSource.onerror = (error) => {
          this.onError(error);
          if (this.reconnectAttempt === 0) {
            reject(error);
          }
        };

        // Register default message handler
        this.eventSource.onmessage = (event) => {
          this.onMessage(event);
        };

        // Register custom event handlers
        this.registerEventHandlers();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from SSE endpoint
   */
  async disconnect(): Promise<void> {
    if (this.eventSource) {
      // Remove all event listeners
      this.eventHandlers.forEach((handler, eventType) => {
        this.eventSource!.removeEventListener(eventType, handler as EventListener);
      });
      this.eventHandlers.clear();

      this.eventSource.close();
      this.eventSource = null;
    }

    this.reconnectAttempt = 0;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): 'CONNECTING' | 'OPEN' | 'CLOSED' {
    if (!this.eventSource) {
      return 'CLOSED';
    }

    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'CONNECTING';
      case EventSource.OPEN:
        return 'OPEN';
      case EventSource.CLOSED:
        return 'CLOSED';
      default:
        return 'CLOSED';
    }
  }

  /**
   * Build connection URL with auth and parameters
   */
  private buildConnectionUrl(): string {
    const url = new URL(this.config.url);

    // Add channels if specified
    if (this.config.channels.length > 0) {
      url.searchParams.set('channels', this.config.channels.join(','));
    }

    // Add query token if specified
    if (this.config.auth?.type === 'query' && this.config.auth?.token) {
      url.searchParams.set('token', this.config.auth.token);
    }

    return url.toString();
  }

  /**
   * Register custom event handlers for different event types
   */
  private registerEventHandlers(): void {
    const eventTypes: SSEEventType[] = ['message', 'status', 'capability_response', 'error'];

    eventTypes.forEach((eventType) => {
      const handler = (event: MessageEvent) => {
        this.handleTypedEvent(eventType, event);
      };

      this.eventHandlers.set(eventType, handler);
      this.eventSource!.addEventListener(eventType, handler as EventListener);
    });
  }

  /**
   * Handle connection open
   */
  private onOpen(): void {
    this.reconnectAttempt = 0;
    this.emit('connected');
  }

  /**
   * Handle connection error
   */
  private onError(error: Event): void {
    this.emit('error', error);

    if (this.eventSource?.readyState === EventSource.CLOSED) {
      this.emit('disconnected');

      if (
        this.config.reconnect?.enabled &&
        this.reconnectAttempt < (this.config.reconnect?.maxAttempts || 10)
      ) {
        this.reconnectAttempt++;
        this.emit('reconnecting', this.reconnectAttempt);
      }
    }
  }

  /**
   * Handle default message event
   */
  private onMessage(event: MessageEvent): void {
    try {
      const data: SSEEvent = JSON.parse(event.data);
      this.updateLastEventId(event.lastEventId);
      this.emit('message', data);
      this.emit('*', data);
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`));
    }
  }

  /**
   * Handle typed event
   */
  private handleTypedEvent(eventType: SSEEventType, event: MessageEvent): void {
    try {
      const data: SSEEvent = JSON.parse(event.data);
      this.updateLastEventId(event.lastEventId);

      switch (eventType) {
        case 'status':
          this.emit('status', data);
          break;

        case 'capability_response':
          this.emit('capability_response', data);

          // Emit completion event if final
          if (data.metadata.final) {
            this.emit('capability_complete', data);
          }
          break;

        case 'error':
          this.emit('error', data.payload);
          break;

        default:
          this.emit(eventType, data);
      }

      this.emit('*', data);
    } catch (error) {
      this.emit('error', new Error(`Failed to parse ${eventType} event: ${error}`));
    }
  }

  /**
   * Update last event ID for reconnection
   */
  private updateLastEventId(lastEventId: string): void {
    if (lastEventId) {
      this.lastEventId = lastEventId;
    }
  }

  /**
   * Get last event ID
   */
  getLastEventId(): string | undefined {
    return this.lastEventId;
  }
}

/**
 * SSE Stream Client
 * High-level client for streaming capability responses
 */
export class SSEStreamClient {
  private transport: SSETransport | null = null;
  private baseUrl: string;
  private auth?: { token?: string; type?: 'bearer' | 'cookie' | 'query' };

  constructor(baseUrl: string, auth?: { token?: string; type?: 'bearer' | 'cookie' | 'query' }) {
    this.baseUrl = baseUrl;
    this.auth = auth;
  }

  /**
   * Invoke capability with streaming response
   */
  async invokeStreamingCapability<TInput, TOutput>(
    capability: string,
    input: TInput,
    options?: {
      timeout?: number;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      onProgress?: (event: SSEEvent<SSECapabilityResponsePayload>) => void;
    }
  ): Promise<TOutput> {
    // Step 1: POST to capability endpoint to initiate streaming
    const response = await fetch(`${this.baseUrl}/capabilities/${capability}/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.auth?.type === 'bearer' && this.auth.token
          ? { Authorization: `Bearer ${this.auth.token}` }
          : {}),
      },
      body: JSON.stringify({
        input,
        options: {
          timeout_seconds: options?.timeout,
          priority: options?.priority,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to invoke capability: ${response.statusText}`);
    }

    const result = await response.json() as { streamId: string; streamUrl: string };
    const { streamId, streamUrl } = result;

    // Step 2: Connect to SSE stream
    return new Promise<TOutput>((resolve, reject) => {
      this.transport = new SSETransport({
        url: streamUrl,
        auth: this.auth,
      });

      const timeout = setTimeout(() => {
        this.transport?.disconnect();
        reject(new Error('Capability timeout'));
      }, options?.timeout || 30000);

      this.transport.on('capability_response', (event: SSEEvent<SSECapabilityResponsePayload>) => {
        // Emit progress updates
        if (options?.onProgress) {
          options.onProgress(event);
        }

        // Handle final result
        if (event.metadata.final) {
          clearTimeout(timeout);
          this.transport?.disconnect();
          resolve(event.payload.result as TOutput);
        }
      });

      this.transport.on('error', (error) => {
        clearTimeout(timeout);
        this.transport?.disconnect();
        reject(error);
      });

      this.transport.connect().catch(reject);
    });
  }

  /**
   * Subscribe to event channels
   */
  async subscribe(
    channels: string[],
    handler: (event: SSEEvent) => void
  ): Promise<SSETransport> {
    const transport = new SSETransport({
      url: `${this.baseUrl}/events`,
      channels,
      auth: this.auth,
    });

    transport.on('*', handler);
    await transport.connect();

    return transport;
  }

  /**
   * Subscribe to agent status updates
   */
  async subscribeToStatus(
    handler: (status: SSEEvent<SSEStatusPayload>) => void
  ): Promise<SSETransport> {
    const transport = new SSETransport({
      url: `${this.baseUrl}/events`,
      channels: ['agent.status'],
      auth: this.auth,
    });

    transport.on('status', handler);
    await transport.connect();

    return transport;
  }
}
