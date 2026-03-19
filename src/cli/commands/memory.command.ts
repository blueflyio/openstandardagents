/**
 * Memory Command
 * Manages hierarchical memory tiers for OSSA agents.
 *
 * Tiers (workspace > project > session):
 *   workspace/ — cross-project, long-lived facts
 *   project/   — repo-scoped context
 *   session/   — ephemeral, single-run state
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
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
// Root memory command group
// ---------------------------------------------------------------------------

export const memoryCommand = new Command('memory')
  .description(
    'Manage hierarchical memory tiers for OSSA agents (workspace | project | session)'
  )
  .addCommand(memoryInitCommand)
  .addCommand(memoryIndexCommand)
  .addCommand(memoryResolveCommand)
  .addCommand(memoryPromoteCommand);

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
