/**
 * Publish docs/wiki/* to GitLab Wiki via GitLab REST API. No BuildKit dependency.
 * Requires: GITLAB_TOKEN or GITLAB_PUSH_TOKEN. Run: npm run wiki:publish
 * Loads .env.local from workspace root or /Volumes/AgentPlatform if present.
 */
const path = require('path');
const fs = require('fs');

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

const token = process.env.GITLAB_TOKEN || process.env.GITLAB_PUSH_TOKEN;
if (!token) {
  console.error('GITLAB_TOKEN or GITLAB_PUSH_TOKEN required');
  process.exit(1);
}

const PROJECT_PATH = 'blueflyio/ossa/openstandardagents';
const API_BASE = 'https://gitlab.com/api/v4';
const encodedProject = encodeURIComponent(PROJECT_PATH);

async function api(method, url, body) {
  const opts = {
    method,
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    let err;
    try {
      err = JSON.parse(text);
    } catch {
      err = { message: text };
    }
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(err)}`);
  }
  return res.headers.get('content-length') === '0' ? null : res.json();
}

async function main() {
  const manifestPath = path.join(repoRoot, '.gitlab', 'wiki-publish-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const pages = manifest.pages || [];
  if (pages.length === 0) {
    console.log('No pages in manifest');
    return;
  }

  for (const p of pages) {
    const filePath = path.isAbsolute(p.file) ? p.file : path.join(repoRoot, p.file);
    if (!fs.existsSync(filePath)) {
      console.log('Skip (file missing):', p.file);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const title = p.title ?? p.slug;
    const slugEnc = encodeURIComponent(p.slug);
    const getUrl = `${API_BASE}/projects/${encodedProject}/wikis/${slugEnc}`;
    let exists = false;
    try {
      await api('GET', getUrl);
      exists = true;
    } catch (e) {
      if (!e.message.startsWith('404')) throw e;
    }
    if (exists) {
      await api('PUT', getUrl, { title, content, format: 'markdown' });
      console.log('Updated wiki:', p.slug);
    } else {
      await api('POST', `${API_BASE}/projects/${encodedProject}/wikis`, {
        title,
        content,
        format: 'markdown',
      });
      console.log('Created wiki:', p.slug);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
