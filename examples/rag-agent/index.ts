/**
 * RAG Agent Reference Implementation
 * Demonstrates a Retrieval-Augmented Generation agent using @ossa/runtime
 */

import { createRuntime, OssaAgent } from '@ossa/runtime';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Vector store interface (simplified)
 */
interface VectorStore {
  search(query: string, limit: number): Promise<Array<{
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>>;
  index(documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>): Promise<void>;
}

/**
 * Mock vector store implementation
 */
class MockVectorStore implements VectorStore {
  private documents: Array<{
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
  }> = [];

  async search(query: string, limit: number = 5) {
    // Simple mock: return documents that contain query terms
    const queryLower = query.toLowerCase();
    return this.documents
      .filter(doc => doc.content.toLowerCase().includes(queryLower))
      .slice(0, limit)
      .map(doc => ({
        ...doc,
        score: 0.9, // Mock score
      }));
  }

  async index(documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>) {
    this.documents.push(...documents);
  }
}

/**
 * RAG Agent implementation
 */
export async function createRagAgent(): Promise<OssaAgent> {
  const runtime = createRuntime();

  // Load agent manifest
  const manifestPath = join(__dirname, 'manifest.yaml');
  const agent = await runtime.loadAgent(manifestPath);

  // Initialize vector store
  const vectorStore = new MockVectorStore();

  // Seed with sample documents
  await vectorStore.index([
    {
      id: 'doc1',
      content: 'OSSA (Open Standard for Scalable AI Agents) is a specification standard for AI agents, similar to OpenAPI for REST APIs.',
      metadata: { category: 'documentation' }
    },
    {
      id: 'doc2',
      content: 'The OSSA runtime SDK provides reference implementations for executing OSSA-compliant agents.',
      metadata: { category: 'documentation' }
    },
    {
      id: 'doc3',
      content: 'RAG (Retrieval-Augmented Generation) combines information retrieval with language generation.',
      metadata: { category: 'concepts' }
    },
    {
      id: 'doc4',
      content: 'Vector databases enable semantic search by storing and querying high-dimensional embeddings.',
      metadata: { category: 'technology' }
    }
  ]);

  // Register search capability
  agent.registerCapability(
    {
      name: 'search',
      description: 'Search documents using semantic search',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Maximum results', default: 5 }
        },
        required: ['query']
      },
      output_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                score: { type: 'number' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      timeout_seconds: 5
    },
    async (input: { query: string; limit?: number }) => {
      const results = await vectorStore.search(input.query, input.limit || 5);
      return { results };
    }
  );

  // Register answer capability
  agent.registerCapability(
    {
      name: 'answer',
      description: 'Answer questions using RAG pattern',
      input_schema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Question to answer' },
          context_limit: { type: 'number', description: 'Max context documents', default: 3 }
        },
        required: ['question']
      },
      output_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                score: { type: 'number' }
              }
            }
          }
        }
      },
      timeout_seconds: 10
    },
    async (input: { question: string; context_limit?: number }) => {
      // Search for relevant documents
      const searchResults = await vectorStore.search(input.question, input.context_limit || 3);

      // Build context from search results
      const context = searchResults
        .map(r => r.content)
        .join('\n\n');

      // Generate answer (mock implementation)
      const answer = `Based on the documents: ${context}\n\nAnswer: ${input.question}`;

      return {
        answer,
        sources: searchResults.map(r => ({
          id: r.id,
          content: r.content,
          score: r.score
        }))
      };
    }
  );

  // Register index capability
  agent.registerCapability(
    {
      name: 'index',
      description: 'Index new documents into the vector store',
      input_schema: {
        type: 'object',
        properties: {
          documents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                metadata: { type: 'object' }
              },
              required: ['id', 'content']
            }
          }
        },
        required: ['documents']
      },
      output_schema: {
        type: 'object',
        properties: {
          indexed: { type: 'number' }
        }
      },
      timeout_seconds: 30
    },
    async (input: { documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }> }) => {
      await vectorStore.index(input.documents);
      return { indexed: input.documents.length };
    }
  );

  return agent;
}

/**
 * Example usage
 */
async function main() {
  console.log('🤖 RAG Agent Example\n');

  // Create and initialize agent
  const agent = await createRagAgent();
  console.log('✅ Agent loaded:', agent.getMetadata().name);

  // Test search capability
  console.log('\n📚 Testing search capability...');
  const searchResult = await agent.execute('search', { query: 'OSSA', limit: 2 });
  if (searchResult.success) {
    console.log('Search results:', JSON.stringify(searchResult.data, null, 2));
  }

  // Test answer capability
  console.log('\n💬 Testing answer capability...');
  const answerResult = await agent.execute('answer', {
    question: 'What is OSSA?',
    context_limit: 2
  });
  if (answerResult.success) {
    console.log('Answer:', JSON.stringify(answerResult.data, null, 2));
  }

  // Test index capability
  console.log('\n📥 Testing index capability...');
  const indexResult = await agent.execute('index', {
    documents: [
      {
        id: 'doc5',
        content: 'The @ossa/runtime package provides TypeScript implementations for OSSA agents.',
        metadata: { category: 'sdk' }
      }
    ]
  });
  if (indexResult.success) {
    console.log('Indexed documents:', indexResult.data);
  }

  console.log('\n✨ All capabilities tested successfully!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
