/**
 * OSSA GitLab Agent Command
 * Manage GitLab Kubernetes agents via CLI
 * Follows OpenAPI-first, DRY, CRUD principles
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { GitLabAgentService } from '../../services/gitlab-agent.service.js';
import type { GitLabAgentConfig } from '../../services/gitlab-agent.service.js';

export const gitlabAgentCommand = new Command('gitlab-agent')
  .alias('agent')
  .description('Manage GitLab Kubernetes agents (register, list, delete)')
  .option(
    '--gitlab-url <url>',
    'GitLab instance URL (or set GITLAB_URL env var)'
  )
  .option(
    '--project <path>',
    'GitLab project path (e.g., group/project) (or set CI_PROJECT_PATH env var)'
  )
  .option(
    '--token <token>',
    'GitLab personal access token (or set GITLAB_TOKEN env var)'
  )
  .option('--name <name>', 'Agent name', 'ossa-agent');

// Register subcommand
gitlabAgentCommand
  .command('register')
  .description('Register a GitLab Kubernetes agent and create access token')
  .option('--name <name>', 'Agent name', 'ossa-agent')
  .action(async (options, command) => {
    try {
      const parentOptions = command.parent?.opts() || {};
      const token = parentOptions.token || options.token || process.env.GITLAB_TOKEN;
      if (!token) {
        console.error(chalk.red('Error: GitLab token required'));
        console.error('Set GITLAB_TOKEN environment variable or use --token');
        process.exit(1);
      }

      const gitlabUrl = parentOptions.gitlabUrl || process.env.GITLAB_URL;
      const projectPath = parentOptions.project || process.env.CI_PROJECT_PATH;
      
      if (!gitlabUrl) {
        console.error(chalk.red('Error: GitLab URL required'));
        console.error('Set GITLAB_URL environment variable or use --gitlab-url');
        process.exit(1);
      }
      
      if (!projectPath) {
        console.error(chalk.red('Error: Project path required'));
        console.error('Set CI_PROJECT_PATH environment variable or use --project');
        process.exit(1);
      }

      const config: GitLabAgentConfig = {
        name: options.name || parentOptions.name || 'ossa-agent',
        projectPath,
        gitlabUrl,
        token,
      };

      const service = new GitLabAgentService(config);

      console.log(chalk.blue('Registering GitLab Kubernetes Agent...'));
      console.log(`Project: ${config.projectPath}`);
      console.log(`Agent Name: ${config.name}`);
      console.log('');

      const result = await service.registerAgentWithToken(config.name);

      console.log(chalk.green('✓ Agent registered successfully!'));
      console.log('');
      console.log(chalk.bold('Agent Information:'));
      console.log(`  Agent ID: ${result.agentId}`);
      console.log(`  Agent Name: ${result.agentName}`);
      console.log(`  Token ID: ${result.tokenId}`);
      console.log(`  Project ID: ${result.projectId}`);
      console.log('');
      console.log(chalk.yellow('IMPORTANT: Save this token securely!'));
      console.log(`  Token: ${result.token}`);
      console.log('');
      console.log(chalk.blue('Next Steps:'));
      console.log('1. Set the token as environment variable:');
      console.log(`   export GITLAB_AGENT_TOKEN="${result.token}"`);
      console.log('');
      console.log('2. Install the agent using Helm:');
      console.log(`   helm upgrade --install ${config.name} gitlab/gitlab-agent \\`);
      console.log(`     --namespace gitlab-agent \\`);
      console.log(`     --create-namespace \\`);
      console.log(`     --set config.token='${result.token}' \\`);
      console.log(`     --set config.kasAddress='wss://${config.gitlabUrl.replace(/^https?:\/\//, '')}/-/kubernetes-agent/'`);
      console.log('');

      // Export token for use in scripts
      process.env.GITLAB_AGENT_TOKEN = result.token;
      process.env.GITLAB_AGENT_ID = result.agentId.toString();
    } catch (error) {
      console.error(chalk.red('Error registering agent:'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as { response?: { data?: unknown } };
          if (axiosError.response?.data) {
            console.error(chalk.red(JSON.stringify(axiosError.response.data, null, 2)));
          }
        }
      }
      process.exit(1);
    }
  });

// List subcommand
gitlabAgentCommand
  .command('list')
  .description('List all GitLab Kubernetes agents for the project')
  .action(async (options, command) => {
    try {
      const parentOptions = command.parent?.opts() || {};
      const token = parentOptions.token || process.env.GITLAB_TOKEN;
      if (!token) {
        console.error(chalk.red('Error: GitLab token required'));
        process.exit(1);
      }

      const gitlabUrl = parentOptions.gitlabUrl || process.env.GITLAB_URL;
      const projectPath = parentOptions.project || process.env.CI_PROJECT_PATH;
      
      if (!gitlabUrl) {
        console.error(chalk.red('Error: GitLab URL required'));
        console.error('Set GITLAB_URL environment variable or use --gitlab-url');
        process.exit(1);
      }
      
      if (!projectPath) {
        console.error(chalk.red('Error: Project path required'));
        console.error('Set CI_PROJECT_PATH environment variable or use --project');
        process.exit(1);
      }

      const config: GitLabAgentConfig = {
        name: options.name || parentOptions.name || 'ossa-agent',
        projectPath,
        gitlabUrl,
        token,
      };

      const service = new GitLabAgentService(config);
      const agents = await service.listAgents();

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found for this project'));
        return;
      }

      console.log(chalk.blue(`Found ${agents.length} agent(s):`));
      console.log('');
      agents.forEach((agent) => {
        console.log(`  ${chalk.green(agent.name)} (ID: ${agent.id})`);
        console.log(`    Created: ${new Date(agent.createdAt).toLocaleString()}`);
        console.log('');
      });
    } catch (error) {
      console.error(chalk.red('Error listing agents:'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  });

// Delete subcommand
gitlabAgentCommand
  .command('delete')
  .description('Delete a GitLab Kubernetes agent')
  .option('--id <id>', 'Agent ID (if not using name)')
  .action(async (options, command) => {
    try {
      const parentOptions = command.parent?.opts() || {};
      const token = parentOptions.token || process.env.GITLAB_TOKEN;
      if (!token) {
        console.error(chalk.red('Error: GitLab token required'));
        process.exit(1);
      }

      const gitlabUrl = parentOptions.gitlabUrl || process.env.GITLAB_URL;
      const projectPath = parentOptions.project || process.env.CI_PROJECT_PATH;

      if (!gitlabUrl) {
        console.error(chalk.red('Error: GitLab URL required'));
        console.error('Set GITLAB_URL environment variable or use --gitlab-url');
        process.exit(1);
      }

      if (!projectPath) {
        console.error(chalk.red('Error: Project path required'));
        console.error('Set CI_PROJECT_PATH environment variable or use --project');
        process.exit(1);
      }

      const config: GitLabAgentConfig = {
        name: parentOptions.name || 'ossa-agent',
        projectPath,
        gitlabUrl,
        token,
      };

      const service = new GitLabAgentService(config);

      let agentId: number;
      if (options.id) {
        agentId = parseInt(options.id, 10);
      } else {
        const agent = await service.getAgent(config.name);
        if (!agent) {
          console.error(chalk.red(`Agent '${config.name}' not found`));
          process.exit(1);
        }
        agentId = agent.id;
      }

      await service.deleteAgent(agentId);
      console.log(chalk.green(`✓ Agent ${agentId} deleted successfully`));
    } catch (error) {
      console.error(chalk.red('Error deleting agent:'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  });

