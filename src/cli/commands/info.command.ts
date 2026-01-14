import chalk from 'chalk';
import { Command } from 'commander';
import axios from 'axios';

export const infoCommand = new Command('info')
  .argument('<agent>', 'Agent identifier')
  .description('View detailed information about an agent')
  .action(async (agent: string) => {
    try {
      const token =
        process.env.GITLAB_TOKEN || process.env.GITLAB_PRIVATE_TOKEN;
      const projectId = process.env.GITLAB_PROJECT_ID || '76265294';
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
      if (!token) {
        console.error(chalk.red('✗ GITLAB_TOKEN required'));
        process.exit(1);
      }
      const parts = agent.split('@');
      const agentName =
        parts.length > 1 ? parts.slice(0, -1).join('@') : parts[0];
      const version = parts.length > 1 ? parts[parts.length - 1] : 'latest';
      console.log(
        chalk.blue(`\nFetching info for ${agentName}@${version}...\n`)
      );
      const tagName =
        version === 'latest' ? agentName : `${agentName}-v${version}`;
      const response = await axios.get(
        `${gitlabUrl}/api/v4/projects/${projectId}/releases/${encodeURIComponent(tagName)}`,
        {
          headers: { 'PRIVATE-TOKEN': token },
        }
      );
      const release = response.data;
      console.log(chalk.cyan.bold('Agent Information\n'));
      console.log(chalk.white(`  Name:        ${agentName}`));
      console.log(chalk.white(`  Version:     ${version}`));
      console.log(chalk.white(`  Tag:         ${release.tag_name}`));
      console.log(
        chalk.white(
          `  Published:   ${new Date(release.created_at).toLocaleString()}`
        )
      );
      if (release.description) {
        console.log(
          chalk.white(
            `\n  Description:\n    ${release.description.replace(/\n/g, '\n    ')}`
          )
        );
      }
      console.log('');
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error(chalk.red(`✗ Agent ${agent} not found`));
      } else {
        console.error(
          chalk.red('✗ Failed:'),
          error instanceof Error ? error.message : String(error)
        );
      }
      process.exit(1);
    }
  });
