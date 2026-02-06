import { GitHubSyncService } from '../../src/services/github-sync/sync.service';
import { API_VERSION } from '../../src/version.js';

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    pulls: {
      get: jest.fn(),
      list: jest.fn(),
    },
    issues: {
      createComment: jest.fn(),
    },
  })),
}));

global.fetch = jest.fn();

describe('GitHubSyncService', () => {
  const mockConfig = {
    github: {
      owner: 'test',
      repo: 'test',
      token: 'test',
    },
    gitlab: {
      projectId: 'test',
      token: 'test',
    },
  };

  it('should validate config with Zod', () => {
    expect(() => new GitHubSyncService(mockConfig)).not.toThrow();
  });

  it('should reject invalid config', () => {
    const invalid = {
      ...mockConfig,
      github: { ...mockConfig.github, token: 123 },
    };
    expect(() => new GitHubSyncService(invalid as any)).toThrow();
  });
});
