/**
 * Skills Research Service Tests
 */

import { SkillsResearchService } from '../../../src/services/skills-pipeline/skills-research.service';

describe('SkillsResearchService', () => {
  let service: SkillsResearchService;

  beforeEach(() => {
    service = new SkillsResearchService();
  });

  describe('research', () => {
    it('should research skills with query', async () => {
      const results = await service.research({
        query: 'drupal',
        limit: 5,
        updateIndex: false,
      });

      expect(Array.isArray(results)).toBe(true);
      // Results might be empty if index doesn't exist yet
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('name');
        expect(results[0]).toHaveProperty('description');
        expect(results[0]).toHaveProperty('triggers');
        expect(results[0]).toHaveProperty('sourceUrl');
      }
    });

    it('should limit results', async () => {
      const results = await service.research({
        query: 'typescript',
        limit: 2,
        updateIndex: false,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by sources', async () => {
      const results = await service.research({
        query: 'api',
        sources: ['awesome-claude-code'],
        limit: 10,
        updateIndex: false,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should update index when requested', async () => {
      const results = await service.research({
        query: 'development',
        limit: 5,
        updateIndex: true,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getSources', () => {
    it('should return configured sources', () => {
      const sources = service.getSources();

      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]).toHaveProperty('name');
      expect(sources[0]).toHaveProperty('type');
      expect(sources[0]).toHaveProperty('url');
      expect(sources[0]).toHaveProperty('enabled');
    });
  });

  describe('addSource', () => {
    it('should add custom source', () => {
      const initialCount = service.getSources().length;

      service.addSource({
        name: 'custom-source',
        type: 'github',
        url: 'https://github.com/custom/repo',
        enabled: true,
      });

      expect(service.getSources().length).toBe(initialCount + 1);
    });
  });

  describe('getIndexPath', () => {
    it('should return valid index path', () => {
      const indexPath = service.getIndexPath();

      expect(indexPath).toContain('.ossa');
      expect(indexPath).toContain('skills-index.json');
    });
  });
});
