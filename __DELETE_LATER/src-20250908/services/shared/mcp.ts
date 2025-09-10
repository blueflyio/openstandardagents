/**
 * MCP (Model Context Protocol) Interface Types
 * Minimal subset for OSSA bridge implementation
 */

export interface MCPTool {
    name: string;
    description?: string;
    inputSchema: object;              // JSON Schema
    outputSchema?: object;            // optional
}

export interface MCPResource {
    uri: string;                      // canonical resource URI
    name?: string;
    description?: string;
    schema?: object;                  // JSON Schema
}

export interface MCPServerConfig {
    id: string;
    name: string;
    tools: MCPTool[];
    resources?: MCPResource[];
    transport: {
        type: 'stdio' | 'http' | 'ws';
        endpoint?: string;
        cmd?: string;
        args?: string[];
    };
}

export interface MCPCallOptions {
    timeoutMs?: number;
    stream?: boolean;
}

export interface MCPCallResult {
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    metadata?: any;
}

export interface MCPStreamChunk {
    type: 'content' | 'error' | 'done';
    data?: any;
    error?: string;
}