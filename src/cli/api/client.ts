/**
 * OSSA Platform API Client
 * Generated from OpenAPI specification
 * 
 * This is a manual implementation that would normally be generated
 * from the OpenAPI spec using openapi-typescript-codegen
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  HealthStatus, 
  VersionInfo, 
  Agent, 
  AgentRegistration, 
  AgentUpdate, 
  AgentList, 
  DiscoveryResult, 
  PlatformMetrics 
} from './types';

export interface ApiClientConfig {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
}

export class ApiClient {
  private axios: AxiosInstance;

  constructor(config: ApiClientConfig = {}) {
    this.axios = axios.create({
      baseURL: config.baseURL || process.env.OSSA_API_URL || 'http://localhost:4000/api/v1',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey })
      }
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error || error.message || 'API request failed';
        throw new Error(message);
      }
    );
  }

  // Health endpoints
  async getHealth(): Promise<AxiosResponse<HealthStatus>> {
    return this.axios.get('/health');
  }

  async getVersion(): Promise<AxiosResponse<VersionInfo>> {
    return this.axios.get('/version');
  }

  // Agent endpoints
  async listAgents(params: {
    limit?: number;
    offset?: number;
    class?: 'general' | 'specialist' | 'workflow' | 'integration';
    tier?: 'core' | 'governed' | 'advanced';
  } = {}): Promise<AxiosResponse<AgentList>> {
    return this.axios.get('/agents', { params });
  }

  async getAgent(id: string): Promise<AxiosResponse<Agent>> {
    return this.axios.get(`/agents/${id}`);
  }

  async registerAgent(agent: AgentRegistration): Promise<AxiosResponse<Agent>> {
    return this.axios.post('/agents', agent);
  }

  async updateAgent(id: string, update: AgentUpdate): Promise<AxiosResponse<Agent>> {
    return this.axios.put(`/agents/${id}`, update);
  }

  async unregisterAgent(id: string): Promise<AxiosResponse<void>> {
    return this.axios.delete(`/agents/${id}`);
  }

  // Discovery endpoints
  async discoverAgents(params: {
    capabilities?: string[];
    domain?: string;
    tier?: 'core' | 'governed' | 'advanced';
  } = {}): Promise<AxiosResponse<DiscoveryResult>> {
    return this.axios.get('/discover', { params });
  }

  // Metrics endpoints
  async getMetrics(params: {
    timeframe?: '1h' | '6h' | '24h' | '7d' | '30d';
  } = {}): Promise<AxiosResponse<PlatformMetrics>> {
    return this.axios.get('/metrics', { params });
  }

  // GraphQL endpoint
  async graphql(query: string, variables?: any, operationName?: string): Promise<AxiosResponse<any>> {
    return this.axios.post('/graphql', {
      query,
      variables,
      operationName
    });
  }
}

// Default client instance
export const apiClient = new ApiClient({
  apiKey: process.env.OSSA_API_KEY || process.env.TEST_API_KEY
});

// Export types for convenience
export type {
  HealthStatus,
  VersionInfo, 
  Agent,
  AgentRegistration,
  AgentUpdate,
  AgentList,
  DiscoveryResult,
  PlatformMetrics
};