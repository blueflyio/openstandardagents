/**
 * GitLab Adapter Types
 */

export interface GitLabJobConfig {
  image?: string;
  stage?: string;
  script: string[];
  variables?: Record<string, string>;
  artifacts?: {
    paths?: string[];
    expire_in?: string;
  };
  rules?: Array<{
    if?: string;
    when?: string;
  }>;
}

export interface GitLabPipelineConfig {
  stages: string[];
  jobs: Record<string, GitLabJobConfig>;
}
