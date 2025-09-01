/**
 * OSSA to MCP Conversion Adapter
 * Converts OSSA capabilities to MCP tools and resources
 */

import { createHash } from 'crypto';
import { MCPResource, MCPServerConfig, MCPTool } from '../../types/mcp';
import { OSSACapability, OSSAResourceRef } from '../../types/ossa-capability';

/**
 * Convert OSSA capability to MCP tool
 * Implements deterministic mapping rules
 */
export function capabilityToMCPTool(cap: OSSACapability): MCPTool {
    // Normalize name to kebab-case for MCP compatibility
    const toolName = normalizeToKebabCase(cap.name);

    return {
        name: toolName,
        description: cap.description,
        inputSchema: convertToJSONSchema(cap.inputSchema),
        outputSchema: cap.outputSchema ? convertToJSONSchema(cap.outputSchema) : undefined
    };
}

/**
 * Convert OSSA resources to MCP resources
 */
export function resourcesToMCPResources(rs: OSSAResourceRef[] = []): MCPResource[] {
    return rs.map(resource => ({
        uri: resource.uri || `ossa://${resource.id}`,
        name: resource.id,
        description: `OSSA resource: ${resource.id}`,
        schema: resource.schema
    }));
}

/**
 * Build MCP server configuration from OSSA agent
 */
export function buildServerConfig(
    agentId: string,
    tools: MCPTool[],
    resources: MCPResource[],
    transport: {
        type: 'stdio' | 'http' | 'ws';
        endpoint?: string;
        cmd?: string;
        args?: string[];
    }
): MCPServerConfig {
    // Generate stable ID from tools and resources for idempotency
    const contentHash = createHash('sha256')
        .update(JSON.stringify({ tools, resources }))
        .digest('hex')
        .substring(0, 8);

    return {
        id: `${agentId}-${contentHash}`,
        name: `ossa-${agentId}`,
        tools,
        resources,
        transport
    };
}

/**
 * Convert OpenAPI 3.1 schema to JSON Schema
 * Handles common conversion patterns
 */
function convertToJSONSchema(schema: object): object {
    // If already JSON Schema, return as-is
    if (isJSONSchema(schema)) {
        return schema;
    }

    // Convert OpenAPI 3.1 to JSON Schema
    if (isOpenAPI31(schema)) {
        return convertOpenAPI31ToJSONSchema(schema);
    }

    // Fallback: assume it's already JSON Schema compatible
    return schema;
}

/**
 * Check if schema is already JSON Schema format
 */
function isJSONSchema(schema: object): boolean {
    const schemaObj = schema as any;
    return schemaObj.type !== undefined ||
        schemaObj.properties !== undefined ||
        schemaObj.$ref !== undefined;
}

/**
 * Check if schema is OpenAPI 3.1 format
 */
function isOpenAPI31(schema: object): boolean {
    const schemaObj = schema as any;
    return schemaObj.openapi !== undefined ||
        schemaObj.components !== undefined ||
        schemaObj.paths !== undefined;
}

/**
 * Convert OpenAPI 3.1 schema to JSON Schema
 * Handles basic conversion patterns
 */
function convertOpenAPI31ToJSONSchema(openapiSchema: object): object {
    const schema = openapiSchema as any;

    // Handle OpenAPI 3.1 schema objects
    if (schema.schema) {
        return convertToJSONSchema(schema.schema);
    }

    // Handle OpenAPI 3.1 parameter objects
    if (schema.in && schema.schema) {
        return convertToJSONSchema(schema.schema);
    }

    // Handle OpenAPI 3.1 request/response bodies
    if (schema.content && schema.content['application/json']) {
        return convertToJSONSchema(schema.content['application/json'].schema);
    }

    // Fallback: return as-is
    return schema;
}

/**
 * Normalize string to kebab-case for MCP tool names
 */
function normalizeToKebabCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Generate stable tool name from agent ID and capability name
 */
export function generateStableToolName(agentId: string, capabilityName: string): string {
    const normalizedCapability = normalizeToKebabCase(capabilityName);
    return `ossa.${agentId}.${normalizedCapability}`;
}
