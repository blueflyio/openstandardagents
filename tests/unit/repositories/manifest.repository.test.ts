/**
 * ManifestRepository Unit Tests
 * Test manifest loading and saving for YAML/JSON files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ManifestRepository } from '../../../src/repositories/manifest.repository.js';
import type { OssaAgent } from '../../../src/types/index.js';

describe('ManifestRepository', () => {
  let repository: ManifestRepository;
  let tempDir: string;

  beforeEach(() => {
    repository = new ManifestRepository();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('load()', () => {
    it('should load JSON manifest', async () => {
      const manifestPath = path.join(tempDir, 'test.json');
      const manifest = {
        ossaVersion: '1.0',
        agent: {
          id: 'test-agent',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          runtime: { type: 'docker' },
          capabilities: [],
        },
      };

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      const loaded = await repository.load(manifestPath);

      expect(loaded).toEqual(manifest);
    });

    it('should load YAML manifest (.yaml extension)', async () => {
      const manifestPath = path.join(tempDir, 'test.yaml');
      const yamlContent = `
ossaVersion: "1.0"
agent:
  id: test-agent
  name: Test
  version: 1.0.0
  role: chat
  runtime:
    type: docker
  capabilities: []
`;

      fs.writeFileSync(manifestPath, yamlContent);

      const loaded = await repository.load(manifestPath);

      expect(loaded).toBeDefined();
      expect((loaded as any).ossaVersion).toBe('1.0');
      expect((loaded as any).agent.id).toBe('test-agent');
    });

    it('should load YAML manifest (.yml extension)', async () => {
      const manifestPath = path.join(tempDir, 'test.yml');
      const yamlContent = `
ossaVersion: "1.0"
agent:
  id: test-agent
  name: Test
  version: 1.0.0
  role: chat
  runtime:
    type: docker
  capabilities: []
`;

      fs.writeFileSync(manifestPath, yamlContent);

      const loaded = await repository.load(manifestPath);

      expect(loaded).toBeDefined();
      expect((loaded as any).ossaVersion).toBe('1.0');
    });

    it('should throw error if file does not exist', async () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.yaml');

      await expect(repository.load(nonExistentPath)).rejects.toThrow(
        'Manifest file not found'
      );
    });

    it('should throw error for unsupported file format', async () => {
      const txtPath = path.join(tempDir, 'test.txt');
      fs.writeFileSync(txtPath, 'some content');

      await expect(repository.load(txtPath)).rejects.toThrow(
        'Unsupported file format'
      );
    });

    it('should throw error for invalid JSON', async () => {
      const jsonPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(jsonPath, '{ invalid json }');

      await expect(repository.load(jsonPath)).rejects.toThrow(
        'Failed to parse manifest file'
      );
    });

    it('should throw error for invalid YAML', async () => {
      const yamlPath = path.join(tempDir, 'invalid.yaml');
      fs.writeFileSync(yamlPath, 'invalid: yaml: content: [');

      await expect(repository.load(yamlPath)).rejects.toThrow(
        'Failed to parse manifest file'
      );
    });
  });

  describe('save()', () => {
    it('should save manifest as JSON', async () => {
      const manifestPath = path.join(tempDir, 'output.json');
      const manifest: any = {
        ossaVersion: '1.0',
        agent: {
          id: 'test-agent',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          runtime: { type: 'docker' },
          capabilities: [
            {
              name: 'test',
              description: 'Test capability',
              input_schema: { type: 'object' },
              output_schema: { type: 'object' },
            },
          ],
        },
      };

      await repository.save(manifestPath, manifest);

      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = fs.readFileSync(manifestPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(manifest);
    });

    it('should save manifest as YAML', async () => {
      const manifestPath = path.join(tempDir, 'output.yaml');
      const manifest: any = {
        ossaVersion: '1.0',
        agent: {
          id: 'test-agent',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          runtime: { type: 'docker' },
          capabilities: [
            {
              name: 'test',
              description: 'Test capability',
              input_schema: { type: 'object' },
              output_schema: { type: 'object' },
            },
          ],
        },
      };

      await repository.save(manifestPath, manifest);

      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = fs.readFileSync(manifestPath, 'utf-8');

      expect(content).toContain('ossaVersion');
      expect(content).toContain('test-agent');
    });

    it('should create directory if it does not exist', async () => {
      const nestedPath = path.join(tempDir, 'nested', 'deep', 'output.json');
      const manifest: any = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          runtime: { type: 'docker' },
          capabilities: [
            {
              name: 'test',
              description: 'Test',
              input_schema: { type: 'object' },
              output_schema: { type: 'object' },
            },
          ],
        },
      };

      await repository.save(nestedPath, manifest);

      expect(fs.existsSync(nestedPath)).toBe(true);
    });

    it('should throw error for unsupported save format', async () => {
      const txtPath = path.join(tempDir, 'output.txt');
      const manifest: any = {
        ossaVersion: '1.0',
        agent: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          role: 'chat',
          runtime: { type: 'docker' },
          capabilities: [],
        },
      };

      await expect(repository.save(txtPath, manifest)).rejects.toThrow(
        'Unsupported file format'
      );
    });
  });

  describe('exists()', () => {
    it('should return true for existing file', () => {
      const filePath = path.join(tempDir, 'exists.txt');
      fs.writeFileSync(filePath, 'content');

      expect(repository.exists(filePath)).toBe(true);
    });

    it('should return false for non-existent file', () => {
      const filePath = path.join(tempDir, 'does-not-exist.txt');

      expect(repository.exists(filePath)).toBe(false);
    });
  });
});
