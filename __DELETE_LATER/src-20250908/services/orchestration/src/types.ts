/**
 * MCP Registry Types
 * Interfaces for MCP server discovery and registration
 */

export interface MCPRegistryRecord {
    id: string;                       // server id
    name: string;
    tags?: string[];
    endpoints: {
        type: 'stdio' | 'http' | 'ws';
        endpoint?: string;
        cmd?: string;
        args?: string[];
    };
    tools?: Array<{
        name: string;
        description?: string;
        inputSchema: object;
        outputSchema?: object;
    }>;
    resources?: Array<{
        uri: string;
        name?: string;
        description?: string;
        schema?: object;
    }>;
    lastSeen?: string;
    metadata?: Record<string, any>;
}

export interface MCPRegistryQuery {
    tag?: string;
    tool?: string;
    resource?: string;
}

export interface MCPRegistry {
    list(): Promise<MCPRegistryRecord[]>;
    get(id: string): Promise<MCPRegistryRecord | null>;
    register(record: MCPRegistryRecord): Promise<void>;
    discover(query?: MCPRegistryQuery): Promise<MCPRegistryRecord[]>;
    remove(id: string): Promise<boolean>;
    update(record: MCPRegistryRecord): Promise<void>;
}

export interface MCPRegistryBackend {
    initialize(): Promise<void>;
    list(): Promise<MCPRegistryRecord[]>;
    get(id: string): Promise<MCPRegistryRecord | null>;
    set(record: MCPRegistryRecord): Promise<void>;
    delete(id: string): Promise<boolean>;
    query(query: MCPRegistryQuery): Promise<MCPRegistryRecord[]>;
    close(): Promise<void>;
    getStats(): { recordCount: number; tags: string[]; toolCount: number };
    clear(): Promise<void>;
}
