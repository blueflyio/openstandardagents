/**
 * MCP (Model Context Protocol) Integration
 *
 * Integrates OSSA A2A protocol with MCP specification
 * Enables cross-language agent communication (TypeScript ↔ PHP ↔ Python)
 *
 * References:
 * - MCP Spec: https://spec.modelcontextprotocol.io/
 * - Symfony MCP Bundle: https://github.com/symfony/mcp-bundle
 * - PHP MCP SDK: https://github.com/modelcontextprotocol/php-sdk
 *
 * @module adapters/a2a/mcp-integration
 */

import { z } from 'zod';
import type { AgentIdentity, A2AMessage } from './a2a-protocol.js';
import { MCPTransportManager } from './mcp-transport.js';

/**
 * MCP Protocol Version
 */
export const MCP_PROTOCOL_VERSION = '2024-11-05';

/**
 * MCP Message Types
 */
export enum MCPMessageType {
  /** Initialize connection */
  INITIALIZE = 'initialize',
  /** Initialized response */
  INITIALIZED = 'initialized',
  /** List resources */
  RESOURCES_LIST = 'resources/list',
  /** Read resource */
  RESOURCES_READ = 'resources/read',
  /** List prompts */
  PROMPTS_LIST = 'prompts/list',
  /** Get prompt */
  PROMPTS_GET = 'prompts/get',
  /** List tools */
  TOOLS_LIST = 'tools/list',
  /** Call tool */
  TOOLS_CALL = 'tools/call',
  /** Ping */
  PING = 'ping',
  /** Notification */
  NOTIFICATION = 'notification',
}

/**
 * MCP Resource
 * Represents data/content exposed by an MCP server
 */
export interface MCPResource {
  /** Resource URI */
  uri: string;
  /** Resource name */
  name: string;
  /** Resource description */
  description?: string;
  /** MIME type */
  mimeType?: string;
  /** Resource metadata */
  metadata?: Record<string, unknown>;
}

/**
 * MCP Prompt
 * Represents a prompt template from an MCP server
 */
export interface MCPPrompt {
  /** Prompt name */
  name: string;
  /** Prompt description */
  description?: string;
  /** Required arguments */
  arguments?: MCPPromptArgument[];
}

/**
 * MCP Prompt Argument
 */
export interface MCPPromptArgument {
  /** Argument name */
  name: string;
  /** Argument description */
  description?: string;
  /** Is required */
  required?: boolean;
}

/**
 * MCP Tool
 * Represents a function callable via MCP
 */
export interface MCPTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description?: string;
  /** Input schema (JSON Schema) */
  inputSchema: Record<string, unknown>;
}

/**
 * MCP Connection
 * Represents a connection to an MCP server
 */
export interface MCPConnection {
  /** Connection ID */
  id: string;
  /** MCP server URI */
  uri: string;
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Protocol version */
  protocolVersion: string;
  /** Capabilities */
  capabilities: MCPCapabilities;
  /** Connection status */
  status: 'connected' | 'disconnected' | 'error';
  /** Last activity timestamp */
  lastActivity: string;
}

/**
 * MCP Server Capabilities
 */
export interface MCPCapabilities {
  /** Supports resources */
  resources?: {
    /** Supports listing resources */
    list?: boolean;
    /** Supports subscribing to resources */
    subscribe?: boolean;
  };
  /** Supports prompts */
  prompts?: {
    /** Supports listing prompts */
    list?: boolean;
  };
  /** Supports tools */
  tools?: {
    /** Supports listing tools */
    list?: boolean;
  };
  /** Supports logging */
  logging?: {
    /** Log levels supported */
    levels?: string[];
  };
}

/**
 * MCP Server
 * Represents an OSSA agent exposed as an MCP server
 */
export interface MCPServer {
  /** Server ID */
  id: string;
  /** Agent identity */
  agent: AgentIdentity;
  /** Server endpoint */
  endpoint: string;
  /** Server capabilities */
  capabilities: MCPCapabilities;
  /** Exposed resources */
  resources: MCPResource[];
  /** Exposed prompts */
  prompts: MCPPrompt[];
  /** Exposed tools */
  tools: MCPTool[];
}

/**
 * MCP Integration Service
 * Bridges OSSA A2A protocol with MCP
 */
export class MCPIntegrationService {
  private connections: Map<string, MCPConnection> = new Map();
  private servers: Map<string, MCPServer> = new Map();
  private transportManager: MCPTransportManager = new MCPTransportManager();

  /**
   * Connect to an MCP server
   */
  async connectMCPServer(uri: string): Promise<MCPConnection> {
    // Parse MCP server URI
    const url = new URL(uri);

    // Initialize connection
    const connectionId = crypto.randomUUID();
    const connection: MCPConnection = {
      id: connectionId,
      uri,
      name: url.hostname,
      version: '1.0.0', // Will be updated from server
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      status: 'connected',
      lastActivity: new Date().toISOString(),
    };

    // Send initialize request
    const initResponse = await this.sendMCPMessage(uri, {
      jsonrpc: '2.0',
      id: connectionId,
      method: MCPMessageType.INITIALIZE,
      params: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: {
          name: 'OSSA Agent',
          version: '0.4.4',
        },
      },
    });

    // Update connection with server info
    connection.name = initResponse.serverInfo?.name || connection.name;
    connection.version = initResponse.serverInfo?.version || connection.version;
    connection.capabilities = initResponse.capabilities || {};

    this.connections.set(connectionId, connection);

    return connection;
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectMCPServer(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`MCP connection not found: ${connectionId}`);
    }

    connection.status = 'disconnected';
    this.connections.delete(connectionId);
  }

  /**
   * Expose OSSA agent as MCP server
   */
  async exposeMCPServer(agent: AgentIdentity): Promise<MCPServer> {
    const serverId = crypto.randomUUID();

    const server: MCPServer = {
      id: serverId,
      agent,
      endpoint: `mcp://${agent.namespace}/${agent.name}`,
      capabilities: {
        resources: { list: true, subscribe: false },
        prompts: { list: true },
        tools: { list: true },
        logging: { levels: ['debug', 'info', 'warn', 'error'] },
      },
      resources: [],
      prompts: [],
      tools: [],
    };

    this.servers.set(serverId, server);

    return server;
  }

  /**
   * Discover available MCP resources
   */
  async discoverResources(connectionId: string): Promise<MCPResource[]> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`MCP connection not found: ${connectionId}`);
    }

    const response = await this.sendMCPMessage(connection.uri, {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: MCPMessageType.RESOURCES_LIST,
      params: {},
    });

    return response.resources || [];
  }

  /**
   * Discover available MCP prompts
   */
  async discoverPrompts(connectionId: string): Promise<MCPPrompt[]> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`MCP connection not found: ${connectionId}`);
    }

    const response = await this.sendMCPMessage(connection.uri, {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: MCPMessageType.PROMPTS_LIST,
      params: {},
    });

    return response.prompts || [];
  }

  /**
   * Discover available MCP tools
   */
  async discoverTools(connectionId: string): Promise<MCPTool[]> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`MCP connection not found: ${connectionId}`);
    }

    const response = await this.sendMCPMessage(connection.uri, {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: MCPMessageType.TOOLS_LIST,
      params: {},
    });

    return response.tools || [];
  }

  /**
   * Call an MCP tool
   */
  async callTool(
    connectionId: string,
    toolName: string,
    arguments_: Record<string, unknown>
  ): Promise<unknown> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`MCP connection not found: ${connectionId}`);
    }

    const response = await this.sendMCPMessage(connection.uri, {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: MCPMessageType.TOOLS_CALL,
      params: {
        name: toolName,
        arguments: arguments_,
      },
    });

    return response.content || response.result;
  }

  /**
   * Read an MCP resource
   */
  async readResource(connectionId: string, uri: string): Promise<unknown> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`MCP connection not found: ${connectionId}`);
    }

    const response = await this.sendMCPMessage(connection.uri, {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: MCPMessageType.RESOURCES_READ,
      params: { uri },
    });

    return response.contents || response.content;
  }

  /**
   * Convert A2A message to MCP message
   */
  a2aToMCP(message: A2AMessage): unknown {
    return {
      jsonrpc: '2.0',
      id: message.id,
      method: this.mapA2ATypeToMCP(message.type),
      params: message.payload,
      metadata: {
        from: message.from.uri,
        traceContext: message.metadata.traceContext,
      },
    };
  }

  /**
   * Convert MCP message to A2A message
   */
  mcpToA2A(
    mcpMessage: unknown,
    from: AgentIdentity,
    to: AgentIdentity
  ): A2AMessage {
    const msg = mcpMessage as any;

    return {
      id: msg.id || crypto.randomUUID(),
      from,
      to,
      type: this.mapMCPTypeToA2A(msg.method),
      payload: msg.params || msg.result,
      version: '0.4.4',
      metadata: {
        priority: 'normal' as any,
        timeout: 30000,
        retries: 3,
        traceContext: msg.metadata?.traceContext || this.createTraceContext(),
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Send MCP message using real transport
   */
  private async sendMCPMessage(uri: string, message: any): Promise<any> {
    try {
      // Extract method and params from message
      const method = message.method || 'unknown';
      const params = message.params || {};

      // Send request via transport manager
      const response = await this.transportManager.sendRequest(
        uri,
        method,
        params
      );

      // Return response in expected format
      return response;
    } catch (error) {
      console.error(
        `Error sending MCP message to ${uri}:`,
        error instanceof Error ? error.message : String(error)
      );

      // Re-throw with context
      throw new Error(
        `MCP request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Cleanup - disconnect all MCP connections
   */
  async cleanup(): Promise<void> {
    await this.transportManager.disconnectAll();
  }

  /**
   * Get transport statistics
   */
  getTransportStats() {
    return this.transportManager.getStats();
  }

  /**
   * Map A2A message type to MCP method
   */
  private mapA2ATypeToMCP(type: string): string {
    const mapping: Record<string, string> = {
      request: MCPMessageType.TOOLS_CALL,
      command: MCPMessageType.TOOLS_CALL,
      event: MCPMessageType.NOTIFICATION,
    };
    return mapping[type] || MCPMessageType.NOTIFICATION;
  }

  /**
   * Map MCP method to A2A message type
   */
  private mapMCPTypeToA2A(method: string): any {
    const mapping: Record<string, string> = {
      [MCPMessageType.TOOLS_CALL]: 'command',
      [MCPMessageType.NOTIFICATION]: 'event',
      [MCPMessageType.RESOURCES_READ]: 'request',
    };
    return mapping[method] || 'event';
  }

  /**
   * Create trace context
   */
  private createTraceContext(): any {
    const traceId = this.generateHex(32);
    const spanId = this.generateHex(16);
    return {
      traceparent: `00-${traceId}-${spanId}-01`,
      traceId,
      spanId,
    };
  }

  /**
   * Generate random hex string
   */
  private generateHex(length: number): string {
    return Array.from({ length }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Get all active connections
   */
  getConnections(): MCPConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get all exposed servers
   */
  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }
}
