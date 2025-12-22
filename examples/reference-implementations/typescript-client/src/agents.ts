/**
 * OSSA Agent Operations
 *
 * Client methods for agent discovery, publishing, and lifecycle management.
 */

import { OSSAClient } from './client.js';

export interface AgentManifest {
  apiVersion: string;
  kind: 'Agent';
  metadata: {
    name: string;
    version: string;
    description: string;
    labels?: Record<string, string>;
  };
  spec: {
    taxonomy: {
      domain: string;
      subdomain?: string;
      capability?: string;
    };
    role: string;
    llm?: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
    capabilities?: Array<{
      name: string;
      description: string;
      input_schema: Record<string, unknown>;
      output_schema: Record<string, unknown>;
    }>;
    runtime?: {
      type: string;
      config?: Record<string, unknown>;
    };
  };
}

export interface PublishRequest {
  manifest: AgentManifest;
  package: {
    tarball_url: string;
    shasum: string;
    size_bytes: number;
  };
  documentation?: {
    readme?: string;
    changelog?: string;
    repository?: string;
  };
  license: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
}

export interface PublishResponse {
  status: 'published' | 'pending' | 'failed';
  agent: {
    name: string;
    version: string;
    publisher: string;
    published_at: string;
    registry_url: string;
    package_url: string;
  };
  verification: {
    schema_valid: boolean;
    security_scan: 'passed' | 'failed' | 'pending';
    verified_publisher: boolean;
  };
}

export interface SearchParams {
  q?: string;
  tag?: string;
  capability?: string;
  domain?: string;
  publisher?: string;
  license?: string;
  compliance?: string;
  verified?: boolean;
  min_rating?: number;
  sort?: 'downloads' | 'rating' | 'updated' | 'created' | 'relevance';
  limit?: number;
  offset?: number;
}

export interface AgentSearchResult {
  name: string;
  version: string;
  publisher: string;
  description: string;
  license: string;
  downloads: number;
  rating: number;
  verified: boolean;
  tags: string[];
  capabilities: string[];
  created_at: string;
  updated_at: string;
  registry_url: string;
}

export interface SearchResponse {
  total: number;
  limit: number;
  offset: number;
  agents: AgentSearchResult[];
}

export interface AgentDetails extends AgentSearchResult {
  long_description: string;
  repository: string;
  homepage: string;
  documentation: string;
  taxonomy: {
    domain: string;
    subdomain?: string;
    capability?: string;
  };
  compliance_profiles: string[];
  rating_info: {
    average: number;
    count: number;
  };
  download_stats: {
    total: number;
    last_month: number;
    last_week: number;
  };
  versions: Array<{
    version: string;
    published_at: string;
    changelog?: string;
  }>;
  dependencies: Record<string, string>;
  manifest_url: string;
  package_url: string;
}

export interface VersionInfo {
  version: string;
  published_at: string;
  downloads: number;
  changelog_url?: string;
  manifest_url: string;
  package_url: string;
  deprecated?: boolean;
  deprecation_reason?: string;
}

export interface VersionsResponse {
  agent: string;
  versions: VersionInfo[];
}

/**
 * Agent operations client
 */
export class AgentClient {
  constructor(private client: OSSAClient) {}

  /**
   * Search and list agents
   */
  async search(params: SearchParams = {}): Promise<SearchResponse> {
    return this.client.request<SearchResponse>({
      method: 'GET',
      path: '/agents',
      query: params as Record<string, string | number | boolean>,
    });
  }

  /**
   * Publish a new agent or version
   */
  async publish(request: PublishRequest): Promise<PublishResponse> {
    return this.client.request<PublishResponse>({
      method: 'POST',
      path: '/agents',
      body: request,
    });
  }

  /**
   * Get agent details (latest version)
   */
  async get(publisher: string, name: string): Promise<AgentDetails> {
    return this.client.request<AgentDetails>({
      method: 'GET',
      path: `/agents/${publisher}/${name}`,
    });
  }

  /**
   * Get specific agent version
   */
  async getVersion(publisher: string, name: string, version: string): Promise<AgentDetails> {
    return this.client.request<AgentDetails>({
      method: 'GET',
      path: `/agents/${publisher}/${name}/${version}`,
    });
  }

  /**
   * List all versions of an agent
   */
  async listVersions(publisher: string, name: string): Promise<VersionsResponse> {
    return this.client.request<VersionsResponse>({
      method: 'GET',
      path: `/agents/${publisher}/${name}/versions`,
    });
  }

  /**
   * Unpublish a specific agent version
   */
  async unpublish(
    publisher: string,
    name: string,
    version: string,
    reason?: string
  ): Promise<{ status: string; agent: string; version: string; unpublished_at: string }> {
    return this.client.request({
      method: 'DELETE',
      path: `/agents/${publisher}/${name}/${version}`,
      body: reason ? { reason } : undefined,
    });
  }

  /**
   * Deprecate a specific agent version
   */
  async deprecate(
    publisher: string,
    name: string,
    version: string,
    reason: string,
    replacementVersion?: string
  ): Promise<{
    status: string;
    agent: string;
    version: string;
    deprecated_at: string;
    replacement_version?: string;
  }> {
    return this.client.request({
      method: 'POST',
      path: `/agents/${publisher}/${name}/${version}/deprecate`,
      body: {
        reason,
        replacement_version: replacementVersion,
      },
    });
  }

  /**
   * Get agent dependencies
   */
  async getDependencies(
    publisher: string,
    name: string,
    version?: string
  ): Promise<{
    agent: string;
    version: string;
    dependencies: {
      runtime?: Record<string, unknown>;
      agents?: Record<string, unknown>;
      tools?: Record<string, unknown>;
    };
    dependency_tree: Record<string, unknown>;
  }> {
    return this.client.request({
      method: 'GET',
      path: `/agents/${publisher}/${name}/dependencies`,
      query: version ? { version } : undefined,
    });
  }
}
