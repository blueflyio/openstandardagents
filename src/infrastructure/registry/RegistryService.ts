/**
 * OSSA Registry Service Implementation
 *
 * Production-grade implementation following SOLID principles.
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  IAuthService,
  IManifestValidator,
  IRegistryService,
  IRegistryStorage
} from '../../domain/registry/IRegistryService';
import {
  Agent,
  AgentCreateRequest,
  AgentCreateRequestSchema,
  AgentListResponse,
  AgentUpdateRequest,
  AgentUpdateRequestSchema,
  Analytics,
  Certification,
  CertificationListResponse,
  CertificationRequest,
  GetAnalyticsParams,
  GetAnalyticsParamsSchema,
  ListAgentsParams,
  SearchParams,
  SearchParamsSchema,
  SearchResponse,
  Version,
  VersionListResponse
} from '../../schemas/registry.schemas';

export class RegistryService implements IRegistryService {
  constructor(
    private readonly storage: IRegistryStorage,
    private readonly validator: IManifestValidator,
    private readonly authService: IAuthService
  ) {}

  // ============================================================================
  // Agent Operations
  // ============================================================================

  async listAgents(params: ListAgentsParams): Promise<AgentListResponse> {
    return this.storage.listAgents(params);
  }

  async getAgent(namespace: string, name: string): Promise<Agent> {
    const agent = await this.storage.findAgent(namespace, name);
    if (!agent) {
      throw new NotFoundError(`Agent ${namespace}/${name} not found`);
    }
    return agent;
  }

  async createAgent(request: AgentCreateRequest, userId: string): Promise<Agent> {
    // Validate request
    const validated = AgentCreateRequestSchema.parse(request);

    // Check authorization
    const canCreate = await this.authService.canCreateAgent(userId, validated.namespace);
    if (!canCreate) {
      throw new ForbiddenError(`Not authorized to create agent in namespace ${validated.namespace}`);
    }

    // Check if agent already exists
    const existing = await this.storage.findAgent(validated.namespace, validated.name);
    if (existing) {
      throw new ConflictError(`Agent ${validated.namespace}/${validated.name} already exists`);
    }

    // Create agent
    const agent: Agent = {
      id: uuidv4(),
      namespace: validated.namespace,
      name: validated.name,
      full_name: `${validated.namespace}/${validated.name}`,
      description: validated.description,
      readme: validated.readme,
      homepage: validated.homepage,
      repository: validated.repository,
      latest_version: '0.0.0', // Will be updated on first publish
      downloads: 0,
      stars: 0,
      tags: validated.tags || [],
      certified: false,
      compliance: [],
      maintainers: [
        {
          username: userId,
          role: 'owner'
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await this.storage.saveAgent(agent);
    return agent;
  }

  async updateAgent(namespace: string, name: string, request: AgentUpdateRequest, userId: string): Promise<Agent> {
    // Validate request
    const validated = AgentUpdateRequestSchema.parse(request);

    // Find agent
    const agent = await this.getAgent(namespace, name);

    // Check authorization
    const canModify = await this.authService.canModifyAgent(userId, agent.id);
    if (!canModify) {
      throw new ForbiddenError(`Not authorized to modify agent ${agent.full_name}`);
    }

    // Update agent
    const updates: Partial<Agent> = {
      ...validated,
      updated_at: new Date().toISOString()
    };

    return this.storage.updateAgent(agent.id, updates);
  }

  async deleteAgent(namespace: string, name: string, userId: string): Promise<void> {
    // Find agent
    const agent = await this.getAgent(namespace, name);

    // Check authorization
    const canDelete = await this.authService.canDeleteAgent(userId, agent.id);
    if (!canDelete) {
      throw new ForbiddenError(`Not authorized to delete agent ${agent.full_name}`);
    }

    await this.storage.deleteAgent(agent.id);
  }

  // ============================================================================
  // Version Operations
  // ============================================================================

  async listVersions(
    namespace: string,
    name: string,
    page: number = 1,
    limit: number = 20
  ): Promise<VersionListResponse> {
    const agent = await this.getAgent(namespace, name);
    return this.storage.listVersions(agent.id, page, limit);
  }

  async getVersion(namespace: string, name: string, version: string): Promise<Version> {
    const agent = await this.getAgent(namespace, name);
    const versionObj = await this.storage.findVersion(agent.id, version);

    if (!versionObj) {
      throw new NotFoundError(`Version ${version} not found for agent ${agent.full_name}`);
    }

    return versionObj;
  }

  async createVersion(
    namespace: string,
    name: string,
    version: string,
    manifest: Buffer,
    readme?: string,
    signature?: Buffer
  ): Promise<Version> {
    // Find agent
    const agent = await this.getAgent(namespace, name);

    // Check authorization (requires explicit check)
    // In production, extract userId from context/JWT
    // For now, assuming authorization is handled at API layer

    // Validate manifest
    const validation = await this.validator.validate(manifest);
    if (!validation.valid) {
      throw new ValidationError(`Invalid OSSA manifest: ${validation.errors?.join(', ')}`);
    }

    // Check if version already exists
    const existing = await this.storage.findVersion(agent.id, version);
    if (existing) {
      throw new ConflictError(`Version ${version} already exists for agent ${agent.full_name}`);
    }

    // Verify signature if provided
    let verified = false;
    if (signature) {
      verified = await this.validator.verifySignature(manifest, signature);
    }

    // Calculate checksum
    const sha256 = crypto.createHash('sha256').update(manifest).digest('hex');

    // Save manifest to storage
    const manifestUrl = await this.storage.saveManifest(namespace, name, version, manifest);

    // Create version record
    const versionRecord: Version = {
      id: uuidv4(),
      version,
      agent_id: agent.id,
      manifest_url: manifestUrl,
      readme,
      signature: signature?.toString('base64'),
      verified,
      downloads: 0,
      sha256,
      size: manifest.length,
      created_at: new Date().toISOString()
    };

    await this.storage.saveVersion(versionRecord);

    // Update agent's latest version
    await this.storage.updateAgent(agent.id, {
      latest_version: version,
      updated_at: new Date().toISOString()
    });

    return versionRecord;
  }

  async deleteVersion(namespace: string, name: string, version: string, userId: string): Promise<void> {
    const agent = await this.getAgent(namespace, name);
    const versionObj = await this.getVersion(namespace, name, version);

    // Check authorization
    const canDelete = await this.authService.canDeleteAgent(userId, agent.id);
    if (!canDelete) {
      throw new ForbiddenError(`Not authorized to delete version for agent ${agent.full_name}`);
    }

    await this.storage.deleteVersion(versionObj.id);
  }

  async downloadManifest(namespace: string, name: string, version: string): Promise<Buffer> {
    // Verify version exists
    await this.getVersion(namespace, name, version);

    // Get manifest from storage
    const manifest = await this.storage.getManifest(namespace, name, version);

    // Record download
    await this.recordDownload(namespace, name, version);

    return manifest;
  }

  // ============================================================================
  // Search Operations
  // ============================================================================

  async searchAgents(params: SearchParams): Promise<SearchResponse> {
    const validated = SearchParamsSchema.parse(params);
    return this.storage.searchAgents(validated);
  }

  // ============================================================================
  // Certification Operations
  // ============================================================================

  async listCertifications(page: number = 1, limit: number = 20): Promise<CertificationListResponse> {
    return this.storage.listCertifications(page, limit);
  }

  async requestCertification(
    namespace: string,
    name: string,
    request: CertificationRequest,
    userId: string
  ): Promise<Certification> {
    const agent = await this.getAgent(namespace, name);

    // Check authorization
    const canModify = await this.authService.canModifyAgent(userId, agent.id);
    if (!canModify) {
      throw new ForbiddenError(`Not authorized to request certification for agent ${agent.full_name}`);
    }

    // Check if version exists
    await this.getVersion(namespace, name, request.version);

    // Create certification request
    const certification: Certification = {
      id: uuidv4(),
      agent_id: agent.id,
      level: request.level,
      compliance_frameworks: request.compliance_frameworks,
      status: 'pending',
      requested_at: new Date().toISOString(),
      notes: request.notes
    };

    await this.storage.saveCertification(certification);
    return certification;
  }

  async getCertification(namespace: string, name: string): Promise<Certification | null> {
    const agent = await this.getAgent(namespace, name);
    return this.storage.findCertification(agent.id);
  }

  // ============================================================================
  // Analytics Operations
  // ============================================================================

  async getAnalytics(namespace: string, name: string, params: GetAnalyticsParams, userId: string): Promise<Analytics> {
    const validated = GetAnalyticsParamsSchema.parse(params);
    const agent = await this.getAgent(namespace, name);

    // Check authorization
    const canView = await this.authService.canViewAnalytics(userId, agent.id);
    if (!canView) {
      throw new ForbiddenError(`Not authorized to view analytics for agent ${agent.full_name}`);
    }

    const from = validated.from ? new Date(validated.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = validated.to ? new Date(validated.to) : new Date();

    return this.storage.getAnalytics(agent.id, from, to);
  }

  async recordDownload(
    namespace: string,
    name: string,
    version: string,
    metadata?: { ip?: string; country?: string; referrer?: string }
  ): Promise<void> {
    const agent = await this.getAgent(namespace, name);
    const versionObj = await this.getVersion(namespace, name, version);

    await this.storage.saveDownloadEvent({
      agent_id: agent.id,
      version_id: versionObj.id,
      timestamp: new Date(),
      ...metadata
    });

    // Increment download counters
    await this.storage.updateAgent(agent.id, {
      downloads: agent.downloads + 1
    });
  }
}

// ============================================================================
// Error Classes
// ============================================================================

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}
