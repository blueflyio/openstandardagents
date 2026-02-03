/**
 * Mock LLM Service
 * Provides deterministic responses for agent testing without API keys
 *
 * Features:
 * - Deterministic responses based on input patterns
 * - Configurable response delays
 * - Tool call simulation
 * - Error scenario testing
 */

export interface MockLLMConfig {
  provider?: string;
  model?: string;
  temperature?: number;
  responseDelay?: number; // milliseconds
  failureRate?: number; // 0-1, percentage of requests that fail
}

export interface MockLLMRequest {
  prompt: string;
  systemPrompt?: string;
  tools?: Array<{ name: string; description?: string }>;
  maxTokens?: number;
}

export interface MockLLMResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    model: string;
    provider: string;
    latencyMs: number;
  };
}

export class MockLLMService {
  private config: MockLLMConfig;
  private callCount: number = 0;

  constructor(config: MockLLMConfig = {}) {
    this.config = {
      provider: 'mock',
      model: 'mock-gpt-4',
      temperature: 0.7,
      responseDelay: 100,
      failureRate: 0,
      ...config,
    };
  }

  /**
   * Generate mock response based on input patterns
   */
  async generate(request: MockLLMRequest): Promise<MockLLMResponse> {
    this.callCount++;
    const startTime = Date.now();

    // Simulate API delay
    if (this.config.responseDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.responseDelay)
      );
    }

    // Simulate random failures
    if (
      this.config.failureRate &&
      Math.random() < this.config.failureRate
    ) {
      throw new Error('Mock LLM: Simulated API failure');
    }

    // Determine response based on prompt patterns
    const content = this.generateContent(request);
    const toolCalls = this.generateToolCalls(request);

    // Calculate mock token usage
    const promptTokens = Math.ceil(
      (request.prompt.length + (request.systemPrompt?.length || 0)) / 4
    );
    const completionTokens = Math.ceil(content.length / 4);

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      metadata: {
        model: this.config.model!,
        provider: this.config.provider!,
        latencyMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Generate deterministic content based on prompt patterns
   */
  private generateContent(request: MockLLMRequest): string {
    const prompt = request.prompt.toLowerCase();

    // Pattern-based responses
    if (prompt.includes('hello') || prompt.includes('hi')) {
      return 'Hello! I am a mock AI assistant. How can I help you today?';
    }

    if (prompt.includes('error') || prompt.includes('fail')) {
      return 'I understand you are testing error scenarios. This is a mock error response.';
    }

    if (prompt.includes('code') || prompt.includes('function')) {
      return '```typescript\nfunction example() {\n  return "This is a mock code response";\n}\n```';
    }

    if (prompt.includes('summarize') || prompt.includes('summary')) {
      return 'This is a mock summary of the provided content. Key points: 1) Mock testing, 2) Deterministic responses, 3) No API keys required.';
    }

    if (prompt.includes('translate')) {
      return 'Translated text: [Mock translation response]';
    }

    if (prompt.includes('analyze') || prompt.includes('analysis')) {
      return 'Analysis: This is a mock analysis response with structured insights about the provided input.';
    }

    // Check for tool usage requests
    if (request.tools && request.tools.length > 0) {
      const toolNames = request.tools.map((t) => t.name).join(', ');
      return `I have access to the following tools: ${toolNames}. I will use them to help answer your question.`;
    }

    // Default response
    return `Mock response to: "${request.prompt.substring(0, 50)}${request.prompt.length > 50 ? '...' : ''}"`;
  }

  /**
   * Generate mock tool calls based on request
   */
  private generateToolCalls(
    request: MockLLMRequest
  ): Array<{ name: string; arguments: Record<string, unknown> }> {
    const toolCalls: Array<{
      name: string;
      arguments: Record<string, unknown>;
    }> = [];

    if (!request.tools || request.tools.length === 0) {
      return toolCalls;
    }

    const prompt = typeof request.prompt === 'string' ? request.prompt.toLowerCase() : '';

    // Simulate tool calls based on prompt keywords
    for (const tool of request.tools) {
      if (
        prompt.includes(tool.name.toLowerCase()) ||
        (tool.description && prompt.includes(tool.description.toLowerCase()))
      ) {
        toolCalls.push({
          name: tool.name,
          arguments: this.generateToolArguments(tool.name, prompt),
        });
      }
    }

    // If prompt explicitly asks to use tools
    if (
      (prompt.includes('use') || prompt.includes('call')) &&
      (prompt.includes('tool') || prompt.includes('function'))
    ) {
      if (toolCalls.length === 0 && request.tools.length > 0) {
        // Use first available tool
        const tool = request.tools[0];
        toolCalls.push({
          name: tool.name,
          arguments: this.generateToolArguments(tool.name, prompt),
        });
      }
    }

    return toolCalls;
  }

  /**
   * Generate mock tool arguments
   */
  private generateToolArguments(
    toolName: string,
    prompt: string
  ): Record<string, unknown> {
    // Generate reasonable mock arguments based on tool name
    const args: Record<string, unknown> = {};

    if (toolName.includes('search')) {
      args.query = 'mock search query';
      args.limit = 10;
    } else if (toolName.includes('fetch') || toolName.includes('get')) {
      args.url = 'https://example.com/mock';
    } else if (toolName.includes('calculate') || toolName.includes('math')) {
      args.expression = '2 + 2';
    } else if (toolName.includes('write') || toolName.includes('save')) {
      args.content = 'mock content';
      args.filename = 'mock-file.txt';
    } else if (toolName.includes('read')) {
      args.filename = 'mock-file.txt';
    } else {
      // Generic mock argument
      args.input = 'mock input data';
    }

    return args;
  }

  /**
   * Reset call count
   */
  resetCallCount(): void {
    this.callCount = 0;
  }

  /**
   * Get call count
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MockLLMConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
