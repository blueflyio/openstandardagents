/**
 * Builder API routes for `ossa serve`
 *
 * These endpoints power the openstandard-ui builder frontend:
 *   GET  /api/wizard/definitions  — wizard step definitions
 *   GET  /api/skills              — list available skills
 *   POST /api/skills/attach       — attach skill ref to manifest YAML
 *   GET  /api/agent-builder       — list platforms
 *   POST /api/agent-builder       — init + validate + export agent
 *   POST /api/agent-builder/save  — save agent to external store
 */

import { execFile } from 'child_process';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat as fsStat,
  writeFile,
} from 'fs/promises';
import type { IncomingMessage, ServerResponse } from 'http';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// ── Config ──────────────────────────────────────────────────────────────────

const OSSA_CLI =
  process.env.OSSA_CLI || join(process.cwd(), 'dist/cli/index.js');
const NODE_BIN = process.env.NODE_BIN || process.execPath || 'node';

const PLATFORMS = [
  'docker',
  'kubernetes',
  'kagent',
  'langchain',
  'langflow',
  'crewai',
  'temporal',
  'n8n',
  'gitlab',
  'gitlab-agent',
  'npm',
  'drupal',
  'agent-skills',
] as const;

const BUILTIN_SKILLS = [
  { name: 'code-review', version: '1.0.0', description: 'Automated code review with quality, security, and style checks', categories: ['development', 'quality'], platforms: ['claude-code', 'cursor', 'codex-cli'], allowedTools: ['bash', 'file_read', 'file_write'] },
  { name: 'tdd-workflow', version: '1.0.0', description: 'Test-driven development workflow: write tests first, then implement', categories: ['development', 'testing'], platforms: ['claude-code', 'cursor', 'codex-cli'], allowedTools: ['bash', 'file_read', 'file_write'] },
  { name: 'git-commit-review', version: '1.0.0', description: 'Review and improve git commit messages following conventional commits', categories: ['development', 'git'], platforms: ['claude-code', 'cursor', 'github-copilot'], allowedTools: ['bash', 'file_read'] },
  { name: 'security-audit', version: '1.0.0', description: 'OWASP Top 10 security scanning and vulnerability detection', categories: ['security', 'compliance'], platforms: ['claude-code', 'cursor', 'codex-cli'], allowedTools: ['bash', 'file_read', 'web_search'] },
  { name: 'api-design', version: '1.0.0', description: 'OpenAPI 3.1 spec design and validation with Zod type generation', categories: ['development', 'api'], platforms: ['claude-code', 'cursor'], allowedTools: ['bash', 'file_read', 'file_write'] },
  { name: 'documentation', version: '1.0.0', description: 'Generate and maintain technical documentation from code', categories: ['documentation', 'content'], platforms: ['claude-code', 'cursor', 'codex-cli', 'kiro'], allowedTools: ['file_read', 'file_write', 'web_search'] },
  { name: 'drupal-module', version: '1.0.0', description: 'Drupal module development with PHPCS, PHPStan, and hook validation', categories: ['drupal', 'php', 'development'], platforms: ['claude-code', 'cursor'], allowedTools: ['bash', 'file_read', 'file_write'] },
  { name: 'react-best-practices', version: '1.0.0', description: 'React component patterns, hooks, and performance optimization', categories: ['frontend', 'react', 'development'], platforms: ['claude-code', 'cursor', 'codex-cli', 'windsurf'], allowedTools: ['file_read', 'file_write', 'bash'] },
  { name: 'kubernetes-ops', version: '1.0.0', description: 'Kubernetes deployment, scaling, health checks, and troubleshooting', categories: ['infrastructure', 'kubernetes', 'devops'], platforms: ['claude-code', 'codex-cli'], allowedTools: ['bash', 'file_read', 'file_write'] },
  { name: 'ci-pipeline', version: '1.0.0', description: 'CI/CD pipeline configuration for GitLab CI, GitHub Actions', categories: ['devops', 'ci-cd'], platforms: ['claude-code', 'cursor', 'github-copilot'], allowedTools: ['bash', 'file_read', 'file_write'] },
  { name: 'database-migration', version: '1.0.0', description: 'Database schema migrations with rollback support', categories: ['database', 'development'], platforms: ['claude-code', 'cursor'], allowedTools: ['bash', 'file_read', 'file_write'] },
  { name: 'mcp-server-builder', version: '1.0.0', description: 'Create and package Model Context Protocol servers', categories: ['mcp', 'tooling', 'development'], platforms: ['claude-code', 'cursor', 'codex-cli'], allowedTools: ['bash', 'file_read', 'file_write', 'web_search'] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk.toString()));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

async function runOssa(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(NODE_BIN, [OSSA_CLI, ...args], {
    timeout: 30_000,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
  children?: FileNode[];
}

async function readDirTree(dirPath: string, prefix = ''): Promise<FileNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    if (entry.isDirectory()) {
      const children = await readDirTree(fullPath, relativeName);
      nodes.push({ name: entry.name, path: relativeName, type: 'dir', children });
    } else {
      const s = await fsStat(fullPath);
      let content: string | undefined;
      if (s.size < 50_000) {
        try { content = await readFile(fullPath, 'utf-8'); } catch { content = `[binary, ${s.size}B]`; }
      } else {
        content = `[too large: ${s.size}B]`;
      }
      nodes.push({ name: entry.name, path: relativeName, type: 'file', size: s.size, content });
    }
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ── Route handler ───────────────────────────────────────────────────────────

/**
 * Handle builder API routes. Returns true if handled, false if not matched.
 */
export async function handleBuilderRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  query: Record<string, string | string[] | undefined>,
): Promise<boolean> {
  // ── GET /api/wizard/definitions ──────────────────────────────────────
  if (pathname === '/api/wizard/definitions' && req.method === 'GET') {
    const kind = (query.kind as string) || 'Agent';
    const mode = (query.mode as string) || 'guided';

    // Wizard definitions are step sequences for the builder UI
    const steps = getWizardDefinitions(kind, mode);
    json(res, 200, { kind, mode, steps });
    return true;
  }

  // ── GET /api/skills ──────────────────────────────────────────────────
  if (pathname === '/api/skills' && req.method === 'GET') {
    json(res, 200, { skillsPath: 'builtin', skills: BUILTIN_SKILLS });
    return true;
  }

  // ── POST /api/skills/attach ──────────────────────────────────────────
  if (pathname === '/api/skills/attach' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req) || '{}');
    const skillName = typeof body.skillName === 'string' ? body.skillName.trim() : '';
    const manifestYaml = typeof body.manifestYaml === 'string' ? body.manifestYaml : '';

    if (!skillName) return json(res, 400, { error: 'skillName is required' }), true;
    if (!manifestYaml) return json(res, 400, { error: 'manifestYaml is required' }), true;

    try {
      // Dynamic import yaml — it's a dep of openstandardagents
      const yaml = await import('yaml');
      const manifest = yaml.parse(manifestYaml) as Record<string, unknown>;
      const ext = (manifest.extensions as Record<string, unknown>) || {};
      const skillsExt = (ext.skills as Record<string, unknown>) || {};
      const refs = Array.isArray(skillsExt.skillRefs) ? [...(skillsExt.skillRefs as string[])] : [];

      if (refs.includes(skillName)) {
        json(res, 200, { manifestYaml, skillRefs: refs, message: 'Skill already attached' });
        return true;
      }

      refs.push(skillName);
      manifest.extensions = { ...ext, skills: { ...skillsExt, skillRefs: refs } };
      const updated = yaml.stringify(manifest, { indent: 2, lineWidth: 0 });
      json(res, 200, { manifestYaml: updated, skillRefs: refs });
    } catch (err: any) {
      json(res, 400, { error: 'Invalid manifest YAML', detail: err.message });
    }
    return true;
  }

  // ── GET /api/agent-builder ───────────────────────────────────────────
  if (pathname === '/api/agent-builder' && req.method === 'GET') {
    let platformList = '';
    try {
      const result = await runOssa(['export', '--list-platforms']);
      platformList = result.stdout;
    } catch { /* ok */ }
    json(res, 200, { platforms: PLATFORMS, cli: OSSA_CLI, platformList });
    return true;
  }

  // ── POST /api/agent-builder ──────────────────────────────────────────
  if (pathname === '/api/agent-builder' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req) || '{}');
    const {
      agentName = 'my-agent',
      platform,
      platforms: platformsBody,
      manifestYaml,
    } = body as {
      agentName?: string;
      platform?: string;
      platforms?: string[];
      manifestYaml?: string;
    };

    // Check for GitLab pipeline trigger
    const exportTriggerToken = process.env.EXPORT_TRIGGER_TOKEN || process.env.GITLAB_TOKEN;
    const exportProjectPath = process.env.EXPORT_GITLAB_PROJECT_PATH || 'blueflyio%2Fossa%2Flab%2Fopenstandard-generated-agents';
    const exportRef = process.env.EXPORT_REF || 'main';

    if (exportTriggerToken && (manifestYaml ?? '').trim().length > 0) {
      const platforms: string[] = Array.isArray(platformsBody) && platformsBody.length > 0 ? platformsBody : [platform ?? 'docker'].filter(Boolean);
      const safeName = (agentName ?? 'my-agent').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'my-agent';
      const base64 = Buffer.from(String(manifestYaml).trim(), 'utf-8').toString('base64');
      try {
        const form = new URLSearchParams();
        form.set('token', exportTriggerToken);
        form.set('ref', exportRef);
        form.set('variables[EXPORT_MANIFEST_BASE64]', base64);
        if (platforms.length > 1) form.set('variables[EXPORT_PLATFORMS]', platforms.join(','));
        form.set('variables[EXPORT_PLATFORM]', platforms[0] ?? 'docker');
        form.set('variables[EXPORT_AGENT_NAME]', safeName);
        const triggerRes = await fetch(
          `https://gitlab.com/api/v4/projects/${exportProjectPath}/trigger/pipeline`,
          { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() },
        );
        const pipeline = await triggerRes.json().catch(() => null) as any;
        const webUrl = pipeline?.web_url ?? `https://gitlab.com/${decodeURIComponent(exportProjectPath)}/-/pipelines`;
        if (!triggerRes.ok) {
          json(res, triggerRes.status >= 400 ? triggerRes.status : 502, {
            error: pipeline?.message ?? 'Export pipeline trigger failed',
            pipelineUrl: webUrl, agent: safeName, platforms,
            steps: [{ step: 'trigger', command: 'POST trigger/pipeline', stdout: '', stderr: JSON.stringify(pipeline ?? {}), exitCode: 1 }],
            manifest: manifestYaml ?? '', hasFiles: false, timestamp: new Date().toISOString(),
          });
          return true;
        }
        json(res, 200, {
          agent: safeName, platform: platforms[0], platforms,
          steps: [{ step: 'trigger', command: 'Triggered pipeline', stdout: `Pipeline ${pipeline?.id ?? 'started'}: ${webUrl}`, stderr: '', exitCode: 0 }],
          files: [], manifest: manifestYaml ?? '', hasFiles: false,
          timestamp: new Date().toISOString(), pipelineUrl: webUrl, pipelineId: pipeline?.id,
        });
        return true;
      } catch (err: any) {
        json(res, 502, { error: 'Export pipeline trigger failed', details: err.message });
        return true;
      }
    }

    // Local CLI execution
    const platforms: string[] = Array.isArray(platformsBody) && platformsBody.length > 0
      ? platformsBody : [platform ?? 'docker'].filter(Boolean);
    const invalid = platforms.filter((p) => !(PLATFORMS as readonly string[]).includes(p));
    if (invalid.length > 0) {
      json(res, 400, { error: `Invalid platform(s): ${invalid.join(', ')}. Valid: ${PLATFORMS.join(', ')}` });
      return true;
    }

    const safeName = (agentName || 'my-agent').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'my-agent';
    const workDir = await mkdtemp(join(tmpdir(), 'ossa-builder-'));

    try {
      const steps: Array<{ step: string; command: string; stdout: string; stderr: string; exitCode: number }> = [];
      const manifestPath = join(workDir, `${safeName}.ossa.yaml`);

      if (manifestYaml) {
        await writeFile(manifestPath, manifestYaml, 'utf-8');
        steps.push({ step: 'write-manifest', command: `# Manifest → ${safeName}.ossa.yaml`, stdout: `Wrote ${manifestYaml.length} bytes`, stderr: '', exitCode: 0 });
      } else {
        try {
          const r = await runOssa(['init', safeName, '-y', '-o', manifestPath]);
          steps.push({ step: 'init', command: `ossa init ${safeName} -y`, stdout: r.stdout, stderr: r.stderr, exitCode: 0 });
        } catch (err: any) {
          steps.push({ step: 'init', command: `ossa init ${safeName} -y`, stdout: err.stdout || '', stderr: err.stderr || String(err), exitCode: err.code ?? 1 });
        }
      }

      try {
        const r = await runOssa(['validate', manifestPath]);
        steps.push({ step: 'validate', command: `ossa validate`, stdout: r.stdout, stderr: r.stderr, exitCode: 0 });
      } catch (err: any) {
        steps.push({ step: 'validate', command: `ossa validate`, stdout: err.stdout || '', stderr: err.stderr || String(err), exitCode: err.code ?? 1 });
      }

      const allFiles: FileNode[] = [];
      for (const plat of platforms) {
        const outputDir = join(workDir, `${safeName}-${plat}`);
        await mkdir(outputDir, { recursive: true });
        try {
          const r = await runOssa(['export', manifestPath, '--platform', plat, '--output', outputDir]);
          steps.push({ step: `export:${plat}`, command: `ossa export --platform ${plat}`, stdout: r.stdout, stderr: r.stderr, exitCode: 0 });
        } catch (err: any) {
          steps.push({ step: `export:${plat}`, command: `ossa export --platform ${plat}`, stdout: err.stdout || '', stderr: err.stderr || String(err), exitCode: err.code ?? 1 });
        }
        try {
          const s = await fsStat(outputDir);
          if (s.isDirectory()) {
            const tree = await readDirTree(outputDir);
            allFiles.push({ name: `${safeName}-${plat}`, path: `${safeName}-${plat}`, type: 'dir', children: tree });
          }
        } catch { /* skip */ }
      }

      let manifestContent = '';
      try { manifestContent = await readFile(manifestPath, 'utf-8'); } catch { /* ok */ }

      json(res, 200, {
        agent: safeName, platform: platforms[0], platforms, steps,
        files: allFiles, manifest: manifestContent, hasFiles: allFiles.length > 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
    return true;
  }

  // ── POST /api/agent-builder/save ─────────────────────────────────────
  if (pathname === '/api/agent-builder/save' && req.method === 'POST') {
    const saveUrl = process.env.OSSA_WEBAGENTS_API_URL;
    if (!saveUrl) {
      json(res, 503, { error: 'Save not configured. Set OSSA_WEBAGENTS_API_URL.' });
      return true;
    }
    const body = JSON.parse(await readBody(req) || '{}');
    const manifest = typeof body.manifest === 'string' ? body.manifest : undefined;
    if (!manifest || manifest.trim().length === 0) {
      json(res, 400, { error: 'manifest (YAML string) is required' });
      return true;
    }
    try {
      const targetUrl = (typeof body.targetUrl === 'string' && body.targetUrl.trim()) || `${saveUrl.replace(/\/$/, '')}/api/agents`;
      const proxyRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest: manifest.trim(), metadata: body.metadata }),
      });
      const data = await proxyRes.json().catch(() => ({}));
      json(res, proxyRes.ok ? 201 : proxyRes.status, data);
    } catch (err: any) {
      json(res, 502, { error: 'Save failed', details: err.message });
    }
    return true;
  }

  return false;
}

// ── Wizard definitions ──────────────────────────────────────────────────────

function getWizardDefinitions(kind: string, mode: string) {
  if (kind === 'Agent' && mode === 'quick') {
    return [
      {
        id: 'basics', title: 'Agent Basics', description: 'Name and describe your agent',
        fields: [
          { name: 'name', type: 'text', label: 'Agent Name', required: true, description: 'Unique identifier (lowercase, hyphens ok)' },
          { name: 'description', type: 'textarea', label: 'Description', required: true, description: 'What does this agent do?' },
          { name: 'version', type: 'text', label: 'Version', default: '0.1.0' },
        ],
      },
      {
        id: 'type', title: 'Agent Type', description: 'Select the agent role',
        fields: [
          { name: 'agentType', type: 'select', label: 'Type', required: true, options: [
            { label: 'Worker', value: 'worker', description: 'Executes specific tasks' },
            { label: 'Orchestrator', value: 'orchestrator', description: 'Coordinates other agents' },
            { label: 'Specialist', value: 'specialist', description: 'Domain expert' },
            { label: 'Critic', value: 'critic', description: 'Reviews and validates work' },
            { label: 'Monitor', value: 'monitor', description: 'Observes and reports' },
            { label: 'Gateway', value: 'gateway', description: 'External interface' },
          ]},
        ],
      },
      {
        id: 'platform', title: 'Target Platform', description: 'Where will this agent run?',
        fields: [
          { name: 'platforms', type: 'multiselect', label: 'Platforms', required: true, options: PLATFORMS.map(p => ({ label: p, value: p })) },
        ],
      },
    ];
  }

  if (kind === 'Agent' && mode === 'guided') {
    return [
      {
        id: 'basics', title: 'Agent Basics', description: 'Core identity',
        fields: [
          { name: 'name', type: 'text', label: 'Agent Name', required: true },
          { name: 'description', type: 'textarea', label: 'Description', required: true },
          { name: 'version', type: 'text', label: 'Version', default: '0.1.0' },
          { name: 'agentType', type: 'select', label: 'Type', required: true, options: [
            { label: 'Worker', value: 'worker' },
            { label: 'Orchestrator', value: 'orchestrator' },
            { label: 'Specialist', value: 'specialist' },
            { label: 'Critic', value: 'critic' },
            { label: 'Monitor', value: 'monitor' },
            { label: 'Gateway', value: 'gateway' },
          ]},
        ],
      },
      {
        id: 'capabilities', title: 'Capabilities', description: 'What can this agent do?',
        fields: [
          { name: 'capabilities', type: 'textarea', label: 'Capabilities (one per line)', description: 'e.g. code-review, deploy, test' },
          { name: 'allowedTools', type: 'multiselect', label: 'Allowed Tools', options: [
            { label: 'Bash', value: 'bash' },
            { label: 'File Read', value: 'file_read' },
            { label: 'File Write', value: 'file_write' },
            { label: 'Web Search', value: 'web_search' },
            { label: 'HTTP', value: 'http' },
          ]},
        ],
      },
      {
        id: 'skills', title: 'Skills', description: 'Attach reusable skills',
        fields: [
          { name: 'skills', type: 'multiselect', label: 'Skills', options: BUILTIN_SKILLS.map(s => ({ label: s.name, value: s.name, description: s.description })) },
        ],
      },
      {
        id: 'platform', title: 'Target Platforms', description: 'Export targets',
        fields: [
          { name: 'platforms', type: 'multiselect', label: 'Platforms', required: true, options: PLATFORMS.map(p => ({ label: p, value: p })) },
        ],
      },
    ];
  }

  // Default: return empty steps (expert mode or unknown kind)
  return [];
}
