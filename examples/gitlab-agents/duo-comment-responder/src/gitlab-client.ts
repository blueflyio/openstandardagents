import { Gitlab } from '@gitbeaker/rest';
import type { Logger } from 'pino';

export interface GitLabClientConfig {
  token: string;
  baseUrl?: string;
}

export class GitLabClient {
  private gitlab: InstanceType<typeof Gitlab>;

  constructor(config: GitLabClientConfig) {
    this.gitlab = new Gitlab({
      host: config.baseUrl || 'https://gitlab.com',
      token: config.token,
    });
  }

  /**
   * Get files changed in merge request
   */
  async getMRFiles(projectId: string, mrIid: number) {
    return await this.gitlab.MergeRequests.changes(projectId, mrIid);
  }

  /**
   * Get diff for merge request
   */
  async getMRDiff(projectId: string, mrIid: number) {
    return await this.gitlab.MergeRequests.diffs(projectId, mrIid);
  }

  /**
   * Get file content from repository
   */
  async getFileContent(projectId: string, filePath: string, ref: string) {
    const file = await this.gitlab.RepositoryFiles.show(projectId, filePath, ref);
    return Buffer.from(file.content, 'base64').toString('utf-8');
  }

  /**
   * Post comment to merge request
   */
  async postMRComment(projectId: string, mrIid: number, body: string, replyToId?: number) {
    return await this.gitlab.MergeRequestNotes.create(projectId, mrIid, body, {
      ...(replyToId && { reply_to: replyToId }),
    });
  }

  /**
   * Create commit with changes
   */
  async createCommit(projectId: string, branch: string, message: string, actions: any[]) {
    return await this.gitlab.Commits.create(projectId, branch, message, actions);
  }
}
