/**
 * OSSA Router Types and Interfaces
 * High-performance agent discovery protocol types
 */

export interface OSSAAgent {
  id: string;
  name: string;
  version: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastSeen: Date;
  registrationTime: Date;
  
  metadata: {
    class: 'general' | 'specialist' | 'workflow' | 'integration';
    category: 'assistant' | 'tool' | 'service' | 'coordinator';
    conformanceTier: 'core' | 'governed' | 'advanced';
    certificationLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  
  capabilities: {
    primary: string[];
    secondary?: string[];
    domains: string[];
  };
  
  protocols: ProtocolSupport[];
  endpoints: AgentEndpoints;
  
  performance: {
    avgResponseTimeMs: number;
    uptimePercentage: number;
    requestsHandled: number;
    successRate: number;
    throughputRps: number;
  };
  
  compliance?: {
    frameworks: string[];
    certifications?: string[];
    auditDate?: Date;
  };
}

export interface ProtocolSupport {
  name: 'rest' | 'graphql' | 'grpc' | 'websocket' | 'mcp';
  version: string;
  required: boolean;
  endpoints?: Record<string, string>;
  features?: string[];
}

export interface AgentEndpoints {
  health: string;
  capabilities?: string;
  api: string;
  metrics?: string;
  openapi?: string;
}

export interface DiscoveryQuery {
  capabilities?: string[];
  domains?: string[];
  protocols?: string[];
  performanceTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  conformanceTier?: 'core' | 'governed' | 'advanced';
  complianceFrameworks?: string[];
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy';
  maxResults?: number;
  includeInactive?: boolean;
  sortBy?: 'performance' | 'capability_match' | 'last_seen' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface DiscoveryResult {
  agents: OSSAAgent[];
  discoveryTimeMs: number;
  totalFound: number;
  query: DiscoveryQuery;
  ranking: {
    enabled: boolean;
    algorithm: string;
    factors: string[];
  };
  cache: {
    hit: boolean;
    ttl?: number;
  };
}

export interface CapabilityMatch {
  agentId: string;
  score: number;
  matchedCapabilities: string[];
  exactMatches: string[];
  partialMatches: string[];
  domainRelevance: number;
}

export interface RouterConfig {
  protocols: {
    rest: RESTConfig;
    graphql: GraphQLConfig;
    grpc: GRPCConfig;
  };
  
  discovery: {
    cacheTimeout: number;
    maxCacheEntries: number;
    healthCheckInterval: number;
    indexingEnabled: boolean;
  };
  
  performance: {
    targetResponseTime: number; // ms
    maxConcurrentQueries: number;
    batchSize: number;
    compressionEnabled: boolean;
  };
  
  clustering: {
    enabled: boolean;
    nodes?: string[];
    replicationFactor?: number;
  };
}

export interface RESTConfig {
  port: number;
  basePath: string;
  cors: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export interface GraphQLConfig {
  enabled: boolean;
  endpoint: string;
  subscriptions: boolean;
  introspection: boolean;
  playground: boolean;
}

export interface GRPCConfig {
  enabled: boolean;
  port: number;
  reflection: boolean;
  compression: boolean;
}

export interface PerformanceMetrics {
  timestamp: Date;
  totalQueries: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  indexSize: number;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  expiry: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface IndexEntry {
  agentId: string;
  capabilities: Set<string>;
  domains: Set<string>;
  protocols: Set<string>;
  performanceScore: number;
  healthScore: number;
  lastUpdate: Date;
}

// Protocol-specific types
export interface RESTDiscoveryRequest {
  method: 'GET' | 'POST';
  path: string;
  query?: Record<string, any>;
  body?: DiscoveryQuery;
  headers: Record<string, string>;
}

export interface GraphQLDiscoveryQuery {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GRPCDiscoveryRequest {
  service: string;
  method: string;
  message: any;
  metadata?: Record<string, string>;
}

// Event types for real-time updates
export interface RouterEvent {
  type: 'agent_registered' | 'agent_updated' | 'agent_removed' | 'discovery_query' | 'health_check';
  timestamp: Date;
  data: any;
  agentId?: string;
}

export interface HealthCheckResult {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  timestamp: Date;
}