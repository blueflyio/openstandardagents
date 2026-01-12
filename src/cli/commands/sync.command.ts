import { Command } from 'commander';
import { GitHubSyncService } from '../../services/github-sync/sync.service.js';

export const syncCommand = new Command('sync').description('Sync GitHub PRs to GitLab');

syncCommand
  .command('pr <number>')
  .description('Sync a GitHub PR to GitLab MR')
  .action(async (number: string) => {
    const service = createService();
    const mr = await service.syncPR(parseInt(number));
    console.log(`[PASS] Created GitLab MR: ${mr.web_url}`);
  });

syncCommand
  .command('batch')
  .description('Batch sync PRs (e.g., Dependabot)')
  .option('--author <author>', 'Filter by author', 'app/dependabot')
  .action(async (options) => {
    const service = createService();
    const mr = await service.batchSyncPRs({ author: options.author });
    console.log(`[PASS] Created batch MR: ${mr.web_url}`);
  });

syncCommand
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

  if (!config.github.token || !config.gitlab.token) {
    console.error('[FAIL] Missing tokens. Set GITHUB_TOKEN and GITLAB_TOKEN environment variables.');
    process.exit(1);
  }

  return new GitHubSyncService(config);
}
