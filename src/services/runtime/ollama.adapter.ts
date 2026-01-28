/**
 * Ollama Runtime Adapter
 * Runs OSSA agents using Ollama's local LLM API
 * Supports llama3.2, mistral, codellama, and other local models
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * Ollama chat message format
 */
export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: OllamaToolCall[];
}

/**
 * Ollama tool call format
 */
export interface OllamaToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Ollama tool definition (OpenAI-compatible format)
 */
export interface OllamaTool {
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
 * Runtime options for Ollama adapter
 */
export interface OllamaRunOptions {
  verbose?: boolean;
  maxTurns?: number;
  stream?: boolean;
}

/**
 * Ollama adapter configuration
 */
export interface OllamaAdapterConfig {
  manifest: OssaAgent;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Ollama API response for chat completion
 */
interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ollama API streaming chunk
 */
interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
}

/**
 * Ollama API error response
 */
interface OllamaErrorResponse {
  error: string;
}

/**
 * Agent information
 */
export interface AgentInfo {
  name: string;
  model: string;
  tools: string[];
  provider: 'ollama';
}

/**
 * Ollama extension from OSSA manifest
 */
export interface OllamaExtension {
  enabled?: boolean;
  model?: string;
  system?: string;
  temperature?: number;
  num_predict?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  seed?: number;
  stop?: string[];
  tools?: OllamaTool[];
}

/**
 * Extended OSSA manifest with Ollama extension
 */
export interface OssaManifestWithOllama extends OssaAgent {
  extensions?: {
    ollama?: OllamaExtension;
    [key: string]: unknown;
  };
}

/**
 * Ollama adapter for executing OSSA agents with local models
 */
export class OllamaAdapter {
  private manifest: OssaManifestWithOllama;
  private baseUrl: string;
  private timeout: number;
  private tools: Map<string, ToolDefinition> = new Map();
  private messages: OllamaMessage[] = [];

  constructor(config: OllamaAdapterConfig) {
    this.manifest = config.manifest as OssaManifestWithOllama;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.timeout = config.timeout || 60000; // 60 seconds default
  }

  /**
   * Get the model to use from manifest
   */
  private getModel(): string {
    // Check Ollama extension first
    if (this.manifest.extensions?.ollama?.model) {
      return this.manifest.extensions.ollama.model;
    }
    // Fall back to LLM config
    if (this.manifest.spec?.llm?.model) {
      return this.manifest.spec.llm.model;
    }
    // Default to llama3.2
    return 'llama3.2';
  }

  /**
   * Get system prompt from manifest
   */
  private getSystemPrompt(): string {
    // Check Ollama extension first
    if (this.manifest.extensions?.ollama?.system) {
      return this.manifest.extensions.ollama.system;
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
    if (this.manifest.extensions?.ollama?.temperature !== undefined) {
      return this.manifest.extensions.ollama.temperature;
    }
    if (this.manifest.spec?.llm?.temperature !== undefined) {
      return this.manifest.spec.llm.temperature;
    }
    return 0.7;
  }

  /**
   * Get num_predict (max tokens) from manifest
   */
  private getNumPredict(): number | undefined {
    if (this.manifest.extensions?.ollama?.num_predict !== undefined) {
      return this.manifest.extensions.ollama.num_predict;
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
    if (this.manifest.extensions?.ollama?.top_p !== undefined) {
      return this.manifest.extensions.ollama.top_p;
    }
    if (this.manifest.spec?.llm?.topP !== undefined) {
      return this.manifest.spec.llm.topP;
    }
    return undefined;
  }

  /**
   * Convert OSSA tools to Ollama function calling format
   */
  private getOllamaTools(): OllamaTool[] {
    const ollamaTools: OllamaTool[] = [];

    // Check for tools in Ollama extension first
    const ollamaExt = this.manifest.extensions?.ollama;
    if (ollamaExt?.tools) {
      for (const tool of ollamaExt.tools) {
        const toolDef: ToolDefinition = {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        };
        this.tools.set(toolDef.name, toolDef);
        ollamaTools.push(tool);
      }
    }

    // Also check spec.tools for basic tool definitions
    if (this.manifest.spec?.tools) {
      for (const tool of this.manifest.spec.tools) {
        if (tool.name && !this.tools.has(tool.name)) {
          const toolDef: ToolDefinition = {
            name: tool.name,
            description: `Execute ${tool.name} (${tool.type})`,
            parameters: {
              type: 'object',
              properties: {},
              required: [],
            },
          };
          this.tools.set(tool.name, toolDef);

          ollamaTools.push({
            type: 'function',
            function: {
              name: tool.name,
              description: toolDef.description,
              parameters: toolDef.parameters,
            },
          });
        }
      }
    }

    return ollamaTools;
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
          required: [],
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
      args,
      note: 'No handler registered for this tool',
    });
  }

  /**
   * Make a request to Ollama API with error handling
   */
  private async request(
    endpoint: string,
    body: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as OllamaErrorResponse;
        throw new Error(
          `Ollama API error (${response.status}): ${errorData.error || response.statusText}`
        );
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        if (error.message.includes('fetch failed')) {
          throw new Error(
            `Failed to connect to Ollama at ${this.baseUrl}. ` +
              `Is Ollama running? Try: ollama serve`
          );
        }
      }
      throw error;
    }
  }

  /**
   * Initialize the conversation
   */
  initialize(): void {
    const systemPrompt = this.getSystemPrompt();
    this.messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];
  }

  /**
   * Send a message and get a response
   */
  async chat(userMessage: string, options?: OllamaRunOptions): Promise<string> {
    // Add user message
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.getOllamaTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        console.log(`\n[Turn ${turnCount}/${maxTurns}]`);
      }

      // Set up timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // Build request body
        const requestBody: Record<string, unknown> = {
          model: this.getModel(),
          messages: this.messages,
          stream: false,
          options: {
            temperature: this.getTemperature(),
            ...(this.getNumPredict() && { num_predict: this.getNumPredict() }),
            ...(this.getTopP() && { top_p: this.getTopP() }),
            ...(this.manifest.extensions?.ollama?.top_k && {
              top_k: this.manifest.extensions.ollama.top_k,
            }),
            ...(this.manifest.extensions?.ollama?.repeat_penalty && {
              repeat_penalty: this.manifest.extensions.ollama.repeat_penalty,
            }),
            ...(this.manifest.extensions?.ollama?.seed && {
              seed: this.manifest.extensions.ollama.seed,
            }),
          },
        };

        // Add tools if available and model supports them
        if (tools.length > 0) {
          requestBody.tools = tools;
        }

        // Add stop sequences if configured
        if (this.manifest.extensions?.ollama?.stop) {
          requestBody.stop = this.manifest.extensions.ollama.stop;
        }

        // Call Ollama API
        const response = await this.request(
          '/api/chat',
          requestBody,
          controller.signal
        );
        clearTimeout(timeoutId);

        const data = (await response.json()) as OllamaChatResponse;

        if (options?.verbose) {
          console.log(`  Model: ${data.model}`);
          if (data.prompt_eval_count) {
            console.log(
              `  Tokens: ${data.prompt_eval_count} in, ${data.eval_count || 0} out`
            );
          }
        }

        const message = data.message;

        // Add assistant message to history
        this.messages.push({
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls,
        });

        // Check if we need to call tools
        if (message.tool_calls && message.tool_calls.length > 0) {
          if (options?.verbose) {
            console.log(
              `  [Executing ${message.tool_calls.length} tool(s)...]`
            );
          }

          // Execute each tool call
          for (const toolCall of message.tool_calls) {
            if (toolCall.type !== 'function') continue;

            let args: Record<string, unknown>;
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch (error) {
              args = { raw: toolCall.function.arguments };
            }

            if (options?.verbose) {
              console.log(
                `    → ${toolCall.function.name}(${JSON.stringify(args).substring(0, 100)}...)`
              );
            }

            const result = await this.executeTool(toolCall.function.name, args);

            if (options?.verbose) {
              console.log(
                `    ← ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`
              );
            }

            // Add tool result to messages
            this.messages.push({
              role: 'tool',
              content: result,
            });
          }

          // Continue the loop to get the final response
          continue;
        }

        // No tool calls, return the response
        return message.content || '';
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    return '[Max turns reached without completion]';
  }

  /**
   * Stream a response from Ollama
   */
  async *chatStream(
    userMessage: string,
    options?: OllamaRunOptions
  ): AsyncGenerator<string, void, unknown> {
    // Add user message
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.getOllamaTools();

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: this.getModel(),
      messages: this.messages,
      stream: true,
      options: {
        temperature: this.getTemperature(),
        ...(this.getNumPredict() && { num_predict: this.getNumPredict() }),
        ...(this.getTopP() && { top_p: this.getTopP() }),
      },
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
    }

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.request(
        '/api/chat',
        requestBody,
        controller.signal
      );
      clearTimeout(timeoutId);

      if (!response.body) {
        throw new Error('No response body received from Ollama');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let toolCalls: OllamaToolCall[] | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line) as OllamaStreamChunk;

              if (data.message.content) {
                fullContent += data.message.content;
                yield data.message.content;
              }

              if (data.message.tool_calls) {
                toolCalls = data.message.tool_calls;
              }

              if (data.done) {
                // Add assistant message to history
                this.messages.push({
                  role: 'assistant',
                  content: fullContent,
                  tool_calls: toolCalls,
                });

                // Handle tool calls if present
                if (toolCalls && toolCalls.length > 0) {
                  if (options?.verbose) {
                    console.log(`\n[Executing ${toolCalls.length} tool(s)...]`);
                  }

                  for (const toolCall of toolCalls) {
                    if (toolCall.type !== 'function') continue;

                    const args = JSON.parse(toolCall.function.arguments);
                    const result = await this.executeTool(
                      toolCall.function.name,
                      args
                    );

                    this.messages.push({
                      role: 'tool',
                      content: result,
                    });
                  }

                  // Recursively stream the next response after tool execution
                  yield* this.chatStream('', options);
                }

                return;
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              if (options?.verbose) {
                console.warn('Failed to parse streaming chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get agent information
   */
  getAgentInfo(): AgentInfo {
    const name =
      this.manifest.metadata?.name ||
      this.manifest.agent?.name ||
      'unnamed-agent';

    return {
      name,
      model: this.getModel(),
      tools: Array.from(this.tools.keys()),
      provider: 'ollama',
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): OllamaMessage[] {
    return this.messages;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.messages = [];
    this.initialize();
  }

  /**
   * Get available tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Check if Ollama is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        models: Array<{ name: string }>;
      };
      return data.models.map((m) => m.name);
    } catch (error) {
      throw new Error(
        `Failed to connect to Ollama at ${this.baseUrl}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create an Ollama adapter from a manifest file
   */
  static async fromFile(
    manifestPath: string,
    baseUrl?: string
  ): Promise<OllamaAdapter> {
    const fs = await import('fs/promises');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as OssaAgent;

    return new OllamaAdapter({
      manifest,
      baseUrl,
    });
  }

  /**
   * Create an Ollama adapter from a manifest object
   */
  static fromManifest(manifest: OssaAgent, baseUrl?: string): OllamaAdapter {
    return new OllamaAdapter({
      manifest,
      baseUrl,
    });
  }
}
