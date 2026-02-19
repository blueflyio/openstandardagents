/**
 * MCP Transport Manager
 *
 * Manages MCP client connections using @modelcontextprotocol/sdk
 * Supports stdio, HTTP (SSE), and WebSocket transports
 *
 * @module adapters/a2a/mcp-transport
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';
import { SPEC_VERSION } from '../../version.js';

/**
 * MCP Transport Type
 */
export enum MCPTransportType {
  STDIO = 'stdio',
  HTTP = 'http',
  HTTPS = 'https',
  WEBSOCKET = 'ws',
  WEBSOCKET_SECURE = 'wss',
}

/**
 * MCP Transport Configuration
 */
export interface MCPTransportConfig {
  /** Transport type */
  type: MCPTransportType;
  /** Command for stdio transport */
  command?: string;
  /** Command arguments for stdio transport */
  args?: string[];
  /** URL for HTTP/WebSocket transport */
  url?: string;
  /** Connection timeout (ms) */
  timeout?: number;
  /** Request timeout (ms) */
  requestTimeout?: number;
}

/**
 * MCP Client Wrapper
 */
export interface MCPClientWrapper {
  /** Client ID */
  id: string;
  /** MCP Client instance */
  client: Client;
  /** Transport config */
  config: MCPTransportConfig;
  /** Connection timestamp */
  connectedAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Request count */
  requestCount: number;
}

/**
 * MCP Transport Manager
 * Manages MCP client connections and connection pooling
 */
export class MCPTransportManager {
  private clients: Map<string, MCPClientWrapper> = new Map();
  private connectionAttempts: Map<string, number> = new Map();
  private readonly maxRetries = 3;
  private readonly connectionTimeout = 30000; // 30 seconds
  private readonly requestTimeout = 30000; // 30 seconds

  /**
   * Get or create MCP client for URI
   */
  async getClient(uri: string): Promise<MCPClientWrapper> {
    // Check if client already exists
    const existingClient = this.clients.get(uri);
    if (existingClient) {
      existingClient.lastActivity = new Date();
      return existingClient;
    }

    // Parse URI and create new client
    const config = this.parseURI(uri);
    const client = await this.createClient(config);

    const wrapper: MCPClientWrapper = {
      id: crypto.randomUUID(),
      client,
      config,
      connectedAt: new Date(),
      lastActivity: new Date(),
      requestCount: 0,
    };

    this.clients.set(uri, wrapper);
    return wrapper;
  }

  /**
   * Create MCP client based on transport config
   */
  private async createClient(config: MCPTransportConfig): Promise<Client> {
    const timeout = config.timeout || this.connectionTimeout;

    // Create transport based on type
    let transport;

    switch (config.type) {
      case MCPTransportType.STDIO: {
        if (!config.command) {
          throw new Error('STDIO transport requires command');
        }
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args || [],
        });
        break;
      }

      case MCPTransportType.HTTP:
      case MCPTransportType.HTTPS: {
        if (!config.url) {
          throw new Error('HTTP transport requires URL');
        }
        transport = new SSEClientTransport(new URL(config.url));
        break;
      }

      case MCPTransportType.WEBSOCKET:
      case MCPTransportType.WEBSOCKET_SECURE: {
        throw new Error('WebSocket transport not yet implemented');
      }

      default: {
        throw new Error(`Unsupported transport type: ${config.type}`);
      }
    }

    // Create client
    const client = new Client(
      {
        name: 'OSSA A2A Client',
        version: SPEC_VERSION,
      },
      {
        capabilities: {
          roots: { listChanged: false },
          sampling: {},
        },
      }
    );

    // Connect with timeout
    try {
      await this.withTimeout(
        client.connect(transport),
        timeout,
        `Connection timeout after ${timeout}ms`
      );
    } catch (error) {
      throw new Error(
        `Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return client;
  }

  /**
   * Send request to MCP server
   */
  async sendRequest(
    uri: string,
    method: string,
    params: unknown
  ): Promise<unknown> {
    const wrapper = await this.getClient(uri);
    wrapper.requestCount++;
    wrapper.lastActivity = new Date();

    const timeout = wrapper.config.requestTimeout || this.requestTimeout;

    try {
      // Type assertion for generic MCP SDK requests - runtime behavior is correct
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestPromise = wrapper.client.request as any;
      const response = await this.withTimeout<unknown>(
        requestPromise.call(wrapper.client, { method, params }, z.unknown()),
        timeout,
        `Request timeout after ${timeout}ms`
      );

      return response;
    } catch (error) {
      // Handle connection errors - try to reconnect
      if (this.isConnectionError(error)) {
        await this.reconnect(uri);
        throw new Error(
          `Connection lost, reconnecting: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      throw error;
    }
  }

  /**
   * Parse URI to extract transport config
   */
  private parseURI(uri: string): MCPTransportConfig {
    try {
      const url = new URL(uri);

      switch (url.protocol) {
        case 'stdio:': {
          // stdio://command/path?arg1=val1&arg2=val2
          const command = url.hostname;
          const args: string[] = [];

          // Parse query params as command arguments
          url.searchParams.forEach((value, key) => {
            args.push(`--${key}=${value}`);
          });

          // Add path segments as positional args
          if (url.pathname && url.pathname !== '/') {
            args.push(...url.pathname.split('/').filter(Boolean));
          }

          return {
            type: MCPTransportType.STDIO,
            command,
            args,
          };
        }

        case 'http:': {
          return {
            type: MCPTransportType.HTTP,
            url: uri,
          };
        }

        case 'https:': {
          return {
            type: MCPTransportType.HTTPS,
            url: uri,
          };
        }

        case 'ws:': {
          return {
            type: MCPTransportType.WEBSOCKET,
            url: uri,
          };
        }

        case 'wss:': {
          return {
            type: MCPTransportType.WEBSOCKET_SECURE,
            url: uri,
          };
        }

        default: {
          throw new Error(`Unsupported protocol: ${url.protocol}`);
        }
      }
    } catch (error) {
      throw new Error(
        `Invalid MCP URI: ${uri} - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if error is a connection error
   */
  private isConnectionError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('etimedout') ||
        message.includes('connection') ||
        message.includes('disconnect')
      );
    }
    return false;
  }

  /**
   * Reconnect to MCP server
   */
  private async reconnect(uri: string): Promise<void> {
    const attempts = this.connectionAttempts.get(uri) || 0;

    if (attempts >= this.maxRetries) {
      this.connectionAttempts.delete(uri);
      throw new Error(
        `Max reconnection attempts (${this.maxRetries}) reached for ${uri}`
      );
    }

    // Close existing connection
    await this.disconnect(uri);

    // Increment retry counter
    this.connectionAttempts.set(uri, attempts + 1);

    // Wait before reconnecting (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Attempt reconnection
    try {
      await this.getClient(uri);
      this.connectionAttempts.delete(uri);
    } catch (error) {
      throw new Error(
        `Reconnection failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(uri: string): Promise<void> {
    const wrapper = this.clients.get(uri);
    if (!wrapper) {
      return;
    }

    try {
      await wrapper.client.close();
    } catch (error) {
      console.error(
        `Error closing MCP connection to ${uri}:`,
        error instanceof Error ? error.message : String(error)
      );
    }

    this.clients.delete(uri);
  }

  /**
   * Disconnect all clients
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map((uri) =>
      this.disconnect(uri)
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Get active connections
   */
  getConnections(): MCPClientWrapper[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get connection stats
   */
  getStats(): {
    totalConnections: number;
    totalRequests: number;
    connections: Array<{
      uri: string;
      connectedAt: Date;
      requestCount: number;
      lastActivity: Date;
    }>;
  } {
    const connections = Array.from(this.clients.entries()).map(
      ([uri, wrapper]) => ({
        uri,
        connectedAt: wrapper.connectedAt,
        requestCount: wrapper.requestCount,
        lastActivity: wrapper.lastActivity,
      })
    );

    return {
      totalConnections: this.clients.size,
      totalRequests: connections.reduce(
        (sum, conn) => sum + conn.requestCount,
        0
      ),
      connections,
    };
  }

  /**
   * Helper to wrap promise with timeout
   */
  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  }
}
