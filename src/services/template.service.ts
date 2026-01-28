/**
 * Template Service
 * Manages template library for OSSA agents
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { injectable } from 'inversify';
import type { OssaAgent } from '../types/index.js';

export interface TemplateMetadata {
  name: string;
  description: string;
  tags: string[];
  agentType: string;
  domain: string;
  useCases: string[];
  variables?: Record<
    string,
    {
      description: string;
      default?: string;
      required?: boolean;
    }
  >;
}

export interface Template {
  metadata: TemplateMetadata;
  manifest: OssaAgent;
  path: string;
}

let cachedTemplates: Template[] | null = null;

@injectable()
export class TemplateService {
  /**
   * Discover all templates
   */
  async discoverTemplates(): Promise<Template[]> {
    if (cachedTemplates) {
      return cachedTemplates;
    }

    const templates: Template[] = [];
    const templateDir = path.resolve(process.cwd(), 'templates/agent-types');

    if (!fs.existsSync(templateDir)) {
      return templates;
    }

    // Recursively find all template files
    const findTemplates = (dir: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          findTemplates(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
        ) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsed = yaml.parse(content) as OssaAgent;

            // Extract metadata from manifest or use defaults
            const metadata: TemplateMetadata = {
              name:
                parsed.metadata?.name ||
                path.basename(fullPath, path.extname(fullPath)),
              description: parsed.metadata?.description || '',
              tags: parsed.metadata?.labels
                ? Object.keys(parsed.metadata.labels)
                : [],
              agentType:
                ((parsed.spec as Record<string, unknown>)?.role as string) ||
                'worker',
              domain: ((parsed.spec as Record<string, unknown>)?.taxonomy as
                | Record<string, unknown>
                | undefined)
                ? ((
                    (parsed.spec as Record<string, unknown>).taxonomy as Record<
                      string,
                      unknown
                    >
                  ).domain as string) || 'agents'
                : 'agents',
              useCases: [],
            };

            templates.push({
              metadata,
              manifest: parsed,
              path: fullPath,
            });
          } catch (error) {
            console.warn(`Failed to load template ${fullPath}:`, error);
          }
        }
      }
    };

    findTemplates(templateDir);
    cachedTemplates = templates;
    return templates;
  }

  /**
   * Get template by name
   */
  async getTemplate(name: string): Promise<Template | null> {
    const templates = await this.discoverTemplates();
    return templates.find((t) => t.metadata.name === name) || null;
  }

  /**
   * Search templates
   */
  async searchTemplates(query: {
    agentType?: string;
    domain?: string;
    tags?: string[];
    keyword?: string;
  }): Promise<Template[]> {
    const templates = await this.discoverTemplates();

    return templates.filter((template) => {
      if (query.agentType && template.metadata.agentType !== query.agentType) {
        return false;
      }

      if (query.domain && template.metadata.domain !== query.domain) {
        return false;
      }

      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some((tag) =>
          template.metadata.tags.includes(tag)
        );
        if (!hasTag) {
          return false;
        }
      }

      if (query.keyword) {
        const keyword = query.keyword.toLowerCase();
        const matches =
          template.metadata.name.toLowerCase().includes(keyword) ||
          template.metadata.description.toLowerCase().includes(keyword) ||
          template.metadata.tags.some((tag) =>
            tag.toLowerCase().includes(keyword)
          );
        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Render template with variable substitution
   */
  async renderTemplate(
    template: Template,
    variables: Record<string, string> = {}
  ): Promise<OssaAgent> {
    let manifestStr = JSON.stringify(template.manifest);

    // Substitute variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      manifestStr = manifestStr.replace(new RegExp(placeholder, 'g'), value);
    }

    return JSON.parse(manifestStr) as OssaAgent;
  }

  /**
   * Validate template structure
   */
  async validateTemplate(
    templatePath: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!fs.existsSync(templatePath)) {
      errors.push(`Template file not found: ${templatePath}`);
      return { valid: false, errors };
    }

    try {
      const content = fs.readFileSync(templatePath, 'utf-8');
      const parsed = yaml.parse(content) as OssaAgent;

      if (!parsed.metadata?.name) {
        errors.push('Template must have metadata.name');
      }

      if (!parsed.spec?.role) {
        errors.push('Template must have spec.role');
      }
    } catch (error) {
      errors.push(
        `Failed to parse template: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
