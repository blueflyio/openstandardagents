import { describe, it, expect, beforeEach } from '@jest/globals';
import { GenerationService } from '../../../src/services/generation.service.js';

describe('GenerationService', () => {
  let service: GenerationService;

  beforeEach(() => {
    service = new GenerationService();
  });

  describe('generate', () => {
    it('should generate manifest from template', async () => {
      const template = {
        id: 'test-agent',
        name: 'Test Agent',
        role: 'assistant',
        description: 'Test'
      };
      const manifest = await service.generate(template);
      expect(manifest.metadata.name).toBe('test-agent');
      expect(manifest.spec.role).toBe('assistant');
    });

    it('should normalize agent ID', async () => {
      const template = {
        id: 'Test Agent 123!',
        name: 'Test',
        role: 'assistant'
      };
      const manifest = await service.generate(template);
      expect(manifest.metadata.name).toMatch(/^[a-z0-9-]+$/);
    });

    it('should generate with capabilities', async () => {
      const template = {
        id: 'test',
        name: 'Test',
        role: 'assistant',
        capabilities: [{ type: 'mcp', name: 'tool1' }]
      };
      const manifest = await service.generate(template);
      expect(manifest.spec.tools?.length).toBeGreaterThan(0);
    });
  });
});
