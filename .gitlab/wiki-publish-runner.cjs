/**
 * Publish docs/wiki/* to GitLab Wiki. Loads .env.local from workspace root so
 * GITLAB_TOKEN or GITLAB_PUSH_TOKEN is available. Run: npm run wiki:publish
 * Requires: buildkit on PATH, or we run from agent-buildkit worktree.
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(repoRoot, '..', '..', '..');
const platformEnv = path.join('/Volumes/AgentPlatform', '.env.local');
const envLocal = fs.existsSync(platformEnv) ? platformEnv : path.join(workspaceRoot, '.env.local');
if (fs.existsSync(envLocal)) {
  const lines = fs.readFileSync(envLocal, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = /^\s*(GITLAB_TOKEN|GITLAB_PUSH_TOKEN)\s*=\s*(.+)$/.exec(line);
    if (m) {
      const v = m[2].replace(/^["']|["']$/g, '').trim();
      if (v) process.env[m[1]] = v;
    }
  }
}
process.env.AGENT_PLATFORM_CONFIG = fs.existsSync('/Volumes/AgentPlatform') ? '/Volumes/AgentPlatform' : workspaceRoot;

const buildkitPath = path.join(workspaceRoot, 'worktrees', 'agent-buildkit', 'release-v0.1.x', 'dist', 'cli', 'index.js');
const manifestPath = path.join(repoRoot, '.gitlab', 'wiki-publish-manifest.json');
const cmd = fs.existsSync(buildkitPath)
  ? `node "${buildkitPath}" gitlab wiki publish --project blueflyio/ossa/openstandardagents --manifest "${manifestPath}"`
  : 'buildkit gitlab wiki publish --project blueflyio/ossa/openstandardagents --manifest .gitlab/wiki-publish-manifest.json';

execSync(cmd, { stdio: 'inherit', env: process.env, cwd: repoRoot });
