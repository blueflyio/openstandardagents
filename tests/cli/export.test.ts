/**
 * Export Command Unit Tests
 * Tests for the ossa export command functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { OssaAgent } from '../../src/types/index.js';
import { LangChainAdapter } from '../../src/adapters/langchain-adapter.js';
import { CrewAIAdapter } from '../../src/adapters/crewai-adapter.js';
import { LangflowAdapter } from '../../src/adapters/langflow-adapter.js';
import { OpenAPIAdapter } from '../../src/adapters/openapi-adapter.js';

describe('Export Adapters', () => {
  let testManifest: OssaAgent;

  beforeEach(() => {
    testManifest = {
      apiVersion: 'ossa/v0.3.0',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'A test agent for export functionality',
      },
      spec: {
        role: 'You are a helpful AI assistant that helps users with coding tasks.',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
        },
        tools: [
          {
            type: 'function',
            name: 'search',
            description: 'Search for information',
            input_schema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
              },
              required: ['query'],
            },
          },
          {
            type: 'function',
            name: 'calculate',
            description: 'Perform calculations',
            input_schema: {
              type: 'object',
              properties: {
                expression: { type: 'string' },
              },
            },
          },
        ],
      },
    };
  });

  describe('LangChain Adapter', () => {
    it('should convert OSSA manifest to LangChain format', () => {
      const result = LangChainAdapter.toLangChain(testManifest);

      expect(result).toBeDefined();
      expect(result.type).toBe('agent');
      expect(result.llm.model_name).toBe('gpt-4');
      expect(result.llm.temperature).toBe(0.7);
      expect(result.llm.max_tokens).toBe(2000);
      expect(result.tools).toHaveLength(2);
      expect(result.tools[0].name).toBe('search');
      expect(result.tools[1].name).toBe('calculate');
    });

    it('should determine correct agent type based on role', () => {
      const result = LangChainAdapter.toLangChain(testManifest);
      expect(result.agent_type).toBe('zero-shot-react-description');
    });

    it('should generate Python code', () => {
      const code = LangChainAdapter.toPythonCode(testManifest);

      expect(code).toContain('from langchain.agents import initialize_agent');
      expect(code).toContain('ChatOpenAI');
      expect(code).toContain('model_name="gpt-4"');
      expect(code).toContain('temperature=0.7');
      expect(code).toContain('Tool(');
      expect(code).toContain('name="search"');
    });

    it('should handle manifest without tools', () => {
      const noToolsManifest = { ...testManifest };
      noToolsManifest.spec = { ...testManifest.spec, tools: [] };

      const result = LangChainAdapter.toLangChain(noToolsManifest);
      expect(result.tools).toHaveLength(0);
    });

    it('should handle manifest without LLM config', () => {
      const noLLMManifest = { ...testManifest };
      noLLMManifest.spec = { role: 'Test', tools: [] };

      const result = LangChainAdapter.toLangChain(noLLMManifest);
      expect(result.llm.model_name).toBe('gpt-3.5-turbo'); // Default
    });
  });

  describe('CrewAI Adapter', () => {
    it('should convert OSSA manifest to CrewAI format', () => {
      const result = CrewAIAdapter.toCrewAI(testManifest);

      expect(result).toBeDefined();
      expect(result.role).toBeDefined();
      expect(result.goal).toBeDefined();
      expect(result.backstory).toBeDefined();
      expect(result.tools).toHaveLength(2);
      expect(result.tools).toContain('search');
      expect(result.tools).toContain('calculate');
      expect(result.llm?.model).toBe('gpt-4');
    });

    it('should parse role text into components', () => {
      const result = CrewAIAdapter.toCrewAI(testManifest);

      expect(result.role).toBeTruthy();
      expect(result.goal).toBeTruthy();
      expect(result.backstory).toBeTruthy();
    });

    it('should generate Python code', () => {
      const code = CrewAIAdapter.toPythonCode(testManifest);

      expect(code).toContain('from crewai import Agent, Task, Crew');
      expect(code).toContain('Agent(');
      expect(code).toContain('role=');
      expect(code).toContain('goal=');
      expect(code).toContain('backstory=');
      expect(code).toContain('llm=llm');
    });

    it('should set default values correctly', () => {
      const result = CrewAIAdapter.toCrewAI(testManifest);

      expect(result.verbose).toBe(true);
      expect(result.allow_delegation).toBe(false);
      expect(result.max_iter).toBe(15);
    });

    it('should convert workflow to crew', () => {
      const crew = CrewAIAdapter.workflowToCrew(testManifest);

      expect(crew.agents).toHaveLength(1);
      expect(crew.tasks).toHaveLength(1);
      expect(crew.process).toBe('sequential');
      expect(crew.verbose).toBe(true);
    });
  });

  describe('Langflow Adapter', () => {
    it('should convert OSSA manifest to Langflow format', () => {
      const result = LangflowAdapter.toLangflow(testManifest);

      expect(result).toBeDefined();
      expect(result.name).toBe('test-agent');
      expect(result.description).toBe('A test agent for export functionality');
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
    });

    it('should create nodes for LLM, prompt, and agent', () => {
      const result = LangflowAdapter.toLangflow(testManifest);

      const llmNode = result.nodes.find((n) => n.id === 'llm-1');
      const promptNode = result.nodes.find((n) => n.id === 'prompt-1');
      const agentNode = result.nodes.find((n) => n.id === 'agent-1');

      expect(llmNode).toBeDefined();
      expect(promptNode).toBeDefined();
      expect(agentNode).toBeDefined();
    });

    it('should create tool nodes for each tool', () => {
      const result = LangflowAdapter.toLangflow(testManifest);

      const toolNodes = result.nodes.filter((n) => n.id.startsWith('tool-'));
      expect(toolNodes).toHaveLength(2);
    });

    it('should create edges connecting nodes', () => {
      const result = LangflowAdapter.toLangflow(testManifest);

      expect(result.edges.length).toBeGreaterThan(0);

      // Check for LLM to agent edge
      const llmToAgent = result.edges.find((e) => e.source === 'llm-1' && e.target === 'agent-1');
      expect(llmToAgent).toBeDefined();
    });

    it('should generate valid JSON', () => {
      const json = LangflowAdapter.toJSON(testManifest);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.name).toBe('test-agent');
      expect(parsed.data.nodes).toBeDefined();
    });

    it('should create simple flow', () => {
      const result = LangflowAdapter.toSimpleFlow(testManifest);

      expect(result.nodes).toHaveLength(3); // prompt, llm, output
      expect(result.edges).toHaveLength(2);
    });
  });

  describe('OpenAPI Adapter', () => {
    it('should convert OSSA manifest to OpenAPI format', () => {
      const result = OpenAPIAdapter.toOpenAPI(testManifest);

      expect(result).toBeDefined();
      expect(result.openapi).toBe('3.1.0');
      expect(result.info.title).toBe('test-agent');
      expect(result.info.version).toBe('1.0.0');
      expect(result.paths).toBeDefined();
    });

    it('should create paths for each tool', () => {
      const result = OpenAPIAdapter.toOpenAPI(testManifest);

      expect(result.paths['/tools/search']).toBeDefined();
      expect(result.paths['/tools/calculate']).toBeDefined();
    });

    it('should create chat endpoint', () => {
      const result = OpenAPIAdapter.toOpenAPI(testManifest);

      expect(result.paths['/chat']).toBeDefined();
      expect(result.paths['/chat'].post).toBeDefined();
      expect(result.paths['/chat'].post.operationId).toBe('chat');
    });

    it('should define request and response schemas', () => {
      const result = OpenAPIAdapter.toOpenAPI(testManifest);

      const searchOp = result.paths['/tools/search'].post;
      expect(searchOp.requestBody).toBeDefined();
      expect(searchOp.responses['200']).toBeDefined();
      expect(searchOp.responses['400']).toBeDefined();
      expect(searchOp.responses['500']).toBeDefined();
    });

    it('should include security schemes', () => {
      const result = OpenAPIAdapter.toOpenAPI(testManifest);

      expect(result.components?.securitySchemes).toBeDefined();
      expect(result.components?.securitySchemes?.bearerAuth).toBeDefined();
      expect(result.components?.securitySchemes?.apiKey).toBeDefined();
    });

    it('should include servers', () => {
      const result = OpenAPIAdapter.toOpenAPI(testManifest);

      expect(result.servers).toBeDefined();
      expect(result.servers?.length).toBeGreaterThan(0);
    });

    it('should include tags', () => {
      const result = OpenAPIAdapter.toOpenAPI(testManifest);

      expect(result.tags).toBeDefined();
      expect(result.tags?.some((t) => t.name === 'chat')).toBe(true);
      expect(result.tags?.some((t) => t.name === 'tools')).toBe(true);
    });

    it('should handle tools without input schema', () => {
      const noSchemaManifest = { ...testManifest };
      noSchemaManifest.spec = {
        ...testManifest.spec,
        tools: [
          {
            type: 'function',
            name: 'simple-tool',
            description: 'A simple tool',
          },
        ],
      };

      const result = OpenAPIAdapter.toOpenAPI(noSchemaManifest);
      expect(result.paths['/tools/simple-tool']).toBeDefined();
    });

    it('should normalize schemas correctly', () => {
      const result = OpenAPIAdapter.toOpenAPI(testManifest);

      const searchSchema =
        result.paths['/tools/search'].post.requestBody?.content['application/json'].schema;
      expect(searchSchema).toBeDefined();
      expect(searchSchema.type).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing metadata gracefully', () => {
      const noMetadata: OssaAgent = {
        apiVersion: 'ossa/v0.3.0',
        kind: 'Agent',
        spec: {
          role: 'Test',
          tools: [],
        },
      };

      expect(() => LangChainAdapter.toLangChain(noMetadata)).not.toThrow();
      expect(() => CrewAIAdapter.toCrewAI(noMetadata)).not.toThrow();
      expect(() => LangflowAdapter.toLangflow(noMetadata)).not.toThrow();
      expect(() => OpenAPIAdapter.toOpenAPI(noMetadata)).not.toThrow();
    });

    it('should handle missing spec gracefully', () => {
      const noSpec: OssaAgent = {
        apiVersion: 'ossa/v0.3.0',
        kind: 'Agent',
        metadata: {
          name: 'test',
          version: '1.0.0',
        },
      };

      expect(() => LangChainAdapter.toLangChain(noSpec)).not.toThrow();
      expect(() => CrewAIAdapter.toCrewAI(noSpec)).not.toThrow();
      expect(() => LangflowAdapter.toLangflow(noSpec)).not.toThrow();
      expect(() => OpenAPIAdapter.toOpenAPI(noSpec)).not.toThrow();
    });

    it('should handle empty tools array', () => {
      const emptyTools = { ...testManifest };
      emptyTools.spec = { ...testManifest.spec, tools: [] };

      const langchain = LangChainAdapter.toLangChain(emptyTools);
      const crewai = CrewAIAdapter.toCrewAI(emptyTools);
      const langflow = LangflowAdapter.toLangflow(emptyTools);
      const openapi = OpenAPIAdapter.toOpenAPI(emptyTools);

      expect(langchain.tools).toHaveLength(0);
      expect(crewai.tools).toHaveLength(0);
      expect(langflow.nodes).toBeDefined();
      expect(openapi.paths['/chat']).toBeDefined();
    });
  });
});
