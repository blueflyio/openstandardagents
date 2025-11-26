/**
 * OpenAI Adapter Unit Tests
 * Test the OpenAI runtime adapter functionality
 * 
 * NOTE: These tests require OPENAI_API_KEY environment variable
 */

import { OpenAIAdapter } from '../../../../src/services/runtime/openai.adapter.js';
import type { OssaManifest } from '../../../../src/services/runtime/openai.adapter.js';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let manifest: OssaManifest;

  beforeEach(() => {
    manifest = {
      apiVersion: 'ossa/v0.2.4',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
        description: 'Test agent',
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
  });

  describe('Constructor', () => {
    it('should create adapter with manifest', () => {
      adapter = new OpenAIAdapter(manifest);
      expect(adapter).toBeDefined();
    });

    it('should create adapter with custom API key', () => {
      const apiKey = process.env.OPENAI_API_KEY || 'test-key';
      adapter = new OpenAIAdapter(manifest, apiKey);
      expect(adapter).toBeDefined();
    });
  });

  describe('Basic Chat', () => {
    it('should send a message and get response', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping: OPENAI_API_KEY not set');
        return;
      }

      adapter = new OpenAIAdapter(manifest);
      const response = await adapter.chat('Say "test successful" and nothing else');
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.toLowerCase()).toContain('test');
    }, 30000);
  });

  describe('Agent Info', () => {
    it('should return agent name and model', () => {
      adapter = new OpenAIAdapter(manifest);
      const info = adapter.getAgentInfo();
      
      expect(info.name).toBe('test-agent');
      expect(info.model).toBe('gpt-4o-mini');
    });
  });
});
