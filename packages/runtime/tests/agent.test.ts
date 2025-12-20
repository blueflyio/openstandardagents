/**
 * Tests for OssaAgent
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OssaAgent, createAgent } from '../src/agent';
import type { AgentManifest, Capability } from '../src/types';

describe('OssaAgent', () => {
  let manifest: AgentManifest;

  beforeEach(() => {
    manifest = {
      apiVersion: 'v0.3.0',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent',
      },
      spec: {
        role: 'Testing',
      },
    };
  });

  describe('constructor', () => {
    it('should create agent with k8s-style manifest', () => {
      const agent = new OssaAgent(manifest);

      expect(agent.id).toBe('test-agent');
      expect(agent.manifest).toEqual(manifest);
    });

    it('should create agent with legacy manifest', () => {
      const legacyManifest: AgentManifest = {
        ossaVersion: '0.1.9',
        agent: {
          id: 'legacy-agent',
          name: 'Legacy Agent',
          version: '1.0.0',
          role: 'Testing',
          runtime: { type: 'docker' },
          capabilities: [],
        },
      };

      const agent = new OssaAgent(legacyManifest);

      expect(agent.id).toBe('legacy-agent');
      expect(agent.manifest).toEqual(legacyManifest);
    });

    it('should generate random ID if not found in manifest', () => {
      const minimalManifest: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
      };

      const agent = new OssaAgent(minimalManifest);

      expect(agent.id).toMatch(/^agent-/);
    });

    it('should use custom ID if provided', () => {
      const agent = new OssaAgent(manifest, 'custom-id');

      expect(agent.id).toBe('custom-id');
    });
  });

  describe('execute', () => {
    it('should execute capability successfully', async () => {
      const agent = new OssaAgent(manifest);

      const capability: Capability = {
        name: 'test',
        description: 'Test capability',
        input_schema: { type: 'object' },
        output_schema: { type: 'object' },
      };

      agent.registerCapability(capability, async (input) => ({
        result: 'ok',
        input,
      }));

      const result = await agent.execute('test', { foo: 'bar' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'ok', input: { foo: 'bar' } });
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should return error if capability not found', async () => {
      const agent = new OssaAgent(manifest);

      const result = await agent.execute('nonexistent', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CAPABILITY_NOT_FOUND');
      expect(result.error?.message).toContain('nonexistent');
    });

    it('should handle execution errors', async () => {
      const agent = new OssaAgent(manifest);

      const capability: Capability = {
        name: 'failing',
        description: 'Failing capability',
        input_schema: { type: 'object' },
        output_schema: { type: 'object' },
      };

      agent.registerCapability(capability, async () => {
        throw new Error('Test error');
      });

      const result = await agent.execute('failing', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EXECUTION_ERROR');
      expect(result.error?.message).toBe('Test error');
    });

    it('should handle timeout if specified', async () => {
      const agent = new OssaAgent(manifest);

      const capability: Capability = {
        name: 'slow',
        description: 'Slow capability',
        input_schema: { type: 'object' },
        output_schema: { type: 'object' },
        timeout_seconds: 0.1, // 100ms timeout
      };

      agent.registerCapability(capability, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200)); // Takes 200ms
        return { done: true };
      });

      const result = await agent.execute('slow', {});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    }, 10000);

    it('should include execution context', async () => {
      const agent = new OssaAgent(manifest);

      let capturedContext: any;

      const capability: Capability = {
        name: 'context-test',
        description: 'Test context',
        input_schema: { type: 'object' },
        output_schema: { type: 'object' },
      };

      agent.registerCapability(capability, async (input, context) => {
        capturedContext = context;
        return { ok: true };
      });

      await agent.execute('context-test', {}, { userId: 'user123' });

      expect(capturedContext.requestId).toBeDefined();
      expect(capturedContext.timestamp).toBeInstanceOf(Date);
      expect(capturedContext.userId).toBe('user123');
    });
  });

  describe('registerCapability', () => {
    it('should register capability and handler', () => {
      const agent = new OssaAgent(manifest);

      const capability: Capability = {
        name: 'test',
        description: 'Test',
        input_schema: {},
        output_schema: {},
      };

      agent.registerCapability(capability, async () => ({}));

      expect(agent.hasCapability('test')).toBe(true);
      expect(agent.getCapability('test')).toEqual(capability);
    });
  });

  describe('getCapabilities', () => {
    it('should return all capabilities', () => {
      const agent = new OssaAgent(manifest);

      agent.registerCapability(
        { name: 'cap1', description: 'Test', input_schema: {}, output_schema: {} },
        async () => ({})
      );
      agent.registerCapability(
        { name: 'cap2', description: 'Test', input_schema: {}, output_schema: {} },
        async () => ({})
      );

      const capabilities = agent.getCapabilities();

      expect(capabilities.size).toBe(2);
      expect(capabilities.has('cap1')).toBe(true);
      expect(capabilities.has('cap2')).toBe(true);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for k8s-style manifest', () => {
      const agent = new OssaAgent(manifest);
      const metadata = agent.getMetadata();

      expect(metadata.id).toBe('test-agent');
      expect(metadata.name).toBe('test-agent');
      expect(metadata.role).toBe('Testing');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.description).toBe('Test agent');
    });

    it('should return metadata for legacy manifest', () => {
      const legacyManifest: AgentManifest = {
        ossaVersion: '0.1.9',
        agent: {
          id: 'legacy-agent',
          name: 'Legacy Agent',
          version: '1.0.0',
          role: 'Testing',
          description: 'Legacy test agent',
          runtime: { type: 'docker' },
          capabilities: [],
        },
      };

      const agent = new OssaAgent(legacyManifest);
      const metadata = agent.getMetadata();

      expect(metadata.id).toBe('legacy-agent');
      expect(metadata.name).toBe('Legacy Agent');
      expect(metadata.role).toBe('Testing');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.description).toBe('Legacy test agent');
    });
  });

  describe('createAgent', () => {
    it('should create agent using factory function', () => {
      const agent = createAgent(manifest);

      expect(agent).toBeInstanceOf(OssaAgent);
      expect(agent.id).toBe('test-agent');
    });

    it('should accept custom ID', () => {
      const agent = createAgent(manifest, 'custom-id');

      expect(agent.id).toBe('custom-id');
    });
  });
});
