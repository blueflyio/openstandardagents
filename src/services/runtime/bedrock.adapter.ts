/**
 * AWS Bedrock Runtime Adapter
 * Runs OSSA agents using AWS Bedrock with support for Claude and Titan models
 * Supports streaming via InvokeModelWithResponseStream and tool calling via Converse API
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  ConverseCommand,
  ConverseStreamCommand,
  type Message,
  type ContentBlock,
  type Tool,
  type ToolResultBlock,
  type ToolUseBlock,
  type ToolSpecification,
  type ToolInputSchema,
} from '@aws-sdk/client-bedrock-runtime';
import type { OssaAgent } from '../../types/index.js';

/**
 * Bedrock extension from OSSA manifest
 */
export interface BedrockExtension {
  enabled?: boolean;
  region: string;
  profile?: string;
  model_id: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop_sequences?: string[];
  tools?: ToolSpecification[];
}

/**
 * Extended OSSA manifest with Bedrock extension
 */
export interface OssaManifestWithBedrock extends OssaAgent {
  extensions?: {
    bedrock?: BedrockExtension;
    [key: string]: unknown;
  };
}

/**
 * Runtime options for Bedrock adapter
 */
export interface BedrockRunOptions {
  verbose?: boolean;
  maxTurns?: number;
  stream?: boolean;
}

/**
 * Tool definition with handler
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
  handler?: (args: Record<string, unknown>) => Promise<string>;
}

/**
 * Agent information
 */
export interface AgentInfo {
  name: string;
  model: string;
  tools: string[];
  provider: 'bedrock';
  region: string;
}

/**
 * AWS Bedrock adapter for executing OSSA agents with Claude and Titan models
 *
 * Supported models:
 * - Claude 3.5 Sonnet: anthropic.claude-3-5-sonnet-20241022-v2:0
 * - Claude 3 Sonnet: anthropic.claude-3-sonnet-20240229-v1:0
 * - Claude 3 Haiku: anthropic.claude-3-haiku-20240307-v1:0
 * - Claude 3 Opus: anthropic.claude-3-opus-20240229-v1:0
 * - Titan Text G1: amazon.titan-text-express-v1
 * - Titan Text Premier: amazon.titan-text-premier-v1:0
 */
export class BedrockAdapter {
  private client: BedrockRuntimeClient;
  private manifest: OssaManifestWithBedrock;
  private tools: Map<string, ToolDefinition> = new Map();
  private conversationHistory: Message[] = [];
  private region: string;
  private modelId: string;

  constructor(
    manifest: OssaManifestWithBedrock,
    config?: { profile?: string }
  ) {
    this.manifest = manifest;

    // Get configuration from manifest extension
    const bedrockExt = manifest.extensions?.bedrock;
    if (!bedrockExt) {
      throw new Error(
        'Bedrock extension required in manifest.extensions.bedrock'
      );
    }

    this.region = bedrockExt.region;
    this.modelId = bedrockExt.model_id;

    // Initialize Bedrock client
    const clientConfig: any = {
      region: this.region,
    };

    // Use profile if specified (either from constructor or manifest)
    const profile = config?.profile || bedrockExt.profile;
    if (profile) {
      // AWS SDK v3 uses shared credentials provider automatically
      // The profile will be read from ~/.aws/credentials
      process.env.AWS_PROFILE = profile;
    }

    this.client = new BedrockRuntimeClient(clientConfig);
  }

  /**
   * Get the model ID to use from manifest
   */
  private getModelId(): string {
    return this.modelId;
  }

  /**
   * Check if model supports Converse API (required for tool calling)
   * Claude 3+ and Titan models support Converse API
   */
  private supportsConverseAPI(): boolean {
    return (
      this.modelId.startsWith('anthropic.claude-3') ||
      this.modelId.startsWith('anthropic.claude-3-5') ||
      this.modelId.startsWith('amazon.titan-text')
    );
  }

  /**
   * Get system prompt from manifest
   */
  private getSystemPrompt(): string {
    // Check Bedrock extension first
    if (this.manifest.extensions?.bedrock?.system) {
      return this.manifest.extensions.bedrock.system;
    }
    // Fall back to role
    return this.manifest.spec?.role || 'You are a helpful AI assistant.';
  }

  /**
   * Get max tokens configuration
   */
  private getMaxTokens(): number {
    // Check Bedrock extension first
    if (this.manifest.extensions?.bedrock?.max_tokens) {
      return this.manifest.extensions.bedrock.max_tokens;
    }
    // Fall back to LLM config
    if (this.manifest.spec?.llm?.maxTokens) {
      return this.manifest.spec.llm.maxTokens;
    }
    // Default
    return 4096;
  }

  /**
   * Get temperature configuration
   */
  private getTemperature(): number {
    // Check Bedrock extension first
    if (this.manifest.extensions?.bedrock?.temperature !== undefined) {
      return this.manifest.extensions.bedrock.temperature;
    }
    // Fall back to LLM config
    if (this.manifest.spec?.llm?.temperature !== undefined) {
      return this.manifest.spec.llm.temperature;
    }
    // Default
    return 1.0;
  }

  /**
   * Get top_p configuration
   */
  private getTopP(): number | undefined {
    // Check Bedrock extension first
    if (this.manifest.extensions?.bedrock?.top_p !== undefined) {
      return this.manifest.extensions.bedrock.top_p;
    }
    // Fall back to LLM config
    if (this.manifest.spec?.llm?.topP !== undefined) {
      return this.manifest.spec.llm.topP;
    }
    return undefined;
  }

  /**
   * Get stop sequences
   */
  private getStopSequences(): string[] | undefined {
    return this.manifest.extensions?.bedrock?.stop_sequences;
  }

  /**
   * Convert OSSA tools to Bedrock tool format
   */
  private getBedrockTools(): ToolSpecification[] {
    const bedrockTools: ToolSpecification[] = [];

    // Check for tools in Bedrock extension (highest priority)
    const extensionTools = this.manifest.extensions?.bedrock?.tools;
    if (extensionTools) {
      for (const tool of extensionTools) {
        // Skip tools with missing required fields
        if (!tool.name || !tool.inputSchema) {
          continue;
        }

        const toolDef: ToolDefinition = {
          name: tool.name,
          description: tool.description || '',
          input_schema: tool.inputSchema,
        };
        this.tools.set(tool.name, toolDef);
        bedrockTools.push(tool);
      }
    }

    // Also check spec.tools for basic tool definitions
    if (this.manifest.spec?.tools) {
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

          bedrockTools.push({
            name: tool.name,
            description: toolDef.description,
            inputSchema: inputSchema,
          });
        }
      }
    }

    return bedrockTools;
  }

  /**
   * Generate input schema from OSSA tool spec
   */
  private generateInputSchema(tool: {
    type: string;
    config?: Record<string, unknown>;
  }): ToolInputSchema {
    // Check if config has schema information
    if (tool.config && typeof tool.config === 'object') {
      if ('input_schema' in tool.config) {
        const inputSchema = tool.config.input_schema as any;
        if (
          inputSchema &&
          typeof inputSchema === 'object' &&
          'json' in inputSchema
        ) {
          return inputSchema as ToolInputSchema;
        }
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
        json: {
          type: 'object',
          properties,
        },
      } as ToolInputSchema;
    }

    // Default schema based on transport type
    const baseSchema: Record<string, unknown> = {
      type: 'object',
      properties: {},
    };

    switch (tool.type) {
      case 'mcp':
        baseSchema.properties = {
          input: {
            type: 'string',
            description: 'Input data',
          },
        };
        baseSchema.required = ['input'];
        break;

      case 'http':
        baseSchema.properties = {
          method: {
            type: 'string',
            description: 'HTTP method',
          },
          body: {
            type: 'object',
            description: 'Request body',
          },
        };
        baseSchema.required = ['method'];
        break;

      case 'function':
        baseSchema.properties = {
          args: {
            type: 'object',
            description: 'Function arguments',
          },
        };
        break;
    }

    return { json: baseSchema } as ToolInputSchema;
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
          json: {
            type: 'object',
            properties: {},
          },
        } as ToolInputSchema,
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
   * Send a message and get a response using Converse API (with tool support)
   */
  async chat(
    userMessage: string,
    options?: BedrockRunOptions
  ): Promise<string> {
    if (!this.supportsConverseAPI()) {
      // Fall back to basic InvokeModel for models without Converse API
      return this.chatBasic(userMessage, options);
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: [{ text: userMessage }],
    });

    const tools = this.getBedrockTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        console.log(`\n[Turn ${turnCount}/${maxTurns}]`);
      }

      // Prepare Converse API request
      const converseParams: any = {
        modelId: this.getModelId(),
        messages: this.conversationHistory,
        system: [{ text: this.getSystemPrompt() }],
        inferenceConfig: {
          maxTokens: this.getMaxTokens(),
          temperature: this.getTemperature(),
          topP: this.getTopP(),
          stopSequences: this.getStopSequences(),
        },
      };

      // Add tools if available
      if (tools.length > 0) {
        converseParams.toolConfig = {
          tools: tools.map((tool) => ({
            toolSpec: {
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            },
          })),
        };
      }

      // Call Bedrock Converse API
      const command = new ConverseCommand(converseParams);
      const response = await this.client.send(command);

      if (options?.verbose) {
        console.log(
          `  Model: ${this.getModelId()}, Stop: ${response.stopReason}`
        );
        console.log(
          `  Tokens: ${response.usage?.inputTokens || 0} in, ${response.usage?.outputTokens || 0} out`
        );
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.output?.message?.content || [],
      });

      // Check if we need to execute tools
      const toolUses = (response.output?.message?.content || []).filter(
        (block): block is ContentBlock & { toolUse: ToolUseBlock } =>
          'toolUse' in block
      );

      if (toolUses.length > 0) {
        if (options?.verbose) {
          console.log(`  [Executing ${toolUses.length} tool(s)...]`);
        }

        // Execute all tool calls
        const toolResults: ContentBlock[] = [];

        for (const toolUseBlock of toolUses) {
          const { toolUseId, name, input } = toolUseBlock.toolUse;

          if (options?.verbose) {
            const inputPreview =
              JSON.stringify(input).substring(0, 100) +
              (JSON.stringify(input).length > 100 ? '...' : '');
            console.log(`    → ${name}(${inputPreview})`);
          }

          const result = await this.executeTool(
            name!,
            (input as Record<string, unknown>) || {}
          );

          if (options?.verbose) {
            const resultPreview =
              result.substring(0, 100) + (result.length > 100 ? '...' : '');
            console.log(`    ← ${resultPreview}`);
          }

          toolResults.push({
            toolResult: {
              toolUseId: toolUseId!,
              content: [{ text: result }],
            },
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

      // Extract text response
      const textBlocks = (response.output?.message?.content || []).filter(
        (block: any): block is { text: string } => 'text' in block
      );

      if (textBlocks.length > 0) {
        return textBlocks.map((block) => block.text).join('\n');
      }

      // Check stop reason
      if (response.stopReason === 'end_turn') {
        return '';
      }

      if (response.stopReason === 'max_tokens') {
        return '[Response truncated due to length limit]';
      }
    }

    return '[Max turns reached without completion]';
  }

  /**
   * Basic chat without tool support (for models that don't support Converse API)
   */
  private async chatBasic(
    userMessage: string,
    options?: BedrockRunOptions
  ): Promise<string> {
    // Build prompt for basic InvokeModel API
    const prompt = this.buildPrompt(userMessage);

    const requestBody = JSON.stringify({
      prompt,
      max_tokens_to_sample: this.getMaxTokens(),
      temperature: this.getTemperature(),
      top_p: this.getTopP(),
      stop_sequences: this.getStopSequences(),
    });

    const command = new InvokeModelCommand({
      modelId: this.getModelId(),
      contentType: 'application/json',
      accept: 'application/json',
      body: requestBody,
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract completion based on model type
    if (this.modelId.startsWith('anthropic.claude')) {
      return responseBody.completion || '';
    } else if (this.modelId.startsWith('amazon.titan')) {
      return responseBody.results?.[0]?.outputText || '';
    }

    return JSON.stringify(responseBody);
  }

  /**
   * Build prompt for basic models
   */
  private buildPrompt(userMessage: string): string {
    const systemPrompt = this.getSystemPrompt();

    if (this.modelId.startsWith('anthropic.claude')) {
      return `\n\nHuman: ${systemPrompt}\n\n${userMessage}\n\nAssistant:`;
    } else if (this.modelId.startsWith('amazon.titan')) {
      return `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;
    }

    return userMessage;
  }

  /**
   * Stream a response with tool support using ConverseStream API
   */
  async *chatStream(
    userMessage: string,
    options?: BedrockRunOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.supportsConverseAPI()) {
      // Fall back to basic streaming for models without Converse API
      yield* this.chatStreamBasic(userMessage, options);
      return;
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: [{ text: userMessage }],
    });

    const tools = this.getBedrockTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        yield `\n[Turn ${turnCount}/${maxTurns}]\n`;
      }

      // Prepare ConverseStream API request
      const converseParams: any = {
        modelId: this.getModelId(),
        messages: this.conversationHistory,
        system: [{ text: this.getSystemPrompt() }],
        inferenceConfig: {
          maxTokens: this.getMaxTokens(),
          temperature: this.getTemperature(),
          topP: this.getTopP(),
          stopSequences: this.getStopSequences(),
        },
      };

      // Add tools if available
      if (tools.length > 0) {
        converseParams.toolConfig = {
          tools: tools.map((tool) => ({
            toolSpec: {
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            },
          })),
        };
      }

      // Stream the response
      const command = new ConverseStreamCommand(converseParams);
      const response = await this.client.send(command);

      // Collect response content for history
      const responseContent: ContentBlock[] = [];
      let currentToolUse: ToolUseBlock | null = null;
      let currentText = '';
      let stopReason: string | null = null;

      if (response.stream) {
        for await (const event of response.stream) {
          if (event.contentBlockStart) {
            if (event.contentBlockStart.start?.toolUse) {
              currentToolUse = {
                toolUseId: event.contentBlockStart.start.toolUse.toolUseId,
                name: event.contentBlockStart.start.toolUse.name,
                input: {},
              };
            }
          } else if (event.contentBlockDelta) {
            if (event.contentBlockDelta.delta?.text) {
              const text = event.contentBlockDelta.delta.text;
              currentText += text;
              yield text;
            } else if (event.contentBlockDelta.delta?.toolUse) {
              // Accumulate tool input
              if (currentToolUse) {
                const inputDelta =
                  event.contentBlockDelta.delta.toolUse.input || '';
                const currentInput = JSON.stringify(currentToolUse.input || {});
                currentToolUse.input = JSON.parse(currentInput + inputDelta);
              }
            }
          } else if (event.contentBlockStop) {
            if (currentText) {
              responseContent.push({ text: currentText });
              currentText = '';
            }
            if (currentToolUse) {
              responseContent.push({ toolUse: currentToolUse });
              currentToolUse = null;
            }
          } else if (event.messageStop) {
            stopReason = event.messageStop.stopReason || null;
          }
        }
      }

      // Add any remaining text
      if (currentText) {
        responseContent.push({ text: currentText });
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: responseContent,
      });

      // Check if we need to execute tools
      const toolUses = responseContent.filter(
        (block): block is ContentBlock & { toolUse: ToolUseBlock } =>
          'toolUse' in block
      );

      if (toolUses.length > 0) {
        if (options?.verbose) {
          yield `\n[Executing ${toolUses.length} tool(s)...]\n`;
        }

        // Execute all tool calls
        const toolResults: ContentBlock[] = [];

        for (const toolUseBlock of toolUses) {
          const { toolUseId, name, input } = toolUseBlock.toolUse;

          if (options?.verbose) {
            yield `  → ${name}(...)\n`;
          }

          const result = await this.executeTool(
            name!,
            (input as Record<string, unknown>) || {}
          );

          if (options?.verbose) {
            const resultPreview =
              result.substring(0, 100) + (result.length > 100 ? '...' : '');
            yield `  ← ${resultPreview}\n`;
          }

          toolResults.push({
            toolResult: {
              toolUseId: toolUseId!,
              content: [{ text: result }],
            },
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

      if (stopReason === 'max_tokens') {
        yield '\n[Response truncated due to length limit]';
        return;
      }

      // If we have text, we're done
      const hasText = responseContent.some(
        (block: ContentBlock) => 'text' in block
      );
      if (hasText) {
        return;
      }
    }

    yield '\n[Max turns reached without completion]';
  }

  /**
   * Basic streaming without tool support
   */
  private async *chatStreamBasic(
    userMessage: string,
    options?: BedrockRunOptions
  ): AsyncGenerator<string, void, unknown> {
    const prompt = this.buildPrompt(userMessage);

    const requestBody = JSON.stringify({
      prompt,
      max_tokens_to_sample: this.getMaxTokens(),
      temperature: this.getTemperature(),
      top_p: this.getTopP(),
      stop_sequences: this.getStopSequences(),
    });

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.getModelId(),
      contentType: 'application/json',
      accept: 'application/json',
      body: requestBody,
    });

    const response = await this.client.send(command);

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

          // Extract text based on model type
          if (this.modelId.startsWith('anthropic.claude')) {
            if (chunk.completion) {
              yield chunk.completion;
            }
          } else if (this.modelId.startsWith('amazon.titan')) {
            if (chunk.outputText) {
              yield chunk.outputText;
            }
          }
        }
      }
    }
  }

  /**
   * Get agent info
   */
  getAgentInfo(): AgentInfo {
    return {
      name: this.manifest.metadata?.name || 'unknown',
      model: this.getModelId(),
      tools: Array.from(this.tools.keys()),
      provider: 'bedrock',
      region: this.region,
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Message[] {
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
   * Get the Bedrock client (for advanced usage)
   */
  getClient(): BedrockRuntimeClient {
    return this.client;
  }
}
