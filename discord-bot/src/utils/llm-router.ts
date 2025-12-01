import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { config } from '../config';
import logger from './logger';

interface LLMResponse {
  answer: string;
  provider: string;
  model: string;
}

const OSSA_CONTEXT = `You are an expert on OSSA (Open Standard for Agent Systems). OSSA is a specification for building interoperable, composable agent systems.

Key concepts:
- **Manifest**: Every agent has a manifest.json defining its identity, capabilities, runtime, and dependencies
- **Agent Types**: Worker (stateless task execution), Supervisor (agent coordination), Hybrid (both capabilities)
- **Capabilities**: Named functions with parameter and return schemas (JSON Schema format)
- **Communication**: Supports HTTP, gRPC, WebSocket, stdio, and message queues
- **Runtime**: Specifies execution engine (Node.js, Python, Docker, Bash) and environment requirements

Manifest Structure:
{
  "name": "agent-name",           // lowercase, alphanumeric, hyphens
  "version": "1.0.0",             // semantic versioning
  "ossa_version": "1.0.0",        // OSSA spec version
  "type": "worker|supervisor|hybrid",
  "description": "What this agent does",
  "capabilities": [               // Required: at least one capability
    {
      "name": "capability-name",
      "description": "What it does",
      "parameters": { /* JSON Schema */ },
      "returns": { /* JSON Schema */ }
    }
  ],
  "runtime": {
    "engine": "node|python|docker|bash",
    "version": ">=18.0.0",
    "entrypoint": "src/index.js"
  },
  "communication": {
    "protocols": ["http"],
    "endpoints": { "health": "/health" }
  },
  "dependencies": {
    "agents": [],
    "services": []
  },
  "metadata": {
    "author": "Author Name",
    "license": "MIT",
    "repository": "https://github.com/...",
    "tags": ["tag1", "tag2"]
  }
}

Answer questions clearly, provide examples when helpful, and keep responses concise.`;

class LLMRouter {
  private anthropicClient?: Anthropic;
  private openaiClient?: OpenAI;

  constructor() {
    if (config.ai.anthropicApiKey) {
      this.anthropicClient = new Anthropic({ apiKey: config.ai.anthropicApiKey });
    }
    if (config.ai.openaiApiKey) {
      this.openaiClient = new OpenAI({ apiKey: config.ai.openaiApiKey });
    }
  }

  async getOSSAContext(_question: string): Promise<string> {
    // Could be extended to search documentation, examples, etc.
    return OSSA_CONTEXT;
  }

  async ask(
    question: string,
    context: string,
    preferredProvider?: 'anthropic' | 'openai'
  ): Promise<LLMResponse> {
    // Determine which provider to use
    const provider = preferredProvider || (this.anthropicClient ? 'anthropic' : 'openai');

    if (provider === 'anthropic' && this.anthropicClient) {
      return await this.askAnthropic(question, context);
    } else if (provider === 'openai' && this.openaiClient) {
      return await this.askOpenAI(question, context);
    } else {
      throw new Error(`Provider ${provider} not configured`);
    }
  }

  private async askAnthropic(question: string, context: string): Promise<LLMResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    logger.info('Querying Anthropic', { question: question.substring(0, 50) });

    const response = await this.anthropicClient.messages.create({
      model: config.ai.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: context,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Anthropic');
    }

    return {
      answer: content.text,
      provider: 'Anthropic',
      model: response.model,
    };
  }

  private async askOpenAI(question: string, context: string): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    logger.info('Querying OpenAI', { question: question.substring(0, 50) });

    const response = await this.openaiClient.chat.completions.create({
      model: config.ai.model || 'gpt-4-turbo-preview',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: question },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return {
      answer: content,
      provider: 'OpenAI',
      model: response.model,
    };
  }
}

export const llmRouter = new LLMRouter();
