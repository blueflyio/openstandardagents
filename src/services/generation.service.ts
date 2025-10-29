/**
 * Generation Service
 * Generates OSSA agent manifests from templates
 */

import { injectable } from 'inversify';
import type { AgentTemplate } from '../types/index.js';

@injectable()
export class GenerationService {
  /**
   * Generate OSSA agent manifest from template
   * @param template - Agent configuration template
   * @returns Complete OSSA agent manifest
   */
  async generate(template: AgentTemplate): Promise<any> {
    const tools = this.generateTools(template);

    const manifest: any = {
      apiVersion: 'ossa/v1',
      kind: 'Agent',
      metadata: {
        name: this.normalizeId(template.id),
        version: '0.1.0',
        description: template.description || `${template.name} agent`,
        labels: {},
        annotations: {},
      },
      spec: {
        role: template.role,
        llm: this.generateLLMConfig(template.role),
        tools: template.capabilities || tools,
      },
    };

    return manifest;
  }

  /**
   * Normalize agent ID to DNS-1123 format
   * @param id - Raw ID string
   * @returns DNS-1123 compliant ID
   */
  private normalizeId(id: string): string {
    return id
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')
      .substring(0, 63);
  }

  /**
   * Generate default tools based on role
   * @param template - Agent template
   * @returns Array of tools
   */
  private generateTools(template: AgentTemplate): any[] {
    const baseTool: any = {
      type: 'mcp',
      name: `${template.role}_operation`,
      server: this.normalizeId(template.id),
      capabilities: [],
    };

    const roleTools: Record<string, any[]> = {
      chat: [
        {
          type: 'mcp',
          name: 'send_message',
          server: this.normalizeId(template.id),
          capabilities: [],
        },
      ],
      workflow: [
        {
          type: 'mcp',
          name: 'execute_workflow',
          server: this.normalizeId(template.id),
          capabilities: [],
        },
      ],
      compliance: [
        {
          type: 'mcp',
          name: 'validate_compliance',
          server: this.normalizeId(template.id),
          capabilities: [],
        },
      ],
    };

    return roleTools[template.role] || [baseTool];
  }

  /**
   * Generate LLM configuration based on role
   * @param role - Agent role
   * @returns LLM configuration
   */
  private generateLLMConfig(role: string): Record<string, any> {
    const configs: Record<string, any> = {
      chat: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      },
      compliance: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 4000,
      },
      workflow: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 3000,
      },
      audit: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.1,
        maxTokens: 4000,
      },
    };

    return (
      configs[role] || {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 2000,
      }
    );
  }

  /**
   * Generate multiple agents from templates
   * @param templates - Array of templates
   * @returns Array of generated manifests
   */
  async generateMany(templates: AgentTemplate[]): Promise<any[]> {
    return Promise.all(templates.map((t) => this.generate(t)));
  }
}
