import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ManifestRepository } from '../../../src/repositories/manifest.repository.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ManifestRepository', () => {
  let repo: ManifestRepository;
  let tempDir: string;

  beforeEach(() => {
    repo = new ManifestRepository();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('load', () => {
    it('should load YAML manifest', async () => {
      const file = path.join(tempDir, 'test.yaml');
      fs.writeFileSync(
        file,
        `
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: test
  version: 1.0.0
spec:
  role: assistant
`
      );
      const manifest = await repo.load(file);
      expect(manifest.metadata.name).toBe('test');
    });

    it('should load JSON manifest', async () => {
      const file = path.join(tempDir, 'test.json');
      const data = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' },
      };
      fs.writeFileSync(file, JSON.stringify(data));
      const manifest = await repo.load(file);
      expect(manifest.metadata.name).toBe('test');
    });

    it('should throw for missing file', async () => {
      await expect(repo.load('/nonexistent.yaml')).rejects.toThrow();
    });
  });

  describe('save', () => {
    it('should save as YAML', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' },
      };
      const file = path.join(tempDir, 'out.yaml');
      await repo.save(file, manifest);
      expect(fs.existsSync(file)).toBe(true);
    });

    it('should save as JSON', async () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' },
      };
      const file = path.join(tempDir, 'out.json');
      await repo.save(file, manifest);
      expect(fs.existsSync(file)).toBe(true);
      const loaded = JSON.parse(fs.readFileSync(file, 'utf-8'));
      expect(loaded.metadata.name).toBe('test');
    });
  });
});
