/**
 * LangChain Tools Generator
 *
 * Generates LangChain @tool decorated functions from OSSA capabilities.actions
 *
 * SOLID: Single Responsibility - Tool code generation only
 * DRY: Reusable tool templates
 */

import type { OssaAgent } from '../../../types/index.js';

export class ToolsGenerator {
  /**
   * Generate tools.py with @tool decorated functions
   */
  generate(manifest: OssaAgent): string {
    const tools = manifest.spec?.tools || [];

    if (tools.length === 0) {
      return this.generateEmptyTools();
    }

    const toolFunctions = tools
      .map((tool: any) => this.generateTool(tool))
      .join('\n\n');

    return `"""
LangChain Tools
Generated from OSSA manifest capabilities.actions

This module contains all agent tools as @tool decorated functions.
"""

from typing import Any, Dict, List, Optional
from langchain.tools import tool
import json
import os

${toolFunctions}


def get_tools() -> List:
    """
    Get all available tools

    Returns:
        List of tool instances
    """
    return [
${tools.map((tool: any) => `        ${this.getToolFunctionName(tool)},`).join('\n')}
    ]
`;
  }

  /**
   * Generate empty tools module
   */
  private generateEmptyTools(): string {
    return `"""
LangChain Tools
No tools configured in OSSA manifest
"""

from typing import List


def get_tools() -> List:
    """Get all available tools (empty list)"""
    return []
`;
  }

  /**
   * Generate individual tool function
   */
  private generateTool(tool: any): string {
    const name = tool.name || 'unnamed_tool';
    const description = tool.description || 'No description provided';
    const functionName = this.getToolFunctionName(tool);

    // Handle different tool types
    if (tool.type === 'mcp') {
      return this.generateMcpTool(tool);
    } else if (tool.type === 'api') {
      return this.generateApiTool(tool);
    } else if (tool.type === 'function') {
      return this.generateFunctionTool(tool);
    }

    // Default: generic tool
    return `@tool
def ${functionName}(input_data: str) -> str:
    """
    ${description}

    Args:
        input_data: Input for the tool

    Returns:
        Tool execution result
    """
    try:
        # TODO: Implement ${name} tool logic
        return json.dumps({
            "status": "success",
            "result": f"Executed ${name} with input: {input_data}",
        })
    except Exception as e:
        return json.dumps({
            "status": "error",
            "error": str(e),
        })
`;
  }

  /**
   * Generate MCP (Model Context Protocol) tool
   */
  private generateMcpTool(tool: any): string {
    const name = tool.name || 'unnamed_tool';
    const description = tool.description || 'MCP tool';
    const functionName = this.getToolFunctionName(tool);
    const server = tool.config?.server || tool.server || 'unknown-server';

    return `@tool
def ${functionName}(input_data: str) -> str:
    """
    ${description}

    MCP Server: ${server}

    Args:
        input_data: Input for the MCP tool

    Returns:
        MCP tool execution result
    """
    import subprocess

    try:
        # Execute MCP server command
        # TODO: Replace with actual MCP client implementation
        result = subprocess.run(
            ["${server}"],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode == 0:
            return result.stdout
        else:
            return json.dumps({
                "status": "error",
                "error": result.stderr,
            })
    except subprocess.TimeoutExpired:
        return json.dumps({
            "status": "error",
            "error": "MCP tool execution timed out",
        })
    except Exception as e:
        return json.dumps({
            "status": "error",
            "error": str(e),
        })
`;
  }

  /**
   * Generate API tool
   */
  private generateApiTool(tool: any): string {
    const name = tool.name || 'unnamed_tool';
    const description = tool.description || 'API tool';
    const functionName = this.getToolFunctionName(tool);
    const endpoint = tool.config?.endpoint || tool.endpoint || '';
    const method = tool.config?.method || 'POST';

    return `@tool
def ${functionName}(input_data: str) -> str:
    """
    ${description}

    API Endpoint: ${method} ${endpoint}

    Args:
        input_data: Input data for API call

    Returns:
        API response
    """
    import httpx

    try:
        parsed_input = json.loads(input_data) if isinstance(input_data, str) else input_data

        with httpx.Client() as client:
            response = client.request(
                method="${method}",
                url="${endpoint}",
                json=parsed_input,
                timeout=30.0,
            )
            response.raise_for_status()

            return json.dumps({
                "status": "success",
                "data": response.json(),
            })
    except httpx.TimeoutException:
        return json.dumps({
            "status": "error",
            "error": "API request timed out",
        })
    except httpx.HTTPStatusError as e:
        return json.dumps({
            "status": "error",
            "error": f"HTTP {e.response.status_code}: {e.response.text}",
        })
    except Exception as e:
        return json.dumps({
            "status": "error",
            "error": str(e),
        })
`;
  }

  /**
   * Generate function tool with schema
   */
  private generateFunctionTool(tool: any): string {
    const name = tool.name || 'unnamed_tool';
    const description = tool.description || 'Function tool';
    const functionName = this.getToolFunctionName(tool);
    const inputSchema = tool.input_schema || tool.inputSchema;

    // Generate function parameters from schema
    const params = this.generateParametersFromSchema(inputSchema);

    return `@tool
def ${functionName}(${params.signature}) -> str:
    """
    ${description}

${params.docstring}
    Returns:
        Tool execution result as JSON string
    """
    try:
        # TODO: Implement ${name} function logic
        result = {
            "status": "success",
${params.fields.map((field) => `            "${field}": ${field},`).join('\n')}
        }

        return json.dumps(result)
    except Exception as e:
        return json.dumps({
            "status": "error",
            "error": str(e),
        })
`;
  }

  /**
   * Generate function parameters from JSON schema
   */
  private generateParametersFromSchema(schema: any): {
    signature: string;
    docstring: string;
    fields: string[];
  } {
    if (!schema || !schema.properties) {
      return {
        signature: 'input_data: str',
        docstring: '    Args:\n        input_data: Input for the tool',
        fields: [],
      };
    }

    const properties = schema.properties;
    const required = schema.required || [];
    const fields: string[] = [];
    const params: string[] = [];
    const docLines: string[] = ['    Args:'];

    for (const [key, value] of Object.entries(properties)) {
      const prop = value as any;
      const isRequired = required.includes(key);
      const pythonType = this.jsonTypeToPython(prop.type);

      if (isRequired) {
        params.push(`${key}: ${pythonType}`);
      } else {
        params.push(`${key}: Optional[${pythonType}] = None`);
      }

      fields.push(key);

      const desc = prop.description || `${key} parameter`;
      docLines.push(`        ${key}: ${desc}`);
    }

    return {
      signature: params.join(', ') || 'input_data: str',
      docstring: docLines.join('\n'),
      fields,
    };
  }

  /**
   * Convert JSON schema type to Python type
   */
  private jsonTypeToPython(type: string): string {
    switch (type) {
      case 'string':
        return 'str';
      case 'number':
      case 'integer':
        return 'int';
      case 'boolean':
        return 'bool';
      case 'array':
        return 'List[Any]';
      case 'object':
        return 'Dict[str, Any]';
      default:
        return 'Any';
    }
  }

  /**
   * Get Python function name from tool
   */
  private getToolFunctionName(tool: any): string {
    const name = tool.name || 'unnamed_tool';
    // Convert to snake_case and ensure valid Python identifier
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^[0-9]/, '_')
      .toLowerCase();
  }
}
