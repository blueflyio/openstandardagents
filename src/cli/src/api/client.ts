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

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import type { 
  // Core system types
  HealthResponse, 
  VersionInfo, 
  PlatformMetrics,
  
  // Agent types
  Agent, 
  AgentRegistration, 
  AgentUpdate, 
  AgentList,
  AgentFilters,
  AgentStatus,
  AgentCapabilities,
  
  // Discovery types
  DiscoveryResult,
  DiscoveryRequest,
  RecommendationRequest,
  RecommendationResponse,
  
  // Orchestration types
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionRequest,
  WorkflowFilters,
  
  // Protocol and metadata types
  Protocol,
  ConformanceTier,
  CertificationLevel,
  AgentClass,
  AgentCategory,
  ProtocolName,
  HealthStatus,
  WorkflowStatus,
  ExecutionStatus,
  OSSAExtensions,
  
  // GraphQL types
  GraphQLRequest,
  GraphQLResponse,
  
  // Configuration types
  ApiClientConfig,
  AuthConfig,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  MetricsFilters
} from './generated-types';

// Enhanced client configuration with full OSSA support
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
export class OSSAApiClient {
  private axios: AxiosInstance;
  private config: EnhancedApiClientConfig;

  constructor(config: Partial<EnhancedApiClientConfig> = {}) {
    this.config = {
      baseURL: 'https://api.ossa.agents/v1',
      timeout: 30000,
      enableRetry: true,
      enableMetrics: true,
      userAgent: 'OSSA-CLI/0.1.8',
      ...config
    };

    this.axios = axios.create({
      baseURL: this.config.baseURL || process.env.OSSA_API_URL || 'http://localhost:8080/v1',
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent,
        'X-OSSA-Version': '0.1.8',
        ...this.config.customHeaders,
        ...this.getAuthHeaders()
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for authentication and metrics
    this.axios.interceptors.request.use(
      (config) => {
        // Add request ID for tracing
        config.headers.set('X-Request-ID', this.generateRequestId());

        // Add timestamp for metrics
        if (this.config.enableMetrics) {
          (config as any)._requestStartTime = Date.now();
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and metrics
    this.axios.interceptors.response.use(
      (response) => {
        // Record metrics if enabled
        if (this.config.enableMetrics && (response.config as any)._requestStartTime) {
          const duration = Date.now() - (response.config as any)._requestStartTime;
          this.recordMetrics(response.config.method?.toUpperCase() || 'GET', response.config.url || '', response.status, duration);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Handle specific OSSA error responses
        if (error.response?.data?.error) {
          const apiError: ApiError = {
            error: error.response.data.error,
            details: error.response.data.details,
            request_id: error.response.data.request_id || error.config.headers['X-Request-ID'],
            timestamp: new Date().toISOString()
          };
          
          // Enhance error with OSSA context
          error.ossaError = apiError;
        }

        // Retry logic for specific error conditions
        if (this.config.enableRetry && this.shouldRetry(error) && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.delay(1000);
          return this.axios(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate authentication headers based on configuration
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'api_key':
          if (this.config.auth.credentials.api_key) {
            headers['X-API-Key'] = this.config.auth.credentials.api_key;
          }
          break;
        case 'oauth2':
          if (this.config.auth.credentials.access_token) {
            headers['Authorization'] = `Bearer ${this.config.auth.credentials.access_token}`;
          }
          break;
        case 'jwt':
          if (this.config.auth.credentials.access_token) {
            headers['Authorization'] = `Bearer ${this.config.auth.credentials.access_token}`;
          }
          break;
        case 'basic':
          if (this.config.auth.credentials.username && this.config.auth.credentials.password) {
            const credentials = Buffer.from(
              `${this.config.auth.credentials.username}:${this.config.auth.credentials.password}`
            ).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
      }
    }

    return headers;
  }

  /**
   * Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    const status = error.response?.status;
    return status >= 500 || status === 429 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
  }

  /**
   * Delay utility for retry logic
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Record API metrics (placeholder for actual implementation)
   */
  private recordMetrics(method: string, url: string, status: number, duration: number): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[OSSA Metrics] ${method} ${url} - ${status} (${duration}ms)`);
    }
    // In production, send to metrics backend
  }

  // =====================================================================
  // System and Health Endpoints
  // =====================================================================

  /**
   * Get comprehensive system health status
   */
  async getHealth(): Promise<AxiosResponse<HealthStatus>> {
    return this.axios.get('/health');
  }

  /**
   * Get platform version information
   */
  async getVersion(): Promise<AxiosResponse<VersionInfo>> {
    return this.axios.get('/version');
  }

  /**
   * Get platform metrics with filtering options
   */
  async getMetrics(filters: MetricsFilters = {}): Promise<AxiosResponse<PlatformMetrics>> {
    return this.axios.get('/metrics', { params: filters });
  }

  // =====================================================================
  // Agent Management Endpoints
  // =====================================================================

  /**
   * List all registered agents with comprehensive filtering
   */
  async listAgents(filters: AgentFilters = {}): Promise<AxiosResponse<AgentList>> {
    return this.axios.get('/agents', { params: filters });
  }

  /**
   * Get detailed information about a specific agent
   */
  async getAgent(agentId: string): Promise<AxiosResponse<Agent>> {
    return this.axios.get(`/agents/${agentId}`);
  }

  /**
   * Register a new agent with the platform
   */
  async registerAgent(registration: AgentRegistration): Promise<AxiosResponse<Agent>> {
    return this.axios.post('/agents', registration);
  }

  /**
   * Update an existing agent's configuration
   */
  async updateAgent(agentId: string, update: AgentUpdate): Promise<AxiosResponse<Agent>> {
    return this.axios.put(`/agents/${agentId}`, update);
  }

  /**
   * Unregister an agent from the platform
   */
  async unregisterAgent(agentId: string): Promise<AxiosResponse<void>> {
    return this.axios.delete(`/agents/${agentId}`);
  }

  /**
   * Get agent health status
   */
  async getAgentHealth(agentId: string): Promise<AxiosResponse<AgentStatus>> {
    return this.axios.get(`/agents/${agentId}/health`);
  }

  /**
   * Get detailed agent capabilities
   */
  async getAgentCapabilities(agentId: string): Promise<AxiosResponse<any>> {
    return this.axios.get(`/agents/${agentId}/capabilities`);
  }

  // =====================================================================
  // Universal Agent Discovery Protocol (UADP) Endpoints
  // =====================================================================

  /**
   * Discover agents by capabilities using UADP
   */
  async discoverAgents(request: DiscoveryRequest = {}): Promise<AxiosResponse<DiscoveryResult>> {
    const params = {
      ...request,
      capabilities: Array.isArray(request.capabilities) ? request.capabilities.join(',') : request.capabilities
    };
    return this.axios.get('/discover', { params });
  }

  /**
   * Get AI-powered agent recommendations
   */
  async recommendAgents(request: RecommendationRequest): Promise<AxiosResponse<RecommendationResponse>> {
    return this.axios.post('/discover/recommend', request);
  }

  // =====================================================================
  // Workflow Orchestration Endpoints
  // =====================================================================

  /**
   * List all orchestration workflows
   */
  async listWorkflows(filters: WorkflowFilters = {}): Promise<AxiosResponse<PaginatedResponse<Workflow>>> {
    return this.axios.get('/orchestration/workflows', { params: filters });
  }

  /**
   * Create a new orchestration workflow
   */
  async createWorkflow(definition: WorkflowDefinition): Promise<AxiosResponse<Workflow>> {
    return this.axios.post('/orchestration/workflows', definition);
  }

  /**
   * Get detailed workflow information
   */
  async getWorkflow(workflowId: string): Promise<AxiosResponse<Workflow>> {
    return this.axios.get(`/orchestration/workflows/${workflowId}`);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, request: WorkflowExecutionRequest): Promise<AxiosResponse<WorkflowExecution>> {
    return this.axios.post(`/orchestration/workflows/${workflowId}`, request);
  }

  /**
   * Get workflow execution status and results
   */
  async getExecution(executionId: string): Promise<AxiosResponse<WorkflowExecution>> {
    return this.axios.get(`/orchestration/executions/${executionId}`);
  }

  /**
   * Cancel a running workflow execution
   */
  async cancelExecution(executionId: string): Promise<AxiosResponse<{ status: 'cancelled'; message: string }>> {
    return this.axios.delete(`/orchestration/executions/${executionId}`);
  }

  // =====================================================================
  // GraphQL Federation Endpoint
  // =====================================================================

  /**
   * Execute GraphQL queries and mutations with full federation support
   */
  async graphql(request: GraphQLRequest): Promise<AxiosResponse<GraphQLResponse>> {
    return this.axios.post('/graphql', request);
  }

  /**
   * Convenience method for simple GraphQL queries
   */
  async query(query: string, variables?: Record<string, any>, operationName?: string): Promise<AxiosResponse<GraphQLResponse>> {
    return this.graphql({ query, variables, operationName });
  }

  // =====================================================================
  // Advanced Platform Features
  // =====================================================================

  /**
   * Stream real-time platform events (returns EventSource-like interface)
   */
  async streamEvents(eventTypes: string[] = []): Promise<EventTarget> {
    // Implementation would establish WebSocket or SSE connection
    // This is a placeholder for the actual streaming implementation
    throw new Error('Event streaming not yet implemented in this client version');
  }

  /**
   * Bulk operations for agent management
   */
  async bulkUpdateAgents(updates: Array<{ agentId: string; update: AgentUpdate }>): Promise<AxiosResponse<Agent[]>> {
    return this.axios.post('/agents/bulk', { updates });
  }

  /**
   * Get platform-wide governance and compliance status
   */
  async getGovernanceStatus(): Promise<AxiosResponse<any>> {
    return this.axios.get('/governance/status');
  }

  /**
   * Validate agent compliance with OSSA standards
   */
  async validateCompliance(agentId: string): Promise<AxiosResponse<any>> {
    return this.axios.post(`/agents/${agentId}/validate`, {});
  }

  /**
   * Get detailed audit logs for platform operations
   */
  async getAuditLogs(filters: { 
    startDate?: string; 
    endDate?: string; 
    agentId?: string; 
    operation?: string;
    limit?: number;
  } = {}): Promise<AxiosResponse<PaginatedResponse<any>>> {
    return this.axios.get('/audit/logs', { params: filters });
  }
}

// =====================================================================
// Legacy API Client (for backwards compatibility)
// =====================================================================

export class ApiClient extends OSSAApiClient {
  constructor(config: Partial<ApiClientConfig> = {}) {
    super(config);
  }
}

// =====================================================================
// Default Client Instances
// =====================================================================

/**
 * Default OSSA API client instance with environment-based configuration
 */
export const ossaClient = new OSSAApiClient({
  apiKey: process.env.OSSA_API_KEY,
  baseURL: process.env.OSSA_API_URL,
  enableRetry: true,
  enableMetrics: process.env.NODE_ENV === 'production',
});

/**
 * Legacy API client for backwards compatibility
 */
export const apiClient = new ApiClient({
  apiKey: process.env.OSSA_API_KEY || process.env.TEST_API_KEY,
  baseURL: process.env.OSSA_API_URL || 'http://localhost:8080/v1',
});

// =====================================================================
// Client Factory Functions
// =====================================================================

/**
 * Create a new OSSA API client with custom configuration
 */
export function createOSSAClient(config: EnhancedApiClientConfig): OSSAApiClient {
  return new OSSAApiClient(config);
}

/**
 * Create a client with API key authentication
 */
export function createAPIKeyClient(apiKey: string, baseURL?: string): OSSAApiClient {
  return new OSSAApiClient({
    auth: {
      type: 'api_key',
      credentials: { api_key: apiKey }
    },
    baseURL
  });
}

/**
 * Create a client with OAuth2 authentication
 */
export function createOAuth2Client(accessToken: string, baseURL?: string): OSSAApiClient {
  return new OSSAApiClient({
    auth: {
      type: 'oauth2',
      credentials: { access_token: accessToken }
    },
    baseURL
  });
}

/**
 * Create a client with JWT authentication
 */
export function createJWTClient(token: string, baseURL?: string): OSSAApiClient {
  return new OSSAApiClient({
    auth: {
      type: 'jwt',
      credentials: { access_token: token }
    },
    baseURL
  });
}

// =====================================================================
// Exported Types and Interfaces
// =====================================================================

export type {
  // Configuration types
  ApiClientConfig,
  AuthConfig,
  
  // Core system types
  HealthResponse,
  VersionInfo, 
  PlatformMetrics,
  
  // Agent types
  Agent,
  AgentRegistration,
  AgentUpdate,
  AgentList,
  AgentFilters,
  AgentStatus,
  AgentCapabilities,
  
  // Discovery types
  DiscoveryResult,
  DiscoveryRequest,
  RecommendationRequest,
  RecommendationResponse,
  
  // Orchestration types
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionRequest,
  WorkflowFilters,
  
  // Protocol types
  Protocol,
  GraphQLRequest,
  GraphQLResponse,
  
  // Utility types
  ApiResponse,
  PaginatedResponse,
  ApiError,
  MetricsFilters,
  
  // Type guards and constants
  ConformanceTier,
  CertificationLevel,
  AgentClass,
  AgentCategory,
  ProtocolName,
  HealthStatus as HealthStatusType,
  WorkflowStatus,
  ExecutionStatus,
  
  // OSSA extensions
  OSSAExtensions
};

// Export validation functions
export {
  isConformanceTier,
  isCertificationLevel,
  isAgentClass,
  isAgentCategory,
  isProtocolName,
  isHealthStatus,
  isAgent,
  isApiError,
} from './generated-types';

// Export constants
export {
  CONFORMANCE_TIERS,
  CERTIFICATION_LEVELS,
  AGENT_CLASSES,
  AGENT_CATEGORIES,
  PROTOCOL_NAMES,
  HEALTH_STATUSES,
  DEFAULT_AGENT_FILTERS,
  DEFAULT_METRICS_FILTERS,
  DEFAULT_API_CONFIG
} from './generated-types';