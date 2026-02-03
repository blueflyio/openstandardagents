/**
 * LangChain Exporter Tests
 *
 * Tests for production-quality LangChain export system
 * Coverage: >80%
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LangChainExporter } from '../../../../src/services/export/langchain/langchain-exporter.js';
import type { OssaAgent } from '../../../../src/types/index.js';

describe('LangChainExporter', () => {
  let exporter: LangChainExporter;

  beforeEach(() => {
    exporter = new LangChainExporter();
  });

  describe('export', () => {
    it('should export minimal agent', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'Test agent',
        },
        spec: {
          role: 'You are a test agent',
        },
      };

      const result = await exporter.export(manifest);

      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.metadata?.pythonVersion).toBe('3.11');
    });

    it('should generate agent.py', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'chat-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'You are a helpful assistant',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
          },
        },
      };

      const result = await exporter.export(manifest);

      const agentFile = result.files.find((f) => f.path === 'agent.py');
      expect(agentFile).toBeDefined();
      expect(agentFile?.content).toContain('def create_agent()');
      expect(agentFile?.content).toContain('def run(');
      expect(agentFile?.content).toContain('gpt-4');
    });

    it('should generate tools.py', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'tool-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Agent with tools',
          tools: [
            {
              name: 'search',
              description: 'Search the web',
              type: 'function',
            },
          ],
        },
      };

      const result = await exporter.export(manifest);

      const toolsFile = result.files.find((f) => f.path === 'tools.py');
      expect(toolsFile).toBeDefined();
      expect(toolsFile?.content).toContain('@tool');
      expect(toolsFile?.content).toContain('def search(');
      expect(toolsFile?.content).toContain('get_tools()');
    });

    it('should generate memory.py', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'memory-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Agent with memory',
        },
      };

      const result = await exporter.export(manifest, {
        memoryBackend: 'buffer',
      });

      const memoryFile = result.files.find((f) => f.path === 'memory.py');
      expect(memoryFile).toBeDefined();
      expect(memoryFile?.content).toContain('def get_memory()');
      expect(memoryFile?.content).toContain('ConversationBufferMemory');
    });

    it('should generate FastAPI server when includeApi=true', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'api-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'API agent',
        },
      };

      const result = await exporter.export(manifest, {
        includeApi: true,
      });

      const serverFile = result.files.find((f) => f.path === 'server.py');
      expect(serverFile).toBeDefined();
      expect(serverFile?.content).toContain('FastAPI');
      expect(serverFile?.content).toContain('@app.post("/chat"');
      expect(serverFile?.content).toContain('ChatRequest');
      expect(serverFile?.content).toContain('ChatResponse');
    });

    it('should generate OpenAPI spec when includeOpenApi=true', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'openapi-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'OpenAPI agent',
        },
      };

      const result = await exporter.export(manifest, {
        includeOpenApi: true,
      });

      const openapiFile = result.files.find((f) => f.path === 'openapi.yaml');
      expect(openapiFile).toBeDefined();
      expect(openapiFile?.content).toContain('openapi: 3.1.0');
      expect(openapiFile?.content).toContain('/chat');
      expect(openapiFile?.content).toContain('ChatRequest');
    });

    it('should generate Docker files when includeDocker=true', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'docker-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Docker agent',
        },
      };

      const result = await exporter.export(manifest, {
        includeDocker: true,
      });

      const dockerfile = result.files.find((f) => f.path === 'Dockerfile');
      expect(dockerfile).toBeDefined();
      expect(dockerfile?.content).toContain('FROM python:');
      expect(dockerfile?.content).toContain('uvicorn');

      const dockerCompose = result.files.find(
        (f) => f.path === 'docker-compose.yaml'
      );
      expect(dockerCompose).toBeDefined();
      expect(dockerCompose?.content).toContain('version:');
      expect(dockerCompose?.content).toContain('services:');
    });

    it('should generate requirements.txt', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'req-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Requirements agent',
          llm: {
            provider: 'anthropic',
            model: 'claude-3',
          },
        },
      };

      const result = await exporter.export(manifest);

      const reqFile = result.files.find((f) => f.path === 'requirements.txt');
      expect(reqFile).toBeDefined();
      expect(reqFile?.content).toContain('langchain');
      expect(reqFile?.content).toContain('langchain-anthropic');
    });

    it('should generate .env.example', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'env-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Env agent',
        },
      };

      const result = await exporter.export(manifest);

      const envFile = result.files.find((f) => f.path === '.env.example');
      expect(envFile).toBeDefined();
      expect(envFile?.content).toContain('OPENAI_API_KEY');
      expect(envFile?.content).toContain('ANTHROPIC_API_KEY');
    });

    it('should generate README.md', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'readme-agent',
          version: '1.0.0',
          description: 'Agent with README',
        },
        spec: {
          role: 'README agent',
          tools: [
            { name: 'search', description: 'Search tool', type: 'function' },
          ],
        },
      };

      const result = await exporter.export(manifest);

      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile).toBeDefined();
      expect(readmeFile?.content).toContain('# readme-agent');
      expect(readmeFile?.content).toContain('Agent with README');
      expect(readmeFile?.content).toContain('search');
    });

    it('should generate tests when includeTests=true', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'test-gen-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test generation agent',
        },
      };

      const result = await exporter.export(manifest, {
        includeTests: true,
      });

      const testFile = result.files.find((f) => f.path === 'test_agent.py');
      expect(testFile).toBeDefined();
      expect(testFile?.content).toContain('import pytest');
      expect(testFile?.content).toContain('def test_agent_creation()');
      expect(testFile?.content).toContain('def test_agent_run()');
    });

    it('should handle different memory backends', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'redis-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Redis agent',
        },
      };

      const result = await exporter.export(manifest, {
        memoryBackend: 'redis',
      });

      const memoryFile = result.files.find((f) => f.path === 'memory.py');
      expect(memoryFile?.content).toContain('RedisChatMessageHistory');
      expect(memoryFile?.content).toContain('REDIS_URL');

      const dockerCompose = result.files.find(
        (f) => f.path === 'docker-compose.yaml'
      );
      expect(dockerCompose?.content).toContain('redis:');
    });

    it('should handle postgres memory backend', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'postgres-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Postgres agent',
        },
      };

      const result = await exporter.export(manifest, {
        memoryBackend: 'postgres',
      });

      const memoryFile = result.files.find((f) => f.path === 'memory.py');
      expect(memoryFile?.content).toContain('PostgresChatMessageHistory');
      expect(memoryFile?.content).toContain('POSTGRES_URL');
    });

    it('should validate manifest and return error on invalid', async () => {
      const invalidManifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: '',
        },
        spec: {},
      };

      const result = await exporter.export(invalidManifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.files.length).toBe(0);
    });

    it('should include metadata in result', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'meta-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Metadata agent',
          tools: [
            { name: 'tool1', type: 'function' },
            { name: 'tool2', type: 'function' },
          ],
        },
      };

      const result = await exporter.export(manifest);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.pythonVersion).toBe('3.11');
      expect(result.metadata?.langchainVersion).toBe('0.1.0');
      expect(result.metadata?.toolsCount).toBe(2);
      expect(result.metadata?.hasApi).toBe(true);
      expect(result.metadata?.hasOpenApi).toBe(true);
      expect(result.metadata?.duration).toBeGreaterThan(0);
    });

    it('should handle custom Python version', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'py-version-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Python version agent',
        },
      };

      const result = await exporter.export(manifest, {
        pythonVersion: '3.12',
      });

      const dockerfile = result.files.find((f) => f.path === 'Dockerfile');
      expect(dockerfile?.content).toContain('python:3.12-slim');
    });

    it('should handle MCP tools', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'mcp-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'MCP agent',
          tools: [
            {
              name: 'filesystem',
              type: 'mcp',
              description: 'File system access',
              config: {
                server: 'npx -y @modelcontextprotocol/server-filesystem',
              },
            },
          ],
        },
      };

      const result = await exporter.export(manifest);

      const toolsFile = result.files.find((f) => f.path === 'tools.py');
      expect(toolsFile?.content).toContain('@tool');
      expect(toolsFile?.content).toContain('def filesystem(');
      expect(toolsFile?.content).toContain('MCP');
    });

    it('should handle API tools', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'api-tool-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'API tool agent',
          tools: [
            {
              name: 'weather_api',
              type: 'api',
              description: 'Get weather data',
              config: {
                endpoint: 'https://api.weather.com/data',
                method: 'GET',
              },
            },
          ],
        },
      };

      const result = await exporter.export(manifest);

      const toolsFile = result.files.find((f) => f.path === 'tools.py');
      expect(toolsFile?.content).toContain('def weather_api(');
      expect(toolsFile?.content).toContain('httpx');
    });

    it('should handle no tools gracefully', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'no-tools-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Agent without tools',
        },
      };

      const result = await exporter.export(manifest);

      const toolsFile = result.files.find((f) => f.path === 'tools.py');
      expect(toolsFile?.content).toContain('def get_tools()');
      expect(toolsFile?.content).toContain('return []');
    });

    it('should support custom API port', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'port-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Custom port agent',
        },
      };

      const result = await exporter.export(manifest, {
        apiPort: 9000,
      });

      const serverFile = result.files.find((f) => f.path === 'server.py');
      expect(serverFile?.content).toContain('9000');
    });

    it('should generate valid Python syntax', async () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.6',
        kind: 'Agent',
        metadata: {
          name: 'syntax-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Syntax validation agent',
          tools: [
            { name: 'tool_one', type: 'function' },
            { name: 'tool-two', type: 'function' }, // Should convert to tool_two
          ],
        },
      };

      const result = await exporter.export(manifest);

      const toolsFile = result.files.find((f) => f.path === 'tools.py');
      expect(toolsFile?.content).toContain('def tool_one(');
      expect(toolsFile?.content).toContain('def tool_two('); // Hyphen converted to underscore
    });
  });
});
