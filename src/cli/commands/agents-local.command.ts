/**
 * Local .agents/ folder management commands
 * Manages the flat agent structure: .agents/<name>/agent.ossa.yaml
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { OssaAgent } from '../../types/index.js';

const AGENTS_DIR = '.agents';
const WORKSPACE_DIR = '.agents-workspace';
const MANIFEST_NAME = 'agent.ossa.yaml';
const REGISTRY_NAME = 'registry.yaml';

/**
 * Initialize .agents/ structure in current project
 */
const initCommand = new Command('init')
  .description('Initialize .agents/ and .agents-workspace/ in current directory')
  .action(() => {
    const agentsDir = path.resolve(AGENTS_DIR);
    const workspaceDir = path.resolve(WORKSPACE_DIR);

    if (fs.existsSync(agentsDir)) {
      console.log(chalk.yellow(`${AGENTS_DIR}/ already exists`));
    } else {
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(
        path.join(agentsDir, '.gitkeep'),
        `# .agents/ - Agent definitions (version controlled)\n#\n# Structure:\n#   registry.yaml                  - Auto-generated agent index\n#   <agent-name>/agent.ossa.yaml   - OSSA manifest (one per agent)\n#   _shared/                       - Cross-agent resources (optional)\n`
      );
      console.log(chalk.green(`Created ${AGENTS_DIR}/`));
    }

    if (fs.existsSync(workspaceDir)) {
      console.log(chalk.yellow(`${WORKSPACE_DIR}/ already exists`));
    } else {
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.writeFileSync(
        path.join(workspaceDir, '.gitkeep'),
        `# .agents-workspace/ - Ephemeral runtime data (gitignored except this file)\n# exports/   - ossa export output\n# state/     - Runtime sessions, checkpoints\n# logs/      - Execution logs\n`
      );
      console.log(chalk.green(`Created ${WORKSPACE_DIR}/`));
    }

    // Ensure .gitignore has workspace entry
    const gitignorePath = path.resolve('.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      if (!content.includes('.agents-workspace')) {
        fs.appendFileSync(gitignorePath, '\n# Agent workspace (ephemeral)\n.agents-workspace/\n!.agents-workspace/.gitkeep\n');
        console.log(chalk.green('Added .agents-workspace/ to .gitignore'));
      }
    }

    console.log(chalk.green('\nReady. Add agents with: ossa agents add <name>'));
  });

/**
 * Add a new agent to .agents/
 */
const addCommand = new Command('add')
  .argument('<name>', 'Agent name (kebab-case)')
  .option('--role <role>', 'Agent role/system prompt')
  .option('--provider <provider>', 'LLM provider', 'anthropic')
  .option('--model <model>', 'LLM model', 'claude-sonnet-4-5-20250929')
  .option('--kind <kind>', 'Agent kind (worker, specialist, orchestrator)')
  .description('Create a new agent in .agents/<name>/')
  .action((name: string, options: { role?: string; provider?: string; model?: string; kind?: string }) => {
    const agentsDir = path.resolve(AGENTS_DIR);
    if (!fs.existsSync(agentsDir)) {
      console.error(chalk.red('No .agents/ directory. Run: ossa agents init'));
      process.exit(1);
    }

    // Validate name is kebab-case
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
      console.error(chalk.red('Agent name must be kebab-case (e.g., code-reviewer)'));
      process.exit(1);
    }

    const agentDir = path.join(agentsDir, name);
    if (fs.existsSync(agentDir)) {
      console.error(chalk.red(`Agent ${name} already exists at ${agentDir}/`));
      process.exit(1);
    }

    fs.mkdirSync(agentDir, { recursive: true });

    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.4.5',
      kind: 'Agent',
      metadata: {
        name,
        version: '1.0.0',
        description: `${name} agent`,
        ...(options.kind ? { agentKind: options.kind as any } : {}),
        labels: {
          category: 'general',
        },
      },
      spec: {
        role: options.role || `You are the ${name} agent.`,
        llm: {
          provider: options.provider || 'anthropic',
          model: options.model || 'claude-sonnet-4-5-20250929',
          temperature: 0.7,
          maxTokens: 4096,
        },
        tools: [],
      },
    };

    fs.writeFileSync(
      path.join(agentDir, MANIFEST_NAME),
      yaml.stringify(manifest)
    );

    console.log(chalk.green(`Created ${AGENTS_DIR}/${name}/${MANIFEST_NAME}`));
    console.log(chalk.gray(`\nEdit the manifest, then run: ossa agents sync`));
  });

/**
 * Rebuild registry.yaml from filesystem
 */
const syncCommand = new Command('sync')
  .description('Rebuild registry.yaml from .agents/ filesystem')
  .action(() => {
    const agentsDir = path.resolve(AGENTS_DIR);
    if (!fs.existsSync(agentsDir)) {
      console.error(chalk.red('No .agents/ directory. Run: ossa agents init'));
      process.exit(1);
    }

    const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
    const agents: Array<{
      name: string;
      manifest: string;
      kind?: string;
      labels?: Record<string, string>;
    }> = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) {
        continue;
      }

      const manifestPath = path.join(agentsDir, entry.name, MANIFEST_NAME);
      if (!fs.existsSync(manifestPath)) {
        console.log(chalk.yellow(`Skipping ${entry.name}/ (no ${MANIFEST_NAME})`));
        continue;
      }

      try {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = yaml.parse(content) as OssaAgent;

        agents.push({
          name: manifest.metadata?.name || entry.name,
          manifest: `${entry.name}/${MANIFEST_NAME}`,
          kind: (manifest.metadata as any)?.agentKind,
          labels: manifest.metadata?.labels as Record<string, string>,
        });
      } catch (err) {
        console.log(chalk.yellow(`Skipping ${entry.name}/ (invalid YAML)`));
      }
    }

    agents.sort((a, b) => a.name.localeCompare(b.name));

    const registry = {
      '# Auto-generated by': 'ossa agents sync',
      '# Do not edit manually': '',
      version: '1.0',
      agents: agents.map((a) => ({
        name: a.name,
        manifest: a.manifest,
        ...(a.kind ? { kind: a.kind } : {}),
        ...(a.labels && Object.keys(a.labels).length > 0 ? { labels: a.labels } : {}),
      })),
    };

    // Write clean YAML without the comment hack
    const yamlContent = `# Auto-generated by: ossa agents sync\n# Do not edit manually\nversion: "1.0"\nagents:\n${agents
      .map((a) => {
        let entry = `  - name: ${a.name}\n    manifest: ${a.manifest}`;
        if (a.kind) entry += `\n    kind: ${a.kind}`;
        if (a.labels && Object.keys(a.labels).length > 0) {
          const labelsStr = Object.entries(a.labels)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          entry += `\n    labels: { ${labelsStr} }`;
        }
        return entry;
      })
      .join('\n\n')}\n`;

    fs.writeFileSync(path.join(agentsDir, REGISTRY_NAME), yamlContent);

    console.log(chalk.green(`Synced ${agents.length} agent(s) to ${AGENTS_DIR}/${REGISTRY_NAME}`));
    agents.forEach((a) => {
      console.log(chalk.gray(`  ${a.name}${a.kind ? ` (${a.kind})` : ''}`));
    });
  });

/**
 * List agents from local .agents/ directory
 */
const localListCommand = new Command('local')
  .description('List agents from local .agents/ directory')
  .option('--kind <kind>', 'Filter by agent kind')
  .option('--category <category>', 'Filter by category label')
  .option('--json', 'Output as JSON')
  .action((options: { kind?: string; category?: string; json?: boolean }) => {
    const agentsDir = path.resolve(AGENTS_DIR);
    if (!fs.existsSync(agentsDir)) {
      console.error(chalk.red('No .agents/ directory. Run: ossa agents init'));
      process.exit(1);
    }

    const registryPath = path.join(agentsDir, REGISTRY_NAME);
    let agents: Array<{ name: string; manifest: string; kind?: string; labels?: Record<string, string> }> = [];

    if (fs.existsSync(registryPath)) {
      const content = fs.readFileSync(registryPath, 'utf-8');
      const registry = yaml.parse(content);
      agents = registry?.agents || [];
    } else {
      // Fallback: scan filesystem
      const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
        const manifestPath = path.join(agentsDir, entry.name, MANIFEST_NAME);
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = yaml.parse(fs.readFileSync(manifestPath, 'utf-8')) as OssaAgent;
            agents.push({
              name: manifest.metadata?.name || entry.name,
              manifest: `${entry.name}/${MANIFEST_NAME}`,
              kind: (manifest.metadata as any)?.agentKind,
              labels: manifest.metadata?.labels as Record<string, string>,
            });
          } catch { /* skip invalid */ }
        }
      }
    }

    // Apply filters
    if (options.kind) {
      agents = agents.filter((a) => a.kind === options.kind);
    }
    if (options.category) {
      agents = agents.filter((a) => a.labels?.category === options.category);
    }

    if (options.json) {
      console.log(JSON.stringify(agents, null, 2));
      return;
    }

    if (agents.length === 0) {
      console.log(chalk.yellow('No agents found'));
      return;
    }

    console.log(chalk.bold(`\n${agents.length} agent(s) in ${AGENTS_DIR}/\n`));
    for (const agent of agents) {
      const kindBadge = agent.kind ? chalk.cyan(` [${agent.kind}]`) : '';
      const category = agent.labels?.category ? chalk.gray(` (${agent.labels.category})`) : '';
      console.log(`  ${chalk.white(agent.name)}${kindBadge}${category}`);
      console.log(chalk.gray(`    ${agent.manifest}`));
    }
    console.log('');
  });

/**
 * Export a specific agent from .agents/
 */
const exportAgentCommand = new Command('export-agent')
  .argument('<name>', 'Agent name from .agents/')
  .requiredOption('-p, --platform <platform>', 'Target platform')
  .option('-o, --output <dir>', 'Output directory')
  .description('Export an agent from .agents/ to a platform')
  .action(async (name: string, options: { platform: string; output?: string }) => {
    const manifestPath = path.resolve(AGENTS_DIR, name, MANIFEST_NAME);
    if (!fs.existsSync(manifestPath)) {
      console.error(chalk.red(`Agent not found: ${AGENTS_DIR}/${name}/${MANIFEST_NAME}`));
      process.exit(1);
    }

    const outputDir = options.output || `.agents-workspace/exports/${name}-${options.platform}`;

    // Delegate to the existing export command
    console.log(chalk.blue(`Exporting ${name} to ${options.platform}...`));
    const { execSync } = await import('child_process');
    try {
      execSync(
        `node ${path.resolve('dist/cli/index.js')} export "${manifestPath}" -p ${options.platform} -o "${outputDir}" --verbose`,
        { stdio: 'inherit', cwd: process.cwd() }
      );
    } catch {
      process.exit(1);
    }
  });

/**
 * Agents local command group
 */
export const agentsLocalCommandGroup = new Command('agents-local')
  .description('Manage local .agents/ folder structure');

agentsLocalCommandGroup.addCommand(initCommand);
agentsLocalCommandGroup.addCommand(addCommand);
agentsLocalCommandGroup.addCommand(syncCommand);
agentsLocalCommandGroup.addCommand(localListCommand);
agentsLocalCommandGroup.addCommand(exportAgentCommand);
