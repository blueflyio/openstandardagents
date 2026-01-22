/**
 * kagent.dev Runtime Adapter
 * Executes OSSA agents via kagent.dev API
 */

import type { OssaAgent } from '../../types/index.js';
import type {
  KAgentCRD,
  KAgentDeploymentOptions,
  KAgentDeploymentResult,
} from './types.js';
import { KAgentCRDGenerator } from './crd-generator.js';

export interface KAgentRuntimeConfig {
  endpoint?: string;
  apiKey?: string;
  namespace?: string;
}

export class KAgentRuntimeAdapter {
  private config: KAgentRuntimeConfig;
  private crdGenerator: KAgentCRDGenerator;

  constructor(config: KAgentRuntimeConfig = {}) {
    this.config = {
      endpoint:
        config.endpoint ||
        process.env.KAGENT_ENDPOINT ||
        'https://api.kagent.dev',
      apiKey: config.apiKey || process.env.KAGENT_API_KEY,
      namespace: config.namespace || 'default',
    };
    this.crdGenerator = new KAgentCRDGenerator();
  }

  /**
   * Deploy agent to kagent.dev
   */
  async deploy(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Promise<KAgentDeploymentResult> {
    try {
      // Generate CRD
      const crd = this.crdGenerator.generate(manifest, {
        namespace: options.namespace || this.config.namespace,
        ...options,
      });

      // Deploy via kagent API
      const result = (await this.callKAgentAPI(
        'POST',
        '/api/v1/agents',
        crd
      )) as {
        id?: string;
      };

      return {
        success: true,
        agentId: result.id,
        namespace: crd.metadata.namespace,
        crd,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Scale agent
   */
  async scale(agentId: string, replicas: number): Promise<void> {
    await this.callKAgentAPI('PATCH', `/api/v1/agents/${agentId}`, {
      spec: {
        resources: {
          replicas,
        },
      },
    });
  }

  /**
   * Update agent
   */
  async update(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Promise<KAgentDeploymentResult> {
    const crd = this.crdGenerator.generate(manifest, options);
    const agentId = manifest.metadata?.name;

    if (!agentId) {
      return {
        success: false,
        error: 'Agent name is required for update',
      };
    }

    try {
      await this.callKAgentAPI('PUT', `/api/v1/agents/${agentId}`, crd);

      return {
        success: true,
        agentId,
        namespace: crd.metadata.namespace,
        crd,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete agent
   */
  async delete(agentId: string): Promise<void> {
    await this.callKAgentAPI('DELETE', `/api/v1/agents/${agentId}`);
  }

  /**
   * Get agent status
   */
  async getStatus(agentId: string): Promise<{
    status: string;
    replicas: number;
    ready: number;
  }> {
    const result = (await this.callKAgentAPI(
      'GET',
      `/api/v1/agents/${agentId}`
    )) as {
      status?: string;
      spec?: {
        resources?: {
          replicas?: number;
        };
      };
      readyReplicas?: number;
    };
    return {
      status: result.status || 'unknown',
      replicas: result.spec?.resources?.replicas || 1,
      ready: result.readyReplicas || 0,
    };
  }

  /**
   * Call kagent.dev API
   */
  private async callKAgentAPI(
    method: string,
    path: string,
    body?: unknown
  ): Promise<unknown> {
    if (!this.config.apiKey) {
      throw new Error('KAGENT_API_KEY is required');
    }

    const url = `${this.config.endpoint}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`kagent API error: ${response.status} ${error}`);
    }

    return response.json();
  }
}
