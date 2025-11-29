import { Octokit } from '@octokit/rest';
import { GitHubPR, GitHubPRSchema } from './schemas.js';

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async getPR(number: number): Promise<GitHubPR> {
    const { data } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: number,
    });
    return GitHubPRSchema.parse(data);
  }

  async listPRs(filters?: { author?: string; state?: 'open' | 'closed' }): Promise<GitHubPR[]> {
    const { data } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: filters?.state || 'open',
    });
    
    let prs = data.map(pr => GitHubPRSchema.parse(pr));
    
    if (filters?.author) {
      prs = prs.filter(pr => pr.author.login === filters.author);
    }
    
    return prs;
  }

  async createComment(prNumber: number, body: string): Promise<void> {
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
      body,
    });
  }
}
