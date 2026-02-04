/**
 * WebSocket Server for Dev Mode
 *
 * Pushes real-time updates to connected clients
 *
 * Features:
 * - File change notifications
 * - Validation results
 * - Hot reload triggers
 * - Client management
 *
 * SOLID: Single Responsibility - WebSocket communication
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { FileChangeEvent } from './file-watcher.js';
import type { ValidationResult } from './live-validator.js';

export interface WebSocketServerOptions {
  /**
   * HTTP server to attach to
   */
  server?: Server;

  /**
   * Port to listen on (if no server provided)
   * @default 8080
   */
  port?: number;

  /**
   * WebSocket path
   * @default '/ws'
   */
  path?: string;
}

export interface DevServerMessage {
  /**
   * Message type
   */
  type: 'file_change' | 'validation' | 'reload' | 'error' | 'connected';

  /**
   * Message timestamp
   */
  timestamp: Date;

  /**
   * Message data
   */
  data?: unknown;
}

export interface FileChangeMessage extends DevServerMessage {
  type: 'file_change';
  data: {
    event: FileChangeEvent;
  };
}

export interface ValidationMessage extends DevServerMessage {
  type: 'validation';
  data: {
    result: ValidationResult;
  };
}

export interface ReloadMessage extends DevServerMessage {
  type: 'reload';
  data: {
    filePath: string;
    reason: string;
  };
}

export interface ErrorMessage extends DevServerMessage {
  type: 'error';
  data: {
    message: string;
    details?: unknown;
  };
}

export interface ConnectedMessage extends DevServerMessage {
  type: 'connected';
  data: {
    serverVersion: string;
    watchedFiles: string[];
  };
}

/**
 * WebSocket Server for Development Mode
 *
 * Manages WebSocket connections and broadcasts updates
 */
export class DevWebSocketServer {
  private wss?: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private options: Required<WebSocketServerOptions>;
  private messageQueue: DevServerMessage[] = [];
  private readonly MAX_QUEUE_SIZE = 100;

  constructor(options: WebSocketServerOptions = {}) {
    this.options = {
      server: undefined,
      port: 8080,
      path: '/ws',
      ...options,
    } as Required<WebSocketServerOptions>;
  }

  /**
   * Start WebSocket server
   */
  async start(): Promise<void> {
    if (this.wss) {
      throw new Error('WebSocket server is already running');
    }

    const wsOptions: { server?: Server; port?: number; path?: string } = {
      path: this.options.path,
    };

    if (this.options.server) {
      wsOptions.server = this.options.server;
    } else {
      wsOptions.port = this.options.port;
    }

    this.wss = new WebSocketServer(wsOptions);

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    console.log(
      `WebSocket server started on ${this.options.server ? 'attached server' : `port ${this.options.port}`}`
    );
  }

  /**
   * Stop WebSocket server
   */
  async stop(): Promise<void> {
    if (!this.wss) {
      return;
    }

    // Close all client connections
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();

    // Close server
    await new Promise<void>((resolve, reject) => {
      this.wss!.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    this.wss = undefined;
    console.log('WebSocket server stopped');
  }

  /**
   * Broadcast file change event
   */
  broadcastFileChange(event: FileChangeEvent): void {
    const message: FileChangeMessage = {
      type: 'file_change',
      timestamp: new Date(),
      data: { event },
    };
    this.broadcast(message);
  }

  /**
   * Broadcast validation result
   */
  broadcastValidation(result: ValidationResult): void {
    const message: ValidationMessage = {
      type: 'validation',
      timestamp: new Date(),
      data: { result },
    };
    this.broadcast(message);
  }

  /**
   * Broadcast reload request
   */
  broadcastReload(filePath: string, reason: string): void {
    const message: ReloadMessage = {
      type: 'reload',
      timestamp: new Date(),
      data: { filePath, reason },
    };
    this.broadcast(message);
  }

  /**
   * Broadcast error
   */
  broadcastError(errorMessage: string, details?: unknown): void {
    const message: ErrorMessage = {
      type: 'error',
      timestamp: new Date(),
      data: {
        message: errorMessage,
        details,
      },
    };
    this.broadcast(message);
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    console.log('New WebSocket client connected');
    this.clients.add(ws);

    // Send connection confirmation
    const message: ConnectedMessage = {
      type: 'connected',
      timestamp: new Date(),
      data: {
        serverVersion: process.env.npm_package_version || '0.4.1',
        watchedFiles: [],
      },
    };
    this.sendMessage(ws, message);

    // Send queued messages
    for (const queuedMessage of this.messageQueue) {
      this.sendMessage(ws, queuedMessage);
    }

    // Handle messages from client
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('Error parsing client message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      this.clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      this.clients.delete(ws);
    });
  }

  /**
   * Handle message from client
   */
  private handleClientMessage(ws: WebSocket, message: unknown): void {
    // Echo back for now (can add commands later)
    console.log('Received message from client:', message);
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: DevServerMessage): void {
    // Add to queue for new connections
    this.messageQueue.push(message);
    if (this.messageQueue.length > this.MAX_QUEUE_SIZE) {
      this.messageQueue.shift(); // Remove oldest
    }

    // Send to all connected clients
    const json = JSON.stringify(message);
    const deadClients: WebSocket[] = [];

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(json);
        } catch (error) {
          console.error('Error sending message to client:', error);
          deadClients.push(client);
        }
      } else {
        deadClients.push(client);
      }
    }

    // Clean up dead clients
    for (const client of deadClients) {
      this.clients.delete(client);
    }
  }

  /**
   * Send message to specific client
   */
  private sendMessage(ws: WebSocket, message: DevServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }
}
