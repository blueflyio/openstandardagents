/**
 * OSSA CLI - Workspace Management Commands
 * Manage multi-agent workspaces and orchestration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import Table from 'table';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function createWorkspaceManagementCommands(): Command {
  const workspace = new Command('workspace')
    .description('Manage OSSA workspaces for multi-agent orchestration');

  // Initialize workspace
  workspace
    .command('init [path]')
    .description('Initialize a new OSSA workspace')
    .option('-n, --name <name>', 'Workspace name')
    .option('-t, --template <template>', 'Use workspace template', 'default')
    .option('--tier <tier>', 'Conformance tier', 'advanced')
    .action(async (workspacePath, options) => {
      await initializeWorkspace(workspacePath || '.', options);
    });

  // Status command
  workspace
    .command('status')
    .description('Show workspace status and statistics')
    .option('-d, --detailed', 'Show detailed information')
    .action(async (options) => {
      await showWorkspaceStatus(options);
    });

  // List workspaces
  workspace
    .command('list')
    .description('List all available workspaces')
    .option('--format <format>', 'Output format (table|json|yaml)', 'table')
    .action(async (options) => {
      await listWorkspaces(options);
    });

  // Validate workspace
  workspace
    .command('validate [path]')
    .description('Validate workspace configuration')
    .option('--fix', 'Attempt to fix issues')
    .option('--strict', 'Enable strict validation')
    .action(async (workspacePath, options) => {
      await validateWorkspace(workspacePath || '.', options);
    });

  // Sync workspace
  workspace
    .command('sync')
    .description('Synchronize workspace with remote registry')
    .option('-r, --remote <url>', 'Remote registry URL')
    .option('--pull', 'Pull changes from remote')
    .option('--push', 'Push changes to remote')
    .action(async (options) => {
      await syncWorkspace(options);
    });

  // Import workspace
  workspace
    .command('import <source>')
    .description('Import workspace from archive or remote')
    .option('-o, --output <path>', 'Output directory', '.')
    .option('--merge', 'Merge with existing workspace')
    .action(async (source, options) => {
      await importWorkspace(source, options);
    });

  // Export workspace
  workspace
    .command('export [path]')
    .description('Export workspace as archive')
    .option('-o, --output <file>', 'Output file')
    .option('--format <format>', 'Archive format (tar|zip)', 'tar')
    .option('--include-data', 'Include workspace data')
    .action(async (workspacePath, options) => {
      await exportWorkspace(workspacePath || '.', options);
    });

  // Clean workspace
  workspace
    .command('clean')
    .description('Clean workspace temporary files and cache')
    .option('--cache', 'Clean cache only')
    .option('--logs', 'Clean logs only')
    .option('--all', 'Clean everything')
    .option('-f, --force', 'Skip confirmation')
    .action(async (options) => {
      await cleanWorkspace(options);
    });

  // Config command
  workspace
    .command('config <action> [key] [value]')
    .description('Manage workspace configuration')
    .action(async (action, key, value) => {
      await manageWorkspaceConfig(action, key, value);
    });

  // Metrics command
  workspace
    .command('metrics')
    .description('Show workspace metrics and analytics')
    .option('--period <period>', 'Time period (1h|24h|7d|30d)', '24h')
    .option('--export <file>', 'Export metrics to file')
    .action(async (options) => {
      await showWorkspaceMetrics(options);
    });

  // Backup command
  workspace
    .command('backup')
    .description('Backup workspace configuration and data')
    .option('-d, --destination <path>', 'Backup destination')
    .option('--incremental', 'Incremental backup')
    .option('--compress', 'Compress backup')
    .action(async (options) => {
      await backupWorkspace(options);
    });

  // Restore command
  workspace
    .command('restore <backup>')
    .description('Restore workspace from backup')
    .option('--verify', 'Verify backup before restore')
    .option('-f, --force', 'Force restore without confirmation')
    .action(async (backup, options) => {
      await restoreWorkspace(backup, options);
    });

  return workspace;
}

// Implementation functions

async function initializeWorkspace(workspacePath: string, options: any) {
  const spinner = ora('Initializing OSSA workspace...').start();
  
  try {
    const { name, template, tier } = options;
    const workspaceName = name || path.basename(path.resolve(workspacePath));
    
    // Check if workspace already exists
    const workspaceDir = path.join(workspacePath, '.agents-workspace');
    if (await fs.pathExists(workspaceDir)) {
      spinner.warn('Workspace already exists');
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite existing workspace?',
        default: false
      }]);
      
      if (!overwrite) {
        process.exit(0);
      }
    }
    
    // Create workspace structure
    const directories = [
      '.agents-workspace/config',
      '.agents-workspace/agents',
      '.agents-workspace/workflows/templates',
      '.agents-workspace/workflows/active',
      '.agents-workspace/data/vectors',
      '.agents-workspace/data/documents',
      '.agents-workspace/data/cache',
      '.agents-workspace/logs/agents',
      '.agents-workspace/logs/workflows',
      '.agents-workspace/metrics',
      '.agents/manifests',
      '.agents/runtime',
      '.agents/cache',
      '.agents/credentials',
      '.agents/state'
    ];
    
    for (const dir of directories) {
      await fs.ensureDir(path.join(workspacePath, dir));
    }
    
    // Create workspace configuration
    const workspaceConfig = {
      apiVersion: 'ossa.ai/v0.1.8',
      kind: 'Workspace',
      metadata: {
        name: workspaceName,
        version: '0.1.8',
        created: new Date().toISOString(),
        tier
      },
      spec: {
        ossa: {
          version: '0.1.8',
          conformance_tier: tier,
          compliance_frameworks: ['ISO_42001', 'NIST_AI_RMF']
        },
        discovery: {
          enabled: true,
          protocol: 'uadp',
          endpoints: ['http://localhost:8080/discover']
        },
        resources: {
          limits: {
            max_agents: 100,
            max_workflows: 50,
            memory_limit: '8Gi',
            cpu_limit: '4000m'
          }
        },
        security: {
          encryption: {
            at_rest: true,
            in_transit: true,
            algorithm: 'AES-256-GCM'
          },
          authentication: {
            required: true,
            method: 'oauth2'
          }
        },
        monitoring: {
          metrics: {
            enabled: true,
            endpoint: 'http://localhost:9090'
          },
          logging: {
            level: 'info',
            format: 'json'
          }
        }
      }
    };
    
    // Write workspace configuration
    const configPath = path.join(workspacePath, '.agents-workspace/config/workspace.yaml');
    await fs.writeFile(configPath, yaml.dump(workspaceConfig));
    
    // Create workspace README
    const readmePath = path.join(workspacePath, '.agents-workspace/README.md');
    await fs.writeFile(readmePath, `# OSSA Workspace: ${workspaceName}

## Overview
OSSA v0.1.8 compliant multi-agent workspace initialized on ${new Date().toISOString()}

## Structure
- **config/**: Workspace configuration files
- **agents/**: Agent definitions and registry
- **workflows/**: Workflow templates and instances
- **data/**: Shared data storage
- **logs/**: Centralized logging
- **metrics/**: Performance metrics

## Quick Start
\`\`\`bash
# Register an agent
ossa agent register --manifest agent.yaml

# Create a workflow
ossa workflow create --template parallel-processing

# Check workspace status
ossa workspace status
\`\`\`
`);
    
    // Initialize agent registry
    const registryPath = path.join(workspacePath, '.agents-workspace/agents/registry.json');
    await fs.writeJSON(registryPath, {}, { spaces: 2 });
    
    // Apply template if specified
    if (template !== 'default') {
      await applyWorkspaceTemplate(workspacePath, template);
    }
    
    spinner.succeed(`Workspace '${workspaceName}' initialized successfully`);
    
    // Show next steps
    console.log(chalk.blue('\n📝 Next Steps:'));
    console.log('  1. Register agents: ossa agent register --manifest <path>');
    console.log('  2. Create workflows: ossa workflow create');
    console.log('  3. Start orchestration: ossa orchestrate start');
    
  } catch (error) {
    spinner.fail(`Initialization failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function showWorkspaceStatus(options: any) {
  const spinner = ora('Gathering workspace information...').start();
  
  try {
    const workspaceDir = '.agents-workspace';
    
    if (!await fs.pathExists(workspaceDir)) {
      throw new Error('No workspace found in current directory');
    }
    
    // Load workspace configuration
    const configPath = path.join(workspaceDir, 'config/workspace.yaml');
    const config = yaml.load(await fs.readFile(configPath, 'utf-8')) as any;
    
    // Gather statistics
    const registryPath = path.join(workspaceDir, 'agents/registry.json');
    const registry = await fs.readJSON(registryPath);
    const agentCount = Object.keys(registry).length;
    
    const workflowsPath = path.join(workspaceDir, 'workflows/active');
    const activeWorkflows = (await fs.readdir(workflowsPath)).length;
    
    // Calculate disk usage
    const { stdout: diskUsage } = await execAsync(`du -sh ${workspaceDir}`);
    const size = diskUsage.split('\t')[0];
    
    spinner.stop();
    
    // Display status
    console.log(chalk.blue('\n📊 Workspace Status\n'));
    console.log(`  Name: ${chalk.bold(config.metadata.name)}`);
    console.log(`  Version: ${config.metadata.version}`);
    console.log(`  Tier: ${config.metadata.tier}`);
    console.log(`  Created: ${new Date(config.metadata.created).toLocaleDateString()}`);
    
    console.log(chalk.blue('\n📈 Statistics\n'));
    console.log(`  Registered Agents: ${agentCount}`);
    console.log(`  Active Workflows: ${activeWorkflows}`);
    console.log(`  Disk Usage: ${size}`);
    
    if (options.detailed) {
      console.log(chalk.blue('\n🔧 Configuration\n'));
      console.log(`  OSSA Version: ${config.spec.ossa.version}`);
      console.log(`  Discovery Protocol: ${config.spec.discovery.protocol}`);
      console.log(`  Max Agents: ${config.spec.resources.limits.max_agents}`);
      console.log(`  Max Memory: ${config.spec.resources.limits.memory_limit}`);
      console.log(`  Encryption: ${config.spec.security.encryption.algorithm}`);
      
      // Show active agents
      if (agentCount > 0) {
        console.log(chalk.blue('\n🤖 Active Agents\n'));
        const agents = Object.entries(registry).slice(0, 5);
        agents.forEach(([name, agent]: any) => {
          console.log(`  - ${name} (v${agent.version}) - ${agent.status}`);
        });
        
        if (agentCount > 5) {
          console.log(`  ... and ${agentCount - 5} more`);
        }
      }
    }
    
  } catch (error) {
    spinner.fail(`Failed to get status: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function listWorkspaces(options: any) {
  // Search for workspaces in common locations
  const searchPaths = [
    process.cwd(),
    path.join(process.env.HOME || '', '.ossa', 'workspaces'),
    '/opt/ossa/workspaces'
  ];
  
  const workspaces: any[] = [];
  
  for (const searchPath of searchPaths) {
    if (await fs.pathExists(searchPath)) {
      const dirs = await fs.readdir(searchPath);
      
      for (const dir of dirs) {
        const workspaceConfig = path.join(searchPath, dir, '.agents-workspace/config/workspace.yaml');
        if (await fs.pathExists(workspaceConfig)) {
          const config = yaml.load(await fs.readFile(workspaceConfig, 'utf-8')) as any;
          workspaces.push({
            name: config.metadata.name,
            path: path.join(searchPath, dir),
            version: config.metadata.version,
            tier: config.metadata.tier,
            created: config.metadata.created
          });
        }
      }
    }
  }
  
  if (workspaces.length === 0) {
    console.log(chalk.yellow('No workspaces found'));
    return;
  }
  
  // Format output
  if (options.format === 'json') {
    console.log(JSON.stringify(workspaces, null, 2));
  } else if (options.format === 'yaml') {
    console.log(yaml.dump(workspaces));
  } else {
    const table = Table.table([
      ['Name', 'Path', 'Version', 'Tier', 'Created'],
      ...workspaces.map(ws => [
        ws.name,
        ws.path,
        ws.version,
        ws.tier,
        new Date(ws.created).toLocaleDateString()
      ])
    ]);
    console.log(table);
  }
}

async function validateWorkspace(workspacePath: string, options: any) {
  const spinner = ora('Validating workspace...').start();
  
  try {
    const issues: string[] = [];
    const fixes: any[] = [];
    
    // Check workspace structure
    const requiredDirs = [
      '.agents-workspace/config',
      '.agents-workspace/agents',
      '.agents-workspace/workflows',
      '.agents-workspace/data',
      '.agents-workspace/logs'
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(workspacePath, dir);
      if (!await fs.pathExists(dirPath)) {
        issues.push(`Missing directory: ${dir}`);
        fixes.push({ type: 'create_dir', path: dirPath });
      }
    }
    
    // Check configuration
    const configPath = path.join(workspacePath, '.agents-workspace/config/workspace.yaml');
    if (!await fs.pathExists(configPath)) {
      issues.push('Missing workspace configuration');
      fixes.push({ type: 'create_config', path: configPath });
    } else {
      // Validate configuration
      const config = yaml.load(await fs.readFile(configPath, 'utf-8')) as any;
      
      if (!config.apiVersion || config.apiVersion !== 'ossa.ai/v0.1.8') {
        issues.push('Invalid API version');
        fixes.push({ type: 'update_config', field: 'apiVersion', value: 'ossa.ai/v0.1.8' });
      }
      
      if (options.strict) {
        if (!config.spec?.security?.encryption) {
          issues.push('Encryption not configured');
        }
        
        if (!config.spec?.monitoring?.metrics?.enabled) {
          issues.push('Metrics not enabled');
        }
      }
    }
    
    // Check agent registry
    const registryPath = path.join(workspacePath, '.agents-workspace/agents/registry.json');
    if (!await fs.pathExists(registryPath)) {
      issues.push('Missing agent registry');
      fixes.push({ type: 'create_registry', path: registryPath });
    }
    
    if (issues.length === 0) {
      spinner.succeed('Workspace is valid');
    } else {
      spinner.warn('Validation issues found');
      console.log(chalk.yellow('\n⚠️ Issues:'));
      issues.forEach(issue => console.log(`  - ${issue}`));
      
      if (options.fix && fixes.length > 0) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Apply automatic fixes?',
          default: true
        }]);
        
        if (confirm) {
          await applyWorkspaceFixes(fixes);
          console.log(chalk.green('✅ Fixes applied'));
        }
      }
    }
    
  } catch (error) {
    spinner.fail(`Validation failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function syncWorkspace(options: any) {
  const spinner = ora('Synchronizing workspace...').start();
  
  try {
    const { remote, pull, push } = options;
    
    if (!remote) {
      throw new Error('Remote registry URL required');
    }
    
    if (pull) {
      // Pull changes from remote
      spinner.text = 'Pulling changes from remote...';
      
      const response = await fetch(`${remote}/api/v1/workspace/sync`);
      const remoteData = await response.json();
      
      // Merge with local workspace
      const localRegistry = path.join('.agents-workspace/agents/registry.json');
      const local = await fs.readJSON(localRegistry);
      
      const merged = { ...local, ...remoteData.agents };
      await fs.writeJSON(localRegistry, merged, { spaces: 2 });
      
      spinner.succeed(`Pulled ${Object.keys(remoteData.agents).length} agents from remote`);
      
    } else if (push) {
      // Push changes to remote
      spinner.text = 'Pushing changes to remote...';
      
      const localRegistry = path.join('.agents-workspace/agents/registry.json');
      const local = await fs.readJSON(localRegistry);
      
      const response = await fetch(`${remote}/api/v1/workspace/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: local })
      });
      
      if (!response.ok) {
        throw new Error(`Push failed: ${response.statusText}`);
      }
      
      spinner.succeed(`Pushed ${Object.keys(local).length} agents to remote`);
    }
    
  } catch (error) {
    spinner.fail(`Sync failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function importWorkspace(source: string, options: any) {
  const spinner = ora('Importing workspace...').start();
  
  try {
    const { output, merge } = options;
    
    // Determine source type
    let tempDir: string;
    
    if (source.startsWith('http')) {
      // Download from URL
      spinner.text = 'Downloading workspace...';
      const response = await fetch(source);
      const buffer = await response.arrayBuffer();
      
      tempDir = path.join('/tmp', `ossa-import-${Date.now()}`);
      await fs.ensureDir(tempDir);
      
      const archivePath = path.join(tempDir, 'workspace.tar');
      await fs.writeFile(archivePath, Buffer.from(buffer));
      
      await execAsync(`tar -xf ${archivePath} -C ${tempDir}`);
    } else {
      // Local file
      tempDir = path.join('/tmp', `ossa-import-${Date.now()}`);
      await fs.ensureDir(tempDir);
      
      if (source.endsWith('.tar') || source.endsWith('.tar.gz')) {
        await execAsync(`tar -xf ${source} -C ${tempDir}`);
      } else if (source.endsWith('.zip')) {
        await execAsync(`unzip ${source} -d ${tempDir}`);
      } else {
        tempDir = source;
      }
    }
    
    // Import workspace
    const targetDir = path.join(output, '.agents-workspace');
    
    if (merge && await fs.pathExists(targetDir)) {
      // Merge with existing
      spinner.text = 'Merging workspaces...';
      
      const sourceRegistry = path.join(tempDir, '.agents-workspace/agents/registry.json');
      const targetRegistry = path.join(targetDir, 'agents/registry.json');
      
      const source = await fs.readJSON(sourceRegistry);
      const target = await fs.readJSON(targetRegistry);
      
      const merged = { ...target, ...source };
      await fs.writeJSON(targetRegistry, merged, { spaces: 2 });
      
      // Copy new workflows
      await execAsync(`cp -r ${tempDir}/.agents-workspace/workflows/* ${targetDir}/workflows/`);
      
    } else {
      // Replace existing
      if (await fs.pathExists(targetDir)) {
        await fs.remove(targetDir);
      }
      await fs.copy(path.join(tempDir, '.agents-workspace'), targetDir);
    }
    
    spinner.succeed('Workspace imported successfully');
    
  } catch (error) {
    spinner.fail(`Import failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function exportWorkspace(workspacePath: string, options: any) {
  const spinner = ora('Exporting workspace...').start();
  
  try {
    const { output, format, includeData } = options;
    const workspaceDir = path.join(workspacePath, '.agents-workspace');
    
    if (!await fs.pathExists(workspaceDir)) {
      throw new Error('No workspace found');
    }
    
    // Determine output file
    const outputFile = output || `workspace-${Date.now()}.${format}`;
    
    // Create archive
    let cmd: string;
    
    if (!includeData) {
      // Exclude data directory
      cmd = `tar --exclude='.agents-workspace/data' -c${format === 'tar' ? '' : 'z'}f ${outputFile} -C ${workspacePath} .agents-workspace`;
    } else {
      cmd = `tar -c${format === 'tar' ? '' : 'z'}f ${outputFile} -C ${workspacePath} .agents-workspace`;
    }
    
    await execAsync(cmd);
    
    const stats = await fs.stat(outputFile);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    
    spinner.succeed(`Workspace exported to ${outputFile} (${size} MB)`);
    
  } catch (error) {
    spinner.fail(`Export failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function cleanWorkspace(options: any) {
  const { cache, logs, all, force } = options;
  
  if (!force) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Clean workspace?',
      default: false
    }]);
    
    if (!confirm) {
      console.log('Cancelled');
      return;
    }
  }
  
  const spinner = ora('Cleaning workspace...').start();
  
  try {
    let cleaned = 0;
    
    if (cache || all) {
      const cacheDir = '.agents-workspace/data/cache';
      if (await fs.pathExists(cacheDir)) {
        await fs.emptyDir(cacheDir);
        cleaned++;
      }
      
      const agentCache = '.agents/cache';
      if (await fs.pathExists(agentCache)) {
        await fs.emptyDir(agentCache);
        cleaned++;
      }
    }
    
    if (logs || all) {
      const logsDir = '.agents-workspace/logs';
      if (await fs.pathExists(logsDir)) {
        // Keep directory structure, remove files
        const logFiles = await glob('**/*.log', { cwd: logsDir });
        for (const file of logFiles) {
          await fs.remove(path.join(logsDir, file));
          cleaned++;
        }
      }
    }
    
    if (all) {
      // Clean temporary files
      const tempFiles = await glob('**/*.tmp', { cwd: '.agents-workspace' });
      for (const file of tempFiles) {
        await fs.remove(path.join('.agents-workspace', file));
        cleaned++;
      }
    }
    
    spinner.succeed(`Cleaned ${cleaned} items`);
    
  } catch (error) {
    spinner.fail(`Clean failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function manageWorkspaceConfig(action: string, key?: string, value?: string) {
  const configPath = '.agents-workspace/config/workspace.yaml';
  
  if (!await fs.pathExists(configPath)) {
    console.log(chalk.red('No workspace configuration found'));
    process.exit(1);
  }
  
  const config = yaml.load(await fs.readFile(configPath, 'utf-8')) as any;
  
  switch (action) {
    case 'get':
      if (!key) {
        console.log(yaml.dump(config));
      } else {
        const val = getNestedValue(config, key);
        console.log(val !== undefined ? val : chalk.yellow('Key not found'));
      }
      break;
      
    case 'set':
      if (!key || value === undefined) {
        console.log(chalk.red('Key and value required'));
        process.exit(1);
      }
      
      setNestedValue(config, key, value);
      await fs.writeFile(configPath, yaml.dump(config));
      console.log(chalk.green(`Set ${key} = ${value}`));
      break;
      
    case 'list':
      console.log(chalk.blue('Workspace Configuration:\n'));
      printConfig(config);
      break;
      
    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      process.exit(1);
  }
}

async function showWorkspaceMetrics(options: any) {
  const spinner = ora('Collecting metrics...').start();
  
  try {
    const { period, export: exportFile } = options;
    
    // Collect metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      period,
      agents: {
        total: 0,
        active: 0,
        inactive: 0
      },
      workflows: {
        total: 0,
        running: 0,
        completed: 0,
        failed: 0
      },
      resources: {
        cpu_usage: '0%',
        memory_usage: '0MB',
        disk_usage: '0MB'
      },
      performance: {
        avg_response_time: '0ms',
        throughput: '0 req/s',
        error_rate: '0%'
      }
    };
    
    // Get agent metrics
    const registryPath = '.agents-workspace/agents/registry.json';
    if (await fs.pathExists(registryPath)) {
      const registry = await fs.readJSON(registryPath);
      metrics.agents.total = Object.keys(registry).length;
      metrics.agents.active = Object.values(registry).filter((a: any) => a.status === 'active').length;
      metrics.agents.inactive = metrics.agents.total - metrics.agents.active;
    }
    
    // Get workflow metrics
    const workflowsDir = '.agents-workspace/workflows';
    if (await fs.pathExists(workflowsDir)) {
      const active = (await fs.readdir(path.join(workflowsDir, 'active'))).length;
      metrics.workflows.running = active;
    }
    
    // Get resource usage
    const { stdout: diskUsage } = await execAsync('du -sh .agents-workspace');
    metrics.resources.disk_usage = diskUsage.split('\t')[0];
    
    spinner.stop();
    
    // Display metrics
    console.log(chalk.blue('\n📊 Workspace Metrics\n'));
    console.log(`Period: ${period}`);
    console.log(`Generated: ${new Date().toLocaleString()}\n`);
    
    console.log(chalk.green('Agents:'));
    console.log(`  Total: ${metrics.agents.total}`);
    console.log(`  Active: ${metrics.agents.active}`);
    console.log(`  Inactive: ${metrics.agents.inactive}\n`);
    
    console.log(chalk.green('Workflows:'));
    console.log(`  Running: ${metrics.workflows.running}`);
    console.log(`  Completed: ${metrics.workflows.completed}`);
    console.log(`  Failed: ${metrics.workflows.failed}\n`);
    
    console.log(chalk.green('Resources:'));
    console.log(`  Disk Usage: ${metrics.resources.disk_usage}`);
    
    // Export if requested
    if (exportFile) {
      await fs.writeJSON(exportFile, metrics, { spaces: 2 });
      console.log(chalk.green(`\n✅ Metrics exported to ${exportFile}`));
    }
    
  } catch (error) {
    spinner.fail(`Failed to collect metrics: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function backupWorkspace(options: any) {
  const spinner = ora('Creating workspace backup...').start();
  
  try {
    const { destination, incremental, compress } = options;
    
    // Determine backup destination
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupName = `workspace-backup-${timestamp}`;
    const backupPath = destination || path.join('.', 'backups', backupName);
    
    await fs.ensureDir(path.dirname(backupPath));
    
    if (incremental) {
      // Incremental backup using rsync
      await execAsync(`rsync -av --delete .agents-workspace/ ${backupPath}/`);
    } else {
      // Full backup
      await fs.copy('.agents-workspace', backupPath);
    }
    
    if (compress) {
      // Compress backup
      await execAsync(`tar -czf ${backupPath}.tar.gz -C ${path.dirname(backupPath)} ${path.basename(backupPath)}`);
      await fs.remove(backupPath);
      spinner.succeed(`Backup created: ${backupPath}.tar.gz`);
    } else {
      spinner.succeed(`Backup created: ${backupPath}`);
    }
    
  } catch (error) {
    spinner.fail(`Backup failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

async function restoreWorkspace(backup: string, options: any) {
  const { verify, force } = options;
  
  if (!force) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'This will overwrite the current workspace. Continue?',
      default: false
    }]);
    
    if (!confirm) {
      console.log('Cancelled');
      return;
    }
  }
  
  const spinner = ora('Restoring workspace...').start();
  
  try {
    // Verify backup if requested
    if (verify) {
      spinner.text = 'Verifying backup...';
      
      let backupPath = backup;
      if (backup.endsWith('.tar.gz')) {
        // Extract to temp for verification
        const tempDir = path.join('/tmp', `restore-${Date.now()}`);
        await fs.ensureDir(tempDir);
        await execAsync(`tar -xzf ${backup} -C ${tempDir}`);
        backupPath = tempDir;
      }
      
      // Check backup integrity
      const requiredFiles = [
        'config/workspace.yaml',
        'agents/registry.json'
      ];
      
      for (const file of requiredFiles) {
        if (!await fs.pathExists(path.join(backupPath, file))) {
          throw new Error(`Backup verification failed: missing ${file}`);
        }
      }
    }
    
    // Backup current workspace
    spinner.text = 'Backing up current workspace...';
    const currentBackup = `.agents-workspace.backup.${Date.now()}`;
    await fs.copy('.agents-workspace', currentBackup);
    
    // Restore from backup
    spinner.text = 'Restoring from backup...';
    
    if (backup.endsWith('.tar.gz')) {
      await fs.remove('.agents-workspace');
      await execAsync(`tar -xzf ${backup} -C .`);
    } else {
      await fs.remove('.agents-workspace');
      await fs.copy(backup, '.agents-workspace');
    }
    
    spinner.succeed('Workspace restored successfully');
    console.log(chalk.gray(`Previous workspace backed up to: ${currentBackup}`));
    
  } catch (error) {
    spinner.fail(`Restore failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

// Helper functions

async function applyWorkspaceTemplate(workspacePath: string, template: string) {
  // Load and apply workspace template
  const templatePath = path.join(__dirname, '..', '..', 'templates', 'workspaces', template);
  
  if (await fs.pathExists(templatePath)) {
    await fs.copy(templatePath, path.join(workspacePath, '.agents-workspace'), { overwrite: false });
  }
}

async function applyWorkspaceFixes(fixes: any[]) {
  for (const fix of fixes) {
    switch (fix.type) {
      case 'create_dir':
        await fs.ensureDir(fix.path);
        break;
        
      case 'create_config':
        const defaultConfig = {
          apiVersion: 'ossa.ai/v0.1.8',
          kind: 'Workspace',
          metadata: {
            name: 'workspace',
            version: '0.1.8'
          },
          spec: {}
        };
        await fs.writeFile(fix.path, yaml.dump(defaultConfig));
        break;
        
      case 'create_registry':
        await fs.writeJSON(fix.path, {}, { spaces: 2 });
        break;
        
      case 'update_config':
        const config = yaml.load(await fs.readFile(fix.path, 'utf-8')) as any;
        setNestedValue(config, fix.field, fix.value);
        await fs.writeFile(fix.path, yaml.dump(config));
        break;
    }
  }
}

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }
  
  return value;
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

function printConfig(obj: any, indent = 0): void {
  for (const [key, value] of Object.entries(obj)) {
    const prefix = ' '.repeat(indent);
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(`${prefix}${chalk.cyan(key)}:`);
      printConfig(value, indent + 2);
    } else {
      console.log(`${prefix}${chalk.cyan(key)}: ${chalk.yellow(JSON.stringify(value))}`);
    }
  }
}