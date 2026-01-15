/**
 * Anthropic Runtime Adapter
 * Runs OSSA agents using Anthropic's Claude API with streaming and tool support
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  MessageCreateParams,
  Tool,
  ToolUseBlock,
  TextBlock,
  ContentBlock,
} from '@anthropic-ai/sdk/resources/messages';

export interface OssaManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version?: string;
    description?: string;
  };
  spec: {
    role: string;
    llm?: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
    tools?: Array<{
      type: string;
      name?: string;
      capabilities?: string[];
      config?: Record<string, unknown>;
    }>;
  };
  extensions?: {
    anthropic?: {
      model?: string;
      system?: string;
      max_tokens?: number;
      temperature?: number;
      tools?: Tool[];
      streaming?: boolean;
      stop_sequences?: string[];
    };
    [key: string]: unknown;
  };
}

export interface RunOptions {
  verbose?: boolean;
  maxTurns?: number;
  streaming?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties?: unknown;
    required?: string[];
    [k: string]: unknown;
  };
  handler?: (args: Record<string, unknown>) => Promise<string>;
}

export class AnthropicAdapter {
  private client: Anthropic;
  private manifest: OssaManifest;
  private tools: Map<string, ToolDefinition> = new Map();
  private conversationHistory: MessageParam[] = [];

  constructor(manifest: OssaManifest, apiKey?: string) {
    this.manifest = manifest;
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });

    // Initialize tools from manifest at construction time
    // This ensures tools are available immediately via getTools()
    // without waiting for the first chat() call
    this.initializeTools();
  }

  /**
   * Initialize tools from the manifest
   * Called during construction to populate the tools map
   */
  private initializeTools(): void {
    // Call getAnthropicTools() which populates this.tools as a side effect
    // This is necessary for getTools() to return registered tools immediately
    this.getAnthropicTools();
  }

  /**
   * Get the model to use from manifest
   * Supports: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
   */
  private getModel(): string {
    // Check Anthropic extension first
    if (this.manifest.extensions?.anthropic?.model) {
      return this.manifest.extensions.anthropic.model;
    }
    // Fall back to LLM config
    if (this.manifest.spec.llm?.model) {
      return this.manifest.spec.llm.model;
    }
    // Default to latest Claude 3.5 Sonnet
    return 'claude-3-5-sonnet-20241022';
  }

  /**
   * Get system prompt from manifest
   */
  private getSystemPrompt(): string {
    // Check Anthropic extension first
    if (this.manifest.extensions?.anthropic?.system) {
      return this.manifest.extensions.anthropic.system;
    }
    // Fall back to role
    return this.manifest.spec.role;
  }

  /**
   * Get max tokens configuration
   */
  private getMaxTokens(): number {
    // Check Anthropic extension first
    if (this.manifest.extensions?.anthropic?.max_tokens) {
      return this.manifest.extensions.anthropic.max_tokens;
    }
    // Fall back to LLM config
    if (this.manifest.spec.llm?.maxTokens) {
      return this.manifest.spec.llm.maxTokens;
    }
    // Default
    return 4096;
  }

  /**
   * Get temperature configuration
   */
  private getTemperature(): number {
    // Check Anthropic extension first
    if (this.manifest.extensions?.anthropic?.temperature !== undefined) {
      return this.manifest.extensions.anthropic.temperature;
    }
    // Fall back to LLM config
    if (this.manifest.spec.llm?.temperature !== undefined) {
      return this.manifest.spec.llm.temperature;
    }
    // Default
    return 1.0;
  }

  /**
   * Get stop sequences
   */
  private getStopSequences(): string[] | undefined {
    return this.manifest.extensions?.anthropic?.stop_sequences;
  }

  /**
   * Convert OSSA tools to Anthropic tool format
   */
  private getAnthropicTools(): Tool[] {
    const anthropicTools: Tool[] = [];

    // Check for tools in Anthropic extension (highest priority)
    // These tools come directly from the manifest's anthropic extension block
    // and should already be in Anthropic's Tool format
    const extensionTools = this.manifest.extensions?.anthropic?.tools;
    if (extensionTools) {
      for (const tool of extensionTools) {
        // Normalize input_schema to handle null values in 'required' field
        // Anthropic SDK expects required to be string[] | undefined, not null
        const normalizedSchema = {
          ...tool.input_schema,
          type: 'object' as const,
          required: tool.input_schema.required ?? undefined,
        };

        const toolDef: ToolDefinition = {
          name: tool.name,
          // Provide default description if not specified in manifest
          description: tool.description ?? `Tool: ${tool.name}`,
          input_schema: normalizedSchema,
        };
        this.tools.set(tool.name, toolDef);
        anthropicTools.push(tool);
      }
    }

    // Also check spec.tools for basic tool definitions
    if (this.manifest.spec.tools) {
      for (const tool of this.manifest.spec.tools) {
        if (tool.name && !this.tools.has(tool.name)) {
          // Generate input schema based on tool config
          const inputSchema = this.generateInputSchema(tool);

          const toolDef: ToolDefinition = {
            name: tool.name,
            description: `Execute ${tool.name} (${tool.type})`,
            input_schema: inputSchema,
          };
          this.tools.set(tool.name, toolDef);

          anthropicTools.push({
            name: tool.name,
            description: toolDef.description,
            input_schema: inputSchema,
          });
        }
      }
    }

    return anthropicTools;
  }

  /**
   * Generate input schema from OSSA tool spec
   */
  private generateInputSchema(tool: {
    type: string;
    config?: Record<string, unknown>;
  }): {
    type: 'object';
    properties?: unknown;
    required?: string[];
    [k: string]: unknown;
  } {
    // Check if config has schema information
    if (tool.config && typeof tool.config === 'object') {
      if ('input_schema' in tool.config) {
        return tool.config.input_schema as {
          type: 'object';
          properties?: unknown;
          required?: string[];
          [k: string]: unknown;
        };
      }

      // Use config as properties
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(tool.config)) {
        properties[key] = {
          type: typeof value === 'number' ? 'number' : 'string',
          description: `${key} parameter`,
        };
      }

      return {
        type: 'object',
        properties,
      };
    }

    // Default schema based on transport type
    switch (tool.type) {
      case 'mcp':
        return {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Input data',
            },
          },
          required: ['input'],
        };

      case 'http':
        return {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              description: 'HTTP method',
            },
            body: {
              type: 'object',
              description: 'Request body',
            },
          },
          required: ['method'],
        };

      case 'function':
        return {
          type: 'object',
          properties: {
            args: {
              type: 'object',
              description: 'Function arguments',
            },
          },
        };

      default:
        return {
          type: 'object',
          properties: {},
        };
    }
  }

  /**
   * Register a tool handler
   */
  registerToolHandler(
    name: string,
    handler: (args: Record<string, unknown>) => Promise<string>
  ): void {
    const tool = this.tools.get(name);
    if (tool) {
      tool.handler = handler;
    } else {
      // Allow registering handlers for tools not yet defined
      this.tools.set(name, {
        name,
        description: `Handler for ${name}`,
        input_schema: {
          type: 'object',
          properties: {},
        },
        handler,
      });
    }
  }

  /**
   * Execute a tool call
   */
  private async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      return JSON.stringify({
        error: `Tool '${name}' not found`,
      });
    }

    if (tool.handler) {
      try {
        return await tool.handler(args);
      } catch (error) {
        return JSON.stringify({
          error: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Default: return a placeholder response
    return JSON.stringify({
      message: `Tool '${name}' executed`,
      input: args,
      note: 'No handler registered for this tool',
    });
  }

  /**
   * Initialize the conversation
   */
  initialize(): void {
    this.conversationHistory = [];
  }

  /**
   * Send a message and get a response
   */
  async chat(userMessage: string, options?: RunOptions): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.getAnthropicTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        console.log(`\n[Turn ${turnCount}/${maxTurns}]`);
      }

      // Prepare request parameters
      const requestParams: MessageCreateParams = {
        model: this.getModel(),
        max_tokens: this.getMaxTokens(),
        temperature: this.getTemperature(),
        system: this.getSystemPrompt(),
        messages: this.conversationHistory,
      };

      // Add tools if available
      if (tools.length > 0) {
        requestParams.tools = tools;
      }

      // Add stop sequences if configured
      const stopSequences = this.getStopSequences();
      if (stopSequences) {
        requestParams.stop_sequences = stopSequences;
      }

      // Call Claude API
      const response = await this.client.messages.create(requestParams);

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
        (block): block is ToolUseBlock => block.type === 'tool_use'
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
          const { id, name, input } = toolUse;

          if (options?.verbose) {
            const inputPreview =
              JSON.stringify(input).substring(0, 100) +
              (JSON.stringify(input).length > 100 ? '...' : '');
            console.log(`    → ${name}(${inputPreview})`);
          }

          const result = await this.executeTool(
            name,
            input as Record<string, unknown>
          );

          if (options?.verbose) {
            const resultPreview =
              result.substring(0, 100) + (result.length > 100 ? '...' : '');
            console.log(`    ← ${resultPreview}`);
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
        (block): block is TextBlock => block.type === 'text'
      );

      if (textBlocks.length > 0) {
        return textBlocks.map((block) => block.text).join('\n');
      }

      // No text and no tool calls - check stop reason
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
   * Stream a response with tool support
   */
  async *chatStream(
    userMessage: string,
    options?: RunOptions
  ): AsyncGenerator<string, void, unknown> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.getAnthropicTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        yield `\n[Turn ${turnCount}/${maxTurns}]\n`;
      }

      // Prepare request parameters
      const requestParams: MessageCreateParams = {
        model: this.getModel(),
        max_tokens: this.getMaxTokens(),
        temperature: this.getTemperature(),
        system: this.getSystemPrompt(),
        messages: this.conversationHistory,
      };

      // Add tools if available
      if (tools.length > 0) {
        requestParams.tools = tools;
      }

      // Add stop sequences if configured
      const stopSequences = this.getStopSequences();
      if (stopSequences) {
        requestParams.stop_sequences = stopSequences;
      }

      // Stream the response
      const stream = await this.client.messages.stream(requestParams);

      // Collect response content for history
      const responseContent: ContentBlock[] = [];
      let stopReason: string | null = null;

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          // Track content blocks
          if (event.content_block.type === 'text') {
            responseContent.push(event.content_block);
          } else if (event.content_block.type === 'tool_use') {
            responseContent.push(event.content_block);
          }
        } else if (event.type === 'content_block_delta') {
          // Stream text deltas to user
          if (event.delta.type === 'text_delta') {
            yield event.delta.text;

            // Update the last text block
            const lastBlock = responseContent[responseContent.length - 1];
            if (lastBlock && lastBlock.type === 'text') {
              lastBlock.text += event.delta.text;
            }
          } else if (event.delta.type === 'input_json_delta') {
            // Update tool use input
            const lastBlock = responseContent[responseContent.length - 1];
            if (lastBlock && lastBlock.type === 'tool_use') {
              const currentInput = JSON.stringify(lastBlock.input || {});
              lastBlock.input = JSON.parse(
                currentInput + event.delta.partial_json
              );
            }
          }
        } else if (event.type === 'message_delta') {
          // Capture stop reason
          if (event.delta.stop_reason) {
            stopReason = event.delta.stop_reason;
          }
        }
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: responseContent,
      });

      // Check if we need to execute tools
      const toolUses = responseContent.filter(
        (block): block is ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUses.length > 0) {
        if (options?.verbose) {
          yield `\n[Executing ${toolUses.length} tool(s)...]\n`;
        }

        // Execute all tool calls
        const toolResults: Array<{
          type: 'tool_result';
          tool_use_id: string;
          content: string;
        }> = [];

        for (const toolUse of toolUses) {
          const { id, name, input } = toolUse;

          if (options?.verbose) {
            yield `  → ${name}(...)\n`;
          }

          const result = await this.executeTool(
            name,
            input as Record<string, unknown>
          );

          if (options?.verbose) {
            const resultPreview =
              result.substring(0, 100) + (result.length > 100 ? '...' : '');
            yield `  ← ${resultPreview}\n`;
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

      // No more tool calls, we're done
      if (stopReason === 'end_turn') {
        return;
      }

      // Max tokens or stop sequence reached
      if (stopReason === 'max_tokens' || stopReason === 'stop_sequence') {
        yield '\n[Response truncated due to length limit]';
        return;
      }

      // If we have text, we're done
      const hasText = responseContent.some((block) => block.type === 'text');
      if (hasText) {
        return;
      }
    }

    yield '\n[Max turns reached without completion]';
  }

  /**
   * Get agent info
   */
  getAgentInfo(): {
    name: string;
    model: string;
    tools: string[];
    provider: string;
  } {
    return {
      name: this.manifest.metadata.name,
      model: this.getModel(),
      tools: Array.from(this.tools.keys()),
      provider: 'anthropic',
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): MessageParam[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get available tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get the Anthropic client (for advanced usage)
   */
  getClient(): Anthropic {
    return this.client;
  }
}
