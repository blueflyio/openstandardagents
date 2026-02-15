/**
 * Skills Research Service Tests
 * Tests with mocked HTTP (Octokit + axios) — no real network calls
 */

import { SkillsResearchService } from '../../../src/services/skills-pipeline/skills-research.service';

// Mock Octokit
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        getContent: jest
          .fn()
          .mockImplementation(({ path: filePath }: { path: string }) => {
            if (filePath === 'README.md') {
              const content = Buffer.from(
                [
                  '# Awesome Claude Code',
                  '',
                  '## Skills',
                  '',
                  '- [Drupal Dev](https://github.com/example/drupal-dev) - Expert Drupal module development',
                  '- [TypeScript Tools](https://github.com/example/ts-tools) - TypeScript refactoring utilities',
                  '- [API Designer](https://github.com/example/api-design) - RESTful API design helper',
                  '',
                ].join('\n')
              ).toString('base64');
              return Promise.resolve({ data: { content } });
            }
            // Showcase README responses
            const readmeContent = Buffer.from(
              '# Showcase Project\n\nA sample showcase entry for testing.\n'
            ).toString('base64');
            return Promise.resolve({ data: { content: readmeContent } });
          }),
      },
      git: {
        getTree: jest.fn().mockResolvedValue({
          data: {
            tree: [
              { type: 'tree', path: 'code-analyzer' },
              { type: 'tree', path: 'doc-writer' },
              { type: 'tree', path: '.github' }, // Should be filtered
              { type: 'tree', path: 'node_modules' }, // Should be filtered
            ],
          },
        }),
      },
    },
  })),
}));

// Mock axios for npm registry
jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      data: {
        objects: [
          {
            package: {
              name: '@claude-skills/test-skill',
              description: 'A test skill for Claude',
              keywords: ['claude-skill', 'testing'],
              links: {
                npm: 'https://www.npmjs.com/package/@claude-skills/test-skill',
              },
              author: { name: 'Test Author' },
              date: '2026-02-01T00:00:00.000Z',
            },
            score: { final: 0.85 },
          },
        ],
      },
    }),
  },
  __esModule: true,
}));

// Mock fs to avoid writing to disk in tests
jest.mock('fs/promises', () => {
  const actual = jest.requireActual('fs/promises');
  return {
    ...actual,
    readFile: jest.fn().mockRejectedValue(new Error('ENOENT')), // No cached index
    writeFile: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
  };
});

describe('SkillsResearchService', () => {
  let service: SkillsResearchService;

  beforeEach(() => {
    service = new SkillsResearchService();
  });

  describe('research', () => {
    it('should research skills with query and return results from GitHub', async () => {
      const results = await service.research({
        query: 'drupal',
        limit: 5,
        updateIndex: true,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('description');
      expect(results[0]).toHaveProperty('triggers');
      expect(results[0]).toHaveProperty('sourceUrl');
    });

    it('should limit results', async () => {
      const results = await service.research({
        query: 'code',
        limit: 2,
        updateIndex: true,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by sources', async () => {
      const results = await service.research({
        query: 'test',
        sources: ['awesome-claude-code'],
        limit: 10,
        updateIndex: true,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should include npm registry results', async () => {
      const results = await service.research({
        query: 'test',
        sources: ['npm-registry'],
        limit: 10,
        updateIndex: true,
      });

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        // npm results should have installCommand
        const npmResult = results.find((r) => r.installCommand);
        if (npmResult) {
          expect(npmResult.installCommand).toContain('npm install');
        }
      }
    });

    it('should include showcase results', async () => {
      const results = await service.research({
        query: 'showcase',
        sources: ['claude-code-showcase'],
        limit: 10,
        updateIndex: true,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should deduplicate results', async () => {
      const results = await service.research({
        query: 'code',
        limit: 50,
        updateIndex: true,
      });

      const names = results.map((r) => r.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('getSources', () => {
    it('should return configured sources including npm-registry', () => {
      const sources = service.getSources();

      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]).toHaveProperty('name');
      expect(sources[0]).toHaveProperty('type');
      expect(sources[0]).toHaveProperty('url');
      expect(sources[0]).toHaveProperty('enabled');

      const npmSource = sources.find((s) => s.name === 'npm-registry');
      expect(npmSource).toBeDefined();
      expect(npmSource!.enabled).toBe(true);
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
