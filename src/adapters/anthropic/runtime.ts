/**
 * Anthropic Runtime Adapter
 * OSSA runtime implementation for Anthropic Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { OssaAgent } from '../../types/index.js';
import { ToolMapper } from './tools.js';
import type { ToolHandler } from './tools.js';
import {
  convertToAnthropicMessages,
  createTextMessage,
  extractText,
  hasToolUse,
  extractToolUses,
  mergeMessages,
} from './messages.js';
import type { OssaMessage } from './messages.js';
import type { AnthropicConfig } from './config.js';

/**
 * Agent execution response
 */
export interface AgentResponse {
  /** Response text */
  text: string;
  /** Conversation messages */
  messages: OssaMessage[];
  /** Token usage */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  /** Cost in USD */
  cost: number;
  /** Stop reason */
  stopReason: string;
  /** Tool calls made (if any) */
  toolCalls?: Array<{
    name: string;
    input: Record<string, unknown>;
    result: string;
  }>;
}

/**
 * Runtime execution options
 */
export interface RuntimeOptions {
  /** Enable verbose logging */
  verbose?: boolean;
  /** Maximum conversation turns */
  maxTurns?: number;
  /** Enable streaming */
  streaming?: boolean;
  /** Custom temperature override */
  temperature?: number;
  /** Custom max tokens override */
  maxTokens?: number;
}

/**
 * Agent information
 */
export interface AgentInfo {
  name: string;
  version: string;
  model: string;
  provider: 'anthropic';
  tools: string[];
  role: string;
}

/**
 * Anthropic runtime adapter implementing OSSA runtime interface
 */
export class AnthropicAdapter {
  private client: Anthropic;
  private toolMapper: ToolMapper;
  private agent: OssaAgent;
  private conversationHistory: OssaMessage[] = [];

  constructor(agent: OssaAgent, config?: AnthropicConfig) {
    this.agent = agent;

    // Merge agent config with provided config
    const agentConfig = this.extractAgentConfig();
    const mergedConfig = { ...agentConfig, ...config };

    this.client = new Anthropic({ apiKey: mergedConfig.apiKey });
    this.toolMapper = new ToolMapper();

    // Map agent tools
    this.toolMapper.mapAgentTools(agent);
  }

  /**
   * Extract configuration from agent manifest
   */
  private extractAgentConfig(): Partial<AnthropicConfig> {
    const config: Partial<AnthropicConfig> = {};

    // Extract from spec.llm
    if (this.agent.spec?.llm) {
      const llm = this.agent.spec.llm;
      if (llm.model) config.model = llm.model as AnthropicConfig['model'];
      if (llm.temperature !== undefined) config.temperature = llm.temperature;
      if (llm.maxTokens) config.maxTokens = llm.maxTokens;
    }

    // Extract from extensions.anthropic
    const anthropicExt = this.agent.extensions?.anthropic as {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      stop_sequences?: string[];
    } | undefined;

    if (anthropicExt) {
      if (anthropicExt.model) config.model = anthropicExt.model as AnthropicConfig['model'];
      if (anthropicExt.temperature !== undefined) config.temperature = anthropicExt.temperature;
      if (anthropicExt.max_tokens) config.maxTokens = anthropicExt.max_tokens;
      if (anthropicExt.stop_sequences) config.stopSequences = anthropicExt.stop_sequences;
    }

    return config;
  }

  /**
   * Initialize the adapter
   */
  initialize(): void {
    this.conversationHistory = [];
  }

  /**
   * Execute agent with input messages
   */
  async execute(
    input: OssaMessage[],
    options?: RuntimeOptions
  ): Promise<AgentResponse> {
    // Add input to conversation history
    this.conversationHistory.push(...input);

    // Merge consecutive messages with same role
    const mergedHistory = mergeMessages(this.conversationHistory);

    // Convert to Anthropic format
    const { system, messages } = convertToAnthropicMessages(mergedHistory);

    // Get system prompt from agent role if not provided
    const systemPrompt = system || this.agent.spec?.role || 'You are a helpful assistant.';

    // Get tools
    const tools = this.toolMapper.getTools();

    const maxTurns = options?.maxTurns || 10;
    let turnCount = 0;
    let conversationMessages: MessageParam[] = [...messages];
    const toolCalls: Array<{
      name: string;
      input: Record<string, unknown>;
      result: string;
    }> = [];

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let finalStopReason = 'end_turn';
    let finalText = '';

    // Conversation loop for tool use
    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        console.log(`\n[AnthropicAdapter] Turn ${turnCount}/${maxTurns}`);
      }

      // Create message
      const response = await this.client.messages.create({
        model: this.agent.spec?.llm?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens || 4096,
        system: systemPrompt,
        messages: conversationMessages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: options?.temperature,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;
      finalStopReason = response.stop_reason || 'end_turn';

      if (options?.verbose) {
        console.log(`  Model: ${response.model}`);
        console.log(`  Stop reason: ${response.stop_reason}`);
        console.log(
          `  Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`
        );
      }

      // Add assistant response to conversation
      conversationMessages.push({
        role: 'assistant',
        content: response.content,
      });

      // Check for tool use
      const toolUseBlocks = response.content.filter(
        (block) => block.type === 'tool_use'
      );

      if (toolUseBlocks.length > 0) {
        if (options?.verbose) {
          console.log(`  Executing ${toolUseBlocks.length} tool(s)...`);
        }

        // Execute tools
        const toolResults: Array<{
          type: 'tool_result';
          tool_use_id: string;
          content: string;
        }> = [];

        for (const toolUse of toolUseBlocks) {
          if (toolUse.type !== 'tool_use') continue;

          const { id, name, input } = toolUse;

          if (options?.verbose) {
            console.log(`    → ${name}(${JSON.stringify(input).substring(0, 100)}...)`);
          }

          const result = await this.toolMapper.executeTool(
            name,
            input as Record<string, unknown>
          );

          if (options?.verbose) {
            console.log(
              `    ← ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`
            );
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: id,
            content: result,
          });

          toolCalls.push({
            name,
            input: input as Record<string, unknown>,
            result,
          });
        }

        // Add tool results to conversation
        conversationMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue loop to get final response
        continue;
      }

      // Extract text response
      const textBlocks = response.content.filter(
        (block) => block.type === 'text'
      );

      if (textBlocks.length > 0) {
        finalText = textBlocks
          .map((block) => (block.type === 'text' ? (block as { text: string }).text : ''))
          .join('\n');
        break;
      }

      // No text and no tool calls
      if (response.stop_reason === 'end_turn') {
        break;
      }
    }

    // Update conversation history
    this.conversationHistory = conversationMessages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content,
    })) as OssaMessage[];

    // Calculate cost
    const stats = { totalCost: 0 }; // Stats not available with direct SDK

    return {
      text: finalText,
      messages: this.conversationHistory,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
      },
      cost: stats.totalCost,
      stopReason: finalStopReason,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  /**
   * Register a tool handler
   */
  registerToolHandler(name: string, handler: ToolHandler): boolean {
    return this.toolMapper.registerToolHandler(name, handler);
  }

  /**
   * Get agent information
   */
  getAgentInfo(): AgentInfo {
    const config = this.agent.spec?.llm ? { model: this.agent.spec.llm.model } : {};
    const tools = this.toolMapper.getTools().map((t) => t.name);

    return {
      name: this.agent.metadata?.name || 'unnamed',
      version: this.agent.metadata?.version || '1.0.0',
      model: config.model || 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      tools,
      role: this.agent.spec?.role || 'assistant',
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Readonly<OssaMessage[]> {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return { requests: 0, tokens: 0, cost: 0 }; // Stats not available with direct SDK
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    // Stats reset not available with direct SDK client
  }

  /**
   * Get the underlying client
   */
  getClient(): Anthropic & { getConfig: () => AnthropicConfig; getStats: () => { requestCount: number; totalInputTokens: number; totalOutputTokens: number }; updateConfig: (config: Partial<AnthropicConfig>) => void } {
    const adapter = this;
    return Object.assign(this.client, {
      getConfig(): AnthropicConfig {
        const agentConfig = adapter.extractAgentConfig();
        return {
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          model: agentConfig.model || 'claude-3-5-sonnet-20241022',
          temperature: agentConfig.temperature,
          maxTokens: agentConfig.maxTokens,
        } as AnthropicConfig;
      },
      getStats() {
        return { requestCount: 0, totalInputTokens: 0, totalOutputTokens: 0 };
      },
      updateConfig(config: Partial<AnthropicConfig>) {
        adapter.updateConfig(config);
      },
    });
  }

  /**
   * Get the tool mapper
   */
  getToolMapper(): ToolMapper {
    return this.toolMapper;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnthropicConfig>): void {
    // Config updates require recreating client - not implemented
    // TODO: Implement config update by recreating client
  }

  /**
   * Chat with simple text interface
   */
  async chat(userMessage: string, options?: RuntimeOptions): Promise<string> {
    const input = [createTextMessage('user', userMessage)];
    const response = await this.execute(input, options);
    return response.text;
  }

  /**
   * Create adapter from file
   */
  static async fromFile(
    manifestPath: string,
    config?: AnthropicConfig
  ): Promise<AnthropicAdapter> {
    const fs = await import('fs/promises');
    const yaml = await import('yaml');

    const manifestContent = await fs.readFile(manifestPath, 'utf-8');

    let manifest: OssaAgent;
    if (manifestPath.endsWith('.json')) {
      manifest = JSON.parse(manifestContent);
    } else if (manifestPath.endsWith('.yaml') || manifestPath.endsWith('.yml')) {
      manifest = yaml.parse(manifestContent);
    } else {
      throw new Error('Manifest file must be .json, .yaml, or .yml');
    }

    return new AnthropicAdapter(manifest, config);
  }

  /**
   * Create adapter from manifest object
   */
  static fromManifest(
    manifest: OssaAgent,
    config?: AnthropicConfig
  ): AnthropicAdapter {
    return new AnthropicAdapter(manifest, config);
  }
}
