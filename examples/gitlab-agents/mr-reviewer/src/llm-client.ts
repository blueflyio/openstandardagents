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
      max_tokens: 16384,
      temperature: 0.2,
      system: systemPrompt || `You are an expert code reviewer for the OSSA project.

Review criteria:
1. Code Quality
   - DRY principle violations
   - SOLID principle adherence
   - Complexity (cyclomatic, cognitive)
   - Code smells

2. Architecture
   - API-First pattern compliance
   - Dependency injection usage
   - Module boundaries
   - Type safety

3. Security
   - Credentials in code
   - SQL injection risks
   - XSS vulnerabilities
   - Dependency vulnerabilities

4. Performance
   - N+1 queries
   - Memory leaks
   - Inefficient algorithms
   - Bundle size impact

5. Production-Grade
   - Structured logging (Pino)
   - Error handling (OssaError)
   - Configuration externalization
   - Test coverage

Provide:
- Clear, actionable feedback
- Code examples for improvements
- Severity ratings (critical, high, medium, low)
- Blocking vs non-blocking issues
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
