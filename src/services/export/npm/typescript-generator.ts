/**
 * TypeScript Code Generator
 *
 * Generates TypeScript agent class from OSSA manifest
 *
 * SOLID: Single Responsibility - TypeScript code generation only
 * DRY: Reusable code templates
 */

import type { OssaAgent } from '../../../types/index.js';

export interface Tool {
  name: string;
  description: string;
  type?: string;
  parameters?: Record<string, any>;
}

/**
 * TypeScript Agent Code Generator
 */
export class TypeScriptGenerator {
  /**
   * Generate main agent class
   */
  generateAgentClass(manifest: OssaAgent): string {
    const metadata = manifest.metadata || { name: 'Agent', version: '1.0.0' };
    const spec = manifest.spec || {};
    const className = this.toClassName(metadata.name);
    const llm = (spec as any).llm || {};
    const provider = llm.provider || 'openai';

    // Determine SDK import based on provider
    const sdkImport = this.getSDKImport(provider);
    const clientInit = this.getClientInit(provider, llm);

    return `/**
 * ${className} - OSSA Agent
 *
 * Generated from OSSA manifest
 * Version: ${metadata.version}
 */

${sdkImport}
import type { ChatRequest, ChatResponse, AgentMetadata } from './types.js';
${this.hasTools(spec) ? `import { tools } from './tools/index.js';` : ''}

/**
 * Agent configuration
 */
const config = {
  name: '${metadata.name}',
  version: '${metadata.version}',
  description: '${metadata.description || ''}',
  role: \`${this.escapeBackticks((spec as any).role || 'You are a helpful AI assistant.')}\`,
  llm: {
    provider: '${provider}',
    model: '${llm.model || this.getDefaultModel(provider)}',
    temperature: ${llm.temperature ?? 0.7},
    maxTokens: ${llm.maxTokens ?? 2000},
  },
};

/**
 * ${className} implementation
 */
export class ${className} {
  private client: any;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    ${clientInit}
  }

  /**
   * Send chat message to agent
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: request.message,
      });

      // Build messages array with system prompt
      const messages = [
        {
          role: 'system',
          content: config.role,
        },
        ...this.conversationHistory,
      ];

      ${this.generateChatLogic(provider, llm)}

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: responseText,
      });

      return {
        message: responseText,
        metadata: {
          model: config.llm.model,
          provider: config.llm.provider,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Chat error:', error);
      throw new Error(\`Agent chat failed: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }

  /**
   * Reset conversation history
   */
  reset(): void {
    this.conversationHistory = [];
  }

  /**
   * Get agent metadata
   */
  getMetadata(): AgentMetadata {
    return {
      name: config.name,
      version: config.version,
      description: config.description,
      role: config.role,
      llm: config.llm,
      ${this.hasTools(spec) ? `tools: tools.map(t => ({ name: t.name, description: t.description })),` : ''}
    };
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }
}

/**
 * Default export
 */
export default ${className};
`;
  }

  /**
   * Generate TypeScript types
   */
  generateTypes(manifest: OssaAgent): string {
    const spec = manifest.spec || {};

    return `/**
 * Type definitions for agent
 */

/**
 * Chat request
 */
export interface ChatRequest {
  /**
   * User message
   */
  message: string;

  /**
   * Optional conversation context
   */
  context?: Record<string, any>;

  /**
   * Optional tool selection
   */
  tools?: string[];
}

/**
 * Chat response
 */
export interface ChatResponse {
  /**
   * Agent response message
   */
  message: string;

  /**
   * Response metadata
   */
  metadata?: {
    model?: string;
    provider?: string;
    timestamp?: string;
    tokensUsed?: number;
    toolCalls?: Array<{
      tool: string;
      result: any;
    }>;
  };
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  name: string;
  version: string;
  description: string;
  role: string;
  llm: LLMConfig;
  ${this.hasTools(spec) ? 'tools?: ToolMetadata[];' : ''}
}

/**
 * LLM configuration
 */
export interface LLMConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

${
  this.hasTools(spec)
    ? `
/**
 * Tool metadata
 */
export interface ToolMetadata {
  name: string;
  description: string;
}
`
    : ''
}

/**
 * Error types
 */
export class AgentError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AgentError';
  }
}
`;
  }

  /**
   * Generate tool implementations
   */
  generateTools(tools: any[]): Record<string, string> {
    const files: Record<string, string> = {};

    // Generate index.ts that exports all tools
    const toolImports = tools
      .map((tool, idx) => {
        const name = typeof tool === 'string' ? tool : tool.name;
        return `import { ${this.toCamelCase(name)}Tool } from './${name}.js';`;
      })
      .join('\n');

    const toolExports = tools
      .map((tool) => {
        const name = typeof tool === 'string' ? tool : tool.name;
        return `  ${this.toCamelCase(name)}Tool,`;
      })
      .join('\n');

    files['index.ts'] = `/**
 * Tool implementations
 */

${toolImports}

export const tools = [
${toolExports}
];
`;

    // Generate each tool file
    for (const tool of tools) {
      const toolName = typeof tool === 'string' ? tool : tool.name;
      const toolDesc =
        typeof tool === 'object' && tool.description
          ? tool.description
          : `${toolName} tool`;

      files[`${toolName}.ts`] = this.generateToolImplementation(
        toolName,
        toolDesc
      );
    }

    return files;
  }

  /**
   * Generate single tool implementation
   */
  private generateToolImplementation(
    name: string,
    description: string
  ): string {
    const className = this.toCamelCase(name) + 'Tool';

    return `/**
 * ${name} Tool
 *
 * ${description}
 */

export interface ${className}Input {
  // TODO: Define tool input parameters
  [key: string]: any;
}

export interface ${className}Output {
  // TODO: Define tool output structure
  result: any;
}

/**
 * ${name} tool implementation
 */
export const ${className} = {
  name: '${name}',
  description: '${description}',

  /**
   * Execute tool
   */
  async execute(input: ${className}Input): Promise<${className}Output> {
    // TODO: Implement tool logic
    console.log('Executing ${name} with input:', input);

    return {
      result: 'TODO: Implement ${name} tool',
    };
  },
};
`;
  }

  /**
   * Get SDK import based on provider
   */
  private getSDKImport(provider: string): string {
    const imports: Record<string, string> = {
      openai: "import OpenAI from 'openai';",
      anthropic: "import Anthropic from '@anthropic-ai/sdk';",
      'google-ai':
        "import { GoogleGenerativeAI } from '@google/generative-ai';",
      bedrock:
        "import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';",
    };

    return imports[provider] || imports.openai;
  }

  /**
   * Get client initialization code
   */
  private getClientInit(provider: string, llm: any): string {
    const inits: Record<string, string> = {
      openai: `this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
    });`,
      anthropic: `this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.LLM_API_KEY,
    });`,
      'google-ai': `this.client = new GoogleGenerativeAI(
      process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY || ''
    );`,
      bedrock: `this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });`,
    };

    return inits[provider] || inits.openai;
  }

  /**
   * Generate chat logic based on provider
   */
  private generateChatLogic(provider: string, llm: any): string {
    const logic: Record<string, string> = {
      openai: `// Call OpenAI API
      const completion = await this.client.chat.completions.create({
        model: config.llm.model,
        messages: messages as any,
        temperature: config.llm.temperature,
        max_tokens: config.llm.maxTokens,
      });

      const responseText = completion.choices[0]?.message?.content || 'No response';`,

      anthropic: `// Call Anthropic API
      const message = await this.client.messages.create({
        model: config.llm.model,
        max_tokens: config.llm.maxTokens,
        temperature: config.llm.temperature,
        system: messages[0].content,
        messages: messages.slice(1) as any,
      });

      const responseText = message.content[0]?.type === 'text'
        ? message.content[0].text
        : 'No response';`,

      'google-ai': `// Call Google AI API
      const model = this.client.getGenerativeModel({ model: config.llm.model });
      const result = await model.generateContent(messages[messages.length - 1].content);
      const responseText = result.response.text();`,

      bedrock: `// Call Bedrock API
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: config.llm.maxTokens,
        temperature: config.llm.temperature,
        messages: messages.slice(1),
        system: messages[0].content,
      };

      const command = new InvokeModelCommand({
        modelId: config.llm.model,
        body: JSON.stringify(payload),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const responseText = responseBody.content[0]?.text || 'No response';`,
    };

    return logic[provider] || logic.openai;
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      openai: 'gpt-4',
      anthropic: 'claude-3-5-sonnet-20241022',
      'google-ai': 'gemini-pro',
      bedrock: 'anthropic.claude-3-sonnet-20240229-v1:0',
    };

    return defaults[provider] || 'gpt-4';
  }

  /**
   * Check if manifest has tools
   */
  private hasTools(spec: any): boolean {
    return spec.tools && Array.isArray(spec.tools) && spec.tools.length > 0;
  }

  /**
   * Convert string to PascalCase class name
   */
  private toClassName(name: string): string {
    return name
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(name: string): string {
    const className = this.toClassName(name);
    return className.charAt(0).toLowerCase() + className.slice(1);
  }

  /**
   * Escape backticks in template strings
   */
  private escapeBackticks(str: string): string {
    return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  }
}
