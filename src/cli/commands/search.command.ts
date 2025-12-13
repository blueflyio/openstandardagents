import chalk from 'chalk';
import { Command } from 'commander';
import axios from 'axios';

export const searchCommand = new Command('search')
  .argument('<query>', 'Search query')
  .option('--limit <number>', 'Max results', '20')
  .description('Search for agents in the OSSA registry')
  .action(async (query: string, options: { limit?: string }) => {
    try {
      const token = process.env.GITLAB_TOKEN || process.env.GITLAB_PRIVATE_TOKEN;
      const projectId = process.env.GITLAB_PROJECT_ID || '76265294';
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
      if (!token) {
        console.error(chalk.red('✗ GITLAB_TOKEN required'));
        process.exit(1);
      }
      console.log(chalk.blue(`Searching: "${query}"`));
      const response = await axios.get(`${gitlabUrl}/api/v4/projects/${projectId}/releases`, {
        headers: { 'PRIVATE-TOKEN': token },
        params: { per_page: parseInt(options.limit || '20', 10) },
      });
      const releases = response.data;
      const matches = releases.filter((r: any) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.description?.toLowerCase().includes(query.toLowerCase()) ||
        r.tag_name.toLowerCase().includes(query.toLowerCase())
      );
      if (matches.length === 0) {
        console.log(chalk.yellow(`No agents found matching "${query}"`));
        return;
      }
      console.log(chalk.green(`\nFound ${matches.length} agent(s):\n`));
      matches.forEach((release: any) => {
        const parts = release.tag_name.split('-v');
        const agentName = parts[0];
        const version = parts[1] || 'latest';
        console.log(chalk.cyan(`  ${agentName}@${version}`));
        console.log(chalk.gray(`    ${release.description?.substring(0, 100) || ''}...`));
        console.log(chalk.gray(`    Published: ${new Date(release.created_at).toLocaleDateString()}\n`));
      });
    } catch (error) {
      console.error(chalk.red('✗ Search failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
