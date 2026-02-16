/**
 * A2A Tool Implementation
 *
 * OSSA tool for agent-to-agent communication
 *
 * @module adapters/a2a/a2a-tool
 */

import type { Tool } from '../../types/tool.js';
import type {
  A2AMessage,
  AgentIdentity,
  CoordinationPattern,
} from './a2a-protocol.js';
import { AgentMesh } from './agent-mesh.js';
import { MCPIntegrationService } from './mcp-integration.js';
import { SwarmOrchestrator } from './swarm-orchestration.js';
import { DelegationService } from './delegation.js';

/**
 * A2A Tool Handler Configuration
 */
export interface A2AToolConfig {
  /** Agent mesh instance */
  mesh: AgentMesh;
  /** MCP integration service */
  mcp: MCPIntegrationService;
  /** Swarm orchestrator */
  swarm: SwarmOrchestrator;
  /** Delegation service */
  delegation: DelegationService;
}

/**
 * A2A Tool Parameters
 */
export interface A2AToolParameters {
  /** Target agent ID to communicate with */
  targetAgent: string;
  /** Message payload */
  message: unknown;
  /** Communication pattern */
  pattern?: 'request-reply' | 'broadcast' | 'pub-sub' | 'pipeline';
  /** Message priority */
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  /** Message timeout (milliseconds) */
  timeout?: number;
  /** Enable tracing */
  trace?: boolean;
}

/**
 * A2A Tool Result
 */
export interface A2AToolResult {
  /** Success status */
  success: boolean;
  /** Response from target agent */
  response?: unknown;
  /** Trace ID (if tracing enabled) */
  traceId?: string;
  /** Error message (if failed) */
  error?: string;
  /** Execution metadata */
  metadata?: {
    /** Duration (milliseconds) */
    duration?: number;
    /** Target agent info */
    targetAgent?: AgentIdentity;
    /** Pattern used */
    pattern?: string;
  };
}

/**
 * A2A Tool Definition
 * Tool for agent-to-agent communication using MCP protocol
 */
export const A2A_TOOL: Tool = {
  type: 'a2a',
  name: 'agent_communicate',
  description: 'Communicate with other agents in the mesh using MCP protocol',
  endpoint: 'mesh://agents/{agentId}',
  capabilities: ['a2a', 'mcp', 'mesh', 'swarm'],
  input_schema: {
    type: 'object',
    properties: {
      targetAgent: {
        type: 'string',
        description:
          'Agent ID or URI to communicate with (format: agent://namespace/name or UUID)',
      },
      message: {
        type: 'object',
        description: 'Message payload to send to target agent',
      },
      pattern: {
        type: 'string',
        enum: ['request-reply', 'broadcast', 'pub-sub', 'pipeline'],
        description: 'Communication pattern to use',
        default: 'request-reply',
      },
      priority: {
        type: 'string',
        enum: ['low', 'normal', 'high', 'urgent', 'critical'],
        description: 'Message priority level',
        default: 'normal',
      },
      timeout: {
        type: 'number',
        description: 'Message timeout in milliseconds',
        default: 30000,
        minimum: 1000,
        maximum: 300000,
      },
      trace: {
        type: 'boolean',
        description: 'Enable distributed tracing for this communication',
        default: true,
      },
    },
    required: ['targetAgent', 'message'],
  },
  output_schema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the communication was successful',
      },
      response: {
        description: 'Response from target agent',
      },
      traceId: {
        type: 'string',
        description: 'Trace ID for distributed tracing',
      },
      error: {
        type: 'string',
        description: 'Error message if communication failed',
      },
      metadata: {
        type: 'object',
        description: 'Execution metadata',
        properties: {
          duration: {
            type: 'number',
            description: 'Execution duration in milliseconds',
          },
          targetAgent: {
            type: 'object',
            description: 'Target agent information',
          },
          pattern: {
            type: 'string',
            description: 'Communication pattern used',
          },
        },
      },
    },
    required: ['success'],
  },
  metadata: {
    version: '0.4.4',
    tags: ['a2a', 'mcp', 'mesh', 'communication', 'swarm'],
    documentation: 'https://spec.modelcontextprotocol.io/',
  },
};

/**
 * A2A Tool Handler
 * Handles agent-to-agent communication requests
 */
export class A2AToolHandler {
  constructor(private config: A2AToolConfig) {}

  /**
   * Execute A2A tool
   */
  async execute(params: A2AToolParameters): Promise<A2AToolResult> {
    const startTime = Date.now();

    try {
      // Validate parameters
      this.validateParameters(params);

      // Resolve target agent
      const targetAgent = this.resolveAgent(params.targetAgent);

      // Get source agent (current agent executing the tool)
      const sourceAgent = this.getCurrentAgent();

      // Create message
      const message: A2AMessage = {
        id: crypto.randomUUID(),
        from: sourceAgent,
        to: targetAgent,
        type: this.mapPatternToMessageType(params.pattern || 'request-reply'),
        payload: params.message,
        version: '0.4.4',
        metadata: {
          priority: (params.priority || 'normal') as any,
          timeout: params.timeout || 30000,
          retries: 3,
          traceContext: this.createTraceContext(),
          createdAt: new Date().toISOString(),
        },
      };

      // Execute based on pattern
      const response = await this.executePattern(
        message,
        params.pattern || 'request-reply'
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        response,
        traceId: params.trace
          ? message.metadata.traceContext.traceId
          : undefined,
        metadata: {
          duration,
          targetAgent,
          pattern: params.pattern || 'request-reply',
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration,
        },
      };
    }
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcast(
    targetAgents: string[],
    message: unknown,
    options?: Partial<A2AToolParameters>
  ): Promise<A2AToolResult[]> {
    const results: A2AToolResult[] = [];

    for (const targetAgent of targetAgents) {
      const result = await this.execute({
        targetAgent,
        message,
        pattern: 'broadcast',
        ...options,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Pub-sub pattern
   */
  async publish(topic: string, message: unknown): Promise<A2AToolResult> {
    // Find all agents subscribed to topic
    const subscribers = this.config.mesh.discoverAgents([`subscribe:${topic}`]);

    if (subscribers.length === 0) {
      return {
        success: false,
        error: `No subscribers found for topic: ${topic}`,
      };
    }

    // Broadcast to all subscribers
    const results = await this.broadcast(
      subscribers.map((s) => s.identity.id),
      message,
      { pattern: 'pub-sub' }
    );

    const allSuccessful = results.every((r) => r.success);

    return {
      success: allSuccessful,
      response: results,
      metadata: {
        pattern: 'pub-sub',
      },
    };
  }

  /**
   * Pipeline pattern (sequential execution)
   */
  async pipeline(
    agents: string[],
    initialMessage: unknown
  ): Promise<A2AToolResult> {
    let currentMessage = initialMessage;

    for (const agentId of agents) {
      const result = await this.execute({
        targetAgent: agentId,
        message: currentMessage,
        pattern: 'pipeline',
      });

      if (!result.success) {
        return result;
      }

      currentMessage = result.response;
    }

    return {
      success: true,
      response: currentMessage,
      metadata: {
        pattern: 'pipeline',
      },
    };
  }

  // Private helper methods

  private validateParameters(params: A2AToolParameters): void {
    if (!params.targetAgent) {
      throw new Error('targetAgent is required');
    }

    if (!params.message) {
      throw new Error('message is required');
    }

    if (params.timeout && (params.timeout < 1000 || params.timeout > 300000)) {
      throw new Error('timeout must be between 1000 and 300000 milliseconds');
    }
  }

  private resolveAgent(agentId: string): AgentIdentity {
    // Try to get agent from mesh
    const agent = this.config.mesh.getAgent(agentId);

    if (agent) {
      return agent.identity;
    }

    // Parse agent URI if provided
    if (agentId.startsWith('agent://')) {
      const match = agentId.match(/^agent:\/\/([^/]+)\/(.+)$/);
      if (match) {
        return {
          id: crypto.randomUUID(),
          namespace: match[1],
          name: match[2],
          uri: agentId,
          capabilities: [],
          version: '1.0.0',
        };
      }
    }

    throw new Error(`Agent not found: ${agentId}`);
  }

  private getCurrentAgent(): AgentIdentity {
    // In real implementation, would get from context
    return {
      id: 'current-agent',
      namespace: 'default',
      name: 'current',
      uri: 'agent://default/current',
      capabilities: [],
      version: '1.0.0',
    };
  }

  private mapPatternToMessageType(pattern: string): any {
    const mapping: Record<string, string> = {
      'request-reply': 'request',
      broadcast: 'broadcast',
      'pub-sub': 'event',
      pipeline: 'command',
    };
    return mapping[pattern] || 'request';
  }

  private createTraceContext(): any {
    const traceId = this.generateHex(32);
    const spanId = this.generateHex(16);
    return {
      traceparent: `00-${traceId}-${spanId}-01`,
      traceId,
      spanId,
    };
  }

  private generateHex(length: number): string {
    return Array.from({ length }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private async executePattern(
    message: A2AMessage,
    pattern: string
  ): Promise<unknown> {
    switch (pattern) {
      case 'request-reply':
        return this.executeRequestReply(message);

      case 'broadcast':
        return this.executeBroadcast(message);

      case 'pub-sub':
        return this.executePubSub(message);

      case 'pipeline':
        return this.executePipeline(message);

      default:
        throw new Error(`Unknown pattern: ${pattern}`);
    }
  }

  private async executeRequestReply(message: A2AMessage): Promise<unknown> {
    // Route message through mesh
    const targetNode = this.config.mesh.routeRequest(message);

    // Trace the call
    const trace = this.config.mesh.traceCall(
      targetNode,
      targetNode,
      message.payload
    );

    try {
      // Send via MCP
      const mcpMessage = this.config.mcp.a2aToMCP(message);

      // Simulate response (in real implementation, would send to actual agent)
      const response = { result: 'success', data: message.payload };

      this.config.mesh.completeTrace(trace.traceId, true);

      return response;
    } catch (error) {
      const a2aError = new (class extends Error {
        type: any = 'UNKNOWN';
        retryable = true;
      })(error instanceof Error ? error.message : 'Unknown error');

      this.config.mesh.completeTrace(trace.traceId, false, a2aError as any);
      throw error;
    }
  }

  private async executeBroadcast(message: A2AMessage): Promise<unknown> {
    // Broadcast is handled by caller
    return { broadcasted: true };
  }

  private async executePubSub(message: A2AMessage): Promise<unknown> {
    // Pub-sub is handled by caller
    return { published: true };
  }

  private async executePipeline(message: A2AMessage): Promise<unknown> {
    // Pipeline is handled by caller
    return message.payload;
  }
}

/**
 * Create A2A tool handler
 */
export function createA2AToolHandler(config: A2AToolConfig): A2AToolHandler {
  return new A2AToolHandler(config);
}
