/**
 * Memory Command
 * Manages hierarchical memory tiers for OSSA agents.
 *
 * Tiers (workspace > project > session):
 *   workspace/ — cross-project, long-lived facts
 *   project/   — repo-scoped context
 *   session/   — ephemeral, single-run state
 *
 * Drupal integration (ossa memory push/pull/flush/sync):
 *   Reads/writes ai_context_item--agent_memory entities on a configured
 *   cc.drupl.ai-compatible Drupal site via the KB Memory Sync REST endpoint.
 *   Replaces the standalone .agents-workspace/migrate-memory-to-drupal.mjs,
 *   write-memory.mjs, and flush-memory.mjs scripts.
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { Command } from 'commander';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MEMORY_TIERS = ['workspace', 'project', 'session'] as const;
type MemoryTier = (typeof MEMORY_TIERS)[number];

const AGENTS_DIR = '.agents/agents';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the memory root for a named agent.
 * Returns  .agents/agents/<name>/memory  relative to cwd (or provided root).
 */
function agentMemoryRoot(agentName: string, workspaceRoot: string): string {
  return path.join(workspaceRoot, AGENTS_DIR, agentName, 'memory');
}

/**
 * Return the full path for a given tier under an agent's memory root.
 */
function tierPath(memRoot: string, tier: MemoryTier): string {
  return path.join(memRoot, tier);
}

// ---------------------------------------------------------------------------
// Subcommand: init
// ---------------------------------------------------------------------------

const memoryInitCommand = new Command('init')
  .description(
    'Initialize memory tier directories for an agent (.agents/agents/<name>/memory/{workspace,project,session}/)'
  )
  .argument('<agent-name>', 'Name of the OSSA agent')
  .option(
    '-w, --workspace-root <path>',
    'Workspace root directory',
    process.cwd()
  )
  .action(async (agentName: string, options: { workspaceRoot: string }) => {
    const root = path.resolve(options.workspaceRoot);
    const memRoot = agentMemoryRoot(agentName, root);

    console.log(chalk.blue(`Initializing memory tiers for agent: ${agentName}`));
    console.log(chalk.gray(`  Memory root: ${memRoot}\n`));

    for (const tier of MEMORY_TIERS) {
      const dir = tierPath(memRoot, tier);
      // TODO: Replace with OSSA-aware mkdir once MemoryService is implemented.
      fs.mkdirSync(dir, { recursive: true });
      console.log(chalk.green(`  ✓ ${tier}/`));
    }

    console.log('');
    console.log(
      chalk.cyan(
        `Memory initialized. Use 'ossa memory index ${agentName}' to populate workspace/ tier.`
      )
    );
  });

// ---------------------------------------------------------------------------
// Subcommand: index
// ---------------------------------------------------------------------------

const memoryIndexCommand = new Command('index')
  .description(
    'Index agent files into the memory hierarchy (reads manifest, catalogs capabilities/tools into memory/workspace/)'
  )
  .argument('<agent-name>', 'Name of the OSSA agent to index')
  .option(
    '-w, --workspace-root <path>',
    'Workspace root directory',
    process.cwd()
  )
  .option(
    '-m, --manifest <path>',
    'Path to agent manifest (defaults to .agents/agents/<name>/<name>.ossa.yaml)'
  )
  .action(
    async (agentName: string, options: { workspaceRoot: string; manifest?: string }) => {
      const root = path.resolve(options.workspaceRoot);
      const memRoot = agentMemoryRoot(agentName, root);
      const workspaceTier = tierPath(memRoot, 'workspace');

      const manifestPath =
        options.manifest ??
        path.join(root, AGENTS_DIR, agentName, `${agentName}.ossa.yaml`);

      console.log(chalk.blue(`Indexing agent: ${agentName}`));
      console.log(chalk.gray(`  Manifest: ${manifestPath}`));
      console.log(chalk.gray(`  Target:   ${workspaceTier}\n`));

      if (!fs.existsSync(manifestPath)) {
        console.error(
          chalk.red(
            `Manifest not found: ${manifestPath}\n` +
              `Run 'ossa memory init ${agentName}' first, then ensure a manifest exists.`
          )
        );
        process.exit(1);
      }

      // TODO: Load manifest via ManifestRepository, extract capabilities/tools,
      // and write structured JSON entries into workspaceTier/.
      // Example output file: workspace/capabilities.json, workspace/tools.json
      console.log(
        chalk.yellow(
          `[TODO] Real indexing not yet implemented.\n` +
            `Would read ${manifestPath} and write catalogued entries to ${workspaceTier}/`
        )
      );
      console.log(chalk.green('  ✓ Index stub complete'));
    }
  );

// ---------------------------------------------------------------------------
// Subcommand: resolve
// ---------------------------------------------------------------------------

const memoryResolveCommand = new Command('resolve')
  .description(
    'Resolve a memory query across tiers (workspace → project → session, returns first match)'
  )
  .argument('<agent-name>', 'Name of the OSSA agent')
  .argument('<query>', 'Memory key or query string to resolve')
  .option(
    '-w, --workspace-root <path>',
    'Workspace root directory',
    process.cwd()
  )
  .option(
    '--tier <tier>',
    `Restrict search to a specific tier (${MEMORY_TIERS.join('|')})`
  )
  .action(
    async (
      agentName: string,
      query: string,
      options: { workspaceRoot: string; tier?: string }
    ) => {
      const root = path.resolve(options.workspaceRoot);
      const memRoot = agentMemoryRoot(agentName, root);

      const tiersToSearch: MemoryTier[] = options.tier
        ? ([options.tier] as MemoryTier[])
        : [...MEMORY_TIERS]; // workspace first (highest priority)

      console.log(chalk.blue(`Resolving query: "${query}" for agent: ${agentName}`));
      console.log(chalk.gray(`  Tiers: ${tiersToSearch.join(' → ')}\n`));

      for (const tier of tiersToSearch) {
        const dir = tierPath(memRoot, tier);
        if (!fs.existsSync(dir)) {
          console.log(chalk.gray(`  [${tier}] directory not found — skipping`));
          continue;
        }

        // TODO: Implement real resolution logic — scan JSON/YAML files in the
        // tier directory for entries whose key/tags match the query string.
        console.log(chalk.yellow(`  [${tier}] TODO: scan ${dir} for "${query}"`));
      }

      console.log('');
      console.log(
        chalk.gray(
          '[TODO] Resolution not yet implemented. No result returned.'
        )
      );
    }
  );

// ---------------------------------------------------------------------------
// Subcommand: promote
// ---------------------------------------------------------------------------

const memoryPromoteCommand = new Command('promote')
  .description(
    'Promote a session-tier memory entry to project or workspace tier'
  )
  .argument('<agent-name>', 'Name of the OSSA agent')
  .argument('<entry-key>', 'Key of the memory entry to promote')
  .option(
    '-w, --workspace-root <path>',
    'Workspace root directory',
    process.cwd()
  )
  .option(
    '--from <tier>',
    'Source tier to promote from',
    'session' satisfies MemoryTier
  )
  .option(
    '--to <tier>',
    'Destination tier to promote to',
    'project' satisfies MemoryTier
  )
  .action(
    async (
      agentName: string,
      entryKey: string,
      options: { workspaceRoot: string; from: string; to: string }
    ) => {
      const root = path.resolve(options.workspaceRoot);
      const memRoot = agentMemoryRoot(agentName, root);

      const validTiers = new Set<string>(MEMORY_TIERS);
      if (!validTiers.has(options.from)) {
        console.error(
          chalk.red(
            `Invalid --from tier: "${options.from}". Must be one of: ${MEMORY_TIERS.join(', ')}`
          )
        );
        process.exit(1);
      }
      if (!validTiers.has(options.to)) {
        console.error(
          chalk.red(
            `Invalid --to tier: "${options.to}". Must be one of: ${MEMORY_TIERS.join(', ')}`
          )
        );
        process.exit(1);
      }

      const fromDir = tierPath(memRoot, options.from as MemoryTier);
      const toDir = tierPath(memRoot, options.to as MemoryTier);

      console.log(chalk.blue(`Promoting memory entry: "${entryKey}" for agent: ${agentName}`));
      console.log(chalk.gray(`  From: ${fromDir}`));
      console.log(chalk.gray(`  To:   ${toDir}\n`));

      // TODO: Locate the entry file in fromDir, copy it to toDir, then
      // optionally remove or archive the source entry.
      console.log(
        chalk.yellow(
          `[TODO] Promotion not yet implemented.\n` +
            `Would copy key "${entryKey}" from ${options.from}/ to ${options.to}/.`
        )
      );
      console.log(chalk.green('  ✓ Promote stub complete'));
    }
  );

// ---------------------------------------------------------------------------
// Drupal-backed helpers (push / pull / flush / write / sync)
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from a Claude auto-memory markdown file.
 * Returns name, description, type, and body.
 */
function parseMemoryFile(raw: string, filename: string): { name: string; description: string; type: string; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) {
    return { name: path.basename(filename, '.md'), description: '', type: 'observation', body: raw.trim() };
  }
  const fm = m[1], body = m[2].trim();
  const get = (k: string) => { const r = fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')); return r ? r[1].trim().replace(/^['"]|['"]$/g, '') : ''; };
  return { name: get('name') || path.basename(filename, '.md'), description: get('description'), type: get('type') || 'observation', body };
}

/**
 * Map Claude auto-memory type to Drupal field_kb_agent_memory_type value.
 */
function mapMemoryType(type: string): string {
  const map: Record<string, string> = { feedback: 'observation', user: 'observation', project: 'observation', reference: 'observation' };
  return map[type] ?? 'observation';
}

/**
 * POST a batch of memories to the KB Memory Sync REST endpoint.
 * Returns the parsed response body.
 */
async function postMemorySync(
  endpoint: string,
  memories: object[],
  token?: string,
): Promise<{ created: number; skipped: number; failed: number; entries: object[] }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (token) {
    // Basic auth: the token file contains user:pass or a bare Bearer token.
    if (token.includes(':')) {
      headers['Authorization'] = `Basic ${Buffer.from(token).toString('base64')}`;
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ memories }) });
  if (!res.ok && res.status !== 207) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<{ created: number; skipped: number; failed: number; entries: object[] }>;
}

/**
 * Read a token from ~/.tokens/<name> if present.
 */
function readToken(name: string): string | undefined {
  const p = path.join(os.homedir(), '.tokens', name);
  try { return fs.readFileSync(p, 'utf8').trim() || undefined; } catch { return undefined; }
}

// ---------------------------------------------------------------------------
// Subcommand: push
// ---------------------------------------------------------------------------

const memoryPushCommand = new Command('push')
  .description('Push local Claude auto-memory files (.claude/projects/*/memory/*.md) to a Drupal KB Memory endpoint')
  .option('--endpoint <url>', 'KB Memory Sync endpoint (default: https://cc.drupl.ai/api/v1/kb-memory/sync)')
  .option('--token-file <name>', 'Token file name under ~/.tokens/ for auth (default: cc-drupl-ai)', 'cc-drupl-ai')
  .option('--memory-dir <path>', 'Source directory of memory .md files (default: ~/.claude/projects/-Users-*/memory/)')
  .option('--agent-id <id>', 'Agent ID to tag memories with (default: claude-code)', 'claude-code')
  .option('--dry-run', 'Print what would be pushed without sending')
  .option('--json', 'Output JSON result')
  .action(async (opts: { endpoint?: string; tokenFile: string; memoryDir?: string; agentId: string; dryRun?: boolean; json?: boolean }) => {
    const endpoint = opts.endpoint ?? 'https://cc.drupl.ai/api/v1/kb-memory/sync';
    const token = readToken(opts.tokenFile);
    const log = (msg: string) => { if (!opts.json) console.log(msg); };
    const err = (msg: string) => { if (!opts.json) console.error(chalk.red(msg)); };

    // Resolve memory directory.
    let memDir = opts.memoryDir;
    if (!memDir) {
      const base = path.join(os.homedir(), '.claude', 'projects');
      const projects = fs.existsSync(base)
        ? fs.readdirSync(base).map(d => path.join(base, d, 'memory')).filter(d => fs.existsSync(d))
        : [];
      if (projects.length === 0) {
        err('No Claude memory directory found under ~/.claude/projects/');
        process.exit(1);
      }
      memDir = projects[0];
    }

    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md') && f !== 'MEMORY.md');
    log(`${chalk.blue('push')} ${files.length} memory files → ${endpoint}\n`);

    const memories = files.map(f => {
      const raw = fs.readFileSync(path.join(memDir!, f), 'utf8');
      const { name, description, type, body } = parseMemoryFile(raw, f);
      return {
        label:      name.substring(0, 255),
        content:    [description, body].filter(Boolean).join('\n\n'),
        type:       mapMemoryType(type),
        domain:     `claude-${type || 'memory'}`,
        agent_id:   opts.agentId,
        confidence: 1.0,
      };
    });

    if (opts.dryRun) {
      memories.forEach(m => log(`  [DRY-RUN] ${(m as { label: string }).label}`));
      log(`\n${memories.length} entries would be pushed.`);
      if (opts.json) process.stdout.write(JSON.stringify({ dry_run: true, count: memories.length }, null, 2) + '\n');
      return;
    }

    try {
      const result = await postMemorySync(endpoint, memories, token);
      log(`${chalk.green('✓')} created: ${result.created}  skipped: ${result.skipped}  failed: ${result.failed}`);
      if (result.failed > 0) {
        log(chalk.yellow('Failed entries:'));
        (result.entries as Array<{ status: string; label?: string; error?: string }>)
          .filter(e => e.status === 'failed')
          .forEach(e => log(`  ${e.label}: ${e.error}`));
      }
      if (opts.json) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      process.exit(result.failed > 0 ? 1 : 0);
    } catch (e) {
      err(`push failed: ${(e as Error).message}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// Subcommand: pull
// ---------------------------------------------------------------------------

const memoryPullCommand = new Command('pull')
  .description('Pull agent_memory entities from Drupal and write them to a local directory')
  .option('--endpoint <url>', 'Drupal JSON:API base (default: https://cc.drupl.ai)')
  .option('--token-file <name>', 'Token file name under ~/.tokens/ (default: cc-drupl-ai)', 'cc-drupl-ai')
  .option('--out-dir <path>', 'Output directory (default: .agents/memory/pulled/)')
  .option('--agent-id <id>', 'Filter by agent_id field')
  .option('--limit <n>', 'Max records to pull (default: 200)', '200')
  .option('--json', 'Output JSON result')
  .action(async (opts: { endpoint?: string; tokenFile: string; outDir?: string; agentId?: string; limit: string; json?: boolean }) => {
    const base = (opts.endpoint ?? 'https://cc.drupl.ai').replace(/\/$/, '');
    const token = readToken(opts.tokenFile);
    const outDir = path.resolve(opts.outDir ?? '.agents/memory/pulled');
    const limit = parseInt(opts.limit, 10) || 200;
    const log = (msg: string) => { if (!opts.json) console.log(msg); };
    const err = (msg: string) => { if (!opts.json) console.error(chalk.red(msg)); };

    const params = new URLSearchParams({
      'filter[type]': 'agent_memory',
      'page[limit]': String(limit),
      'fields[ai_context_item--agent_memory]': 'label,field_kb_agent_memory_content,field_kb_agent_memory_type,field_kb_context_domain,field_kb_gaid,field_kb_agent_id',
    });
    if (opts.agentId) params.set('filter[field_kb_agent_id]', opts.agentId);

    const url = `${base}/jsonapi/ai_context_item/agent_memory?${params}`;
    const headers: Record<string, string> = { Accept: 'application/vnd.api+json' };
    if (token) {
      headers['Authorization'] = token.includes(':')
        ? `Basic ${Buffer.from(token).toString('base64')}`
        : `Bearer ${token}`;
    }

    log(`${chalk.blue('pull')} ${url}`);

    let data: { data: Array<{ attributes: Record<string, unknown>; id: string }> };
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json() as typeof data;
    } catch (e) {
      err(`pull failed: ${(e as Error).message}`);
      process.exit(1);
    }

    fs.mkdirSync(outDir, { recursive: true });
    let written = 0;
    for (const item of data.data) {
      const attrs = item.attributes;
      const label = String(attrs['label'] ?? item.id);
      const content = (attrs['field_kb_agent_memory_content'] as { value?: string } | null)?.value ?? '';
      const type = String(attrs['field_kb_agent_memory_type'] ?? 'observation');
      const domain = String(attrs['field_kb_context_domain'] ?? '');
      const gaid = String(attrs['field_kb_gaid'] ?? '');
      const filename = label.replace(/[^a-z0-9-_]/gi, '-').substring(0, 80) + '.json';
      fs.writeFileSync(path.join(outDir, filename), JSON.stringify({ label, content, type, domain, gaid, id: item.id }, null, 2));
      written++;
    }

    log(`${chalk.green('✓')} pulled ${written} memories → ${outDir}`);
    if (opts.json) process.stdout.write(JSON.stringify({ pulled: written, outDir }, null, 2) + '\n');
  });

// ---------------------------------------------------------------------------
// Subcommand: flush
// ---------------------------------------------------------------------------

const memoryFlushCommand = new Command('flush')
  .description('Flush pending .agents/memory/pending/*.json files to Drupal KB Memory endpoint')
  .option('--endpoint <url>', 'KB Memory Sync endpoint (default: https://cc.drupl.ai/api/v1/kb-memory/sync)')
  .option('--token-file <name>', 'Token file name under ~/.tokens/ (default: cc-drupl-ai)', 'cc-drupl-ai')
  .option('--search-root <path>', 'Root to scan for pending files (default: worktrees/ under cwd)')
  .option('--json', 'Output JSON result')
  .action(async (opts: { endpoint?: string; tokenFile: string; searchRoot?: string; json?: boolean }) => {
    const endpoint = opts.endpoint ?? 'https://cc.drupl.ai/api/v1/kb-memory/sync';
    const token = readToken(opts.tokenFile);
    const log = (msg: string) => { if (!opts.json) console.log(msg); };
    const err = (msg: string) => { if (!opts.json) console.error(chalk.red(msg)); };

    const searchRoot = path.resolve(opts.searchRoot ?? 'worktrees');
    const pending: Array<{ filePath: string; relPath: string }> = [];

    function scanDir(dir: string, depth = 0): void {
      if (depth > 4 || !fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'pending') {
            for (const f of fs.readdirSync(full)) {
              if (f.endsWith('.json')) pending.push({ filePath: path.join(full, f), relPath: path.relative(searchRoot, path.join(full, f)) });
            }
          } else {
            scanDir(full, depth + 1);
          }
        }
      }
    }
    scanDir(searchRoot);

    if (pending.length === 0) {
      log('flush: no pending memory files found');
      if (opts.json) process.stdout.write(JSON.stringify({ flushed: 0, failed: 0 }, null, 2) + '\n');
      return;
    }

    log(`flush: ${pending.length} pending file(s)`);
    let flushed = 0, failed = 0;

    for (const { filePath, relPath } of pending) {
      let record: Record<string, unknown>;
      try { record = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { err(`  skip (bad JSON): ${relPath}`); continue; }

      const memories = [{
        label:      String(record['gaid'] ?? record['session_id'] ?? relPath).substring(0, 255),
        content:    String(record['manifest_yaml'] ?? JSON.stringify(record)),
        type:       'observation',
        domain:     String(record['project'] ?? 'global'),
        agent_id:   String(record['runtime'] ?? 'unknown'),
        confidence: 1.0,
        gaid:       String(record['gaid'] ?? ''),
      }];

      try {
        await postMemorySync(endpoint, memories, token);
        const syncedDir = path.join(path.dirname(filePath), '..', 'synced');
        fs.mkdirSync(syncedDir, { recursive: true });
        fs.renameSync(filePath, path.join(syncedDir, path.basename(filePath)));
        log(`  ${chalk.green('OK')} ${relPath}`);
        flushed++;
      } catch (e) {
        err(`  FAIL ${relPath}: ${(e as Error).message}`);
        failed++;
      }
    }

    log(`\nflush: ${flushed} flushed | ${failed} failed`);
    if (opts.json) process.stdout.write(JSON.stringify({ flushed, failed }, null, 2) + '\n');
    if (failed > 0) process.exit(1);
  });

// ---------------------------------------------------------------------------
// Subcommand: write
// ---------------------------------------------------------------------------

const memoryWriteCommand = new Command('write')
  .description('Write a single pending memory record to .agents/memory/pending/<session>.json')
  .requiredOption('--gaid <uri>', 'Global Agent Identity Descriptor (e.g. ossa://org/agent/instance)')
  .option('--session <uuid>', 'Session UUID (auto-generated if omitted)')
  .option('--project <name>', 'Project name tag')
  .option('--manifest <path>', 'Path to agent manifest YAML')
  .option('--commit <sha>', 'Git commit SHA')
  .option('--mr <url>', 'Merge request URL')
  .option('--runtime <id>', 'Runtime model/engine ID')
  .option('--context <json>', 'Additional context as JSON string', '{}')
  .option('--project-dir <path>', 'Project directory (default: cwd)')
  .action((opts: { gaid: string; session?: string; project?: string; manifest?: string; commit?: string; mr?: string; runtime?: string; context: string; projectDir?: string }) => {
    const projectDir = path.resolve(opts.projectDir ?? process.cwd());
    const sessionId = opts.session ?? crypto.randomUUID();
    const pendingDir = path.join(projectDir, '.agents', 'memory', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    let context: unknown;
    try { context = JSON.parse(opts.context); } catch { context = { raw: opts.context }; }

    const record = {
      gaid:          opts.gaid,
      session_id:    sessionId,
      project:       opts.project ?? '',
      manifest_yaml: opts.manifest ? fs.readFileSync(path.resolve(opts.manifest), 'utf8') : '',
      commit_sha:    opts.commit ?? '',
      mr_url:        opts.mr ?? '',
      runtime:       opts.runtime ?? '',
      context,
      written_at:    new Date().toISOString(),
    };

    const filePath = path.join(pendingDir, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
    console.log(chalk.green(`✓ wrote ${filePath}`));
  });

// ---------------------------------------------------------------------------
// Subcommand: sync (push + pull in one shot)
// ---------------------------------------------------------------------------

const memorySyncCommand = new Command('sync')
  .description('Push local memory files to Drupal, then pull back the full remote set (push + pull)')
  .option('--endpoint-base <url>', 'Drupal base URL (default: https://cc.drupl.ai)', 'https://cc.drupl.ai')
  .option('--token-file <name>', 'Token file name under ~/.tokens/ (default: cc-drupl-ai)', 'cc-drupl-ai')
  .option('--agent-id <id>', 'Agent ID tag for pushed memories (default: claude-code)', 'claude-code')
  .option('--dry-run', 'Dry-run push only, skip pull')
  .option('--json', 'Output JSON result')
  .action(async (opts: { endpointBase: string; tokenFile: string; agentId: string; dryRun?: boolean; json?: boolean }) => {
    const base = opts.endpointBase.replace(/\/$/, '');
    const log = (msg: string) => { if (!opts.json) console.log(msg); };

    // Delegate to push then pull by re-invoking their action logic via sub-process
    // (avoids duplicating the logic; the commands are self-contained).
    const { spawnSync } = await import('child_process');
    const bin = process.argv[1];

    log(chalk.blue('sync: push →'));
    const pushArgs = ['memory', 'push',
      '--endpoint', `${base}/api/v1/kb-memory/sync`,
      '--token-file', opts.tokenFile,
      '--agent-id', opts.agentId,
      ...(opts.dryRun ? ['--dry-run'] : []),
    ];
    const pushResult = spawnSync(process.execPath, [bin, ...pushArgs], { stdio: 'inherit' });

    if (!opts.dryRun) {
      log(chalk.blue('\nsync: pull ←'));
      const pullArgs = ['memory', 'pull',
        '--endpoint', base,
        '--token-file', opts.tokenFile,
      ];
      spawnSync(process.execPath, [bin, ...pullArgs], { stdio: 'inherit' });
    }

    process.exit(pushResult.status ?? 0);
  });

// ---------------------------------------------------------------------------
// Root memory command group
// ---------------------------------------------------------------------------

export const memoryCommand = new Command('memory')
  .description(
    'Manage hierarchical memory tiers for OSSA agents (workspace | project | session) and sync with Drupal sovereign memory (cc.drupl.ai)'
  )
  // Local tier management
  .addCommand(memoryInitCommand)
  .addCommand(memoryIndexCommand)
  .addCommand(memoryResolveCommand)
  .addCommand(memoryPromoteCommand)
  // Drupal-backed Drupal sync (replaces .agents-workspace/ scripts)
  .addCommand(memoryWriteCommand)
  .addCommand(memoryFlushCommand)
  .addCommand(memoryPushCommand)
  .addCommand(memoryPullCommand)
  .addCommand(memorySyncCommand);

// ---------------------------------------------------------------------------
// Register helper (matches task spec — also works with .addCommand() pattern)
// ---------------------------------------------------------------------------

/**
 * Register the memory command group on a commander program.
 * Prefer `program.addCommand(memoryCommand)` directly; this helper exists
 * for callers that use a register-function convention.
 */
export function registerMemoryCommand(program: Command): void {
  program.addCommand(memoryCommand);
}
