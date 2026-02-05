/**
 * Tests for Production-Quality LangChain Memory Generator (v0.4.1)
 *
 * Tests:
 * - Buffer memory with window management
 * - Summary memory with token limits
 * - Entity memory with entity tracking
 * - Redis persistence with connection pooling
 * - PostgreSQL persistence with connection pooling
 * - Error handling and validation
 * - Health checks
 */

import {
  MemoryGenerator,
  type MemoryBackend,
} from '../../../../../src/services/export/langchain/memory-generator.js';
import type { OssaAgent } from '../../../../../src/types/index.js';

describe('MemoryGenerator - Production Quality (v0.4.1)', () => {
  const generator = new MemoryGenerator();

  describe('Configuration Parsing', () => {
    it('should parse full OSSA memory configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            type: 'conversation_buffer',
            window_size: 20,
            max_token_limit: 4000,
            return_messages: true,
            persistence: {
              enabled: true,
              backend: 'redis',
              ttl: 86400,
              connection: {
                url: 'redis://localhost:6379',
                pool_size: 10,
                timeout: 30,
              },
            },
          },
        },
      };

      const result = generator.generate(manifest, 'buffer');

      // Should include window size configuration
      expect(result).toContain('window_size=20');
      expect(result).toContain('ConversationBufferWindowMemory');
    });

    it('should handle disabled memory', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: false,
          },
        },
      };

      const result = generator.generate(manifest, 'buffer');

      expect(result).toContain('Memory is disabled');
      expect(result).toContain('def get_memory() -> None:');
    });

    it('should parse boolean values correctly', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            return_messages: true,
          },
        },
      };

      const result = generator.generate(manifest, 'buffer');

      // Python booleans should be capitalized
      expect(result).toContain('return_messages=True');
      expect(result).not.toContain('return_messages=true');
    });
  });

  describe('Buffer Memory', () => {
    it('should generate buffer memory with window management', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            type: 'conversation_buffer',
            window_size: 15,
          },
        },
      };

      const result = generator.generate(manifest, 'buffer');

      expect(result).toContain('ConversationBufferWindowMemory');
      expect(result).toContain('k=15');
      expect(result).toContain('def get_memory_stats(');
      expect(result).toContain('import logging');
      expect(result).toContain('logger =');
    });

    it('should include memory statistics function', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
          },
        },
      };

      const result = generator.generate(manifest, 'buffer');

      expect(result).toContain('def get_memory_stats(');
      expect(result).toContain('"type": "buffer_window"');
      expect(result).toContain('"message_count"');
    });
  });

  describe('Summary Memory', () => {
    it('should generate summary memory with token limits', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            type: 'conversation_summary',
            max_token_limit: 5000,
          },
        },
      };

      const result = generator.generate(manifest, 'summary');

      expect(result).toContain('ConversationSummaryBufferMemory');
      expect(result).toContain('max_token_limit=5000');
      expect(result).toContain('gpt-4o-mini');
      expect(result).toContain('def regenerate_summary(');
    });

    it('should include error handling for missing API key', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            type: 'conversation_summary',
          },
        },
      };

      const result = generator.generate(manifest, 'summary');

      expect(result).toContain('OPENAI_API_KEY');
      expect(result).toContain('if not api_key:');
      expect(result).toContain('ValueError');
    });
  });

  describe('Entity Memory', () => {
    it('should generate entity memory with entity tracking', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            type: 'entity',
          },
        },
      };

      const result = generator.generate(manifest, 'entity');

      expect(result).toContain('ConversationEntityMemory');
      expect(result).toContain('def get_entity_context(');
      expect(result).toContain('def list_entities(');
      expect(result).toContain('"entity_count"');
    });

    it('should include entity management functions', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            type: 'entity',
          },
        },
      };

      const result = generator.generate(manifest, 'entity');

      expect(result).toContain('def get_entity_context(');
      expect(result).toContain('def list_entities(');
      expect(result).toContain('entity_store');
    });
  });

  describe('Redis Persistence', () => {
    it('should generate Redis memory with connection pooling', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            persistence: {
              enabled: true,
              backend: 'redis',
              ttl: 3600,
            },
          },
        },
      };

      const result = generator.generate(manifest, 'redis');

      expect(result).toContain('RedisChatMessageHistory');
      expect(result).toContain('ttl=3600');
      expect(result).toContain('ConnectionPool');
      expect(result).toContain('def validate_redis_connection(');
      expect(result).toContain('def health_check(');
    });

    it('should include retry logic with exponential backoff', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            persistence: {
              enabled: true,
              backend: 'redis',
            },
          },
        },
      };

      const result = generator.generate(manifest, 'redis');

      expect(result).toContain('max_retries');
      expect(result).toContain('retry_delay');
      expect(result).toContain('2 ** attempt');
      expect(result).toContain('time.sleep(');
    });

    it('should include session management functions', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            persistence: {
              enabled: true,
              backend: 'redis',
            },
          },
        },
      };

      const result = generator.generate(manifest, 'redis');

      expect(result).toContain('def get_all_sessions(');
      expect(result).toContain('def delete_session(');
      expect(result).toContain('def get_memory_stats(');
    });
  });

  describe('PostgreSQL Persistence', () => {
    it('should generate PostgreSQL memory with connection pooling', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            persistence: {
              enabled: true,
              backend: 'postgres',
              connection: {
                pool_size: 20,
              },
            },
          },
        },
      };

      const result = generator.generate(manifest, 'postgres');

      expect(result).toContain('PostgresChatMessageHistory');
      expect(result).toContain('ThreadedConnectionPool');
      expect(result).toContain('maxconn=20');
      expect(result).toContain('def validate_postgres_connection(');
    });

    it('should include schema initialization', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            persistence: {
              enabled: true,
              backend: 'postgres',
            },
          },
        },
      };

      const result = generator.generate(manifest, 'postgres');

      expect(result).toContain('def initialize_schema(');
      expect(result).toContain('CREATE TABLE IF NOT EXISTS message_store');
    });

    it('should include export functionality', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            persistence: {
              enabled: true,
              backend: 'postgres',
            },
          },
        },
      };

      const result = generator.generate(manifest, 'postgres');

      expect(result).toContain('def export_session_history(');
      expect(result).toContain('format: str');
      expect(result).toContain('"json"');
      expect(result).toContain('"csv"');
    });
  });

  describe('Production-Ready Features', () => {
    it('should include comprehensive error handling', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
          },
        },
      };

      const result = generator.generate(manifest, 'redis');

      expect(result).toContain('try:');
      expect(result).toContain('except Exception as e:');
      expect(result).toContain('exc_info=True');
      expect(result).toContain('logger.error(');
    });

    it('should include structured logging', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
          },
        },
      };

      const result = generator.generate(manifest, 'buffer');

      expect(result).toContain('import logging');
      expect(result).toContain('logger = logging.getLogger(__name__)');
      expect(result).toContain('logger.info(');
    });

    it('should include health check functions', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.4.1',
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
          memory: {
            enabled: true,
            persistence: {
              enabled: true,
              backend: 'redis',
            },
          },
        },
      };

      const result = generator.generate(manifest, 'redis');

      expect(result).toContain('def health_check(');
      expect(result).toContain('"healthy"');
      expect(result).toContain('"latency_ms"');
    });
  });
});
