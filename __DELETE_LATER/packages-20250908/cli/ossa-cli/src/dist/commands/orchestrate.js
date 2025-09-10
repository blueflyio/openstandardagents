/**
 * OSSA CLI Orchestration Commands
 * 93-Agent Deployment System Integration
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { OSSAOrchestrator } from '../orchestrator.js';
export function createOrchestrateCommands() {
    const cmd = new Command('orchestrate')
        .description('Multi-agent orchestration system (93 agents across 7 tiers)');
    cmd.command('deploy')
        .description('Deploy all 93 agents with tier-based validation')
        .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
        .option('-t, --tier <number>', 'Deploy specific tier only')
        .option('--dry-run', 'Show deployment plan without executing')
        .action(async (options) => {
        console.log(chalk.blue('🚀 OSSA Multi-Agent Orchestration System'));
        const orchestrator = new OSSAOrchestrator(options.workspace);
        if (options.dryRun) {
            console.log(chalk.blue('🔍 Dry run mode - showing deployment plan...'));
            orchestrator.displayStatus();
        }
        else {
            if (options.tier) {
                console.log(chalk.yellow(`Deploying Tier ${options.tier} only...`));
                // Deploy specific tier
            }
            else {
                await orchestrator.deploy();
            }
        }
    });
    cmd.command('status')
        .description('Display current orchestration status')
        .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
        .action((options) => {
        const orchestrator = new OSSAOrchestrator(options.workspace);
        orchestrator.displayStatus();
    });
    cmd.command('monitor')
        .description('Real-time monitoring of agent deployment')
        .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
        .option('-i, --interval <seconds>', 'Update interval in seconds', '5')
        .action(async (options) => {
        const orchestrator = new OSSAOrchestrator(options.workspace);
        const interval = parseInt(options.interval) * 1000;
        console.log(chalk.blue(`📊 Starting real-time monitoring (updates every ${options.interval}s)`));
        console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));
        const monitorLoop = setInterval(() => {
            console.clear();
            orchestrator.displayStatus();
        }, interval);
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            clearInterval(monitorLoop);
            console.log(chalk.yellow('\n📊 Monitoring stopped.'));
            process.exit(0);
        });
    });
    return cmd;
}
