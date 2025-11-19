/**
 * OpenAI Runtime Adapter
 * Runs OSSA agents using OpenAI's function calling API
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

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
    openai_agents?: {
      model?: string;
      instructions?: string;
      tools_mapping?: Array<{
        ossa_capability: string;
        openai_tool_name?: string;
        description?: string;
        parameters?: Record<string, unknown>;
      }>;
    };
  };
}

export interface RunOptions {
  verbose?: boolean;
  maxTurns?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler?: (args: Record<string, unknown>) => Promise<string>;
}

export class OpenAIAdapter {
  private client: OpenAI;
  private manifest: OssaManifest;
  private tools: Map<string, ToolDefinition> = new Map();
  private messages: ChatCompletionMessageParam[] = [];

  constructor(manifest: OssaManifest, apiKey?: string) {
    this.manifest = manifest;
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Get the model to use from manifest
   */
  private getModel(): string {
    // Check OpenAI extension first
    if (this.manifest.extensions?.openai_agents?.model) {
      return this.manifest.extensions.openai_agents.model;
    }
    // Fall back to LLM config
    if (this.manifest.spec.llm?.model) {
      return this.manifest.spec.llm.model;
    }
    // Default
    return 'gpt-4o-mini';
  }

  /**
   * Get system prompt from manifest
   */
  private getSystemPrompt(): string {
    // Check OpenAI extension first
    if (this.manifest.extensions?.openai_agents?.instructions) {
      return this.manifest.extensions.openai_agents.instructions;
    }
    // Fall back to role
    return this.manifest.spec.role;
  }

  /**
   * Convert OSSA tools to OpenAI function calling format
   */
  private getOpenAITools(): ChatCompletionTool[] {
    const openaiTools: ChatCompletionTool[] = [];

    // Check for tools_mapping in OpenAI extension
    const toolsMapping = this.manifest.extensions?.openai_agents?.tools_mapping;
    if (toolsMapping) {
      for (const mapping of toolsMapping) {
        const toolDef: ToolDefinition = {
          name: mapping.openai_tool_name || mapping.ossa_capability,
          description: mapping.description || `Execute ${mapping.ossa_capability}`,
          parameters: mapping.parameters || {
            type: 'object',
            properties: {},
            required: [],
          },
        };
        this.tools.set(toolDef.name, toolDef);

        openaiTools.push({
          type: 'function',
          function: {
            name: toolDef.name,
            description: toolDef.description,
            parameters: toolDef.parameters,
          },
        });
      }
    }

    // Also check spec.tools for basic tool definitions
    if (this.manifest.spec.tools) {
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

          openaiTools.push({
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

    return openaiTools;
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
      return `Error: Tool '${name}' not found`;
    }

    if (tool.handler) {
      try {
        return await tool.handler(args);
      } catch (error) {
        return `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    // Default: return a placeholder response
    return `Tool '${name}' executed with args: ${JSON.stringify(args)}`;
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
   * Send a message and get a response
   */
  async chat(userMessage: string, options?: RunOptions): Promise<string> {
    // Add user message
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.getOpenAITools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      // Call OpenAI
      const response = await this.client.chat.completions.create({
        model: this.getModel(),
        messages: this.messages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: this.manifest.spec.llm?.temperature ?? 0.7,
        max_tokens: this.manifest.spec.llm?.maxTokens,
      });

      const choice = response.choices[0];
      const message = choice.message;

      // Add assistant message to history
      this.messages.push(message);

      // Check if we need to call tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        if (options?.verbose) {
          console.log(`\n[Calling ${message.tool_calls.length} tool(s)...]`);
        }

        // Execute each tool call
        for (const toolCall of message.tool_calls) {
          // Type guard for function tool calls
          if (toolCall.type !== 'function') continue;

          const funcCall = toolCall as { id: string; type: 'function'; function: { name: string; arguments: string } };
          const args = JSON.parse(funcCall.function.arguments);

          if (options?.verbose) {
            console.log(`  → ${funcCall.function.name}(${JSON.stringify(args)})`);
          }

          const result = await this.executeTool(funcCall.function.name, args);

          if (options?.verbose) {
            console.log(`  ← ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
          }

          // Add tool result to messages
          this.messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          });
        }

        // Continue the loop to get the final response
        continue;
      }

      // No tool calls, return the response
      return message.content || '';
    }

    return 'Max turns reached without completion';
  }

  /**
   * Get agent info
   */
  getAgentInfo(): { name: string; model: string; tools: string[] } {
    return {
      name: this.manifest.metadata.name,
      model: this.getModel(),
      tools: Array.from(this.tools.keys()),
    };
  }
}
