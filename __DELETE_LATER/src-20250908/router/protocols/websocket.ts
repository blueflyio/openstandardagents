/**
 * WebSocket Protocol Implementation
 * Real-time agent discovery with WebSocket support
 */

import WebSocket from 'ws';
import { IncomingMessage, Server as HttpServer } from 'http';
import { BaseProtocol } from './base';
import { DiscoveryQuery, DiscoveryResult, RouterEvent } from '../types';
import { OSSARouter } from '../router';

export interface WebSocketConfig {
  port?: number;
  path?: string;
  maxClients?: number;
  pingInterval?: number;
  pongTimeout?: number;
}

export interface WebSocketMessage {
  id: string;
  type: 'discovery' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong';
  data?: any;
  timestamp: string;
}

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  lastPong: Date;
  requestCount: number;
}

export class WebSocketProtocol extends BaseProtocol {
  private server?: WebSocket.Server;
  private config: WebSocketConfig;
  private router: OSSARouter;
  private clients = new Map<string, WebSocketClient>();
  private pingInterval?: NodeJS.Timeout;

  constructor(config: WebSocketConfig, router: OSSARouter) {
    super('WebSocket', '1.0.0');
    this.config = {
      port: 3001,
      path: '/ws',
      maxClients: 1000,
      pingInterval: 30000, // 30 seconds
      pongTimeout: 10000,  // 10 seconds
      ...config,
    };
    this.router = router;
    this.setupRouterEventListeners();
  }

  async start(httpServer?: HttpServer): Promise<void> {
    if (this.isRunning) return;

    try {
      const serverOptions: WebSocket.ServerOptions = {
        path: this.config.path,
        maxPayload: 1024 * 1024, // 1MB max message size
        perMessageDeflate: {
          threshold: 1024,
          concurrencyLimit: 10,
          memLevel: 7,
        },
      };

      if (httpServer) {
        serverOptions.server = httpServer;
      } else {
        serverOptions.port = this.config.port;
      }

      this.server = new WebSocket.Server(serverOptions);

      this.server.on('connection', this.handleConnection.bind(this));
      this.server.on('error', (error) => {
        console.error('WebSocket server error:', error);
        this.emit('error', error);
      });

      // Start ping interval
      this.startPingInterval();

      this.isRunning = true;
      console.log(`🔌 WebSocket server started on port ${this.config.port}${this.config.path}`);

    } catch (error) {
      throw new Error(`Failed to start WebSocket server: ${(error as Error).message}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Stop ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = undefined;
      }

      // Close all client connections
      for (const [clientId, client] of this.clients) {
        client.ws.close(1001, 'Server shutting down');
      }
      this.clients.clear();

      // Close server
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server!.close(() => {
            resolve();
          });
        });
      }

      this.isRunning = false;
      console.log('🛑 WebSocket server stopped');

    } catch (error) {
      console.error('Error stopping WebSocket server:', error);
    }
  }

  getMetrics(): any {
    const baseMetrics = super.getMetrics();
    return {
      ...baseMetrics,
      activeConnections: this.clients.size,
      totalSubscriptions: Array.from(this.clients.values())
        .reduce((sum, client) => sum + client.subscriptions.size, 0),
    };
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const clientId = this.generateClientId();
    const client: WebSocketClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      lastPong: new Date(),
      requestCount: 0,
    };

    // Check client limit
    if (this.clients.size >= this.config.maxClients!) {
      ws.close(1013, 'Server capacity exceeded');
      return;
    }

    this.clients.set(clientId, client);
    console.log(`WebSocket client connected: ${clientId}`);

    // Setup client event handlers
    ws.on('message', (data) => {
      this.handleMessage(client, data);
    });

    ws.on('pong', () => {
      client.lastPong = new Date();
    });

    ws.on('close', (code, reason) => {
      this.handleClientDisconnect(clientId, code, reason);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket client ${clientId} error:`, error);
      this.handleClientDisconnect(clientId, 1011, 'Client error');
    });

    // Send welcome message
    this.sendMessage(client, {
      id: this.generateMessageId(),
      type: 'ping',
      data: {
        welcome: true,
        clientId,
        serverVersion: this.version,
        capabilities: ['discovery', 'subscription', 'streaming'],
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleMessage(client: WebSocketClient, data: WebSocket.RawData): Promise<void> {
    const startTime = performance.now();
    let message: WebSocketMessage;

    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      this.sendError(client, 'Invalid JSON message');
      return;
    }

    client.requestCount++;

    try {
      switch (message.type) {
        case 'discovery':
          await this.handleDiscoveryMessage(client, message);
          break;
        case 'subscribe':
          await this.handleSubscribeMessage(client, message);
          break;
        case 'unsubscribe':
          await this.handleUnsubscribeMessage(client, message);
          break;
        case 'ping':
          this.handlePingMessage(client, message);
          break;
        case 'pong':
          // Client responded to our ping
          client.lastPong = new Date();
          break;
        default:
          this.sendError(client, `Unknown message type: ${message.type}`, message.id);
      }

      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime);

    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime, true);
      
      this.sendError(client, (error as Error).message, message.id);
    }
  }

  private async handleDiscoveryMessage(client: WebSocketClient, message: WebSocketMessage): Promise<void> {
    const query: DiscoveryQuery = message.data;
    const result = await this.router.discoverAgents(query);

    this.sendMessage(client, {
      id: message.id,
      type: 'discovery',
      data: {
        result: this.formatDiscoveryResult(result),
        query,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleSubscribeMessage(client: WebSocketClient, message: WebSocketMessage): Promise<void> {
    const { events } = message.data;
    
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array');
    }

    const validEvents = ['agent_registered', 'agent_updated', 'agent_removed', 'agent_health_changed'];
    for (const event of events) {
      if (validEvents.includes(event)) {
        client.subscriptions.add(event);
      }
    }

    this.sendMessage(client, {
      id: message.id,
      type: 'subscribe',
      data: {
        subscriptions: Array.from(client.subscriptions),
        message: `Subscribed to ${events.length} events`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleUnsubscribeMessage(client: WebSocketClient, message: WebSocketMessage): Promise<void> {
    const { events } = message.data;
    
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array');
    }

    for (const event of events) {
      client.subscriptions.delete(event);
    }

    this.sendMessage(client, {
      id: message.id,
      type: 'unsubscribe',
      data: {
        subscriptions: Array.from(client.subscriptions),
        message: `Unsubscribed from ${events.length} events`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private handlePingMessage(client: WebSocketClient, message: WebSocketMessage): void {
    this.sendMessage(client, {
      id: message.id,
      type: 'pong',
      data: {
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  private handleClientDisconnect(clientId: string, code: number, reason: Buffer): void {
    this.clients.delete(clientId);
    console.log(`WebSocket client disconnected: ${clientId} (${code}: ${reason})`);
  }

  private sendMessage(client: WebSocketClient, message: WebSocketMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to client ${client.id}:`, error);
      }
    }
  }

  private sendError(client: WebSocketClient, errorMessage: string, messageId?: string): void {
    this.sendMessage(client, {
      id: messageId || this.generateMessageId(),
      type: 'error',
      data: {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  private broadcastToSubscribers(event: RouterEvent, eventType: string): void {
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.has(eventType) && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client, {
          id: this.generateMessageId(),
          type: 'event',
          data: {
            event: eventType,
            agentId: event.agentId,
            timestamp: event.timestamp,
            data: event.data,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = new Date();
      const timeout = this.config.pongTimeout!;

      for (const [clientId, client] of this.clients) {
        const timeSinceLastPong = now.getTime() - client.lastPong.getTime();
        
        if (timeSinceLastPong > timeout * 2) {
          // Client hasn't responded to pings, disconnect
          console.log(`Disconnecting unresponsive client: ${clientId}`);
          client.ws.close(1000, 'Ping timeout');
          this.clients.delete(clientId);
        } else if (client.ws.readyState === WebSocket.OPEN) {
          // Send ping
          client.ws.ping();
        }
      }
    }, this.config.pingInterval);
  }

  private setupRouterEventListeners(): void {
    this.router.on('agent_registered', (event) => {
      this.broadcastToSubscribers(event, 'agent_registered');
    });

    this.router.on('agent_updated', (event) => {
      this.broadcastToSubscribers(event, 'agent_updated');
    });

    this.router.on('agent_removed', (event) => {
      this.broadcastToSubscribers(event, 'agent_removed');
    });

    this.router.on('agent_health_changed', (event) => {
      this.broadcastToSubscribers(event, 'agent_health_changed');
    });
  }

  private generateClientId(): string {
    return `ws-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}