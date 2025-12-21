/**
 * Tool and Capability Mapping
 * Convert between OSSA capabilities and Anthropic tools
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { AnthropicConfig } from './config.js';
import type { OssaAgent } from '../../types/index.js';

/**
 * OSSA capability definition
 */
export interface OssaCapability {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  examples?: Array<{
    name?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  }>;
}

/**
 * Tool handler function type
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<string | Record<string, unknown>>;

/**
 * Tool definition with handler
 */
export interface ToolDefinition {
  tool: Tool;
  handler?: ToolHandler;
  capability?: OssaCapability;
}

/**
 * Tool mapper for converting OSSA capabilities to Anthropic tools
 */
export class ToolMapper {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Map OSSA capabilities to Anthropic tools
   */
  mapCapabilities(capabilities: OssaCapability[]): Tool[] {
    const tools: Tool[] = [];

    for (const capability of capabilities) {
      const tool = this.convertCapabilityToTool(capability);
      tools.push(tool);

      this.tools.set(capability.name, {
        tool,
        capability,
      });
    }

    return tools;
  }

  /**
   * Map OSSA agent tools to Anthropic tools
   */
  mapAgentTools(agent: OssaAgent): Tool[] {
    const tools: Tool[] = [];

    // Map from spec.tools
    if (agent.spec?.tools) {
      for (const tool of agent.spec.tools) {
        if (tool.type === 'function' && tool.name && typeof tool.name === 'string') {
          const toolName = tool.name;
          const anthropicTool = this.convertFunctionToTool({ ...tool, name: toolName });
          tools.push(anthropicTool);

          this.tools.set(tool.name, {
            tool: anthropicTool,
          });
        } else if (tool.type === 'mcp' && tool.capabilities) {
          // MCP tools - convert each capability
          for (const capName of tool.capabilities) {
            const capability: OssaCapability = {
              name: capName,
              description: `MCP capability: ${capName}`,
              input_schema: {
                type: 'object',
                properties: {},
              },
            };

            const anthropicTool = this.convertCapabilityToTool(capability);
            tools.push(anthropicTool);

            this.tools.set(capName, {
              tool: anthropicTool,
              capability,
            });
          }
        }
      }
    }

    // Map from extensions.anthropic.tools
    const anthropicExt = agent.extensions?.anthropic as {
      tools?: Tool[];
    } | undefined;

    if (anthropicExt?.tools) {
      for (const tool of anthropicExt.tools) {
        tools.push(tool);
        this.tools.set(tool.name, { tool });
      }
    }

    return tools;
  }

  /**
   * Register a tool handler
   */
  registerToolHandler(name: string, handler: ToolHandler): boolean {
    const toolDef = this.tools.get(name);
    if (!toolDef) {
      return false;
    }

    toolDef.handler = handler;
    return true;
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values()).map((def) => def.tool);
  }

  /**
   * Execute a tool
   */
  async executeTool(
    name: string,
    input: Record<string, unknown>
  ): Promise<string> {
    const toolDef = this.tools.get(name);

    if (!toolDef) {
      return JSON.stringify({
        error: `Tool '${name}' not found`,
      });
    }

    if (!toolDef.handler) {
      return JSON.stringify({
        error: `No handler registered for tool '${name}'`,
        message: 'Register a handler using registerToolHandler()',
      });
    }

    try {
      const result = await toolDef.handler(input);
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: `Error executing tool '${name}'`,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Convert OSSA capability to Anthropic tool
   */
  private convertCapabilityToTool(capability: OssaCapability): Tool {
    return {
      name: capability.name,
      description: capability.description,
      input_schema: this.normalizeInputSchema(capability.input_schema),
    };
  }

  /**
   * Convert OSSA function tool to Anthropic tool
   */
  private convertFunctionToTool(tool: {
    name: string;
    config?: Record<string, unknown>;
    capabilities?: string[];
  }): Tool {
    const config = tool.config || {};
    const description =
      (config.description as string) ||
      `Function: ${tool.name}`;
    const inputSchema = (config.input_schema as Record<string, unknown>) || {
      type: 'object',
      properties: {},
    };

    return {
      name: tool.name,
      description,
      input_schema: this.normalizeInputSchema(inputSchema),
    };
  }

  /**
   * Normalize input schema to Anthropic format
   */
  private normalizeInputSchema(schema: Record<string, unknown>): {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  } {
    // Ensure schema is object type
    const normalized: {
      type: 'object';
      properties?: Record<string, unknown>;
      required?: string[];
    } = {
      type: 'object',
      properties: schema.properties as Record<string, unknown> || {},
    };

    // Add required fields if present
    if (Array.isArray(schema.required)) {
      normalized.required = schema.required;
    }

    return normalized;
  }
}

/**
 * Create tool mapper from OSSA agent
 */
export function createToolMapper(agent: OssaAgent): ToolMapper {
  const mapper = new ToolMapper();
  mapper.mapAgentTools(agent);
  return mapper;
}

/**
 * Extract capabilities from OSSA agent
 */
export function extractCapabilities(agent: OssaAgent): OssaCapability[] {
  const capabilities: OssaCapability[] = [];

  // From spec.tools
  if (agent.spec?.tools) {
    for (const tool of agent.spec.tools) {
      if (tool.type === 'function' && tool.name && tool.config) {
        const config = tool.config;
        capabilities.push({
          name: tool.name,
          description: (config.description as string) || `Capability: ${tool.name}`,
          input_schema: (config.input_schema as Record<string, unknown>) || {
            type: 'object',
            properties: {},
          },
          output_schema: config.output_schema as Record<string, unknown> | undefined,
        });
      }
    }
  }

  return capabilities;
}

/**
 * Validate tool input against schema
 */
export function validateToolInput(
  input: Record<string, unknown>,
  schema: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in input)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Basic type checking for properties
  const properties = schema.properties as Record<string, { type?: string }> | undefined;
  if (properties) {
    for (const [key, value] of Object.entries(input)) {
      const propSchema = properties[key];
      if (propSchema?.type) {
        const actualType = typeof value;
        const expectedType = propSchema.type;

        if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Field '${key}' should be an array`);
        } else if (expectedType === 'object' && (actualType !== 'object' || Array.isArray(value))) {
          errors.push(`Field '${key}' should be an object`);
        } else if (expectedType !== 'array' && expectedType !== 'object' && actualType !== expectedType) {
          errors.push(
            `Field '${key}' should be type '${expectedType}', got '${actualType}'`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a simple tool definition
 */
export function createTool(
  name: string,
  description: string,
  properties: Record<string, { type: string; description?: string }>,
  required?: string[]
): Tool {
  return {
    name,
    description,
    input_schema: {
      type: 'object',
      properties,
      required,
    },
  };
}

/**
 * Common tool templates
 */
export const COMMON_TOOLS = {
  /**
   * Web search tool
   */
  webSearch: createTool(
    'web_search',
    'Search the web for information',
    {
      query: {
        type: 'string',
        description: 'The search query',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return',
      },
    },
    ['query']
  ),

  /**
   * Read file tool
   */
  readFile: createTool(
    'read_file',
    'Read contents of a file',
    {
      path: {
        type: 'string',
        description: 'File path to read',
      },
    },
    ['path']
  ),

  /**
   * Write file tool
   */
  writeFile: createTool(
    'write_file',
    'Write contents to a file',
    {
      path: {
        type: 'string',
        description: 'File path to write',
      },
      content: {
        type: 'string',
        description: 'Content to write',
      },
    },
    ['path', 'content']
  ),

  /**
   * Execute code tool
   */
  executeCode: createTool(
    'execute_code',
    'Execute code in a sandboxed environment',
    {
      language: {
        type: 'string',
        description: 'Programming language (python, javascript, etc.)',
      },
      code: {
        type: 'string',
        description: 'Code to execute',
      },
    },
    ['language', 'code']
  ),

  /**
   * HTTP request tool
   */
  httpRequest: createTool(
    'http_request',
    'Make an HTTP request',
    {
      url: {
        type: 'string',
        description: 'URL to request',
      },
      method: {
        type: 'string',
        description: 'HTTP method (GET, POST, etc.)',
      },
      headers: {
        type: 'object',
        description: 'Request headers',
      },
      body: {
        type: 'string',
        description: 'Request body',
      },
    },
    ['url']
  ),
} as const;


/**
 * Anthropic Client Wrapper
 * Provides compatibility layer for tests and legacy code
 */
export class AnthropicClient {
  private config: AnthropicConfig;
  private stats = {
    requestCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
  };

  constructor(config: AnthropicConfig) {
    // Validate config
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      throw new Error('Temperature must be between 0 and 1');
    }
    this.config = { ...config };
  }

  getConfig(): AnthropicConfig {
    return { ...this.config };
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      requestCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    };
  }

  updateConfig(config: Partial<AnthropicConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
