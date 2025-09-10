/**
 * OSSA Platform API Types
 * Generated from OpenAPI specification
 *
 * This would normally be generated from the OpenAPI spec using openapi-typescript
 */
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    ossa_version?: string;
    uptime?: number;
    services?: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
    timestamp: string;
}
export interface VersionInfo {
    api: string;
    ossa: string;
    platform: string;
    build?: string;
    commit?: string;
}
export interface Agent {
    id: string;
    name: string;
    version: string;
    description?: string;
    spec: AgentSpec;
    status?: AgentStatus;
    registered_at: string;
    updated_at?: string;
}
export interface AgentSpec {
    conformance_tier: 'core' | 'governed' | 'advanced';
    class: 'general' | 'specialist' | 'workflow' | 'integration';
    category?: 'assistant' | 'tool' | 'service' | 'coordinator';
    capabilities: {
        primary: string[];
        secondary?: string[];
    };
    protocols?: Protocol[];
    endpoints: {
        health: string;
        capabilities?: string;
        api?: string;
    };
}
export interface Protocol {
    name: 'openapi' | 'mcp' | 'uadp' | 'graphql';
    version: string;
    required: boolean;
    extensions?: string[];
}
export interface AgentStatus {
    health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    last_seen: string;
    metrics?: {
        requests_per_minute?: number;
        average_response_time?: number;
        error_rate?: number;
    };
}
export interface AgentRegistration {
    name: string;
    version: string;
    description?: string;
    endpoint: string;
    spec: AgentSpec;
}
export interface AgentUpdate {
    version?: string;
    description?: string;
    endpoint?: string;
    spec?: AgentSpec;
}
export interface AgentList {
    agents: Agent[];
    total: number;
    limit: number;
    offset: number;
}
export interface DiscoveryResult {
    agents: Agent[];
    query: {
        capabilities?: string[];
        domain?: string;
        tier?: string;
    };
    total?: number;
}
export interface PlatformMetrics {
    timestamp?: string;
    timeframe?: string;
    agents?: {
        total?: number;
        active?: number;
        by_tier?: Record<string, number>;
    };
    requests?: {
        total?: number;
        success_rate?: number;
        average_response_time?: number;
    };
    errors?: Array<{
        code?: string;
        message?: string;
        count?: number;
    }>;
}
export interface ApiError {
    error: string;
    details?: any;
    request_id?: string;
}
export interface GraphQLRequest {
    query: string;
    variables?: any;
    operationName?: string;
}
export interface GraphQLResponse {
    data?: any;
    errors?: Array<{
        message: string;
        locations?: Array<{
            line: number;
            column: number;
        }>;
        path?: string[];
    }>;
}
