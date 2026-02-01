/**
 * Agents List Command
 * List all OSSA agents in workspace with filtering and search
 *
 * SOLID: Single Responsibility - Agent listing only
 * DRY: Reusable across CLI and API
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'yaml';
import type { OssaAgent } from '../../../types/index.js';

interface AgentSummary {
  name: string;
  version: string;
  description: string;
  apiVersion: string;
  kind: string;
  capabilities?: string[];
  tools?: number;
  filePath: string;
  created?: Date;
  updated?: Date;
}

export const agentsListCommand = new Command('list')
  .description('List all OSSA agents in workspace')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --capability <capability>', 'Filter by capability')
  .option('-s, --search <query>', 'Search agents by name or description')
  .option('-v, --version <version>', 'Filter by API version')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      const agents = await findAgents(process.cwd());
      let filtered = agents;

      // Apply filters
      if (options.category) {
        filtered = filtered.filter((a) =>
          a.capabilities?.some((cap) =>
            cap.toLowerCase().includes(options.category.toLowerCase())
          )
        );
      }

      if (options.capability) {
        filtered = filtered.filter((a) =>
          a.capabilities?.some((cap) =>
            cap.toLowerCase().includes(options.capability.toLowerCase())
          )
        );
      }

      if (options.search) {
        const query = options.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.description?.toLowerCase().includes(query)
        );
      }

      if (options.version) {
        filtered = filtered.filter((a) => a.apiVersion === options.version);
      }

      // Output results
      if (options.json) {
        console.log(
          JSON.stringify({ total: filtered.length, agents: filtered }, null, 2)
        );
      } else {
        displayAgents(filtered, options.verbose);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to list agents: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

/**
 * Find all OSSA agent manifests in directory tree
 */
async function findAgents(dir: string): Promise<AgentSummary[]> {
  const agents: AgentSummary[] = [];
  const patterns = [
    '**/*.ossa.yaml',
    '**/*.ossa.yml',
    '**/agent.yaml',
    '**/agent.yml',
  ];

  for (const pattern of patterns) {
    const glob = await import('glob');
    const files = glob.sync(pattern, {
      cwd: dir,
      ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**'],
      absolute: true,
    });

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const manifest = yaml.parse(content) as OssaAgent;

        if (
          manifest.apiVersion?.startsWith('ossa/') &&
          manifest.kind === 'Agent'
        ) {
          const stats = fs.statSync(file);
          agents.push({
            name:
              manifest.metadata?.name ||
              path.basename(file, path.extname(file)),
            version: manifest.metadata?.version || '0.0.0',
            description: manifest.metadata?.description || '',
            apiVersion: manifest.apiVersion,
            kind: manifest.kind,
            capabilities: manifest.spec?.capabilities as string[] | undefined,
            tools: Array.isArray(manifest.spec?.tools)
              ? manifest.spec.tools.length
              : 0,
            filePath: file,
            created: stats.birthtime,
            updated: stats.mtime,
          });
        }
      } catch (error) {
        // Skip invalid files
        continue;
      }
    }
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Display agents in formatted table
 */
function displayAgents(agents: AgentSummary[], verbose: boolean = false): void {
  if (agents.length === 0) {
    console.log(chalk.yellow('No agents found in workspace'));
    console.log(chalk.gray('\nCreate your first agent with: ossa wizard'));
    return;
  }

  console.log(
    chalk.blue.bold(
      `\n Found ${agents.length} agent${agents.length === 1 ? '' : 's'}:\n`
    )
  );

  agents.forEach((agent, index) => {
    // Basic info
    console.log(
      `${chalk.cyan((index + 1).toString().padStart(3))}. ${chalk.bold(agent.name)} ${chalk.gray(`v${agent.version}`)}`
    );

    if (agent.description) {
      console.log(`     ${chalk.gray(agent.description)}`);
    }

    if (verbose) {
      // Detailed info
      console.log(`     ${chalk.gray(`API: ${agent.apiVersion}`)}`);

      if (agent.capabilities && agent.capabilities.length > 0) {
        console.log(
          `     ${chalk.gray(`Capabilities: ${agent.capabilities.slice(0, 5).join(', ')}${agent.capabilities.length > 5 ? '...' : ''}`)}`
        );
      }

      if (agent.tools !== undefined && agent.tools > 0) {
        console.log(`     ${chalk.gray(`Tools: ${agent.tools}`)}`);
      }

      console.log(
        `     ${chalk.gray(`File: ${path.relative(process.cwd(), agent.filePath)}`)}`
      );

      if (agent.updated) {
        console.log(
          `     ${chalk.gray(`Updated: ${agent.updated.toLocaleDateString()}`)}`
        );
      }
    }

    console.log(); // Blank line between agents
  });

  // Summary
  if (!verbose) {
    console.log(chalk.gray('Use --verbose for more details\n'));
  }
}
