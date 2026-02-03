/**
 * Anthropic Tools Generator
 *
 * Generates Anthropic-compatible tool definitions from OSSA tools.
 * Supports Claude function calling with proper schema conversion.
 *
 * SOLID: Single Responsibility - Tool schema generation only
 * DRY: Reusable tool conversion logic
 */

import type { OssaAgent } from '../../../types/index.js';

/**
 * Anthropic tool definition
 */
export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Generate Anthropic tool definitions from OSSA manifest
 */
export function generateTools(manifest: OssaAgent): AnthropicTool[] {
  const tools: AnthropicTool[] = [];

  // Extract from spec.tools
  if (manifest.spec?.tools && Array.isArray(manifest.spec.tools)) {
    for (const tool of manifest.spec.tools) {
      tools.push(convertOssaToolToAnthropic(tool));
    }
  }

  // Extract from extensions.anthropic.tools
  if (
    manifest.extensions?.anthropic &&
    typeof manifest.extensions.anthropic === 'object' &&
    'tools' in manifest.extensions.anthropic
  ) {
    const anthropicExt = manifest.extensions.anthropic as {
      tools?: AnthropicTool[];
    };
    if (anthropicExt.tools && Array.isArray(anthropicExt.tools)) {
      tools.push(...anthropicExt.tools);
    }
  }

  return tools;
}

/**
 * Convert OSSA tool to Anthropic tool format
 */
function convertOssaToolToAnthropic(tool: {
  type?: string;
  name?: string;
  description?: string;
  inputSchema?: Record<string, unknown> | string;
  config?: Record<string, unknown>;
  capabilities?: string[];
}): AnthropicTool {
  const name = tool.name || 'unknown_tool';
  const description = tool.description || `${tool.type || 'Tool'} tool`;

  // Use inputSchema if available
  if (tool.inputSchema && typeof tool.inputSchema === 'object') {
    return {
      name,
      description,
      input_schema: normalizeSchema(tool.inputSchema),
    };
  }

  // Check config.input_schema
  if (
    tool.config &&
    typeof tool.config === 'object' &&
    'input_schema' in tool.config
  ) {
    return {
      name,
      description,
      input_schema: normalizeSchema(
        tool.config.input_schema as Record<string, unknown>
      ),
    };
  }

  // Generate schema based on tool type
  return {
    name,
    description,
    input_schema: generateSchemaForToolType(tool.type || 'function', tool),
  };
}

/**
 * Normalize schema to Anthropic format
 */
function normalizeSchema(
  schema: Record<string, unknown>
): AnthropicTool['input_schema'] {
  // Ensure schema has required fields
  const normalized: AnthropicTool['input_schema'] = {
    type: 'object',
    properties: {},
  };

  if (schema.properties && typeof schema.properties === 'object') {
    normalized.properties = schema.properties as Record<string, unknown>;
  }

  if (schema.required && Array.isArray(schema.required)) {
    normalized.required = schema.required as string[];
  }

  return normalized;
}

/**
 * Generate input schema based on tool type
 */
function generateSchemaForToolType(
  type: string,
  tool: {
    capabilities?: string[];
    config?: Record<string, unknown>;
  }
): AnthropicTool['input_schema'] {
  switch (type) {
    case 'mcp':
      return {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'MCP action to execute',
            enum: tool.capabilities || ['read', 'write', 'execute'],
          },
          params: {
            type: 'object',
            description: 'Action parameters',
          },
        },
        required: ['action'],
      };

    case 'http':
    case 'api':
      return {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            description: 'HTTP method',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          },
          path: {
            type: 'string',
            description: 'API endpoint path',
          },
          body: {
            type: 'object',
            description: 'Request body',
          },
          params: {
            type: 'object',
            description: 'Query parameters',
          },
        },
        required: ['method', 'path'],
      };

    case 'function':
    case 'code':
      return {
        type: 'object',
        properties: {
          args: {
            type: 'object',
            description: 'Function arguments',
          },
        },
      };

    case 'search':
      return {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          filters: {
            type: 'object',
            description: 'Search filters',
          },
        },
        required: ['query'],
      };

    case 'database':
      return {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            description: 'Database operation',
            enum: ['query', 'insert', 'update', 'delete'],
          },
          query: {
            type: 'string',
            description: 'Query or command',
          },
          params: {
            type: 'object',
            description: 'Query parameters',
          },
        },
        required: ['operation'],
      };

    default:
      return {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Tool input',
          },
        },
      };
  }
}

/**
 * Generate Python tool definitions code
 */
export function generatePythonTools(tools: AnthropicTool[]): string {
  if (tools.length === 0) {
    return 'tools = []';
  }

  const toolDefinitions = tools
    .map((tool) => {
      const schemaJson = JSON.stringify(tool.input_schema, null, 8);
      return `    {
        "name": "${escapeString(tool.name)}",
        "description": "${escapeString(tool.description)}",
        "input_schema": ${schemaJson}
    }`;
    })
    .join(',\n');

  return `tools = [\n${toolDefinitions}\n]`;
}

/**
 * Generate tool handler stubs
 */
export function generateToolHandlers(tools: AnthropicTool[]): string {
  if (tools.length === 0) {
    return '';
  }

  const handlers = tools
    .map((tool) => {
      return `def handle_${tool.name}(input_data: dict) -> str:
    """
    Handle ${tool.name} tool execution.

    Args:
        input_data: Tool input matching the schema

    Returns:
        Tool execution result as string
    """
    # TODO: Implement tool logic
    return json.dumps({"status": "success", "message": "Not implemented"})
`;
    })
    .join('\n\n');

  const dispatcher = `
def handle_tool_use(tool_name: str, tool_input: dict) -> str:
    """
    Dispatch tool execution to appropriate handler.

    Args:
        tool_name: Name of the tool to execute
        tool_input: Tool input data

    Returns:
        Tool execution result
    """
    handlers = {
${tools.map((t) => `        "${t.name}": handle_${t.name}`).join(',\n')}
    }

    handler = handlers.get(tool_name)
    if not handler:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    try:
        return handler(tool_input)
    except Exception as e:
        return json.dumps({"error": str(e)})
`;

  return handlers + dispatcher;
}

/**
 * Escape string for Python code generation
 */
function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
