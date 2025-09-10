/**
 * OSSA Platform API Commands
 *
 * CLI commands that map directly to OpenAPI 3.1.0 operations
 * with full OSSA v0.1.8 compliance and comprehensive functionality.
 *
 * These commands provide a complete CLI interface to all platform
 * capabilities including agent management, discovery, orchestration,
 * and real-time monitoring.
 *
 * @version 0.1.8
 */
import chalk from 'chalk';
import { table } from 'table';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
const { writeFileSync, readFileSync } = fs;
import { ossaClient, CONFORMANCE_TIERS, AGENT_CLASSES, AGENT_CATEGORIES } from '../api/client.js';
import { registerMonitoringCommands, registerAdvancedCommands } from './api-monitoring.js';
import { registerOrchestrationCommands, registerGraphQLCommands } from './api-orchestration.js';
// =====================================================================
// Command Registration Function
// =====================================================================
export function registerApiCommands(program) {
    // System commands
    registerSystemCommands(program);
    // Agent management commands
    registerAgentCommands(program);
    // Discovery commands
    registerDiscoveryCommands(program);
    // Orchestration commands
    registerOrchestrationCommands(program);
    // GraphQL commands
    registerGraphQLCommands(program);
    // Monitoring commands
    registerMonitoringCommands(program);
    // Advanced commands
    registerAdvancedCommands(program);
}
// =====================================================================
// System Commands
// =====================================================================
function registerSystemCommands(program) {
    const systemCmd = program
        .command('system')
        .description('System health and platform information commands');
    systemCmd
        .command('health')
        .description('Get comprehensive system health status')
        .option('-j, --json', 'Output in JSON format')
        .option('-w, --watch', 'Watch health status in real-time')
        .action(async (options) => {
        try {
            if (options.watch) {
                console.log(chalk.blue('Watching system health... (Press Ctrl+C to stop)'));
                setInterval(async () => {
                    await displayHealthStatus(options.json);
                    console.log(''); // Add spacing between updates
                }, 5000);
            }
            else {
                await displayHealthStatus(options.json);
            }
        }
        catch (error) {
            console.error(chalk.red('Error fetching health status:'), error);
            process.exit(1);
        }
    });
    systemCmd
        .command('version')
        .description('Get platform version information')
        .option('-j, --json', 'Output in JSON format')
        .action(async (options) => {
        try {
            const spinner = ora('Fetching version information...').start();
            const response = await ossaClient.getVersion();
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                const data = [
                    ['Component', 'Version'],
                    ['API', response.data.api],
                    ['OSSA', response.data.ossa],
                    ['Platform', response.data.platform],
                    ...(response.data.build ? [['Build', response.data.build]] : []),
                    ...(response.data.commit ? [['Commit', response.data.commit.substring(0, 8)]] : [])
                ];
                console.log(table(data));
            }
        }
        catch (error) {
            console.error(chalk.red('Error fetching version:'), error);
            process.exit(1);
        }
    });
    systemCmd
        .command('metrics')
        .description('Get platform metrics and statistics')
        .option('-t, --timeframe <timeframe>', 'Time range (1h, 24h, 7d, 30d)', '1h')
        .option('-f, --format <format>', 'Output format (json, prometheus)', 'json')
        .option('-j, --json', 'Output in JSON format')
        .action(async (options) => {
        try {
            const spinner = ora('Fetching platform metrics...').start();
            const filters = {
                timeframe: options.timeframe,
                format: options.format
            };
            const response = await ossaClient.getMetrics(filters);
            spinner.stop();
            if (options.json || options.format === 'json') {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else if (options.format === 'prometheus') {
                console.log(response.data);
            }
            else {
                displayMetricsTable(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red('Error fetching metrics:'), error);
            process.exit(1);
        }
    });
}
// =====================================================================
// Agent Management Commands
// =====================================================================
function registerAgentCommands(program) {
    const agentCmd = program
        .command('agent')
        .description('Agent registration and management commands');
    agentCmd
        .command('list')
        .description('List all registered agents')
        .option('-l, --limit <number>', 'Number of agents to return', '20')
        .option('-o, --offset <number>', 'Number of agents to skip', '0')
        .option('-t, --tier <tier>', 'Filter by conformance tier (core, governed, advanced)')
        .option('-c, --class <class>', 'Filter by agent class')
        .option('-s, --status <status>', 'Filter by health status')
        .option('--capability <capability>', 'Filter by capability')
        .option('--domain <domain>', 'Filter by domain')
        .option('-j, --json', 'Output in JSON format')
        .action(async (options) => {
        try {
            const spinner = ora('Fetching agents...').start();
            const filters = {
                limit: parseInt(options.limit),
                offset: parseInt(options.offset),
                ...(options.tier && { tier: options.tier }),
                ...(options.class && { class: options.class }),
                ...(options.status && { status: options.status }),
                ...(options.capability && { capability: options.capability }),
                ...(options.domain && { domain: options.domain })
            };
            const response = await ossaClient.listAgents(filters);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayAgentsTable(response.data.agents);
                console.log(chalk.gray(`\nTotal: ${response.data.total} agents (showing ${response.data.agents.length})`));
            }
        }
        catch (error) {
            console.error(chalk.red('Error listing agents:'), error);
            process.exit(1);
        }
    });
    agentCmd
        .command('get <agentId>')
        .description('Get detailed information about a specific agent')
        .option('-j, --json', 'Output in JSON format')
        .action(async (agentId, options) => {
        try {
            const spinner = ora(`Fetching agent ${agentId}...`).start();
            const response = await ossaClient.getAgent(agentId);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayAgentDetails(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red(`Error fetching agent ${agentId}:`), error);
            process.exit(1);
        }
    });
    agentCmd
        .command('register')
        .description('Register a new agent with the platform')
        .option('-f, --file <file>', 'Agent registration file (JSON/YAML)')
        .option('-i, --interactive', 'Interactive agent registration')
        .action(async (options) => {
        try {
            let registration;
            if (options.file) {
                const content = readFileSync(options.file, 'utf-8');
                registration = options.file.endsWith('.yaml') || options.file.endsWith('.yml')
                    ? require('yaml').parse(content)
                    : JSON.parse(content);
            }
            else if (options.interactive) {
                registration = await promptAgentRegistration();
            }
            else {
                console.error(chalk.red('Please provide either --file or --interactive option'));
                process.exit(1);
            }
            const spinner = ora('Registering agent...').start();
            const response = await ossaClient.registerAgent(registration);
            spinner.stop();
            console.log(chalk.green('Agent registered successfully!'));
            console.log(`Agent ID: ${chalk.cyan(response.data.id)}`);
            displayAgentDetails(response.data);
        }
        catch (error) {
            console.error(chalk.red('Error registering agent:'), error);
            process.exit(1);
        }
    });
    agentCmd
        .command('update <agentId>')
        .description('Update an existing agent')
        .option('-f, --file <file>', 'Agent update file (JSON/YAML)')
        .option('-i, --interactive', 'Interactive agent update')
        .action(async (agentId, options) => {
        try {
            let update;
            if (options.file) {
                const content = readFileSync(options.file, 'utf-8');
                update = options.file.endsWith('.yaml') || options.file.endsWith('.yml')
                    ? require('yaml').parse(content)
                    : JSON.parse(content);
            }
            else if (options.interactive) {
                // Get current agent first
                const currentAgent = await ossaClient.getAgent(agentId);
                update = await promptAgentUpdate(currentAgent.data);
            }
            else {
                console.error(chalk.red('Please provide either --file or --interactive option'));
                process.exit(1);
            }
            const spinner = ora(`Updating agent ${agentId}...`).start();
            const response = await ossaClient.updateAgent(agentId, update);
            spinner.stop();
            console.log(chalk.green('Agent updated successfully!'));
            displayAgentDetails(response.data);
        }
        catch (error) {
            console.error(chalk.red(`Error updating agent ${agentId}:`), error);
            process.exit(1);
        }
    });
    agentCmd
        .command('unregister <agentId>')
        .description('Unregister an agent from the platform')
        .option('-y, --yes', 'Skip confirmation prompt')
        .action(async (agentId, options) => {
        try {
            if (!options.yes) {
                const { confirm } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: `Are you sure you want to unregister agent ${agentId}?`,
                        default: false
                    }
                ]);
                if (!confirm) {
                    console.log('Operation cancelled');
                    return;
                }
            }
            const spinner = ora(`Unregistering agent ${agentId}...`).start();
            await ossaClient.unregisterAgent(agentId);
            spinner.stop();
            console.log(chalk.green(`Agent ${agentId} unregistered successfully!`));
        }
        catch (error) {
            console.error(chalk.red(`Error unregistering agent ${agentId}:`), error);
            process.exit(1);
        }
    });
    agentCmd
        .command('health <agentId>')
        .description('Check the health status of a specific agent')
        .option('-j, --json', 'Output in JSON format')
        .action(async (agentId, options) => {
        try {
            const spinner = ora(`Checking health of agent ${agentId}...`).start();
            const response = await ossaClient.getAgentHealth(agentId);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayAgentHealthStatus(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red(`Error checking health of agent ${agentId}:`), error);
            process.exit(1);
        }
    });
    agentCmd
        .command('capabilities <agentId>')
        .description('Get detailed capabilities of a specific agent')
        .option('-j, --json', 'Output in JSON format')
        .action(async (agentId, options) => {
        try {
            const spinner = ora(`Fetching capabilities of agent ${agentId}...`).start();
            const response = await ossaClient.getAgentCapabilities(agentId);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayAgentCapabilities(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red(`Error fetching capabilities of agent ${agentId}:`), error);
            process.exit(1);
        }
    });
}
// =====================================================================
// Discovery Commands
// =====================================================================
function registerDiscoveryCommands(program) {
    const discoveryCmd = program
        .command('discover')
        .description('Universal Agent Discovery Protocol (UADP) commands');
    discoveryCmd
        .command('agents')
        .description('Discover agents by capabilities')
        .option('-c, --capabilities <capabilities>', 'Required capabilities (comma-separated)')
        .option('-d, --domain <domain>', 'Domain filter')
        .option('-t, --tier <tier>', 'Minimum conformance tier')
        .option('--class <class>', 'Agent class filter')
        .option('-p, --protocol <protocol>', 'Required protocol support')
        .option('-a, --availability <threshold>', 'Minimum availability percentage', '95')
        .option('-j, --json', 'Output in JSON format')
        .action(async (options) => {
        try {
            const spinner = ora('Discovering agents...').start();
            const request = {
                ...(options.capabilities && { capabilities: options.capabilities }),
                ...(options.domain && { domain: options.domain }),
                ...(options.tier && { tier: options.tier }),
                ...(options.class && { class: options.class }),
                ...(options.protocol && { protocol: options.protocol }),
                availability_threshold: parseFloat(options.availability)
            };
            const response = await ossaClient.discoverAgents(request);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayDiscoveryResults(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red('Error discovering agents:'), error);
            process.exit(1);
        }
    });
    discoveryCmd
        .command('recommend')
        .description('Get AI-powered agent recommendations')
        .option('-t, --task <description>', 'Task description')
        .option('-i, --interactive', 'Interactive task description')
        .option('-c, --context <file>', 'Context file (JSON)')
        .option('-m, --max <count>', 'Maximum recommendations', '5')
        .option('-j, --json', 'Output in JSON format')
        .action(async (options) => {
        try {
            let taskDescription = options.task;
            if (!taskDescription) {
                if (options.interactive) {
                    const { task } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'task',
                            message: 'Describe the task you need agents for:',
                            validate: (input) => input.length > 0 || 'Task description is required'
                        }
                    ]);
                    taskDescription = task;
                }
                else {
                    console.error(chalk.red('Please provide task description with --task or --interactive'));
                    process.exit(1);
                }
            }
            let context;
            if (options.context) {
                context = JSON.parse(readFileSync(options.context, 'utf-8'));
            }
            const spinner = ora('Getting AI-powered recommendations...').start();
            const request = {
                task_description: taskDescription,
                ...(context && { context }),
                max_recommendations: parseInt(options.max)
            };
            const response = await ossaClient.recommendAgents(request);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayRecommendations(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red('Error getting recommendations:'), error);
            process.exit(1);
        }
    });
}
// =====================================================================
// Utility Functions for Display
// =====================================================================
async function displayHealthStatus(json = false) {
    const response = await ossaClient.getHealth();
    const healthData = response.data;
    if (json) {
        console.log(JSON.stringify(response.data, null, 2));
        return;
    }
    const status = healthData.status;
    const statusColor = status === 'healthy' ? 'green' : status === 'degraded' ? 'yellow' : 'red';
    console.log(chalk.bold('System Health Status'));
    console.log(`Status: ${chalk[statusColor](status.toUpperCase())}`);
    console.log(`Version: ${chalk.cyan(healthData.version)}`);
    if (healthData.ossa_version) {
        console.log(`OSSA Version: ${chalk.cyan(healthData.ossa_version)}`);
    }
    if (healthData.uptime) {
        const uptime = Math.floor(healthData.uptime / 3600);
        console.log(`Uptime: ${chalk.cyan(`${uptime} hours`)}`);
    }
    if (healthData.services) {
        console.log('\nServices:');
        Object.entries(healthData.services).forEach(([service, serviceStatus]) => {
            const serviceColor = serviceStatus === 'healthy' ? 'green' : serviceStatus === 'degraded' ? 'yellow' : 'red';
            console.log(`  ${service}: ${chalk[serviceColor](serviceStatus)}`);
        });
    }
}
function displayMetricsTable(metrics) {
    console.log(chalk.bold('Platform Metrics'));
    if (metrics.agents) {
        console.log('\nAgents:');
        console.log(`  Total: ${chalk.cyan(metrics.agents.total || 0)}`);
        console.log(`  Active: ${chalk.green(metrics.agents.active || 0)}`);
        if (metrics.agents.by_tier) {
            console.log('  By Tier:');
            Object.entries(metrics.agents.by_tier).forEach(([tier, count]) => {
                console.log(`    ${tier}: ${chalk.cyan(count)}`);
            });
        }
    }
    if (metrics.requests) {
        console.log('\nRequests:');
        console.log(`  Total: ${chalk.cyan(metrics.requests.total || 0)}`);
        console.log(`  Success Rate: ${chalk.green(`${metrics.requests.success_rate || 0}%`)}`);
        console.log(`  Avg Response Time: ${chalk.cyan(`${metrics.requests.average_response_time || 0}ms`)}`);
    }
}
function displayAgentsTable(agents) {
    if (agents.length === 0) {
        console.log(chalk.yellow('No agents found'));
        return;
    }
    const data = [
        ['ID', 'Name', 'Version', 'Class', 'Tier', 'Status', 'Last Seen']
    ];
    agents.forEach(agent => {
        const status = agent.status?.health || 'unknown';
        const statusColor = status === 'healthy' ? 'green' : status === 'degraded' ? 'yellow' : 'red';
        data.push([
            agent.id,
            agent.name,
            agent.version,
            agent.spec.class,
            agent.spec.conformance_tier,
            chalk[statusColor](status),
            agent.status?.last_seen ? new Date(agent.status.last_seen).toLocaleString() : 'N/A'
        ]);
    });
    console.log(table(data));
}
function displayAgentDetails(agent) {
    console.log(chalk.bold(`Agent: ${agent.name}`));
    console.log(`ID: ${chalk.cyan(agent.id)}`);
    console.log(`Version: ${chalk.cyan(agent.version)}`);
    console.log(`Description: ${agent.description || 'N/A'}`);
    console.log(`Class: ${chalk.blue(agent.spec.class)}`);
    console.log(`Category: ${chalk.blue(agent.spec.category || 'N/A')}`);
    console.log(`Conformance Tier: ${chalk.magenta(agent.spec.conformance_tier)}`);
    console.log(`Registered: ${new Date(agent.registered_at).toLocaleString()}`);
    if (agent.spec.capabilities.primary.length > 0) {
        console.log('\nPrimary Capabilities:');
        agent.spec.capabilities.primary.forEach(cap => {
            console.log(`  • ${chalk.green(cap)}`);
        });
    }
    if (agent.spec.capabilities.secondary && agent.spec.capabilities.secondary.length > 0) {
        console.log('\nSecondary Capabilities:');
        agent.spec.capabilities.secondary.forEach(cap => {
            console.log(`  • ${chalk.yellow(cap)}`);
        });
    }
    if (agent.spec.protocols && agent.spec.protocols.length > 0) {
        console.log('\nSupported Protocols:');
        agent.spec.protocols.forEach(protocol => {
            console.log(`  • ${protocol.name} v${protocol.version} ${protocol.required ? chalk.red('(required)') : chalk.gray('(optional)')}`);
        });
    }
    console.log('\nEndpoints:');
    Object.entries(agent.spec.endpoints).forEach(([name, url]) => {
        if (url) {
            console.log(`  ${name}: ${chalk.cyan(url)}`);
        }
    });
}
function displayAgentHealthStatus(status) {
    const healthColor = status.health === 'healthy' ? 'green' : status.health === 'degraded' ? 'yellow' : 'red';
    console.log(chalk.bold('Agent Health Status'));
    console.log(`Health: ${chalk[healthColor](status.health.toUpperCase())}`);
    console.log(`Last Seen: ${new Date(status.last_seen).toLocaleString()}`);
    if (status.metrics) {
        console.log('\nMetrics:');
        if (status.metrics.requests_per_minute !== undefined) {
            console.log(`  Requests/min: ${chalk.cyan(status.metrics.requests_per_minute)}`);
        }
        if (status.metrics.average_response_time !== undefined) {
            console.log(`  Avg Response Time: ${chalk.cyan(`${status.metrics.average_response_time}ms`)}`);
        }
        if (status.metrics.error_rate !== undefined) {
            console.log(`  Error Rate: ${chalk.cyan(`${status.metrics.error_rate}%`)}`);
        }
        if (status.metrics.cpu_usage !== undefined) {
            console.log(`  CPU Usage: ${chalk.cyan(`${status.metrics.cpu_usage}%`)}`);
        }
        if (status.metrics.memory_usage !== undefined) {
            console.log(`  Memory Usage: ${chalk.cyan(`${status.metrics.memory_usage}%`)}`);
        }
    }
}
function displayAgentCapabilities(capabilities) {
    console.log(chalk.bold('Agent Capabilities'));
    if (capabilities.capabilities) {
        if (capabilities.capabilities.primary) {
            console.log('\nPrimary Capabilities:');
            capabilities.capabilities.primary.forEach((cap) => {
                console.log(`  • ${chalk.green(cap)}`);
            });
        }
        if (capabilities.capabilities.secondary) {
            console.log('\nSecondary Capabilities:');
            capabilities.capabilities.secondary.forEach((cap) => {
                console.log(`  • ${chalk.yellow(cap)}`);
            });
        }
    }
    if (capabilities.protocols) {
        console.log('\nSupported Protocols:');
        capabilities.protocols.forEach((protocol) => {
            console.log(`  • ${protocol.name} v${protocol.version}`);
        });
    }
    if (capabilities.endpoints) {
        console.log('\nEndpoints:');
        Object.entries(capabilities.endpoints).forEach(([name, url]) => {
            console.log(`  ${name}: ${chalk.cyan(url)}`);
        });
    }
}
function displayDiscoveryResults(results) {
    console.log(chalk.bold('Discovery Results'));
    console.log(`Found ${chalk.cyan(results.agents.length)} agents`);
    if (results.execution_time) {
        console.log(`Execution time: ${chalk.gray(`${results.execution_time}ms`)}`);
    }
    if (results.agents.length > 0) {
        displayAgentsTable(results.agents);
    }
}
function displayRecommendations(recommendations) {
    console.log(chalk.bold('AI-Powered Agent Recommendations'));
    if (recommendations.task_analysis) {
        console.log('\nTask Analysis:');
        console.log(`Complexity Score: ${chalk.cyan(recommendations.task_analysis.complexity_score)}`);
        if (recommendations.task_analysis.required_capabilities) {
            console.log('Required Capabilities:');
            recommendations.task_analysis.required_capabilities.forEach((cap) => {
                console.log(`  • ${chalk.blue(cap)}`);
            });
        }
        if (recommendations.task_analysis.suggested_workflow) {
            console.log(`Suggested Workflow: ${chalk.green(recommendations.task_analysis.suggested_workflow)}`);
        }
    }
    if (recommendations.recommendations.length > 0) {
        console.log('\nRecommendations:');
        recommendations.recommendations.forEach((rec, index) => {
            console.log(`\n${index + 1}. ${chalk.bold(rec.agent.name)} (Score: ${chalk.cyan((rec.confidence_score * 100).toFixed(1))}%)`);
            console.log(`   ${rec.reasoning}`);
            console.log(`   Matching: ${rec.matching_capabilities.join(', ')}`);
        });
    }
}
async function promptAgentRegistration() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Agent name:',
            validate: (input) => input.length > 0 || 'Name is required'
        },
        {
            type: 'input',
            name: 'version',
            message: 'Agent version:',
            default: '1.0.0',
            validate: (input) => /^\d+\.\d+\.\d+/.test(input) || 'Valid semver required'
        },
        {
            type: 'input',
            name: 'description',
            message: 'Description (optional):'
        },
        {
            type: 'input',
            name: 'endpoint',
            message: 'Agent endpoint URL:',
            validate: (input) => input.startsWith('http') || 'Valid HTTP(S) URL required'
        },
        {
            type: 'list',
            name: 'tier',
            message: 'Conformance tier:',
            choices: CONFORMANCE_TIERS
        },
        {
            type: 'list',
            name: 'class',
            message: 'Agent class:',
            choices: AGENT_CLASSES
        },
        {
            type: 'list',
            name: 'category',
            message: 'Agent category:',
            choices: AGENT_CATEGORIES
        },
        {
            type: 'input',
            name: 'capabilities',
            message: 'Primary capabilities (comma-separated):',
            validate: (input) => input.length > 0 || 'At least one capability required'
        },
        {
            type: 'input',
            name: 'healthEndpoint',
            message: 'Health check endpoint:',
            default: '/health'
        }
    ]);
    return {
        name: answers.name,
        version: answers.version,
        description: answers.description || undefined,
        endpoint: answers.endpoint,
        spec: {
            conformance_tier: answers.tier,
            class: answers.class,
            category: answers.category,
            capabilities: {
                primary: answers.capabilities.split(',').map((c) => c.trim())
            },
            endpoints: {
                health: answers.healthEndpoint
            }
        }
    };
}
async function promptAgentUpdate(currentAgent) {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'version',
            message: 'New version:',
            default: currentAgent.version
        },
        {
            type: 'input',
            name: 'description',
            message: 'Description:',
            default: currentAgent.description
        },
        {
            type: 'confirm',
            name: 'updateCapabilities',
            message: 'Update capabilities?',
            default: false
        }
    ]);
    const update = {};
    if (answers.version !== currentAgent.version) {
        update.version = answers.version;
    }
    if (answers.description !== currentAgent.description) {
        update.description = answers.description;
    }
    if (answers.updateCapabilities) {
        const capAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'capabilities',
                message: 'Primary capabilities (comma-separated):',
                default: currentAgent.spec.capabilities.primary.join(', ')
            }
        ]);
        update.spec = {
            ...currentAgent.spec,
            capabilities: {
                ...currentAgent.spec.capabilities,
                primary: capAnswers.capabilities.split(',').map((c) => c.trim())
            }
        };
    }
    return update;
}
// Continue with orchestration, GraphQL, monitoring, and advanced commands...
// (Additional functions would be added here following the same pattern)
