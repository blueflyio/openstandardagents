/**
 * OSSA Registry Service Interface
 *
 * SOLID Principles:
 * - Single Responsibility: Registry operations only
 * - Open/Closed: Extensible through interface
 * - Liskov Substitution: Any implementation can substitute
 * - Interface Segregation: Clean, focused interface
 * - Dependency Inversion: Depend on abstraction
 */

import {
  Agent,
  AgentCreateRequest,
  AgentListResponse,
  AgentUpdateRequest,
  Analytics,
  Certification,
  CertificationListResponse,
  CertificationRequest,
  GetAnalyticsParams,
  ListAgentsParams,
  SearchParams,
  SearchResponse,
  Version,
  VersionListResponse
} from '../../schemas/registry.schemas';

/**
 * Registry Service Interface
 *
 * Provides CRUD operations for OSSA agents, versions,
 * certifications, and analytics.
 */
export interface IRegistryService {
  // ============================================================================
  // Agent Operations
  // ============================================================================

  /**
   * List all agents with filtering and pagination
   */
  listAgents(params: ListAgentsParams): Promise<AgentListResponse>;

  /**
   * Get agent by namespace and name
   */
  getAgent(namespace: string, name: string): Promise<Agent>;

  /**
   * Register a new agent
   */
  createAgent(request: AgentCreateRequest, userId: string): Promise<Agent>;

  /**
   * Update agent metadata
   */
  updateAgent(namespace: string, name: string, request: AgentUpdateRequest, userId: string): Promise<Agent>;

  /**
   * Delete agent (soft delete)
   */
  deleteAgent(namespace: string, name: string, userId: string): Promise<void>;

  // ============================================================================
  // Version Operations
  // ============================================================================

  /**
   * List versions for an agent
   */
  listVersions(namespace: string, name: string, page?: number, limit?: number): Promise<VersionListResponse>;

  /**
   * Get specific version
   */
  getVersion(namespace: string, name: string, version: string): Promise<Version>;

  /**
   * Publish new version
   */
  createVersion(
    namespace: string,
    name: string,
    version: string,
    manifest: Buffer,
    readme?: string,
    signature?: Buffer
  ): Promise<Version>;

  /**
   * Unpublish version
   */
  deleteVersion(namespace: string, name: string, version: string, userId: string): Promise<void>;

  /**
   * Download manifest file
   */
  downloadManifest(namespace: string, name: string, version: string): Promise<Buffer>;

  // ============================================================================
  // Search Operations
  // ============================================================================

  /**
   * Search agents by query
   */
  searchAgents(params: SearchParams): Promise<SearchResponse>;

  // ============================================================================
  // Certification Operations
  // ============================================================================

  /**
   * List all certifications
   */
  listCertifications(page?: number, limit?: number): Promise<CertificationListResponse>;

  /**
   * Request certification for an agent
   */
  requestCertification(
    namespace: string,
    name: string,
    request: CertificationRequest,
    userId: string
  ): Promise<Certification>;

  /**
   * Get certification status
   */
  getCertification(namespace: string, name: string): Promise<Certification | null>;

  // ============================================================================
  // Analytics Operations
  // ============================================================================

  /**
   * Get analytics for an agent
   */
  getAnalytics(namespace: string, name: string, params: GetAnalyticsParams, userId: string): Promise<Analytics>;

  /**
   * Record download event
   */
  recordDownload(
    namespace: string,
    name: string,
    version: string,
    metadata?: {
      ip?: string;
      country?: string;
      referrer?: string;
    }
  ): Promise<void>;
}

/**
 * Registry Storage Interface
 *
 * Abstraction for different storage backends
 * (PostgreSQL, S3, etc.)
 */
export interface IRegistryStorage {
  // Agent storage
  saveAgent(agent: Agent): Promise<void>;
  findAgent(namespace: string, name: string): Promise<Agent | null>;
  findAgentById(id: string): Promise<Agent | null>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent>;
  deleteAgent(id: string): Promise<void>;
  listAgents(params: ListAgentsParams): Promise<AgentListResponse>;

  // Version storage
  saveVersion(version: Version): Promise<void>;
  findVersion(agentId: string, version: string): Promise<Version | null>;
  listVersions(agentId: string, page: number, limit: number): Promise<VersionListResponse>;
  deleteVersion(id: string): Promise<void>;

  // Manifest storage
  saveManifest(namespace: string, name: string, version: string, manifest: Buffer): Promise<string>;
  getManifest(namespace: string, name: string, version: string): Promise<Buffer>;

  // Certification storage
  saveCertification(certification: Certification): Promise<void>;
  findCertification(agentId: string): Promise<Certification | null>;
  listCertifications(page: number, limit: number): Promise<CertificationListResponse>;

  // Analytics storage
  saveDownloadEvent(event: {
    agent_id: string;
    version_id: string;
    timestamp: Date;
    ip?: string;
    country?: string;
    referrer?: string;
  }): Promise<void>;
  getAnalytics(agentId: string, from: Date, to: Date): Promise<Analytics>;

  // Search
  searchAgents(params: SearchParams): Promise<SearchResponse>;
}

/**
 * Validation Service Interface
 *
 * Validates OSSA manifests against schema
 */
export interface IManifestValidator {
  /**
   * Validate OSSA manifest
   */
  validate(manifest: Buffer): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }>;

  /**
   * Validate signature
   */
  verifySignature(manifest: Buffer, signature: Buffer): Promise<boolean>;
}

/**
 * Authorization Service Interface
 *
 * Checks user permissions
 */
export interface IAuthService {
  /**
   * Check if user can create agent in namespace
   */
  canCreateAgent(userId: string, namespace: string): Promise<boolean>;

  /**
   * Check if user can modify agent
   */
  canModifyAgent(userId: string, agentId: string): Promise<boolean>;

  /**
   * Check if user can delete agent
   */
  canDeleteAgent(userId: string, agentId: string): Promise<boolean>;

  /**
   * Check if user can publish version
   */
  canPublishVersion(userId: string, agentId: string): Promise<boolean>;

  /**
   * Check if user can view analytics
   */
  canViewAnalytics(userId: string, agentId: string): Promise<boolean>;
}
