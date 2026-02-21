import { OSSAManifest } from '../validators/manifest.validator';

export interface GitLabDuoExportOptions {
  manifest: OSSAManifest;
  projectId?: string;
}

export interface GitLabDuoExportResult {
  success: boolean;
  skillId?: string;
  projectId?: string;
}

/**
 * Exporter for GitLab Duo format
 */
export class GitLabDuoExporter {
  /**
   * Export OSSA manifest to GitLab Duo format.
   * When projectId and GITLAB_TOKEN are set, pushes to GitLab Duo API.
   */
  async export(options: GitLabDuoExportOptions): Promise<GitLabDuoExportResult> {
    const { manifest, projectId } = options;

    const gitlabFormat = this.convertToGitLabFormat(manifest);
    const skillId = `gitlab-duo-${manifest.metadata.name}`;
    const resolvedProjectId = projectId || 'default';

    if (projectId && process.env.GITLAB_TOKEN) {
      try {
        const res = await fetch(
          `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/duo/skills`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'PRIVATE-TOKEN': process.env.GITLAB_TOKEN,
            },
            body: JSON.stringify(gitlabFormat),
          }
        );
        if (!res.ok) {
          console.warn('GitLab Duo API push failed:', res.status, await res.text());
        }
      } catch (e) {
        console.warn('GitLab Duo API push failed:', e);
      }
    }

    return {
      success: true,
      skillId,
      projectId: resolvedProjectId,
    };
  }

  private convertToGitLabFormat(manifest: OSSAManifest): any {
    // GitLab Duo format
    return {
      name: manifest.metadata.name,
      description: manifest.metadata.description,
      version: manifest.metadata.version,
      metadata: {
        author: manifest.metadata.author,
        license: manifest.metadata.license,
        tags: manifest.metadata.tags,
      },
      agent: {
        type: manifest.agent.type,
        capabilities: manifest.agent.capabilities,
        model: manifest.agent.model,
        temperature: manifest.agent.temperature,
        max_tokens: manifest.agent.max_tokens,
      },
      tools: manifest.skills?.map((skill) => ({
        name: skill.name,
        description: skill.description,
        trigger: {
          type: skill.trigger.type,
          command: skill.trigger.value,
          pattern: skill.trigger.pattern,
        },
        input_schema: {
          type: 'object',
          properties: skill.parameters?.reduce((acc, param) => {
            acc[param.name] = {
              type: param.type,
              description: param.description,
            };
            return acc;
          }, {} as any),
          required:
            skill.parameters?.filter((p) => p.required).map((p) => p.name) ||
            [],
        },
        examples: skill.examples?.map((ex) => ({
          input: ex.input,
          output: ex.output,
        })),
      })),
      integrations: {
        mcp: manifest.integrations?.mcp,
        apis: manifest.integrations?.apis,
      },
    };
  }

  /**
   * Validate GitLab Duo export format
   */
  validate(data: any): boolean {
    return !!(data.name && data.description && data.version && data.agent);
  }
}
