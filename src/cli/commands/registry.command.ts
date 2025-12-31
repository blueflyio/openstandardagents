/**
 * OSSA Registry Command - Agent Discovery and Catalog
 *
 * Subcommands:
 *   ossa registry list       - List all registered agents
 *   ossa registry add        - Add agent to registry
 *   ossa registry remove     - Remove agent from registry
 *   ossa registry discover   - Auto-discover agents in workspace
 *   ossa registry export     - Export registry as JSON/YAML
 *   ossa registry validate   - Validate all registered agents
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { glob } from 'glob';

interface AgentEntry {
  name: string;
  manifest: string;
  capabilities: string[];
  skills?: string[];
  kind?: string;
}

interface ProjectEntry {
  project: string;
  path: string;
  agents: AgentEntry[];
  capabilities?: string[];
  skills?: string[];
}

interface Registry {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version: string;
    description?: string;
  };
  agents: ProjectEntry[];
  discovery?: {
    strategy: string;
    refresh: string;
    patterns: string[];
  };
}

export const registryCommand = new Command('registry')
  .description('Manage agent registry (discovery and catalog)');

// ============================================================================
// Subcommand: registry list
// ============================================================================
registryCommand
  .command('list')
  .description('List all registered agents')
  .option('--json', 'Output as JSON')
  .option('--yaml', 'Output as YAML')
  .option('--filter <capability>', 'Filter by capability')
  .option('--kind <kind>', 'Filter by kind (Agent, Workflow, Task)')
  .action(async (options) => {
    try {
      const registry = loadRegistry();

      if (!registry) {
        console.log(chalk.yellow('⚠ No workspace registry found'));
        console.log(chalk.gray('  Run `ossa workspace init` first'));
        process.exit(1);
      }

      let agents = flattenAgents(registry);

      // Apply filters
      if (options.filter) {
        agents = agents.filter(a =>
          a.capabilities.some(c => c.toLowerCase().includes(options.filter.toLowerCase()))
        );
      }

      if (options.kind) {
        agents = agents.filter(a =>
          (a.kind || 'Agent').toLowerCase() === options.kind.toLowerCase()
        );
      }

      // Output format
      if (options.json) {
        console.log(JSON.stringify(agents, null, 2));
        process.exit(0);
      }

      if (options.yaml) {
        console.log(yaml.stringify(agents));
        process.exit(0);
      }

      // Table format
      console.log(chalk.blue('Registered Agents'));
      console.log(chalk.gray('─'.repeat(60)));

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found'));
        if (options.filter || options.kind) {
          console.log(chalk.gray('  Try removing filters'));
        }
        process.exit(0);
      }

      // Group by kind
      const byKind = agents.reduce((acc, agent) => {
        const kind = agent.kind || 'Agent';
        if (!acc[kind]) acc[kind] = [];
        acc[kind].push(agent);
        return acc;
      }, {} as Record<string, typeof agents>);

      for (const [kind, kindAgents] of Object.entries(byKind)) {
        const kindColor =
          kind === 'Workflow' ? chalk.magenta :
          kind === 'Task' ? chalk.yellow :
          chalk.cyan;

        console.log(`\n${kindColor(`[${kind}]`)} (${kindAgents.length})`);

        for (const agent of kindAgents) {
          console.log(`  ${chalk.white(agent.name)}`);
          console.log(chalk.gray(`    Path: ${agent.path}`));
          if (agent.capabilities.length > 0) {
            console.log(chalk.gray(`    Capabilities: ${agent.capabilities.join(', ')}`));
          }
        }
      }

      console.log('\n' + chalk.gray('─'.repeat(60)));
      console.log(`Total: ${chalk.cyan(agents.length)} agent(s)`);

      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: registry add
// ============================================================================
registryCommand
  .command('add <path>')
  .description('Add agent to registry')
  .option('--name <name>', 'Project name (defaults to directory name)')
  .action(async (agentPath: string, options) => {
    try {
      const registry = loadRegistry();

      if (!registry) {
        console.log(chalk.yellow('⚠ No workspace registry found'));
        console.log(chalk.gray('  Run `ossa workspace init` first'));
        process.exit(1);
      }

      const resolvedPath = path.resolve(process.cwd(), agentPath);

      // Find manifest files
      const manifests = await glob('*.ossa.yaml', {
        cwd: resolvedPath,
      });

      if (manifests.length === 0) {
        console.log(chalk.red(`✗ No OSSA manifests found in: ${agentPath}`));
        process.exit(1);
      }

      const projectName = options.name || path.basename(path.dirname(resolvedPath));
      const relativePath = `./${path.relative(process.cwd(), resolvedPath)}`;

      // Check if already exists
      const existingIndex = registry.agents.findIndex(p => p.path === relativePath);

      const agents: AgentEntry[] = [];
      for (const manifestFile of manifests) {
        const manifestPath = path.join(resolvedPath, manifestFile);
        const content = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = yaml.parse(content);

        if (!manifest?.metadata?.name) continue;

        const capabilities: string[] = [];
        if (manifest.spec?.capabilities) {
          for (const cap of manifest.spec.capabilities) {
            if (typeof cap === 'string') {
              capabilities.push(cap);
            } else if (cap.name) {
              capabilities.push(cap.name);
            }
          }
        }

        agents.push({
          name: manifest.metadata.name,
          manifest: `./${manifestFile}`,
          capabilities: capabilities.slice(0, 5),
          kind: manifest.kind,
        });
      }

      const projectEntry: ProjectEntry = {
        project: projectName,
        path: relativePath,
        agents,
      };

      if (existingIndex >= 0) {
        registry.agents[existingIndex] = projectEntry;
        console.log(chalk.yellow(`↻ Updated: ${projectName}`));
      } else {
        registry.agents.push(projectEntry);
        console.log(chalk.green(`✓ Added: ${projectName}`));
      }

      saveRegistry(registry);
      console.log(chalk.gray(`  Path: ${relativePath}`));
      console.log(chalk.gray(`  Agents: ${agents.length}`));

      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: registry remove
// ============================================================================
registryCommand
  .command('remove <name>')
  .description('Remove agent from registry')
  .action(async (name: string) => {
    try {
      const registry = loadRegistry();

      if (!registry) {
        console.log(chalk.yellow('⚠ No workspace registry found'));
        process.exit(1);
      }

      const index = registry.agents.findIndex(p =>
        p.project === name || p.path.includes(name)
      );

      if (index < 0) {
        console.log(chalk.red(`✗ Not found: ${name}`));
        process.exit(1);
      }

      const removed = registry.agents.splice(index, 1)[0];
      saveRegistry(registry);

      console.log(chalk.green(`✓ Removed: ${removed.project}`));
      console.log(chalk.gray(`  Path: ${removed.path}`));

      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: registry discover
// ============================================================================
registryCommand
  .command('discover')
  .description('Auto-discover agents in workspace (alias for workspace discover)')
  .option('--depth <number>', 'Max directory depth', '3')
  .option('--dry-run', 'Show what would be discovered')
  .action(async (options) => {
    // Import and call workspace discover
    const { exec } = await import('child_process');
    const args = ['workspace', 'discover'];
    if (options.dryRun) args.push('--dry-run');
    if (options.depth) args.push('--depth', options.depth);

    console.log(chalk.gray(`Running: ossa ${args.join(' ')}`));

    // Execute inline to avoid subprocess issues
    const cwd = process.cwd();

    console.log(chalk.blue('Discovering agents...'));

    const patterns = [
      '**/.agents/manifest.ossa.yaml',
      '**/.agents/*.ossa.yaml',
      '**/agents/*.ossa.yaml',
    ];

    const found: ProjectEntry[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd,
        ignore: ['node_modules/**', '**/node_modules/**', 'dist/**', '.agents-workspace/**'],
        maxDepth: parseInt(options.depth, 10),
      });

      for (const file of files) {
        const fullPath = path.resolve(cwd, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const manifest = yaml.parse(content);

        if (!manifest?.metadata?.name) continue;

        const projectDir = path.dirname(path.dirname(fullPath));
        const projectName = path.basename(projectDir);
        const relativePath = path.dirname(path.relative(cwd, fullPath));

        let projectEntry = found.find(p => p.path === `./${relativePath}`);
        if (!projectEntry) {
          projectEntry = {
            project: projectName,
            path: `./${relativePath}`,
            agents: [],
          };
          found.push(projectEntry);
        }

        const capabilities: string[] = [];
        if (manifest.spec?.capabilities) {
          for (const cap of manifest.spec.capabilities) {
            if (typeof cap === 'string') {
              capabilities.push(cap);
            } else if (cap.name) {
              capabilities.push(cap.name);
            }
          }
        }

        projectEntry.agents.push({
          name: manifest.metadata.name,
          manifest: `./${path.basename(file)}`,
          capabilities: capabilities.slice(0, 3),
          kind: manifest.kind,
        });
      }
    }

    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Found ${chalk.cyan(found.length)} project(s)\n`);

    for (const project of found) {
      console.log(chalk.cyan(project.project));
      for (const agent of project.agents) {
        const kindBadge = agent.kind !== 'Agent' && agent.kind
          ? chalk.yellow(` [${agent.kind}]`)
          : '';
        console.log(`  • ${agent.name}${kindBadge}`);
      }
    }

    if (!options.dryRun) {
      const registry = loadRegistry();
      if (registry) {
        registry.agents = found;
        saveRegistry(registry);
        console.log('\n' + chalk.green('✓ Registry updated'));
      }
    } else {
      console.log('\n' + chalk.yellow('DRY RUN: Registry not updated'));
    }

    process.exit(0);
  });

// ============================================================================
// Subcommand: registry export
// ============================================================================
registryCommand
  .command('export')
  .description('Export registry')
  .option('--format <format>', 'Output format (json, yaml)', 'yaml')
  .option('-o, --output <file>', 'Output file (defaults to stdout)')
  .action(async (options) => {
    try {
      const registry = loadRegistry();

      if (!registry) {
        console.log(chalk.yellow('⚠ No workspace registry found'));
        process.exit(1);
      }

      const output = options.format === 'json'
        ? JSON.stringify(registry, null, 2)
        : yaml.stringify(registry);

      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(chalk.green(`✓ Exported to: ${options.output}`));
      } else {
        console.log(output);
      }

      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Subcommand: registry validate
// ============================================================================
registryCommand
  .command('validate')
  .description('Validate all registered agents')
  .action(async () => {
    try {
      const registry = loadRegistry();

      if (!registry) {
        console.log(chalk.yellow('⚠ No workspace registry found'));
        process.exit(1);
      }

      console.log(chalk.blue('Validating registered agents...'));
      console.log(chalk.gray('─'.repeat(50)));

      let valid = 0;
      let invalid = 0;
      const errors: string[] = [];

      for (const project of registry.agents) {
        for (const agent of project.agents) {
          const manifestPath = path.resolve(
            process.cwd(),
            project.path,
            agent.manifest
          );

          if (!fs.existsSync(manifestPath)) {
            errors.push(`${agent.name}: Manifest not found at ${manifestPath}`);
            invalid++;
            continue;
          }

          try {
            const content = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = yaml.parse(content);

            if (!manifest?.apiVersion) {
              errors.push(`${agent.name}: Missing apiVersion`);
              invalid++;
            } else if (!manifest?.kind) {
              errors.push(`${agent.name}: Missing kind`);
              invalid++;
            } else if (!manifest?.metadata?.name) {
              errors.push(`${agent.name}: Missing metadata.name`);
              invalid++;
            } else {
              valid++;
            }
          } catch (e) {
            errors.push(`${agent.name}: Parse error - ${e instanceof Error ? e.message : String(e)}`);
            invalid++;
          }
        }
      }

      if (errors.length === 0) {
        console.log(chalk.green(`✓ All ${valid} agents are valid`));
        process.exit(0);
      }

      console.log(chalk.green(`✓ Valid: ${valid}`));
      console.log(chalk.red(`✗ Invalid: ${invalid}`));
      console.log('');

      for (const error of errors) {
        console.log(chalk.red(`  • ${error}`));
      }

      process.exit(1);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Helper Functions
// ============================================================================

function loadRegistry(): Registry | null {
  const registryPath = path.resolve(
    process.cwd(),
    '.agents-workspace/registry/index.yaml'
  );

  if (!fs.existsSync(registryPath)) {
    return null;
  }

  const content = fs.readFileSync(registryPath, 'utf-8');
  return yaml.parse(content) as Registry;
}

function saveRegistry(registry: Registry): void {
  const registryPath = path.resolve(
    process.cwd(),
    '.agents-workspace/registry/index.yaml'
  );

  const header = `# OSSA Agent Registry
# Managed by ossa registry commands
# Last updated: ${new Date().toISOString()}

`;

  fs.writeFileSync(registryPath, header + yaml.stringify(registry));
}

function flattenAgents(registry: Registry): Array<{
  name: string;
  project: string;
  path: string;
  capabilities: string[];
  kind?: string;
}> {
  const result: Array<{
    name: string;
    project: string;
    path: string;
    capabilities: string[];
    kind?: string;
  }> = [];

  for (const project of registry.agents) {
    for (const agent of project.agents) {
      result.push({
        name: agent.name,
        project: project.project,
        path: `${project.path}/${agent.manifest}`,
        capabilities: agent.capabilities,
        kind: agent.kind,
      });
    }
  }

  return result;
}
