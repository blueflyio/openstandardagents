/**
 * OSSA Capability Interface
 * Core contract for AI agent capabilities in OSSA format
 */

export interface OSSACapability {
    id: string;
    name: string;
    description?: string;
    // Input contract (OpenAPI 3.1 schema or JSON Schema)
    inputSchema: object;
    // Output contract (OpenAPI 3.1 schema or JSON Schema)
    outputSchema?: object;
    // Optional resource bindings (URIs, datasets, collections)
    resources?: OSSAResourceRef[];
    // Execution hints (streaming, timeouts, model preference)
    hints?: {
        streaming?: boolean;
        timeoutMs?: number;
        model?: string;
    };
}

export interface OSSAResourceRef {
    id: string;
    kind: 'dataset' | 'document' | 'collection' | 'endpoint' | 'secret';
    uri?: string;                     // canonical reference
    schema?: object;                  // JSON Schema for resource shape
}

export interface OSSAAgent {
    id: string;
    name: string;
    version?: string;
    capabilities: OSSACapability[];
    resources?: OSSAResourceRef[];
    metadata?: Record<string, any>;
}
