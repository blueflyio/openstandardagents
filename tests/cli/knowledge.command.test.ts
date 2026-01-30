/**
 * Knowledge CLI Command Tests
 * Test CLI interface for knowledge indexing and querying
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('ossa knowledge CLI', () => {
  let testDir: string;
  let ossaBin: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ossa-cli-test-'));
    // Assume ossa binary is built
    ossaBin = path.resolve(__dirname, '../../dist/src/cli/index.js');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('ossa knowledge index', () => {
    it('should index knowledge directory', async () => {
      // Create test files
      await fs.writeFile(
        path.join(testDir, 'doc1.md'),
        '# Test Document\n\nTest content.'
      );

      const { stdout } = await execAsync(
        `node ${ossaBin} knowledge index ${testDir} --agent test-agent`
      );

      expect(stdout).toContain('indexed successfully');

      // Verify index file was created
      const indexPath = path.join(testDir, 'knowledge.json');
      const exists = await fs
        .access(indexPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should support JSON output', async () => {
      await fs.writeFile(path.join(testDir, 'doc.md'), '# Test');

      const { stdout } = await execAsync(
        `node ${ossaBin} knowledge index ${testDir} --output json`
      );

      const output = JSON.parse(stdout);
      expect(output.success).toBe(true);
      expect(output.index).toBeDefined();
      expect(output.index.totalDocuments).toBeGreaterThan(0);
    });

    it('should support custom output path', async () => {
      await fs.writeFile(path.join(testDir, 'doc.md'), '# Test');
      const customPath = path.join(testDir, 'custom.json');

      await execAsync(
        `node ${ossaBin} knowledge index ${testDir} --output ${customPath}`
      );

      const exists = await fs
        .access(customPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should support incremental indexing', async () => {
      await fs.writeFile(path.join(testDir, 'doc.md'), '# Test');

      // Initial index
      await execAsync(`node ${ossaBin} knowledge index ${testDir}`);

      // Incremental update
      await fs.writeFile(path.join(testDir, 'doc2.md'), '# Test 2');
      const { stdout } = await execAsync(
        `node ${ossaBin} knowledge index ${testDir} --incremental`
      );

      expect(stdout).toContain('Incremental');
    });

    it('should handle errors gracefully', async () => {
      const badPath = path.join(testDir, 'non-existent');

      try {
        await execAsync(`node ${ossaBin} knowledge index ${badPath}`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBeGreaterThan(0);
      }
    });
  });

  describe('ossa knowledge query', () => {
    beforeEach(async () => {
      // Create and index test knowledge base
      await fs.writeFile(
        path.join(testDir, 'agents.md'),
        '# Agents\n\nInformation about AI agents.'
      );
      await fs.writeFile(
        path.join(testDir, 'ossa.md'),
        '# OSSA\n\nThe OSSA standard for agents.'
      );

      await execAsync(
        `node ${ossaBin} knowledge index ${testDir} --agent test-agent`
      );
    });

    it('should query knowledge base', async () => {
      const { stdout } = await execAsync(
        `node ${ossaBin} knowledge query "agents" --knowledge ${testDir}`
      );

      expect(stdout).toContain('results');
      expect(stdout).toMatch(/agents\.md|ossa\.md/);
    });

    it('should support JSON output', async () => {
      const { stdout } = await execAsync(
        `node ${ossaBin} knowledge query "agents" --knowledge ${testDir} --output json`
      );

      const output = JSON.parse(stdout);
      expect(output.success).toBe(true);
      expect(output.results).toBeInstanceOf(Array);
      expect(output.totalResults).toBeGreaterThan(0);
    });

    it('should support limit option', async () => {
      const { stdout } = await execAsync(
        `node ${ossaBin} knowledge query "agents" --knowledge ${testDir} --limit 1 --output json`
      );

      const output = JSON.parse(stdout);
      expect(output.results.length).toBeLessThanOrEqual(1);
    });

    it('should support threshold option', async () => {
      const { stdout } = await execAsync(
        `node ${ossaBin} knowledge query "test" --knowledge ${testDir} --threshold 0.9 --output json`
      );

      const output = JSON.parse(stdout);
      for (const result of output.results) {
        expect(result.score).toBeGreaterThanOrEqual(0.9);
      }
    });

    it('should handle no results gracefully', async () => {
      const { stdout } = await execAsync(
        `node ${ossaBin} knowledge query "nonexistent" --knowledge ${testDir} --threshold 0.99`
      );

      expect(stdout).toContain('No results');
    });

    it('should require index or knowledge option', async () => {
      try {
        await execAsync(`node ${ossaBin} knowledge query "test"`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBeGreaterThan(0);
      }
    });
  });
});
