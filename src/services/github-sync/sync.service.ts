import { GitHubClient } from './github-client.js';
import { GitLabClient } from './gitlab-client.js';
import { SyncConfig, SyncConfigSchema, GitHubPR, GitLabMR } from './schemas.js';

export class GitHubSyncService {
  private github: GitHubClient;
  private gitlab: GitLabClient;

  constructor(config: SyncConfig) {
    const validated = SyncConfigSchema.parse(config);

    this.github = new GitHubClient(
      validated.github.token,
      validated.github.owner,
      validated.github.repo
    );

    this.gitlab = new GitLabClient(validated.gitlab.token, validated.gitlab.projectId);
  }

  /**
   * Sync a GitHub PR to GitLab MR
   */
  async syncPR(prNumber: number): Promise<GitLabMR> {
    const pr = await this.github.getPR(prNumber);

    const branchName = `github-pr-${prNumber}`;

    const mr = await this.gitlab.createMR({
      title: `GitHub PR #${prNumber}: ${pr.title}`,
      description: this.buildMRDescription(pr),
      sourceBranch: branchName,
      targetBranch: 'main',
      labels: ['github-pr'],
    });

    await this.github.createComment(prNumber, this.buildPRComment(mr));

    return mr;
  }

  /**
   * Batch sync multiple PRs (e.g., Dependabot)
   */
  async batchSyncPRs(filters: { author?: string }): Promise<GitLabMR> {
    const prs = await this.github.listPRs(filters);

    if (prs.length === 0) {
      throw new Error('No PRs found matching filters');
    }

    const branchName = `batch-${filters.author || 'prs'}-${Date.now()}`;

    const mr = await this.gitlab.createMR({
      title: `Batch: ${prs.length} PRs from ${filters.author || 'GitHub'}`,
      description: this.buildBatchMRDescription(prs),
      sourceBranch: branchName,
      targetBranch: 'main',
      labels: ['batch-sync', filters.author || 'github'].filter(Boolean),
    });

    // Comment on all PRs
    await Promise.all(
      prs.map((pr) => this.github.createComment(pr.number, this.buildBatchPRComment(mr)))
    );

    return mr;
  }

  /**
   * List PRs ready for sync
   */
  async listSyncablePRs(filters?: { author?: string }): Promise<GitHubPR[]> {
    return this.github.listPRs(filters);
  }

  private buildMRDescription(pr: GitHubPR): string {
    return `**From GitHub PR**: https://github.com/${this.github['owner']}/${this.github['repo']}/pull/${pr.number}
**Author**: @${pr.author.login}

${pr.body || ''}

---

*This MR was created from a GitHub pull request. Once merged, changes will sync back to GitHub.*`;
  }

  private buildBatchMRDescription(prs: GitHubPR[]): string {
    const prList = prs
      .map((pr) => `- #${pr.number}: ${pr.title} (by @${pr.author.login})`)
      .join('\n');

    return `Batched ${prs.length} pull requests from GitHub:

${prList}

---

*These PRs will auto-close when this MR merges and syncs back to GitHub.*`;
  }

  private buildPRComment(mr: GitLabMR): string {
    return `✅ **Synced to GitLab**

This PR has been synced to our internal GitLab for review and testing.

**GitLab MR**: ${mr.web_url}

Once merged on GitLab, changes will automatically sync back here and this PR will close.

---
*Development happens at [gitlab.com](${mr.web_url})*`;
  }

  private buildBatchPRComment(mr: GitLabMR): string {
    return `🤖 **Batched for Review**

This PR has been batched with other updates for testing on GitLab.

**GitLab MR**: ${mr.web_url}

Once merged, this PR will automatically close.

---
*Development happens at [gitlab.com](${mr.web_url})*`;
  }
}
