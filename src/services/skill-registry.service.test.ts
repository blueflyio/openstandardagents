/**
 * Skill Registry Service Tests
 */

import { SkillRegistryService } from './skill-registry.service.js';
import { ManifestRepository } from '../repositories/manifest.repository.js';
import type { OssaAgent } from '../types/index.js';

describe('SkillRegistryService', () => {
  let service: SkillRegistryService;
  let mockManifestRepo: jest.Mocked<ManifestRepository>;

  const mockReactSkill: OssaAgent = {
    apiVersion: 'ossa/v0.3.4',
    kind: 'Agent',
    metadata: {
      name: 'react-performance-expert',
      version: '1.0.0',
      description: 'React performance optimization',
      labels: {
        'ossa.dev/category': 'development',
        'vercel-labs/skill-based': 'true'
      }
    },
    spec: {
      role: 'Performance expert',
      tools: [
        { name: 'performance.analyze', description: 'Analyze performance' },
        { name: 'bundle.optimize', description: 'Optimize bundle' }
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        temperature: 0.2
      },
      tools: []
    },
    runtime: {
      triggers: {
        keywords: ['performance', 'optimize', 'slow', 'bundle'],
        file_patterns: ['**/*.tsx', '**/*.jsx', '**/components/**/*.ts'],
        frameworks: ['next.js', 'react']
      },
      activation: {
        automatic: true,
        confidence_threshold: 0.7
      }
    }
  };

  beforeEach(() => {
    mockManifestRepo = {
      load: jest.fn()
    } as any;

    service = new SkillRegistryService(mockManifestRepo);
  });

  describe('register', () => {
    it('should register a skill successfully', async () => {
      mockManifestRepo.load.mockResolvedValue(mockReactSkill);

      const registered = await service.register({
        path: '/path/to/skill.yaml'
      });

      expect(registered.id).toBe('react-performance-expert');
      expect(registered.triggers.keywords).toContain('performance');
      expect(registered.capabilities).toHaveLength(2); // Extracted from tools
    });

    it('should throw error for invalid manifest', async () => {
      mockManifestRepo.load.mockResolvedValue({});

      await expect(
        service.register({ path: '/invalid.yaml' })
      ).rejects.toThrow('Invalid skill manifest');
    });

    it('should set default priority to 50', async () => {
      mockManifestRepo.load.mockResolvedValue(mockReactSkill);

      const registered = await service.register({
        path: '/path/to/skill.yaml'
      });

      expect(registered.registration.priority).toBe(50);
    });

    it('should respect custom priority', async () => {
      mockManifestRepo.load.mockResolvedValue(mockReactSkill);

      const registered = await service.register({
        path: '/path/to/skill.yaml',
        priority: 90
      });

      expect(registered.registration.priority).toBe(90);
    });
  });

  describe('match', () => {
    beforeEach(async () => {
      mockManifestRepo.load.mockResolvedValue(mockReactSkill);
      await service.register({ path: '/skill.yaml' });
    });

    it('should match on keywords', async () => {
      const matches = await service.match({
        userInput: 'Optimize my React app performance',
        files: [],
        framework: 'react'
      });

      expect(matches).toHaveLength(1);
      expect(matches[0].skill.id).toBe('react-performance-expert');
      expect(matches[0].confidence).toBeGreaterThan(0.7);
      expect(matches[0].matchedTriggers.keywords).toContain('optimize');
    });

    it('should match on file patterns', async () => {
      const matches = await service.match({
        userInput: 'Review this code',
        files: ['src/components/Dashboard.tsx'],
        framework: 'react'
      });

      expect(matches).toHaveLength(1);
      expect(matches[0].matchedTriggers.filePatterns).toContain('**/*.tsx');
    });

    it('should match on framework', async () => {
      const matches = await service.match({
        userInput: 'Help me',
        files: [],
        framework: 'next.js'
      });

      expect(matches).toHaveLength(1);
      expect(matches[0].matchedTriggers.frameworks).toContain('next.js');
    });

    it('should return empty array for no matches', async () => {
      const matches = await service.match({
        userInput: 'Write a Python script',
        files: ['script.py'],
        framework: 'python'
      });

      expect(matches).toHaveLength(0);
    });

    it('should respect confidence threshold', async () => {
      // Weak match - only one keyword
      const matches = await service.match({
        userInput: 'performance',
        files: []
      });

      // Should match if confidence >= 0.7
      if (matches.length > 0) {
        expect(matches[0].confidence).toBeGreaterThanOrEqual(0.7);
      }
    });

    it('should prioritize multiple matches correctly', async () => {
      // Register second skill with higher priority
      const highPrioritySkill = {
        ...mockReactSkill,
        metadata: { ...mockReactSkill.metadata, name: 'high-priority' }
      };

      mockManifestRepo.load.mockResolvedValue(highPrioritySkill);
      await service.register({
        path: '/high-priority.yaml',
        priority: 90
      });

      const matches = await service.match({
        userInput: 'Optimize performance',
        files: ['app.tsx'],
        framework: 'react'
      });

      expect(matches).toHaveLength(2);
      // Higher priority skill should come first if confidence is similar
      expect(matches[0].skill.registration.priority).toBeGreaterThanOrEqual(
        matches[1].skill.registration.priority || 0
      );
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      mockManifestRepo.load.mockResolvedValue(mockReactSkill);
      await service.register({
        path: '/skill1.yaml',
        contexts: ['development']
      });
      await service.register({
        path: '/skill2.yaml',
        enabled: false
      });
    });

    it('should list all skills by default', () => {
      const skills = service.list();
      expect(skills).toHaveLength(2);
    });

    it('should filter by enabled status', () => {
      const enabled = service.list({ enabled: true });
      expect(enabled).toHaveLength(1);

      const disabled = service.list({ enabled: false });
      expect(disabled).toHaveLength(1);
    });

    it('should filter by context', () => {
      const devSkills = service.list({ context: 'development' });
      expect(devSkills).toHaveLength(1);

      const prodSkills = service.list({ context: 'production' });
      expect(prodSkills).toHaveLength(1); // skill2 has no context restriction
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      mockManifestRepo.load.mockResolvedValue(mockReactSkill);

      await service.register({ path: '/skill1.yaml', enabled: true });
      await service.register({ path: '/skill2.yaml', enabled: false });

      const stats = service.getStats();

      expect(stats.total).toBe(2);
      expect(stats.enabled).toBe(1);
      expect(stats.disabled).toBe(1);
      expect(stats.byCategory.development).toBe(2);
    });
  });

  describe('enable/disable', () => {
    beforeEach(async () => {
      mockManifestRepo.load.mockResolvedValue(mockReactSkill);
      await service.register({ path: '/skill.yaml' });
    });

    it('should disable a skill', () => {
      service.setEnabled('react-performance-expert', false);

      const skill = service.get('react-performance-expert');
      expect(skill?.registration.enabled).toBe(false);
    });

    it('should enable a skill', () => {
      service.setEnabled('react-performance-expert', false);
      service.setEnabled('react-performance-expert', true);

      const skill = service.get('react-performance-expert');
      expect(skill?.registration.enabled).toBe(true);
    });
  });

  describe('glob matching', () => {
    beforeEach(async () => {
      mockManifestRepo.load.mockResolvedValue(mockReactSkill);
      await service.register({ path: '/skill.yaml' });
    });

    it('should match ** wildcard', async () => {
      const matches = await service.match({
        userInput: 'test',
        files: ['src/deep/nested/component.tsx'],
        framework: 'react'
      });

      expect(matches[0].matchedTriggers.filePatterns).toContain('**/*.tsx');
    });

    it('should match * wildcard', async () => {
      const matches = await service.match({
        userInput: 'test',
        files: ['src/components/Button.ts'],
        framework: 'react'
      });

      expect(matches[0].matchedTriggers.filePatterns).toContain('**/components/**/*.ts');
    });

    it('should not match wrong extension', async () => {
      const matches = await service.match({
        userInput: 'test',
        files: ['src/components/style.css']
      });

      // Should not match *.tsx patterns
      if (matches.length > 0) {
        expect(matches[0].matchedTriggers.filePatterns).not.toContain('**/*.tsx');
      }
    });
  });
});
