import { AgentCard } from './types.js';

/**
 * GKG Matchmaker Discovery Provider
 * 
 * Replaces static registry discovery with semantic Contract Matchmaking via the Global Knowledge Graph.
 * Resolves agents by their IO contracts (emits/consumes) and Execution Economics.
 */
export class GkgMatchmaker {
  private gkgEndpoint: string;

  /**
   * @param gkgEndpoint - GKG API base URL.
   *   Defaults to `OSSA_GKG_ENDPOINT` env var.
   *   Set this to your own GKG-compatible knowledge graph endpoint.
   */
  constructor(gkgEndpoint?: string) {
    this.gkgEndpoint =
      gkgEndpoint ??
      process.env.OSSA_GKG_ENDPOINT ??
      '';
    if (!this.gkgEndpoint) {
      throw new Error(
        'GkgMatchmaker requires a GKG endpoint. ' +
        'Pass it to the constructor or set the OSSA_GKG_ENDPOINT environment variable.'
      );
    }
  }

  /**
   * Discover agents that satisfy a specific IO contract and economics profile.
   */
  async discoverByContract(
    emitsSchema?: string,
    consumesSchema?: string,
    maxCostUsd?: number
  ): Promise<AgentCard[]> {
    const query = {
      type: 'agent',
      has_capability: true,
      filters: {
        ...(emitsSchema && { 'extensions.statemesh.emits.schema': emitsSchema }),
        ...(consumesSchema && { 'extensions.statemesh.consumes.schema': consumesSchema }),
        ...(maxCostUsd && { 'economics.max_cost_usd': { $lte: maxCostUsd } })
      }
    };

    try {
      const response = await fetch(`${this.gkgEndpoint}/search/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`GKG Semantic Search failed: ${response.statusText}`);
      }

      const results = await response.json();
      return results.map((r: any) => this.mapToAgentCard(r));
    } catch (e) {
      console.error('GKG Matchmaker discovery failed', e);
      return [];
    }
  }

  /**
   * Initiate a Lead Selection Market bid request for a task
   */
  async requestMarketBids(taskContext: any, requiredContextPacks: string[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.gkgEndpoint}/market/bids/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskContext, requiredContextPacks })
      });
      return await response.json();
    } catch (e) {
      console.error('Failed to request market bids', e);
      return [];
    }
  }

  private mapToAgentCard(raw: any): AgentCard {
    return {
      uri: raw.uri || (raw.metadata?.name ? `did:web:${raw.metadata.name}` : undefined),
      name: raw.metadata?.name || 'anonymous',
      version: raw.metadata?.version || '1.0.0',
      ossaVersion: raw.apiVersion || 'ossa/v0.5.1',
      gaid: raw.gaid,
      endpoints: raw.endpoints || {},
      transport: raw.transport || ['http'],
      authentication: raw.authentication || ['none'],
      encryption: raw.encryption || { tlsRequired: true, minTlsVersion: '1.3' },
      capabilities: raw.spec?.tools?.map((t: any) => t.name) || [],
      status: raw.metadata?.status || 'healthy',
      metadata: {
        description: raw.metadata?.description,
        author: raw.metadata?.author,
        ...(raw.metadata || {})
      }
    };
  }
}
