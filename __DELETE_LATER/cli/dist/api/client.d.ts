/**
 * OSSA Platform API Client
 * Generated from OpenAPI 3.1.0 specification with full OSSA v0.1.8 compliance
 *
 * Comprehensive API client supporting all OSSA platform operations including:
 * - Agent registration and management
 * - Universal Agent Discovery Protocol (UADP)
 * - Multi-agent workflow orchestration
 * - Real-time monitoring and observability
 * - GraphQL federation and subscriptions
 *
 * @version 0.1.8
 */
import { AxiosResponse } from 'axios';
import type { HealthResponse, VersionInfo, PlatformMetrics, Agent, AgentRegistration, AgentUpdate, AgentList, AgentFilters, AgentStatus, AgentCapabilities, DiscoveryResult, DiscoveryRequest, RecommendationRequest, RecommendationResponse, Workflow, WorkflowDefinition, WorkflowExecution, WorkflowExecutionRequest, WorkflowFilters, Protocol, ConformanceTier, CertificationLevel, AgentClass, AgentCategory, ProtocolName, HealthStatus, WorkflowStatus, ExecutionStatus, OSSAExtensions, GraphQLRequest, GraphQLResponse, ApiClientConfig, AuthConfig, ApiResponse, PaginatedResponse, ApiError, MetricsFilters } from './generated-types.js';
export interface EnhancedApiClientConfig extends ApiClientConfig {
    auth?: AuthConfig;
    enableRetry?: boolean;
    enableMetrics?: boolean;
    userAgent?: string;
    customHeaders?: Record<string, string>;
}
/**
 * Enhanced OSSA Platform API Client
 *
 * Provides comprehensive access to all OSSA v0.1.8 platform capabilities
 * with automatic error handling, retry logic, and observability features.
 */
export declare class OSSAApiClient {
    private axios;
    private config;
    constructor(config?: Partial<EnhancedApiClientConfig>);
    /**
     * Setup request and response interceptors
     */
    private setupInterceptors;
    /**
     * Generate authentication headers based on configuration
     */
    private getAuthHeaders;
    /**
     * Generate unique request ID for tracing
     */
    private generateRequestId;
    /**
     * Determine if request should be retried
     */
    private shouldRetry;
    /**
     * Delay utility for retry logic
     */
    private delay;
    /**
     * Record API metrics (placeholder for actual implementation)
     */
    private recordMetrics;
    /**
     * Get comprehensive system health status
     */
    getHealth(): Promise<AxiosResponse<HealthStatus>>;
    /**
     * Get platform version information
     */
    getVersion(): Promise<AxiosResponse<VersionInfo>>;
    /**
     * Get platform metrics with filtering options
     */
    getMetrics(filters?: MetricsFilters): Promise<AxiosResponse<PlatformMetrics>>;
    /**
     * List all registered agents with comprehensive filtering
     */
    listAgents(filters?: AgentFilters): Promise<AxiosResponse<AgentList>>;
    /**
     * Get detailed information about a specific agent
     */
    getAgent(agentId: string): Promise<AxiosResponse<Agent>>;
    /**
     * Register a new agent with the platform
     */
    registerAgent(registration: AgentRegistration): Promise<AxiosResponse<Agent>>;
    /**
     * Update an existing agent's configuration
     */
    updateAgent(agentId: string, update: AgentUpdate): Promise<AxiosResponse<Agent>>;
    /**
     * Unregister an agent from the platform
     */
    unregisterAgent(agentId: string): Promise<AxiosResponse<void>>;
    /**
     * Get agent health status
     */
    getAgentHealth(agentId: string): Promise<AxiosResponse<AgentStatus>>;
    /**
     * Get detailed agent capabilities
     */
    getAgentCapabilities(agentId: string): Promise<AxiosResponse<any>>;
    /**
     * Discover agents by capabilities using UADP
     */
    discoverAgents(request?: DiscoveryRequest): Promise<AxiosResponse<DiscoveryResult>>;
    /**
     * Get AI-powered agent recommendations
     */
    recommendAgents(request: RecommendationRequest): Promise<AxiosResponse<RecommendationResponse>>;
    /**
     * List all orchestration workflows
     */
    listWorkflows(filters?: WorkflowFilters): Promise<AxiosResponse<PaginatedResponse<Workflow>>>;
    /**
     * Create a new orchestration workflow
     */
    createWorkflow(definition: WorkflowDefinition): Promise<AxiosResponse<Workflow>>;
    /**
     * Get detailed workflow information
     */
    getWorkflow(workflowId: string): Promise<AxiosResponse<Workflow>>;
    /**
     * Execute a workflow
     */
    executeWorkflow(workflowId: string, request: WorkflowExecutionRequest): Promise<AxiosResponse<WorkflowExecution>>;
    /**
     * Get workflow execution status and results
     */
    getExecution(executionId: string): Promise<AxiosResponse<WorkflowExecution>>;
    /**
     * Cancel a running workflow execution
     */
    cancelExecution(executionId: string): Promise<AxiosResponse<{
        status: 'cancelled';
        message: string;
    }>>;
    /**
     * Execute GraphQL queries and mutations with full federation support
     */
    graphql(request: GraphQLRequest): Promise<AxiosResponse<GraphQLResponse>>;
    /**
     * Convenience method for simple GraphQL queries
     */
    query(query: string, variables?: Record<string, any>, operationName?: string): Promise<AxiosResponse<GraphQLResponse>>;
    /**
     * Stream real-time platform events (returns EventSource-like interface)
     */
    streamEvents(eventTypes?: string[]): Promise<EventTarget>;
    /**
     * Bulk operations for agent management
     */
    bulkUpdateAgents(updates: Array<{
        agentId: string;
        update: AgentUpdate;
    }>): Promise<AxiosResponse<Agent[]>>;
    /**
     * Get platform-wide governance and compliance status
     */
    getGovernanceStatus(): Promise<AxiosResponse<any>>;
    /**
     * Validate agent compliance with OSSA standards
     */
    validateCompliance(agentId: string): Promise<AxiosResponse<any>>;
    /**
     * Get detailed audit logs for platform operations
     */
    getAuditLogs(filters?: {
        startDate?: string;
        endDate?: string;
        agentId?: string;
        operation?: string;
        limit?: number;
    }): Promise<AxiosResponse<PaginatedResponse<any>>>;
}
export declare class ApiClient extends OSSAApiClient {
    constructor(config?: Partial<ApiClientConfig>);
}
/**
 * Default OSSA API client instance with environment-based configuration
 */
export declare const ossaClient: OSSAApiClient;
/**
 * Legacy API client for backwards compatibility
 */
export declare const apiClient: ApiClient;
/**
 * Create a new OSSA API client with custom configuration
 */
export declare function createOSSAClient(config: EnhancedApiClientConfig): OSSAApiClient;
/**
 * Create a client with API key authentication
 */
export declare function createAPIKeyClient(apiKey: string, baseURL?: string): OSSAApiClient;
/**
 * Create a client with OAuth2 authentication
 */
export declare function createOAuth2Client(accessToken: string, baseURL?: string): OSSAApiClient;
/**
 * Create a client with JWT authentication
 */
export declare function createJWTClient(token: string, baseURL?: string): OSSAApiClient;
export type { ApiClientConfig, AuthConfig, HealthResponse, VersionInfo, PlatformMetrics, Agent, AgentRegistration, AgentUpdate, AgentList, AgentFilters, AgentStatus, AgentCapabilities, DiscoveryResult, DiscoveryRequest, RecommendationRequest, RecommendationResponse, Workflow, WorkflowDefinition, WorkflowExecution, WorkflowExecutionRequest, WorkflowFilters, Protocol, GraphQLRequest, GraphQLResponse, ApiResponse, PaginatedResponse, ApiError, MetricsFilters, ConformanceTier, CertificationLevel, AgentClass, AgentCategory, ProtocolName, HealthStatus as HealthStatusType, WorkflowStatus, ExecutionStatus, OSSAExtensions };
export { isConformanceTier, isCertificationLevel, isAgentClass, isAgentCategory, isProtocolName, isHealthStatus, isAgent, isApiError, } from './generated-types.js';
export { CONFORMANCE_TIERS, CERTIFICATION_LEVELS, AGENT_CLASSES, AGENT_CATEGORIES, PROTOCOL_NAMES, HEALTH_STATUSES, DEFAULT_AGENT_FILTERS, DEFAULT_METRICS_FILTERS, DEFAULT_API_CONFIG } from './generated-types.js';
