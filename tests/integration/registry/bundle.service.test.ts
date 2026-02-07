/**
 * BundleService Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BundleService } from '../../../src/services/registry/bundle.service.js';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { API_VERSION } from '../../../src/version.js';

describe.skip('BundleService', () => {
  let bundleService: BundleService;
  let testDir: string;
  let agentDir: string;

  beforeEach(async () => {
    bundleService = new BundleService();
    testDir = await mkdtemp(join(tmpdir(), 'ossa-test-'));
    agentDir = join(testDir, 'test-agent');
    await mkdir(agentDir);

    // Create test manifest
    const manifest = `apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
  description: Test agent for bundle service
  role: chat

spec:
  runtime:
    provider: anthropic
    model: claude-3-5-sonnet-20241022

  capabilities:
    - name: test
      description: Test capability
`;

    await writeFile(join(agentDir, 'agent.yaml'), manifest);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should create a bundle with valid metadata', async () => {
    const outputDir = join(testDir, 'bundles');
    const metadata = await bundleService.createBundle(agentDir, outputDir);

    expect(metadata.name).toBe('test-agent');
    expect(metadata.version).toBe('1.0.0');
    expect(metadata.checksum).toBeTruthy();
    expect(metadata.checksum.length).toBe(64); // SHA-256 hex length
    expect(metadata.size).toBeGreaterThan(0);
    expect(metadata.files).toContain('agent.yaml');
    expect(metadata.files).toContain('sbom.json');
  });

  it('should generate valid SBOM', async () => {
    const manifest = {
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
    };
    const files = ['agent.yaml', 'config.json'];

    const sbom = await bundleService.generateSBOM(manifest as any, files);

    expect(sbom.bomFormat).toBe('CycloneDX');
    expect(sbom.specVersion).toBe('1.4');
    expect(sbom.metadata.component.name).toBe('test-agent');
    expect(sbom.metadata.component.version).toBe('1.0.0');
    expect(sbom.components).toHaveLength(2);
  });

  it('should calculate correct checksum', async () => {
    const testFile = join(testDir, 'test.txt');
    await writeFile(testFile, 'test content');

    const checksum = await bundleService.calculateChecksum(testFile);

    expect(checksum).toBeTruthy();
    expect(checksum.length).toBe(64);
    // Known SHA-256 hash for "test content"
    expect(checksum).toBe(
      '6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72'
    );
  });

  it('should validate bundle structure', async () => {
    const outputDir = join(testDir, 'bundles');
    await bundleService.createBundle(agentDir, outputDir);

    const bundlePath = join(outputDir, 'test-agent-1.0.0.tar.gz');
    const isValid = await bundleService.validateBundle(bundlePath);

    expect(isValid).toBe(true);
  });

  it('should fail validation for invalid bundle', async () => {
    const invalidBundle = join(testDir, 'invalid.tar.gz');
    await writeFile(invalidBundle, 'invalid content');

    const isValid = await bundleService.validateBundle(invalidBundle);

    expect(isValid).toBe(false);
  });
});
