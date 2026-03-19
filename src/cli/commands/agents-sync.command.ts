/**
 * OSSA Agents Sync Command
 *
 * Syncs platform agents between locations:
 *   NAS:    /Volumes/AgentPlatform/.agents/platform-agents/
 *   Local:  ~/.agents/platform-agents/
 *   Oracle: /opt/agent-platform/.agents/platform-agents/ (via SSH)
 *
 * Also scans project .agents/ folders and builds a unified registry.
 *
 * Usage:
 *   ossa agents-sync                    # Sync NAS → local
 *   ossa agents-sync --target oracle    # Sync NAS → Oracle
 *   ossa agents-sync --scan             # Scan all project .agents/ folders
 *   ossa agents-sync --publish <url>    # Publish all agents to DUADP node
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const NAS_AGENTS_PATH = '/Volumes/AgentPlatform/.agents/platform-agents';
const LOCAL_AGENTS_PATH = path.join(os.homedir(), '.agents', 'platform-agents');
const ORACLE_AGENTS_PATH = '/opt/agent-platform/.agents/platform-agents';

interface SyncStats {
  copied: number;
  skipped: number;
  errors: number;
  agents: string[];
}

function copyDirRecursive(src: string, dest: string, stats: SyncStats): void {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === 'node_modules' || entry.name === '.git') continue;

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, stats);
    } else {
      try {
        const srcStat = fs.statSync(srcPath);
        const destExists = fs.existsSync(destPath);

        if (destExists) {
          const destStat = fs.statSync(destPath);
          if (srcStat.mtimeMs <= destStat.mtimeMs) {
            stats.skipped++;
            continue;
          }
        }

        fs.copyFileSync(srcPath, destPath);
        stats.copied++;
      } catch (err) {
        stats.errors++;
      }
    }
  }
}

function scanAgentsDir(agentsPath: string): string[] {
  const agents: string[] = [];
  if (!fs.existsSync(agentsPath)) return agents;

  // Check @ossa/ scoped agents
  const ossaPath = path.join(agentsPath, '.agents', '@ossa');
  if (fs.existsSync(ossaPath)) {
    const entries = fs.readdirSync(ossaPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        agents.push(`@ossa/${entry.name}`);
      }
    }
  }

  // Check top-level agents
  const topLevel = path.join(agentsPath, '.agents');
  if (fs.existsSync(topLevel)) {
    const entries = fs.readdirSync(topLevel, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !entry.name.startsWith('@') &&
        entry.name !== 'skills'
      ) {
        agents.push(entry.name);
      }
    }
  }

  return agents;
}

export const agentsSyncCommand = new Command('agents-sync')
  .description(
    'Sync platform agents between NAS, local, and Oracle'
  )
  .option(
    '--source <path>',
    'Source agents directory',
    NAS_AGENTS_PATH
  )
  .option(
    '--target <target>',
    'Target: "local" (default), "oracle", or a path',
    'local'
  )
  .option('--scan', 'Scan all WORKING_DEMOs projects for .agents/ folders')
  .option('--publish <url>', 'Publish all agents to a DUADP node')
  .option('--dry-run', 'Show what would be synced without doing it')
  .option('--json', 'Output as JSON')
  .action(
    async (options: {
      source: string;
      target: string;
      scan?: boolean;
      publish?: string;
      dryRun?: boolean;
      json?: boolean;
    }) => {
      // Scan mode — find all .agents/ across projects
      if (options.scan) {
        const workingDemos = path.join(
          os.homedir(),
          'Sites',
          'blueflyio',
          'WORKING_DEMOs'
        );
        if (!fs.existsSync(workingDemos)) {
          console.error(chalk.red(`Not found: ${workingDemos}`));
          process.exit(1);
        }

        const projects = fs.readdirSync(workingDemos, { withFileTypes: true });
        const allAgents: Record<string, string[]> = {};

        for (const project of projects) {
          if (!project.isDirectory()) continue;
          const projectPath = path.join(workingDemos, project.name);

          // Check .agents/
          const dotAgents = path.join(projectPath, '.agents');
          if (fs.existsSync(dotAgents)) {
            const entries = fs
              .readdirSync(dotAgents, { withFileTypes: true })
              .filter(
                (e) =>
                  e.isDirectory() ||
                  e.name.endsWith('.ossa.yaml') ||
                  e.name.endsWith('.ossa.json')
              )
              .map((e) => e.name);
            if (entries.length > 0) {
              allAgents[project.name] = entries;
            }
          }

          // Check agents/
          const agents = path.join(projectPath, 'agents');
          if (fs.existsSync(agents) && !allAgents[project.name]) {
            const entries = fs
              .readdirSync(agents, { withFileTypes: true })
              .filter(
                (e) =>
                  e.isDirectory() ||
                  e.name.endsWith('.ossa.yaml') ||
                  e.name.endsWith('.ossa.json')
              )
              .map((e) => e.name);
            if (entries.length > 0) {
              allAgents[`${project.name}/agents`] = entries;
            }
          }
        }

        if (options.json) {
          console.log(JSON.stringify(allAgents, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nAgent Inventory Across Projects\n'));
          let totalAgents = 0;
          for (const [project, agents] of Object.entries(allAgents)) {
            console.log(chalk.white.bold(`  ${project}/`));
            for (const agent of agents) {
              console.log(chalk.gray(`    ${agent}`));
              totalAgents++;
            }
          }
          console.log(
            chalk.cyan(
              `\n  ${Object.keys(allAgents).length} projects, ${totalAgents} agents/manifests\n`
            )
          );
        }

        // Also show platform agents from NAS
        if (fs.existsSync(options.source)) {
          const nasAgents = scanAgentsDir(options.source);
          if (!options.json) {
            console.log(
              chalk.cyan.bold(`Platform Agents (${options.source})`)
            );
            console.log(
              chalk.white(`  ${nasAgents.length} agents available`)
            );
            console.log(
              chalk.gray(
                `  ${nasAgents.slice(0, 10).join(', ')}${nasAgents.length > 10 ? `, ... +${nasAgents.length - 10} more` : ''}`
              )
            );
          }
        }

        process.exit(0);
      }

      // Sync mode
      const sourcePath = options.source;
      let destPath: string;

      switch (options.target) {
        case 'local':
          destPath = LOCAL_AGENTS_PATH;
          break;
        case 'oracle':
          // For Oracle, we'd need SSH — show the rsync command instead
          console.log(chalk.cyan('Oracle sync requires rsync over SSH:'));
          console.log(
            chalk.white(
              `  rsync -avz --delete ${sourcePath}/ ubuntu@oracle-platform.tailcf98b3.ts.net:${ORACLE_AGENTS_PATH}/`
            )
          );
          process.exit(0);
          break;
        default:
          destPath = options.target;
      }

      if (!fs.existsSync(sourcePath)) {
        console.error(
          chalk.red(`Source not found: ${sourcePath}`)
        );
        console.error(
          chalk.yellow('Is the NAS mounted at /Volumes/AgentPlatform/?')
        );
        process.exit(1);
      }

      if (options.dryRun) {
        const agents = scanAgentsDir(sourcePath);
        console.log(chalk.cyan('Dry run — would sync:'));
        console.log(chalk.white(`  Source: ${sourcePath}`));
        console.log(chalk.white(`  Dest:   ${destPath}`));
        console.log(chalk.white(`  Agents: ${agents.length}`));
        for (const agent of agents.slice(0, 15)) {
          console.log(chalk.gray(`    ${agent}`));
        }
        if (agents.length > 15) {
          console.log(chalk.gray(`    ... +${agents.length - 15} more`));
        }
        process.exit(0);
      }

      // Do the sync
      console.log(chalk.cyan(`Syncing agents...`));
      console.log(chalk.gray(`  From: ${sourcePath}`));
      console.log(chalk.gray(`  To:   ${destPath}`));

      const stats: SyncStats = {
        copied: 0,
        skipped: 0,
        errors: 0,
        agents: [],
      };
      copyDirRecursive(sourcePath, destPath, stats);
      stats.agents = scanAgentsDir(destPath);

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(
          chalk.green(
            `\n✓ Synced: ${stats.copied} files copied, ${stats.skipped} skipped, ${stats.errors} errors`
          )
        );
        console.log(
          chalk.white(`  ${stats.agents.length} agents available locally`)
        );
      }

      // Publish to DUADP if requested
      if (options.publish) {
        console.log(
          chalk.cyan(`\nPublishing ${stats.agents.length} agents to ${options.publish}...`)
        );
        let published = 0;
        let failed = 0;

        for (const agentName of stats.agents) {
          const cleanName = agentName.replace('@ossa/', '');
          const manifestPaths = [
            path.join(destPath, '.agents', '@ossa', cleanName, 'manifest.ossa.yaml'),
            path.join(destPath, '.agents', '@ossa', cleanName, 'agent.ossa.yaml'),
            path.join(destPath, '.agents', '@ossa', cleanName, 'manifest.ossa.json'),
          ];

          let manifestContent: string | null = null;
          for (const mp of manifestPaths) {
            if (fs.existsSync(mp)) {
              manifestContent = fs.readFileSync(mp, 'utf-8');
              break;
            }
          }

          if (!manifestContent) continue;

          try {
            // Parse YAML/JSON
            let manifest: Record<string, unknown>;
            if (manifestContent.trim().startsWith('{')) {
              manifest = JSON.parse(manifestContent);
            } else {
              // Basic YAML parse — for full support would need yaml package
              // For now just publish as-is to the DUADP node
              continue; // Skip YAML for now, only JSON
            }

            const response = await fetch(
              `${options.publish}/api/v1/publish`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manifest),
              }
            );

            if (response.ok) {
              published++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }

        console.log(
          chalk.green(`✓ Published: ${published}, Failed: ${failed}`)
        );
      }
    }
  );
