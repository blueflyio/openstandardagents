/**
 * Tests for OssaRuntime
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OssaRuntime, createRuntime } from '../src/runtime';
import type { AgentManifest } from '../src/types';

describe('OssaRuntime', () => {
  let runtime: OssaRuntime;

  beforeEach(() => {
    runtime = new OssaRuntime();
  });

  describe('loadAgent', () => {
    it('should load agent from manifest object', async () => {
      const manifest: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: { role: 'Testing' },
      };

      const agent = await runtime.loadAgent(manifest);

      expect(agent.id).toBe('test-agent');
      expect(runtime.isAgentLoaded('test-agent')).toBe(true);
    });

    it('should throw error if agent with same ID already loaded', async () => {
      const manifest: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: { role: 'Testing' },
      };

      await runtime.loadAgent(manifest);

      await expect(runtime.loadAgent(manifest)).rejects.toThrow(
        "Agent with ID 'test-agent' already loaded"
      );
    });

    it('should respect maxAgents limit', async () => {
      const limitedRuntime = new OssaRuntime({ maxAgents: 1 });

      const manifest1: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'agent-1' },
        spec: { role: 'Testing' },
      };

      const manifest2: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'agent-2' },
        spec: { role: 'Testing' },
      };

      await limitedRuntime.loadAgent(manifest1);

      await expect(limitedRuntime.loadAgent(manifest2)).rejects.toThrow(
        'Maximum number of agents (1) reached'
      );
    });
  });

  describe('executeCapability', () => {
    it('should execute capability on loaded agent', async () => {
      const manifest: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: { role: 'Testing' },
      };

      const agent = await runtime.loadAgent(manifest);

      agent.registerCapability(
        {
          name: 'test',
          description: 'Test',
          input_schema: {},
          output_schema: {},
        },
        async (input) => ({ result: 'ok', input })
      );

      const result = await runtime.executeCapability(agent, 'test', {
        foo: 'bar',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'ok', input: { foo: 'bar' } });
    });

    it('should return error if agent not loaded', async () => {
      const manifest: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: { role: 'Testing' },
      };

      const agent = await runtime.loadAgent(manifest);
      runtime.unloadAgent('test-agent');

      const result = await runtime.executeCapability(agent, 'test', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AGENT_NOT_LOADED');
    });
  });

  describe('getAgent', () => {
    it('should return agent if loaded', async () => {
      const manifest: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: { role: 'Testing' },
      };

      const agent = await runtime.loadAgent(manifest);
      const retrieved = runtime.getAgent('test-agent');

      expect(retrieved).toBe(agent);
    });

    it('should return undefined if agent not loaded', () => {
      expect(runtime.getAgent('nonexistent')).toBeUndefined();
    });
  });

  describe('getAgents', () => {
    it('should return all loaded agents', async () => {
      const manifest1: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'agent-1' },
        spec: { role: 'Testing' },
      };

      const manifest2: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'agent-2' },
        spec: { role: 'Testing' },
      };

      await runtime.loadAgent(manifest1);
      await runtime.loadAgent(manifest2);

      const agents = runtime.getAgents();

      expect(agents.size).toBe(2);
      expect(agents.has('agent-1')).toBe(true);
      expect(agents.has('agent-2')).toBe(true);
    });
  });

  describe('unloadAgent', () => {
    it('should unload agent', async () => {
      const manifest: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: { role: 'Testing' },
      };

      await runtime.loadAgent(manifest);
      expect(runtime.isAgentLoaded('test-agent')).toBe(true);

      runtime.unloadAgent('test-agent');
      expect(runtime.isAgentLoaded('test-agent')).toBe(false);
    });
  });

  describe('unloadAll', () => {
    it('should unload all agents', async () => {
      await runtime.loadAgent({
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'agent-1' },
        spec: { role: 'Testing' },
      });

      await runtime.loadAgent({
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'agent-2' },
        spec: { role: 'Testing' },
      });

      expect(runtime.getAgents().size).toBe(2);

      runtime.unloadAll();

      expect(runtime.getAgents().size).toBe(0);
    });
  });

  describe('reloadAgent', () => {
    it('should reload agent with new manifest', async () => {
      const manifest1: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: { role: 'Testing' },
      };

      const manifest2: AgentManifest = {
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '2.0.0' },
        spec: { role: 'Testing Updated' },
      };

      await runtime.loadAgent(manifest1);
      const agent = await runtime.reloadAgent('test-agent', manifest2);

      expect(agent.manifest.metadata?.version).toBe('2.0.0');
      expect(agent.manifest.spec?.role).toBe('Testing Updated');
    });
  });

  describe('getStats', () => {
    it('should return runtime statistics', async () => {
      await runtime.loadAgent({
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'agent-1' },
        spec: { role: 'Testing' },
      });

      await runtime.loadAgent({
        apiVersion: 'v0.3.0',
        kind: 'Agent',
        metadata: { name: 'agent-2' },
        spec: { role: 'Testing' },
      });

      const stats = runtime.getStats();

      expect(stats.loadedAgents).toBe(2);
      expect(stats.maxAgents).toBe(100); // Default max
      expect(stats.agentIds).toEqual(['agent-1', 'agent-2']);
    });
  });

  describe('createRuntime', () => {
    it('should create runtime with default config', () => {
      const rt = createRuntime();
      expect(rt).toBeInstanceOf(OssaRuntime);
    });

    it('should create runtime with custom config', () => {
      const rt = createRuntime({ maxAgents: 10 });
      expect(rt.getStats().maxAgents).toBe(10);
    });
  });
});
