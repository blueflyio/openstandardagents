/**
 * Capability Mapper for Claude Adapter
 * Maps OSSA capabilities and tools to Claude tool definitions
 */

import type { ClaudeTool, ToolDefinition } from './types.js';

/**
 * Transport types supported by OSSA
 */
export type TransportType = 'mcp' | 'http' | 'function' | 'grpc';

/**
 * OSSA tool specification
 */
export interface OssaTool {
  type: string;
  name?: string;
  server?: string;
  namespace?: string;
  endpoint?: string;
  capabilities?: string[];
  config?: Record<string, unknown>;
  auth?: {
    type: string;
    credentials?: string;
  };
}

/**
 * Maps OSSA capabilities and tools to Claude tool format
 */
export class CapabilityMapper {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Map Claude extension tools
   */
  mapClaudeTools(claudeTools: ClaudeTool[]): void {
    for (const tool of claudeTools) {
      const toolDef: ToolDefinition = {
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      };

      this.tools.set(tool.name, toolDef);
    }
  }

  /**
   * Map OSSA spec tools to Claude format
   */
  mapOssaTools(ossaTools: OssaTool[]): void {
    for (const tool of ossaTools) {
      // Skip if already mapped
      if (tool.name && this.tools.has(tool.name)) {
        continue;
      }

      const toolName = tool.name || this.generateToolName(tool);

      const toolDef: ToolDefinition = {
        name: toolName,
        description: this.generateToolDescription(tool),
        input_schema: this.generateInputSchema(tool),
      };

      this.tools.set(toolName, toolDef);
    }
  }

  /**
   * Map MCP (Model Context Protocol) capabilities
   */
  mapMcpCapabilities(capabilities: string[]): void {
    for (const capability of capabilities) {
      if (this.tools.has(capability)) {
        continue;
      }

      const toolDef: ToolDefinition = {
        name: capability,
        description: `Execute ${capability} capability via MCP`,
        input_schema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Input for the capability',
            },
          },
          required: ['input'],
        },
      };

      this.tools.set(capability, toolDef);
    }
  }

  /**
   * Map HTTP endpoint to Claude tool
   */
  mapHttpTool(tool: OssaTool): void {
    const toolName = tool.name || this.generateToolName(tool);

    if (this.tools.has(toolName)) {
      return;
    }

    const toolDef: ToolDefinition = {
      name: toolName,
      description: `Execute HTTP request to ${tool.endpoint || 'endpoint'}`,
      input_schema: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            description: 'HTTP method (GET, POST, etc.)',
          },
          body: {
            type: 'object',
            description: 'Request body',
          },
          headers: {
            type: 'object',
            description: 'Request headers',
          },
        },
        required: ['method'],
      },
    };

    this.tools.set(toolName, toolDef);
  }

  /**
   * Get all mapped tools as Claude tool format
   */
  getClaudeTools(): ClaudeTool[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));
  }

  /**
   * Get all tools with handlers
   */
  getTools(): Map<string, ToolDefinition> {
    return this.tools;
  }

  /**
   * Register a tool handler
   */
  registerToolHandler(
    name: string,
    handler: (args: Record<string, unknown>) => Promise<string>
  ): boolean {
    const tool = this.tools.get(name);
    if (!tool) {
      return false;
    }

    tool.handler = handler;
    return true;
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get a specific tool
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Generate tool name from OSSA tool spec
   */
  private generateToolName(tool: OssaTool): string {
    if (tool.name) {
      return tool.name;
    }

    // Use type and server/namespace to create unique name
    const parts = [tool.type];

    if (tool.server) {
      parts.push(tool.server);
    }

    if (tool.namespace) {
      parts.push(tool.namespace);
    }

    return parts.join('_').replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Generate tool description from OSSA tool spec
   */
  private generateToolDescription(tool: OssaTool): string {
    const parts: string[] = [];

    parts.push(`Execute ${tool.type} tool`);

    if (tool.server) {
      parts.push(`from server: ${tool.server}`);
    }

    if (tool.namespace) {
      parts.push(`namespace: ${tool.namespace}`);
    }

    if (tool.capabilities && tool.capabilities.length > 0) {
      parts.push(
        `capabilities: ${tool.capabilities.join(', ')}`
      );
    }

    return parts.join(' | ');
  }

  /**
   * Generate input schema from OSSA tool spec
   */
  private generateInputSchema(tool: OssaTool): {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  } {
    // Check if config has schema information
    if (tool.config && typeof tool.config === 'object') {
      if ('input_schema' in tool.config) {
        return tool.config.input_schema as {
          type: 'object';
          properties: Record<string, unknown>;
          required?: string[];
        };
      }

      // Use config as properties
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(tool.config)) {
        properties[key] = {
          type: typeof value === 'number' ? 'number' : 'string',
          description: `${key} parameter`,
        };
      }

      return {
        type: 'object',
        properties,
      };
    }

    // Default schema based on transport type
    switch (tool.type) {
      case 'mcp':
        return {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Input data',
            },
          },
          required: ['input'],
        };

      case 'http':
        return {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              description: 'HTTP method',
            },
            body: {
              type: 'object',
              description: 'Request body',
            },
          },
          required: ['method'],
        };

      case 'function':
        return {
          type: 'object',
          properties: {
            args: {
              type: 'object',
              description: 'Function arguments',
            },
          },
        };

      default:
        return {
          type: 'object',
          properties: {},
        };
    }
  }
}
