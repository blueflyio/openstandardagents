/**
 * ADK Tool System for OSSA
 * Maps OSSA capabilities to ADK tools and AgentTools
 */

import { ADKAgent } from '../agents/index.js';

export interface ADKTool {
  name: string;
  description: string;
  parameters?: any;
  function: (params: any) => Promise<any>;
}

export interface AgentTool extends ADKTool {
  agent: ADKAgent;
  delegation_type: 'explicit' | 'implicit';
}

/**
 * OSSA Tool Registry for ADK
 */
export class OSSAToolRegistry {
  private tools: Map<string, ADKTool> = new Map();
  private agentTools: Map<string, AgentTool> = new Map();
  private capabilityMapping: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultTools();
    this.initializeCapabilityMappings();
  }

  /**
   * Initialize default OSSA tools
   */
  private initializeDefaultTools(): void {
    // Data processing tools
    this.registerTool({
      name: 'process_data',
      description: 'Process and transform data',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'any' },
          operation: { type: 'string' }
        }
      },
      function: async (params) => {
        return {
          processed: true,
          data: params.data,
          operation: params.operation
        };
      }
    });

    // API interaction tools
    this.registerTool({
      name: 'api_call',
      description: 'Make API calls to external services',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string' },
          body: { type: 'any' }
        }
      },
      function: async (params) => {
        return {
          status: 200,
          response: 'API call simulated',
          url: params.url
        };
      }
    });

    // Database operations
    this.registerTool({
      name: 'database_query',
      description: 'Execute database queries',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          params: { type: 'array' }
        }
      },
      function: async (params) => {
        return {
          rows: [],
          query: params.query
        };
      }
    });

    // File operations
    this.registerTool({
      name: 'file_operation',
      description: 'Perform file system operations',
      parameters: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['read', 'write', 'delete'] },
          path: { type: 'string' },
          content: { type: 'string' }
        }
      },
      function: async (params) => {
        return {
          success: true,
          operation: params.operation,
          path: params.path
        };
      }
    });

    // Validation tools
    this.registerTool({
      name: 'validate',
      description: 'Validate data against schemas',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'any' },
          schema: { type: 'any' }
        }
      },
      function: async (params) => {
        return {
          valid: true,
          errors: []
        };
      }
    });

    // Monitoring tools
    this.registerTool({
      name: 'collect_metrics',
      description: 'Collect system metrics',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string' },
          metrics: { type: 'array' }
        }
      },
      function: async (params) => {
        return {
          metrics: {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            timestamp: new Date().toISOString()
          }
        };
      }
    });
  }

  /**
   * Initialize capability to tool mappings
   */
  private initializeCapabilityMappings(): void {
    // Map OSSA capabilities to tools
    this.capabilityMapping.set('data-processing', ['process_data', 'validate']);
    this.capabilityMapping.set('api-integration', ['api_call']);
    this.capabilityMapping.set('database-operations', ['database_query']);
    this.capabilityMapping.set('file-management', ['file_operation']);
    this.capabilityMapping.set('validation', ['validate']);
    this.capabilityMapping.set('monitoring', ['collect_metrics']);
    this.capabilityMapping.set('orchestration', []);  // Uses AgentTools instead
    this.capabilityMapping.set('governance', ['validate']);
  }

  /**
   * Register a new tool
   */
  registerTool(tool: ADKTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register an agent as a tool (AgentTool pattern)
   */
  registerAgentTool(agent: ADKAgent, delegationType: 'explicit' | 'implicit' = 'explicit'): void {
    const agentTool: AgentTool = {
      name: `invoke_${agent.config.name}`,
      description: `Delegate to ${agent.config.name} agent: ${agent.config.description}`,
      agent,
      delegation_type: delegationType,
      function: async (params) => {
        // Simulate agent invocation
        return {
          delegated_to: agent.config.name,
          input: params,
          result: `Executed by ${agent.config.name}`
        };
      }
    };
    
    this.agentTools.set(agentTool.name, agentTool);
  }

  /**
   * Get tools for capabilities
   */
  getToolsForCapabilities(capabilities: string[]): ADKTool[] {
    const toolNames = new Set<string>();
    
    for (const capability of capabilities) {
      const mappedTools = this.capabilityMapping.get(capability) || [];
      mappedTools.forEach(name => toolNames.add(name));
    }
    
    const tools: ADKTool[] = [];
    for (const name of toolNames) {
      const tool = this.tools.get(name);
      if (tool) {
        tools.push(tool);
      }
    }
    
    return tools;
  }

  /**
   * Get agent tools for orchestration
   */
  getAgentTools(): AgentTool[] {
    return Array.from(this.agentTools.values());
  }

  /**
   * Execute a tool
   */
  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name) || this.agentTools.get(name);
    
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    return tool.function(params);
  }

  /**
   * List all available tools
   */
  listTools(): { standard: string[], agent: string[] } {
    return {
      standard: Array.from(this.tools.keys()),
      agent: Array.from(this.agentTools.keys())
    };
  }

  /**
   * Export tool definitions (for LLM context)
   */
  exportToolDefinitions(): any[] {
    const definitions: any[] = [];
    
    // Standard tools
    for (const [name, tool] of this.tools) {
      definitions.push({
        type: 'function',
        function: {
          name,
          description: tool.description,
          parameters: tool.parameters || {}
        }
      });
    }
    
    // Agent tools
    for (const [name, tool] of this.agentTools) {
      definitions.push({
        type: 'agent_tool',
        function: {
          name,
          description: tool.description,
          agent: tool.agent.config.name,
          delegation_type: tool.delegation_type
        }
      });
    }
    
    return definitions;
  }
}

export const toolRegistry = new OSSAToolRegistry();