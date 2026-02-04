/**
 * IndexService Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IndexService } from '../../../src/services/registry/index.service.js';
import { mkdtemp, rm, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { OssaAgent } from '../../../src/types/index.js';

describe.skip('IndexService', () => {
  let indexService: IndexService;
  let testDir: string;
  let registryPath: string;

  beforeEach(async () => {
    indexService = new IndexService();
    testDir = await mkdtemp(join(tmpdir(), 'ossa-test-'));
    registryPath = join(testDir, 'registry');
    await mkdir(registryPath);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createTestManifest = (name: string, version: string): OssaAgent => ({
    apiVersion: 'ossa/v0.4.1',
    kind: 'Agent',
    metadata: {
      name,
      version,
      description: `Test agent ${name}`,
      role: 'chat',
      author: {
        name: 'Test Author',
        email: 'test@example.com',
      },
    },
    spec: {
      runtime: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      },
      capabilities: [
        {
          name: 'test',
          description: 'Test capability',
        },
      ],
      role: 'chat',
    },
  });

  it('should load empty index for new registry', async () => {
    const index = await indexService.loadIndex(registryPath);

    expect(index.version).toBe('1.0.0');
    expect(index.agents).toEqual([]);
  });

  it('should add agent to index', async () => {
    const manifest = createTestManifest('test-agent', '1.0.0');
    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    const agent = await indexService.addAgent(
      registryPath,
      manifest,
      bundleMetadata
    );

    expect(agent.id).toBe('test-agent');
    expect(agent.name).toBe('test-agent');
    expect(agent.version).toBe('1.0.0');
    expect(agent.role).toBe('chat');
    expect(agent.signature).toBe('abc123');

    const index = await indexService.loadIndex(registryPath);
    expect(index.agents).toHaveLength(1);
  });

  it('should update existing agent version', async () => {
    const manifest = createTestManifest('test-agent', '1.0.0');
    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest, bundleMetadata);

    // Update same version
    const updatedMetadata = {
      checksum: 'xyz789',
      size: 2048,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest, updatedMetadata);

    const index = await indexService.loadIndex(registryPath);
    expect(index.agents).toHaveLength(1);
    expect(index.agents[0].signature).toBe('xyz789');
  });

  it('should add multiple versions of same agent', async () => {
    const manifest1 = createTestManifest('test-agent', '1.0.0');
    const manifest2 = createTestManifest('test-agent', '1.1.0');
    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest1, bundleMetadata);
    await indexService.addAgent(registryPath, manifest2, bundleMetadata);

    const index = await indexService.loadIndex(registryPath);
    expect(index.agents).toHaveLength(2);
  });

  it('should remove agent by ID and version', async () => {
    const manifest = createTestManifest('test-agent', '1.0.0');
    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest, bundleMetadata);
    await indexService.removeAgent(registryPath, 'test-agent', '1.0.0');

    const index = await indexService.loadIndex(registryPath);
    expect(index.agents).toHaveLength(0);
  });

  it('should search by query', async () => {
    const manifest1 = createTestManifest('security-scanner', '1.0.0');
    const manifest2 = createTestManifest('code-reviewer', '1.0.0');
    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest1, bundleMetadata);
    await indexService.addAgent(registryPath, manifest2, bundleMetadata);

    const results = await indexService.search(registryPath, 'security');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('security-scanner');
  });

  it('should filter by role', async () => {
    const manifest1 = createTestManifest('chat-agent', '1.0.0');
    manifest1.spec!.role = 'chat';
    const manifest2 = createTestManifest('audit-agent', '1.0.0');
    manifest2.metadata!.role = 'audit';
    manifest2.spec!.role = 'audit';

    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest1, bundleMetadata);
    await indexService.addAgent(registryPath, manifest2, bundleMetadata);

    const results = await indexService.search(registryPath, undefined, {
      role: ['audit'],
    });

    expect(results).toHaveLength(1);
    expect(results[0].role).toBe('audit');
  });

  it('should get agent by ID', async () => {
    const manifest = createTestManifest('test-agent', '1.0.0');
    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest, bundleMetadata);

    const agent = await indexService.getAgent(registryPath, 'test-agent');

    expect(agent).toBeDefined();
    expect(agent?.name).toBe('test-agent');
  });

  it('should get latest version when multiple exist', async () => {
    const manifest1 = createTestManifest('test-agent', '1.0.0');
    const manifest2 = createTestManifest('test-agent', '1.1.0');
    const manifest3 = createTestManifest('test-agent', '1.0.5');
    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest1, bundleMetadata);
    await indexService.addAgent(registryPath, manifest2, bundleMetadata);
    await indexService.addAgent(registryPath, manifest3, bundleMetadata);

    const agent = await indexService.getAgent(registryPath, 'test-agent');

    expect(agent?.version).toBe('1.1.0');
  });

  it('should validate index', async () => {
    const manifest = createTestManifest('test-agent', '1.0.0');
    const bundleMetadata = {
      checksum: 'abc123',
      size: 1024,
      createdAt: new Date().toISOString(),
    };

    await indexService.addAgent(registryPath, manifest, bundleMetadata);
    const index = await indexService.loadIndex(registryPath);

    const isValid = indexService.validateIndex(index);

    expect(isValid).toBe(true);
  });
});
