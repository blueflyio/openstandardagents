/**
 * Tests for Production-Quality LangChain Tools Generator (v0.4.1)
 *
 * Tests:
 * - Pydantic model generation
 * - Async tool support
 * - Type hints and validation
 * - Error handling
 * - Multiple tool types (API, MCP, function)
 */

import { ToolsGenerator } from '../../../../../src/services/export/langchain/tools-generator.js';
import type { OssaAgent } from '../../../../../src/types/index.js';
import { API_VERSION } from '../../../src/version.js';

describe('ToolsGenerator - Production Quality (v0.4.1)', () => {
  const generator = new ToolsGenerator();

  describe('Pydantic Models', () => {
    it('should generate Pydantic models for tools with schemas', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'search_docs',
              description: 'Search documentation',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Search query',
                  },
                  max_results: {
                    type: 'integer',
                    description: 'Max results',
                    default: 10,
                  },
                },
                required: ['query'],
              },
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // Should contain Pydantic model
      expect(result).toContain('class SearchDocsInput(BaseModel):');
      expect(result).toContain(
        'query: str = Field(..., description="Search query")'
      );
      expect(result).toContain(
        'max_results: Optional[int] = Field(10, description="Max results")'
      );
    });

    it('should handle boolean default values correctly', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'analyze',
              description: 'Analyze text',
              parameters: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Text to analyze',
                  },
                  include_summary: {
                    type: 'boolean',
                    description: 'Include summary',
                    default: true,
                  },
                  verbose: {
                    type: 'boolean',
                    description: 'Verbose mode',
                    default: false,
                  },
                },
                required: ['text'],
              },
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // Python booleans should be capitalized
      expect(result).toContain('Field(True, description="Include summary")');
      expect(result).toContain('Field(False, description="Verbose mode")');
      expect(result).not.toContain('Field(true,');
      expect(result).not.toContain('Field(false,');
    });

    it('should handle enums in Pydantic models', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'notify',
              description: 'Send notification',
              parameters: {
                type: 'object',
                properties: {
                  priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'Priority level',
                  },
                },
                required: ['priority'],
              },
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // Enum should be documented in type hint
      expect(result).toContain('Enum:');
      expect(result).toContain('["low","medium","high"]');
    });
  });

  describe('Async Tool Support', () => {
    it('should generate async functions for API tools', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'api',
              name: 'fetch_data',
              description: 'Fetch data from API',
              endpoint: 'https://api.example.com/data',
              method: 'GET',
              parameters: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Data ID',
                  },
                },
                required: ['id'],
              },
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // Should be async function
      expect(result).toContain('async def fetch_data(');
      expect(result).toContain('async with httpx.AsyncClient()');
      expect(result).toContain('await client.request(');
    });

    it('should generate async functions for MCP tools', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'mcp',
              name: 'query_db',
              description: 'Query database',
              server: 'mcp-server',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'SQL query',
                  },
                },
                required: ['query'],
              },
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // Should be async function
      expect(result).toContain('async def query_db(');
      expect(result).toContain('asyncio.create_subprocess_exec');
      expect(result).toContain('await asyncio.wait_for(');
    });

    it('should generate sync functions for function tools', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'process_text',
              description: 'Process text',
              parameters: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Text to process',
                  },
                },
                required: ['text'],
              },
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // Should be sync function (no async)
      expect(result).toContain('def process_text(');
      expect(result).not.toContain('async def process_text(');
    });
  });

  describe('Production-Ready Features', () => {
    it('should include logging statements', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'test_tool',
              description: 'Test tool',
              parameters: {
                type: 'object',
                properties: {
                  input: {
                    type: 'string',
                    description: 'Input',
                  },
                },
                required: ['input'],
              },
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      expect(result).toContain('import logging');
      expect(result).toContain('logger = logging.getLogger(__name__)');
      expect(result).toContain('logger.info(');
      expect(result).toContain('logger.error(');
    });

    it('should include error handling', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'api',
              name: 'api_call',
              description: 'Make API call',
              endpoint: 'https://api.example.com',
              method: 'POST',
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // Should have comprehensive error handling
      expect(result).toContain('try:');
      expect(result).toContain('except httpx.TimeoutException:');
      expect(result).toContain('except httpx.HTTPStatusError');
      expect(result).toContain('except Exception as e:');
      expect(result).toContain('exc_info=True');
    });

    it('should have no TODO comments', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'tool1',
              description: 'Tool 1',
            },
            {
              type: 'api',
              name: 'tool2',
              description: 'Tool 2',
              endpoint: 'https://api.example.com',
            },
            {
              type: 'mcp',
              name: 'tool3',
              description: 'Tool 3',
              server: 'mcp-server',
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // No TODOs - production ready
      expect(result).not.toContain('TODO:');
      expect(result).not.toContain('TODO ');
      expect(result).not.toContain('FIXME');
    });

    it('should return structured Dict responses', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'test_tool',
              description: 'Test',
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      // Should return Dict[str, Any] not str
      expect(result).toContain('-> Dict[str, Any]:');
      expect(result).toContain('"status": "success"');
      expect(result).toContain('"status": "error"');
      expect(result).toContain('"tool":');
      expect(result).toContain('"error_type":');
    });
  });

  describe('Empty Tools', () => {
    it('should handle agents with no tools', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [],
        },
      };

      const result = generator.generate(manifest);

      expect(result).toContain('No tools configured');
      expect(result).toContain('def get_tools() -> List:');
      expect(result).toContain('return []');
    });
  });

  describe('Tool Registry', () => {
    it('should generate get_tools() function with all tools', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Test agent',
          llm: {
            provider: 'openai',
            model: 'gpt-4',
          },
          tools: [
            {
              type: 'function',
              name: 'tool_one',
              description: 'Tool 1',
            },
            {
              type: 'function',
              name: 'tool_two',
              description: 'Tool 2',
            },
            {
              type: 'function',
              name: 'tool_three',
              description: 'Tool 3',
            },
          ],
        },
      };

      const result = generator.generate(manifest);

      expect(result).toContain('def get_tools() -> List:');
      expect(result).toContain('tool_one,');
      expect(result).toContain('tool_two,');
      expect(result).toContain('tool_three,');
    });
  });
});
