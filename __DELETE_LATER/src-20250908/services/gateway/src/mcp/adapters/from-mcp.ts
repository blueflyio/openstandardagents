/**
 * MCP to OSSA Conversion Adapter
 * Converts MCP tools and resources back to OSSA format
 */

import { MCPResource, MCPTool } from '../../../types/mcp';
import { OSSACapability, OSSAResourceRef } from '../../../types/ossa-capability';

/**
 * Convert MCP tool to OSSA capability
 * Reverse of the to-mcp conversion
 */
export function mcpToolToCapability(tool: MCPTool): OSSACapability {
    // Convert kebab-case back to readable name
    const capabilityName = convertFromKebabCase(tool.name);

    return {
        name: capabilityName,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        metadata: {
            originalMcpName: tool.name
        }
    };
}

/**
 * Convert MCP resources to OSSA resource references
 */
export function mcpResourcesToOSSA(resources: MCPResource[] = []): OSSAResourceRef[] {
    return resources.map(resource => ({
        id: resource.name || extractIdFromUri(resource.uri),
        uri: resource.uri,
        schema: resource.schema,
        metadata: {
            description: resource.description
        }
    }));
}

/**
 * Extract identifier from OSSA resource URI
 * Handles ossa:// protocol URIs
 */
function extractIdFromUri(uri: string): string {
    if (uri.startsWith('ossa://')) {
        return uri.substring(7);
    }
    
    // For other URIs, extract the last path segment as ID
    const parts = uri.split('/');
    return parts[parts.length - 1] || 'unknown-resource';
}

/**
 * Convert kebab-case MCP tool names back to readable format
 */
function convertFromKebabCase(kebabName: string): string {
    // Remove ossa. prefix if present
    let name = kebabName.replace(/^ossa\..*?\./, '');
    
    // Convert kebab-case to Title Case
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Validate MCP tool format for OSSA compatibility
 */
export function validateMcpToolForOSSA(tool: MCPTool): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tool.name) {
        errors.push('Tool name is required');
    }

    if (!tool.inputSchema) {
        errors.push('Input schema is required for OSSA compatibility');
    }

    if (typeof tool.inputSchema !== 'object') {
        errors.push('Input schema must be a valid JSON Schema object');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Extract OSSA agent ID from MCP tool name
 * Assumes format: ossa.{agentId}.{capability}
 */
export function extractAgentIdFromToolName(toolName: string): string | null {
    const match = toolName.match(/^ossa\.([^.]+)\./);
    return match ? match[1] : null;
}