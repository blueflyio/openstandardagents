/**
 * Agent Protocol Client Service
 *
 * HTTP client for communicating with the Agent Protocol API.
 * Implements OSSA CLI registry commands for agent registration and discovery.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { injectable } from 'inversify';
import type { OssaAgent } from '../types/index.js';

/**
 * Agent Card - Metadata for agent registry
 */
export interface AgentCard {
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
 */
export interface AgentSearchResult {
  agents: AgentCard[];
  total: number;
  limit: number;
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

  constructor(config?: AgentProtocolClientConfig) {
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
   * @param manifest - OSSA agent manifest
   * @param card - Agent card metadata
   * @returns Registration response with GAID
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
