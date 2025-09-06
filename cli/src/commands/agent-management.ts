/**
 * OSSA CLI - Comprehensive Agent Management Commands
 * Manage, deploy, organize, and validate agents
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

export function createAgentManagementCommands(): Command {
  const agent = new Command('agent')
    .description('Comprehensive agent management operations');

  // Register agent
  agent
    .command('register')
    .description('Register a new agent in the workspace')
    .option('-m, --manifest <path>', 'Path to agent manifest file')
    .option('-n, --name <name>', 'Agent name')
    .option('-w, --workspace <path>', 'Workspace path', '.')
    .option('--validate', 'Validate before registration', true)
    .action(async (options) => {
      await registerAgent(options);
    });

  // List agents
  agent
    .command('list')
    .description('List all registered agents')
    .option('-w, --workspace <path>', 'Workspace path', '.')
    .option('-f, --filter <capability>', 'Filter by capability')
    .option('-s, --status <status>', 'Filter by status (active|inactive|maintenance)')
    .option('--format <format>', 'Output format (table|json|yaml)', 'table')
    .action(async (options) => {
      await listAgents(options);
    });

  // Deploy agent
  agent
    .command('deploy <name>')
    .description('Deploy an agent to runtime environment')
    .option('-e, --environment <env>', 'Target environment', 'local')
    .option('-c, --config <path>', 'Deployment configuration')
    .option('--dry-run', 'Show deployment plan without executing')
    .option('--parallel', 'Enable parallel deployment')
    .action(async (name, options) => {
      await deployAgent(name, options);
    });

  // Start agent
  agent
    .command('start <name>')
    .description('Start an agent instance')
    .option('-d, --detached', 'Run in background')
    .option('-p, --port <port>', 'Override default port')
    .option('--debug', 'Enable debug mode')
    .action(async (name, options) => {
      await startAgent(name, options);
    });

  // Stop agent
  agent
    .command('stop <name>')
    .description('Stop a running agent')
    .option('-f, --force', 'Force stop')
    .option('--timeout <seconds>', 'Graceful shutdown timeout', '30')
    .action(async (name, options) => {
      await stopAgent(name, options);
    });

  // Status command
  agent
    .command('status [name]')
    .description('Get agent status')
    .option('-a, --all', 'Show all agents status')
    .option('--health', 'Include health checks')
    .option('--metrics', 'Include performance metrics')
    .action(async (name, options) => {
      await getAgentStatus(name, options);
    });

  // Validate agent
  agent
    .command('validate <path>')
    .description('Validate agent manifest and configuration')
    .option('--strict', 'Enable strict validation')
    .option('--fix', 'Attempt to fix validation issues')
    .action(async (manifestPath, options) => {
      await validateAgent(manifestPath, options);
    });

  // Update agent
  agent
    .command('update <name>')
    .description('Update agent configuration or version')
    .option('-m, --manifest <path>', 'New manifest file')
    .option('-v, --version <version>', 'Target version')
    .option('--restart', 'Restart after update')
    .action(async (name, options) => {
      await updateAgent(name, options);
    });

  // Remove agent
  agent
    .command('remove <name>')
    .description('Remove agent from workspace')
    .option('--purge', 'Remove all agent data')
    .option('-f, --force', 'Skip confirmation')
    .action(async (name, options) => {
      await removeAgent(name, options);
    });

  // Health check
  agent
    .command('health [name]')
    .description('Perform agent health checks')
    .option('-a, --all', 'Check all agents')
    .option('--detailed', 'Show detailed health information')
    .action(async (name, options) => {
      await checkAgentHealth(name, options);
    });

  // Logs command
  agent
    .command('logs <name>')
    .description('View agent logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <lines>', 'Number of lines to show', '100')
    .option('--since <time>', 'Show logs since timestamp')
    .action(async (name, options) => {
      await viewAgentLogs(name, options);
    });

  // Execute command
  agent
    .command('exec <name> <command>')
    .description('Execute command in agent context')
    .option('--async', 'Execute asynchronously')
    .option('--timeout <seconds>', 'Execution timeout')
    .action(async (name, command, options) => {
      await executeAgentCommand(name, command, options);
    });

  return agent;
}

// Implementation functions

async function registerAgent(options: any) {
  const spinner = ora('Registering agent...').start();
  
  try {
    const { manifest: manifestPath, name, workspace, validate } = options;
    
    // Load manifest
    let manifest: any;
    if (manifestPath) {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      manifest = yaml.load(manifestContent);
    } else if (name) {
      // Create minimal manifest
      manifest = {
        apiVersion: 'ossa.ai/v0.1.8',
        kind: 'Agent',
        metadata: {
          name,
          version: '0.1.0'
        },
        spec: {
          runtime: 'node:20-alpine',
          capabilities: []
        }
      };
    } else {
      throw new Error('Either manifest path or agent name required');
    }

    // Validate if requested
    if (validate) {
      const validationResult = await validateManifest(manifest);
      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    // Register in workspace
    const registryPath = path.join(workspace, '.agents-workspace', 'agents', 'registry.json');
    let registry = {};
    
    if (await fs.pathExists(registryPath)) {
      registry = await fs.readJSON(registryPath);
    }

    const agentId = manifest.metadata.name;
    registry[agentId] = {
      ...manifest.metadata,
      manifest,
      registeredAt: new Date().toISOString(),
      status: 'inactive'
    };

    await fs.ensureDir(path.dirname(registryPath));
    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    // Create agent directory
    const agentDir = path.join(workspace, '.agents', agentId);
    await fs.ensureDir(agentDir);
    await fs.writeFile(
      path.join(agentDir, 'agent.yaml'),
      yaml.dump(manifest)
    );

    spinner.succeed(`Agent '${agentId}' registered successfully`);
  } catch (error) {
    spinner.fail(`Registration failed: ${error.message}`);
    process.exit(1);
  }
}

async function listAgents(options: any) {
  const { workspace, filter, status, format } = options;
  const registryPath = path.join(workspace, '.agents-workspace', 'agents', 'registry.json');
  
  if (!await fs.pathExists(registryPath)) {
    console.log(chalk.yellow('No agents registered in workspace'));
    return;
  }

  const registry = await fs.readJSON(registryPath);
  let agents = Object.values(registry);

  // Apply filters
  if (filter) {
    agents = agents.filter((agent: any) => 
      agent.manifest?.spec?.capabilities?.some((cap: any) => 
        cap.id?.includes(filter)
      )
    );
  }

  if (status) {
    agents = agents.filter((agent: any) => agent.status === status);
  }

  // Format output
  if (format === 'json') {
    console.log(JSON.stringify(agents, null, 2));
  } else if (format === 'yaml') {
    console.log(yaml.dump(agents));
  } else {
    // Table format
    const table = Table.table([
      ['Name', 'Version', 'Status', 'Capabilities', 'Registered'],
      ...agents.map((agent: any) => [
        agent.name || 'N/A',
        agent.version || 'N/A',
        agent.status || 'inactive',
        agent.manifest?.spec?.capabilities?.length || 0,
        new Date(agent.registeredAt).toLocaleDateString()
      ])
    ]);
    console.log(table);
  }
}

async function deployAgent(name: string, options: any) {
  const spinner = ora(`Deploying agent '${name}'...`).start();
  
  try {
    const { environment, config, dryRun, parallel } = options;
    
    // Load agent manifest
    const agentPath = path.join('.agents', name, 'agent.yaml');
    if (!await fs.pathExists(agentPath)) {
      throw new Error(`Agent '${name}' not found`);
    }
    
    const manifestContent = await fs.readFile(agentPath, 'utf-8');
    const manifest = yaml.load(manifestContent) as any;
    
    // Generate deployment configuration
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `${name}-deployment`,
        labels: {
          app: name,
          'ossa.ai/version': '0.1.8'
        }
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { app: name }
        },
        template: {
          metadata: {
            labels: { app: name }
          },
          spec: {
            containers: [{
              name,
              image: manifest.spec.runtime || 'node:20-alpine',
              resources: manifest.spec.resources || {},
              ports: manifest.spec.networking?.ports || [],
              env: [
                { name: 'OSSA_AGENT_NAME', value: name },
                { name: 'OSSA_VERSION', value: '0.1.8' }
              ]
            }]
          }
        }
      }
    };

    if (dryRun) {
      console.log(chalk.yellow('\n📋 Deployment Plan:'));
      console.log(yaml.dump(deployment));
      spinner.info('Dry run completed');
      return;
    }

    // Deploy based on environment
    if (environment === 'local') {
      // Docker deployment
      const dockerCmd = `docker run -d --name ${name} ${manifest.spec.runtime}`;
      await execAsync(dockerCmd);
      spinner.succeed(`Agent '${name}' deployed locally`);
    } else if (environment === 'kubernetes') {
      // Kubernetes deployment
      const deploymentFile = path.join('/tmp', `${name}-deployment.yaml`);
      await fs.writeFile(deploymentFile, yaml.dump(deployment));
      await execAsync(`kubectl apply -f ${deploymentFile}`);
      spinner.succeed(`Agent '${name}' deployed to Kubernetes`);
    } else {
      throw new Error(`Unsupported environment: ${environment}`);
    }

    // Update registry status
    await updateAgentStatus(name, 'active');
    
  } catch (error) {
    spinner.fail(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

async function startAgent(name: string, options: any) {
  const spinner = ora(`Starting agent '${name}'...`).start();
  
  try {
    const { detached, port, debug } = options;
    
    // Load agent configuration
    const agentPath = path.join('.agents', name, 'agent.yaml');
    const manifestContent = await fs.readFile(agentPath, 'utf-8');
    const manifest = yaml.load(manifestContent) as any;
    
    // Build start command
    let startCmd = '';
    const runtime = manifest.spec.runtime || 'node';
    
    if (runtime.includes('node')) {
      startCmd = `node`;
      if (debug) startCmd += ' --inspect';
      startCmd += ` dist/agents/${name}/index.js`;
    } else if (runtime.includes('python')) {
      startCmd = `python src/agents/${name}/main.py`;
    }
    
    if (port) {
      startCmd = `PORT=${port} ${startCmd}`;
    }
    
    if (detached) {
      startCmd = `nohup ${startCmd} > logs/${name}.log 2>&1 &`;
    }
    
    // Execute start command
    const { stdout, stderr } = await execAsync(startCmd);
    
    if (stderr && !debug) {
      throw new Error(stderr);
    }
    
    await updateAgentStatus(name, 'active');
    spinner.succeed(`Agent '${name}' started successfully`);
    
    if (!detached) {
      console.log(stdout);
    }
    
  } catch (error) {
    spinner.fail(`Failed to start agent: ${error.message}`);
    process.exit(1);
  }
}

async function stopAgent(name: string, options: any) {
  const spinner = ora(`Stopping agent '${name}'...`).start();
  
  try {
    const { force, timeout } = options;
    
    // Try graceful shutdown first
    try {
      await execAsync(`pkill -TERM -f "agents/${name}"`);
      
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, parseInt(timeout) * 1000));
      
    } catch (error) {
      if (force) {
        // Force kill if graceful shutdown fails
        await execAsync(`pkill -KILL -f "agents/${name}"`);
      } else {
        throw error;
      }
    }
    
    await updateAgentStatus(name, 'inactive');
    spinner.succeed(`Agent '${name}' stopped`);
    
  } catch (error) {
    spinner.fail(`Failed to stop agent: ${error.message}`);
    process.exit(1);
  }
}

async function getAgentStatus(name: string | undefined, options: any) {
  if (options.all || !name) {
    // Show all agents status
    const registryPath = path.join('.agents-workspace', 'agents', 'registry.json');
    const registry = await fs.readJSON(registryPath);
    
    const table = Table.table([
      ['Agent', 'Status', 'Health', 'CPU', 'Memory', 'Uptime'],
      ...await Promise.all(Object.entries(registry).map(async ([id, agent]: any) => {
        const status = await getAgentRuntimeStatus(id);
        return [
          id,
          agent.status,
          status.health || 'N/A',
          status.cpu || 'N/A',
          status.memory || 'N/A',
          status.uptime || 'N/A'
        ];
      }))
    ]);
    
    console.log(table);
  } else {
    // Show specific agent status
    const status = await getAgentRuntimeStatus(name);
    console.log(chalk.blue(`\n📊 Agent Status: ${name}`));
    console.log(`  Status: ${status.running ? chalk.green('Running') : chalk.red('Stopped')}`);
    console.log(`  Health: ${status.health || 'N/A'}`);
    console.log(`  CPU: ${status.cpu || 'N/A'}`);
    console.log(`  Memory: ${status.memory || 'N/A'}`);
    console.log(`  Uptime: ${status.uptime || 'N/A'}`);
    
    if (options.metrics) {
      console.log(chalk.blue('\n📈 Performance Metrics:'));
      console.log(`  Requests/sec: ${status.rps || 'N/A'}`);
      console.log(`  Latency: ${status.latency || 'N/A'}`);
      console.log(`  Error rate: ${status.errorRate || 'N/A'}`);
    }
  }
}

async function validateAgent(manifestPath: string, options: any) {
  const spinner = ora('Validating agent manifest...').start();
  
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = yaml.load(manifestContent) as any;
    
    const result = await validateManifest(manifest, options.strict);
    
    if (result.valid) {
      spinner.succeed('Agent manifest is valid');
    } else {
      spinner.fail('Validation failed');
      console.log(chalk.red('\n❌ Validation Errors:'));
      result.errors.forEach((error: string) => {
        console.log(`  - ${error}`);
      });
      
      if (options.fix && result.fixes) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Apply automatic fixes?',
          default: true
        }]);
        
        if (confirm) {
          // Apply fixes
          const fixedManifest = applyFixes(manifest, result.fixes);
          await fs.writeFile(manifestPath, yaml.dump(fixedManifest));
          console.log(chalk.green('✅ Fixes applied successfully'));
        }
      }
    }
  } catch (error) {
    spinner.fail(`Validation error: ${error.message}`);
    process.exit(1);
  }
}

// Helper functions

async function validateManifest(manifest: any, strict: boolean = false): Promise<any> {
  const errors: string[] = [];
  const fixes: any[] = [];
  
  // Check required fields
  if (!manifest.apiVersion) {
    errors.push('Missing apiVersion');
    fixes.push({ field: 'apiVersion', value: 'ossa.ai/v0.1.8' });
  }
  
  if (!manifest.kind || manifest.kind !== 'Agent') {
    errors.push('Invalid or missing kind');
    fixes.push({ field: 'kind', value: 'Agent' });
  }
  
  if (!manifest.metadata?.name) {
    errors.push('Missing metadata.name');
  }
  
  if (!manifest.spec) {
    errors.push('Missing spec section');
  }
  
  // Strict validation
  if (strict) {
    if (!manifest.spec?.capabilities || manifest.spec.capabilities.length === 0) {
      errors.push('No capabilities defined');
    }
    
    if (!manifest.spec?.resources) {
      errors.push('No resource requirements specified');
    }
    
    if (!manifest.spec?.health) {
      errors.push('No health checks defined');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    fixes: fixes.length > 0 ? fixes : undefined
  };
}

function applyFixes(manifest: any, fixes: any[]): any {
  const fixed = { ...manifest };
  
  fixes.forEach(fix => {
    const keys = fix.field.split('.');
    let obj = fixed;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = fix.value;
  });
  
  return fixed;
}

async function updateAgentStatus(name: string, status: string) {
  const registryPath = path.join('.agents-workspace', 'agents', 'registry.json');
  
  if (await fs.pathExists(registryPath)) {
    const registry = await fs.readJSON(registryPath);
    if (registry[name]) {
      registry[name].status = status;
      registry[name].lastUpdated = new Date().toISOString();
      await fs.writeJSON(registryPath, registry, { spaces: 2 });
    }
  }
}

async function getAgentRuntimeStatus(name: string): Promise<any> {
  try {
    // Check if process is running
    const { stdout } = await execAsync(`ps aux | grep "agents/${name}" | grep -v grep`);
    const running = stdout.trim().length > 0;
    
    if (!running) {
      return { running: false };
    }
    
    // Get process stats
    const lines = stdout.trim().split('\n');
    const stats = lines[0].split(/\s+/);
    
    return {
      running: true,
      cpu: `${stats[2]}%`,
      memory: `${stats[3]}%`,
      uptime: stats[9],
      health: 'healthy'
    };
  } catch {
    return { running: false };
  }
}

async function updateAgent(name: string, options: any) {
  const spinner = ora(`Updating agent '${name}'...`).start();
  
  try {
    const { manifest: newManifestPath, version, restart } = options;
    
    if (newManifestPath) {
      // Update with new manifest
      const newManifest = yaml.load(await fs.readFile(newManifestPath, 'utf-8'));
      const agentManifestPath = path.join('.agents', name, 'agent.yaml');
      await fs.writeFile(agentManifestPath, yaml.dump(newManifest));
    }
    
    if (version) {
      // Update version
      const agentManifestPath = path.join('.agents', name, 'agent.yaml');
      const manifest = yaml.load(await fs.readFile(agentManifestPath, 'utf-8')) as any;
      manifest.metadata.version = version;
      await fs.writeFile(agentManifestPath, yaml.dump(manifest));
    }
    
    if (restart) {
      await stopAgent(name, { force: false, timeout: '30' });
      await startAgent(name, { detached: true });
    }
    
    spinner.succeed(`Agent '${name}' updated successfully`);
  } catch (error) {
    spinner.fail(`Update failed: ${error.message}`);
    process.exit(1);
  }
}

async function removeAgent(name: string, options: any) {
  const { purge, force } = options;
  
  if (!force) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Remove agent '${name}'?`,
      default: false
    }]);
    
    if (!confirm) {
      console.log('Cancelled');
      return;
    }
  }
  
  const spinner = ora(`Removing agent '${name}'...`).start();
  
  try {
    // Stop agent if running
    await stopAgent(name, { force: true, timeout: '5' });
    
    // Remove from registry
    const registryPath = path.join('.agents-workspace', 'agents', 'registry.json');
    if (await fs.pathExists(registryPath)) {
      const registry = await fs.readJSON(registryPath);
      delete registry[name];
      await fs.writeJSON(registryPath, registry, { spaces: 2 });
    }
    
    // Remove agent directory
    const agentDir = path.join('.agents', name);
    if (await fs.pathExists(agentDir)) {
      await fs.remove(agentDir);
    }
    
    if (purge) {
      // Remove all agent data
      const dataDir = path.join('.agents-workspace', 'data', name);
      if (await fs.pathExists(dataDir)) {
        await fs.remove(dataDir);
      }
      
      const logsDir = path.join('.agents-workspace', 'logs', name);
      if (await fs.pathExists(logsDir)) {
        await fs.remove(logsDir);
      }
    }
    
    spinner.succeed(`Agent '${name}' removed`);
  } catch (error) {
    spinner.fail(`Removal failed: ${error.message}`);
    process.exit(1);
  }
}

async function checkAgentHealth(name: string | undefined, options: any) {
  if (options.all || !name) {
    // Check all agents
    const registryPath = path.join('.agents-workspace', 'agents', 'registry.json');
    const registry = await fs.readJSON(registryPath);
    
    console.log(chalk.blue('\n🏥 Agent Health Status:\n'));
    
    for (const [agentName, agent] of Object.entries(registry)) {
      const health = await performHealthCheck(agentName);
      const status = health.healthy ? chalk.green('✅ Healthy') : chalk.red('❌ Unhealthy');
      console.log(`${agentName}: ${status}`);
      
      if (options.detailed && !health.healthy) {
        health.checks.forEach((check: any) => {
          if (!check.passed) {
            console.log(`  - ${check.name}: ${chalk.red(check.message)}`);
          }
        });
      }
    }
  } else {
    // Check specific agent
    const health = await performHealthCheck(name);
    
    console.log(chalk.blue(`\n🏥 Health Check: ${name}\n`));
    console.log(`Status: ${health.healthy ? chalk.green('Healthy') : chalk.red('Unhealthy')}`);
    
    if (options.detailed) {
      console.log('\nHealth Checks:');
      health.checks.forEach((check: any) => {
        const status = check.passed ? chalk.green('✅') : chalk.red('❌');
        console.log(`  ${status} ${check.name}: ${check.message}`);
      });
    }
  }
}

async function performHealthCheck(name: string): Promise<any> {
  const checks = [];
  let healthy = true;
  
  // Check if agent directory exists
  const agentDir = path.join('.agents', name);
  const dirExists = await fs.pathExists(agentDir);
  checks.push({
    name: 'Directory',
    passed: dirExists,
    message: dirExists ? 'Agent directory exists' : 'Agent directory not found'
  });
  
  if (!dirExists) healthy = false;
  
  // Check manifest
  const manifestPath = path.join(agentDir, 'agent.yaml');
  const manifestExists = await fs.pathExists(manifestPath);
  checks.push({
    name: 'Manifest',
    passed: manifestExists,
    message: manifestExists ? 'Manifest file present' : 'Manifest file missing'
  });
  
  if (!manifestExists) healthy = false;
  
  // Check runtime status
  const status = await getAgentRuntimeStatus(name);
  checks.push({
    name: 'Runtime',
    passed: status.running,
    message: status.running ? 'Agent is running' : 'Agent is not running'
  });
  
  return { healthy, checks };
}

async function viewAgentLogs(name: string, options: any) {
  const { follow, lines, since } = options;
  const logFile = path.join('.agents-workspace', 'logs', name, 'agent.log');
  
  if (!await fs.pathExists(logFile)) {
    console.log(chalk.yellow(`No logs found for agent '${name}'`));
    return;
  }
  
  let cmd = `tail -n ${lines} ${logFile}`;
  
  if (follow) {
    cmd = `tail -f ${logFile}`;
  }
  
  if (since) {
    // Filter by timestamp
    cmd = `grep -A 1000 "${since}" ${logFile} | tail -n ${lines}`;
  }
  
  const { stdout } = await execAsync(cmd);
  console.log(stdout);
}

async function executeAgentCommand(name: string, command: string, options: any) {
  const spinner = ora(`Executing command in agent '${name}'...`).start();
  
  try {
    // Build execution context
    const agentDir = path.join('.agents', name);
    const env = {
      ...process.env,
      OSSA_AGENT_NAME: name,
      OSSA_AGENT_DIR: agentDir
    };
    
    let execCmd = command;
    if (options.timeout) {
      execCmd = `timeout ${options.timeout} ${command}`;
    }
    
    const { stdout, stderr } = await execAsync(execCmd, {
      cwd: agentDir,
      env
    });
    
    spinner.succeed('Command executed');
    
    if (stdout) {
      console.log(chalk.green('\n📤 Output:'));
      console.log(stdout);
    }
    
    if (stderr) {
      console.log(chalk.yellow('\n⚠️ Errors:'));
      console.log(stderr);
    }
    
  } catch (error) {
    spinner.fail(`Execution failed: ${error.message}`);
    process.exit(1);
  }
}