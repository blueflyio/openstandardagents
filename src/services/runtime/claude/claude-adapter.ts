/**
 * Claude Runtime Adapter
 * Runs OSSA agents using Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { ManifestParser } from './manifest-parser.js';
import { CapabilityMapper } from './capability-mapper.js';
import type {
  OssaManifestWithAnthropic,
  ClaudeMessage,
  ClaudeRunOptions,
  ClaudeAdapterConfig,
  AgentInfo,
  ToolHandler,
  ClaudeTool,
} from './types.js';

/**
 * Claude adapter for executing OSSA agents
 */
export class ClaudeAdapter {
  private client: Anthropic;
  private parser: ManifestParser;
  private mapper: CapabilityMapper;
  private messages: ClaudeMessage[] = [];
  private conversationHistory: Anthropic.MessageParam[] = [];

  constructor(config: ClaudeAdapterConfig) {
    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    });

    // Initialize parser and mapper
    this.parser = new ManifestParser(config.manifest);
    this.mapper = new CapabilityMapper();

    // Validate manifest
    const validation = this.parser.validate();
    if (!validation.valid) {
      throw new Error(
        `Invalid OSSA manifest: ${validation.errors.join(', ')}`
      );
    }

    // Check if Anthropic integration is enabled
    if (!this.parser.isAnthropicEnabled()) {
      console.warn(
        'Warning: Anthropic extension is disabled in manifest'
      );
    }

    // Initialize tools
    this.initializeTools();
  }

  /**
   * Initialize tools from manifest
   */
  private initializeTools(): void {
    // Map Claude extension tools first (highest priority)
    const anthropicExt = this.parser.getAnthropicExtension();
    if (anthropicExt?.tools) {
      this.mapper.mapClaudeTools(anthropicExt.tools);
    }

    // Map OSSA spec tools
    const specTools = this.parser.getSpecTools();
    this.mapper.mapOssaTools(specTools);

    // Map MCP capabilities if any
    for (const tool of specTools) {
      if (tool.type === 'mcp' && tool.capabilities) {
        this.mapper.mapMcpCapabilities(tool.capabilities);
      } else if (tool.type === 'http') {
        this.mapper.mapHttpTool(tool);
      }
    }
  }

  /**
   * Register a tool handler
   */
  registerToolHandler(name: string, handler: ToolHandler): boolean {
    return this.mapper.registerToolHandler(name, handler);
  }

  /**
   * Execute a tool call
   */
  private async executeTool(
    name: string,
    input: Record<string, unknown>
  ): Promise<string> {
    const tool = this.mapper.getTool(name);
    if (!tool) {
      return JSON.stringify({
        error: `Tool '${name}' not found`,
      });
    }

    if (tool.handler) {
      try {
        return await tool.handler(input);
      } catch (error) {
        return JSON.stringify({
          error: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Default: return placeholder response
    return JSON.stringify({
      message: `Tool '${name}' executed`,
      input,
      note: 'No handler registered for this tool',
    });
  }

  /**
   * Initialize the conversation
   */
  initialize(): void {
    this.messages = [];
    this.conversationHistory = [];
  }

  /**
   * Send a message and get a response
   */
  async chat(
    userMessage: string,
    options?: ClaudeRunOptions
  ): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.mapper.getClaudeTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        console.log(`\n[Turn ${turnCount}/${maxTurns}]`);
      }

      // Call Claude API
      const response = await this.client.messages.create({
        model: this.parser.getModel(),
        max_tokens: this.parser.getMaxTokens(),
        temperature: this.parser.getTemperature(),
        system: this.parser.getSystemPrompt(),
        messages: this.conversationHistory,
        tools: tools.length > 0 ? tools : undefined,
        stop_sequences: this.parser.getStopSequences(),
      });

      if (options?.verbose) {
        console.log(
          `  Model: ${response.model}, Stop: ${response.stop_reason}`
        );
        console.log(
          `  Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`
        );
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      });

      // Check if we need to execute tools
      const toolUses = response.content.filter(
        (block) => block.type === 'tool_use'
      );

      if (toolUses.length > 0) {
        if (options?.verbose) {
          console.log(`  [Executing ${toolUses.length} tool(s)...]`);
        }

        // Execute all tool calls
        const toolResults: Array<{
          type: 'tool_result';
          tool_use_id: string;
          content: string;
        }> = [];

        for (const toolUse of toolUses) {
          if (toolUse.type !== 'tool_use') continue;

          const { id, name, input } = toolUse;

          if (options?.verbose) {
            console.log(
              `    → ${name}(${JSON.stringify(input).substring(0, 100)}...)`
            );
          }

          const result = await this.executeTool(
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
        }

        // Add tool results to conversation
        this.conversationHistory.push({
          role: 'user',
          content: toolResults,
        });

        // Continue the loop to get final response
        continue;
      }

      // Check if we have a text response
      const textBlocks = response.content.filter(
        (block) => block.type === 'text'
      );

      if (textBlocks.length > 0) {
        return textBlocks
          .map((block) => (block.type === 'text' ? block.text : ''))
          .join('\n');
      }

      // No text and no tool calls - unexpected
      if (response.stop_reason === 'end_turn') {
        return '';
      }

      // Max tokens or stop sequence reached
      if (
        response.stop_reason === 'max_tokens' ||
        response.stop_reason === 'stop_sequence'
      ) {
        return '[Response truncated due to length limit]';
      }
    }

    return '[Max turns reached without completion]';
  }

  /**
   * Stream a response (for future implementation)
   */
  async chatStream(
    userMessage: string,
    options?: ClaudeRunOptions
  ): Promise<AsyncIterable<string>> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.mapper.getClaudeTools();

    const stream = await this.client.messages.stream({
      model: this.parser.getModel(),
      max_tokens: this.parser.getMaxTokens(),
      temperature: this.parser.getTemperature(),
      system: this.parser.getSystemPrompt(),
      messages: this.conversationHistory,
      tools: tools.length > 0 ? tools : undefined,
    });

    // Return async generator
    return (async function* () {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          yield chunk.delta.text;
        }
      }
    })();
  }

  /**
   * Get agent information
   */
  getAgentInfo(): AgentInfo {
    const metadata = this.parser.getMetadata();
    const tools = Array.from(this.mapper.getTools().keys());

    return {
      name: metadata.name,
      model: this.parser.getModel(),
      tools,
      provider: 'anthropic',
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Anthropic.MessageParam[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.messages = [];
  }

  /**
   * Get available tools
   */
  getTools(): ClaudeTool[] {
    return this.mapper.getClaudeTools();
  }

  /**
   * Get the Anthropic client (for advanced usage)
   */
  getClient(): Anthropic {
    return this.client;
  }

  /**
   * Get the manifest parser
   */
  getParser(): ManifestParser {
    return this.parser;
  }

  /**
   * Get the capability mapper
   */
  getMapper(): CapabilityMapper {
    return this.mapper;
  }

  /**
   * Create a Claude adapter from a manifest file
   */
  static async fromFile(
    manifestPath: string,
    apiKey?: string
  ): Promise<ClaudeAdapter> {
    const fs = await import('fs/promises');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(
      manifestContent
    ) as OssaManifestWithAnthropic;

    return new ClaudeAdapter({
      manifest,
      apiKey,
    });
  }

  /**
   * Create a Claude adapter from a manifest object
   */
  static fromManifest(
    manifest: OssaManifestWithAnthropic,
    apiKey?: string
  ): ClaudeAdapter {
    return new ClaudeAdapter({
      manifest,
      apiKey,
    });
  }
}
