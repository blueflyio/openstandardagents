import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';

export interface LLMClientConfig {
  apiKey: string;
  model?: string;
}

export class LLMClient {
  private anthropic: Anthropic;
  private model: string;

  constructor(config: LLMClientConfig) {
    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-sonnet-4-5';
  }

  /**
   * Invoke LLM with prompt
   */
  async invoke(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 32000,
      temperature: 0.1,
      system: systemPrompt || `You are a CI/CD remediation specialist.

Your role:
1. Analyze pipeline failure logs
2. Identify root cause (TypeScript errors, test failures, lint errors, etc.)
3. Generate precise fixes
4. Create MR with fix and detailed explanation

Common failure types:
- TypeScript compilation errors
- Test failures
- Lint/format errors
- Dependency issues
- Configuration errors
- Build failures

Response format:
- Root cause analysis
- Fix strategy
- Code changes
- Commit message
- MR description
`,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response type from LLM');
  }

  /**
   * Invoke LLM and parse JSON response
   */
  async invokeJSON<T = any>(prompt: string, systemPrompt?: string): Promise<T> {
    const response = await this.invoke(prompt, systemPrompt);

    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;

    return JSON.parse(jsonStr);
  }
}
