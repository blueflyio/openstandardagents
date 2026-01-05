/**
 * Mistral AI Runtime Adapter
 * Runs OSSA agents using Mistral AI's API with streaming and function calling support
 *
 * Supported Models:
 * - mistral-large-latest (Mistral Large 2)
 * - mistral-medium-latest (Mistral Medium)
 * - mistral-small-latest (Mistral Small)
 * - mistral-tiny (Mistral 7B)
 * - mixtral-8x7b-instruct (Mixtral 8x7B)
 * - mixtral-8x22b-instruct (Mixtral 8x22B)
 * - open-mistral-7b
 * - open-mixtral-8x7b
 * - open-mixtral-8x22b
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * Mistral chat message format
 */
export interface MistralMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: MistralToolCall[];
  tool_call_id?: string;
}

/**
 * Mistral tool call format
 */
export interface MistralToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Mistral tool definition (OpenAI-compatible format)
 */
export interface MistralTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Tool definition with handler
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler?: (args: Record<string, unknown>) => Promise<string>;
}

/**
 * Runtime options for Mistral adapter
 */
export interface MistralRunOptions {
  verbose?: boolean;
  maxTurns?: number;
  stream?: boolean;
}

/**
 * Mistral adapter configuration
 */
export interface MistralAdapterConfig {
  manifest: OssaAgent;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Mistral API response for chat completion
 */
interface MistralChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: MistralToolCall[];
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Mistral API streaming chunk
 */
interface MistralStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }>;
}

/**
 * Mistral API error response
 */
interface MistralErrorResponse {
  message: string;
  type: string;
  param?: string;
  code?: string;
}

/**
 * Agent information
 */
export interface AgentInfo {
  name: string;
  model: string;
  tools: string[];
  provider: 'mistral';
}

/**
 * Mistral extension from OSSA manifest
 */
export interface MistralExtension {
  enabled?: boolean;
  model?: string;
  api_key?: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  random_seed?: number;
  safe_mode?: boolean;
  safe_prompt?: boolean;
  tools?: MistralTool[];
}

/**
 * Extended OSSA manifest with Mistral extension
 */
export interface OssaManifestWithMistral extends OssaAgent {
  extensions?: {
    mistral?: MistralExtension;
    [key: string]: unknown;
  };
}

/**
 * Mistral adapter for executing OSSA agents with Mistral AI models
 */
export class MistralAdapter {
  private manifest: OssaManifestWithMistral;
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private tools: Map<string, ToolDefinition> = new Map();
  private messages: MistralMessage[] = [];

  constructor(config: MistralAdapterConfig) {
    this.manifest = config.manifest as OssaManifestWithMistral;

    // Get API key from config, extension, or environment
    this.apiKey =
      config.apiKey ||
      this.manifest.extensions?.mistral?.api_key ||
      process.env.MISTRAL_API_KEY ||
      '';

    if (!this.apiKey) {
      throw new Error(
        'Mistral API key is required. Provide it via config, manifest extensions.mistral.api_key, or MISTRAL_API_KEY environment variable.'
      );
    }

    this.baseUrl = config.baseUrl || 'https://api.mistral.ai/v1';
    this.timeout = config.timeout || 60000; // 60 seconds default
  }

  /**
   * Get the model to use from manifest
   * Supports: mistral-large, mistral-medium, mistral-small, mixtral models
   */
  private getModel(): string {
    // Check Mistral extension first
    if (this.manifest.extensions?.mistral?.model) {
      return this.manifest.extensions.mistral.model;
    }
    // Fall back to LLM config
    if (this.manifest.spec?.llm?.model) {
      return this.manifest.spec.llm.model;
    }
    // Default to mistral-large-latest (most capable model)
    return 'mistral-large-latest';
  }

  /**
   * Get system prompt from manifest
   */
  private getSystemPrompt(): string {
    // Check Mistral extension first
    if (this.manifest.extensions?.mistral?.system) {
      return this.manifest.extensions.mistral.system;
    }
    // Fall back to role
    if (this.manifest.spec?.role) {
      return this.manifest.spec.role;
    }
    return 'You are a helpful AI assistant.';
  }

  /**
   * Get temperature from manifest
   */
  private getTemperature(): number {
    if (this.manifest.extensions?.mistral?.temperature !== undefined) {
      return this.manifest.extensions.mistral.temperature;
    }
    if (this.manifest.spec?.llm?.temperature !== undefined) {
      return this.manifest.spec.llm.temperature;
    }
    return 0.7;
  }

  /**
   * Get max_tokens from manifest
   */
  private getMaxTokens(): number | undefined {
    if (this.manifest.extensions?.mistral?.max_tokens !== undefined) {
      return this.manifest.extensions.mistral.max_tokens;
    }
    if (this.manifest.spec?.llm?.maxTokens !== undefined) {
      return this.manifest.spec.llm.maxTokens;
    }
    return undefined;
  }

  /**
   * Get top_p from manifest
   */
  private getTopP(): number | undefined {
    if (this.manifest.extensions?.mistral?.top_p !== undefined) {
      return this.manifest.extensions.mistral.top_p;
    }
    if (this.manifest.spec?.llm?.topP !== undefined) {
      return this.manifest.spec.llm.topP;
    }
    return undefined;
  }

  /**
   * Get random_seed from manifest
   */
  private getRandomSeed(): number | undefined {
    return this.manifest.extensions?.mistral?.random_seed;
  }

  /**
   * Get safe_mode setting from manifest
   */
  private getSafeMode(): boolean {
    return this.manifest.extensions?.mistral?.safe_mode ?? false;
  }

  /**
   * Get safe_prompt setting from manifest
   */
  private getSafePrompt(): boolean {
    return this.manifest.extensions?.mistral?.safe_prompt ?? false;
  }

  /**
   * Convert OSSA tools to Mistral function calling format
   */
  private getMistralTools(): MistralTool[] {
    const mistralTools: MistralTool[] = [];

    // Check for tools in Mistral extension first
    const mistralExt = this.manifest.extensions?.mistral;
    if (mistralExt?.tools) {
      for (const tool of mistralExt.tools) {
        const toolDef: ToolDefinition = {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        };
        this.tools.set(toolDef.name, toolDef);
        mistralTools.push(tool);
      }
    }

    // Also check spec.tools for basic tool definitions
    if (this.manifest.spec?.tools) {
      for (const tool of this.manifest.spec.tools) {
        if (tool.name && !this.tools.has(tool.name)) {
          // Generate input schema based on tool config
          const parameters = this.generateParametersSchema(tool);

          const toolDef: ToolDefinition = {
            name: tool.name,
            description: `Execute ${tool.name} (${tool.type})`,
            parameters,
          };
          this.tools.set(tool.name, toolDef);

          mistralTools.push({
            type: 'function',
            function: {
              name: tool.name,
              description: toolDef.description,
              parameters,
            },
          });
        }
      }
    }

    return mistralTools;
  }

  /**
   * Generate parameters schema from OSSA tool spec
   */
  private generateParametersSchema(tool: {
    type: string;
    config?: Record<string, unknown>;
  }): Record<string, unknown> {
    // Check if config has schema information
    if (tool.config && typeof tool.config === 'object') {
      if ('parameters' in tool.config) {
        return tool.config.parameters as Record<string, unknown>;
      }
      if ('input_schema' in tool.config) {
        return tool.config.input_schema as Record<string, unknown>;
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
      // Create a new tool definition if it doesn't exist
      this.tools.set(name, {
        name,
        description: `Execute ${name}`,
        parameters: {
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
   * Make a request to Mistral API
   */
  private async makeRequest(
    endpoint: string,
    body: Record<string, unknown>,
    stream = false
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json()) as MistralErrorResponse;
        throw new Error(
          `Mistral API error (${response.status}): ${errorData.message || 'Unknown error'}`
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Initialize the conversation
   */
  initialize(): void {
    this.messages = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
    ];
  }

  /**
   * Send a message and get a response (non-streaming)
   */
  async chat(userMessage: string, options?: MistralRunOptions): Promise<string> {
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.getMistralTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        console.log(`\n[Turn ${turnCount}/${maxTurns}]`);
      }

      // Prepare request body
      const requestBody: Record<string, unknown> = {
        model: this.getModel(),
        messages: this.messages,
        temperature: this.getTemperature(),
      };

      // Add optional parameters
      const maxTokens = this.getMaxTokens();
      if (maxTokens !== undefined) {
        requestBody.max_tokens = maxTokens;
      }

      const topP = this.getTopP();
      if (topP !== undefined) {
        requestBody.top_p = topP;
      }

      const randomSeed = this.getRandomSeed();
      if (randomSeed !== undefined) {
        requestBody.random_seed = randomSeed;
      }

      if (this.getSafeMode()) {
        requestBody.safe_mode = true;
      }

      if (this.getSafePrompt()) {
        requestBody.safe_prompt = true;
      }

      // Add tools if available
      if (tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
      }

      // Call Mistral API
      const response = await this.makeRequest('/chat/completions', requestBody);
      const data = (await response.json()) as MistralChatResponse;

      if (options?.verbose) {
        console.log(`  Model: ${data.model}, Finish: ${data.choices[0]?.finish_reason}`);
        console.log(
          `  Tokens: ${data.usage.prompt_tokens} in, ${data.usage.completion_tokens} out`
        );
      }

      const choice = data.choices[0];
      if (!choice) {
        throw new Error('No response from Mistral API');
      }

      // Add assistant response to history
      this.messages.push({
        role: 'assistant',
        content: choice.message.content || '',
        tool_calls: choice.message.tool_calls,
      });

      // Check if we need to execute tools
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        if (options?.verbose) {
          console.log(`  [Executing ${choice.message.tool_calls.length} tool(s)...]`);
        }

        // Execute all tool calls
        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type !== 'function') continue;

          const { id, function: func } = toolCall;
          const args = JSON.parse(func.arguments);

          if (options?.verbose) {
            const argsPreview =
              JSON.stringify(args).substring(0, 100) +
              (JSON.stringify(args).length > 100 ? '...' : '');
            console.log(`    → ${func.name}(${argsPreview})`);
          }

          const result = await this.executeTool(func.name, args);

          if (options?.verbose) {
            const resultPreview =
              result.substring(0, 100) + (result.length > 100 ? '...' : '');
            console.log(`    ← ${resultPreview}`);
          }

          // Add tool result to messages
          this.messages.push({
            role: 'tool',
            content: result,
            tool_call_id: id,
          });
        }

        // Continue the loop to get final response
        continue;
      }

      // No tool calls, return the response
      if (choice.message.content) {
        return choice.message.content;
      }

      // Check finish reason
      if (choice.finish_reason === 'length') {
        return '[Response truncated due to length limit]';
      }

      if (choice.finish_reason === 'content_filter') {
        return '[Response blocked by content filter]';
      }

      if (choice.finish_reason === 'stop') {
        return choice.message.content || '';
      }
    }

    return '[Max turns reached without completion]';
  }

  /**
   * Stream a response with tool support
   */
  async *chatStream(
    userMessage: string,
    options?: MistralRunOptions
  ): AsyncGenerator<string, void, unknown> {
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.getMistralTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        yield `\n[Turn ${turnCount}/${maxTurns}]\n`;
      }

      // Prepare request body
      const requestBody: Record<string, unknown> = {
        model: this.getModel(),
        messages: this.messages,
        temperature: this.getTemperature(),
        stream: true,
      };

      // Add optional parameters
      const maxTokens = this.getMaxTokens();
      if (maxTokens !== undefined) {
        requestBody.max_tokens = maxTokens;
      }

      const topP = this.getTopP();
      if (topP !== undefined) {
        requestBody.top_p = topP;
      }

      const randomSeed = this.getRandomSeed();
      if (randomSeed !== undefined) {
        requestBody.random_seed = randomSeed;
      }

      if (this.getSafeMode()) {
        requestBody.safe_mode = true;
      }

      if (this.getSafePrompt()) {
        requestBody.safe_prompt = true;
      }

      // Add tools if available
      if (tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
      }

      // Call Mistral API with streaming
      const response = await this.makeRequest('/chat/completions', requestBody, true);

      // Process stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = '';
      const toolCalls: MistralToolCall[] = [];
      let finishReason: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;

            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') continue;

            try {
              const chunk = JSON.parse(data) as MistralStreamChunk;
              const delta = chunk.choices[0]?.delta;

              if (!delta) continue;

              // Handle content
              if (delta.content) {
                assistantMessage += delta.content;
                yield delta.content;
              }

              // Handle tool calls
              if (delta.tool_calls) {
                for (const toolCallDelta of delta.tool_calls) {
                  const index = toolCallDelta.index;

                  // Initialize tool call if needed
                  if (!toolCalls[index]) {
                    toolCalls[index] = {
                      id: toolCallDelta.id || '',
                      type: 'function',
                      function: {
                        name: '',
                        arguments: '',
                      },
                    };
                  }

                  // Update tool call
                  if (toolCallDelta.id) {
                    toolCalls[index].id = toolCallDelta.id;
                  }
                  if (toolCallDelta.function?.name) {
                    toolCalls[index].function.name = toolCallDelta.function.name;
                  }
                  if (toolCallDelta.function?.arguments) {
                    toolCalls[index].function.arguments += toolCallDelta.function.arguments;
                  }
                }
              }

              // Capture finish reason
              if (chunk.choices[0]?.finish_reason) {
                finishReason = chunk.choices[0].finish_reason;
              }
            } catch (parseError) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Add assistant response to history
      this.messages.push({
        role: 'assistant',
        content: assistantMessage,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      });

      // Check if we need to execute tools
      if (toolCalls.length > 0) {
        if (options?.verbose) {
          yield `\n[Executing ${toolCalls.length} tool(s)...]\n`;
        }

        // Execute all tool calls
        for (const toolCall of toolCalls) {
          if (toolCall.type !== 'function') continue;

          const { id, function: func } = toolCall;
          const args = JSON.parse(func.arguments);

          if (options?.verbose) {
            yield `  → ${func.name}(...)\n`;
          }

          const result = await this.executeTool(func.name, args);

          if (options?.verbose) {
            const resultPreview =
              result.substring(0, 100) + (result.length > 100 ? '...' : '');
            yield `  ← ${resultPreview}\n`;
          }

          // Add tool result to messages
          this.messages.push({
            role: 'tool',
            content: result,
            tool_call_id: id,
          });
        }

        // Continue the loop to get final response
        continue;
      }

      // No more tool calls, we're done
      if (finishReason === 'stop') {
        return;
      }

      if (finishReason === 'length') {
        yield '\n[Response truncated due to length limit]';
        return;
      }

      if (finishReason === 'content_filter') {
        yield '\n[Response blocked by content filter]';
        return;
      }

      // If we have content, we're done
      if (assistantMessage) {
        return;
      }
    }

    yield '\n[Max turns reached without completion]';
  }

  /**
   * Get agent info
   */
  getAgentInfo(): AgentInfo {
    return {
      name: this.manifest.metadata?.name || 'unknown',
      model: this.getModel(),
      tools: Array.from(this.tools.keys()),
      provider: 'mistral',
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): MistralMessage[] {
    return this.messages;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.messages = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
    ];
  }

  /**
   * Get available tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
