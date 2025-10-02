/**
 * OSSA Model Router Pattern
 * =========================
 * 
 * This example demonstrates the Model Router pattern for OSSA agents, which allows
 * dynamic selection of language models based on task requirements, cost constraints,
 * and performance needs.
 * 
 * Key Features:
 * - Dynamic model selection based on task requirements
 * - Cost-aware routing
 * - Performance optimization
 * - Fallback strategies
 * 
 * Directory Structure:
 * examples/advanced/patterns/
 *   ├── model-router.ts      # This file
 *   └── README.md            # Documentation
 * 
 * Prerequisites:
 * - Node.js 18+
 * - TypeScript 5.0+
 * - Ollama running locally (for local models)
 * - API keys for cloud providers (if used)
 * 
 * Usage:
 * 1. Install dependencies: `npm install @ossa/core dotenv`
 * 2. Start Ollama: `ollama serve`
 * 3. Pull models: `ollama pull llama3`
 * 4. Run: `npx ts-node model-router.ts`
 */

import { Agent, AgentConfig, AgentContext, AgentResponse } from '@ossa/core';
import dotenv from 'dotenv';

dotenv.config();

// Define model configurations
const MODEL_CONFIGS = {
  'llama3': {
    provider: 'ollama',
    model: 'llama3',
    costPerToken: 0.000002,
    avgLatencyMs: 1200,
    maxTokens: 8192,
    capabilities: ['text-generation', 'summarization', 'qna']
  },
  'mixtral': {
    provider: 'ollama',
    model: 'mixtral',
    costPerToken: 0.000003,
    avgLatencyMs: 1800,
    maxTokens: 32000,
    capabilities: ['text-generation', 'code', 'reasoning']
  },
  'gpt-4': {
    provider: 'openai',
    model: 'gpt-4-turbo',
    costPerToken: 0.00001,
    avgLatencyMs: 2500,
    maxTokens: 128000,
    capabilities: ['text-generation', 'code', 'reasoning', 'vision']
  },
  'claude-3-opus': {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    costPerToken: 0.000015,
    avgLatencyMs: 3000,
    maxTokens: 200000,
    capabilities: ['text-generation', 'analysis', 'summarization']
  }
};

type ModelKey = keyof typeof MODEL_CONFIGS;

interface ModelRequest {
  prompt: string;
  context?: Record<string, any>;
  requirements?: {
    maxCostPerToken?: number;
    maxLatencyMs?: number;
    minCapabilities?: string[];
    minContextLength?: number;
  };
}

class ModelRouterAgent extends Agent {
  private models: Record<string, any> = MODEL_CONFIGS;
  
  constructor() {
    super({
      name: 'model-router',
      version: '1.0.0',
      description: 'Intelligent model routing for OSSA agents',
      capabilities: ['model-routing', 'cost-optimization', 'performance-monitoring']
    });
  }

  /**
   * Select the best model based on requirements
   */
  private selectModel(requirements: ModelRequest['requirements'] = {}): ModelKey {
    const { 
      maxCostPerToken = Infinity,
      maxLatencyMs = 5000,
      minCapabilities = [],
      minContextLength = 0
    } = requirements;

    // Filter models by requirements
    const suitableModels = Object.entries(this.models)
      .filter(([_, config]) => {
        // Check cost constraints
        if (config.costPerToken > maxCostPerToken) return false;
        
        // Check latency constraints
        if (config.avgLatencyMs > maxLatencyMs) return false;
        
        // Check context length
        if (config.maxTokens < minContextLength) return false;
        
        // Check required capabilities
        return minCapabilities.every(cap => 
          config.capabilities.includes(cap)
        );
      })
      .sort((a, b) => {
        // Prioritize lower cost, then lower latency
        const costDiff = a[1].costPerToken - b[1].costPerToken;
        if (costDiff !== 0) return costDiff;
        return a[1].avgLatencyMs - b[1].avgLatencyMs;
      });

    if (suitableModels.length === 0) {
      throw new Error('No suitable models found for the given requirements');
    }

    return suitableModels[0][0] as ModelKey;
  }

  /**
   * Process a request using the best available model
   */
  async process(request: ModelRequest, context: AgentContext): Promise<AgentResponse> {
    try {
      // Select the best model
      const modelKey = this.selectModel(request.requirements);
      const modelConfig = this.models[modelKey];
      
      this.logger.info(`Selected model: ${modelKey}`, { model: modelKey });
      
      // Process the request with the selected model
      const result = await this.callModel(modelKey, request.prompt, context);
      
      return {
        success: true,
        data: {
          response: result,
          model: modelKey,
          metadata: {
            cost: request.prompt.length * modelConfig.costPerToken,
            latency: modelConfig.avgLatencyMs,
            provider: modelConfig.provider
          }
        }
      };
    } catch (error) {
      this.logger.error('Model routing failed', { error });
      return {
        success: false,
        error: {
          code: 'MODEL_ROUTING_ERROR',
          message: error.message,
          details: error.stack
        }
      };
    }
  }

  /**
   * Call the actual model (implementation would vary by provider)
   */
  private async callModel(
    modelKey: string, 
    prompt: string, 
    context: AgentContext
  ): Promise<string> {
    const model = this.models[modelKey];
    
    // In a real implementation, this would call the actual model APIs
    // This is a simplified example
    switch (model.provider) {
      case 'ollama':
        return this.callOllama(model.model, prompt);
      case 'openai':
        return this.callOpenAI(model.model, prompt);
      case 'anthropic':
        return this.callAnthropic(model.model, prompt);
      default:
        throw new Error(`Unsupported provider: ${model.provider}`);
    }
  }

  // Stub implementations for model providers
  private async callOllama(model: string, prompt: string): Promise<string> {
    // Implementation would call Ollama's API
    return `Response from Ollama (${model}) for prompt: ${prompt.substring(0, 50)}...`;
  }

  private async callOpenAI(model: string, prompt: string): Promise<string> {
    // Implementation would call OpenAI's API
    return `Response from OpenAI (${model}) for prompt: ${prompt.substring(0, 50)}...`;
  }

  private async callAnthropic(model: string, prompt: string): Promise<string> {
    // Implementation would call Anthropic's API
    return `Response from Anthropic (${model}) for prompt: ${prompt.substring(0, 50)}...`;
  }
}

// Example usage
async function main() {
  const router = new ModelRouterAgent();
  
  // Example 1: Fast, low-cost response
  const response1 = await router.process({
    prompt: 'Explain quantum computing in simple terms',
    requirements: {
      maxCostPerToken: 0.000005,
      maxLatencyMs: 2000,
      minCapabilities: ['text-generation']
    }
  }, {});
  
  console.log('Example 1 - Fast, low-cost response:');
  console.log(response1);
  
  // Example 2: Complex reasoning with higher budget
  const response2 = await router.process({
    prompt: 'Write a detailed analysis of the latest AI safety research papers',
    requirements: {
      maxCostPerToken: 0.00002,
      maxLatencyMs: 10000,
      minCapabilities: ['analysis', 'reasoning'],
      minContextLength: 16000
    }
  }, {});
  
  console.log('\nExample 2 - Complex analysis:');
  console.log(response2);
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { ModelRouterAgent };
