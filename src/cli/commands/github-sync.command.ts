import { Command } from 'commander';
import { GitHubSyncService } from '../../services/github-sync/sync.service';

export function createGitHubSyncCommand(): Command {
  const cmd = new Command('github-sync');
  cmd.description('Sync GitHub PRs to GitLab');

  cmd
    .command('pr <number>')
    .description('Sync a single GitHub PR to GitLab')
    .action(async (number: string) => {
      const service = createService();
      const mr = await service.syncPR(parseInt(number));
      console.log(`[PASS] Created GitLab MR: ${mr.web_url}`);
    });

  cmd
    .command('batch')
    .description('Batch sync PRs (e.g., Dependabot)')
    .option('--author <author>', 'Filter by author', 'app/dependabot')
    .action(async (options) => {
      const service = createService();
      const mr = await service.batchSyncPRs({ author: options.author });
      console.log(`[PASS] Created batch MR: ${mr.web_url}`);
    });

  cmd
    .command('list')
    .description('List syncable PRs')
    .option('--author <author>', 'Filter by author')
    .action(async (options) => {
      const service = createService();
      const prs = await service.listSyncablePRs({ author: options.author });
      console.log(`Found ${prs.length} PRs:`);
      prs.forEach((pr) => {
        console.log(`  #${pr.number}: ${pr.title} (by ${pr.author.login})`);
      });
    });

  return cmd;
}

function createService(): GitHubSyncService {
  const config = {
    github: {
      owner: process.env.GITHUB_OWNER || 'blueflyio',
      repo: process.env.GITHUB_REPO || 'openstandardagents',
      token: process.env.GITHUB_TOKEN || '',
    },
    gitlab: {
      projectId: process.env.GITLAB_PROJECT_ID || 'blueflyio%2Fopenstandardagents',
      token: process.env.GITLAB_TOKEN || '',
    },
  };

  return new GitHubSyncService(config);
}
