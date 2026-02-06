/**
 * OSSA Local Deployment Driver Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LocalDeploymentDriver } from '../../../src/deploy/local-driver.js';
import type { OssaAgent } from '../../../src/types/index.js';
import type { DeploymentConfig } from '../../../src/deploy/types.js';
import { API_VERSION } from '../../../src/version.js';

describe('LocalDeploymentDriver', () => {
  let driver: LocalDeploymentDriver;
  let mockManifest: OssaAgent;
  let mockConfig: DeploymentConfig;

  beforeEach(() => {
    driver = new LocalDeploymentDriver();
    mockManifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent',
      },
      spec: {
        role: 'assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
      },
    };
    mockConfig = {
      target: 'local',
      environment: 'dev',
      version: '1.0.0',
    };
  });

  describe('deploy', () => {
    it('should deploy agent locally', async () => {
      const result = await driver.deploy(mockManifest, mockConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('test-agent');
      expect(result.instanceId).toBeDefined();
      expect(result.endpoint).toContain('localhost');
    });

    it('should support dry-run mode', async () => {
      const dryRunConfig = { ...mockConfig, dryRun: true };
      const result = await driver.deploy(mockManifest, dryRunConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('DRY RUN');
    });

    it('should use custom port when specified', async () => {
      const configWithPort = { ...mockConfig, port: 8080 };
      const result = await driver.deploy(mockManifest, configWithPort);

      expect(result.success).toBe(true);
      expect(result.endpoint).toContain('8080');
    });

    it('should fail with invalid manifest', async () => {
      const invalidManifest = { ...mockManifest, metadata: undefined };

      await expect(
        driver.deploy(invalidManifest as OssaAgent, mockConfig)
      ).rejects.toThrow('missing metadata');
    });
  });

  describe('getStatus', () => {
    it('should get status of deployed instance', async () => {
      const deployResult = await driver.deploy(mockManifest, mockConfig);
      const instanceId = deployResult.instanceId!;

      const status = await driver.getStatus(instanceId);

      expect(status.id).toBe(instanceId);
      expect(status.name).toBe('test-agent');
      expect(status.version).toBe('1.0.0');
      expect(status.status).toBe('running');
    });

    it('should throw error for non-existent instance', async () => {
      await expect(driver.getStatus('non-existent')).rejects.toThrow(
        'not found'
      );
    });
  });

  describe('listInstances', () => {
    it('should list all running instances', async () => {
      await driver.deploy(mockManifest, mockConfig);
      await driver.deploy(mockManifest, {
        ...mockConfig,
        environment: 'staging',
      });

      const instances = await driver.listInstances();

      expect(instances.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no instances', async () => {
      const instances = await driver.listInstances();

      expect(Array.isArray(instances)).toBe(true);
    });
  });

  describe('stop', () => {
    it('should stop running instance', async () => {
      const deployResult = await driver.deploy(mockManifest, mockConfig);
      const instanceId = deployResult.instanceId!;

      await expect(driver.stop(instanceId)).resolves.not.toThrow();
    });

    it('should throw error for non-existent instance', async () => {
      await expect(driver.stop('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('rollback', () => {
    it('should rollback to previous version', async () => {
      const deployResult = await driver.deploy(mockManifest, mockConfig);
      const instanceId = deployResult.instanceId!;

      const result = await driver.rollback(instanceId, { toVersion: '0.9.0' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('0.9.0');
    });

    it('should rollback by steps', async () => {
      const deployResult = await driver.deploy(mockManifest, mockConfig);
      const instanceId = deployResult.instanceId!;

      const result = await driver.rollback(instanceId, { steps: 2 });

      expect(result.success).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status for running instance', async () => {
      const deployResult = await driver.deploy(mockManifest, mockConfig);
      const instanceId = deployResult.instanceId!;

      const health = await driver.healthCheck(instanceId);

      expect(health.healthy).toBe(true);
      expect(health.status).toBe('healthy');
      expect(health.metrics).toBeDefined();
    });

    it('should return unknown status for non-existent instance', async () => {
      const health = await driver.healthCheck('non-existent');

      expect(health.healthy).toBe(false);
      expect(health.status).toBe('unknown');
    });
  });
});
