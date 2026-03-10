import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  discoverRepos,
  toRepoConfigs,
} from '../../../src/cli/commands/agents-md/repo-discovery.js';

describe('agents-md repo discovery', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-repo-discovery-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('discovers repositories via package.json or .git markers', async () => {
    const packageRepo = path.join(tempDir, 'package-repo');
    const gitRepo = path.join(tempDir, 'git-repo');
    const nonRepo = path.join(tempDir, 'not-a-repo');

    fs.mkdirSync(packageRepo);
    fs.mkdirSync(gitRepo);
    fs.mkdirSync(nonRepo);
    fs.writeFileSync(path.join(packageRepo, 'package.json'), '{}');
    fs.mkdirSync(path.join(gitRepo, '.git'));

    const discovered = await discoverRepos(tempDir);
    const names = discovered.map((repo) => repo.name).sort();

    expect(names).toEqual(['git-repo', 'package-repo']);
  });

  it('filters discovered repositories by wildcard pattern', async () => {
    const apiRepo = path.join(tempDir, 'api-service');
    const webRepo = path.join(tempDir, 'web-app');

    fs.mkdirSync(apiRepo);
    fs.mkdirSync(webRepo);
    fs.writeFileSync(path.join(apiRepo, 'package.json'), '{}');
    fs.writeFileSync(path.join(webRepo, 'package.json'), '{}');

    const discovered = await discoverRepos(tempDir, 'api-*');

    expect(discovered).toHaveLength(1);
    expect(discovered[0]?.name).toBe('api-service');
  });

  it('maps discovered repositories to RepoConfig payloads', () => {
    const repoPath = path.join(tempDir, 'example');
    const configs = toRepoConfigs([{ name: 'example', repoPath }]);

    expect(configs).toEqual([{ repo_path: repoPath }]);
  });
});
