/**
 * Google Gemini Runtime Adapter
 * Runs OSSA agents using Google's Gemini API with streaming and function calling support
 *
 * Supported Models:
 * - gemini-pro: Standard Gemini Pro model
 * - gemini-ultra: Most capable Gemini model (when available)
 * - gemini-1.5-pro: Latest Gemini 1.5 Pro with extended context
 * - gemini-1.5-flash: Fast, efficient Gemini 1.5 model
 *
 * Features:
 * - Streaming response generation via generateContentStream
 * - Function calling (tools) support
 * - Multi-turn conversations with history
 * - Configurable safety settings
 * - Support for system instructions
 */

import {
  GoogleGenerativeAI,
  GenerativeModel,
  ChatSession,
  Content,
  Part,
  FunctionDeclaration,
  FunctionDeclarationSchema,
  FunctionCall,
  GenerateContentResult,
  GenerateContentStreamResult,
  HarmCategory,
  HarmBlockThreshold,
  SchemaType,
} from '@google/generative-ai';

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
      topP?: number;
      topK?: number;
    };
    tools?: Array<{
      type: string;
      name?: string;
      capabilities?: string[];
      config?: Record<string, unknown>;
    }>;
  };
  extensions?: {
    google?: {
      model?: string;
      api_key?: string;
      system_instruction?: string;
      temperature?: number;
      top_p?: number;
      top_k?: number;
      max_output_tokens?: number;
      safety_settings?: Array<{
        category: HarmCategory;
        threshold: HarmBlockThreshold;
      }>;
      tools?: FunctionDeclaration[];
    };
    gemini?: {
      model?: string;
      api_key?: string;
      system_instruction?: string;
      temperature?: number;
      top_p?: number;
      top_k?: number;
      max_output_tokens?: number;
      safety_settings?: Array<{
        category: HarmCategory;
        threshold: HarmBlockThreshold;
      }>;
      tools?: FunctionDeclaration[];
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
  parameters: FunctionDeclarationSchema;
  handler?: (args: Record<string, unknown>) => Promise<string>;
}

export class GeminiAdapter {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private manifest: OssaManifest;
  private tools: Map<string, ToolDefinition> = new Map();
  private chatSession: ChatSession | null = null;
  private conversationHistory: Content[] = [];

  constructor(manifest: OssaManifest, apiKey?: string) {
    this.manifest = manifest;

    // Get API key from manifest extensions or environment
    const resolvedApiKey =
      apiKey ||
      this.manifest.extensions?.google?.api_key ||
      this.manifest.extensions?.gemini?.api_key ||
      process.env.GOOGLE_API_KEY;

    if (!resolvedApiKey) {
      throw new Error(
        'Google API key is required. Set GOOGLE_API_KEY environment variable or provide it in manifest extensions.google.api_key or extensions.gemini.api_key'
      );
    }

    // Initialize Google Generative AI client
    this.client = new GoogleGenerativeAI(resolvedApiKey);

    // Initialize model with configuration
    this.model = this.initializeModel();
  }

  /**
   * Initialize the Gemini model with configuration from manifest
   */
  private initializeModel(): GenerativeModel {
    const modelName = this.getModelName();
    const systemInstruction = this.getSystemInstruction();
    const tools = this.getGeminiTools();

    // Build generation config
    const generationConfig: {
      temperature?: number;
      topP?: number;
      topK?: number;
      maxOutputTokens?: number;
    } = {};

    const temperature = this.getTemperature();
    if (temperature !== undefined) {
      generationConfig.temperature = temperature;
    }

    const topP = this.getTopP();
    if (topP !== undefined) {
      generationConfig.topP = topP;
    }

    const topK = this.getTopK();
    if (topK !== undefined) {
      generationConfig.topK = topK;
    }

    const maxTokens = this.getMaxTokens();
    if (maxTokens !== undefined) {
      generationConfig.maxOutputTokens = maxTokens;
    }

    // Build model configuration
    const modelConfig: {
      model: string;
      systemInstruction?: string;
      generationConfig?: typeof generationConfig;
      safetySettings?: Array<{
        category: HarmCategory;
        threshold: HarmBlockThreshold;
      }>;
      tools?: Array<{ functionDeclarations: FunctionDeclaration[] }>;
    } = {
      model: modelName,
    };

    if (systemInstruction) {
      modelConfig.systemInstruction = systemInstruction;
    }

    if (Object.keys(generationConfig).length > 0) {
      modelConfig.generationConfig = generationConfig;
    }

    const safetySettings = this.getSafetySettings();
    if (safetySettings) {
      modelConfig.safetySettings = safetySettings;
    }

    if (tools.length > 0) {
      modelConfig.tools = [{ functionDeclarations: tools }];
    }

    return this.client.getGenerativeModel(modelConfig);
  }

  /**
   * Get the model name from manifest
   * Priority: extensions.gemini.model > extensions.google.model > spec.llm.model > default
   */
  private getModelName(): string {
    // Check Gemini extension first
    if (this.manifest.extensions?.gemini?.model) {
      return this.manifest.extensions.gemini.model;
    }
    // Check Google extension
    if (this.manifest.extensions?.google?.model) {
      return this.manifest.extensions.google.model;
    }
    // Fall back to LLM config
    if (this.manifest.spec.llm?.model) {
      return this.manifest.spec.llm.model;
    }
    // Default to Gemini 1.5 Pro
    return 'gemini-1.5-pro';
  }

  /**
   * Get system instruction from manifest
   */
  private getSystemInstruction(): string | undefined {
    // Check Gemini extension first
    if (this.manifest.extensions?.gemini?.system_instruction) {
      return this.manifest.extensions.gemini.system_instruction;
    }
    // Check Google extension
    if (this.manifest.extensions?.google?.system_instruction) {
      return this.manifest.extensions.google.system_instruction;
    }
    // Fall back to role
    return this.manifest.spec.role;
  }

  /**
   * Get temperature configuration
   */
  private getTemperature(): number | undefined {
    // Check Gemini extension first
    if (this.manifest.extensions?.gemini?.temperature !== undefined) {
      return this.manifest.extensions.gemini.temperature;
    }
    // Check Google extension
    if (this.manifest.extensions?.google?.temperature !== undefined) {
      return this.manifest.extensions.google.temperature;
    }
    // Fall back to LLM config
    return this.manifest.spec.llm?.temperature;
  }

  /**
   * Get top_p configuration
   */
  private getTopP(): number | undefined {
    // Check Gemini extension first
    if (this.manifest.extensions?.gemini?.top_p !== undefined) {
      return this.manifest.extensions.gemini.top_p;
    }
    // Check Google extension
    if (this.manifest.extensions?.google?.top_p !== undefined) {
      return this.manifest.extensions.google.top_p;
    }
    // Fall back to LLM config
    return this.manifest.spec.llm?.topP;
  }

  /**
   * Get top_k configuration
   */
  private getTopK(): number | undefined {
    // Check Gemini extension first
    if (this.manifest.extensions?.gemini?.top_k !== undefined) {
      return this.manifest.extensions.gemini.top_k;
    }
    // Check Google extension
    if (this.manifest.extensions?.google?.top_k !== undefined) {
      return this.manifest.extensions.google.top_k;
    }
    // Fall back to LLM config
    return this.manifest.spec.llm?.topK;
  }

  /**
   * Get max tokens configuration
   */
  private getMaxTokens(): number | undefined {
    // Check Gemini extension first
    if (this.manifest.extensions?.gemini?.max_output_tokens !== undefined) {
      return this.manifest.extensions.gemini.max_output_tokens;
    }
    // Check Google extension
    if (this.manifest.extensions?.google?.max_output_tokens !== undefined) {
      return this.manifest.extensions.google.max_output_tokens;
    }
    // Fall back to LLM config
    return this.manifest.spec.llm?.maxTokens;
  }

  /**
   * Get safety settings configuration
   */
  private getSafetySettings():
    | Array<{ category: HarmCategory; threshold: HarmBlockThreshold }>
    | undefined {
    // Check Gemini extension first
    if (this.manifest.extensions?.gemini?.safety_settings) {
      return this.manifest.extensions.gemini.safety_settings;
    }
    // Check Google extension
    if (this.manifest.extensions?.google?.safety_settings) {
      return this.manifest.extensions.google.safety_settings;
    }
    return undefined;
  }

  /**
   * Convert OSSA tools to Gemini function declarations
   */
  private getGeminiTools(): FunctionDeclaration[] {
    const geminiTools: FunctionDeclaration[] = [];

    // Check for tools in Gemini extension (highest priority)
    const geminiExtensionTools = this.manifest.extensions?.gemini?.tools;
    if (geminiExtensionTools) {
      for (const tool of geminiExtensionTools) {
        const toolDef: ToolDefinition = {
          name: tool.name,
          description: tool.description || '',
          parameters: tool.parameters
            ? tool.parameters
            : { type: SchemaType.OBJECT, properties: {} },
        };
        this.tools.set(tool.name, toolDef);
        geminiTools.push(tool);
      }
    }

    // Check for tools in Google extension
    const googleExtensionTools = this.manifest.extensions?.google?.tools;
    if (googleExtensionTools) {
      for (const tool of googleExtensionTools) {
        if (!this.tools.has(tool.name)) {
          const toolDef: ToolDefinition = {
            name: tool.name,
            description: tool.description || '',
            parameters: tool.parameters
              ? tool.parameters
              : { type: SchemaType.OBJECT, properties: {} },
          };
          this.tools.set(tool.name, toolDef);
          geminiTools.push(tool);
        }
      }
    }

    // Also check spec.tools for basic tool definitions
    if (this.manifest.spec.tools) {
      for (const tool of this.manifest.spec.tools) {
        if (tool.name && !this.tools.has(tool.name)) {
          // Generate parameters schema based on tool config
          const parameters = this.generateParametersSchema(tool);

          const toolDef: ToolDefinition = {
            name: tool.name,
            description: `Execute ${tool.name} (${tool.type})`,
            parameters,
          };
          this.tools.set(tool.name, toolDef);

          geminiTools.push({
            name: tool.name,
            description: toolDef.description,
            parameters,
          });
        }
      }
    }

    return geminiTools;
  }

  /**
   * Generate parameters schema from OSSA tool spec
   */
  private generateParametersSchema(tool: {
    type: string;
    config?: Record<string, unknown>;
  }): FunctionDeclarationSchema {
    // Check if config has schema information
    if (tool.config && typeof tool.config === 'object') {
      if ('parameters' in tool.config) {
        return tool.config.parameters as FunctionDeclarationSchema;
      }

      // Use config as properties
      const properties: {
        [k: string]: { type: SchemaType; description: string };
      } = {};
      for (const [key, value] of Object.entries(tool.config)) {
        properties[key] = {
          type:
            typeof value === 'number' ? SchemaType.NUMBER : SchemaType.STRING,
          description: `${key} parameter`,
        };
      }

      return {
        type: SchemaType.OBJECT,
        properties,
      };
    }

    // Default schema based on transport type
    switch (tool.type) {
      case 'mcp':
        return {
          type: SchemaType.OBJECT,
          properties: {
            input: {
              type: SchemaType.STRING,
              description: 'Input data',
            },
          },
          required: ['input'],
        };

      case 'http':
        return {
          type: SchemaType.OBJECT,
          properties: {
            method: {
              type: SchemaType.STRING,
              description: 'HTTP method',
            },
            body: {
              type: SchemaType.OBJECT,
              description: 'Request body',
            },
          },
          required: ['method'],
        };

      case 'function':
        return {
          type: SchemaType.OBJECT,
          properties: {
            args: {
              type: SchemaType.OBJECT,
              description: 'Function arguments',
            },
          },
        };

      default:
        return {
          type: SchemaType.OBJECT,
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
        parameters: {
          type: SchemaType.OBJECT,
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
    this.chatSession = this.model.startChat({
      history: [],
    });
  }

  /**
   * Send a message and get a response
   */
  async chat(userMessage: string, options?: RunOptions): Promise<string> {
    if (!this.chatSession) {
      this.initialize();
    }

    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;

    // Send initial user message
    let currentMessage = userMessage;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        console.log(`\n[Turn ${turnCount}/${maxTurns}]`);
      }

      // Generate response
      const result: GenerateContentResult =
        await this.chatSession!.sendMessage(currentMessage);
      const response = result.response;

      if (options?.verbose) {
        console.log(`  Model: ${this.getModelName()}`);
        if (response.usageMetadata) {
          console.log(
            `  Tokens: ${response.usageMetadata.promptTokenCount} in, ${response.usageMetadata.candidatesTokenCount} out`
          );
        }
      }

      // Check for function calls
      const functionCalls = this.extractFunctionCalls(response);

      if (functionCalls.length > 0) {
        if (options?.verbose) {
          console.log(`  [Executing ${functionCalls.length} function(s)...]`);
        }

        // Execute all function calls
        const functionResponses: Array<{
          name: string;
          response: Record<string, unknown>;
        }> = [];

        for (const funcCall of functionCalls) {
          const { name, args } = funcCall;

          if (options?.verbose) {
            const argsPreview =
              JSON.stringify(args).substring(0, 100) +
              (JSON.stringify(args).length > 100 ? '...' : '');
            console.log(`    → ${name}(${argsPreview})`);
          }

          const result = await this.executeTool(name, args);

          if (options?.verbose) {
            const resultPreview =
              result.substring(0, 100) + (result.length > 100 ? '...' : '');
            console.log(`    ← ${resultPreview}`);
          }

          functionResponses.push({
            name,
            response: JSON.parse(result),
          });
        }

        // Send function responses back to the model
        const functionResponseParts: Part[] = functionResponses.map((fr) => ({
          functionResponse: {
            name: fr.name,
            response: fr.response,
          },
        }));

        // Continue conversation with function results
        currentMessage = JSON.stringify(functionResponseParts);
        continue;
      }

      // No function calls, extract text response
      const textResponse = response.text();
      if (textResponse) {
        return textResponse;
      }

      // Check if blocked by safety filters
      if (
        response.candidates &&
        response.candidates[0]?.finishReason === 'SAFETY'
      ) {
        return '[Response blocked by safety filters]';
      }

      // Max tokens or other finish reason
      if (
        response.candidates &&
        response.candidates[0]?.finishReason === 'MAX_TOKENS'
      ) {
        return '[Response truncated due to length limit]';
      }
    }

    return '[Max turns reached without completion]';
  }

  /**
   * Stream a response with function calling support
   */
  async *chatStream(
    userMessage: string,
    options?: RunOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.chatSession) {
      this.initialize();
    }

    let turnCount = 0;
    const maxTurns = options?.maxTurns || 10;
    let currentMessage = userMessage;

    while (turnCount < maxTurns) {
      turnCount++;

      if (options?.verbose) {
        yield `\n[Turn ${turnCount}/${maxTurns}]\n`;
      }

      // Stream the response
      const result: GenerateContentStreamResult =
        await this.chatSession!.sendMessageStream(currentMessage);

      // Collect function calls and text chunks
      const functionCalls: Array<{
        name: string;
        args: Record<string, unknown>;
      }> = [];
      let hasText = false;

      for await (const chunk of result.stream) {
        // Extract function calls from chunk
        const chunkFunctionCalls = this.extractFunctionCalls(chunk);
        functionCalls.push(...chunkFunctionCalls);

        // Extract text from chunk
        try {
          const text = chunk.text();
          if (text) {
            yield text;
            hasText = true;
          }
        } catch (error) {
          // No text in this chunk, likely a function call
        }
      }

      // If we have function calls, execute them
      if (functionCalls.length > 0) {
        if (options?.verbose) {
          yield `\n[Executing ${functionCalls.length} function(s)...]\n`;
        }

        const functionResponses: Array<{
          name: string;
          response: Record<string, unknown>;
        }> = [];

        for (const funcCall of functionCalls) {
          const { name, args } = funcCall;

          if (options?.verbose) {
            yield `  → ${name}(...)\n`;
          }

          const result = await this.executeTool(name, args);

          if (options?.verbose) {
            const resultPreview =
              result.substring(0, 100) + (result.length > 100 ? '...' : '');
            yield `  ← ${resultPreview}\n`;
          }

          functionResponses.push({
            name,
            response: JSON.parse(result),
          });
        }

        // Send function responses back
        const functionResponseParts: Part[] = functionResponses.map((fr) => ({
          functionResponse: {
            name: fr.name,
            response: fr.response,
          },
        }));

        currentMessage = JSON.stringify(functionResponseParts);
        continue;
      }

      // If we got text, we're done
      if (hasText) {
        return;
      }
    }

    yield '\n[Max turns reached without completion]';
  }

  /**
   * Extract function calls from a response
   */
  private extractFunctionCalls(
    response:
      | GenerateContentResult
      | { functionCalls?: () => FunctionCall[] | undefined }
  ): Array<{ name: string; args: Record<string, unknown> }> {
    const functionCalls: Array<{
      name: string;
      args: Record<string, unknown>;
    }> = [];

    try {
      // Gemini API provides a functionCalls() method on candidates
      if (
        'functionCalls' in response &&
        typeof response.functionCalls === 'function'
      ) {
        const calls = response.functionCalls();
        if (calls && calls.length > 0) {
          for (const call of calls) {
            functionCalls.push({
              name: call.name,
              args: call.args as Record<string, unknown>,
            });
          }
        }
      }
    } catch (error) {
      // No function calls in this response
    }

    return functionCalls;
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
      model: this.getModelName(),
      tools: Array.from(this.tools.keys()),
      provider: 'google',
    };
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(): Promise<Content[]> {
    if (!this.chatSession) {
      return [];
    }
    const history = await this.chatSession.getHistory();
    return history;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.chatSession = this.model.startChat({
      history: [],
    });
  }

  /**
   * Get available tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get the Google Generative AI client (for advanced usage)
   */
  getClient(): GoogleGenerativeAI {
    return this.client;
  }

  /**
   * Get the current model instance (for advanced usage)
   */
  getModel(): GenerativeModel {
    return this.model;
  }
}
