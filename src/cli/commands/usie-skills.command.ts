/**
 * usie-skills.command.ts — `ossa skills ingest|sync|mesh` command group
 *
 * USIE (Universal Skills Ingestion Engine) CLI commands.
 * Distinct from skills.command.ts (which handles Claude Skills export pipeline).
 *
 * Commands:
 *   ossa skills ingest <url>      — POST /api/v1/ingest: ingest GitHub repo onto mesh
 *   ossa skills mesh sync         — sync all adapters from ~/.ossa/adapters.yaml
 *   ossa skills mesh list         — list skills on the connected DUADP node
 *   ossa skills mesh preview <url>— dry-run: detect adapter, show what would be generated
 *   ossa skills mesh push <gaid>  — push skill bundle to another DUADP node
 *   ossa skills validate <path>   — validate local SKILL.md against OSSA schema
 *   ossa skills config            — show ~/.ossa/adapters.yaml and active adapters
 *
 * Config: ~/.ossa/adapters.yaml
 * DUADP node: DUADP_NODE_URL env (default: https://discover.copaw.us)
 *
 * SOD: This CLI is a thin consumer of the DUADP /api/v1/ingest endpoint.
 *      No adapter logic here — that lives in @bluefly/duadp SDK.
 */

import { Command } from 'commander';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// ── Config ────────────────────────────────────────────────────────────────────

const DUADP_NODE = process.env.DUADP_NODE_URL ?? 'https://discover.copaw.us';
const OSSA_CONFIG_DIR = path.join(os.homedir(), '.ossa');
const ADAPTERS_YAML = path.join(OSSA_CONFIG_DIR, 'adapters.yaml');

const DEFAULT_ADAPTERS_YAML = `# ~/.ossa/adapters.yaml — USIE adapter registry
# Skill sources that 'ossa skills mesh sync' will ingest.

adapters:
  - id: kiro-powers
    label: "Kiro Powers"
    url: "https://github.com/kirodotdev/powers"
    adapter: "kiro"
    enabled: true

  - id: skills-sh
    label: "skills.sh Registry"
    url: "https://github.com/skills-sh/skills"
    adapter: "skills-sh"
    enabled: true

  # Add your own:
  # - id: my-skills
  #   label: "My Custom Skills"
  #   url: "https://github.com/me/my-skills"
  #   adapter: "auto"
  #   enabled: true
`;

interface AdapterConfig {
  id: string;
  label: string;
  url: string;
  adapter: 'kiro' | 'skills-sh' | 'git-repo' | 'auto';
  enabled: boolean;
}

function ensureConfig(): void {
  if (!fs.existsSync(OSSA_CONFIG_DIR)) fs.mkdirSync(OSSA_CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(ADAPTERS_YAML)) {
    fs.writeFileSync(ADAPTERS_YAML, DEFAULT_ADAPTERS_YAML, 'utf8');
    console.log(`✅ Created default adapters config: ${ADAPTERS_YAML}\n`);
  }
}

function loadAdapters(): AdapterConfig[] {
  ensureConfig();
  const lines = fs.readFileSync(ADAPTERS_YAML, 'utf8').split('\n');
  const adapters: AdapterConfig[] = [];
  let cur: Partial<AdapterConfig> | null = null;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('- id:')) {
      if (cur?.id) adapters.push(cur as AdapterConfig);
      cur = { id: t.replace(/- id:\s*["']?/, '').replace(/["']$/, ''), enabled: true };
    } else if (cur && t.startsWith('label:'))   cur.label   = t.replace(/label:\s*["']?/, '').replace(/["']$/, '');
    else if (cur && t.startsWith('url:'))        cur.url     = t.replace(/url:\s*["']?/, '').replace(/["']$/, '');
    else if (cur && t.startsWith('adapter:'))    cur.adapter = t.replace(/adapter:\s*["']?/, '').replace(/["']$/, '') as AdapterConfig['adapter'];
    else if (cur && t.startsWith('enabled:'))    cur.enabled = t.includes('true');
  }
  if (cur?.id) adapters.push(cur as AdapterConfig);
  return adapters.filter(a => a.enabled !== false && a.url);
}

function getToken(): string | undefined {
  return process.env.DUADP_TOKEN ?? process.env.OSSA_PUBLISH_TOKEN;
}

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${DUADP_NODE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'ossa-cli/usie' },
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

async function apiPost(path: string, body: unknown, token?: string): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': 'ossa-cli/usie' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${DUADP_NODE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// ── Implementations ───────────────────────────────────────────────────────────

async function cmdIngest(url: string, opts: { adapter?: string; json?: boolean }): Promise<void> {
  const token = getToken();
  if (!token) { console.error('❌ Set DUADP_TOKEN or OSSA_PUBLISH_TOKEN'); process.exit(1); }
  console.log(`🔍 Ingesting ${url} ...`);
  try {
    const r = await apiPost('/api/v1/ingest', { url, adapter: opts.adapter ?? 'auto' }, token) as any;
    if (opts.json) { console.log(JSON.stringify(r, null, 2)); return; }
    console.log(`\n✅ Skill is live on the mesh!\n`);
    console.log(`   GAID:        ${r.gaid}`);
    console.log(`   Name:        ${r.name}`);
    console.log(`   Adapter:     ${r.adapter_used}`);
    console.log(`   Trust tier:  ${r.trust_tier}`);
    console.log(`   Marketplace: ${r.marketplace_url}\n`);
  } catch (e: any) { console.error(`❌ ${e.message}`); process.exit(1); }
}

async function cmdList(opts: { source?: string; json?: boolean }): Promise<void> {
  try {
    const qs = opts.source ? `?source=${encodeURIComponent(opts.source)}` : '';
    const d = await apiGet(`/api/v1/skills${qs}`) as any;
    if (opts.json) { console.log(JSON.stringify(d, null, 2)); return; }
    const src = opts.source ? ` (source: ${opts.source})` : '';
    console.log(`\n📋 Skills on ${DUADP_NODE}${src}\n`);
    for (const s of d.data ?? []) {
      const gaid = s?.identity?.gaid ?? s?.metadata?.name ?? '?';
      const tier = s?.metadata?.trust_tier ?? 'community';
      const source = s?.metadata?.annotations?.['usie.source'] ?? '';
      const icon = source === 'kiro-powers' ? '⚡' : source === 'skills-sh' ? '🎯' : '🔧';
      console.log(`  ${icon} ${gaid}  [${tier}]`);
    }
    console.log(`\n  Total: ${d.meta?.total ?? 0}\n`);
  } catch (e: any) { console.error(`❌ ${e.message}`); process.exit(1); }
}

async function cmdSync(opts: { dry?: boolean; json?: boolean }): Promise<void> {
  const adapters = loadAdapters();
  const token = getToken();
  if (!token && !opts.dry) { console.error('❌ Set DUADP_TOKEN or OSSA_PUBLISH_TOKEN'); process.exit(1); }
  console.log(`\n🔄 Syncing ${adapters.length} adapter(s)${opts.dry ? ' [DRY RUN]' : ''}...\n`);
  const results: unknown[] = [];
  for (const a of adapters) {
    process.stdout.write(`  ${a.id}: `);
    if (opts.dry) { console.log(`${a.url} (skipped)`); results.push({ adapter: a.id, status: 'dry' }); continue; }
    try {
      const r = await apiPost('/api/v1/ingest', { url: a.url, adapter: a.adapter }, token) as any;
      console.log(`✅ ${r.gaid ?? r.name}`);
      results.push({ adapter: a.id, status: 'ok', gaid: r.gaid });
    } catch (e: any) { console.log(`❌ ${e.message.slice(0, 80)}`); results.push({ adapter: a.id, status: 'error', error: e.message }); }
  }
  if (opts.json) console.log(JSON.stringify(results, null, 2));
  else console.log(`\n  Done. ${results.filter((r: any) => r['status'] === 'ok').length}/${adapters.length} synced.\n`);
}

async function cmdPreview(url: string): Promise<void> {
  const slug = url.match(/github\.com\/([^/]+\/[^/]+)/)?.[1] ?? '';
  const base = `https://raw.githubusercontent.com/${slug}/HEAD`;
  const [p, s, r] = await Promise.allSettled([
    fetch(`${base}/POWER.md`, { method: 'HEAD' }),
    fetch(`${base}/SKILL.md`, { method: 'HEAD' }),
    fetch(`${base}/README.md`, { method: 'HEAD' }),
  ]);
  const ok = (x: PromiseSettledResult<Response>) => x.status === 'fulfilled' && (x.value as Response).ok;
  const adapter = ok(p) ? '⚡ kiro (POWER.md)' : ok(s) ? '🎯 skills-sh (SKILL.md)' : ok(r) ? '🔧 git-repo (README)' : '❌ no manifest';
  console.log(`\n  URL:        ${url}`);
  console.log(`  Adapter:    ${adapter}`);
  console.log(`  POWER.md:   ${ok(p) ? '✅' : '—'}   SKILL.md: ${ok(s) ? '✅' : '—'}   README.md: ${ok(r) ? '✅' : '—'}`);
  console.log(`\n  Run: ossa skills ingest ${url}\n`);
}

async function cmdValidate(skillPath: string): Promise<void> {
  const file = path.resolve(skillPath);
  if (!fs.existsSync(file)) { console.error(`❌ Not found: ${file}`); process.exit(1); }
  const content = await readFile(file, 'utf8');
  const errs: string[] = [];
  if (!content.includes('name:') && !/^# .+/m.test(content)) errs.push('Missing name: or # Heading');
  if (!content.includes('description:') && !/## description/i.test(content)) errs.push('Missing description');
  if (errs.length === 0) console.log(`✅ ${path.basename(file)} — valid OSSA skill manifest`);
  else { console.log(`❌ ${path.basename(file)} — ${errs.length} issue(s):\n${errs.map(e => `  - ${e}`).join('\n')}`); process.exit(1); }
}

async function cmdPush(gaid: string, opts: { node?: string }): Promise<void> {
  const token = getToken();
  if (!token) { console.error('❌ Set DUADP_TOKEN or OSSA_PUBLISH_TOKEN'); process.exit(1); }
  const target = opts.node ?? DUADP_NODE;
  console.log(`📤 Pushing ${gaid} → ${target} ...`);
  try {
    const bundle = await apiGet(`/api/v1/skills/${encodeURIComponent(gaid)}/bundle`);
    const res = await fetch(`${target}/api/v1/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(bundle),
    });
    const r = await res.json() as any;
    if (!res.ok) throw new Error(JSON.stringify(r));
    console.log(`✅ Pushed: ${r.gaid ?? gaid}`);
  } catch (e: any) { console.error(`❌ ${e.message}`); process.exit(1); }
}

// ── Commander export ──────────────────────────────────────────────────────────

export function usieSkillsCommandGroup(): Command {
  const skills = new Command('skills').description('USIE: ingest and manage skills on the agent mesh');

  skills
    .command('ingest <url>')
    .description('Ingest a GitHub repo as a skill (30-second DrupalCon demo)')
    .option('--adapter <type>', 'Force adapter: kiro|skills-sh|git-repo|auto', 'auto')
    .option('--json', 'JSON output')
    .action(cmdIngest);

  const mesh = skills.command('mesh').description('Manage skills on the DUADP mesh');

  mesh
    .command('list')
    .description('List skills on the connected DUADP node')
    .option('--source <id>', 'Filter by adapter: kiro-powers|skills-sh|git-repo')
    .option('--json', 'JSON output')
    .action(cmdList);

  mesh
    .command('sync')
    .description('Sync all adapters in ~/.ossa/adapters.yaml to the DUADP node')
    .option('--dry', 'Dry run — show what would be ingested')
    .option('--json', 'JSON output')
    .action(cmdSync);

  mesh
    .command('preview <url>')
    .description('Preview adapter detection for a GitHub URL (no publish)')
    .action(cmdPreview);

  mesh
    .command('push <gaid>')
    .description('Push a skill bundle to another DUADP node')
    .option('--node <url>', 'Target DUADP node URL')
    .action(cmdPush);

  skills
    .command('validate <path>')
    .description('Validate a local SKILL.md or POWER.md')
    .action(cmdValidate);

  skills
    .command('config')
    .description('Show adapters.yaml config and active adapters')
    .action(() => {
      ensureConfig();
      const adapters = loadAdapters();
      console.log(`\n📁 ${ADAPTERS_YAML}`);
      console.log(`🔌 Node: ${DUADP_NODE}\n`);
      for (const a of adapters) console.log(`  ${a.id}  ${a.url}  (${a.adapter})`);
      console.log();
    });

  return skills;
}
