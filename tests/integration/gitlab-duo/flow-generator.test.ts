/**
 * GitLab Duo Flow Generator Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { GitLabDuoFlowGenerator } from '../../../src/adapters/gitlab/flow-generator.js';
import type { OssaAgent } from '../../../src/types/index.js';

describe('GitLabDuoFlowGenerator', () => {
  const generator = new GitLabDuoFlowGenerator();

  describe('generate()', () => {
    it('should generate valid Flow Registry v1 configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'Test agent for flow generation',
        },
        spec: {
          role: 'You are a helpful code review assistant',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.7,
            maxTokens: 4096,
          },
          autonomy: {
            level: 'supervised',
            approvalRequired: ['critical-actions'],
            maxTurns: 10,
          },
          tools: [
            {
              name: 'search',
              description: 'Search for information',
            },
          ],
        },
      };

      const flow = generator.generate(manifest);

      // Verify top-level structure
      expect(flow.version).toBe('v1');
      expect(flow.environment).toBe('chat'); // supervised = chat
      expect(flow.name).toBe('test-agent');
      expect(flow.description).toBe('Test agent for flow generation');
      expect(flow.product_group).toBe('agent_foundations');

      // Verify components
      expect(flow.components).toHaveLength(1);
      expect(flow.components[0].type).toBe('AgentComponent');
      expect(flow.components[0].name).toBe('test_agent');
      expect(flow.components[0].prompt_id).toBe('test_agent_prompt');

      // Verify routers
      expect(flow.routers).toHaveLength(1);
      expect(flow.routers[0].from).toBe('test_agent');
      expect(flow.routers[0].to).toBe('end');

      // Verify prompts
      expect(flow.prompts).toHaveLength(1);
      expect(flow.prompts![0].prompt_id).toBe('test_agent_prompt');
      expect(flow.prompts![0].model.params.model_class_provider).toBe('anthropic');
      expect(flow.prompts![0].model.params.model).toBe('claude-sonnet-4-20250514');
      expect(flow.prompts![0].prompt_template.system).toBe('You are a helpful code review assistant');

      // Verify flow entry point
      expect(flow.flow.entry_point).toBe('test_agent');
    });

    it('should detect ambient environment for autonomous agents', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'autonomous-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'You are an autonomous agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          autonomy: {
            level: 'autonomous',
            approvalRequired: [], // No approval needed
            maxTurns: 50,
          },
          tools: [],
        },
      };

      const flow = generator.generate(manifest);
      expect(flow.environment).toBe('ambient');
    });

    it('should detect chat-partial for single-turn agents with no tools', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'simple-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'You are a simple Q&A agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4o-mini',
          },
          autonomy: {
            level: 'supervised',
            maxTurns: 1,
          },
          tools: [],
        },
      };

      const flow = generator.generate(manifest);
      expect(flow.environment).toBe('chat-partial');
    });

    it('should map tools correctly', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'tool-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'You are a tool-using agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          autonomy: {
            level: 'supervised',
          },
          tools: [
            { name: 'read' },
            { name: 'write' },
            { name: 'search' },
            { name: 'create-issue' },
          ],
        },
      };

      const flow = generator.generate(manifest);
      const component = flow.components[0];

      // Should have mapped tools + default tools
      expect(component.toolset).toContain('read_file');
      expect(component.toolset).toContain('create_file_with_contents');
      expect(component.toolset).toContain('search_files');
      expect(component.toolset).toContain('create_issue');
      expect(component.toolset).toContain('list_dir');
    });

    it('should map OpenAI provider correctly', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'openai-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'You are an OpenAI agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4o',
            temperature: 0.5,
            maxTokens: 8192,
          },
          autonomy: {
            level: 'supervised',
          },
          tools: [],
        },
      };

      const flow = generator.generate(manifest);
      const prompt = flow.prompts![0];

      expect(prompt.model.params.model_class_provider).toBe('openai');
      expect(prompt.model.params.model).toBe('gpt-4o');
      expect(prompt.model.params.temperature).toBe(0.5);
      expect(prompt.model.params.max_tokens).toBe(8192);
    });
  });

  describe('generateYAML()', () => {
    it('should generate valid YAML string', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'yaml-test-agent',
          version: '1.0.0',
          description: 'Test YAML generation',
        },
        spec: {
          role: 'You are a test agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          autonomy: {
            level: 'supervised',
          },
          tools: [],
        },
      };

      const yaml = generator.generateYAML(manifest);

      // Verify YAML structure
      expect(yaml).toContain('version: v1');
      expect(yaml).toContain('environment: chat');
      expect(yaml).toContain('name: yaml-test-agent');
      expect(yaml).toContain('components:');
      expect(yaml).toContain('routers:');
      expect(yaml).toContain('prompts:');
      expect(yaml).toContain('flow:');
      expect(yaml).toContain('entry_point: yaml_test_agent');
    });
  });

  describe('name sanitization', () => {
    it('should sanitize agent names for Flow Registry', () => {
      const testCases = [
        { input: 'My Agent Name', expected: 'my_agent_name' },
        { input: 'agent-with-dashes', expected: 'agent_with_dashes' },
        { input: 'Agent@#$%123', expected: 'agent_123' },
        { input: '__leading_trailing__', expected: 'leading_trailing' },
        { input: 'multiple___underscores', expected: 'multiple_underscores' },
      ];

      for (const testCase of testCases) {
        const manifest: OssaAgent = {
          apiVersion: 'ossa/v0.4.4',
          kind: 'Agent',
          metadata: {
            name: testCase.input,
            version: '1.0.0',
          },
          spec: {
            role: 'Test',
            llm: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
            autonomy: { level: 'supervised' },
            tools: [],
          },
        };

        const flow = generator.generate(manifest);
        expect(flow.components[0].name).toBe(testCase.expected);
        expect(flow.flow.entry_point).toBe(testCase.expected);
      }
    });
  });
});
