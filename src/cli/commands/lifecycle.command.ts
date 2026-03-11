/**
 * OSSA Lifecycle Command Group
 *
 * Agent lifecycle management: score, review, approve, reject, deprecate, archive.
 * Curation: collections, featured, categories, catalog export.
 * DUADP: register/sync with discovery network.
 *
 * Commands:
 *   ossa lifecycle score <manifest>         Score a manifest (0-100)
 *   ossa lifecycle review <name>            Submit agent for review
 *   ossa lifecycle approve <name>           Approve agent
 *   ossa lifecycle reject <name>            Reject agent
 *   ossa lifecycle deprecate <name>         Deprecate agent
 *   ossa lifecycle archive <name>           Archive agent
 *   ossa lifecycle list                     List agents by status
 *   ossa lifecycle stats                    Registry statistics
 *
 *   ossa lifecycle collection create <name> Create a collection
 *   ossa lifecycle collection add <col> <a> Add agent to collection
 *   ossa lifecycle collection list          List collections
 *   ossa lifecycle feature <name>           Mark as featured
 *   ossa lifecycle catalog                  Export full catalog
 *
 *   ossa lifecycle duadp-register <name>    Register with DUADP
 *   ossa lifecycle duadp-sync              Sync all with DUADP
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  addGlobalOptions,
  ExitCode,
} from '../utils/standard-options.js';
import { printSuccess, printError, printInfo, outputJSON } from '../utils/index.js';

// ─── Constants ───────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['review'],
  review: ['approved', 'rejected'],
  approved: ['published', 'deprecated'],
  published: ['deprecated'],
  deprecated: ['archived'],
  rejected: ['archived'],
  archived: [],
};

// ─── Helpers ─────────────────────────────────────────────────────

function resolveAgentsDir(): string {
  // Look for .agents/ in cwd, then in OSSA_DEPLOY_DIR env
  const envDir = process.env.OSSA_DEPLOY_DIR;
  if (envDir) return path.join(envDir, '.agents');

  const cwdDir = path.join(process.cwd(), '.agents');
  if (fs.existsSync(cwdDir)) return cwdDir;

  // Fallback to home dir
  return path.join(process.env.HOME || '~', '.ossa', 'agents');
}

function resolveCurationDir(): string {
  const envDir = process.env.OSSA_DEPLOY_DIR;
  if (envDir) return path.join(envDir, '.curation');
  return path.join(path.dirname(resolveAgentsDir()), '.curation');
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

interface AgentMeta {
  name: string;
  status: string;
  score?: number;
  tags?: string[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  sunsetDate?: string;
  history?: Array<{ from: string; to: string; at: string; by: string }>;
  platforms?: string;
  [key: string]: unknown;
}

function readMeta(agentsDir: string, agentName: string): AgentMeta {
  const metaPath = path.join(agentsDir, agentName, '_meta.json');
  if (!fs.existsSync(metaPath)) {
    return { name: agentName, status: 'draft' };
  }
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

function writeMeta(agentsDir: string, agentName: string, meta: AgentMeta): void {
  const dir = path.join(agentsDir, agentName);
  ensureDir(dir);
  meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(dir, '_meta.json'), JSON.stringify(meta, null, 2) + '\n');
}

function transitionAgent(
  agentsDir: string,
  agentName: string,
  newStatus: string,
  extra: Record<string, unknown> = {}
): AgentMeta {
  const meta = readMeta(agentsDir, agentName);
  const current = meta.status || 'draft';
  const allowed = VALID_TRANSITIONS[current] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition '${agentName}' from '${current}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  if (!meta.history) meta.history = [];
  meta.history.push({
    from: current,
    to: newStatus,
    at: new Date().toISOString(),
    by: process.env.GITLAB_USER_LOGIN || process.env.USER || 'cli',
  });

  meta.status = newStatus;
  Object.assign(meta, extra);
  writeMeta(agentsDir, agentName, meta);
  return meta;
}

// ─── Score ───────────────────────────────────────────────────────

interface ScoreResult {
  total: number;
  categories: Record<string, number>;
}

function scoreManifest(manifestPath: string): ScoreResult {
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const categories: Record<string, number> = {};

  // Identity (20)
  let identity = 0;
  if (/name\s*:\s*["']?.{2,}/m.test(raw)) identity += 5;
  if (/description\s*:\s*["']?.{10,}/m.test(raw)) identity += 5;
  if (/description\s*:\s*["']?.{50,}/m.test(raw)) identity += 2;
  if (/version\s*:\s*["']?\d+\.\d+/m.test(raw)) identity += 4;
  if (/apiVersion\s*:\s*["']?(ossa\/v0\.\d+)/m.test(raw)) identity += 4;
  categories.identity = Math.min(20, identity);

  // Role (25)
  let role = 0;
  if (/role\s*:\s*\|/.test(raw)) role += 15;
  else if (/role\s*:\s*["']?.{20,}/m.test(raw)) role += 10;
  else if (/role\s*:\s*["']?.{5,}/m.test(raw)) role += 5;
  if (/role\s*:[\s\S]*?(You are|Act as|Your task|Your role)/im.test(raw)) role += 5;
  if (/role\s*:[\s\S]*?(step|instructions|guidelines)/im.test(raw)) role += 5;
  categories.role = Math.min(25, role);

  // Tooling (20)
  let tooling = 0;
  const toolMatches = raw.match(/- type:\s*(mcp|api|function|builtin)/gm);
  if (toolMatches) tooling += Math.min(12, toolMatches.length * 4);
  if (/endpoint\s*:\s*https?:\/\//m.test(raw)) tooling += 4;
  if (/capabilities\s*:/m.test(raw)) tooling += 4;
  categories.tooling = Math.min(20, tooling);

  // LLM (10)
  let llm = 0;
  if (/\bllm\s*:/m.test(raw)) llm += 3;
  if (/provider\s*:\s*(anthropic|openai|gemini|ollama|litellm)/m.test(raw)) llm += 3;
  if (/model\s*:\s*["']?\S+/m.test(raw)) llm += 2;
  if (/fallback/im.test(raw)) llm += 2;
  categories.llm = Math.min(10, llm);

  // Security (10)
  let security = 0;
  if (/security\s*:/m.test(raw)) security += 3;
  if (/tier\s*:\s*(open|standard|strict|isolated|signed)/m.test(raw)) security += 3;
  if (/governance\s*:/m.test(raw)) security += 2;
  if (/safety\s*:/m.test(raw) || /guardrails\s*:/m.test(raw)) security += 2;
  categories.security = Math.min(10, security);

  // Metadata (10)
  let metadata = 0;
  if (/labels\s*:/m.test(raw)) metadata += 3;
  if (/tags\s*:/m.test(raw) || /category\s*:/m.test(raw)) metadata += 3;
  if (/publisher\s*:/m.test(raw)) metadata += 2;
  if (/license\s*:/m.test(raw)) metadata += 2;
  categories.metadata = Math.min(10, metadata);

  // Extensions (5)
  let extensions = 0;
  if (/extensions\s*:/m.test(raw)) extensions += 2;
  if (/agentscope\s*:/m.test(raw)) extensions += 1;
  if (/a2a\s*:/m.test(raw)) extensions += 1;
  if (/protocols\s*:/m.test(raw)) extensions += 1;
  categories.extensions = Math.min(5, extensions);

  const total = Object.values(categories).reduce((sum, v) => sum + v, 0);
  return { total: Math.min(100, total), categories };
}

// ─── DUADP Registration ─────────────────────────────────────────

async function registerWithDuadp(
  agentsDir: string,
  agentName: string,
  nodeUrl: string
): Promise<boolean> {
  const manifestPath = path.join(agentsDir, agentName, 'manifest.ossa.yaml');
  if (!fs.existsSync(manifestPath)) return false;

  const manifestYaml = fs.readFileSync(manifestPath, 'utf-8');
  const meta = readMeta(agentsDir, agentName);

  // Simple YAML key extraction
  const get = (key: string) => {
    const match = manifestYaml.match(new RegExp(`^\\s*${key}:\\s*(.+)`, 'm'));
    return match ? match[1].replace(/^["']|["']$/g, '').trim() : null;
  };

  const payload = {
    gaid: `ossa://${get('name') || agentName}`,
    name: get('name') || agentName,
    kind: get('kind') || 'Agent',
    description: get('description') || '',
    version: get('version') || '0.0.0',
    source: 'ossa-cli',
    score: meta.score || 0,
    status: meta.status || 'draft',
    tags: meta.tags || [],
    manifest_yaml: manifestYaml,
  };

  const token = process.env.DUADP_PUBLISH_TOKEN;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${nodeUrl}/api/v1/publish`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Command Factory ─────────────────────────────────────────────

export function createLifecycleCommand(): Command {
  const lifecycle = new Command('lifecycle')
    .description('Agent lifecycle management, curation, and DUADP registration')
    .alias('lc');

  // ── score ────────────────────────────────────────────────────
  const scoreCmd = new Command('score')
    .argument('<manifest>', 'Path to OSSA manifest')
    .option('--min <score>', 'Minimum passing score', '75')
    .description('Score an OSSA manifest (0-100 across 7 categories)');
  addGlobalOptions(scoreCmd);
  scoreCmd.action(async (manifestFile: string, options: { min?: string; verbose?: boolean; json?: boolean; quiet?: boolean; color?: boolean }) => {
    if (!fs.existsSync(manifestFile)) {
      printError(`File not found: ${manifestFile}`);
      process.exit(ExitCode.GENERAL_ERROR);
    }
    const result = scoreManifest(manifestFile);
    const minScore = parseInt(options.min || '75', 10);
    const pass = result.total >= minScore;

    if (options.json) {
      outputJSON({ ...result, pass, min: minScore });
    } else {
      const maxes: Record<string, number> = { identity: 20, role: 25, tooling: 20, llm: 10, security: 10, metadata: 10, extensions: 5 };
      console.log(`\n  Manifest: ${manifestFile}`);
      console.log(`  Score: ${result.total}/100 (minimum: ${minScore})\n`);
      for (const [cat, score] of Object.entries(result.categories)) {
        const max = maxes[cat] || 0;
        const bar = '█'.repeat(Math.round((score / max) * 10)).padEnd(10, '░');
        console.log(`  ${cat.padEnd(12)} ${bar} ${score}/${max}`);
      }
      console.log(`\n  ${pass ? chalk.green('PASS') : chalk.red('FAIL')}\n`);
    }
    process.exit(pass ? ExitCode.SUCCESS : ExitCode.GENERAL_ERROR);
  });

  // ── Status transition commands ───────────────────────────────
  for (const { name, desc, status, extraOpts } of [
    { name: 'review', desc: 'Submit agent for review', status: 'review', extraOpts: [] as string[] },
    { name: 'approve', desc: 'Approve agent for publishing', status: 'approved', extraOpts: [] as string[] },
    { name: 'reject', desc: 'Reject agent with reason', status: 'rejected', extraOpts: ['--reason <reason>'] },
    { name: 'deprecate', desc: 'Mark agent as deprecated', status: 'deprecated', extraOpts: ['--sunset <date>'] },
    { name: 'archive', desc: 'Archive agent', status: 'archived', extraOpts: [] as string[] },
  ]) {
    const cmd = new Command(name)
      .argument('<name>', 'Agent name')
      .description(desc);
    for (const opt of extraOpts) {
      cmd.option(opt, `${name} option`);
    }
    addGlobalOptions(cmd);
    cmd.action(async (agentName: string, options: Record<string, string | boolean | undefined>) => {
      const agentsDir = resolveAgentsDir();
      try {
        const extra: Record<string, unknown> = {};
        if (options.reason) extra.rejectionReason = options.reason;
        if (options.sunset) extra.sunsetDate = options.sunset;
        if (status === 'approved') extra.approvedBy = process.env.USER || 'cli';

        const meta = transitionAgent(agentsDir, agentName, status, extra);

        if (status === 'archived') {
          const archiveDir = path.join(path.dirname(agentsDir), '.archive');
          ensureDir(archiveDir);
          const src = path.join(agentsDir, agentName);
          const dest = path.join(archiveDir, agentName);
          if (fs.existsSync(src)) {
            fs.renameSync(src, dest);
          }
        }

        if (options.json) {
          outputJSON({ name: agentName, status: meta.status, updatedAt: meta.updatedAt });
        } else {
          printSuccess(`${agentName}: → ${meta.status}`);
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
    lifecycle.addCommand(cmd);
  }

  // ── list ─────────────────────────────────────────────────────
  const listCmd = new Command('list')
    .option('--status <status>', 'Filter by status')
    .description('List agents in the registry');
  addGlobalOptions(listCmd);
  listCmd.action(async (options: { status?: string; json?: boolean; quiet?: boolean }) => {
    const agentsDir = resolveAgentsDir();
    if (!fs.existsSync(agentsDir)) {
      if (!options.quiet) printInfo('No agents directory found');
      return;
    }
    const dirs = fs.readdirSync(agentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'incoming');

    const agents = dirs.map(d => readMeta(agentsDir, d.name))
      .filter(a => !options.status || a.status === options.status);

    if (options.json) {
      outputJSON({ agents, total: agents.length });
    } else {
      console.log(`\n${'Name'.padEnd(30)} ${'Status'.padEnd(12)} ${'Score'.padEnd(6)} Tags`);
      console.log('-'.repeat(80));
      for (const a of agents) {
        console.log(`${(a.name || '').padEnd(30)} ${(a.status || 'draft').padEnd(12)} ${String(a.score ?? '-').padEnd(6)} ${(a.tags || []).join(',')}`);
      }
      console.log(`\nTotal: ${agents.length}`);
    }
  });

  // ── stats ────────────────────────────────────────────────────
  const statsCmd = new Command('stats')
    .description('Show registry statistics');
  addGlobalOptions(statsCmd);
  statsCmd.action(async (options: { json?: boolean }) => {
    const agentsDir = resolveAgentsDir();
    if (!fs.existsSync(agentsDir)) {
      printInfo('No agents directory found');
      return;
    }
    const dirs = fs.readdirSync(agentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'incoming');

    const byStatus: Record<string, number> = {};
    let totalScore = 0;
    let scored = 0;

    for (const d of dirs) {
      const meta = readMeta(agentsDir, d.name);
      byStatus[meta.status] = (byStatus[meta.status] || 0) + 1;
      if (meta.score != null) { totalScore += meta.score; scored++; }
    }

    if (options.json) {
      outputJSON({ total: dirs.length, averageScore: scored ? Math.round(totalScore / scored) : null, byStatus });
    } else {
      console.log('\nAgent Registry Stats');
      console.log('─'.repeat(40));
      console.log(`Total: ${dirs.length}`);
      console.log(`Average score: ${scored ? Math.round(totalScore / scored) : 'N/A'}`);
      for (const [s, c] of Object.entries(byStatus).sort()) {
        console.log(`  ${s.padEnd(15)} ${c}`);
      }
    }
  });

  // ── feature ──────────────────────────────────────────────────
  const featureCmd = new Command('feature')
    .argument('<name>', 'Agent name')
    .description('Mark agent as featured');
  addGlobalOptions(featureCmd);
  featureCmd.action(async (agentName: string, options: { json?: boolean }) => {
    const curationDir = resolveCurationDir();
    ensureDir(curationDir);
    const featPath = path.join(curationDir, 'featured.json');
    const data = fs.existsSync(featPath) ? JSON.parse(fs.readFileSync(featPath, 'utf-8')) : { featured: [] };
    if (!data.featured.includes(agentName)) data.featured.push(agentName);
    fs.writeFileSync(featPath, JSON.stringify(data, null, 2) + '\n');
    if (options.json) outputJSON({ featured: data.featured });
    else printSuccess(`${agentName} added to featured`);
  });

  // ── catalog ──────────────────────────────────────────────────
  const catalogCmd = new Command('catalog')
    .option('-o, --output <path>', 'Output path', '.curation/catalog.json')
    .description('Export full agent catalog as JSON');
  addGlobalOptions(catalogCmd);
  catalogCmd.action(async (options: { output?: string; json?: boolean }) => {
    const agentsDir = resolveAgentsDir();
    const curationDir = resolveCurationDir();
    ensureDir(curationDir);

    if (!fs.existsSync(agentsDir)) {
      printInfo('No agents directory found');
      return;
    }

    const dirs = fs.readdirSync(agentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'incoming');

    const featPath = path.join(curationDir, 'featured.json');
    const featured = fs.existsSync(featPath) ? JSON.parse(fs.readFileSync(featPath, 'utf-8')).featured : [];

    const agents = dirs.map(d => {
      const meta = readMeta(agentsDir, d.name);
      return {
        slug: d.name,
        name: meta.name || d.name,
        score: meta.score || 0,
        status: meta.status || 'draft',
        category: meta.category || 'uncategorized',
        tags: meta.tags || [],
        featured: featured.includes(d.name),
      };
    }).sort((a, b) => b.score - a.score);

    const catalog = {
      generatedAt: new Date().toISOString(),
      total: agents.length,
      featured: featured.length,
      agents,
    };

    const outPath = options.output || path.join(curationDir, 'catalog.json');
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n');

    if (options.json) outputJSON(catalog);
    else printSuccess(`Catalog exported: ${outPath} (${agents.length} agents)`);
  });

  // ── duadp-register ───────────────────────────────────────────
  const duadpRegCmd = new Command('duadp-register')
    .argument('<name>', 'Agent name')
    .option('--node <url>', 'DUADP node URL', 'https://discover.duadp.org')
    .description('Register agent with DUADP discovery network');
  addGlobalOptions(duadpRegCmd);
  duadpRegCmd.action(async (agentName: string, options: { node?: string; json?: boolean }) => {
    const agentsDir = resolveAgentsDir();
    const nodeUrl = options.node || 'https://discover.duadp.org';
    const ok = await registerWithDuadp(agentsDir, agentName, nodeUrl);
    if (options.json) outputJSON({ name: agentName, registered: ok, node: nodeUrl });
    else if (ok) printSuccess(`${agentName} registered on ${nodeUrl}`);
    else printError(`Failed to register ${agentName} on ${nodeUrl}`);
    process.exit(ok ? ExitCode.SUCCESS : ExitCode.GENERAL_ERROR);
  });

  // ── duadp-sync ───────────────────────────────────────────────
  const duadpSyncCmd = new Command('duadp-sync')
    .option('--node <url>', 'DUADP node URL', 'https://discover.duadp.org')
    .description('Sync all approved/published agents with DUADP');
  addGlobalOptions(duadpSyncCmd);
  duadpSyncCmd.action(async (options: { node?: string; json?: boolean; quiet?: boolean }) => {
    const agentsDir = resolveAgentsDir();
    const nodeUrl = options.node || 'https://discover.duadp.org';

    if (!fs.existsSync(agentsDir)) {
      printInfo('No agents directory found');
      return;
    }

    const dirs = fs.readdirSync(agentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'incoming');

    let registered = 0;
    let skipped = 0;

    for (const d of dirs) {
      const meta = readMeta(agentsDir, d.name);
      if (['approved', 'published'].includes(meta.status)) {
        const ok = await registerWithDuadp(agentsDir, d.name, nodeUrl);
        if (ok) registered++;
        if (!options.quiet) console.log(`  ${ok ? '✓' : '✗'} ${d.name}`);
      } else {
        skipped++;
      }
    }

    if (options.json) outputJSON({ registered, skipped, node: nodeUrl });
    else printSuccess(`Synced: ${registered} registered, ${skipped} skipped`);
  });

  // Register all subcommands
  lifecycle.addCommand(scoreCmd);
  lifecycle.addCommand(listCmd);
  lifecycle.addCommand(statsCmd);
  lifecycle.addCommand(featureCmd);
  lifecycle.addCommand(catalogCmd);
  lifecycle.addCommand(duadpRegCmd);
  lifecycle.addCommand(duadpSyncCmd);

  return lifecycle;
}
