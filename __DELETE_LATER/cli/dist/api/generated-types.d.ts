/**
 * OSSA Platform API Types
 * Generated from OpenAPI 3.1.0 specification
 *
 * This file contains TypeScript interfaces generated from the comprehensive
 * OSSA v0.1.8 OpenAPI specification with full compliance extensions.
 *
 * @version 0.1.8
 * @generated 2024-01-15T10:00:00Z
 */
export interface HealthResponse {
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
export interface PlatformMetrics {
    timestamp?: string;
    timeframe?: string;
    agents?: {
        total?: number;
        active?: number;
        by_tier?: Record<string, number>;
        by_class?: Record<string, number>;
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
    class: 'general' | 'specialist' | 'workflow' | 'integration' | 'security' | 'data' | 'nlp' | 'vision' | 'audio';
    category?: 'assistant' | 'tool' | 'service' | 'coordinator';
    capabilities: AgentCapabilities;
    protocols?: Protocol[];
    endpoints: {
        health: string;
        capabilities?: string;
        api?: string;
        [key: string]: string | undefined;
    };
}
export interface AgentCapabilities {
    primary: string[];
    secondary?: string[];
    domains?: string[];
    frameworks?: ('langchain' | 'crewai' | 'autogen' | 'openai' | 'anthropic' | 'mcp' | 'custom')[];
}
export interface Protocol {
    name: 'openapi' | 'mcp' | 'uadp' | 'graphql' | 'grpc' | 'websocket';
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
        cpu_usage?: number;
        memory_usage?: number;
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
        class?: string;
    };
    total?: number;
    execution_time?: number;
}
export interface DiscoveryRequest {
    capabilities?: string;
    domain?: string;
    tier?: 'core' | 'governed' | 'advanced';
    class?: 'general' | 'specialist' | 'workflow' | 'integration' | 'security' | 'data' | 'nlp' | 'vision' | 'audio';
    protocol?: 'openapi' | 'mcp' | 'uadp' | 'graphql' | 'grpc' | 'websocket';
    availability_threshold?: number;
}
export interface RecommendationRequest {
    task_description: string;
    context?: {
        industry?: string;
        data_sources?: string[];
        output_format?: string;
    };
    max_recommendations?: number;
}
export interface RecommendationResponse {
    recommendations: Array<{
        agent: Agent;
        confidence_score: number;
        reasoning: string;
        matching_capabilities: string[];
    }>;
    task_analysis: {
        required_capabilities: string[];
        suggested_workflow: string;
        complexity_score: number;
    };
}
export interface Workflow {
    id: string;
    name: string;
    version: string;
    description?: string;
    definition: WorkflowDefinition;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
    created_at: string;
    updated_at?: string;
}
export interface WorkflowDefinition {
    name: string;
    description?: string;
    version?: string;
    steps: WorkflowStep[];
    error_handling?: {
        strategy: 'fail_fast' | 'continue' | 'retry';
        max_retries?: number;
        timeout?: string;
    };
}
export interface WorkflowStep {
    id: string;
    name?: string;
    type: 'agent_call' | 'condition' | 'parallel' | 'sequential';
    agent_id: string;
    input_mapping?: Record<string, any>;
    output_mapping?: Record<string, any>;
    conditions?: Record<string, any>;
    next_steps?: string[];
}
export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    input_data?: Record<string, any>;
    output_data?: Record<string, any>;
    steps?: Array<{
        step_id: string;
        status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
        started_at?: string;
        completed_at?: string;
        output?: Record<string, any>;
        error?: string;
    }>;
    created_at: string;
    started_at?: string;
    completed_at?: string;
}
export interface WorkflowExecutionRequest {
    input_data?: Record<string, any>;
    execution_context?: {
        priority?: 'low' | 'normal' | 'high' | 'critical';
        timeout?: string;
        retry_policy?: {
            max_retries?: number;
            backoff_strategy?: 'fixed' | 'exponential' | 'linear';
        };
    };
}
export interface GraphQLRequest {
    query: string;
    variables?: Record<string, any>;
    operationName?: string;
}
export interface GraphQLResponse {
    data?: Record<string, any>;
    errors?: Array<{
        message: string;
        locations?: Array<{
            line: number;
            column: number;
        }>;
        path?: string[];
    }>;
}
export interface ApiError {
    error: string;
    details?: any;
    request_id?: string;
    timestamp?: string;
}
export interface ApiResponse<T = any> {
    data?: T;
    error?: ApiError;
    meta?: {
        request_id: string;
        timestamp: string;
        version: string;
        processing_time?: number;
    };
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
    };
}
export interface OSSAExtensions {
    'x-openapi-ai-agents-standard': {
        version: '0.1.8';
        conformance_tier: 'core' | 'governed' | 'advanced';
        certification_level?: 'bronze' | 'silver' | 'gold' | 'platinum';
        compliance_frameworks?: ('ISO_42001' | 'NIST_AI_RMF' | 'EU_AI_ACT' | 'SOC2' | 'GDPR')[];
        enterprise_features?: boolean;
        api_versioning?: {
            strategy: 'header' | 'path' | 'query';
            current: string;
            supported: string[];
        };
    };
    'x-agent-metadata': {
        class: 'general' | 'specialist' | 'workflow' | 'integration' | 'security' | 'data' | 'nlp' | 'vision' | 'audio';
        category: 'assistant' | 'tool' | 'service' | 'coordinator';
        protocols: ('openapi' | 'mcp' | 'uadp' | 'graphql' | 'grpc' | 'websocket')[];
        capabilities: string[];
        domains?: string[];
        frameworks?: ('langchain' | 'crewai' | 'autogen' | 'openai' | 'anthropic' | 'mcp')[];
    };
    'x-ossa-discovery': {
        uadp_enabled: boolean;
        discovery_endpoints?: {
            capabilities?: string;
            health?: string;
            metrics?: string;
        };
        registry_compatible?: boolean;
    };
    'x-ossa-security': {
        authentication_schemes: ('api_key' | 'oauth2' | 'jwt' | 'basic' | 'none')[];
        authorization_model: 'rbac' | 'abac' | 'simple' | 'none';
        rate_limiting?: {
            enabled: boolean;
            strategy?: 'token_bucket' | 'fixed_window' | 'sliding_window';
            limits?: {
                requests_per_minute?: number;
                burst_limit?: number;
            };
        };
        encryption?: {
            at_rest?: 'aes_256' | 'aes_128' | 'none';
            in_transit?: 'tls_1_3' | 'tls_1_2' | 'none';
        };
    };
    'x-ossa-performance': {
        sla_targets?: {
            availability?: number;
            response_time_p95?: string;
            error_rate_threshold?: number;
        };
        scaling?: {
            horizontal?: boolean;
            vertical?: boolean;
            auto_scaling?: boolean;
        };
        monitoring?: {
            metrics_endpoint?: string;
            health_endpoint?: string;
            observability_level?: 'basic' | 'detailed' | 'comprehensive';
        };
    };
    'x-ossa-observability'?: {
        monitoring_enabled?: boolean;
        alert_on_failure?: boolean;
        sla_critical?: boolean;
        metrics?: {
            collection_interval?: string;
            retention_period?: string;
            alert_thresholds?: Record<string, number>;
        };
        tracing?: {
            enabled?: boolean;
            sampling_rate?: number;
            exporters?: string[];
        };
        logging?: {
            level?: 'debug' | 'info' | 'warn' | 'error';
            structured?: boolean;
            retention_days?: number;
        };
    };
}
export interface ApiClientConfig {
    baseURL: string;
    apiKey?: string;
    timeout?: number;
    retryConfig?: {
        retries: number;
        retryDelay: number;
        retryCondition?: (error: any) => boolean;
    };
    headers?: Record<string, string>;
    interceptors?: {
        request?: Array<(config: any) => any>;
        response?: Array<(response: any) => any>;
    };
}
export interface AuthConfig {
    type: 'api_key' | 'oauth2' | 'jwt' | 'basic';
    credentials: {
        api_key?: string;
        access_token?: string;
        refresh_token?: string;
        client_id?: string;
        client_secret?: string;
        username?: string;
        password?: string;
    };
}
export interface AgentFilters {
    limit?: number;
    offset?: number;
    tier?: 'core' | 'governed' | 'advanced';
    class?: 'general' | 'specialist' | 'workflow' | 'integration' | 'security' | 'data' | 'nlp' | 'vision' | 'audio';
    status?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    capability?: string;
    domain?: string;
}
export interface MetricsFilters {
    timeframe?: '1h' | '24h' | '7d' | '30d';
    format?: 'json' | 'prometheus';
}
export interface WorkflowFilters {
    status?: 'active' | 'paused' | 'completed' | 'failed';
    limit?: number;
    offset?: number;
}
export type ConformanceTier = 'core' | 'governed' | 'advanced';
export type CertificationLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AgentClass = 'general' | 'specialist' | 'workflow' | 'integration' | 'security' | 'data' | 'nlp' | 'vision' | 'audio';
export type AgentCategory = 'assistant' | 'tool' | 'service' | 'coordinator';
export type ProtocolName = 'openapi' | 'mcp' | 'uadp' | 'graphql' | 'grpc' | 'websocket';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed';
export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export declare const CONFORMANCE_TIERS: readonly ["core", "governed", "advanced"];
export declare const CERTIFICATION_LEVELS: readonly ["bronze", "silver", "gold", "platinum"];
export declare const AGENT_CLASSES: readonly ["general", "specialist", "workflow", "integration", "security", "data", "nlp", "vision", "audio"];
export declare const AGENT_CATEGORIES: readonly ["assistant", "tool", "service", "coordinator"];
export declare const PROTOCOL_NAMES: readonly ["openapi", "mcp", "uadp", "graphql", "grpc", "websocket"];
export declare const HEALTH_STATUSES: readonly ["healthy", "degraded", "unhealthy", "unknown"];
export declare const isConformanceTier: (value: string) => value is ConformanceTier;
export declare const isCertificationLevel: (value: string) => value is CertificationLevel;
export declare const isAgentClass: (value: string) => value is AgentClass;
export declare const isAgentCategory: (value: string) => value is AgentCategory;
export declare const isProtocolName: (value: string) => value is ProtocolName;
export declare const isHealthStatus: (value: string) => value is HealthStatus;
export declare const isAgent: (obj: any) => obj is Agent;
export declare const isApiError: (obj: any) => obj is ApiError;
export declare const isHealthResponse: (obj: any) => obj is HealthResponse;
export declare const DEFAULT_AGENT_FILTERS: AgentFilters;
export declare const DEFAULT_METRICS_FILTERS: MetricsFilters;
export declare const DEFAULT_API_CONFIG: Partial<ApiClientConfig>;
export interface OpenAPISchema {
    openapi: '3.1.0';
    info: {
        title: string;
        description: string;
        version: string;
        contact?: {
            name?: string;
            email?: string;
            url?: string;
        };
        license?: {
            name: string;
            url?: string;
        };
    };
    servers: Array<{
        url: string;
        description?: string;
    }>;
    paths: Record<string, any>;
    components: {
        schemas: Record<string, any>;
        securitySchemes?: Record<string, any>;
        responses?: Record<string, any>;
    };
}
export * from './types.js';
