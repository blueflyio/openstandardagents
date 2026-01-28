/**
 * AutoGen to OSSA Converter
 *
 * Converts Microsoft AutoGen agent configurations to OSSA manifests.
 * Supports: ConversableAgent, AssistantAgent, UserProxyAgent, GroupChat
 */

import type {
  FrameworkConverter,
  ConversionResult,
  ConverterOptions,
  OSSAManifest,
  AgentSpec,
  WorkflowSpec,
} from '../types.js';

export interface AutoGenAgentConfig {
  name?: string;
  system_message?: string;
  llm_config?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    api_type?: string;
    [key: string]: unknown;
  };
  function_map?: Record<string, unknown>;
  code_execution_config?: {
    work_dir?: string;
    use_docker?: boolean;
    [key: string]: unknown;
  };
  human_input_mode?: string;
  max_consecutive_auto_reply?: number;
  is_termination_msg?: boolean;
  [key: string]: unknown;
}

export interface AutoGenGroupChatConfig {
  agents?: AutoGenAgentConfig[];
  messages?: unknown[];
  max_round?: number;
  admin_name?: string;
  speaker_selection_method?: string;
  [key: string]: unknown;
}

export class AutoGenConverter implements FrameworkConverter {
  name = 'autogen';
  version = '0.3.5';

  async validate(input: unknown): Promise<boolean> {
    if (typeof input !== 'object' || input === null) {
      return false;
    }

    const config = input as Record<string, unknown>;

    // AutoGen configs have system_message, llm_config, or agents array
    return (
      'system_message' in config ||
      'llm_config' in config ||
      ('agents' in config && Array.isArray(config.agents))
    );
  }

  async convert(
    input: unknown,
    options: ConverterOptions = {}
  ): Promise<ConversionResult> {
    const warnings: string[] = [];
    const config = input as AutoGenAgentConfig | AutoGenGroupChatConfig;

    // Detect if this is a single agent or a group chat
    if ('agents' in config && Array.isArray(config.agents)) {
      return this.convertGroupChat(
        config as AutoGenGroupChatConfig,
        options,
        warnings
      );
    } else {
      return this.convertAgent(config as AutoGenAgentConfig, options, warnings);
    }
  }

  private async convertAgent(
    config: AutoGenAgentConfig,
    options: ConverterOptions,
    warnings: string[]
  ): Promise<ConversionResult> {
    const llmInfo = this.detectLLM(config, warnings);
    const tools = this.extractTools(config, warnings);
    const capabilities = this.extractCapabilities(config, warnings);

    const spec: AgentSpec = {
      role: config.system_message || 'AutoGen Agent',
      llm: llmInfo,
      tools: tools.length > 0 ? tools : undefined,
      capabilities,
      safety: this.extractSafety(config, warnings),
    };

    const manifest: OSSAManifest = {
      apiVersion: `ossa/v${options.target_version || '0.3'}`,
      kind: 'Agent',
      metadata: {
        name: this.sanitizeName(config.name || 'autogen_agent'),
        version: '1.0.0',
        description: config.system_message || 'Converted from AutoGen agent',
        labels: {
          'ossa.io/source-framework': 'autogen',
          'ossa.io/converted': 'true',
        },
        annotations: {
          'ossa.io/human-input-mode': config.human_input_mode || 'NEVER',
          'ossa.io/max-auto-reply': String(config.max_consecutive_auto_reply || 10),
        },
      },
      spec,
    };

    return {
      manifest,
      warnings,
      metadata: {
        source_framework: 'autogen',
        conversion_time: new Date().toISOString(),
        ossa_version: options.target_version || '0.3.5',
      },
    };
  }

  private async convertGroupChat(
    config: AutoGenGroupChatConfig,
    options: ConverterOptions,
    warnings: string[]
  ): Promise<ConversionResult> {
    const agents = config.agents || [];

    const spec: WorkflowSpec = {
      agents: agents.map((agent, idx) => ({
        name: this.sanitizeName(agent.name || `agent_${idx}`),
        role: agent.system_message || `Agent ${idx + 1}`,
      })),
      steps: [
        {
          id: 'group_chat',
          name: 'AutoGen Group Chat',
          kind: 'Agent' as const,
          ref: this.sanitizeName(config.admin_name || 'admin'),
        },
      ],
    };

    const manifest: OSSAManifest = {
      apiVersion: `ossa/v${options.target_version || '0.3'}`,
      kind: 'Workflow',
      metadata: {
        name: 'autogen_group_chat',
        version: '1.0.0',
        description: `Converted AutoGen group chat with ${agents.length} agents`,
        labels: {
          'ossa.io/source-framework': 'autogen',
          'ossa.io/converted': 'true',
        },
        annotations: {
          'ossa.io/max-rounds': String(config.max_round || 10),
          'ossa.io/speaker-selection': config.speaker_selection_method || 'auto',
        },
      },
      spec,
    };

    warnings.push(
      'AutoGen group chat converted - manual review recommended for speaker selection logic'
    );

    return {
      manifest,
      warnings,
      metadata: {
        source_framework: 'autogen',
        conversion_time: new Date().toISOString(),
        ossa_version: options.target_version || '0.3.5',
      },
    };
  }

  private detectLLM(
    config: AutoGenAgentConfig,
    warnings: string[]
  ): AgentSpec['llm'] {
    const llmConfig = config.llm_config;

    if (!llmConfig) {
      warnings.push('No LLM configuration found - using default');
      return {
        provider: 'openai',
        model: 'gpt-4',
      };
    }

    const modelName = llmConfig.model || 'gpt-4';
    const apiType = llmConfig.api_type;

    let provider = 'openai';
    if (apiType === 'azure') {
      provider = 'azure';
    } else if (modelName.includes('claude')) {
      provider = 'anthropic';
    } else if (modelName.includes('gemini')) {
      provider = 'google';
    }

    return {
      provider,
      model: modelName,
      temperature: llmConfig.temperature,
      max_tokens: llmConfig.max_tokens,
    };
  }

  private extractTools(
    config: AutoGenAgentConfig,
    warnings: string[]
  ): NonNullable<AgentSpec['tools']> {
    const tools: NonNullable<AgentSpec['tools']> = [];

    // Check for function map
    if (config.function_map && typeof config.function_map === 'object') {
      Object.keys(config.function_map).forEach((funcName) => {
        tools.push({
          name: funcName,
          description: `AutoGen function: ${funcName}`,
          handler: {
            runtime: 'autogen',
            capability: funcName,
          },
        });
      });
    }

    // Check for code execution
    if (config.code_execution_config) {
      tools.push({
        name: 'code_execution',
        description: 'Execute Python code',
        handler: {
          runtime: 'autogen',
          capability: 'code_execution',
        },
        parameters: {
          work_dir: config.code_execution_config.work_dir || '/workspace',
          use_docker: config.code_execution_config.use_docker ?? false,
        },
      });
    }

    return tools;
  }

  private extractCapabilities(
    config: AutoGenAgentConfig,
    warnings: string[]
  ): AgentSpec['capabilities'] {
    const capabilities: NonNullable<AgentSpec['capabilities']> = [];

    if (config.code_execution_config) {
      capabilities.push({
        name: 'code_execution',
        description: 'Can execute Python code',
      });
    }

    if (config.human_input_mode === 'ALWAYS') {
      capabilities.push({
        name: 'human_in_loop',
        description: 'Requires human approval for all actions',
      });
    } else if (config.human_input_mode === 'TERMINATE') {
      capabilities.push({
        name: 'human_termination',
        description: 'Requires human approval to terminate',
      });
    }

    if (config.max_consecutive_auto_reply && config.max_consecutive_auto_reply > 10) {
      capabilities.push({
        name: 'extended_reasoning',
        description: 'Configured for extended multi-turn reasoning',
      });
    }

    return capabilities.length > 0 ? capabilities : undefined;
  }

  private extractSafety(
    config: AutoGenAgentConfig,
    warnings: string[]
  ): AgentSpec['safety'] {
    if (config.human_input_mode === 'ALWAYS') {
      return {
        guardrails: {
          require_human_approval_for: ['all_actions'],
        },
      };
    }

    if (config.code_execution_config && !config.code_execution_config.use_docker) {
      warnings.push(
        'Code execution without Docker detected - consider security implications'
      );
      return {
        guardrails: {
          require_human_approval_for: ['code_execution'],
        },
      };
    }

    return undefined;
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

export const autogenConverter = new AutoGenConverter();
