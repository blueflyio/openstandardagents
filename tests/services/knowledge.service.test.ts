/**
 * Knowledge Service Tests
 * Test knowledge indexing and querying functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  KnowledgeService,
  SimpleEmbeddingProvider,
  type KnowledgeIndex,
} from '../../src/services/knowledge.service';

describe('KnowledgeService', () => {
  let knowledgeService: KnowledgeService;
  let testDir: string;

  beforeEach(async () => {
    knowledgeService = new KnowledgeService();
    // Create temp directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ossa-knowledge-test-'));
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('indexKnowledge', () => {
    it('should index markdown files in directory', async () => {
      // Create test files
      await fs.writeFile(
        path.join(testDir, 'doc1.md'),
        '# Document 1\n\nThis is a test document about agents.'
      );
      await fs.writeFile(
        path.join(testDir, 'doc2.md'),
        '# Document 2\n\nThis document covers OSSA manifests.'
      );

      const index = await knowledgeService.indexKnowledge(testDir, 'test-agent');

      expect(index.agentName).toBe('test-agent');
      expect(index.documents).toHaveLength(2);
      expect(index.metadata.totalDocuments).toBe(2);
      expect(index.documents[0].embedding).toBeDefined();
      expect(index.documents[0].metadata.fileName).toMatch(/doc[12]\.md/);
    });

    it('should index text files', async () => {
      await fs.writeFile(
        path.join(testDir, 'notes.txt'),
        'Important notes about the system.'
      );

      const index = await knowledgeService.indexKnowledge(testDir, 'test-agent');

      expect(index.documents).toHaveLength(1);
      expect(index.documents[0].metadata.fileName).toBe('notes.txt');
      expect(index.documents[0].metadata.fileType).toBe('.txt');
    });

    it('should save index to knowledge.json', async () => {
      await fs.writeFile(path.join(testDir, 'doc.md'), '# Test');

      await knowledgeService.indexKnowledge(testDir, 'test-agent');

      const indexPath = path.join(testDir, 'knowledge.json');
      const exists = await fs
        .access(indexPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(content);
      expect(index.version).toBe('1.0.0');
      expect(index.agentName).toBe('test-agent');
    });

    it('should support custom output path', async () => {
      await fs.writeFile(path.join(testDir, 'doc.md'), '# Test');
      const customPath = path.join(testDir, 'custom-index.json');

      await knowledgeService.indexKnowledge(testDir, 'test-agent', {
        outputPath: customPath,
      });

      const exists = await fs
        .access(customPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should support incremental indexing', async () => {
      // Create initial file
      await fs.writeFile(path.join(testDir, 'doc1.md'), 'Original content');
      const index1 = await knowledgeService.indexKnowledge(testDir, 'test-agent');
      const originalHash = index1.documents[0].metadata.hash;

      // Add new file
      await fs.writeFile(path.join(testDir, 'doc2.md'), 'New content');
      const index2 = await knowledgeService.indexKnowledge(
        testDir,
        'test-agent',
        { incremental: true }
      );

      expect(index2.documents).toHaveLength(2);
      // Original file hash should be unchanged
      const doc1 = index2.documents.find((d) => d.metadata.fileName === 'doc1.md');
      expect(doc1?.metadata.hash).toBe(originalHash);
    });

    it('should calculate total size correctly', async () => {
      const content1 = 'A'.repeat(100);
      const content2 = 'B'.repeat(200);
      await fs.writeFile(path.join(testDir, 'doc1.md'), content1);
      await fs.writeFile(path.join(testDir, 'doc2.md'), content2);

      const index = await knowledgeService.indexKnowledge(testDir, 'test-agent');

      expect(index.metadata.totalSize).toBe(300);
    });

    it('should throw error for non-directory path', async () => {
      const filePath = path.join(testDir, 'file.txt');
      await fs.writeFile(filePath, 'test');

      await expect(
        knowledgeService.indexKnowledge(filePath, 'test-agent')
      ).rejects.toThrow('not a directory');
    });

    it('should throw error for non-existent path', async () => {
      const badPath = path.join(testDir, 'non-existent');

      await expect(
        knowledgeService.indexKnowledge(badPath, 'test-agent')
      ).rejects.toThrow();
    });
  });

  describe('query', () => {
    let indexPath: string;

    beforeEach(async () => {
      // Create test knowledge base
      await fs.writeFile(
        path.join(testDir, 'agents.md'),
        '# AI Agents\n\nAgents are autonomous software systems that can perform tasks.'
      );
      await fs.writeFile(
        path.join(testDir, 'ossa.md'),
        '# OSSA Standard\n\nOSSA is the OpenAPI for agents, providing standardized manifests.'
      );
      await fs.writeFile(
        path.join(testDir, 'deployment.md'),
        '# Deployment\n\nDeploy agents to Kubernetes using kubectl and OSSA manifests.'
      );

      const index = await knowledgeService.indexKnowledge(testDir, 'test-agent');
      indexPath = index.metadata.indexPath;
    });

    it('should find relevant documents', async () => {
      const results = await knowledgeService.query(indexPath, 'agents');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.metadata.fileName).toMatch(/\.md$/);
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].score).toBeLessThanOrEqual(1);
    });

    it('should return results sorted by score', async () => {
      const results = await knowledgeService.query(indexPath, 'OSSA manifests');

      expect(results.length).toBeGreaterThan(1);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should respect limit option', async () => {
      const results = await knowledgeService.query(indexPath, 'agents', {
        limit: 1,
      });

      expect(results).toHaveLength(1);
    });

    it('should respect threshold option', async () => {
      const results = await knowledgeService.query(indexPath, 'test query', {
        threshold: 0.9,
      });

      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0.9);
      }
    });

    it('should include excerpts when requested', async () => {
      const results = await knowledgeService.query(indexPath, 'agents', {
        includeExcerpts: true,
        limit: 1,
      });

      expect(results[0].excerpt).toBeDefined();
      expect(typeof results[0].excerpt).toBe('string');
    });

    it('should not include excerpts when not requested', async () => {
      const results = await knowledgeService.query(indexPath, 'agents', {
        includeExcerpts: false,
        limit: 1,
      });

      expect(results[0].excerpt).toBeUndefined();
    });

    it('should handle empty results gracefully', async () => {
      const results = await knowledgeService.query(
        indexPath,
        'nonexistent topic',
        {
          threshold: 0.99,
        }
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return index statistics', async () => {
      await fs.writeFile(path.join(testDir, 'doc1.md'), '# Test 1');
      await fs.writeFile(path.join(testDir, 'doc2.md'), '# Test 2');
      const index = await knowledgeService.indexKnowledge(testDir, 'test-agent');

      const stats = await knowledgeService.getStats(index.metadata.indexPath);

      expect(stats.agentName).toBe('test-agent');
      expect(stats.totalDocuments).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.lastIndexed).toBeInstanceOf(Date);
    });
  });
});

describe('SimpleEmbeddingProvider', () => {
  let provider: SimpleEmbeddingProvider;

  beforeEach(() => {
    provider = new SimpleEmbeddingProvider();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding vector', async () => {
      const embedding = await provider.generateEmbedding('test text');

      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(128);
      expect(embedding.every((v) => typeof v === 'number')).toBe(true);
    });

    it('should generate different embeddings for different text', async () => {
      const embedding1 = await provider.generateEmbedding('text one');
      const embedding2 = await provider.generateEmbedding('text two');

      expect(embedding1).not.toEqual(embedding2);
    });

    it('should generate same embedding for same text', async () => {
      const embedding1 = await provider.generateEmbedding('same text');
      const embedding2 = await provider.generateEmbedding('same text');

      expect(embedding1).toEqual(embedding2);
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity', () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];

      const similarity = provider.cosineSimilarity(a, b);

      expect(similarity).toBe(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];

      const similarity = provider.cosineSimilarity(a, b);

      expect(similarity).toBe(0);
    });

    it('should return value between -1 and 1', async () => {
      const embedding1 = await provider.generateEmbedding('text one');
      const embedding2 = await provider.generateEmbedding('text two');

      const similarity = provider.cosineSimilarity(embedding1, embedding2);

      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should throw error for vectors of different dimensions', () => {
      const a = [1, 2, 3];
      const b = [1, 2];

      expect(() => provider.cosineSimilarity(a, b)).toThrow(
        'must have same dimensions'
      );
    });
  });
});
