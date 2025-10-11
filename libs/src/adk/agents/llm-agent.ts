/**
 * ADK LlmAgent implementation for OSSA with Ollama integration
 */

import { ADKAgent, ADKAgentConfig } from './index.js';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  thinking?: string;
}

export class OSSALlmAgent implements ADKAgent {
  type: 'LlmAgent' = 'LlmAgent';
  config: ADKAgentConfig;
  ossaType?: string;
  private ollamaBaseUrl: string;
  private ollamaModel: string;

  constructor(config: ADKAgentConfig, ossaType?: string) {
    this.config = config;
    this.ossaType = ossaType;
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
  }

  /**
   * Invoke the agent with input
   */
  async invoke(input: any, session?: any): Promise<any> {
    // Prepare context with session state
    const context = this.prepareContext(input, session);

    // Execute with model (simulated)
    const result = await this.executeWithModel(context);

    // Save to session state if output_key specified
    if (this.config.output_key && session) {
      session.state[this.config.output_key] = result;
    }

    return result;
  }

  /**
   * Prepare context with session state interpolation
   */
  private prepareContext(input: any, session?: any): any {
    let instruction = this.config.instruction;

    // Interpolate session state variables
    if (session?.state) {
      instruction = this.interpolateState(instruction, session.state);
    }

    return {
      instruction,
      input,
      tools: this.config.tools || []
    };
  }

  /**
   * Interpolate state variables in instruction
   */
  private interpolateState(instruction: string, state: any): string {
    return instruction.replace(/\{(\w+)\}/g, (match, key) => {
      return state[key] !== undefined ? state[key] : match;
    });
  }

  /**
   * Execute with Ollama model
   */
  private async executeWithModel(context: any): Promise<any> {
    try {
      console.log(`Executing LlmAgent: ${this.config.name} with Ollama model: ${this.ollamaModel}`);

      const prompt = `${context.instruction}\n\nInput: ${JSON.stringify(context.input)}`;

      const response = await this.callOllama(prompt);

      return {
        success: true,
        output: response.response,
        model: response.model,
        thinking: response.thinking,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Ollama execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Call Ollama API
   */
  private async callOllama(prompt: string): Promise<OllamaResponse> {
    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as OllamaResponse;
  }
}
