/**
 * Platform Export Integration Tests
 * Tests export functionality across all platforms
 */

import { describe, it, expect } from '@jest/globals';
import { container } from '../../src/di-container.js';
import { GenerationService } from '../../src/services/generation.service.js';

describe('Platform Export Integration', () => {
  const generationService = container.get(GenerationService);
  // const manifestRepo = container.get(ManifestRepository); // Not used in tests

  const baseManifest = {
    apiVersion: 'ossa/v0.4.1',
    kind: 'Agent',
    metadata: {
      name: 'test-agent',
      version: '1.0.0',
      description: 'Test agent for platform export',
    },
    spec: {
      role: 'You are a helpful test agent.',
      llm: {
        provider: 'openai',
        model: 'gpt-4',
      },
      tools: [
        {
          type: 'function',
          name: 'test_tool',
          capabilities: ['test'],
        },
      ],
    },
  };

  it('should export to Cursor format', async () => {
    const manifest = {
      ...baseManifest,
      extensions: {
        cursor: {
          enabled: true,
          agent_type: 'composer',
        },
      },
    };

    const exported = await generationService.exportToPlatform(
      manifest,
      'cursor'
    );
    expect(exported).toHaveProperty('agent_type');
    expect(exported.agent_type).toBe('composer');
  });

  it('should export to OpenAI format', async () => {
    const manifest = {
      ...baseManifest,
      extensions: {
        openai_agents: {
          enabled: true,
          model: 'gpt-4o',
        },
      },
    };

    const exported = await generationService.exportToPlatform(
      manifest,
      'openai'
    );
    expect(exported).toHaveProperty('name');
    expect(exported).toHaveProperty('instructions');
    expect(exported).toHaveProperty('model');
  });

  it('should export to CrewAI format', async () => {
    const manifest = {
      ...baseManifest,
      extensions: {
        crewai: {
          enabled: true,
          agent_type: 'worker',
          role: 'Worker Agent',
          goal: 'Complete assigned tasks',
        },
      },
    };

    const exported = await generationService.exportToPlatform(
      manifest,
      'crewai'
    );
    expect(exported).toHaveProperty('role');
    expect(exported).toHaveProperty('goal');
    expect(exported).toHaveProperty('agent_type');
  });

  it('should export to Anthropic format', async () => {
    const manifest = {
      ...baseManifest,
      spec: {
        ...baseManifest.spec,
        llm: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
        },
      },
      extensions: {
        anthropic: {
          enabled: true,
          model: 'claude-3-5-sonnet-20241022',
          system: 'You are a helpful assistant.',
        },
      },
    };

    const exported = await generationService.exportToPlatform(
      manifest,
      'anthropic'
    );
    expect(exported).toHaveProperty('name');
    expect(exported).toHaveProperty('system');
    expect(exported).toHaveProperty('model');
  });

  it('should export to LangChain format', async () => {
    const manifest = {
      ...baseManifest,
      extensions: {
        langchain: {
          enabled: true,
          chain_type: 'agent',
        },
      },
    };

    const exported = await generationService.exportToPlatform(
      manifest,
      'langchain'
    );
    expect(exported).toHaveProperty('type');
    expect(exported).toHaveProperty('chain_type');
  });

  it('should handle missing extensions gracefully', async () => {
    const exported = await generationService.exportToPlatform(
      baseManifest,
      'cursor'
    );
    expect(exported).toBeDefined();
    expect(exported.agent_type).toBeDefined();
  });
});
