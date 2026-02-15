/**
 * Tests for ManifestBuilder
 */

import { describe, it, expect } from '@jest/globals';
import {
  ManifestBuilder,
  ToolBuilder,
  LLMConfigBuilder,
  SafetyBuilder,
  AutonomyBuilder,
} from '../../../../../src/sdks/typescript/builders/index.js';

describe('ManifestBuilder', () => {
  describe('Agent Manifests', () => {
    it('should build basic agent manifest', () => {
      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .version('1.0.0')
        .description('My helpful agent')
        .build();

      expect(manifest.kind).toBe('Agent');
      expect(manifest.metadata.name).toBe('theagentformerly-known-asprince');
      expect(manifest.metadata.version).toBe('1.0.0');
      expect(manifest.metadata.description).toBe('My helpful agent');
      expect(manifest.apiVersion).toMatch(/^ossa\/v/);
    });

    it('should build agent with role', () => {
      const manifest = ManifestBuilder.agent('code-reviewer')
        .role('You are a helpful code reviewer')
        .build();

      expect(manifest.spec.role).toBe('You are a helpful code reviewer');
    });

    it('should build agent with LLM config', () => {
      const llmConfig = LLMConfigBuilder.anthropic('claude-sonnet-4')
        .temperature(0.7)
        .maxTokens(4096)
        .build();

      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .llm(llmConfig)
        .build();

      expect(manifest.spec.llm?.provider).toBe('anthropic');
      expect(manifest.spec.llm?.model).toBe('claude-sonnet-4');
      expect(manifest.spec.llm?.temperature).toBe(0.7);
      expect(manifest.spec.llm?.max_tokens).toBe(4096);
    });

    it('should build agent with tools', () => {
      const tool1 = ToolBuilder.mcp('filesystem')
        .server('npx -y @modelcontextprotocol/server-filesystem')
        .args(['./'])
        .build();

      const tool2 = ToolBuilder.webhook('github-webhook')
        .url('https://api.example.com/webhook')
        .events(['push'])
        .build();

      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .addTool(tool1)
        .addTool(tool2)
        .build();

      expect(manifest.spec.tools).toHaveLength(2);
      expect(manifest.spec.tools?.[0].name).toBe('filesystem');
      expect(manifest.spec.tools?.[1].name).toBe('github-webhook');
    });

    it('should build agent with safety config', () => {
      const safety = SafetyBuilder.create()
        .maxActionsPerMinute(10)
        .costThreshold(100)
        .build();

      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .safety(safety)
        .build();

      expect(manifest.spec.safety?.guardrails?.max_actions_per_minute).toBe(10);
      expect(manifest.spec.safety?.guardrails?.cost_threshold_usd).toBe(100);
    });

    it('should build agent with autonomy config', () => {
      const autonomy = AutonomyBuilder.supervised()
        .approvalRequired(['deploy', 'delete'])
        .build();

      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .autonomy(autonomy)
        .build();

      expect(manifest.spec.access_tier).toBe('tier_1_read');
    });

    it('should build agent with capabilities', () => {
      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .addCapability('code-review', 'Review code for issues')
        .addCapability('testing', 'Write unit tests')
        .build();

      expect(manifest.spec.capabilities).toHaveLength(2);
      expect(manifest.spec.capabilities?.[0].name).toBe('code-review');
      expect(manifest.spec.capabilities?.[0].description).toBe(
        'Review code for issues'
      );
    });

    it('should build agent with labels and annotations', () => {
      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .label('team', 'platform')
        .label('env', 'production')
        .annotation('jira-ticket', 'PROJ-123')
        .build();

      expect(manifest.metadata.labels?.team).toBe('platform');
      expect(manifest.metadata.labels?.env).toBe('production');
      expect(manifest.metadata.annotations?.['jira-ticket']).toBe('PROJ-123');
    });

    it('should build agent with namespace', () => {
      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .namespace('production')
        .build();

      expect(manifest.metadata.namespace).toBe('production');
    });
  });

  describe('Task Manifests', () => {
    it('should build basic task manifest', () => {
      const manifest = ManifestBuilder.task('my-task')
        .version('1.0.0')
        .description('My task')
        .build();

      expect(manifest.kind).toBe('Task');
      expect(manifest.metadata.name).toBe('my-task');
      expect(manifest.metadata.version).toBe('1.0.0');
    });

    it('should build task with description', () => {
      const manifest = ManifestBuilder.task('my-task')
        .taskDescription('This is a task')
        .build();

      expect(manifest.spec.description).toBe('This is a task');
    });

    it('should build task with steps', () => {
      const manifest = ManifestBuilder.task('my-task')
        .addStep('step1', 'action1', { param1: 'value1' })
        .addStep('step2', 'action2', { param2: 'value2' })
        .build();

      expect(manifest.spec.steps).toHaveLength(2);
      expect(manifest.spec.steps?.[0].name).toBe('step1');
      expect(manifest.spec.steps?.[0].action).toBe('action1');
      expect(manifest.spec.steps?.[0].parameters).toEqual({ param1: 'value1' });
    });
  });

  describe('Workflow Manifests', () => {
    it('should build basic workflow manifest', () => {
      const manifest = ManifestBuilder.workflow('my-workflow')
        .version('1.0.0')
        .description('My workflow')
        .build();

      expect(manifest.kind).toBe('Workflow');
      expect(manifest.metadata.name).toBe('my-workflow');
      expect(manifest.metadata.version).toBe('1.0.0');
    });

    it('should build workflow with agents', () => {
      const manifest = ManifestBuilder.workflow('my-workflow')
        .addAgent('agent1', 'ossa://agents/agent1', 'Role 1')
        .addAgent('agent2', 'ossa://agents/agent2', 'Role 2')
        .build();

      expect(manifest.spec.agents).toHaveLength(2);
      expect(manifest.spec.agents?.[0].name).toBe('agent1');
      expect(manifest.spec.agents?.[0].ref).toBe('ossa://agents/agent1');
      expect(manifest.spec.agents?.[0].role).toBe('Role 1');
    });

    it('should build workflow with steps', () => {
      const manifest = ManifestBuilder.workflow('my-workflow')
        .addWorkflowStep('step1', 'Task', {
          name: 'First step',
          ref: 'ossa://tasks/task1',
        })
        .addWorkflowStep('step2', 'Agent', {
          name: 'Second step',
          ref: 'ossa://agents/agent1',
          dependsOn: ['step1'],
        })
        .build();

      expect(manifest.spec.steps).toHaveLength(2);
      expect(manifest.spec.steps?.[0].id).toBe('step1');
      expect(manifest.spec.steps?.[0].kind).toBe('Task');
      expect(manifest.spec.steps?.[1].depends_on).toEqual(['step1']);
    });
  });

  describe('Comprehensive Example', () => {
    it('should build comprehensive agent manifest', () => {
      const llmConfig = LLMConfigBuilder.anthropic('claude-sonnet-4')
        .temperature(0.7)
        .maxTokens(4096)
        .build();

      const tool = ToolBuilder.mcp('filesystem')
        .server('npx -y @modelcontextprotocol/server-filesystem')
        .args(['./'])
        .build();

      const safety = SafetyBuilder.create()
        .maxActionsPerMinute(10)
        .requireApprovalFor(['deploy', 'delete'])
        .costThreshold(100)
        .build();

      const autonomy = AutonomyBuilder.supervised()
        .approvalRequired(['deploy', 'delete'])
        .maxCost(100)
        .build();

      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .version('1.0.0')
        .namespace('production')
        .description('My helpful agent')
        .role('You are a helpful assistant')
        .llm(llmConfig)
        .addTool(tool)
        .addCapability('code-review', 'Review code')
        .safety(safety)
        .autonomy(autonomy)
        .label('team', 'platform')
        .annotation('jira', 'PROJ-123')
        .build();

      expect(manifest.kind).toBe('Agent');
      expect(manifest.metadata.name).toBe('theagentformerly-known-asprince');
      expect(manifest.metadata.version).toBe('1.0.0');
      expect(manifest.metadata.namespace).toBe('production');
      expect(manifest.metadata.description).toBe('My helpful agent');
      expect(manifest.metadata.labels?.team).toBe('platform');
      expect(manifest.metadata.annotations?.jira).toBe('PROJ-123');
      expect(manifest.spec.role).toBe('You are a helpful assistant');
      expect(manifest.spec.llm?.provider).toBe('anthropic');
      expect(manifest.spec.tools).toHaveLength(1);
      expect(manifest.spec.capabilities).toHaveLength(1);
      expect(manifest.spec.safety?.guardrails?.max_actions_per_minute).toBe(10);
      expect(manifest.spec.access_tier).toBe('tier_1_read');
    });
  });

  describe('Validation', () => {
    it('should require name', () => {
      const builder = new (ManifestBuilder as any)('Agent', '');
      builder.metadata = {};
      expect(() => builder.build()).toThrow('Manifest name is required');
    });

    it('should throw error when using agent methods on task', () => {
      expect(() => {
        ManifestBuilder.task('my-task').role('You are a task').build();
      }).toThrow('role() is only available for Agent manifests');
    });

    it('should throw error when using agent methods on workflow', () => {
      expect(() => {
        ManifestBuilder.workflow('my-workflow')
          .llm(LLMConfigBuilder.anthropic('claude-sonnet-4').build())
          .build();
      }).toThrow('llm() is only available for Agent manifests');
    });

    it('should throw error when using task methods on agent', () => {
      expect(() => {
        ManifestBuilder.agent('theagentformerly-known-asprince')
          .taskDescription('Task description')
          .build();
      }).toThrow('taskDescription() is only available for Task manifests');
    });

    it('should throw error when using workflow methods on agent', () => {
      expect(() => {
        ManifestBuilder.agent('theagentformerly-known-asprince')
          .addAgent('agent1')
          .build();
      }).toThrow('addAgent() is only available for Workflow manifests');
    });
  });

  describe('Fluent API', () => {
    it('should support method chaining', () => {
      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .version('1.0.0')
        .description('My agent')
        .namespace('production')
        .label('env', 'prod')
        .annotation('key', 'value')
        .role('You are helpful')
        .addCapability('review')
        .build();

      expect(manifest.metadata.name).toBe('theagentformerly-known-asprince');
      expect(manifest.metadata.version).toBe('1.0.0');
      expect(manifest.metadata.description).toBe('My agent');
      expect(manifest.metadata.namespace).toBe('production');
      expect(manifest.spec.role).toBe('You are helpful');
    });
  });

  describe('Edge Cases', () => {
    it('should build minimal agent manifest', () => {
      const manifest = ManifestBuilder.agent('minimal-agent').build();

      expect(manifest.kind).toBe('Agent');
      expect(manifest.metadata.name).toBe('minimal-agent');
      expect(manifest.spec).toEqual({});
    });

    it('should handle empty arrays for tools and capabilities', () => {
      const manifest = ManifestBuilder.agent('theagentformerly-known-asprince')
        .tools([])
        .capabilities([])
        .build();

      expect(manifest.spec.tools).toEqual([]);
      expect(manifest.spec.capabilities).toEqual([]);
    });
  });
});
