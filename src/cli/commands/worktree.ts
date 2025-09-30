/**
 * OSSA CLI Worktree Management Commands
 * Provides git worktree integration with intelligent branching and adaptive flows
 */

import { Command } from 'commander';
import GitWorktreeManager, { type WorktreeConfig } from '../../services/worktree/git-worktree-manager.js';
import BranchingStrategyManager from '../../services/worktree/branching-strategy.js';
import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import chalk from 'chalk';
import * as yaml from 'js-yaml';

const worktreeManager = new GitWorktreeManager();
const branchingStrategy = new BranchingStrategyManager();

/**
 * Extract agent dependencies from agent configuration
 */
function extractAgentDependencies(agentName: string): string[] {
  try {
    const agentPath = join('.agents', agentName, 'agent.yml');

    if (!existsSync(agentPath)) {
      console.warn(chalk.yellow(`⚠️  Agent config not found at ${agentPath}`));
      return [];
    }

    const agentConfig = yaml.load(readFileSync(agentPath, 'utf8')) as any;

    if (!agentConfig?.spec?.dependencies?.agents) {
      return [];
    }

    // Extract agent dependency names
    return agentConfig.spec.dependencies.agents
      .filter((dep: any) => !dep.optional) // Only required dependencies
      .map((dep: any) => dep.name);
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Unable to extract dependencies for ${agentName}: ${(error as Error).message}`));
    return [];
  }
}

/**
 * Display comprehensive flow status for agents
 */
function displayFlowStatus(specificAgent?: string): void {
  console.log(chalk.blue('🔀 Agentic Flow Status\n'));

  try {
    const activeWorktrees = worktreeManager.listActiveWorktrees();

    if (activeWorktrees.length === 0) {
      console.log(chalk.gray('📭 No active agent worktrees found'));
      return;
    }

    // Filter for specific agent if requested
    const targetWorktrees = specificAgent
      ? activeWorktrees.filter((w) => w.agentName === specificAgent)
      : activeWorktrees;

    if (specificAgent && targetWorktrees.length === 0) {
      console.log(chalk.red(`❌ Agent '${specificAgent}' not found in active worktrees`));
      return;
    }

    console.log(
      chalk.cyan(`📊 Found ${targetWorktrees.length} active agent${targetWorktrees.length === 1 ? '' : 's'}\n`)
    );

    for (const worktree of targetWorktrees) {
      displayAgentFlowStatus(worktree);
    }

    // Overall summary if showing all agents
    if (!specificAgent && targetWorktrees.length > 1) {
      displayFlowSummary(targetWorktrees);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error retrieving flow status: ${(error as Error).message}`));
  }
}

/**
 * Display flow status for a single agent
 */
function displayAgentFlowStatus(worktree: any): void {
  const config = worktreeManager.loadWorktreeConfig(worktree.agentName);
  const branchAwareness = worktreeManager.getBranchAwareness(worktree.agentName);

  console.log(chalk.bold(`🤖 ${worktree.agentName}`));
  console.log(`   ${chalk.gray('Path:')} ${worktree.path}`);

  if (config) {
    console.log(`   ${chalk.gray('Priority:')} ${getPriorityDisplay(config.priority)}`);
    console.log(`   ${chalk.gray('Phase:')} ${config.phase}`);
    console.log(`   ${chalk.gray('Base Branch:')} ${chalk.green(config.baseBranch)}`);

    if (config.dependencies && config.dependencies.length > 0) {
      console.log(`   ${chalk.gray('Dependencies:')} ${config.dependencies.join(', ')}`);
    }
  }

  // Git status
  console.log(`   ${chalk.gray('Commits Ahead:')} ${branchAwareness.commitsAhead}`);
  console.log(`   ${chalk.gray('Commits Behind:')} ${branchAwareness.commitsBehind}`);
  console.log(
    `   ${chalk.gray('Uncommitted Changes:')} ${branchAwareness.hasUncommittedChanges ? chalk.yellow('Yes') : chalk.green('No')}`
  );
  console.log(`   ${chalk.gray('Conflicts:')} ${branchAwareness.hasConflicts ? chalk.red('Yes') : chalk.green('No')}`);

  // Flow recommendations
  const flowStatus = getFlowStatus(branchAwareness, config);
  console.log(`   ${chalk.gray('Flow Status:')} ${flowStatus}`);

  console.log(); // Empty line for spacing
}

/**
 * Get priority display with color coding
 */
function getPriorityDisplay(priority: string): string {
  switch (priority) {
    case 'critical':
      return chalk.red('🔴 Critical');
    case 'high':
      return chalk.yellow('🟡 High');
    case 'medium':
      return chalk.blue('🔵 Medium');
    case 'low':
      return chalk.gray('⚫ Low');
    default:
      return priority;
  }
}

/**
 * Get flow status with recommendations
 */
function getFlowStatus(branchAwareness: any, config: any): string {
  if (branchAwareness.hasConflicts) {
    return chalk.red('🚨 Conflicts need resolution');
  }

  if (branchAwareness.commitsAhead > 0 && !branchAwareness.hasUncommittedChanges) {
    return chalk.green('✅ Ready for integration');
  }

  if (branchAwareness.hasUncommittedChanges) {
    return chalk.yellow('⚡ Active development');
  }

  if (branchAwareness.commitsBehind > 0) {
    return chalk.cyan('🔄 Needs sync with base');
  }

  return chalk.gray('⏸️  Idle');
}

/**
 * Display overall flow summary
 */
function displayFlowSummary(worktrees: any[]): void {
  console.log(chalk.bold('📈 Flow Summary\n'));

  const stats = {
    total: worktrees.length,
    readyForIntegration: 0,
    activeDevelopment: 0,
    conflicts: 0,
    needsSync: 0,
    idle: 0
  };

  for (const worktree of worktrees) {
    const branchAwareness = worktreeManager.getBranchAwareness(worktree.agentName);

    if (branchAwareness.hasConflicts) {
      stats.conflicts++;
    } else if (branchAwareness.commitsAhead > 0 && !branchAwareness.hasUncommittedChanges) {
      stats.readyForIntegration++;
    } else if (branchAwareness.hasUncommittedChanges) {
      stats.activeDevelopment++;
    } else if (branchAwareness.commitsBehind > 0) {
      stats.needsSync++;
    } else {
      stats.idle++;
    }
  }

  console.log(`   ${chalk.green('✅ Ready for Integration:')} ${stats.readyForIntegration}`);
  console.log(`   ${chalk.yellow('⚡ Active Development:')} ${stats.activeDevelopment}`);
  console.log(`   ${chalk.red('🚨 Conflicts:')} ${stats.conflicts}`);
  console.log(`   ${chalk.cyan('🔄 Needs Sync:')} ${stats.needsSync}`);
  console.log(`   ${chalk.gray('⏸️  Idle:')} ${stats.idle}`);

  // Recommendations
  if (stats.conflicts > 0) {
    console.log(
      chalk.red(`\n⚠️  ${stats.conflicts} agent${stats.conflicts === 1 ? '' : 's'} have conflicts that need resolution`)
    );
  }
  if (stats.readyForIntegration > 0) {
    console.log(
      chalk.green(
        `\n🎉 ${stats.readyForIntegration} agent${stats.readyForIntegration === 1 ? '' : 's'} ready for integration`
      )
    );
  }
}

export const worktreeCommand = new Command('worktree');

worktreeCommand
  .description('Manage git worktrees for parallel agent development')
  .addCommand(createWorktreeCommand())
  .addCommand(listWorktreesCommand())
  .addCommand(syncWorktreeCommand())
  .addCommand(integrateCommand())
  .addCommand(cleanupCommand())
  .addCommand(flowCommand())
  .addCommand(branchCommand())
  .addCommand(statusCommand());

function createWorktreeCommand(): Command {
  return new Command('create')
    .description('Create a new worktree for an agent')
    .requiredOption('-a, --agent <name>', 'Agent name (must follow OSSA naming conventions)')
    .option('-b, --base-branch <branch>', 'Base branch to branch from', 'v0.1.9-dev')
    .option('-v, --version <version>', 'OSSA version', '0.1.9')
    .option('-p, --priority <priority>', 'Priority level', 'medium')
    .option('-s, --specialization <spec>', 'Agent specialization')
    .option('--phase <phase>', 'Development phase', '1')
    .option('--task-type <type>', 'Task type for branch naming')
    .option('--flow <flow>', 'Agentic flow type', 'adaptive')
    .option('--auto-branch', 'Automatically determine branch type and name')
    .action(async (options) => {
      try {
        console.log(chalk.blue('🚀 Creating agent worktree with intelligent branching...'));

        // Validate agent name follows OSSA conventions
        if (!isValidAgentName(options.agent)) {
          console.error(chalk.red('❌ Agent name must follow OSSA naming convention: [scope-]domain-role[-framework]'));
          console.log(chalk.yellow('Examples: openapi-expert, security-auditor, workflow-orchestrator'));
          return;
        }

        // Get repository path
        const gitRepository = findGitRepository();
        if (!gitRepository) {
          console.error(chalk.red('❌ Not in a git repository. Please run from OSSA project root.'));
          return;
        }

        // Determine optimal branching strategy
        let taskType = options.taskType;
        let branchRecommendations;

        if (options.autoBranch && options.specialization) {
          branchRecommendations = branchingStrategy.getBranchNamingRecommendations(
            options.agent,
            options.specialization,
            parseInt(options.phase),
            options.priority
          );
          console.log(chalk.green(`✨ Recommended branch: ${branchRecommendations.primary}`));
          console.log(chalk.gray(`   Reasoning: ${branchRecommendations.reasoning}`));
        }

        // Determine optimal agentic flow
        const flowContext = {
          agentCount: 1, // Individual agent for now
          priority: options.priority,
          complexity: options.specialization?.includes('protocol') ? 'high' : 'medium',
          dependencies: extractAgentDependencies(options.agent),
          riskTolerance: options.priority === 'critical' ? 'conservative' : 'moderate',
          timeline: options.priority === 'critical' ? 'immediate' : 'standard'
        } as const;

        const optimalFlow = branchingStrategy.determineOptimalFlow(options.agent);
        const flowConfig = branchingStrategy.getFlowConfig(optimalFlow);

        console.log(chalk.cyan(`🔀 Using ${optimalFlow} flow with ${flowConfig?.coordinationLevel} coordination`));

        // Create worktree configuration
        const worktreeConfig: WorktreeConfig = {
          agentName: options.agent,
          baseBranch: options.baseBranch,
          featureBranch: '', // Will be generated by manager
          workingDirectory: '', // Will be set by manager
          gitRepository,
          ossaVersion: options.version,
          priority: options.priority as any,
          phase: parseInt(options.phase),
          dependencies: extractAgentDependencies(options.agent)
        };

        // Create the worktree
        const worktreePath = await worktreeManager.createAgentWorktree(worktreeConfig);

        // Get branch awareness information
        const branchAwareness = worktreeManager.getBranchAwareness(options.agent);
        const versionAwareness = worktreeManager.getProjectVersionAwareness();

        console.log(chalk.green('✅ Agent worktree created successfully!'));
        console.log(chalk.gray('📁 Path:'), chalk.white(worktreePath));
        console.log(chalk.gray('🌿 Branch:'), chalk.white(branchAwareness?.currentBranch));
        console.log(chalk.gray('🎯 Target:'), chalk.white(versionAwareness?.targetVersion));
        console.log(chalk.gray('🔄 Flow:'), chalk.white(optimalFlow));

        console.log(chalk.yellow('\n📋 Next steps:'));
        console.log(`   cd ${worktreePath}`);
        console.log(`   ossa worktree status ${options.agent}`);
        console.log(`   # Begin agent development...`);
      } catch (error) {
        console.error(chalk.red('❌ Failed to create worktree:'), (error as Error).message);
        process.exit(1);
      }
    });
}

function listWorktreesCommand(): Command {
  return new Command('list')
    .description('List all active agent worktrees')
    .option('--phase <phase>', 'Filter by development phase')
    .option('--priority <priority>', 'Filter by priority level')
    .action((options) => {
      try {
        const worktrees = worktreeManager.listActiveWorktrees();

        let filtered = worktrees;
        if (options.phase) {
          filtered = filtered.filter((w) => w.phase.toString() === options.phase);
        }
        if (options.priority) {
          filtered = filtered.filter((w) => w.priority === options.priority);
        }

        if (filtered.length === 0) {
          console.log(chalk.yellow('📭 No active agent worktrees found'));
          return;
        }

        console.log(chalk.blue(`🌳 Active Agent Worktrees (${filtered.length})`));
        console.log('');

        // Group by phase for better organization
        const byPhase = filtered.reduce(
          (groups, worktree) => {
            const phase = worktree.phase;
            if (!groups[phase]) groups[phase] = [];
            groups[phase].push(worktree);
            return groups;
          },
          {} as Record<number, typeof filtered>
        );

        Object.keys(byPhase)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .forEach((phase) => {
            console.log(chalk.cyan(`Phase ${phase}:`));
            byPhase[parseInt(phase)].forEach((worktree: any) => {
              const priorityColor =
                (
                  {
                    critical: chalk.red,
                    high: chalk.yellow,
                    medium: chalk.blue,
                    low: chalk.gray
                  } as any
                )[worktree.priority] || chalk.white;

              console.log(`  ${priorityColor('●')} ${chalk.white(worktree.agent)}`);
              console.log(`    Branch: ${chalk.gray(worktree.branch)}`);
              console.log(`    Path: ${chalk.gray(worktree.path)}`);
              console.log(`    Version: ${chalk.gray(worktree.ossaVersion)}`);
            });
            console.log('');
          });
      } catch (error) {
        console.error(chalk.red('❌ Failed to list worktrees:'), (error as Error).message);
      }
    });
}

function syncWorktreeCommand(): Command {
  return new Command('sync')
    .description('Synchronize agent worktree with remote repository')
    .argument('<agent>', 'Agent name')
    .option('--force', 'Force sync even with uncommitted changes')
    .action(async (agent, options) => {
      try {
        console.log(chalk.blue(`🔄 Synchronizing worktree for ${agent}...`));

        await worktreeManager.syncWorktree(agent);

        const branchAwareness = worktreeManager.getBranchAwareness(agent);
        console.log(chalk.green(`✅ Worktree synchronized successfully!`));
        console.log(chalk.gray('🌿 Branch:'), chalk.white(branchAwareness?.currentBranch));
      } catch (error) {
        console.error(chalk.red('❌ Failed to sync worktree:'), (error as Error).message);
        process.exit(1);
      }
    });
}

function integrateCommand(): Command {
  return new Command('integrate')
    .description('Coordinate integration between multiple agent worktrees')
    .argument('<agents...>', 'Agent names to integrate')
    .option('--branch <name>', 'Integration branch name (auto-generated if not provided)')
    .option('--strategy <strategy>', 'Integration strategy', 'parallel')
    .action(async (agents, options) => {
      try {
        console.log(chalk.blue(`🔀 Coordinating integration for ${agents.length} agents...`));
        console.log(chalk.gray('Agents:'), agents.join(', '));

        const integrationBranch = await worktreeManager.coordinateIntegration(agents);

        console.log(chalk.green('✅ Integration coordination complete!'));
        console.log(chalk.gray('🌿 Integration branch:'), chalk.white(integrationBranch));

        console.log(chalk.yellow('\n📋 Next steps:'));
        console.log(`   git checkout ${integrationBranch}`);
        console.log(`   # Review integrated changes`);
        console.log(`   # Create merge request to v0.1.9-dev`);
      } catch (error) {
        console.error(chalk.red('❌ Failed to coordinate integration:'), (error as Error).message);
        process.exit(1);
      }
    });
}

function cleanupCommand(): Command {
  return new Command('cleanup')
    .description('Clean up completed agent worktrees')
    .argument('<agent>', 'Agent name')
    .option('--keep-branch', 'Keep the feature branch after cleanup')
    .option('--force', 'Force cleanup even if work is not merged')
    .action(async (agent, options) => {
      try {
        console.log(chalk.yellow(`🧹 Cleaning up worktree for ${agent}...`));

        await worktreeManager.cleanupWorktree(agent);

        console.log(chalk.green(`✅ Worktree cleaned up successfully!`));
        if (options.keepBranch) {
          console.log(chalk.gray('🌿 Feature branch preserved for future reference'));
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to cleanup worktree:'), (error as Error).message);
        process.exit(1);
      }
    });
}

function flowCommand(): Command {
  const flowCmd = new Command('flow');
  flowCmd.description('Manage agentic development flows');

  flowCmd
    .command('status')
    .description('Show current flow status for agents')
    .option('--agent <name>', 'Show status for specific agent')
    .action((options) => {
      displayFlowStatus(options.agent);
    });

  flowCmd
    .command('adapt')
    .description('Adapt flow based on current metrics')
    .requiredOption('--flow <current>', 'Current flow type')
    .option('--completion-rate <rate>', 'Completion rate (0-1)', '0.8')
    .option('--error-rate <rate>', 'Error rate (0-1)', '0.05')
    .option('--conflict-rate <rate>', 'Conflict rate (0-1)', '0.03')
    .action((options) => {
      const metrics = {
        completionRate: parseFloat(options.completionRate),
        errorRate: parseFloat(options.errorRate),
        conflictRate: parseFloat(options.conflictRate),
        agentUtilization: 0.7,
        timeToCompletion: 24
      };

      const constraints = {
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      };

      const recommendation = branchingStrategy.adaptFlow({
        flow: options.flow,
        metrics,
        constraints
      });

      console.log(chalk.blue('🧠 Flow Adaptation Analysis'));
      console.log(chalk.gray('Current flow:'), chalk.white(options.flow));
      console.log(chalk.gray('Recommended:'), chalk.white(recommendation.recommendedFlow));
      console.log(chalk.gray('Reason:'), chalk.yellow(recommendation.reason));

      if (recommendation.suggestedActions.length > 0) {
        console.log(chalk.gray('\n📋 Suggested actions:'));
        recommendation.suggestedActions.forEach((action: string) => {
          console.log(chalk.gray('  •'), chalk.white(action));
        });
      }
    });

  return flowCmd;
}

function branchCommand(): Command {
  const branchCmd = new Command('branch');
  branchCmd.description('Intelligent branch naming and management');

  branchCmd
    .command('suggest')
    .description('Get branch naming suggestions for an agent')
    .requiredOption('-a, --agent <name>', 'Agent name')
    .requiredOption('-s, --specialization <spec>', 'Agent specialization')
    .option('--phase <phase>', 'Development phase', '1')
    .option('--priority <priority>', 'Priority level', 'medium')
    .action((options) => {
      const recommendations = branchingStrategy.getBranchNamingRecommendations(
        options.agent,
        options.specialization,
        parseInt(options.phase),
        options.priority
      );

      console.log(chalk.blue('🌿 Branch Naming Recommendations'));
      console.log(chalk.gray('Primary:'), chalk.green(recommendations.primary));
      console.log(chalk.gray('Reasoning:'), chalk.yellow(recommendations.reasoning));

      if (recommendations.alternatives.length > 0) {
        console.log(chalk.gray('\n🔄 Alternatives:'));
        recommendations.alternatives.forEach((alt: any, index: number) => {
          console.log(chalk.gray(`  ${index + 1}.`), chalk.white(alt));
        });
      }
    });

  return branchCmd;
}

function statusCommand(): Command {
  return new Command('status')
    .description('Show comprehensive status for an agent worktree')
    .argument('<agent>', 'Agent name')
    .action(async (agent) => {
      try {
        const config = worktreeManager.loadWorktreeConfig(agent);
        if (!config) {
          console.log(chalk.red(`❌ No worktree found for agent: ${agent}`));
          return;
        }

        const branchAwareness = worktreeManager.getBranchAwareness(agent);
        const versionAwareness = worktreeManager.getProjectVersionAwareness();

        console.log(chalk.blue(`📊 Agent Worktree Status: ${agent}`));
        console.log('');

        console.log(chalk.cyan('🔧 Configuration:'));
        console.log(`   Agent: ${chalk.white(config.agentName)}`);
        console.log(`   Phase: ${chalk.white(config.phase)}`);
        console.log(`   Priority: ${chalk.white(config.priority)}`);
        console.log(`   Path: ${chalk.gray(config.workingDirectory)}`);
        console.log('');

        if (branchAwareness) {
          console.log(chalk.cyan('🌿 Branch Information:'));
          console.log(`   Current: ${chalk.white(branchAwareness.currentBranch)}`);
          console.log(`   Base: ${chalk.gray(branchAwareness.baseBranch)}`);
          console.log(`   Type: ${chalk.white(branchAwareness.branchType)}`);
          console.log(`   Merge Target: ${chalk.white(branchAwareness.mergeTarget)}`);
          console.log(`   Auto-merge: ${branchAwareness.canAutoMerge ? chalk.green('Yes') : chalk.red('No')}`);
          console.log(
            `   Review Required: ${branchAwareness.requiresReview ? chalk.yellow('Yes') : chalk.green('No')}`
          );
          console.log('');
        }

        if (versionAwareness) {
          console.log(chalk.cyan('🎯 Version Awareness:'));
          console.log(`   Current: ${chalk.white(versionAwareness.currentVersion)}`);
          console.log(`   Target: ${chalk.white(versionAwareness.targetVersion)}`);
          console.log(`   Phase: ${chalk.white(versionAwareness.developmentPhase)}`);
          console.log(`   Compatibility: ${chalk.white(versionAwareness.compatibilityLevel)}`);
          console.log('');
        }

        console.log(chalk.cyan('🚀 Available Commands:'));
        console.log(`   ossa worktree sync ${agent}     # Sync with remote`);
        console.log(`   ossa worktree integrate ${agent} # Coordinate integration`);
        console.log(`   ossa worktree cleanup ${agent}   # Clean up when done`);
      } catch (error) {
        console.error(chalk.red('❌ Failed to get status:'), (error as Error).message);
      }
    });
}

// Utility functions
function isValidAgentName(name: string): boolean {
  // OSSA naming convention: [scope-]domain-role[-framework]
  const pattern = /^([a-z0-9]+-)?(([a-z0-9]+)-([a-z0-9]+))(-[a-z0-9]+)?$/;
  return pattern.test(name);
}

function findGitRepository(): string | null {
  let currentDir = process.cwd();

  while (currentDir !== '/') {
    if (existsSync(resolve(currentDir, '.git'))) {
      return currentDir;
    }
    currentDir = resolve(currentDir, '..');
  }

  return null;
}
