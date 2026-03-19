import { AgentCard } from './types.js';

/**
 * GKG Matchmaker Discovery Provider
 * 
 * Replaces static registry discovery with semantic Contract Matchmaking via the Global Knowledge Graph.
 * Resolves agents by their IO contracts (emits/consumes) and Execution Economics.
 */
export class GkgMatchmaker {
  private gkgEndpoint: string;

  constructor(gkgEndpoint: string = 'https://gkg.blueflyagents.com/api') {
    this.gkgEndpoint = gkgEndpoint;
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
      id: raw.metadata.name,
      uri: `did:web:blueflyagents.com:agent:${raw.metadata.name}`,
      name: raw.metadata.name,
      description: raw.metadata.description,
      endpoints: raw.endpoints || {},
      capabilities: raw.spec.tools?.map((t: any) => t.name) || [],
      status: raw.metadata.status || 'active'
    };
  }
}
