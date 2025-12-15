/**
 * Qdrant Vector Database Service
 * Provides memory and context enhancement for OSSA agents
 */

// @ts-ignore - @qdrant/js-client-rest may not be installed in all environments
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorSearchResult {
  id: string | number;
  score: number;
  payload: Record<string, any>;
}

export interface AgentMemory {
  agent_name: string;
  interaction_type: string;
  content: string;
  metadata: Record<string, any>;
  timestamp: string;
  embedding?: number[];
}

export interface AgentContext {
  agent_name: string;
  project_id: string;
  issue_iid?: number;
  mr_iid?: number;
  relevant_memories: VectorSearchResult[];
  similar_cases: VectorSearchResult[];
}

/**
 * Qdrant Service for Agent Memory and Context
 * Provides vector search and storage for agent intelligence
 */
export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;
  private embeddingDimension: number;

  constructor(
    url: string = process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey?: string,
    collectionName: string = 'agent_memory'
  ) {
    this.client = new QdrantClient({
      url,
      apiKey: apiKey || process.env.QDRANT_API_KEY,
    });
    this.collectionName = collectionName;
    this.embeddingDimension = 1536; // OpenAI ada-002 / text-embedding-3-small
  }

  /**
   * Initialize collection if it doesn't exist
   */
  async initializeCollection(): Promise<void> {
    try {
      await this.client.getCollection(this.collectionName);
      console.log(`✅ Collection ${this.collectionName} exists`);
    } catch (error) {
      console.log(`Creating collection ${this.collectionName}...`);
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.embeddingDimension,
          distance: 'Cosine',
        },
      });
      console.log(`✅ Collection ${this.collectionName} created`);
    }
  }

  /**
   * Store agent interaction in vector DB
   */
  async storeMemory(memory: AgentMemory, embedding: number[]): Promise<string> {
    const id = `${memory.agent_name}-${Date.now()}`;

    await this.client.upsert(this.collectionName, {
      points: [
        {
          id,
          vector: embedding,
          payload: {
            agent_name: memory.agent_name,
            interaction_type: memory.interaction_type,
            content: memory.content,
            metadata: memory.metadata,
            timestamp: memory.timestamp,
          },
        },
      ],
    });

    return id;
  }

  /**
   * Search similar interactions for context
   */
  async searchSimilar(
    queryEmbedding: number[],
    agentName: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      filter: {
        must: [
          {
            key: 'agent_name',
            match: {
              value: agentName,
            },
          },
        ],
      },
      limit,
      with_payload: true,
    });

    return results.map((result: any) => ({
      id: result.id,
      score: result.score,
      payload: result.payload as Record<string, any>,
    }));
  }

  /**
   * Get agent context with relevant memories
   */
  async getAgentContext(
    agentName: string,
    queryEmbedding: number[],
    projectId: string,
    issueIid?: number,
    mrIid?: number
  ): Promise<AgentContext> {
    // Search for relevant memories
    const relevantMemories = await this.searchSimilar(
      queryEmbedding,
      agentName,
      10
    );

    // Search for similar cases (same issue/MR types)
    const similarCases = await this.searchSimilarCases(
      queryEmbedding,
      projectId,
      issueIid,
      mrIid
    );

    return {
      agent_name: agentName,
      project_id: projectId,
      issue_iid: issueIid,
      mr_iid: mrIid,
      relevant_memories: relevantMemories,
      similar_cases: similarCases,
    };
  }

  /**
   * Search for similar issues/MRs the agent has handled
   */
  private async searchSimilarCases(
    queryEmbedding: number[],
    projectId: string,
    issueIid?: number,
    mrIid?: number
  ): Promise<VectorSearchResult[]> {
    const filter: any = {
      must: [
        {
          key: 'metadata.project_id',
          match: {
            value: projectId,
          },
        },
      ],
    };

    if (issueIid) {
      filter.must.push({
        key: 'interaction_type',
        match: {
          value: 'issue_triage',
        },
      });
    }

    if (mrIid) {
      filter.must.push({
        key: 'interaction_type',
        match: {
          value: 'mr_review',
        },
      });
    }

    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      filter,
      limit: 5,
      with_payload: true,
    });

    return results.map((result: any) => ({
      id: result.id,
      score: result.score,
      payload: result.payload as Record<string, any>,
    }));
  }

  /**
   * Clean old memories (retention policy)
   */
  async cleanOldMemories(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.client.delete(this.collectionName, {
      filter: {
        must: [
          {
            key: 'timestamp',
            range: {
              lt: cutoffDate.toISOString(),
            },
          },
        ],
      },
    });

    return result.status === 'acknowledged' ? 1 : 0;
  }
}
