/**
 * Runtime Bridge
 * Enables cross-framework execution without file modification
 */

import { AgentCapability, DiscoveredAgent } from '../index';

export interface RuntimeBridgeConfig {
  projectRoot: string;
  enabledFrameworks?: string[];
  executionTimeout?: number;
  maxConcurrentExecutions?: number;
  debugMode?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  execution_time: number;
  framework_used: string;
  logs?: string[];
  metadata?: any;
}

export class RuntimeBridge {
  constructor(private config: RuntimeBridgeConfig) { }

  /**
   * Execute agent capability regardless of original format
   */
  async executeCapability(
    agent: DiscoveredAgent,
    capability: AgentCapability,
    input: any
  ): Promise<ExecutionResult> {


    const startTime = Date.now();

    try {
      // Simulate execution based on format
      let result: any;

      switch (agent.format) {
        case 'drupal':
          result = await this.executeDrupalCapability(agent, capability, input);
          break;
        case 'mcp':
          result = await this.executeMCPCapability(agent, capability, input);
          break;
        case 'langchain':
          result = await this.executeLangChainCapability(agent, capability, input);
          break;
        case 'crewai':
          result = await this.executeCrewAICapability(agent, capability, input);
          break;
        default:
          result = await this.executeGenericCapability(agent, capability, input);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        execution_time: executionTime,
        framework_used: agent.format,
        logs: [`Executed ${capability.name} successfully`]
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        execution_time: executionTime,
        framework_used: agent.format
      };
    }
  }

  /**
   * Translate agent for specific framework compatibility
   */
  async translateForFramework(
    agent: DiscoveredAgent,
    targetFramework: 'langchain' | 'crewai' | 'openai' | 'anthropic' | 'mcp'
  ): Promise<any> {


    switch (targetFramework) {
      case 'langchain':
        return this.translateToLangChain(agent);
      case 'crewai':
        return this.translateToCrewAI(agent);
      case 'mcp':
        return this.translateToMCP(agent);
      case 'openai':
        return this.translateToOpenAI(agent);
      case 'anthropic':
        return this.translateToAnthropic(agent);
      default:
        throw new Error(`Unsupported target framework: ${targetFramework}`);
    }
  }

  // Format-specific execution methods
  private async executeDrupalCapability(agent: DiscoveredAgent, capability: AgentCapability, input: any): Promise<any> {
    // Simulate Drupal execution
    return {
      message: `Executed ${capability.name} on Drupal agent ${agent.name}`,
      input: input,
      agent_format: 'drupal',
      timestamp: new Date().toISOString()
    };
  }

  private async executeMCPCapability(agent: DiscoveredAgent, capability: AgentCapability, input: any): Promise<any> {
    // Real MCP execution using the new client
    try {
      const { MCPClient } = await import('./mcp/client/mcp-client');
      const { capabilityToMCPTool, buildServerConfig } = await import('./mcp/adapters/to-mcp');
      const { mcpRegistry } = await import('../registry/index');

      // Convert capability to MCP tool
      const mcpTool = capabilityToMCPTool({
        id: capability.name,
        name: capability.name,
        description: capability.description,
        inputSchema: capability.input_schema || { type: 'object' },
        outputSchema: capability.output_schema
      });

      // Discover MCP server from registry
      const candidates = await mcpRegistry.discover({ tag: 'default' });
      if (candidates.length === 0) {
        throw new Error('No MCP servers available');
      }

      const server = buildServerConfig(
        agent.id,
        [mcpTool],
        [],
        candidates[0].endpoints
      );

      // Execute via MCP client
      const client = new MCPClient();
      await client.connect(server);

      try {
        const result = await client.callTool(mcpTool.name, input, {
          timeoutMs: 30000,
          stream: false
        });

        if (!result.success) {
          throw new Error(`MCP tool execution failed: ${result.error}`);
        }

        return {
          message: `Executed MCP tool ${capability.name}`,
          input: input,
          result: result.result,
          agent_format: 'mcp',
          timestamp: new Date().toISOString(),
          execution_time: result.executionTime
        };
      } finally {
        await client.close();
      }
    } catch (error: any) {
      // Fallback to simulation if MCP execution fails
      console.warn(`MCP execution failed, falling back to simulation: ${error.message}`);
      return {
        message: `Executed MCP tool ${capability.name} (simulated)`,
        input: input,
        agent_format: 'mcp',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  private async executeLangChainCapability(agent: DiscoveredAgent, capability: AgentCapability, input: any): Promise<any> {
    // Simulate LangChain execution
    return {
      message: `Executed LangChain tool ${capability.name}`,
      input: input,
      agent_format: 'langchain',
      timestamp: new Date().toISOString()
    };
  }

  private async executeCrewAICapability(agent: DiscoveredAgent, capability: AgentCapability, input: any): Promise<any> {
    // Simulate CrewAI execution
    return {
      message: `Executed CrewAI agent ${capability.name}`,
      input: input,
      agent_format: 'crewai',
      timestamp: new Date().toISOString()
    };
  }

  private async executeGenericCapability(agent: DiscoveredAgent, capability: AgentCapability, input: any): Promise<any> {
    // Simulate generic execution
    return {
      message: `Executed generic capability ${capability.name}`,
      input: input,
      agent_format: agent.format,
      timestamp: new Date().toISOString()
    };
  }

  // Framework translation methods
  private translateToLangChain(agent: DiscoveredAgent): any {
    return {
      name: agent.name,
      description: `LangChain tool for ${agent.name}`,
      func: async (input: any) => {
        // This would execute the original agent
        return { result: `LangChain execution of ${agent.name}`, input };
      },
      args_schema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Input for the agent' }
        }
      }
    };
  }

  private translateToCrewAI(agent: DiscoveredAgent): any {
    return {
      role: agent.name,
      goal: `Execute ${agent.name} capabilities`,
      backstory: `I am an agent that can execute ${agent.capabilities?.length || 0} different capabilities`,
      tools: agent.capabilities?.map(cap => ({
        name: cap.name,
        description: cap.description
      })) || [],
      verbose: this.config.debugMode || false
    };
  }

  private async translateToMCP(agent: DiscoveredAgent): Promise<any> {
    try {
      const { capabilityToMCPTool, resourcesToMCPResources, buildServerConfig } = await import('./mcp/adapters/to-mcp');
      const { mcpRegistry } = await import('../registry/index');

      // Convert capabilities to MCP tools
      const mcpTools = agent.capabilities?.map(cap => capabilityToMCPTool({
        id: cap.name,
        name: cap.name,
        description: cap.description,
        inputSchema: cap.input_schema || { type: 'object' },
        outputSchema: cap.output_schema
      })) || [];

      // Convert resources to MCP resources
      const mcpResources = resourcesToMCPResources(
        agent.resources?.map(resource => ({
          id: resource.name,
          kind: 'document' as const,
          uri: resource.uri,
          schema: resource.schema
        })) || []
      );

      // Discover MCP server from registry
      const candidates = await mcpRegistry.discover({ tag: 'default' });
      if (candidates.length === 0) {
        throw new Error('No MCP servers available for translation');
      }

      // Build server configuration
      const serverConfig = buildServerConfig(
        agent.id,
        mcpTools,
        mcpResources,
        candidates[0].endpoints
      );

      // Register with registry
      await mcpRegistry.register({
        id: serverConfig.id,
        name: serverConfig.name,
        tags: ['ossa', agent.id],
        endpoints: serverConfig.transport,
        tools: mcpTools,
        resources: mcpResources,
        lastSeen: new Date().toISOString()
      });

      return {
        name: agent.name,
        version: agent.version || "1.0.0",
        tools: mcpTools,
        resources: mcpResources,
        server_config: serverConfig,
        registry_id: serverConfig.id
      };
    } catch (error: any) {
      // Fallback to basic translation if registry fails
      console.warn(`MCP registry translation failed, using basic translation: ${error.message}`);
      return {
        name: agent.name,
        version: agent.version || "1.0.0",
        tools: agent.capabilities?.map(cap => ({
          name: cap.name,
          description: cap.description,
          inputSchema: cap.input_schema || { type: 'object' }
        })) || [],
        error: error.message
      };
    }
  }

  private translateToOpenAI(agent: DiscoveredAgent): any {
    return {
      name: agent.name,
      description: `OpenAI assistant for ${agent.name}`,
      tools: agent.capabilities?.map(cap => ({
        type: 'function',
        function: {
          name: cap.name,
          description: cap.description,
          parameters: cap.input_schema || { type: 'object', properties: {} }
        }
      })) || [],
      model: 'gpt-4'
    };
  }

  private translateToAnthropic(agent: DiscoveredAgent): any {
    return {
      name: agent.name,
      description: `Anthropic Claude tool for ${agent.name}`,
      tools: agent.capabilities?.map(cap => ({
        name: cap.name,
        description: cap.description,
        input_schema: cap.input_schema || { type: 'object', properties: {} }
      })) || [],
      model: 'claude-3-sonnet-20240229'
    };
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): any {
    return {
      available_frameworks: ['drupal', 'mcp', 'langchain', 'crewai'],
      execution_timeout: this.config.executionTimeout || 30000,
      debug_mode: this.config.debugMode || false
    };
  }
}