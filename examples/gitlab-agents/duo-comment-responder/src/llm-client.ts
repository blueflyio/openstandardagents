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
      max_tokens: 8192,
      temperature: 0.3,
      system: systemPrompt || `You are a code quality reviewer working collaboratively with GitLab Duo.

Your role:
1. Analyze Duo's suggestions carefully
2. Agree or respectfully disagree with technical reasoning
3. Implement fixes when Duo identifies valid issues
4. Ask clarifying questions if Duo's suggestion is unclear
5. Post clear, professional responses
6. Create commits with detailed explanations

Guidelines:
- Be constructive and professional
- Explain your reasoning
- Show code examples in responses
- Use conventional commit messages
- Continue dialogue until issue is resolved

Remember: You and Duo are teammates working toward code quality.
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
