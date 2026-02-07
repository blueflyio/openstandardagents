/**
 * GitLab Duo Flow Generator
 * Generates Flow Registry v1 configurations from OSSA manifests
 */

import type { OssaAgent } from '../../types/index.js';
import type {
  GitLabDuoFlow,
  FlowEnvironment,
  FlowComponent,
  AgentComponent,
  FlowRouter,
  FlowPrompt,
  PromptModelParams,
} from './types.js';
import YAML from 'yaml';

export class GitLabDuoFlowGenerator {
  /**
   * Generate complete Flow Registry v1 configuration
   */
  generate(manifest: OssaAgent): GitLabDuoFlow {
    const agentName = this.sanitizeName(manifest.metadata?.name || 'agent');
    const environment = this.determineEnvironment(manifest);

    const flow: GitLabDuoFlow = {
      version: 'v1',
      environment,
      name: manifest.metadata?.name || 'Unnamed Agent',
      description: manifest.metadata?.description || '',
      product_group: 'agent_foundations',
      components: this.generateComponents(manifest, agentName),
      routers: this.generateRouters(manifest, agentName),
      prompts: this.generatePrompts(manifest, agentName),
      flow: {
        entry_point: agentName,
      },
    };

    return flow;
  }

  /**
   * Generate YAML string from flow configuration
   */
  generateYAML(manifest: OssaAgent): string {
    const flow = this.generate(manifest);
    return YAML.stringify(flow, {
      indent: 2,
      lineWidth: 0,
    });
  }

  /**
   * Determine environment type based on OSSA autonomy configuration
   */
  private determineEnvironment(manifest: OssaAgent): FlowEnvironment {
    const spec = manifest.spec as Record<string, unknown>;
    const autonomy = spec.autonomy as
      | {
          level?: string;
          approvalRequired?: string[];
          maxTurns?: number;
        }
      | undefined;

    const tools = (spec.tools as unknown[]) || [];

    // Autonomous with no approval = ambient (hands-off)
    if (
      autonomy?.level === 'autonomous' &&
      (!autonomy.approvalRequired || autonomy.approvalRequired.length === 0)
    ) {
      return 'ambient';
    }

    // Single-turn, no tools = chat-partial (simple conversation)
    if (autonomy?.maxTurns === 1 && tools.length === 0) {
      return 'chat-partial';
    }

    // Default to chat (collaborative)
    return 'chat';
  }

  /**
   * Generate components (AgentComponent for now)
   */
  private generateComponents(manifest: OssaAgent, agentName: string): FlowComponent[] {
    const spec = manifest.spec as Record<string, unknown>;
    const tools = (spec.tools as Array<{ name?: string }>) || [];

    // Map OSSA tools to GitLab MCP tools
    const toolset = this.mapTools(tools);

    const component: AgentComponent = {
      name: agentName,
      type: 'AgentComponent',
      prompt_id: `${agentName}_prompt`,
      prompt_version: null, // Local prompt (no version)
      inputs: [
        {
          from: 'context:goal',
          as: 'task',
        },
      ],
      toolset,
      ui_log_events: [
        'on_agent_final_answer',
        'on_tool_execution_success',
        'on_tool_execution_failed',
      ],
      ui_role_as: 'agent',
    };

    return [component];
  }

  /**
   * Map OSSA tools to GitLab MCP tools
   */
  private mapTools(ossaTools: Array<{ name?: string }>): string[] {
    const toolMapping: Record<string, string> = {
      // File operations
      read: 'read_file',
      write: 'create_file_with_contents',
      update: 'update_file',
      list: 'list_dir',
      search: 'search_files',

      // GitLab operations
      'create-issue': 'create_issue',
      'create-mr': 'create_merge_request',
      comment: 'add_comment',

      // Shell
      shell: 'execute_shell_command',
      exec: 'execute_shell_command',
    };

    const mappedTools: string[] = [];

    for (const tool of ossaTools) {
      const toolName = tool.name?.toLowerCase() || '';
      const mappedTool = toolMapping[toolName];

      if (mappedTool) {
        mappedTools.push(mappedTool);
      } else {
        // Default to read_file for unknown tools
        mappedTools.push('read_file');
      }
    }

    // Always include basic file operations
    const defaultTools = ['read_file', 'list_dir', 'search_files'];
    const uniqueTools = Array.from(new Set([...defaultTools, ...mappedTools]));

    return uniqueTools;
  }

  /**
   * Generate routers (simple linear flow for single-component)
   */
  private generateRouters(manifest: OssaAgent, agentName: string): FlowRouter[] {
    // For single-component flows, just route to end
    return [
      {
        from: agentName,
        to: 'end',
      },
    ];
  }

  /**
   * Generate inline prompt definitions
   */
  private generatePrompts(manifest: OssaAgent, agentName: string): FlowPrompt[] {
    const spec = manifest.spec as Record<string, unknown>;
    const role = (spec.role as string) || 'You are a helpful AI assistant';
    const llm = spec.llm as
      | {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
        }
      | undefined;

    // Map provider
    const modelClassProvider = this.mapProvider(llm?.provider || 'anthropic');

    // Build model params
    const modelParams: PromptModelParams = {
      model_class_provider: modelClassProvider,
      model: llm?.model || this.getDefaultModel(modelClassProvider),
      max_tokens: llm?.maxTokens || 4096,
      temperature: llm?.temperature ?? 0.7,
    };

    const prompt: FlowPrompt = {
      prompt_id: `${agentName}_prompt`,
      name: `${manifest.metadata?.name || 'Agent'} System Prompt`,
      model: {
        params: modelParams,
      },
      unit_primitives: [],
      prompt_template: {
        system: role,
        user: '{{task}}',
        placeholder: 'history', // Enable conversation history
      },
      params: {
        timeout: 180,
        stop: [],
      },
    };

    return [prompt];
  }

  /**
   * Map OSSA provider to GitLab provider
   */
  private mapProvider(provider: string): 'anthropic' | 'openai' | 'vertexai' {
    const normalized = provider.toLowerCase();

    if (normalized.includes('anthropic') || normalized.includes('claude')) {
      return 'anthropic';
    }

    if (normalized.includes('openai') || normalized.includes('gpt')) {
      return 'openai';
    }

    if (normalized.includes('google') || normalized.includes('vertex') || normalized.includes('gemini')) {
      return 'vertexai';
    }

    // Default to anthropic
    return 'anthropic';
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: 'anthropic' | 'openai' | 'vertexai'): string {
    const defaults: Record<string, string> = {
      anthropic: 'claude-sonnet-4-20250514',
      openai: 'gpt-4o-mini',
      vertexai: 'gemini-1.5-pro',
    };

    return defaults[provider];
  }

  /**
   * Sanitize name for use in Flow Registry
   * Must be alphanumeric + underscores only
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }
}
