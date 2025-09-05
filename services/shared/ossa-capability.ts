/**
 * OSSA Capability Types
 * For bridging OSSA agents to MCP protocol
 */

export interface OSSACapability {
    name: string;
    description?: string;
    inputSchema: object;
    outputSchema?: object;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface OSSAResourceRef {
    id: string;
    uri?: string;
    schema?: object;
    metadata?: Record<string, any>;
}

export interface OSSAAgent {
    id: string;
    name: string;
    description?: string;
    capabilities: OSSACapability[];
    resources?: OSSAResourceRef[];
    metadata?: Record<string, any>;
}