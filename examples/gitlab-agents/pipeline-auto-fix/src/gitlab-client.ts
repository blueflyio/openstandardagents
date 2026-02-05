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
   * Get jobs for pipeline
   */
  async getPipelineJobs(projectId: string, pipelineId: number) {
    return await this.gitlab.Jobs.showPipelineJobs(projectId, pipelineId);
  }

  /**
   * Get job log output
   */
  async getJobLog(projectId: string, jobId: number) {
    return await this.gitlab.Jobs.showLog(projectId, jobId);
  }

  /**
   * Get file content from repository
   */
  async getFileContent(projectId: string, filePath: string, ref: string) {
    const file = await this.gitlab.RepositoryFiles.show(projectId, filePath, ref);
    return Buffer.from(file.content, 'base64').toString('utf-8');
  }

  /**
   * Create new branch
   */
  async createBranch(projectId: string, branch: string, ref: string) {
    return await this.gitlab.Branches.create(projectId, branch, ref);
  }

  /**
   * Create commit with changes
   */
  async createCommit(projectId: string, branch: string, message: string, actions: any[]) {
    return await this.gitlab.Commits.create(projectId, branch, message, actions);
  }

  /**
   * Create merge request
   */
  async createMR(
    projectId: string,
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string
  ) {
    return await this.gitlab.MergeRequests.create(projectId, sourceBranch, targetBranch, title, {
      description,
    });
  }

  /**
   * Post comment explaining the fix
   */
  async postComment(projectId: any, mrIid: any, body: any) {
    // TODO: Implement postComment
    throw new Error('Not implemented: postComment');
  }
}
