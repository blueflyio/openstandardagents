import { describe, it, expect, beforeEach } from '@jest/globals';
import { OpenAIAdapter } from '../../../../src/services/runtime/openai.adapter.js';
import type { OssaAgent } from '../../../../src/types/index.js';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let mockManifest: OssaAgent;

  beforeEach(() => {
    mockManifest = {
      apiVersion: 'ossa/v0.2.6',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4o-mini',
        },
        tools: [],
      },
    };

    process.env.OPENAI_API_KEY = 'sk-test-key';
    adapter = new OpenAIAdapter(mockManifest);
  });

  describe('initialize', () => {
    it('should initialize without error', () => {
      expect(() => adapter.initialize()).not.toThrow();
    });
  });

  describe('registerToolHandler', () => {
    it('should register tool handler', () => {
      const handler = async () => 'result';
      expect(() => adapter.registerToolHandler('test', handler)).not.toThrow();
    });

    it('should register multiple handlers', () => {
      expect(() => {
        adapter.registerToolHandler('tool1', async () => 'r1');
        adapter.registerToolHandler('tool2', async () => 'r2');
      }).not.toThrow();
    });
  });

  describe('getAgentInfo', () => {
    it('should return agent info', () => {
      const info = adapter.getAgentInfo();
      expect(info.name).toBe('test-agent');
      expect(info.model).toBe('gpt-4o-mini');
      expect(Array.isArray(info.tools)).toBe(true);
    });

    it('should return empty tools array when no tools configured', () => {
      // getAgentInfo returns tools from internal tools Map
      // registerToolHandler only adds handlers to existing tools, doesn't create new entries
      const info = adapter.getAgentInfo();
      expect(info.tools).toEqual([]);
    });
  });
});
