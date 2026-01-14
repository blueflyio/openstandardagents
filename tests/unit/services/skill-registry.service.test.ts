/**
 * Skill Registry Service Tests
 * 
 * Comprehensive test suite for skill discovery, registration, and matching.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SkillRegistry, SkillMatchContext } from '../../../src/services/skill-registry.service';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SkillRegistry', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `skill-registry-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    SkillRegistry.clear();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    SkillRegistry.clear();
  });

  describe('Skill Registration', () => {
    it('should register a skill from a valid OSSA manifest', async () => {
      const manifestPath = join(tempDir, 'test-skill.ossa.yaml');
      const manifest = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: {
          name: 'test-skill',
          description: 'Test skill',
          labels: {
            'skill.priority': '80',
            'skill.contexts': 'development,review',
            'skill.enabled': 'true',
          },
        },
        spec: {
          role: 'Test role',
        },
      };

      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      await SkillRegistry.registerFromFile(manifestPath);

      const skill = SkillRegistry.get('test-skill');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('test-skill');
      expect(skill?.priority).toBe(80);
      expect(skill?.contexts).toContain('development');
      expect(skill?.enabled).toBe(true);
    });

    it('should throw error for invalid manifest', async () => {
      const manifestPath = join(tempDir, 'invalid-skill.ossa.yaml');
      writeFileSync(manifestPath, 'invalid: yaml');

      await expect(
        SkillRegistry.registerFromFile(manifestPath)
      ).rejects.toThrow();
    });

    it('should throw error for manifest missing name', async () => {
      const manifestPath = join(tempDir, 'no-name-skill.ossa.yaml');
      const manifest = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: {},
      };

      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      await expect(
        SkillRegistry.registerFromFile(manifestPath)
      ).rejects.toThrow('missing metadata.name');
    });

    it('should register skill manually', () => {
      const skill = SkillRegistry.register({
        path: join(tempDir, 'manual-skill.ossa.yaml'),
        manifest: {
          metadata: {
            name: 'manual-skill',
            description: 'Manual skill',
          },
        },
      });

      expect(skill.name).toBe('manual-skill');
      expect(SkillRegistry.get('manual-skill')).toBeDefined();
    });
  });

  describe('Skill Discovery', () => {
    it('should discover skills from configured paths', async () => {
      const skillDir = join(tempDir, 'skills');
      mkdirSync(skillDir, { recursive: true });

      const manifestPath = join(skillDir, 'discovered-skill.ossa.yaml');
      const manifest = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: {
          name: 'discovered-skill',
          description: 'Discovered skill',
        },
        spec: {
          role: 'Test',
        },
      };

      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      await SkillRegistry.initialize([skillDir]);

      const skill = SkillRegistry.get('discovered-skill');
      expect(skill).toBeDefined();
    });

    it('should handle non-existent paths gracefully', async () => {
      await expect(
        SkillRegistry.initialize(['/non-existent/path'])
      ).resolves.not.toThrow();
    });
  });

  describe('Skill Matching', () => {
    beforeEach(async () => {
      const skillDir = join(tempDir, 'skills');
      mkdirSync(skillDir, { recursive: true });

      // Create React performance skill
      const reactSkillPath = join(skillDir, 'react-performance-expert.ossa.yaml');
      const reactSkill = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: {
          name: 'react-performance-expert',
          description: 'React performance expert',
          labels: {
            'skill.priority': '90',
            'skill.contexts': 'development',
            'skill.enabled': 'true',
          },
        },
        spec: {
          role: 'React performance expert',
          runtime: {
            triggers: {
              keywords: ['performance', 'optimize', 'slow', 'bundle'],
              file_patterns: ['**/*.{tsx,jsx}', '**/components/**'],
              frameworks: ['next.js', 'react'],
            },
          },
        },
      };

      writeFileSync(reactSkillPath, JSON.stringify(reactSkill, null, 2));

      await SkillRegistry.initialize([skillDir]);
    });

    it('should match skill on keywords', async () => {
      const matches = await SkillRegistry.match({
        userInput: 'My React app is slow and needs optimization',
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].skill.name).toBe('react-performance-expert');
      expect(matches[0].confidence).toBeGreaterThan(0);
      expect(matches[0].reasons.length).toBeGreaterThan(0);
    });

    it('should match skill on file patterns', async () => {
      const matches = await SkillRegistry.match({
        files: ['src/components/App.tsx', 'src/pages/index.tsx'],
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].skill.name).toBe('react-performance-expert');
    });

    it('should match skill on framework', async () => {
      const matches = await SkillRegistry.match({
        framework: 'next.js',
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].skill.name).toBe('react-performance-expert');
    });

    it('should return empty array for no matches', async () => {
      const matches = await SkillRegistry.match({
        userInput: 'Python code optimization',
        framework: 'django',
      });

      expect(matches.length).toBe(0);
    });

    it('should sort matches by confidence and priority', async () => {
      // Add second skill with lower priority
      const skillDir = join(tempDir, 'skills');
      const lowPrioritySkillPath = join(skillDir, 'low-priority-skill.ossa.yaml');
      const lowPrioritySkill = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: {
          name: 'low-priority-skill',
          description: 'Low priority skill',
          labels: {
            'skill.priority': '50',
            'skill.contexts': 'development',
            'skill.enabled': 'true',
          },
        },
        spec: {
          role: 'Low priority',
          runtime: {
            triggers: {
              keywords: ['performance'],
            },
          },
        },
      };

      writeFileSync(lowPrioritySkillPath, JSON.stringify(lowPrioritySkill, null, 2));
      await SkillRegistry.registerFromFile(lowPrioritySkillPath);

      const matches = await SkillRegistry.match({
        userInput: 'performance optimization',
      });

      expect(matches.length).toBeGreaterThan(1);
      // Higher priority should come first
      expect(matches[0].skill.priority).toBeGreaterThanOrEqual(matches[1].skill.priority);
    });
  });

  describe('Skill Management', () => {
    beforeEach(() => {
      SkillRegistry.clear(); // Clear any skills from previous tests
      const skill = SkillRegistry.register({
        path: join(tempDir, 'manageable-skill.ossa.yaml'),
        manifest: {
          metadata: {
            name: 'manageable-skill',
            description: 'Manageable skill',
            labels: {
              'skill.contexts': 'development',
            },
          },
        },
      });
    });

    it('should enable a skill', () => {
      SkillRegistry.disable('manageable-skill');
      expect(SkillRegistry.get('manageable-skill')?.enabled).toBe(false);

      const result = SkillRegistry.enable('manageable-skill');
      expect(result).toBe(true);
      expect(SkillRegistry.get('manageable-skill')?.enabled).toBe(true);
    });

    it('should disable a skill', () => {
      const result = SkillRegistry.disable('manageable-skill');
      expect(result).toBe(true);
      expect(SkillRegistry.get('manageable-skill')?.enabled).toBe(false);
    });

    it('should return false for non-existent skill', () => {
      expect(SkillRegistry.enable('non-existent')).toBe(false);
      expect(SkillRegistry.disable('non-existent')).toBe(false);
    });

    it('should get all skills', () => {
      const allSkills = SkillRegistry.getAll();
      expect(allSkills.length).toBeGreaterThan(0);
      expect(allSkills.some(s => s.name === 'manageable-skill')).toBe(true);
    });

    it('should get skills by context', () => {
      SkillRegistry.register({
        path: join(tempDir, 'dev-skill.ossa.yaml'),
        manifest: {
          metadata: {
            name: 'dev-skill',
            labels: {
              'skill.contexts': 'development',
            },
          },
        },
      });

      const prodSkill = SkillRegistry.register({
        path: join(tempDir, 'prod-skill.ossa.yaml'),
        manifest: {
          metadata: {
            name: 'prod-skill',
            labels: {
              'skill.contexts': 'production',
            },
          },
        },
      });

      const devSkills = SkillRegistry.getByContext('development');
      expect(devSkills.some(s => s.name === 'dev-skill')).toBe(true);
      expect(devSkills.some(s => s.name === 'prod-skill')).toBe(false);
      
      const prodSkills = SkillRegistry.getByContext('production');
      expect(prodSkills.some(s => s.name === 'prod-skill')).toBe(true);
    });

    it('should filter matches above threshold', async () => {
      const matches = await SkillRegistry.matchAboveThreshold(
        { userInput: 'performance' },
        0.5
      );

      matches.forEach(match => {
        expect(match.confidence).toBeGreaterThanOrEqual(0.5);
      });
    });
  });

  describe('Pattern Matching', () => {
    it('should match glob patterns correctly', () => {
      // This tests the internal matchesPattern method indirectly
      const skillDir = join(tempDir, 'skills');
      mkdirSync(skillDir, { recursive: true });

      const skillPath = join(skillDir, 'pattern-skill.ossa.yaml');
      const skill = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: {
          name: 'pattern-skill',
        },
        spec: {
          runtime: {
            triggers: {
              file_patterns: ['**/*.tsx', '**/components/**'],
            },
          },
        },
      };

      writeFileSync(skillPath, JSON.stringify(skill, null, 2));

      return SkillRegistry.initialize([skillDir]).then(async () => {
        const matches = await SkillRegistry.match({
          files: ['src/components/App.tsx', 'src/pages/index.tsx'],
        });

        expect(matches.length).toBeGreaterThan(0);
      });
    });
  });
});
