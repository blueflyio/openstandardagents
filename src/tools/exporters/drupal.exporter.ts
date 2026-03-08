import { OSSAManifest } from '../validators/manifest.validator';

export interface DrupalExportOptions {
  manifest: OSSAManifest;
  targetUrl?: string;
}

export interface DrupalExportResult {
  success: boolean;
  skillId?: string;
  url?: string;
}

/**
 * Exporter for Drupal Agent Skill format
 */
export class DrupalExporter {
  /**
   * Export OSSA manifest to Drupal Agent Skill format.
   * When targetUrl is set, POSTs the payload to that endpoint.
   */
  async export(options: DrupalExportOptions): Promise<DrupalExportResult> {
    const { manifest, targetUrl } = options;

    const drupalFormat = this.convertToDrupalFormat(manifest);
    const skillId = `drupal-${manifest.metadata.name}`;
    const url = targetUrl
      ? `${targetUrl}/agent-skills/${manifest.metadata.name}`
      : undefined;

    if (targetUrl) {
      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(drupalFormat),
        });
        if (!res.ok) {
          console.warn('Drupal API push failed:', res.status, await res.text());
        }
      } catch (e) {
        console.warn('Drupal API push failed:', e);
      }
    }

    return {
      success: true,
      skillId,
      url,
    };
  }

  private convertToDrupalFormat(manifest: OSSAManifest): any {
    // Drupal Agent Skill format
    return {
      title: manifest.metadata.name,
      description: manifest.metadata.description,
      version: manifest.metadata.version,
      agent_type: manifest.agent.type,
      capabilities: manifest.agent.capabilities,
      skills: manifest.skills?.map((skill) => ({
        name: skill.name,
        description: skill.description,
        trigger: {
          type: skill.trigger.type,
          value: skill.trigger.value || skill.trigger.pattern,
        },
        parameters: skill.parameters?.map((param) => ({
          name: param.name,
          type: param.type,
          description: param.description,
          required: param.required || false,
          default: param.default,
        })),
        examples: skill.examples?.map((ex) => ({
          input: ex.input,
          output: ex.output,
          description: ex.description,
        })),
      })),
      integrations: {
        mcp_servers: manifest.integrations?.mcp?.servers || [],
        apis: manifest.integrations?.apis?.map((api) => ({
          name: api.name,
          url: api.url,
          auth_type: api.auth || 'none',
        })),
      },
      metadata: {
        author: manifest.metadata.author,
        license: manifest.metadata.license,
        homepage: manifest.metadata.homepage,
        repository: manifest.metadata.repository,
        tags: manifest.metadata.tags,
      },
    };
  }

  /**
   * Validate Drupal export format
   */
  validate(data: any): boolean {
    return !!(
      data.title &&
      data.description &&
      data.version &&
      data.agent_type &&
      data.capabilities
    );
  }
}
