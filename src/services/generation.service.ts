/**
 * Generation Service
 * Generates OSSA agent manifests from templates
 */

import { injectable } from 'inversify';
import type { AgentTemplate, OssaAgent, Capability } from '../types/index';

@injectable()
export class GenerationService {
  /**
   * Generate OSSA agent manifest from template
   * @param template - Agent configuration template
   * @returns Complete OSSA agent manifest
   */
  async generate(template: AgentTemplate): Promise<OssaAgent> {
    const capabilities = this.generateCapabilities(template);

    const manifest: OssaAgent = {
      ossaVersion: '1.0',
      agent: {
        id: this.normalizeId(template.id),
        name: template.name,
        version: '1.0.0',
        role: template.role,
        description: template.description || `${template.name} agent`,
        runtime: {
          type: template.runtimeType || 'docker',
          image: `${this.normalizeId(template.id)}:1.0.0`,
        },
        capabilities: template.capabilities || capabilities,
      },
    };

    // Add LLM configuration based on role
    manifest.agent.llm = this.generateLLMConfig(template.role);

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
   * Generate default capabilities based on role
   * @param template - Agent template
   * @returns Array of capabilities
   */
  private generateCapabilities(template: AgentTemplate): Capability[] {
    const baseCapability: Capability = {
      name: `${template.role}_operation`,
      description: `Primary ${template.role} operation`,
      input_schema: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Input data',
          },
        },
        required: ['input'],
      },
      output_schema: {
        type: 'object',
        properties: {
          output: {
            type: 'string',
            description: 'Output result',
          },
        },
        required: ['output'],
      },
    };

    // Role-specific capabilities
    const roleCapabilities: Record<string, Capability[]> = {
      chat: [
        {
          name: 'send_message',
          description: 'Send chat message and receive response',
          input_schema: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'User message' },
              context: { type: 'object', description: 'Conversation context' },
            },
            required: ['message'],
          },
          output_schema: {
            type: 'object',
            properties: {
              response: { type: 'string', description: 'Agent response' },
              metadata: { type: 'object', description: 'Response metadata' },
            },
            required: ['response'],
          },
        },
      ],
      workflow: [
        {
          name: 'execute_workflow',
          description: 'Execute workflow with given parameters',
          input_schema: {
            type: 'object',
            properties: {
              workflow_id: { type: 'string' },
              parameters: { type: 'object' },
            },
            required: ['workflow_id'],
          },
          output_schema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['success', 'failure', 'pending'],
              },
              result: { type: 'object' },
            },
            required: ['status'],
          },
        },
      ],
      compliance: [
        {
          name: 'validate_compliance',
          description: 'Validate compliance against frameworks',
          input_schema: {
            type: 'object',
            properties: {
              framework: { type: 'string', enum: ['SOC2', 'HIPAA', 'FedRAMP'] },
              target: { type: 'object' },
            },
            required: ['framework', 'target'],
          },
          output_schema: {
            type: 'object',
            properties: {
              compliant: { type: 'boolean' },
              violations: { type: 'array', items: { type: 'object' } },
            },
            required: ['compliant'],
          },
        },
      ],
    };

    return roleCapabilities[template.role] || [baseCapability];
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
  async generateMany(templates: AgentTemplate[]): Promise<OssaAgent[]> {
    return Promise.all(templates.map((t) => this.generate(t)));
  }
}
