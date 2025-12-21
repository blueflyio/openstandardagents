/**
 * OSSA Discovery Operations
 *
 * Client methods for discovering agents by taxonomy, capabilities, and compliance.
 */

import { OSSAClient } from './client.js';

export interface TaxonomyNode {
  domain: string;
  subdomains?: {
    [key: string]: {
      capabilities?: string[];
    };
  };
}

export interface TaxonomiesList {
  taxonomies: TaxonomyNode[];
}

export interface CapabilityDefinition {
  name: string;
  description: string;
  domain: string;
  subdomain?: string;
  example_agents: string[];
  schema?: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
}

export interface CapabilitiesResponse {
  capabilities: CapabilityDefinition[];
}

export interface ComplianceProfile {
  id: string;
  name: string;
  description: string;
  requirements: Array<{
    category: string;
    requirement: string;
    validation: string;
  }>;
  agent_count: number;
}

export interface ComplianceProfilesResponse {
  profiles: ComplianceProfile[];
}

export interface DiscoveryFilters {
  domain?: string;
  subdomain?: string;
  capability?: string;
  compliance?: string[];
  min_rating?: number;
  verified_only?: boolean;
  has_dependencies?: boolean;
  license?: string;
}

export interface RecommendationRequest {
  use_case: string;
  requirements?: {
    compliance?: string[];
    budget?: string;
    performance?: 'low' | 'medium' | 'high';
    integration?: string[];
  };
  preferences?: {
    verified_only?: boolean;
    open_source_only?: boolean;
    min_rating?: number;
  };
}

export interface AgentRecommendation {
  agent: {
    publisher: string;
    name: string;
    version: string;
    description: string;
  };
  score: number;
  reasoning: string;
  compliance_match: string[];
  capability_match: string[];
  estimated_cost?: string;
}

export interface RecommendationResponse {
  recommendations: AgentRecommendation[];
  total_matches: number;
}

/**
 * Discovery operations client
 */
export class DiscoveryClient {
  constructor(private client: OSSAClient) {}

  /**
   * List available taxonomies
   */
  async listTaxonomies(): Promise<TaxonomiesList> {
    return this.client.request<TaxonomiesList>({
      method: 'GET',
      path: '/specification/taxonomies',
    });
  }

  /**
   * List capabilities by domain
   */
  async listCapabilities(domain?: string): Promise<CapabilitiesResponse> {
    return this.client.request<CapabilitiesResponse>({
      method: 'GET',
      path: '/specification/capabilities',
      query: domain ? { domain } : undefined,
    });
  }

  /**
   * Get capability definition
   */
  async getCapability(capabilityName: string): Promise<CapabilityDefinition> {
    return this.client.request<CapabilityDefinition>({
      method: 'GET',
      path: `/specification/capabilities/${capabilityName}`,
    });
  }

  /**
   * List compliance profiles
   */
  async listComplianceProfiles(): Promise<ComplianceProfilesResponse> {
    return this.client.request<ComplianceProfilesResponse>({
      method: 'GET',
      path: '/specification/compliance',
    });
  }

  /**
   * Get compliance profile details
   */
  async getComplianceProfile(profileId: string): Promise<ComplianceProfile> {
    return this.client.request<ComplianceProfile>({
      method: 'GET',
      path: `/specification/compliance/${profileId}`,
    });
  }

  /**
   * Discover agents by taxonomy
   */
  async discoverByTaxonomy(
    domain: string,
    subdomain?: string,
    capability?: string
  ): Promise<{
    taxonomy: { domain: string; subdomain?: string; capability?: string };
    agents: Array<{
      publisher: string;
      name: string;
      version: string;
      description: string;
      rating: number;
      downloads: number;
    }>;
    total: number;
  }> {
    const query: Record<string, string> = { domain };
    if (subdomain) query.subdomain = subdomain;
    if (capability) query.capability = capability;

    return this.client.request({
      method: 'GET',
      path: '/agents/discover/taxonomy',
      query,
    });
  }

  /**
   * Discover agents by compliance requirements
   */
  async discoverByCompliance(
    profiles: string[]
  ): Promise<{
    compliance_profiles: string[];
    agents: Array<{
      publisher: string;
      name: string;
      version: string;
      description: string;
      compliance_profiles: string[];
      verified: boolean;
    }>;
    total: number;
  }> {
    return this.client.request({
      method: 'GET',
      path: '/agents/discover/compliance',
      query: { profiles: profiles.join(',') },
    });
  }

  /**
   * Get agent recommendations based on use case
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    return this.client.request<RecommendationResponse>({
      method: 'POST',
      path: '/agents/recommend',
      body: request,
    });
  }

  /**
   * Advanced discovery with multiple filters
   */
  async discover(filters: DiscoveryFilters): Promise<{
    filters: DiscoveryFilters;
    results: Array<{
      publisher: string;
      name: string;
      version: string;
      description: string;
      taxonomy: { domain: string; subdomain?: string; capability?: string };
      compliance_profiles: string[];
      rating: number;
      verified: boolean;
    }>;
    total: number;
  }> {
    return this.client.request({
      method: 'POST',
      path: '/agents/discover',
      body: filters,
    });
  }
}
