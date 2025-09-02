/**
 * OSSA v0.1.3 - Model Context Protocol (MCP) Server Integration
 * Provides standardized MCP server implementation for OSSA-compliant agents
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

interface OSSAAgentConfig {
  agent: {
    id: string;
    name: string;
    version: string;
    capabilities: {
      primary: Array<{ id: string; name: string; description: string }>;
      secondary?: Array<{ id: string; name: string; description: string }>;
    };
  };
  frameworks: {
    mcp: {
      enabled: boolean;
      server_name: string;
      tools: Array<{
        name: string;
        description: string;
        parameters: Record<string, any>;
      }>;
      prompts?: Array<{
        name: string;
        description: string;
      }>;
    };
  };
}

export class OSSAMCPServer {
  private server: Server;
  private config: OSSAAgentConfig;

  constructor(config: OSSAAgentConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.frameworks.mcp.server_name,
        version: config.agent.version,
        description: `OSSA v0.1.3 MCP Server for ${config.agent.name}`,
        capabilities: {
          tools: {},
          prompts: config.frameworks.mcp.prompts ? {} : undefined,
        },
      },
      {
        capabilities: {
          experimental: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.config.frameworks.mcp.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: tool.parameters,
            required: Object.keys(tool.parameters).filter(
              key => tool.parameters[key].required
            ),
          },
        })),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Find the tool configuration
      const toolConfig = this.config.frameworks.mcp.tools.find(
        tool => tool.name === name
      );

      if (!toolConfig) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool '${name}' not found`
        );
      }

      try {
        // Route to appropriate handler based on tool name
        const result = await this.handleToolCall(name, args || {});
        
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool '${name}': ${error.message}`
        );
      }
    });
  }

  private async handleToolCall(toolName: string, args: Record<string, any>): Promise<any> {
    // Implementation-specific tool routing
    switch (toolName) {
      case 'process_task':
        return this.processTask(args);
      
      case 'get_status':
        return this.getStatus();
      
      case 'analyze_data':
        return this.analyzeData(args);
      
      case 'execute_workflow':
        return this.executeWorkflow(args);
      
      default:
        // Try to find a dynamic handler
        const handler = this.getDynamicHandler(toolName);
        if (handler) {
          return handler(args);
        }
        
        throw new Error(`No handler implemented for tool: ${toolName}`);
    }
  }

  private async processTask(args: { task: string; context?: any }): Promise<any> {
    // Default task processing implementation
    return {
      task_id: this.generateTaskId(),
      status: 'accepted',
      message: `Task '${args.task}' has been accepted for processing`,
      timestamp: new Date().toISOString(),
    };
  }

  private async getStatus(): Promise<any> {
    return {
      agent_id: this.config.agent.id,
      agent_name: this.config.agent.name,
      version: this.config.agent.version,
      status: 'healthy',
      capabilities: this.config.agent.capabilities.primary.length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  private async analyzeData(args: { data: any; type?: string }): Promise<any> {
    // Default data analysis implementation
    return {
      analysis_id: this.generateTaskId(),
      type: args.type || 'general',
      summary: 'Data analysis completed',
      insights: [],
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeWorkflow(args: { workflow: string; parameters?: any }): Promise<any> {
    // Default workflow execution implementation
    return {
      workflow_id: this.generateTaskId(),
      workflow_name: args.workflow,
      status: 'started',
      steps: [],
      timestamp: new Date().toISOString(),
    };
  }

  private getDynamicHandler(toolName: string): ((args: any) => Promise<any>) | null {
    // Override this method in subclasses for custom tool handlers
    return null;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`OSSA MCP Server '${this.config.frameworks.mcp.server_name}' started`);
  }

  public async stop() {
    await this.server.close();
    console.error(`OSSA MCP Server stopped`);
  }
}

// Example usage:
export function createOSSAMCPServer(agentConfig: OSSAAgentConfig): OSSAMCPServer {
  return new OSSAMCPServer(agentConfig);
}

// Extended server class for custom implementations
export abstract class ExtendedOSSAMCPServer extends OSSAMCPServer {
  protected abstract handleCustomTool(toolName: string, args: any): Promise<any>;

  protected getDynamicHandler(toolName: string): ((args: any) => Promise<any>) | null {
    return (args: any) => this.handleCustomTool(toolName, args);
  }
}

export default OSSAMCPServer;