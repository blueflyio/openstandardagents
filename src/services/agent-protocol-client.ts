/**
 * Agent Protocol Client Service
 *
 * HTTP client for communicating with the Agent Protocol API.
 * Implements OSSA CLI registry commands for agent registration and discovery.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { injectable, unmanaged } from 'inversify';
import type { OssaAgent } from '../types/index.js';

/**
 * Agent Card Basic - Legacy minimal metadata (backward compatible)
 * @deprecated Use AgentCard instead for full first-class citizen identity
 */
export interface AgentCardBasic {
  gaid: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  tags?: string[];
  homepage?: string;
  repository?: string;
  capabilities?: string[];
}

/**
 * Agent Endpoint Configuration
 * Deployment information for agent runtime access
 */
export interface AgentEndpoint {
  /** Service endpoint URL */
  url: string;
  /** Environment type for this endpoint */
  type: 'production' | 'staging' | 'development';
  /** Protocol used for communication */
  protocol: 'http' | 'grpc' | 'websocket' | 'mqtt';
  /** Current health status */
  health: 'healthy' | 'degraded' | 'down';
  /** Last health check timestamp (ISO 8601) */
  lastChecked?: string;
  /** Primary endpoint indicator (only one per type should be true) */
  primary?: boolean;
}

/**
 * Rate Limiting Configuration
 * Defines usage constraints for this agent
 */
export interface RateLimitConfig {
  /** Maximum requests per minute */
  requestsPerMinute?: number;
  /** Maximum requests per hour */
  requestsPerHour?: number;
  /** Maximum requests per day */
  requestsPerDay?: number;
  /** Maximum concurrent requests */
  concurrentRequests?: number;
  /** Tokens per minute (for LLM agents) */
  tokensPerMinute?: number;
  /** Tokens per hour (for LLM agents) */
  tokensPerHour?: number;
  /** Maximum request size in bytes */
  maxRequestSize?: number;
  /** Maximum response size in bytes */
  maxResponseSize?: number;
}

/**
 * Service Level Agreement
 * Guarantees about agent performance and availability
 */
export interface ServiceLevelAgreement {
  /** Target availability percentage (e.g., 99.9) */
  availability: number;
  /** Maximum response time in milliseconds */
  responseTime: number;
  /** Maximum allowed error rate percentage */
  errorRate: number;
  /** SLA period (e.g., 'monthly', 'annual') */
  period?: 'monthly' | 'annual' | 'rolling';
  /** SLA start date (ISO 8601) */
  effectiveFrom?: string;
  /** SLA end date (ISO 8601) */
  effectiveUntil?: string;
  /** Penalties for SLA violation (credits or refunds) */
  penalties?: {
    availabilityBreach: number;
    responsePenalty: number;
    errorPenalty: number;
  };
}

/**
 * Audit Trail Entry
 * Records significant events in agent lifecycle
 */
export interface AuditTrailEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Type of event */
  event: 'created' | 'registered' | 'updated' | 'verified' | 'deployed' | 'suspended' | 'revoked' | 'migrated';
  /** Actor who performed the action (user ID or system) */
  actor: string;
  /** Additional context (change summary, reason for action, etc.) */
  details?: string;
  /** Associated resource ID or version */
  reference?: string;
}

/**
 * Compliance Certification
 * Standards and certifications this agent adheres to
 */
export interface ComplianceCertification {
  /** List of compliance frameworks */
  frameworks: ('SOC2' | 'HIPAA' | 'GDPR' | 'ISO27001' | 'PCI-DSS' | 'NIST' | 'FedRAMP' | 'CCPA')[];
  /** Certification date (ISO 8601) */
  certifiedAt?: string;
  /** Expiration date (ISO 8601) */
  expiresAt?: string;
  /** Third-party auditor name */
  auditor?: string;
  /** Certification report URL */
  reportUrl?: string;
  /** Compliance notes */
  notes?: string;
}

/**
 * Agent Dependency
 * Relationship to other agents or services
 */
export interface AgentDependency {
  /** Global Agent ID of the dependency */
  gaid: string;
  /** Name of the dependency */
  name: string;
  /** Relationship type */
  relationship: 'requires' | 'recommends' | 'conflicts' | 'replaces';
  /** Minimum version requirement (semantic versioning) */
  minVersion?: string;
  /** Maximum version requirement (semantic versioning) */
  maxVersion?: string;
  /** Whether this dependency is optional */
  optional?: boolean;
}

/**
 * Agent Usage Statistics
 * Operational metrics and usage patterns
 */
export interface AgentUsageStats {
  /** Total executions since creation */
  totalExecutions: number;
  /** Success rate percentage (0-100) */
  successRate: number;
  /** Average execution duration in milliseconds */
  avgDuration: number;
  /** Minimum execution duration in milliseconds */
  minDuration?: number;
  /** Maximum execution duration in milliseconds */
  maxDuration?: number;
  /** Last execution timestamp (ISO 8601) */
  lastExecution?: string;
  /** Total tokens consumed (for LLM agents) */
  totalTokensConsumed?: number;
  /** Unique users/callers */
  uniqueCallers?: number;
  /** Error count in last period */
  recentErrors?: number;
}

/**
 * Agent Review
 * User feedback and ratings
 */
export interface AgentReview {
  /** Total number of reviews */
  count: number;
  /** Average rating (0-5 stars) */
  averageRating: number;
  /** Distribution of ratings */
  ratingDistribution?: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
  /** Most recent review */
  latestReview?: {
    rating: number;
    comment: string;
    author: string;
    timestamp: string;
  };
}

/**
 * Pricing Model
 * Cost structure for using this agent
 */
export interface PricingModel {
  /** Pricing model type */
  model: 'free' | 'pay-per-use' | 'subscription' | 'enterprise' | 'hybrid';
  /** Cost per invocation in USD */
  costPerInvocation?: number;
  /** Cost per minute in USD */
  costPerMinute?: number;
  /** Cost per token in USD (for LLM agents) */
  costPerToken?: number;
  /** Currency code (ISO 4217) */
  currency?: string;
  /** Billing cycle for subscriptions */
  billingCycle?: 'monthly' | 'quarterly' | 'annually' | 'usage-based';
  /** Minimum commitment amount in USD */
  minimumCommitment?: number;
  /** Volume discounts (percentage off at thresholds) */
  volumeDiscounts?: Array<{
    minRequests: number;
    discountPercentage: number;
  }>;
  /** Trial period in days (if available) */
  trialDays?: number;
  /** Pricing notes and terms */
  notes?: string;
}

/**
 * Token Budget Configuration
 * Token limits and monitoring for LLM-based agents
 */
export interface TokenBudgetConfig {
  /** Maximum tokens per request */
  maxTokensPerRequest?: number;
  /** Maximum tokens per day */
  maxTokensPerDay?: number;
  /** Maximum tokens per month */
  maxTokensPerMonth?: number;
  /** Estimated cost per 1000 tokens */
  estimatedCostPer1kTokens?: number;
  /** Alert threshold (tokens remaining) */
  alertThreshold?: number;
}

/**
 * Environment Requirements
 * Hardware and software requirements for agent execution
 */
export interface EnvironmentRequirements {
  /** CPU requirements (e.g., "2 cores", "4 cores", "Intel i7+") */
  cpu?: string;
  /** Memory requirements (e.g., "4Gi", "8GB", "16GB") */
  memory?: string;
  /** GPU requirements (e.g., "1x A100", "2x RTX 3090") */
  gpu?: string;
  /** Storage requirements (e.g., "10Gi", "100GB") */
  storage?: string;
  /** Required OS (e.g., "Linux", "macOS", "Windows") */
  os?: string;
  /** Required runtime (e.g., "Node.js 18+", "Python 3.11+") */
  runtime?: string;
  /** Required dependencies (software) */
  dependencies?: string[];
  /** Network requirements (bandwidth, connectivity) */
  network?: string;
}

/**
 * Agent Identity & Trust Information
 * Cryptographic and trust-related fields
 */
export interface AgentIdentity {
  /** Serial number (AG-XXXX-XXXX format) */
  serialNumber: string;
  /** Public key for signature verification (PEM format) */
  publicKey: string;
  /** X.509 certificate for trust chain (PEM format) */
  certificate?: string;
  /** Trust score (0-100) based on usage and reputation */
  trustScore: number;
  /** Trust tier classification */
  trustTier: 'verified' | 'trusted' | 'unverified' | 'experimental';
  /** Entity/person who verified this agent */
  verifiedBy?: string;
  /** Entity/organization who issued the identity card */
  issuer: string;
  /** DID (Decentralized Identifier) for this agent */
  did?: string;
  /** Thumbprint for quick verification */
  thumbprint?: string;
}

/**
 * Agent Runtime State
 * Current operational status and health
 */
export interface AgentRuntimeState {
  /** Current operational status */
  status: 'active' | 'inactive' | 'deprecated' | 'suspended' | 'archived';
  /** Current availability (percentage) */
  uptime: number;
  /** Average response time in milliseconds */
  avgResponseTime: number;
  /** Deployment endpoints */
  endpoints: AgentEndpoint[];
  /** Last status check timestamp (ISO 8601) */
  lastStatusCheck?: string;
  /** Current load level (percentage) */
  currentLoad?: number;
  /** Queue depth (pending requests) */
  queueDepth?: number;
}

/**
 * Agent Comprehensive ID Card
 * First-class citizen identity for agents with full credentials and metadata
 *
 * Represents a complete agent passport with:
 * - Identity & Trust: Cryptographic identity, trust scores, verification
 * - Runtime Information: Status, endpoints, health, performance metrics
 * - Capabilities & Contracts: Protocols, schemas, rate limits, SLAs
 * - Provenance & Audit: Creation history, versioning, compliance
 * - Social & Discovery: Organization, team, dependencies, usage stats
 * - Economics: Pricing, billing, token budgets
 * - Metadata: Classification, domain, environment requirements
 *
 * Required fields for first-class citizen agents: gaid, name
 * Fields with defaults (for backward compatibility): identity, created, modified, registeredAt
 */
export interface AgentCard {
  // ───────────────────────────────────────────────────────────────────────────
  // IDENTITY & TRUST - Cryptographic identity and trust establishment
  // ───────────────────────────────────────────────────────────────────────────

  /** Global Agent ID (unique identifier) */
  gaid: string;
  /** Human-readable agent name */
  name: string;
  /** Agent identity and trust information (auto-generated if not provided) */
  identity?: AgentIdentity;

  // ───────────────────────────────────────────────────────────────────────────
  // VERSION & METADATA - Basic information about the agent
  // ───────────────────────────────────────────────────────────────────────────

  /** Semantic version of this agent (e.g., "1.2.3") */
  version: string;
  /** Human-friendly description of agent purpose and capabilities */
  description?: string;
  /** Author or creator of this agent */
  author?: string;
  /** Open source license identifier (e.g., "Apache-2.0", "MIT") */
  license?: string;
  /** Classification tags for discovery (e.g., "nlp", "vision", "code-review") */
  tags?: string[];

  // ───────────────────────────────────────────────────────────────────────────
  // DISCOVERY & SOCIAL - Social and organizational information
  // ───────────────────────────────────────────────────────────────────────────

  /** Organization or team that owns/maintains this agent */
  organization?: string;
  /** Team within organization responsible for this agent */
  team?: string;
  /** Agent role in system (coordinator, worker, specialist, etc.) */
  role?: 'leader' | 'worker' | 'specialist' | 'coordinator' | 'monitor' | 'trainer';
  /** Homepage URL for agent documentation */
  homepage?: string;
  /** Repository URL for source code */
  repository?: string;
  /** Documentation URL */
  documentationUrl?: string;
  /** Support/contact URL or email */
  supportUrl?: string;

  // ───────────────────────────────────────────────────────────────────────────
  // CAPABILITIES & PROTOCOLS - What this agent can do and how
  // ───────────────────────────────────────────────────────────────────────────

  /** List of capabilities this agent provides */
  capabilities?: string[];
  /** Supported communication protocols (OSSA, MCP, OpenAI, Anthropic, etc.) */
  protocols?: string[];
  /** JSON Schema for agent input validation */
  inputSchema?: Record<string, unknown>;
  /** JSON Schema for agent output format */
  outputSchema?: Record<string, unknown>;
  /** Rate limiting configuration */
  rateLimits?: RateLimitConfig;
  /** Service Level Agreement guarantees */
  sla?: ServiceLevelAgreement;

  // ───────────────────────────────────────────────────────────────────────────
  // RUNTIME STATE - Current operational status and deployment
  // ───────────────────────────────────────────────────────────────────────────

  /** Current runtime state and health */
  runtime?: AgentRuntimeState;
  /** Deployment endpoints (can be overridden at runtime) */
  endpoints?: AgentEndpoint[];

  // ───────────────────────────────────────────────────────────────────────────
  // DEPENDENCIES - Relationships to other agents or services
  // ───────────────────────────────────────────────────────────────────────────

  /** Dependencies on other agents or services */
  dependencies?: AgentDependency[];

  // ───────────────────────────────────────────────────────────────────────────
  // USAGE & SOCIAL - Usage metrics and community feedback
  // ───────────────────────────────────────────────────────────────────────────

  /** Usage statistics and performance metrics */
  usageStats?: AgentUsageStats;
  /** Community reviews and ratings */
  reviews?: AgentReview;

  // ───────────────────────────────────────────────────────────────────────────
  // ECONOMICS & BILLING - Cost and pricing information
  // ───────────────────────────────────────────────────────────────────────────

  /** Pricing model and cost structure */
  pricing?: PricingModel;
  /** Token budget configuration (for LLM-based agents) */
  tokenBudgets?: TokenBudgetConfig;

  // ───────────────────────────────────────────────────────────────────────────
  // CLASSIFICATION & DOMAIN - Agent type and domain classification
  // ───────────────────────────────────────────────────────────────────────────

  /** Category from OSSA taxonomy (e.g., "data-processor", "code-reviewer") */
  category?: string;
  /** Problem domain this agent addresses */
  domain?: string;
  /** Cross-cutting concerns (security, observability, performance, etc.) */
  crossCuttingConcerns?: string[];
  /** Agent behavior type (autonomous, reactive, proactive, collaborative) */
  agentType?: 'reactive' | 'proactive' | 'autonomous' | 'collaborative' | 'hybrid';

  // ───────────────────────────────────────────────────────────────────────────
  // ENVIRONMENT & REQUIREMENTS - Runtime requirements and constraints
  // ───────────────────────────────────────────────────────────────────────────

  /** Hardware and software requirements for execution */
  environmentRequirements?: EnvironmentRequirements;

  // ───────────────────────────────────────────────────────────────────────────
  // PROVENANCE & AUDIT - Creation history, versioning, and lifecycle
  // ───────────────────────────────────────────────────────────────────────────

  /** Agent creation timestamp (ISO 8601) - auto-set if not provided */
  created?: string;
  /** Last modification timestamp (ISO 8601) - auto-set if not provided */
  modified?: string;
  /** Registration timestamp (ISO 8601) - auto-set if not provided */
  registeredAt?: string;
  /** Last activity timestamp (ISO 8601) */
  lastActive?: string;
  /** Audit trail of significant lifecycle events */
  auditTrail?: AuditTrailEntry[];

  // ───────────────────────────────────────────────────────────────────────────
  // COMPLIANCE & STANDARDS - Certifications and regulatory compliance
  // ───────────────────────────────────────────────────────────────────────────

  /** Compliance certifications and standards adherence */
  compliance?: ComplianceCertification;
}

/**
 * Agent Search Filters
 */
export interface AgentSearchFilters {
  tags?: string[];
  capabilities?: string[];
  author?: string;
  minVersion?: string;
  maxVersion?: string;
}

/**
 * Agent Search Query
 */
export interface AgentSearchQuery {
  query?: string;
  filters?: AgentSearchFilters;
  limit?: number;
  offset?: number;
}

/**
 * Agent Search Result
 * Results from searching the agent registry
 */
export interface AgentSearchResult {
  /** Array of matching agent cards */
  agents: AgentCard[];
  /** Total number of matching agents */
  total: number;
  /** Limit used in the search query */
  limit: number;
  /** Offset used in the search query */
  offset: number;
}

/**
 * DID Resolution Result
 */
export interface DIDResolutionResult {
  gaid: string;
  did: string;
  manifest?: OssaAgent;
  verificationMethod?: {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
  }[];
  service?: {
    id: string;
    type: string;
    serviceEndpoint: string;
  }[];
}

/**
 * Agent Registration Response
 */
export interface AgentRegistrationResponse {
  success: boolean;
  gaid: string;
  message?: string;
}

/**
 * Configuration for Agent Protocol Client
 */
export interface AgentProtocolClientConfig {
  baseURL?: string;
  timeout?: number;
  apiKey?: string;
}

/**
 * Agent Protocol Client Service
 *
 * Provides methods for interacting with the Agent Protocol API:
 * - Register agents to the global registry
 * - Search for agents by query and filters
 * - Retrieve agent details by GAID
 * - Resolve DIDs to agent manifests
 */
@injectable()
export class AgentProtocolClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(@unmanaged() config?: AgentProtocolClientConfig) {
    this.baseURL = config?.baseURL || 'https://api.blueflyagents.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config?.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Register an agent to the global registry
   *
   * Accepts comprehensive AgentCard with full identity, trust, and operational information.
   * Agents are treated as first-class citizens with complete credentials and provenance.
   *
   * @param manifest - OSSA agent manifest
   * @param card - Comprehensive agent identity card (with identity, trust, runtime, compliance)
   * @returns Registration response with GAID
   * @throws Error if registration fails
   *
   * @example
   * ```typescript
   * const card: AgentCard = {
   *   gaid: 'ag-001-code-reviewer',
   *   name: 'Code Review Agent',
   *   version: '1.0.0',
   *   identity: {
   *     serialNumber: 'AG-0001-0001',
   *     publicKey: '-----BEGIN PUBLIC KEY-----...',
   *     trustScore: 95,
   *     trustTier: 'verified',
   *     issuer: 'BlueFly.io Platform',
   *   },
   *   created: new Date().toISOString(),
   *   modified: new Date().toISOString(),
   *   registeredAt: new Date().toISOString(),
   * };
   * const response = await client.registerAgent(manifest, card);
   * ```
   */
  async registerAgent(
    manifest: OssaAgent,
    card: AgentCard
  ): Promise<AgentRegistrationResponse> {
    try {
      const response = await this.client.post<AgentRegistrationResponse>(
        '/api/v1/agents',
        {
          manifest,
          card,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Agent registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search for agents in the registry
   *
   * @param query - Search query and filters
   * @returns Search results with matching agents
   */
  async searchAgents(query: AgentSearchQuery): Promise<AgentSearchResult> {
    try {
      const response = await this.client.post<AgentSearchResult>(
        '/api/v1/agents/search',
        query
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Agent search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get agent details by GAID
   *
   * @param gaid - Global Agent ID
   * @returns Agent card and manifest
   */
  async getAgent(
    gaid: string
  ): Promise<{ card: AgentCard; manifest: OssaAgent }> {
    try {
      const response = await this.client.get<{
        card: AgentCard;
        manifest: OssaAgent;
      }>(`/api/v1/agents/${gaid}`);

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to get agent ${gaid}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Resolve DID to agent manifest
   *
   * @param gaid - Global Agent ID (or DID)
   * @returns DID document with agent manifest
   */
  async resolveDID(gaid: string): Promise<DIDResolutionResult> {
    try {
      const response =
        await this.client.get<DIDResolutionResult>(`/api/v1/dids/${gaid}`);

      return response.data;
    } catch (error) {
      throw new Error(
        `DID resolution failed for ${gaid}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Format axios error to user-friendly message
   *
   * @param error - Axios error
   * @returns Formatted error
   */
  private formatError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as { error?: string; message?: string };
      const message =
        data?.error || data?.message || error.response.statusText;

      return new Error(`HTTP ${status}: ${message}`);
    } else if (error.request) {
      // Request made but no response
      return new Error(
        `No response from server at ${this.baseURL}. Check network connection.`
      );
    } else {
      // Error setting up request
      return new Error(`Request setup failed: ${error.message}`);
    }
  }
}
