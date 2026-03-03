/**
 * Local Deployment Driver - Unit tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LocalDeploymentDriver } from '../../../src/deploy/local-driver.js';
import type { OssaAgent } from '../../../src/types/index.js';
import { API_VERSION } from '../../../src/version.js';

const validManifest: OssaAgent = {
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { name: 'test-agent', version: '1.0.0' },
  spec: { role: 'Test', llm: { provider: 'openai', model: 'gpt-4' } },
};

describe('LocalDeploymentDriver', () => {
  let driver: LocalDeploymentDriver;

  beforeEach(() => {
    driver = new LocalDeploymentDriver();
  });

  describe('deploy', () => {
    it('returns success with dryRun true without starting process', async () => {
      const result = await driver.deploy(validManifest, {
        dryRun: true,
        environment: 'test',
        target: 'local',
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('DRY RUN');
    });

    it('returns success and instanceId when deploying', async () => {
      const result = await driver.deploy(validManifest, {
        environment: 'test',
        target: 'local',
      });
      expect(result.success).toBe(true);
      expect(result.instanceId).toBeDefined();
      expect(result.instanceId).toContain('test-agent');
      expect(result.endpoint).toMatch(/^http:\/\//);
    });

    it('throws on invalid manifest (missing metadata)', async () => {
      const bad = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        spec: {},
      } as OssaAgent;
      await expect(
        driver.deploy(bad, { environment: 'test', target: 'local' })
      ).rejects.toThrow('missing metadata');
    });
  });

  describe('getStatus', () => {
    it('throws when instance not found', async () => {
      await expect(driver.getStatus('nonexistent')).rejects.toThrow(
        'not found'
      );
    });

    it('returns instance after deploy', async () => {
      const deployResult = await driver.deploy(validManifest, {
        environment: 'test',
        target: 'local',
      });
      expect(deployResult.instanceId).toBeDefined();
      const status = await driver.getStatus(deployResult.instanceId!);
      expect(status.id).toBe(deployResult.instanceId);
      expect(status.name).toBe('test-agent');
      expect(status.status).toBeDefined();
    });
  });

  describe('listInstances', () => {
    it('returns empty array when no deployments', async () => {
      const list = await driver.listInstances();
      expect(list).toEqual([]);
    });

    it('returns deployed instance after deploy', async () => {
      await driver.deploy(validManifest, {
        environment: 'test',
        target: 'local',
      });
      const list = await driver.listInstances();
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.some((i) => i.name === 'test-agent')).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('returns unhealthy when instance not found', async () => {
      const health = await driver.healthCheck('nonexistent');
      expect(health.healthy).toBe(false);
      expect(health.message).toContain('not found');
    });

    it('returns healthy for running deployed instance', async () => {
      const deployResult = await driver.deploy(validManifest, {
        environment: 'test',
        target: 'local',
      });
      const health = await driver.healthCheck(deployResult.instanceId!);
      expect(health.healthy).toBe(true);
      expect(health.status).toBe('healthy');
    });
  });

  describe('stop', () => {
    it('throws when instance not found', async () => {
      await expect(driver.stop('nonexistent')).rejects.toThrow('not found');
    });

    it('stops deployed instance', async () => {
      const deployResult = await driver.deploy(validManifest, {
        environment: 'test',
        target: 'local',
      });
      await driver.stop(deployResult.instanceId!);
      await expect(
        driver.getStatus(deployResult.instanceId!)
      ).rejects.toThrow();
    });
  });

  describe('rollback', () => {
    it('returns success with message when instance exists', async () => {
      const deployResult = await driver.deploy(validManifest, {
        environment: 'test',
        target: 'local',
      });
      const result = await driver.rollback(deployResult.instanceId!, {});
      expect(result.success).toBe(true);
      expect(result.message).toContain('Rolled back');
    });
  });
});
