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


}
