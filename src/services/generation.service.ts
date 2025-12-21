/**
 * Generation Service
 * Generates OSSA agent manifests from templates
 *
 * IMPORTANT: NO hardcoded versions - all versions come from package.json
 */

import { injectable } from 'inversify';
import type { AgentTemplate, OssaAgent } from '../types/index.js';
import { getApiVersion } from '../utils/version.js';

type Platform =
  | 'cursor'
  | 'openai'
  | 'anthropic'
  | 'langchain'
  | 'crewai'
  | 'autogen'
  | 'langflow'
  | 'langgraph'
  | 'llamaindex'
  | 'vercel-ai';

@injectable()
export class GenerationService {
  /**
   * Generate OSSA agent manifest from template
   * @param template - Agent configuration template
   * @returns Complete OSSA agent manifest
   */
  async generate(template: AgentTemplate): Promise<OssaAgent> {
    const tools = this.generateTools(template);
    const currentApiVersion = getApiVersion();

    const manifest: OssaAgent = {
      apiVersion: currentApiVersion,
      kind: 'Agent',
      metadata: {
        name: this.normalizeId(template.id),
        version: template.version || '1.0.0', // Agent version, not OSSA version
        description: template.description || `${template.name} agent`,
        labels: {},
        annotations: {},
      },
      spec: {
        role: template.role,
        llm: this.generateLLMConfig(template.role),
        tools: (template.capabilities || tools) as Array<{
          type: string;
          name?: string;
          server?: string;
          namespace?: string;
          endpoint?: string;
          capabilities?: string[];
          config?: Record<string, unknown>;
          auth?: {
            type: string;
            credentials?: string;
          };
        }>,
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
  private generateLLMConfig(role: string): {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  } {
    const configs: Record<
      string,
      {
        provider: string;
        model: string;
        temperature?: number;
        maxTokens?: number;
      }
    > = {
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
  async exportToPlatform(
    manifest: OssaAgent,
    platform: Platform
  ): Promise<Record<string, unknown>> {
    const agent = manifest.agent || manifest;
    const metadata =
      manifest.metadata || (agent as { metadata?: Record<string, unknown> })?.metadata || {};
    const spec =
      manifest.spec ||
      (agent as {
        role?: string;
        llm?: Record<string, unknown>;
        tools?: Array<Record<string, unknown>>;
      });
    const extensions =
      manifest.extensions || (agent as { extensions?: Record<string, unknown> })?.extensions || {};

    switch (platform) {
      case 'cursor': {
        const cursorExt = extensions.cursor as
          | {
              agent_type?: string;
              workspace_config?: Record<string, unknown>;
              capabilities?: Record<string, unknown>;
              model?: Record<string, unknown>;
            }
          | undefined;
        return {
          agent_type: cursorExt?.agent_type || 'composer',
          workspace_config: cursorExt?.workspace_config || {},
          capabilities: cursorExt?.capabilities || {},
          model: cursorExt?.model || spec?.llm || {},
        };
      }

      case 'openai': {
        const openaiExt = extensions.openai_agents as { model?: string } | undefined;
        return {
          name: metadata.name || (agent as { id?: string })?.id || '',
          instructions: spec?.role || (agent as { role?: string })?.role || '',
          model: openaiExt?.model || spec?.llm?.model || 'gpt-4o-mini',
          tools: this.extractTools(
            (spec?.tools ||
              (agent as { tools?: Array<Record<string, unknown>> })?.tools ||
              []) as Array<Record<string, unknown>>
          ),
        };
      }

      case 'crewai': {
        const crewaiExt = extensions.crewai as
          | {
              role?: string;
              goal?: string;
              backstory?: string;
              tools?: Array<unknown>;
              agent_type?: string;
            }
          | undefined;
        return {
          role: crewaiExt?.role || spec?.role || (agent as { role?: string })?.role || '',
          goal:
            crewaiExt?.goal ||
            metadata.description ||
            (agent as { description?: string })?.description ||
            '',
          backstory: crewaiExt?.backstory || '',
          tools: crewaiExt?.tools || [],
          agent_type: crewaiExt?.agent_type || 'worker',
        };
      }

      case 'langchain': {
        const langchainExt = extensions.langchain as { chain_type?: string } | undefined;
        return {
          type: 'agent',
          chain_type: langchainExt?.chain_type || 'agent',
          tools: this.extractTools(
            (spec?.tools ||
              (agent as { tools?: Array<Record<string, unknown>> })?.tools ||
              []) as Array<Record<string, unknown>>
          ),
          llm: spec?.llm || (agent as { llm?: Record<string, unknown> })?.llm || {},
        };
      }

      case 'anthropic': {
        const agentTools = (agent as { tools?: Array<Record<string, unknown>> })?.tools;
        const anthropicExt = extensions.anthropic as
          | { system?: string; model?: string }
          | undefined;
        return {
          name: metadata.name || (agent as { id?: string })?.id || '',
          system: anthropicExt?.system || spec?.role || (agent as { role?: string })?.role || '',
          model: anthropicExt?.model || 'claude-3-5-sonnet-20241022',
          tools: this.extractTools(
            (spec?.tools || agentTools || []) as Array<Record<string, unknown>>
          ),
        };
      }

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
  async importFromPlatform(
    platformData: Record<string, unknown>,
    platform: Platform
  ): Promise<OssaAgent> {
    const currentApiVersion = getApiVersion();
    const baseManifest: OssaAgent = {
      apiVersion: currentApiVersion,
      kind: 'Agent',
      metadata: {
        name:
          typeof platformData.name === 'string'
            ? platformData.name
            : typeof platformData.id === 'string'
              ? platformData.id
              : 'imported-agent',
        version: typeof platformData.version === 'string' ? platformData.version : '1.0.0',
        description: typeof platformData.description === 'string' ? platformData.description : '',
      },
      spec: {
        role:
          (typeof platformData.instructions === 'string' ? platformData.instructions : '') ||
          (typeof platformData.system === 'string' ? platformData.system : '') ||
          (typeof platformData.role === 'string' ? platformData.role : '') ||
          '',
        llm: {
          provider:
            platform === 'openai' ? 'openai' : platform === 'anthropic' ? 'anthropic' : 'openai',
          model: typeof platformData.model === 'string' ? platformData.model : 'gpt-4',
        },
        tools: [],
      },
    };

    switch (platform) {
      case 'cursor':
        baseManifest.extensions = {
          cursor: {
            enabled: true,
            agent_type:
              typeof platformData.agent_type === 'string' ? platformData.agent_type : 'composer',
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
        if (platformData.tools && Array.isArray(platformData.tools) && baseManifest.spec) {
          baseManifest.spec.tools = this.convertToolsToOSSA(platformData.tools);
        }
        break;

      case 'crewai':
        baseManifest.extensions = {
          crewai: {
            enabled: true,
            agent_type:
              typeof platformData.agent_type === 'string' ? platformData.agent_type : 'worker',
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
        if (platformData.tools && Array.isArray(platformData.tools) && baseManifest.spec) {
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

  private convertToolsToOSSA(tools: Array<Record<string, unknown>>): Array<{
    type: string;
    name?: string;
    description?: string;
    input_schema?: Record<string, unknown>;
  }> {
    return tools.map((tool) => {
      const func = (tool.function || tool) as Record<string, unknown>;
      return {
        type: 'function',
        name: typeof func.name === 'string' ? func.name : undefined,
        description: typeof func.description === 'string' ? func.description : undefined,
        input_schema: (func.parameters || func.input_schema || {}) as Record<string, unknown>,
      };
    });
  }
}
