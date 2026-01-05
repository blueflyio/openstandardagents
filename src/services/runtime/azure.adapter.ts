/**
 * Azure OpenAI Runtime Adapter
 * Runs OSSA agents using Azure OpenAI's function calling API with streaming and tool support
 *
 * This adapter extends the OpenAI SDK with Azure-specific configuration:
 * - Custom endpoint URLs (Azure OpenAI resource endpoints)
 * - API version headers (Azure requires explicit API versioning)
 * - Deployment names (Azure uses deployment names instead of model names)
 *
 * @example Basic Usage
 * ```typescript
 * const manifest: OssaManifest = {
 *   apiVersion: 'v0.3.0',
 *   kind: 'Agent',
 *   metadata: { name: 'my-agent' },
 *   spec: { role: 'Assistant' },
 *   extensions: {
 *     azure: {
 *       endpoint: 'https://my-resource.openai.azure.com',
 *       deployment: 'gpt-4o-mini',
 *       api_version: '2024-02-15-preview'
 *     }
 *   }
 * };
 *
 * const adapter = new AzureAdapter(manifest);
 * adapter.initialize();
 * const response = await adapter.chat('Hello!');
 * ```
 */

import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

/**
 * OSSA Agent manifest structure
 * Supports Azure-specific configuration via extensions.azure
 */
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
    azure?: {
      /** Azure OpenAI endpoint URL (e.g., https://my-resource.openai.azure.com) */
      endpoint?: string;
      /** Azure deployment name (replaces model name in Azure) */
      deployment?: string;
      /** Azure API version (default: 2024-02-15-preview) */
      api_version?: string;
      /** System instructions (overrides spec.role if provided) */
      instructions?: string;
      /** Temperature setting (overrides spec.llm.temperature if provided) */
      temperature?: number;
      /** Max tokens (overrides spec.llm.maxTokens if provided) */
      max_tokens?: number;
      /** Tool mapping for Azure function calling */
      tools_mapping?: Array<{
        ossa_capability: string;
        azure_tool_name?: string;
        description?: string;
        parameters?: Record<string, unknown>;
      }>;
    };
    [key: string]: unknown;
  };
}

/**
 * Runtime options for chat execution
 */
export interface RunOptions {
  /** Enable verbose logging of tool calls and responses */
  verbose?: boolean;
  /** Maximum conversation turns before stopping (default: 10) */
  maxTurns?: number;
}

/**
 * Tool definition with optional handler
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler?: (args: Record<string, unknown>) => Promise<string>;
}

/**
 * Azure OpenAI Runtime Adapter
 *
 * This adapter bridges OSSA agent manifests to Azure OpenAI's API, handling:
 * - Azure-specific authentication and endpoint configuration
 * - Deployment name mapping (Azure uses deployments instead of model names)
 * - API version headers required by Azure
 * - Function calling and tool execution
 * - Multi-turn conversations with tool support
 *
 * Configuration Priority (highest to lowest):
 * 1. extensions.azure.* (Azure-specific settings)
 * 2. spec.llm.* (Generic LLM settings)
 * 3. Hard-coded defaults
 */
export class AzureAdapter {
  private client: OpenAI;
  private manifest: OssaManifest;
  private tools: Map<string, ToolDefinition> = new Map();
  private messages: ChatCompletionMessageParam[] = [];
  private deployment: string;

  /**
   * Creates a new Azure OpenAI adapter instance
   *
   * @param manifest - OSSA agent manifest with Azure configuration in extensions.azure
   * @param apiKey - Azure OpenAI API key (optional, falls back to AZURE_OPENAI_API_KEY env var)
   *
   * @throws {Error} If Azure endpoint or deployment name is not configured
   *
   * @example
   * ```typescript
   * const adapter = new AzureAdapter(manifest, process.env.AZURE_OPENAI_API_KEY);
   * ```
   */
  constructor(manifest: OssaManifest, apiKey?: string) {
    this.manifest = manifest;

    // Extract Azure configuration
    const azureConfig = this.manifest.extensions?.azure;
    const endpoint = azureConfig?.endpoint;
    const apiVersion = azureConfig?.api_version || '2024-02-15-preview';

    if (!endpoint) {
      throw new Error(
        'Azure endpoint is required. Set extensions.azure.endpoint in manifest.'
      );
    }

    // Get deployment name (required for Azure)
    this.deployment = this.getDeployment();

    // Initialize OpenAI client with Azure configuration
    this.client = new OpenAI({
      apiKey: apiKey || process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${endpoint}/openai/deployments/${this.deployment}`,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': apiKey || process.env.AZURE_OPENAI_API_KEY || '' },
    });
  }

  /**
   * Get the Azure deployment name from manifest
   *
   * Deployment names in Azure OpenAI are distinct from model names and must be
   * configured in the Azure portal. They map to specific model versions.
   *
   * Priority:
   * 1. extensions.azure.deployment (Azure-specific)
   * 2. spec.llm.model (Generic LLM config, treated as deployment name)
   * 3. Default: 'gpt-4o-mini' (must exist as deployment in Azure)
   *
   * @returns Azure deployment name
   *
   * @private
   */
  private getDeployment(): string {
    // Check Azure extension first
    if (this.manifest.extensions?.azure?.deployment) {
      return this.manifest.extensions.azure.deployment;
    }
    // Fall back to LLM model config (Azure treats this as deployment name)
    if (this.manifest.spec.llm?.model) {
      return this.manifest.spec.llm.model;
    }
    // Default deployment name
    return 'gpt-4o-mini';
  }

  /**
   * Get system prompt from manifest
   *
   * The system prompt defines the agent's role and behavior. Azure OpenAI uses
   * the same system message format as standard OpenAI.
   *
   * Priority:
   * 1. extensions.azure.instructions (Azure-specific instructions)
   * 2. spec.role (Generic role definition)
   *
   * @returns System prompt text
   *
   * @private
   */
  private getSystemPrompt(): string {
    // Check Azure extension first
    if (this.manifest.extensions?.azure?.instructions) {
      return this.manifest.extensions.azure.instructions;
    }
    // Fall back to role
    return this.manifest.spec.role;
  }

  /**
   * Get temperature setting for response generation
   *
   * Temperature controls randomness in responses (0.0 = deterministic, 2.0 = very random).
   * Azure OpenAI supports the same temperature range as OpenAI.
   *
   * Priority:
   * 1. extensions.azure.temperature
   * 2. spec.llm.temperature
   * 3. Default: 0.7
   *
   * @returns Temperature value (0.0 to 2.0)
   *
   * @private
   */
  private getTemperature(): number {
    if (this.manifest.extensions?.azure?.temperature !== undefined) {
      return this.manifest.extensions.azure.temperature;
    }
    if (this.manifest.spec.llm?.temperature !== undefined) {
      return this.manifest.spec.llm.temperature;
    }
    return 0.7;
  }

  /**
   * Get max tokens setting for response generation
   *
   * Max tokens limits the length of generated responses. Azure OpenAI has the
   * same token limits as OpenAI (varies by model).
   *
   * Priority:
   * 1. extensions.azure.max_tokens
   * 2. spec.llm.maxTokens
   * 3. Default: undefined (uses model's default)
   *
   * @returns Max tokens value or undefined
   *
   * @private
   */
  private getMaxTokens(): number | undefined {
    if (this.manifest.extensions?.azure?.max_tokens) {
      return this.manifest.extensions.azure.max_tokens;
    }
    if (this.manifest.spec.llm?.maxTokens) {
      return this.manifest.spec.llm.maxTokens;
    }
    return undefined;
  }

  /**
   * Convert OSSA tools to OpenAI function calling format
   *
   * This method transforms OSSA tool definitions into Azure OpenAI's function calling
   * schema. Azure uses the same function calling format as OpenAI.
   *
   * Tool sources (in priority order):
   * 1. extensions.azure.tools_mapping - Azure-specific tool definitions
   * 2. spec.tools - Generic OSSA tool definitions
   *
   * @returns Array of OpenAI ChatCompletionTool objects
   *
   * @private
   */
  private getAzureTools(): ChatCompletionTool[] {
    const azureTools: ChatCompletionTool[] = [];

    // Check for tools_mapping in Azure extension
    const toolsMapping = this.manifest.extensions?.azure?.tools_mapping;
    if (toolsMapping) {
      for (const mapping of toolsMapping) {
        const toolDef: ToolDefinition = {
          name: mapping.azure_tool_name || mapping.ossa_capability,
          description:
            mapping.description || `Execute ${mapping.ossa_capability}`,
          parameters: mapping.parameters || {
            type: 'object',
            properties: {},
            required: [],
          },
        };
        this.tools.set(toolDef.name, toolDef);

        azureTools.push({
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

          azureTools.push({
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

    return azureTools;
  }

  /**
   * Register a tool handler for runtime execution
   *
   * Tool handlers are async functions that execute when the LLM calls a tool.
   * They receive parsed arguments and return string results.
   *
   * @param name - Tool name (must match a tool defined in manifest)
   * @param handler - Async function that executes the tool
   *
   * @example
   * ```typescript
   * adapter.registerToolHandler('get_weather', async (args) => {
   *   const { location } = args;
   *   const weather = await fetchWeather(location);
   *   return JSON.stringify(weather);
   * });
   * ```
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
   * Execute a tool call from the LLM
   *
   * This internal method handles tool execution during conversation turns.
   * It looks up the registered handler and invokes it with the provided arguments.
   *
   * @param name - Tool name
   * @param args - Parsed tool arguments from LLM
   * @returns Tool execution result as string
   *
   * @private
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

    // Default: return a placeholder response if no handler registered
    return `Tool '${name}' executed with args: ${JSON.stringify(args)}`;
  }

  /**
   * Initialize the conversation
   *
   * Sets up the conversation history with the system prompt. Must be called
   * before the first chat() call.
   *
   * @example
   * ```typescript
   * adapter.initialize();
   * const response = await adapter.chat('Hello!');
   * ```
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
   *
   * This is the main method for interacting with the Azure OpenAI agent. It handles:
   * - Adding user messages to conversation history
   * - Calling Azure OpenAI API with proper authentication and headers
   * - Executing tool calls requested by the LLM
   * - Multi-turn conversations with tool results
   * - Automatic retry until final text response or max turns reached
   *
   * The method automatically handles the tool execution loop:
   * 1. Send messages to Azure OpenAI
   * 2. If LLM requests tool calls, execute them
   * 3. Send tool results back to LLM
   * 4. Repeat until LLM provides final text response
   *
   * @param userMessage - The user's message text
   * @param options - Optional runtime configuration
   * @returns Final text response from the LLM
   *
   * @throws {Error} If Azure API call fails
   *
   * @example Basic usage
   * ```typescript
   * const response = await adapter.chat('What is the weather in Paris?');
   * console.log(response);
   * ```
   *
   * @example With verbose logging
   * ```typescript
   * const response = await adapter.chat('Calculate 2+2', { verbose: true });
   * // Logs: [Calling 1 tool(s)...]
   * // Logs:   → calculate({"expression":"2+2"})
   * // Logs:   ← 4
   * ```
   */
  async chat(userMessage: string, options?: RunOptions): Promise<string> {
    // Add user message
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.getAzureTools();
    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    while (turnCount < maxTurns) {
      turnCount++;

      // Call Azure OpenAI
      const response = await this.client.chat.completions.create({
        model: this.deployment, // Azure requires deployment name here
        messages: this.messages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: this.getTemperature(),
        max_tokens: this.getMaxTokens(),
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

          const funcCall = toolCall as {
            id: string;
            type: 'function';
            function: { name: string; arguments: string };
          };
          const args = JSON.parse(funcCall.function.arguments);

          if (options?.verbose) {
            console.log(
              `  → ${funcCall.function.name}(${JSON.stringify(args)})`
            );
          }

          const result = await this.executeTool(funcCall.function.name, args);

          if (options?.verbose) {
            console.log(
              `  ← ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`
            );
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
   * Get agent information
   *
   * Returns metadata about the configured agent including deployment name,
   * available tools, and provider identifier.
   *
   * @returns Object containing agent name, deployment, tools array, and provider
   *
   * @example
   * ```typescript
   * const info = adapter.getAgentInfo();
   * console.log(`Agent: ${info.name}`);
   * console.log(`Deployment: ${info.deployment}`);
   * console.log(`Tools: ${info.tools.join(', ')}`);
   * console.log(`Provider: ${info.provider}`); // 'azure'
   * ```
   */
  getAgentInfo(): {
    name: string;
    deployment: string;
    tools: string[];
    provider: string;
  } {
    return {
      name: this.manifest.metadata.name,
      deployment: this.deployment,
      tools: Array.from(this.tools.keys()),
      provider: 'azure',
    };
  }

  /**
   * Get conversation history
   *
   * Returns the full conversation history including system messages, user messages,
   * assistant responses, and tool calls/results. Useful for debugging or saving
   * conversation state.
   *
   * @returns Array of conversation messages
   *
   * @example
   * ```typescript
   * const history = adapter.getConversationHistory();
   * console.log(`Messages: ${history.length}`);
   * ```
   */
  getConversationHistory(): ChatCompletionMessageParam[] {
    return this.messages;
  }

  /**
   * Clear conversation history
   *
   * Resets the conversation to initial state (only system message remains).
   * Call this to start a fresh conversation without recreating the adapter.
   *
   * @example
   * ```typescript
   * adapter.clearHistory();
   * adapter.initialize(); // Re-add system prompt
   * ```
   */
  clearHistory(): void {
    this.messages = [];
  }

  /**
   * Get available tools
   *
   * Returns all registered tool definitions including their schemas and handlers.
   *
   * @returns Array of tool definitions
   *
   * @example
   * ```typescript
   * const tools = adapter.getTools();
   * for (const tool of tools) {
   *   console.log(`${tool.name}: ${tool.description}`);
   * }
   * ```
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get the OpenAI client instance
   *
   * Provides direct access to the underlying OpenAI SDK client configured for Azure.
   * Use this for advanced scenarios not covered by the adapter API.
   *
   * @returns Configured OpenAI client instance
   *
   * @example Advanced usage with streaming
   * ```typescript
   * const client = adapter.getClient();
   * const stream = await client.chat.completions.create({
   *   model: adapter.getAgentInfo().deployment,
   *   messages: adapter.getConversationHistory(),
   *   stream: true,
   * });
   * for await (const chunk of stream) {
   *   process.stdout.write(chunk.choices[0]?.delta?.content || '');
   * }
   * ```
   */
  getClient(): OpenAI {
    return this.client;
  }
}
