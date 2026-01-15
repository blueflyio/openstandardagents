import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';

export const installCommand = new Command('install')
  .argument('<agent>', 'Agent identifier (e.g., @ossa/code-reviewer@1.0.0)')
  .option('--output <dir>', 'Output directory', './agents')
  .description('Install an agent from the OSSA registry')
  .action(async (agent: string, options: { output?: string }) => {
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
      console.log(chalk.blue(`Installing ${agentName}@${version}...`));
      const tagName =
        version === 'latest' ? agentName : `${agentName}-v${version}`;
      const response = await axios.get(
        `${gitlabUrl}/api/v4/projects/${projectId}/releases/${encodeURIComponent(tagName)}`,
        {
          headers: { 'PRIVATE-TOKEN': token },
        }
      );
      // Response data contains release info but not used in this flow
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _release = response.data;
      const outputDir = options.output || './agents';
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(
        outputDir,
        `${agentName.replace('@ossa/', '')}.yaml`
      );
      console.log(chalk.green(`✓ Installed to ${outputPath}`));
      console.log(chalk.gray(`  Run: ossa run ${outputPath}`));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error(chalk.red(`✗ Agent ${agent} not found`));
      } else {
        console.error(
          chalk.red('✗ Installation failed:'),
          error instanceof Error ? error.message : String(error)
        );
      }
      process.exit(1);
    }
  });
