/**
 * Dynamic Agent Types Tests
 * Tests for context-driven agent type detection
 */

import { describe, it, expect } from '@jest/globals';
import {
  type AgentTypeContext,
  type DynamicAgentType,
  determineAgentType,
  suggestCapabilities,
  validateTypeCapabilities,
  extractContextFromManifest,
  getTypeCharacteristics,
} from '../../src/types/dynamic-agent-types';

describe('Dynamic Agent Types', () => {
  describe('determineAgentType', () => {
    it('detects api-orchestrator for webhook + stateless + solo', () => {
      const context: AgentTypeContext = {
        environment: 'production',
        trigger: 'webhook',
        dataFlow: 'stateless',
        collaboration: 'solo',
        autonomy: 'semi-autonomous',
        capabilities: ['http', 'webhook', 'api'],
        resources: { cpu: 1, memory: 512 },
      };

      const type = determineAgentType(context);
      expect(type).toBe('api-orchestrator');
    });

    it('detects scheduled-analyst for schedule + batch', () => {
      const context: AgentTypeContext = {
        environment: 'production',
        trigger: 'schedule',
        dataFlow: 'batch',
        collaboration: 'solo',
        autonomy: 'autonomous',
        capabilities: ['schedule', 'batch', 'artifact'],
        resources: { cpu: 2, memory: 1024 },
      };

      const type = determineAgentType(context);
      expect(type).toBe('scheduled-analyst');
    });

    it('detects swarm-coordinator for swarm collaboration', () => {
      const context: AgentTypeContext = {
        environment: 'production',
        trigger: 'a2a',
        dataFlow: 'stateful',
        collaboration: 'swarm',
        autonomy: 'autonomous',
        capabilities: ['a2a', 'mesh', 'coordination'],
        resources: { cpu: 1, memory: 512 },
      };

      const type = determineAgentType(context);
      expect(type).toBe('swarm-coordinator');
    });

    it('detects pipeline-worker for pipeline + stateful', () => {
      const context: AgentTypeContext = {
        environment: 'staging',
        trigger: 'pipeline',
        dataFlow: 'stateful',
        collaboration: 'solo',
        autonomy: 'autonomous',
        capabilities: ['pipeline', 'ci', 'cd', 'build'],
        resources: { cpu: 2, memory: 2048 },
      };

      const type = determineAgentType(context);
      expect(type).toBe('pipeline-worker');
    });

    it('detects stream-processor for streaming data flow', () => {
      const context: AgentTypeContext = {
        environment: 'production',
        trigger: 'stream',
        dataFlow: 'streaming',
        collaboration: 'solo',
        autonomy: 'autonomous',
        capabilities: ['stream', 'realtime', 'kafka'],
        resources: { cpu: 4, memory: 4096, gpu: true },
      };

      const type = determineAgentType(context);
      expect(type).toBe('stream-processor');
    });

    it('detects policy-enforcer for policy-driven autonomy', () => {
      const context: AgentTypeContext = {
        environment: 'production',
        trigger: 'event',
        dataFlow: 'stateless',
        collaboration: 'solo',
        autonomy: 'policy-driven',
        capabilities: ['policy', 'governance', 'compliance'],
        resources: { cpu: 1, memory: 256 },
      };

      const type = determineAgentType(context);
      expect(type).toBe('policy-enforcer');
    });

    it('defaults to adaptive-hybrid when no rules match', () => {
      const context: AgentTypeContext = {
        environment: 'development',
        trigger: 'manual',
        dataFlow: 'stateless',
        collaboration: 'solo',
        autonomy: 'semi-autonomous',
        capabilities: [],
        resources: {},
      };

      const type = determineAgentType(context);
      expect(type).toBe('adaptive-hybrid');
    });
  });

  describe('suggestCapabilities', () => {
    it('suggests http capabilities for api-orchestrator', () => {
      const caps = suggestCapabilities('api-orchestrator');
      expect(caps).toContain('http');
      expect(caps).toContain('webhook');
      expect(caps).toContain('api');
    });

    it('suggests schedule capabilities for scheduled-analyst', () => {
      const caps = suggestCapabilities('scheduled-analyst');
      expect(caps).toContain('schedule');
      expect(caps).toContain('batch');
      expect(caps).toContain('artifact');
    });

    it('suggests coordination capabilities for swarm-coordinator', () => {
      const caps = suggestCapabilities('swarm-coordinator');
      expect(caps).toContain('a2a');
      expect(caps).toContain('mesh');
      expect(caps).toContain('coordination');
    });

    it('suggests all capabilities for adaptive-hybrid', () => {
      const caps = suggestCapabilities('adaptive-hybrid');
      expect(caps).toContain('*');
    });
  });

  describe('validateTypeCapabilities', () => {
    it('validates matching capabilities', () => {
      const result = validateTypeCapabilities('api-orchestrator', [
        'http',
        'webhook',
        'api',
        'function',
        'rest',
      ]);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('detects missing capabilities', () => {
      const result = validateTypeCapabilities('api-orchestrator', ['http']);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('webhook');
      expect(result.missing).toContain('api');
    });

    it('detects extra capabilities', () => {
      const result = validateTypeCapabilities('api-orchestrator', [
        'http',
        'webhook',
        'api',
        'database',
        'queue',
        'extra1',
        'extra2',
      ]);

      expect(result.extra.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('accepts all capabilities for adaptive-hybrid', () => {
      const result = validateTypeCapabilities('adaptive-hybrid', [
        'anything',
        'goes',
        'here',
      ]);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.extra).toHaveLength(0);
    });
  });

  describe('getTypeCharacteristics', () => {
    it('returns characteristics for api-orchestrator', () => {
      const chars = getTypeCharacteristics('api-orchestrator');

      expect(chars.executionTime).toBe('short');
      expect(chars.scaling).toBe('horizontal');
      expect(chars.statePersistence).toBe(false);
      expect(chars.requiresHuman).toBe(false);
      expect(chars.costProfile).toBe('low');
    });

    it('returns characteristics for stream-processor', () => {
      const chars = getTypeCharacteristics('stream-processor');

      expect(chars.executionTime).toBe('long');
      expect(chars.scaling).toBe('auto');
      expect(chars.statePersistence).toBe(true);
      expect(chars.requiresHuman).toBe(false);
      expect(chars.costProfile).toBe('high');
    });

    it('returns characteristics for supervisor', () => {
      const chars = getTypeCharacteristics('supervisor');

      expect(chars.requiresHuman).toBe(true);
      expect(chars.scaling).toBe('none');
    });
  });

  describe('extractContextFromManifest', () => {
    it('extracts context from minimal manifest', () => {
      const manifest = {
        apiVersion: 'ossa.bluefly.io/v1',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          role: 'Test agent',
          llm: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
        },
      };

      const context = extractContextFromManifest(manifest);

      expect(context).not.toBeNull();
      expect(context?.trigger).toBe('manual');
      expect(context?.dataFlow).toBe('stateless');
      expect(context?.collaboration).toBe('solo');
    });

    it('extracts webhook trigger from HTTP tools', () => {
      const manifest = {
        apiVersion: 'ossa.bluefly.io/v1',
        kind: 'Agent',
        metadata: { name: 'webhook-agent' },
        spec: {
          role: 'Webhook handler',
          llm: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
          tools: [{ type: 'http', name: 'webhook' }],
        },
      };

      const context = extractContextFromManifest(manifest);

      expect(context?.trigger).toBe('webhook');
    });

    it('extracts stateful dataflow from workflow', () => {
      const manifest = {
        apiVersion: 'ossa.bluefly.io/v1',
        kind: 'Agent',
        metadata: {
          name: 'workflow-agent',
          agentArchitecture: { pattern: 'pipeline' },
        },
        spec: {
          role: 'Workflow executor',
          llm: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
          workflow: {
            steps: [{ action: 'step1' }, { action: 'step2' }],
          },
        },
      };

      const context = extractContextFromManifest(manifest);

      expect(context?.dataFlow).toBe('stateful');
    });

    it('extracts mesh collaboration from dependencies', () => {
      const manifest = {
        apiVersion: 'ossa.bluefly.io/v1',
        kind: 'Agent',
        metadata: { name: 'mesh-agent' },
        spec: {
          role: 'Mesh node',
          llm: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
          dependencies: {
            agents: [{ name: 'agent-1' }, { name: 'agent-2' }],
          },
        },
      };

      const context = extractContextFromManifest(manifest);

      expect(context?.collaboration).toBe('mesh');
    });

    it('extracts supervised autonomy from approval requirement', () => {
      const manifest = {
        apiVersion: 'ossa.bluefly.io/v1',
        kind: 'Agent',
        metadata: { name: 'supervised-agent' },
        spec: {
          role: 'Supervised worker',
          llm: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
          autonomy: {
            approval_required: true,
          },
        },
      };

      const context = extractContextFromManifest(manifest);

      expect(context?.autonomy).toBe('supervised');
    });

    it('extracts policy-driven autonomy from policies', () => {
      const manifest = {
        apiVersion: 'ossa.bluefly.io/v1',
        kind: 'Agent',
        metadata: { name: 'policy-agent' },
        spec: {
          role: 'Policy enforcer',
          llm: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
          policies: [{ name: 'policy-1', type: 'enforcement', rules: [] }],
        },
      };

      const context = extractContextFromManifest(manifest);

      expect(context?.autonomy).toBe('policy-driven');
    });

    it('extracts capabilities from tools and spec', () => {
      const manifest = {
        apiVersion: 'ossa.bluefly.io/v1',
        kind: 'Agent',
        metadata: { name: 'multi-cap-agent' },
        spec: {
          role: 'Multi-capability agent',
          llm: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
          tools: [
            { type: 'http' },
            { type: 'database' },
          ],
          capabilities: ['analytics', 'reporting'],
        },
      };

      const context = extractContextFromManifest(manifest);

      expect(context?.capabilities).toContain('http');
      expect(context?.capabilities).toContain('database');
      expect(context?.capabilities).toContain('analytics');
      expect(context?.capabilities).toContain('reporting');
    });

    it('extracts resource requirements', () => {
      const manifest = {
        apiVersion: 'ossa.bluefly.io/v1',
        kind: 'Agent',
        metadata: { name: 'resource-agent' },
        spec: {
          role: 'Resource-intensive agent',
          llm: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
          constraints: {
            resources: {
              cpu: '4',
              memory: '8192',
              gpu: 'true',
            },
          },
        },
      };

      const context = extractContextFromManifest(manifest);

      expect(context?.resources.cpu).toBe(4);
      expect(context?.resources.memory).toBe(8192);
      expect(context?.resources.gpu).toBe(true);
    });
  });

  describe('Context Adaptation', () => {
    it('adapts type when context changes from webhook to schedule', () => {
      const webhookContext: AgentTypeContext = {
        environment: 'production',
        trigger: 'webhook',
        dataFlow: 'stateless',
        collaboration: 'solo',
        autonomy: 'autonomous',
        capabilities: ['http', 'webhook'],
        resources: {},
      };

      const scheduleContext: AgentTypeContext = {
        ...webhookContext,
        trigger: 'schedule',
        dataFlow: 'batch',
        capabilities: ['schedule', 'batch'],
      };

      const webhookType = determineAgentType(webhookContext);
      const scheduleType = determineAgentType(scheduleContext);

      expect(webhookType).toBe('api-orchestrator');
      expect(scheduleType).toBe('scheduled-analyst');
    });

    it('adapts type when collaboration changes from solo to swarm', () => {
      const soloContext: AgentTypeContext = {
        environment: 'production',
        trigger: 'webhook',
        dataFlow: 'stateless',
        collaboration: 'solo',
        autonomy: 'autonomous',
        capabilities: ['http'],
        resources: {},
      };

      const swarmContext: AgentTypeContext = {
        ...soloContext,
        collaboration: 'swarm',
        capabilities: ['a2a', 'mesh', 'coordination'],
      };

      const soloType = determineAgentType(soloContext);
      const swarmType = determineAgentType(swarmContext);

      expect(soloType).toBe('api-orchestrator');
      expect(swarmType).toBe('swarm-coordinator');
    });

    it('adapts type when autonomy changes to policy-driven', () => {
      const autonomousContext: AgentTypeContext = {
        environment: 'production',
        trigger: 'event',
        dataFlow: 'stateless',
        collaboration: 'solo',
        autonomy: 'autonomous',
        capabilities: ['event'],
        resources: {},
      };

      const policyContext: AgentTypeContext = {
        ...autonomousContext,
        autonomy: 'policy-driven',
        capabilities: ['policy', 'governance'],
      };

      const autonomousType = determineAgentType(autonomousContext);
      const policyType = determineAgentType(policyContext);

      expect(autonomousType).toBe('event-handler');
      expect(policyType).toBe('policy-enforcer');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty capabilities gracefully', () => {
      const context: AgentTypeContext = {
        environment: 'development',
        trigger: 'manual',
        dataFlow: 'stateless',
        collaboration: 'solo',
        autonomy: 'semi-autonomous',
        capabilities: [],
        resources: {},
      };

      const type = determineAgentType(context);
      expect(type).toBe('adaptive-hybrid');
    });

    it('handles missing resources gracefully', () => {
      const context: AgentTypeContext = {
        environment: 'production',
        trigger: 'webhook',
        dataFlow: 'stateless',
        collaboration: 'solo',
        autonomy: 'autonomous',
        capabilities: ['http'],
        resources: {},
      };

      const type = determineAgentType(context);
      expect(type).toBe('api-orchestrator');
    });

    it('handles invalid manifest gracefully', () => {
      const manifest = {
        invalid: 'structure',
      };

      const context = extractContextFromManifest(manifest);
      // Invalid manifests still return a default context
      expect(context).not.toBeNull();
      expect(context?.trigger).toBe('manual');
      expect(context?.capabilities).toHaveLength(0);
    });
  });
});
