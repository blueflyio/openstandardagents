/**
 * AgentScope to OSSA Converter
 *
 * Converts AgentScope agent configurations to OSSA manifests.
 * Supports: ReActAgent, DialogAgent, DictDialogAgent, UserAgent, RpcAgent
 */

import type {
  FrameworkConverter,
  ConversionResult,
  ConverterOptions,
  OSSAManifest,
  AgentSpec,
} from '../types.js';

export interface AgentScopeConfig {
  /** AgentScope agent class name */
  class?: string;
  agent_type?: string;
  /** Agent name */
  name?: string;
  /** System prompt / role description */
  sys_prompt?: string;
  system_prompt?: string;
  /** Model configuration */
  model_config_name?: string;
  model_config?: {
    model_type?: string;
    model_name?: string;
    api_key?: string;
    temperature?: number;
    max_tokens?: number;
    [key: string]: unknown;
  };
  /** Service toolkit / tools */
  service_toolkit?: Array<{
    name?: string;
    description?: string;
    [key: string]: unknown;
  }>;
  tools?: Array<{
    name?: string;
    description?: string;
    [key: string]: unknown;
  }>;
  /** Memory configuration */
  memory?: {
    backend?: string;
    [key: string]: unknown;
  };
  memory_config?: {
    backend?: string;
    [key: string]: unknown;
  };
  /** Max iterations for ReAct agents */
  max_iters?: number;
  /** Orchestration pattern */
  orchestration?: string;
  /** Message hub config */
  msghub?: Record<string, unknown>;
  /** Verbose mode */
  verbose?: boolean;
  [key: string]: unknown;
}

/** Known AgentScope agent classes */
const VALID_AGENT_CLASSES = [
  'ReActAgent',
  'DialogAgent',
  'DictDialogAgent',
  'UserAgent',
  'TextToImageAgent',
  'RpcAgent',
];

/** Known memory backends */
const VALID_MEMORY_BACKENDS = ['mem0', 'local', 'redis', 'none'];

/** Known orchestration patterns */
const VALID_ORCHESTRATIONS = [
  'msghub',
  'pipeline',
  'sequential',
  'forlooppipeline',
  'whilelooppipeline',
  'ifelsepipeline',
  'switchpipeline',
];

export class AgentScopeConverter implements FrameworkConverter {
  name = 'agentscope';
  version = '0.4.6';

  async validate(input: unknown): Promise<boolean> {
    if (typeof input !== 'object' || input === null) {
      return false;
    }

    const config = input as Record<string, unknown>;

    // AgentScope configs typically have class/agent_type + sys_prompt or model_config
    const hasAgentClass =
      ('class' in config &&
        typeof config.class === 'string' &&
        VALID_AGENT_CLASSES.some(
          (c) => (config.class as string).includes(c)
        )) ||
      ('agent_type' in config &&
        typeof config.agent_type === 'string' &&
        VALID_AGENT_CLASSES.some(
          (c) => (config.agent_type as string).includes(c)
        ));

    const hasPrompt = 'sys_prompt' in config || 'system_prompt' in config;
    const hasModel =
      'model_config' in config || 'model_config_name' in config;

    return hasAgentClass || (hasPrompt && hasModel);
  }

  async convert(
    input: unknown,
    options: ConverterOptions = {}
  ): Promise<ConversionResult> {
    const warnings: string[] = [];
    const config = input as AgentScopeConfig;

    const agentClass =
      config.class || config.agent_type || 'DialogAgent';
    const role =
      config.sys_prompt ||
      config.system_prompt ||
      'AgentScope Agent';
    const llmInfo = this.detectLLM(config, warnings);
    const tools = this.extractTools(config, warnings);
    const capabilities = this.extractCapabilities(config, agentClass);

    const spec: AgentSpec = {
      role,
      llm: llmInfo,
      tools: tools.length > 0 ? tools : undefined,
      capabilities: capabilities.length > 0 ? capabilities : undefined,
    };

    const manifest: OSSAManifest = {
      apiVersion: `ossa/v${options.target_version || '0.4'}`,
      kind: 'Agent',
      metadata: {
        name: this.sanitizeName(config.name || agentClass),
        version: '1.0.0',
        description: `Converted from AgentScope ${agentClass}`,
        labels: {
          'ossa.io/source-framework': 'agentscope',
          'ossa.io/converted': 'true',
          framework: 'agentscope',
        },
        annotations: {
          'ossa.io/agent-class': agentClass,
        },
      },
      spec,
    };

    // Add extensions.agentscope
    (manifest as any).extensions = {
      agentscope: {
        agent_class: agentClass,
        ...(config.max_iters ? { max_iters: config.max_iters } : {}),
        ...(config.memory?.backend || config.memory_config?.backend
          ? {
              memory_backend:
                config.memory?.backend || config.memory_config?.backend,
            }
          : {}),
        ...(config.orchestration
          ? { orchestration: config.orchestration }
          : {}),
        ...(config.msghub ? { orchestration: 'msghub' } : {}),
      },
    };

    // Validate known enums and warn
    if (!VALID_AGENT_CLASSES.includes(agentClass)) {
      warnings.push(
        `Agent class "${agentClass}" is not a standard AgentScope class (${VALID_AGENT_CLASSES.join(', ')})`
      );
    }

    const memBackend =
      config.memory?.backend || config.memory_config?.backend;
    if (memBackend && !VALID_MEMORY_BACKENDS.includes(memBackend)) {
      warnings.push(
        `Memory backend "${memBackend}" is not a known backend (${VALID_MEMORY_BACKENDS.join(', ')})`
      );
    }

    const orch = config.orchestration || (config.msghub ? 'msghub' : undefined);
    if (orch && !VALID_ORCHESTRATIONS.includes(orch)) {
      warnings.push(
        `Orchestration "${orch}" is not a known pattern (${VALID_ORCHESTRATIONS.join(', ')})`
      );
    }

    return {
      manifest,
      warnings,
      metadata: {
        source_framework: 'agentscope',
        conversion_time: new Date().toISOString(),
        ossa_version: options.target_version || '0.4.6',
      },
    };
  }

  private detectLLM(
    config: AgentScopeConfig,
    warnings: string[]
  ): AgentSpec['llm'] {
    const modelConfig = config.model_config;

    if (!modelConfig) {
      if (config.model_config_name) {
        warnings.push(
          `model_config_name "${config.model_config_name}" referenced but model_config not inline - using defaults`
        );
      } else {
        warnings.push('No model configuration found - using default');
      }
      return {
        provider: 'openai',
        model: 'gpt-4',
      };
    }

    const modelName = modelConfig.model_name || 'gpt-4';
    let provider = 'openai';

    if (
      modelConfig.model_type?.includes('anthropic') ||
      modelName.includes('claude')
    ) {
      provider = 'anthropic';
    } else if (
      modelConfig.model_type?.includes('dashscope') ||
      modelName.includes('qwen')
    ) {
      provider = 'dashscope';
    } else if (modelName.includes('gemini')) {
      provider = 'google';
    }

    return {
      provider,
      model: modelName,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens,
    };
  }

  private extractTools(
    config: AgentScopeConfig,
    warnings: string[]
  ): NonNullable<AgentSpec['tools']> {
    const rawTools = config.service_toolkit || config.tools;

    if (!Array.isArray(rawTools)) {
      return [];
    }

    return rawTools.map((tool) => ({
      name: tool.name || 'unnamed-tool',
      description: tool.description,
      handler: {
        runtime: 'agentscope',
        capability: tool.name || 'unknown',
      },
    }));
  }

  private extractCapabilities(
    config: AgentScopeConfig,
    agentClass: string
  ): NonNullable<AgentSpec['capabilities']> {
    const capabilities: NonNullable<AgentSpec['capabilities']> = [];

    if (agentClass === 'ReActAgent') {
      capabilities.push({
        name: 'react',
        description: 'ReAct (Reasoning + Acting) loop',
      });
    }

    if (config.memory || config.memory_config) {
      capabilities.push({
        name: 'memory',
        description: `Long-term memory (${config.memory?.backend || config.memory_config?.backend || 'default'})`,
      });
    }

    if (config.service_toolkit?.length || config.tools?.length) {
      capabilities.push({
        name: 'tool_use',
        description: 'Tool/service execution',
      });
    }

    if (config.msghub || config.orchestration === 'msghub') {
      capabilities.push({
        name: 'multi_agent',
        description: 'Multi-agent message hub coordination',
      });
    }

    return capabilities;
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

export const agentscopeConverter = new AgentScopeConverter();
