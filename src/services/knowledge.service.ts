/**
 * Knowledge Service
 * Manages knowledge base indexing and querying for OSSA agents
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles knowledge operations
 * - Dependency Injection: Uses constructor injection
 * - Open/Closed: Extensible for different embedding providers
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';

export interface KnowledgeDocument {
  id: string;
  filePath: string;
  content: string;
  embedding?: number[];
  metadata: {
    fileName: string;
    fileType: string;
    size: number;
    lastModified: Date;
    hash: string;
  };
}

export interface KnowledgeIndex {
  version: string;
  agentName: string;
  documents: KnowledgeDocument[];
  metadata: {
    totalDocuments: number;
    totalSize: number;
    lastIndexed: Date;
    indexPath: string;
  };
}

export interface SearchResult {
  document: KnowledgeDocument;
  score: number;
  excerpt?: string;
}

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  cosineSimilarity(a: number[], b: number[]): number;
}

/**
 * Simple embedding provider using character-based hashing
 * In production, replace with OpenAI, Anthropic, or local models
 */
export class SimpleEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions = 128;

  async generateEmbedding(text: string): Promise<number[]> {
    // Simple hashing-based embedding for demonstration
    // In production, use proper embeddings (OpenAI, Anthropic, etc.)
    const hash = crypto.createHash('sha256').update(text).digest();
    const embedding: number[] = [];
    
    for (let i = 0; i < this.dimensions; i++) {
      embedding.push((hash[i % hash.length] / 255) * 2 - 1);
    }
    
    return embedding;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export class KnowledgeService {
  private embeddingProvider: EmbeddingProvider;

  constructor(embeddingProvider?: EmbeddingProvider) {
    this.embeddingProvider = embeddingProvider || new SimpleEmbeddingProvider();
  }

  /**
   * Index knowledge base directory
   */
  async indexKnowledge(
    knowledgePath: string,
    agentName: string,
    options: {
      incremental?: boolean;
      outputPath?: string;
    } = {}
  ): Promise<KnowledgeIndex> {
    // Validate path exists
    const stats = await fs.stat(knowledgePath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${knowledgePath}`);
    }

    // Load existing index for incremental updates
    let existingIndex: KnowledgeIndex | null = null;
    const outputPath = options.outputPath || path.join(knowledgePath, 'knowledge.json');
    
    if (options.incremental) {
      try {
        const indexContent = await fs.readFile(outputPath, 'utf-8');
        existingIndex = JSON.parse(indexContent);
      } catch {
        // No existing index, create new one
      }
    }

    // Find all markdown and text files
    const files = await glob('**/*.{md,txt}', {
      cwd: knowledgePath,
      absolute: false,
      nodir: true,
    });

    const documents: KnowledgeDocument[] = [];
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(knowledgePath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const fileStats = await fs.stat(filePath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      // Check if document changed (for incremental updates)
      const existingDoc = existingIndex?.documents.find(
        (d) => d.filePath === filePath
      );
      
      let embedding: number[] | undefined;
      if (existingDoc && existingDoc.metadata.hash === hash) {
        // Document unchanged, reuse existing embedding
        embedding = existingDoc.embedding;
      } else {
        // Generate new embedding
        embedding = await this.embeddingProvider.generateEmbedding(content);
      }

      documents.push({
        id: hash.substring(0, 16),
        filePath,
        content,
        embedding,
        metadata: {
          fileName: path.basename(file),
          fileType: path.extname(file),
          size: fileStats.size,
          lastModified: fileStats.mtime,
          hash,
        },
      });

      totalSize += fileStats.size;
    }

    const index: KnowledgeIndex = {
      version: '1.0.0',
      agentName,
      documents,
      metadata: {
        totalDocuments: documents.length,
        totalSize,
        lastIndexed: new Date(),
        indexPath: outputPath,
      },
    };

    // Save index
    await fs.writeFile(outputPath, JSON.stringify(index, null, 2), 'utf-8');

    return index;
  }

  /**
   * Load knowledge index
   */
  async loadIndex(indexPath: string): Promise<KnowledgeIndex> {
    const content = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Query knowledge base
   */
  async query(
    indexPath: string,
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      includeExcerpts?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    const index = await this.loadIndex(indexPath);
    const queryEmbedding = await this.embeddingProvider.generateEmbedding(query);

    const results: SearchResult[] = [];

    for (const doc of index.documents) {
      if (!doc.embedding) continue;

      const score = this.embeddingProvider.cosineSimilarity(
        queryEmbedding,
        doc.embedding
      );

      // Apply threshold
      if (options.threshold && score < options.threshold) {
        continue;
      }

      // Generate excerpt if requested
      let excerpt: string | undefined;
      if (options.includeExcerpts) {
        excerpt = this.generateExcerpt(doc.content, query);
      }

      results.push({
        document: doc,
        score,
        excerpt,
      });
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    const limit = options.limit || 10;
    return results.slice(0, limit);
  }

  /**
   * Generate excerpt around query terms
   */
  private generateExcerpt(content: string, query: string, contextLength = 150): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Find first occurrence
    const index = contentLower.indexOf(queryLower);
    
    if (index === -1) {
      // No exact match, return start of content
      return content.substring(0, contextLength) + '...';
    }

    // Get context around match
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + queryLower.length + contextLength / 2);
    
    let excerpt = content.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  }

  /**
   * Get index statistics
   */
  async getStats(indexPath: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    lastIndexed: Date;
    agentName: string;
  }> {
    const index = await this.loadIndex(indexPath);
    return {
      totalDocuments: index.metadata.totalDocuments,
      totalSize: index.metadata.totalSize,
      lastIndexed: new Date(index.metadata.lastIndexed),
      agentName: index.agentName,
    };
  }
}
