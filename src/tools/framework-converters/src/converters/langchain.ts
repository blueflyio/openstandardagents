/**
 * LangChain to OSSA Converter
 *
 * Converts LangChain agent configurations to OSSA manifests.
 * Supports: AgentExecutor, create_react_agent, create_structured_chat_agent
 */

import type {
  FrameworkConverter,
  ConversionResult,
  ConverterOptions,
  OSSAManifest,
  AgentSpec,
} from '../types.js';

export interface LangChainAgentConfig {
  agent?: {
    llm?: {
      model_name?: string;
      temperature?: number;
      max_tokens?: number;
    };
    tools?: Array<{
      name: string;
      description?: string;
      func?: unknown;
    }>;
    agent_type?: string;
    verbose?: boolean;
  };
  memory?: {
    memory_key?: string;
    return_messages?: boolean;
  };
  [key: string]: unknown;
}

export class LangChainConverter implements FrameworkConverter {
  name = 'langchain';
  version = '0.3.5';

  async validate(input: unknown): Promise<boolean> {
    if (typeof input !== 'object' || input === null) {
      return false;
    }

    const config = input as Record<string, unknown>;

    // LangChain configs typically have 'agent' or 'llm' properties
    return 'agent' in config || 'llm' in config || 'tools' in config;
  }

  async convert(
    input: unknown,
    options: ConverterOptions = {}
  ): Promise<ConversionResult> {
    const warnings: string[] = [];
    const config = input as LangChainAgentConfig;

    // Detect LLM provider and model
    const llmInfo = this.detectLLM(config, warnings);

    // Extract tools
    const tools = this.extractTools(config, warnings);

    // Build agent spec
    const spec: AgentSpec = {
      role: this.inferRole(config, warnings),
      llm: llmInfo,
      tools: tools.length > 0 ? tools : undefined,
      capabilities: this.extractCapabilities(config, warnings),
    };

    const manifest: OSSAManifest = {
      apiVersion: `ossa/v${options.target_version || '0.3'}`,
      kind: 'Agent',
      metadata: {
        name: this.generateName(config),
        version: '1.0.0',
        description: 'Converted from LangChain agent configuration',
        labels: {
          'ossa.io/source-framework': 'langchain',
          'ossa.io/converted': 'true',
        },
        annotations: {
          'ossa.io/original-agent-type': config.agent?.agent_type || 'unknown',
        },
      },
      spec,
    };

    return {
      manifest,
      warnings,
      metadata: {
        source_framework: 'langchain',
        conversion_time: new Date().toISOString(),
        ossa_version: options.target_version || '0.3.5',
      },
    };
  }

  private detectLLM(
    config: LangChainAgentConfig,
    warnings: string[]
  ): AgentSpec['llm'] {
    const llm = config.agent?.llm || config.llm;

    if (!llm || typeof llm !== 'object') {
      warnings.push('No LLM configuration found - using default');
      return {
        provider: 'openai',
        model: 'gpt-4',
      };
    }

    const llmConfig = llm as Record<string, unknown>;
    const modelName = (llmConfig.model_name as string) || 'gpt-4';

    // Detect provider from model name
    let provider = 'openai';
    if (modelName.includes('claude')) {
      provider = 'anthropic';
    } else if (modelName.includes('gemini')) {
      provider = 'google';
    } else if (modelName.includes('llama')) {
      provider = 'ollama';
    }

    return {
      provider,
      model: modelName,
      temperature: llmConfig.temperature as number | undefined,
      max_tokens: llmConfig.max_tokens as number | undefined,
    };
  }

  private extractTools(
    config: LangChainAgentConfig,
    warnings: string[]
  ): NonNullable<AgentSpec['tools']> {
    const tools = config.agent?.tools || config.tools;

    if (!Array.isArray(tools)) {
      return [];
    }

    return tools.map((tool) => {
      if (typeof tool === 'object' && tool !== null) {
        const toolObj = tool as Record<string, unknown>;
        return {
          name: (toolObj.name as string) || 'unnamed-tool',
          description: toolObj.description as string | undefined,
          handler: {
            runtime: 'langchain',
            capability: (toolObj.name as string) || 'unknown',
          },
        };
      }

      warnings.push(`Invalid tool configuration: ${JSON.stringify(tool)}`);
      return {
        name: 'invalid-tool',
        description: 'Tool configuration could not be parsed',
      };
    });
  }

  private extractCapabilities(
    config: LangChainAgentConfig,
    warnings: string[]
  ): AgentSpec['capabilities'] {
    const capabilities: NonNullable<AgentSpec['capabilities']> = [];

    // Infer capabilities from agent type
    const agentType = config.agent?.agent_type;

    if (agentType === 'zero-shot-react-description') {
      capabilities.push({
        name: 'reasoning',
        description: 'ReAct (Reasoning + Acting) pattern',
      });
    } else if (agentType === 'conversational-react-description') {
      capabilities.push({
        name: 'conversation',
        description: 'Conversational agent with memory',
      });
    } else if (agentType === 'structured-chat-zero-shot-react-description') {
      capabilities.push({
        name: 'structured_output',
        description: 'Structured chat with JSON output',
      });
    }

    // Check for memory
    if (config.memory) {
      capabilities.push({
        name: 'memory',
        description: 'Conversation memory enabled',
      });
    }

    return capabilities.length > 0 ? capabilities : undefined;
  }

  private inferRole(config: LangChainAgentConfig, warnings: string[]): string {
    const agentType = config.agent?.agent_type;

    if (agentType?.includes('conversational')) {
      return 'Conversational assistant with tool access';
    } else if (agentType?.includes('react')) {
      return 'ReAct agent with reasoning and tool execution';
    } else if (agentType?.includes('structured')) {
      return 'Structured output agent';
    }

    const tools = config.agent?.tools || config.tools;
    if (Array.isArray(tools) && tools.length > 0) {
      return `Agent with ${tools.length} tools`;
    }

    warnings.push('Could not infer agent role - using generic description');
    return 'General purpose agent';
  }

  private generateName(config: LangChainAgentConfig): string {
    const agentType = config.agent?.agent_type;

    if (agentType) {
      return agentType.replace(/-/g, '_').replace(/\s+/g, '_').toLowerCase();
    }

    return 'langchain_agent';
  }
}

export const langchainConverter = new LangChainConverter();
