/**
 * Generation Service
 * Generates OSSA agent manifests from templates
 */

import { injectable } from 'inversify';
import type { AgentTemplate, OssaAgent } from '../types/index.js';

type Platform = 'cursor' | 'openai' | 'anthropic' | 'langchain' | 'crewai' | 'autogen' | 'langflow' | 'langgraph' | 'llamaindex' | 'vercel-ai';

@injectable()
export class GenerationService {
  /**
   * Generate OSSA agent manifest from template
   * @param template - Agent configuration template
   * @returns Complete OSSA agent manifest
   */
  async generate(template: AgentTemplate): Promise<OssaAgent> {
    const tools = this.generateTools(template);

    const manifest: OssaAgent = {
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
  private generateTools(template: AgentTemplate): Array<Record<string, unknown>> {
    const baseTool: Record<string, unknown> = {
      type: 'mcp',
      name: `${template.role}_operation`,
      server: this.normalizeId(template.id),
      capabilities: [],
    };

    const roleTools: Record<string, Array<Record<string, unknown>>> = {
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
  private generateLLMConfig(role: string): Record<string, unknown> {
    const configs: Record<string, unknown> = {
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

  /**
   * Export OSSA manifest to platform-specific format
   * @param manifest - OSSA agent manifest
   * @param platform - Target platform
   * @returns Platform-specific agent configuration
   */
  async exportToPlatform(manifest: OssaAgent, platform: Platform): Promise<Record<string, unknown>> {
    const agent = manifest.agent || manifest;
    const metadata = manifest.metadata || agent.metadata || {};
    const spec = manifest.spec || agent;
    const extensions = manifest.extensions || agent.extensions || {};

    switch (platform) {
      case 'cursor':
        return {
          agent_type: extensions.cursor?.agent_type || 'composer',
          workspace_config: extensions.cursor?.workspace_config || {},
          capabilities: extensions.cursor?.capabilities || {},
          model: extensions.cursor?.model || spec.llm || {},
        };

      case 'openai':
        return {
          name: metadata.name || agent.id,
          instructions: spec.role || agent.role,
          model:
            extensions.openai_agents?.model || spec.llm?.model || 'gpt-4o-mini',
          tools: this.extractTools(spec.tools || agent.tools || []),
        };

      case 'crewai':
        return {
          role: extensions.crewai?.role || spec.role || agent.role,
          goal:
            extensions.crewai?.goal ||
            metadata.description ||
            agent.description,
          backstory: extensions.crewai?.backstory || '',
          tools: extensions.crewai?.tools || [],
          agent_type: extensions.crewai?.agent_type || 'worker',
        };

      case 'langchain':
        return {
          type: 'agent',
          chain_type: extensions.langchain?.chain_type || 'agent',
          tools: this.extractTools(spec.tools || agent.tools || []),
          llm: spec.llm || agent.llm || {},
        };

      case 'anthropic':
        return {
          name: metadata.name || agent.id,
          system: extensions.anthropic?.system || spec.role || agent.role,
          model: extensions.anthropic?.model || 'claude-3-5-sonnet-20241022',
          tools: this.extractTools(spec.tools || agent.tools || []),
        };

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Import platform-specific format to OSSA manifest
   * @param platformData - Platform-specific agent data
   * @param platform - Source platform
   * @returns OSSA agent manifest
   */
  async importFromPlatform(platformData: Record<string, unknown>, platform: Platform): Promise<OssaAgent> {
    const baseManifest: OssaAgent = {
      apiVersion: 'ossa/v0.2.4',
      kind: 'Agent',
      metadata: {
        name: platformData.name || platformData.id || 'imported-agent',
        version: platformData.version || '1.0.0',
        description: platformData.description || '',
      },
      spec: {
        role:
          platformData.instructions ||
          platformData.system ||
          platformData.role ||
          '',
        llm: {
          provider:
            platform === 'openai'
              ? 'openai'
              : platform === 'anthropic'
                ? 'anthropic'
                : 'openai',
          model: platformData.model || 'gpt-4',
        },
        tools: [],
      },
    };

    switch (platform) {
      case 'cursor':
        baseManifest.extensions = {
          cursor: {
            enabled: true,
            agent_type: platformData.agent_type || 'composer',
            workspace_config: platformData.workspace_config || {},
          },
        };
        break;

      case 'openai':
        baseManifest.extensions = {
          openai_agents: {
            enabled: true,
            model: platformData.model || 'gpt-4o-mini',
            instructions: platformData.instructions,
          },
        };
        if (platformData.tools) {
          baseManifest.spec.tools = this.convertToolsToOSSA(platformData.tools);
        }
        break;

      case 'crewai':
        baseManifest.extensions = {
          crewai: {
            enabled: true,
            agent_type: platformData.agent_type || 'worker',
            role: platformData.role,
            goal: platformData.goal,
            backstory: platformData.backstory,
            tools: platformData.tools || [],
          },
        };
        break;

      case 'anthropic':
        baseManifest.extensions = {
          anthropic: {
            enabled: true,
            model: platformData.model || 'claude-3-5-sonnet-20241022',
            system: platformData.system,
          },
        };
        if (platformData.tools) {
          baseManifest.spec.tools = this.convertToolsToOSSA(platformData.tools);
        }
        break;
    }

    return baseManifest;
  }

  private extractTools(tools: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.input_schema || tool.parameters || {},
      },
    }));
  }

  private convertToolsToOSSA(tools: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    return tools.map((tool) => {
      const func = tool.function || tool;
      return {
        type: 'function',
        name: func.name,
        description: func.description || '',
        input_schema: func.parameters || func.input_schema || {},
      };
    });
  }
}
