/**
 * GitLab Duo External Agent Generator Integration Tests
 */

import { describe, it, expect } from '@jest/globals';
import { ExternalAgentGenerator } from '../../../src/adapters/gitlab/external-agent-generator.js';
import type { OssaAgent } from '../../../src/types/index.js';

describe('ExternalAgentGenerator', () => {
  const generator = new ExternalAgentGenerator();

  describe('generate()', () => {
    it('should generate valid external agent configuration for Node.js agent', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'Test external agent with AI Gateway integration',
        },
        spec: {
          role: 'You are a helpful assistant',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.3,
            maxTokens: 8192,
          },
          runtime: {
            type: 'webhook',
            port: 9090,
            path: '/webhook/test-agent',
          },
          tools: [{ name: 'search', description: 'Search for information' }],
        },
      };

      const result = generator.generate(manifest);

      // Verify generation succeeded
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.config).toBeDefined();
      expect(result.yaml).toBeDefined();

      // Verify config structure
      const config = result.config!;
      expect(config.image).toBe('node:22-slim');
      expect(config.commands).toEqual([
        'npm ci',
        'npm run build',
        'node dist/index.js',
      ]);
      expect(config.injectGatewayToken).toBe(true);

      // Verify variables
      expect(config.variables).toContain('GITLAB_TOKEN');
      expect(config.variables).toContain('GITLAB_HOST');
      expect(config.variables).toContain('AI_FLOW_CONTEXT');
      expect(config.variables).toContain('AI_FLOW_INPUT');
      expect(config.variables).toContain('AI_FLOW_EVENT');
    });

    it('should generate configuration for Python agent', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'python-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Python agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4o',
          },
          runtime: {
            type: 'python',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.image).toBe('python:3.12-slim');
      expect(result.config!.commands).toEqual([
        'pip install --no-cache-dir -r requirements.txt',
        'python main.py',
      ]);
    });

    it('should generate configuration for Go agent', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'go-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Go agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          runtime: {
            type: 'go',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.image).toBe('golang:1.22-alpine');
      expect(result.config!.commands).toEqual([
        'go build -o agent .',
        './agent',
      ]);
    });

    it('should generate configuration for Ruby agent', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'ruby-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Ruby agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          runtime: {
            type: 'ruby',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.image).toBe('ruby:3.3-slim');
      expect(result.config!.commands).toEqual([
        'bundle install',
        'bundle exec ruby main.rb',
      ]);
    });

    it('should use explicit Docker image when provided', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'custom-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Custom agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          runtime: {
            type: 'custom',
            image: 'my-custom-image:latest',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.image).toBe('my-custom-image:latest');
    });

    it('should use explicit commands when provided', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'custom-commands-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Custom commands agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          runtime: {
            type: 'nodejs',
            command: ['npm install', 'npm start'],
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.commands).toEqual(['npm install', 'npm start']);
    });

    it('should extract variables from workflow steps', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'workflow-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Workflow agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          workflow: {
            steps: [
              {
                id: 'step1',
                action: 'tool-invoke',
                tool: 'search',
                params: {
                  projectId: '${PROJECT_ID}',
                  mrIid: '${MR_IID}',
                },
              },
              {
                id: 'step2',
                action: 'llm-invoke',
                input: 'Review MR ${MR_IID} in project ${PROJECT_ID}',
              },
            ],
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.variables).toContain('PROJECT_ID');
      expect(result.config!.variables).toContain('MR_IID');
    });

    it('should inject AI Gateway token for agents with LLM', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'llm-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'LLM agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.injectGatewayToken).toBe(true);
    });

    it('should not inject AI Gateway token for agents without LLM', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'no-llm-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Agent without LLM',
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.injectGatewayToken).toBe(false);
    });

    it('should extract variables from GitLab extensions', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'extension-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Extension agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [],
        },
        extensions: {
          gitlab: {
            variables: ['CUSTOM_VAR1', 'CUSTOM_VAR2'],
          },
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.variables).toContain('CUSTOM_VAR1');
      expect(result.config!.variables).toContain('CUSTOM_VAR2');
    });

    it('should extract credential variables from tool auth', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'auth-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Auth agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [
            {
              name: 'api-tool',
              auth: {
                type: 'bearer',
                credentials: 'API_TOKEN',
              },
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.variables).toContain('API_TOKEN');
    });

    it('should detect Node.js runtime from MCP tools', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'mcp-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'MCP agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [
            {
              type: 'mcp',
              name: 'filesystem',
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.image).toBe('node:22-slim');
    });

    it('should detect Python runtime from pip tools', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'pip-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Pip agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [
            {
              type: 'pip',
              name: 'requests',
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config!.image).toBe('python:3.12-slim');
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
          description: 'Test YAML generation for external agents',
        },
        spec: {
          role: 'You are a test agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            temperature: 0.5,
            maxTokens: 4096,
          },
          runtime: {
            type: 'webhook',
            port: 9090,
            path: '/webhook/test',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      const yaml = result.yaml!;

      // Verify YAML structure
      expect(yaml).toContain('# GitLab Duo External Agent Configuration');
      expect(yaml).toContain('name: yaml-test-agent');
      expect(yaml).toContain('description:');
      expect(yaml).toContain('image: node:22-slim');
      expect(yaml).toContain('commands:');
      expect(yaml).toContain('- npm ci');
      expect(yaml).toContain('- npm run build');
      expect(yaml).toContain('- node dist/index.js');
      expect(yaml).toContain('variables:');
      expect(yaml).toContain('- GITLAB_TOKEN');
      expect(yaml).toContain('- AI_FLOW_CONTEXT');
      expect(yaml).toContain('injectGatewayToken: true');
      expect(yaml).toContain('llm:');
      expect(yaml).toContain('provider: anthropic');
      expect(yaml).toContain('model: claude-sonnet-4-20250514');
      expect(yaml).toContain('temperature: 0.5');
      expect(yaml).toContain('max_tokens: 4096');
      expect(yaml).toContain('runtime:');
      expect(yaml).toContain('type: webhook');
      expect(yaml).toContain('port: 9090');
      expect(yaml).toContain('path: /webhook/test');
      expect(yaml).toContain('# Usage:');
      expect(yaml).toContain('glab duo agent register');
    });

    it('should escape YAML strings with special characters', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'escape-test',
          version: '1.0.0',
          description: 'Test with: colons and "quotes" and #comments',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      const yaml = result.yaml!;

      // Description should be quoted due to special characters
      expect(yaml).toContain(
        '"Test with: colons and \\"quotes\\" and #comments"'
      );
    });

    it('should handle missing LLM configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'no-llm',
          version: '1.0.0',
        },
        spec: {
          role: 'Agent without LLM',
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      const yaml = result.yaml!;

      // Should not contain LLM configuration
      expect(yaml).not.toContain('llm:');
      expect(yaml).not.toContain('injectGatewayToken: true');
    });

    it('should handle missing runtime configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'no-runtime',
          version: '1.0.0',
        },
        spec: {
          role: 'Agent without explicit runtime',
          llm: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      const yaml = result.yaml!;

      // Should not contain runtime configuration section
      expect(yaml).not.toContain('runtime:');
      expect(yaml).not.toContain('type: webhook');
    });

    it('should include OpenAI provider configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.4',
        kind: 'Agent',
        metadata: {
          name: 'openai-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'OpenAI agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4o',
            temperature: 0.7,
            maxTokens: 8192,
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      const yaml = result.yaml!;

      expect(yaml).toContain('provider: openai');
      expect(yaml).toContain('model: gpt-4o');
      expect(yaml).toContain('temperature: 0.7');
      expect(yaml).toContain('max_tokens: 8192');
    });
  });

  describe('error handling', () => {
    it('should handle invalid manifest gracefully', () => {
      const manifest = {} as OssaAgent;

      const result = generator.generate(manifest);

      // Should still succeed with defaults
      expect(result.success).toBe(true);
    });

    it('should handle manifest with minimal data', () => {
      const manifest: OssaAgent = {
        metadata: {
          name: 'minimal',
        },
        spec: {
          role: 'Minimal agent',
        },
      };

      const result = generator.generate(manifest);

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.yaml).toBeDefined();
    });
  });
});
