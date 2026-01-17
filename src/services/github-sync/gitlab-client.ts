import { GitLabMR, GitLabMRSchema } from './schemas.js';

export class GitLabClient {
  private baseUrl = 'https://gitlab.com/api/v4';
  private token: string;
  private projectId: string;

  constructor(token: string, projectId: string) {
    this.token = token;
    this.projectId = projectId;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'PRIVATE-TOKEN': this.token,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async createMR(params: {
    title: string;
    description: string;
    sourceBranch: string;
    targetBranch: string;
    labels?: string[];
  }): Promise<GitLabMR> {
    const data = await this.request<unknown>(
      `/projects/${this.projectId}/merge_requests`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          source_branch: params.sourceBranch,
          target_branch: params.targetBranch,
          labels: params.labels?.join(','),
        }),
      }
    );

    return GitLabMRSchema.parse(data);
  }

  async getMR(iid: number): Promise<GitLabMR> {
    const data = await this.request<unknown>(
      `/projects/${this.projectId}/merge_requests/${iid}`
    );
    return GitLabMRSchema.parse(data);
  }
}
