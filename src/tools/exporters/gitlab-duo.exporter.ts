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
   * Export OSSA manifest to GitLab Duo format
   */
  export(options: GitLabDuoExportOptions): GitLabDuoExportResult {
    const { manifest, projectId } = options;

    // Convert OSSA manifest to GitLab Duo format
    const gitlabFormat = this.convertToGitLabFormat(manifest);

    // TODO: Implement actual GitLab Duo API integration
    // For now, return the converted format

    return {
      success: true,
      skillId: `gitlab-duo-${manifest.metadata.name}`,
      projectId: projectId || 'default',
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
      tools: manifest.skills?.map(skill => ({
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
          required: skill.parameters?.filter(p => p.required).map(p => p.name) || [],
        },
        examples: skill.examples?.map(ex => ({
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
    return !!(
      data.name &&
      data.description &&
      data.version &&
      data.agent
    );
  }
}
