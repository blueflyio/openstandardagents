import fs from 'fs/promises';
import path from 'path';
import { RepoConfig } from '../../../services/agents-md/repo-agents-md.service.js';

const REPO_MARKERS = ['package.json', '.git'] as const;

export interface DiscoveredRepo {
  name: string;
  repoPath: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wildcardToRegExp(pattern: string): RegExp {
  const regexPattern = pattern
    .split('')
    .map((char) => {
      if (char === '*') {
        return '.*';
      }

      if (char === '?') {
        return '.';
      }

      return escapeRegExp(char);
    })
    .join('');

  return new RegExp(`^${regexPattern}$`);
}

async function isRepoDir(repoPath: string): Promise<boolean> {
  for (const marker of REPO_MARKERS) {
    try {
      await fs.access(path.join(repoPath, marker));
      return true;
    } catch {
      // Ignore missing marker and continue checking.
    }
  }

  return false;
}

export async function discoverRepos(
  baseDir: string,
  pattern = '*'
): Promise<DiscoveredRepo[]> {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const matcher = wildcardToRegExp(pattern);

  const discovered = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && matcher.test(entry.name))
      .map(async (entry) => {
        const repoPath = path.join(baseDir, entry.name);
        if (!(await isRepoDir(repoPath))) {
          return null;
        }

        return { name: entry.name, repoPath };
      })
  );

  return discovered.filter((repo): repo is DiscoveredRepo => repo !== null);
}

export function toRepoConfigs(repos: DiscoveredRepo[]): RepoConfig[] {
  return repos.map((repo) => ({ repo_path: repo.repoPath }));
}
