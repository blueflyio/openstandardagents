/**
 * MCP to OSSA Conversion Adapter
 * Converts MCP tools and resources back to OSSA format
 */

import { MCPResource, MCPTool } from '../../types/mcp';
import { OSSACapability, OSSAResourceRef } from '../../types/ossa-capability';

/**
 * Convert MCP tool to OSSA capability
 * Implements reverse mapping from to-mcp.ts
 */
export function mcpToolToCapability(tool: MCPTool): OSSACapability {
    // Extract agent ID and capability name from tool name if possible
    const { agentId, capabilityName } = parseStableToolName(tool.name);

    return {
        id: capabilityName || tool.name,
        name: capabilityName || tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        resources: [], // MCP tools don't carry resource references
        hints: {
            streaming: false, // Default to non-streaming
            timeoutMs: 30000  // Default 30 second timeout
        }
    };
}

/**
 * Convert MCP resource to OSSA resource reference
 */
export function mcpResourceToOSSA(res: MCPResource): OSSAResourceRef {
    // Infer kind from URI scheme
    const kind = inferResourceKind(res.uri);

    return {
        id: res.name || extractIdFromUri(res.uri),
        kind,
        uri: res.uri,
        schema: res.schema
    };
}

/**
 * Parse stable tool name to extract agent ID and capability name
 * Handles format: ossa.{agentId}.{capabilityName}
 */
function parseStableToolName(toolName: string): { agentId: string; capabilityName: string } {
    const parts = toolName.split('.');

    if (parts.length >= 3 && parts[0] === 'ossa') {
        return {
            agentId: parts[1],
            capabilityName: parts.slice(2).join('.')
        };
    }

    // Fallback: treat as capability name only
    return {
        agentId: 'unknown',
        capabilityName: toolName
    };
}

/**
 * Infer resource kind from URI scheme
 */
function inferResourceKind(uri: string): OSSAResourceRef['kind'] {
    const scheme = uri.split('://')[0];

    switch (scheme) {
        case 'http':
        case 'https':
            return 'endpoint';
        case 'file':
            return 'document';
        case 'secret':
            return 'secret';
        case 'dataset':
            return 'dataset';
        case 'collection':
            return 'collection';
        case 'ossa':
            return 'document'; // OSSA resources are typically documents
        default:
            return 'document'; // Default to document
    }
}

/**
 * Extract ID from URI
 */
function extractIdFromUri(uri: string): string {
    // Try to extract meaningful ID from URI
    const url = new URL(uri);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1];
    }

    // Fallback: use hostname or generate hash
    return url.hostname || `resource-${Date.now()}`;
}

/**
 * Convert MCP server config to OSSA agent stub
 * Used for discovery and round-trip testing
 */
export function mcpServerToOSSAStub(
    serverId: string,
    serverName: string,
    tools: MCPTool[],
    resources: MCPResource[] = []
): {
    id: string;
    name: string;
    capabilities: OSSACapability[];
    resources: OSSAResourceRef[];
} {
    return {
        id: serverId,
        name: serverName,
        capabilities: tools.map(mcpToolToCapability),
        resources: resources.map(mcpResourceToOSSA)
    };
}

/**
 * Validate MCP tool schema compatibility with OSSA
 */
export function validateMCPToolCompatibility(tool: MCPTool): {
    compatible: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    // Check required fields
    if (!tool.name) {
        issues.push('Tool name is required');
    }

    if (!tool.inputSchema) {
        issues.push('Input schema is required');
    }

    // Validate schema structure
    if (tool.inputSchema && typeof tool.inputSchema !== 'object') {
        issues.push('Input schema must be an object');
    }

    if (tool.outputSchema && typeof tool.outputSchema !== 'object') {
        issues.push('Output schema must be an object');
    }

    // Check for valid JSON Schema structure
    if (tool.inputSchema && !isValidJSONSchema(tool.inputSchema)) {
        issues.push('Input schema must be valid JSON Schema');
    }

    if (tool.outputSchema && !isValidJSONSchema(tool.outputSchema)) {
        issues.push('Output schema must be valid JSON Schema');
    }

    return {
        compatible: issues.length === 0,
        issues
    };
}

/**
 * Basic JSON Schema validation
 */
function isValidJSONSchema(schema: object): boolean {
    const schemaObj = schema as any;

    // Check for basic JSON Schema structure
    if (schemaObj.type && typeof schemaObj.type !== 'string') {
        return false;
    }

    if (schemaObj.properties && typeof schemaObj.properties !== 'object') {
        return false;
    }

    if (schemaObj.$ref && typeof schemaObj.$ref !== 'string') {
        return false;
    }

    return true;
}
