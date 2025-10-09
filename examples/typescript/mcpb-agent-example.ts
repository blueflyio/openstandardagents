/**
 * OSSA Agent with MCPB Integration - TypeScript Example
 *
 * This example demonstrates how to create OSSA agents with various bridge configurations
 * including MCP (Model Context Protocol) Bridge for Claude Desktop integration.
 */

import type {
  Agent,
  CreateAgentRequest,
  BridgeConfig,
  MCPBridgeConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
} from '../../src/server/types/agent';

// Example 1: Create an MCP-enabled agent for Claude Desktop
export const createMCPAgent = (): CreateAgentRequest => {
  return {
    type: 'worker',
    name: 'Code Analysis Agent',
    description: 'Analyzes source code and provides feedback',
    version: '1.0.0',
    capabilities: ['code-analysis', 'static-analysis', 'security-scanning'],
    configuration: {
      max_file_size_mb: 10,
      supported_languages: ['typescript', 'javascript', 'python', 'go'],
    },
    metadata: {
      author: 'OSSA Team',
      tags: ['code', 'analysis', 'mcp'],
      documentation_url: 'https://docs.example.com/code-analysis-agent',
    },
    bridge: {
      mcp: {
        enabled: true,
        server_type: 'stdio', // For Claude Desktop
        tools: [
          {
            name: 'analyze_code',
            description: 'Analyze source code for issues, bugs, and security vulnerabilities',
            input_schema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The source code to analyze',
                },
                language: {
                  type: 'string',
                  enum: ['typescript', 'javascript', 'python', 'go'],
                  description: 'Programming language',
                },
                rules: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific rules to check',
                },
              },
              required: ['code', 'language'],
            },
            output_schema: {
              type: 'object',
              properties: {
                issues: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      severity: { type: 'string', enum: ['error', 'warning', 'info'] },
                      line: { type: 'number' },
                      message: { type: 'string' },
                      rule: { type: 'string' },
                    },
                  },
                },
                summary: {
                  type: 'object',
                  properties: {
                    total_issues: { type: 'number' },
                    errors: { type: 'number' },
                    warnings: { type: 'number' },
                  },
                },
              },
            },
            capability: 'code-analysis',
          },
          {
            name: 'suggest_fixes',
            description: 'Suggest fixes for identified code issues',
            input_schema: {
              type: 'object',
              properties: {
                issue_id: { type: 'string' },
                context: { type: 'string' },
              },
              required: ['issue_id'],
            },
            capability: 'code-analysis',
          },
        ],
        resources: [
          {
            uri: 'ossa://code-analysis/results',
            name: 'Analysis Results',
            description: 'Access to previous analysis results',
            mimeType: 'application/json',
            readonly: true,
          },
          {
            uri: 'ossa://code-analysis/rules',
            name: 'Analysis Rules',
            description: 'Code analysis rules and configurations',
            mimeType: 'application/json',
            readonly: false,
          },
        ],
        prompts: [
          {
            name: 'review_pr',
            description: 'Review a pull request',
            template: `Review the following {{language}} code changes:

{{diff}}

Focus on:
- Code quality
- Potential bugs
- Security issues
- Best practices

Provide specific, actionable feedback.`,
            arguments: [
              { name: 'language', type: 'string', required: true },
              { name: 'diff', type: 'string', required: true },
            ],
          },
          {
            name: 'explain_issue',
            description: 'Explain a code issue in detail',
            template: 'Explain the following code issue:\n\n{{issue}}\n\nInclude examples of how to fix it.',
            arguments: [{ name: 'issue', type: 'string', required: true }],
          },
        ],
        config: {
          max_message_size: 1048576, // 1MB
          timeout_ms: 30000, // 30 seconds
          retry_count: 3,
        },
      },
    },
  };
};

// Example 2: Multi-bridge agent (MCP + LangChain)
export const createMultiBridgeAgent = (): CreateAgentRequest => {
  return {
    type: 'orchestrator',
    name: 'Multi-Protocol Orchestrator',
    version: '1.0.0',
    capabilities: ['orchestration', 'workflow-execution', 'integration'],
    configuration: {},
    bridge: {
      // Enable MCP for Claude Desktop
      mcp: {
        enabled: true,
        server_type: 'websocket',
        tools: [
          {
            name: 'execute_workflow',
            description: 'Execute a multi-step workflow',
            capability: 'workflow-execution',
          },
        ],
      },
      // Enable LangChain for Python integration
      langchain: {
        enabled: true,
        tool_class: 'OSSAWorkflowTool',
        chain_type: 'agent',
        memory: {
          type: 'conversation',
          max_tokens: 4096,
        },
        export: {
          as_tool: true,
          as_chain: true,
          as_agent: false,
        },
      },
      // Enable OpenAPI for REST integration
      openapi: {
        enabled: true,
        spec_url: 'https://api.example.com/openapi.json',
        spec_version: '3.1',
        auto_generate: false,
      },
    },
  };
};

// Example 3: Helper function to create MCP tools from OSSA capabilities
export const createMCPToolsFromCapabilities = (capabilities: string[]): MCPTool[] => {
  return capabilities.map((capability) => ({
    name: capability.replace(/-/g, '_'),
    description: `Execute ${capability} capability`,
    capability,
  }));
};

// Example 4: Validate MCP configuration
export const validateMCPConfig = (config: MCPBridgeConfig): boolean => {
  if (!config.enabled) {
    return false;
  }

  // Check transport type
  if (config.server_type && !['stdio', 'sse', 'websocket'].includes(config.server_type)) {
    throw new Error(`Invalid MCP server type: ${config.server_type}`);
  }

  // Validate tools
  if (config.tools) {
    for (const tool of config.tools) {
      if (!tool.name || !tool.description) {
        throw new Error('MCP tools must have name and description');
      }
    }
  }

  // Validate resources
  if (config.resources) {
    for (const resource of config.resources) {
      if (!resource.uri || !resource.name) {
        throw new Error('MCP resources must have uri and name');
      }
    }
  }

  return true;
};

// Example 5: Create an agent with custom bridge
export const createCustomBridgeAgent = (): CreateAgentRequest => {
  return {
    type: 'worker',
    name: 'Custom Bridge Agent',
    version: '1.0.0',
    capabilities: ['custom-integration'],
    configuration: {},
    bridge: {
      mcp: {
        enabled: true,
        server_type: 'stdio',
      },
      custom: {
        my_protocol: {
          enabled: true,
          endpoint: 'wss://custom.example.com',
          features: ['streaming', 'bidirectional'],
        },
      },
    },
  };
};

// Example 6: Runtime bridge configuration
export class AgentBridgeManager {
  private agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  isMCPEnabled(): boolean {
    return this.agent.bridge?.mcp?.enabled ?? false;
  }

  getMCPTransport(): 'stdio' | 'sse' | 'websocket' | undefined {
    return this.agent.bridge?.mcp?.server_type;
  }

  getMCPTools(): MCPTool[] {
    return this.agent.bridge?.mcp?.tools ?? [];
  }

  getMCPResources(): MCPResource[] {
    return this.agent.bridge?.mcp?.resources ?? [];
  }

  getMCPPrompts(): MCPPrompt[] {
    return this.agent.bridge?.mcp?.prompts ?? [];
  }

  getSupportedBridges(): string[] {
    const bridges: string[] = [];
    if (this.agent.bridge?.mcp?.enabled) bridges.push('mcp');
    if (this.agent.bridge?.openapi?.enabled) bridges.push('openapi');
    if (this.agent.bridge?.langchain?.enabled) bridges.push('langchain');
    if (this.agent.bridge?.crewai?.enabled) bridges.push('crewai');
    if (this.agent.bridge?.autogen?.enabled) bridges.push('autogen');
    if (this.agent.bridge?.a2a?.enabled) bridges.push('a2a');
    return bridges;
  }

  isMultiBridge(): boolean {
    return this.getSupportedBridges().length > 1;
  }
}

// Example 7: Usage example
export const exampleUsage = () => {
  // Create an MCP agent
  const mcpAgentRequest = createMCPAgent();
  console.log('MCP Agent Configuration:', JSON.stringify(mcpAgentRequest, null, 2));

  // Create a multi-bridge agent
  const multiBridgeRequest = createMultiBridgeAgent();
  console.log('Multi-Bridge Agent:', JSON.stringify(multiBridgeRequest, null, 2));

  // Validate MCP configuration
  const mcpConfig: MCPBridgeConfig = {
    enabled: true,
    server_type: 'stdio',
    tools: [{ name: 'test_tool', description: 'Test tool' }],
  };
  const isValid = validateMCPConfig(mcpConfig);
  console.log('MCP Config Valid:', isValid);
};

// Export types for use in other modules
export type {
  Agent,
  CreateAgentRequest,
  BridgeConfig,
  MCPBridgeConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
};
