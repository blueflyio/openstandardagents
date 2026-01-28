/**
 * Platform Import Integration Tests
 * Tests import functionality from platform-specific formats
 */

import { describe, it, expect } from '@jest/globals';
import { container } from '../../src/di-container.js';
import { GenerationService } from '../../src/services/generation.service.js';
import { getApiVersion } from '../../src/utils/version.js';

describe('Platform Import Integration', () => {
  const generationService = container.get(GenerationService);
  const currentApiVersion = getApiVersion();

  it('should import from Cursor format', async () => {
    const cursorData = {
      agent_type: 'composer',
      workspace_config: {
        rules_file: '.cursor/.cursorrules',
      },
    };

    const ossaManifest = await generationService.importFromPlatform(
      cursorData,
      'cursor'
    );
    expect(ossaManifest.apiVersion).toBe(currentApiVersion);
    expect(ossaManifest.kind).toBe('Agent');
    expect(ossaManifest.extensions.cursor).toBeDefined();
    expect(ossaManifest.extensions.cursor.agent_type).toBe('composer');
  });

  it('should import from OpenAI format', async () => {
    const openaiData = {
      name: 'openai-agent',
      instructions: 'You are a helpful assistant.',
      model: 'gpt-4o',
      tools: [
        {
          function: {
            name: 'test_tool',
            description: 'Test tool',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        },
      ],
    };

    const ossaManifest = await generationService.importFromPlatform(
      openaiData,
      'openai'
    );
    expect(ossaManifest.apiVersion).toBe(currentApiVersion);
    expect(ossaManifest.metadata.name).toBe('openai-agent');
    expect(ossaManifest.spec.role).toBe('You are a helpful assistant.');
    expect(ossaManifest.extensions.openai_agents).toBeDefined();
  });

  it('should import from CrewAI format', async () => {
    const crewaiData = {
      agent_type: 'worker',
      role: 'Worker',
      goal: 'Complete tasks',
      backstory: 'Experienced worker',
      tools: ['tool1', 'tool2'],
    };

    const ossaManifest = await generationService.importFromPlatform(
      crewaiData,
      'crewai'
    );
    expect(ossaManifest.apiVersion).toBe(currentApiVersion);
    expect(ossaManifest.extensions.crewai).toBeDefined();
    expect(ossaManifest.extensions.crewai.role).toBe('Worker');
    expect(ossaManifest.extensions.crewai.goal).toBe('Complete tasks');
  });

  it('should import from Anthropic format', async () => {
    const anthropicData = {
      name: 'claude-agent',
      system: 'You are helpful.',
      model: 'claude-3-5-sonnet-20241022',
      tools: [],
    };

    const ossaManifest = await generationService.importFromPlatform(
      anthropicData,
      'anthropic'
    );
    expect(ossaManifest.apiVersion).toBe(currentApiVersion);
    expect(ossaManifest.spec.role).toBe('You are helpful.');
    expect(ossaManifest.extensions.anthropic).toBeDefined();
    expect(ossaManifest.extensions.anthropic.model).toBe(
      'claude-3-5-sonnet-20241022'
    );
  });

  it('should handle missing optional fields', async () => {
    const minimalData = {
      name: 'minimal-agent',
    };

    const ossaManifest = await generationService.importFromPlatform(
      minimalData,
      'openai'
    );
    expect(ossaManifest.apiVersion).toBe(currentApiVersion);
    expect(ossaManifest.metadata.name).toBe('minimal-agent');
  });
});
