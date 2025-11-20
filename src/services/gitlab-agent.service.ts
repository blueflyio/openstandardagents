/**
 * GitLab Kubernetes Agent Service
 * Manages GitLab Kubernetes agent registration and installation
 * Follows OpenAPI-first, DRY, CRUD principles
 */

import { z } from 'zod';
import axios, { type AxiosInstance } from 'axios';

// Zod schemas for type safety and validation
const GitLabAgentConfigSchema = z.object({
  name: z.string().min(1).max(63).regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/),
  projectPath: z.string().min(1),
  gitlabUrl: z.string().url().min(1),
  token: z.string().min(1),
});

const GitLabAgentResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  project_id: z.number(),
  created_at: z.string(),
  created_by_user_id: z.number().nullable(),
});

const GitLabAgentTokenResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  token: z.string(),
  created_at: z.string(),
  created_by_user_id: z.number().nullable(),
  last_used_at: z.string().nullable(),
});

export type GitLabAgentConfig = z.infer<typeof GitLabAgentConfigSchema>;
export type GitLabAgentResponse = z.infer<typeof GitLabAgentResponseSchema>;
export type GitLabAgentTokenResponse = z.infer<typeof GitLabAgentTokenResponseSchema>;

export interface RegisterAgentResult {
  agentId: number;
  agentName: string;
  token: string;
  tokenId: number;
  projectId: number;
}

export interface AgentInfo {
  id: number;
  name: string;
  projectId: number;
  createdAt: string;
}

/**
 * GitLab Kubernetes Agent Service
 * Provides CRUD operations for GitLab agents
 */
export class GitLabAgentService {
  private client: AxiosInstance;
  private config: GitLabAgentConfig;

  constructor(config: GitLabAgentConfig) {
    // Validate config with Zod
    this.config = GitLabAgentConfigSchema.parse(config);

    // Create axios client
    this.client = axios.create({
      baseURL: this.config.gitlabUrl,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Get project ID from project path
   */
  async getProjectId(): Promise<number> {
    const encodedPath = encodeURIComponent(this.config.projectPath);
    const response = await this.client.get(`/api/v4/projects/${encodedPath}`);
    return response.data.id;
  }

  /**
   * List all agents for a project
   */
  async listAgents(projectId?: number): Promise<AgentInfo[]> {
    const pid = projectId || await this.getProjectId();
    const response = await this.client.get(`/api/v4/projects/${pid}/cluster_agents`);
    return response.data.map((agent: unknown) => {
      const parsed = GitLabAgentResponseSchema.parse(agent);
      return {
        id: parsed.id,
        name: parsed.name,
        projectId: parsed.project_id,
        createdAt: parsed.created_at,
      };
    });
  }

  /**
   * Get agent by name
   */
  async getAgent(agentName?: string, projectId?: number): Promise<AgentInfo | null> {
    const name = agentName || this.config.name;
    const agents = await this.listAgents(projectId);
    return agents.find(a => a.name === name) || null;
  }

  /**
   * Create a new agent (CREATE operation)
   */
  async createAgent(agentName?: string): Promise<AgentInfo> {
    const name = agentName || this.config.name;
    const projectId = await this.getProjectId();

    const response = await this.client.post(
      `/api/v4/projects/${projectId}/cluster_agents`,
      { name }
    );

    const parsed = GitLabAgentResponseSchema.parse(response.data);
    return {
      id: parsed.id,
      name: parsed.name,
      projectId: parsed.project_id,
      createdAt: parsed.created_at,
    };
  }

  /**
   * Register agent (CREATE if not exists, otherwise returns existing)
   */
  async registerAgent(agentName?: string): Promise<AgentInfo> {
    const name = agentName || this.config.name;
    const existing = await this.getAgent(name);

    if (existing) {
      return existing;
    }

    return await this.createAgent(name);
  }

  /**
   * Create agent token (CREATE operation)
   */
  async createToken(
    agentId: number,
    tokenName?: string,
    projectId?: number
  ): Promise<GitLabAgentTokenResponse> {
    const pid = projectId || await this.getProjectId();
    const name = tokenName || `${this.config.name}-token-${Date.now()}`;

    const response = await this.client.post(
      `/api/v4/projects/${pid}/cluster_agents/${agentId}/tokens`,
      {
        name,
        description: `Token for ${this.config.name} GitLab agent`,
      }
    );

    return GitLabAgentTokenResponseSchema.parse(response.data);
  }

  /**
   * List agent tokens (READ operation)
   */
  async listTokens(agentId: number, projectId?: number): Promise<GitLabAgentTokenResponse[]> {
    const pid = projectId || await this.getProjectId();
    const response = await this.client.get(
      `/api/v4/projects/${pid}/cluster_agents/${agentId}/tokens`
    );
    return response.data.map((token: unknown) =>
      GitLabAgentTokenResponseSchema.parse(token)
    );
  }

  /**
   * Delete agent token (DELETE operation)
   */
  async deleteToken(
    agentId: number,
    tokenId: number,
    projectId?: number
  ): Promise<void> {
    const pid = projectId || await this.getProjectId();
    await this.client.delete(
      `/api/v4/projects/${pid}/cluster_agents/${agentId}/tokens/${tokenId}`
    );
  }

  /**
   * Delete agent (DELETE operation)
   */
  async deleteAgent(agentId: number, projectId?: number): Promise<void> {
    const pid = projectId || await this.getProjectId();
    await this.client.delete(
      `/api/v4/projects/${pid}/cluster_agents/${agentId}`
    );
  }

  /**
   * Register agent and create token (full registration flow)
   */
  async registerAgentWithToken(agentName?: string): Promise<RegisterAgentResult> {
    const agent = await this.registerAgent(agentName);
    const token = await this.createToken(agent.id);
    const projectId = await this.getProjectId();

    return {
      agentId: agent.id,
      agentName: agent.name,
      token: token.token,
      tokenId: token.id,
      projectId,
    };
  }
}

