import axios, { AxiosInstance } from 'axios';
import type { Agent, AgentFilter, AgentReview, UsageStatistics } from '@/types/agent';

const API_BASE_URL = process.env.NEXT_PUBLIC_REGISTRY_API_URL || 'http://localhost:3000/api/v1';

class MarketplaceAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Agent Discovery
  async searchAgents(filters: AgentFilter): Promise<Agent[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.trustLevels?.length) params.append('trustLevels', filters.trustLevels.join(','));
    if (filters.domains?.length) params.append('domains', filters.domains.join(','));
    if (filters.platforms?.length) params.append('platforms', filters.platforms.join(','));
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.tags?.length) params.append('tags', filters.tags.join(','));

    const { data } = await this.client.get<Agent[]>(`/registry/agents?${params.toString()}`);
    return data;
  }

  async getAgent(gaid: string): Promise<Agent> {
    const { data } = await this.client.get<Agent>(`/registry/agents/${gaid}`);
    return data;
  }

  async getTrendingAgents(limit = 10): Promise<Agent[]> {
    const { data } = await this.client.get<Agent[]>(`/registry/agents/trending?limit=${limit}`);
    return data;
  }

  async getRecentAgents(limit = 10): Promise<Agent[]> {
    const { data } = await this.client.get<Agent[]>(`/registry/agents/recent?limit=${limit}`);
    return data;
  }

  async getTopRatedAgents(limit = 10): Promise<Agent[]> {
    const { data } = await this.client.get<Agent[]>(`/registry/agents/top-rated?limit=${limit}`);
    return data;
  }

  async getRecommendedAgents(gaid?: string, limit = 10): Promise<Agent[]> {
    const url = gaid
      ? `/registry/agents/${gaid}/recommended?limit=${limit}`
      : `/registry/agents/recommended?limit=${limit}`;
    const { data } = await this.client.get<Agent[]>(url);
    return data;
  }

  // Reviews
  async getAgentReviews(gaid: string): Promise<AgentReview[]> {
    const { data } = await this.client.get<AgentReview[]>(`/registry/agents/${gaid}/reviews`);
    return data;
  }

  async submitReview(gaid: string, review: Partial<AgentReview>): Promise<AgentReview> {
    const { data } = await this.client.post<AgentReview>(`/registry/agents/${gaid}/reviews`, review);
    return data;
  }

  // Statistics
  async getAgentStatistics(gaid: string): Promise<UsageStatistics> {
    const { data } = await this.client.get<UsageStatistics>(`/registry/agents/${gaid}/statistics`);
    return data;
  }

  // Registration
  async registerAgent(manifest: any): Promise<{ gaid: string; agent: Agent }> {
    const { data } = await this.client.post<{ gaid: string; agent: Agent }>('/registry/agents', {
      manifest,
    });
    return data;
  }

  async validateManifest(manifest: any): Promise<{ valid: boolean; errors?: string[] }> {
    const { data } = await this.client.post<{ valid: boolean; errors?: string[] }>(
      '/registry/validate',
      { manifest }
    );
    return data;
  }

  // Filters
  async getAvailableDomains(): Promise<string[]> {
    const { data } = await this.client.get<string[]>('/registry/metadata/domains');
    return data;
  }

  async getAvailablePlatforms(): Promise<string[]> {
    const { data } = await this.client.get<string[]>('/registry/metadata/platforms');
    return data;
  }

  async getAvailableTags(): Promise<string[]> {
    const { data } = await this.client.get<string[]>('/registry/metadata/tags');
    return data;
  }
}

export const api = new MarketplaceAPI();
