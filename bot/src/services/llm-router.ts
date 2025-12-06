import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export class LLMRouter {
  private anthropic: Anthropic;
  private openai: OpenAI;
  
  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  
  async ask(question: string, provider: 'claude' | 'gpt' | 'auto' = 'auto'): Promise<string> {
    const selectedProvider = provider === 'auto' ? this.selectProvider(question) : provider;
    
    if (selectedProvider === 'claude') {
      return this.askClaude(question);
    } else {
      return this.askGPT(question);
    }
  }
  
  private selectProvider(question: string): 'claude' | 'gpt' {
    // Route based on question type
    const lowerQ = question.toLowerCase();
    
    // Claude for: analysis, reasoning, long-form
    if (lowerQ.includes('analyze') || lowerQ.includes('explain') || lowerQ.includes('why')) {
      return 'claude';
    }
    
    // GPT for: code, quick answers, structured data
    if (lowerQ.includes('code') || lowerQ.includes('example') || lowerQ.includes('json')) {
      return 'gpt';
    }
    
    // Default to Claude
    return 'claude';
  }
  
  private async askClaude(question: string): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an expert on OSSA (Open Standard Agents). Answer this question concisely:\n\n${question}`
      }]
    });
    
    const content = message.content[0];
    return content.type === 'text' ? content.text : 'Unable to generate response';
  }
  
  private async askGPT(question: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 1024,
      messages: [{
        role: 'system',
        content: 'You are an expert on OSSA (Open Standard Agents). Answer questions concisely.'
      }, {
        role: 'user',
        content: question
      }]
    });
    
    return completion.choices[0]?.message?.content || 'Unable to generate response';
  }
}
