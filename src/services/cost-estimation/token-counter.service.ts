/**
 * OSSA Cost Estimation - Token Counter Service
 * Estimates token counts for various text inputs
 *
 * Uses approximate tokenization (4 chars ≈ 1 token for English)
 * For production use, consider integrating tiktoken for OpenAI models
 * or model-specific tokenizers for other providers
 */

import type { OssaAgent } from '../../types/index.js';
import yaml from 'yaml';

export interface TokenCount {
  systemPrompt: number;
  tools: number;
  instructions: number;
  examples: number;
  total: number;
  breakdown: {
    [key: string]: number;
  };
}

export class TokenCounterService {
  /**
   * Approximate tokens in text (4 chars ≈ 1 token for English)
   * This is a rough estimate. For accurate counts, use model-specific tokenizers.
   */
  private estimateTokens(text: string): number {
    if (!text) return 0;
    // Account for code, JSON, and technical content (lower ratio)
    const isCodeOrTechnical = /[{}\[\]()<>]/.test(text) || /```/.test(text);
    const charsPerToken = isCodeOrTechnical ? 3 : 4;
    return Math.ceil(text.length / charsPerToken);
  }

  /**
   * Count tokens in an OSSA agent manifest
   */
  countAgentTokens(agent: OssaAgent): TokenCount {
    const breakdown: { [key: string]: number } = {};

    // Instructions (from spec or agent)
    let instructions = 0;
    const instructionsText = agent.spec?.instructions || '';
    if (instructionsText) {
      instructions = this.estimateTokens(instructionsText);
    }
    breakdown['instructions'] = instructions;

    // Role description
    const role = agent.spec?.role || agent.agent?.role || '';
    const roleTokens = this.estimateTokens(role);
    breakdown['role'] = roleTokens;

    // Description
    const description =
      agent.metadata?.description || agent.agent?.description || '';
    const descTokens = this.estimateTokens(description);
    breakdown['description'] = descTokens;

    // Tools (from spec or agent)
    let tools = 0;
    const agentTools = agent.spec?.tools || agent.agent?.tools;
    if (agentTools) {
      const toolsText = JSON.stringify(agentTools);
      tools = this.estimateTokens(toolsText);
    }
    breakdown['tools'] = tools;

    // Examples (if any)
    const examples = 0;
    breakdown['examples'] = examples;

    // Extensions (if any add context)
    let extensions = 0;
    if (agent.extensions) {
      const extensionsText = JSON.stringify(agent.extensions);
      extensions = this.estimateTokens(extensionsText);
    }
    breakdown['extensions'] = extensions;

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    // For return values (backwards compatibility)
    const systemPrompt = instructions + roleTokens + descTokens;

    return {
      systemPrompt,
      tools,
      instructions,
      examples,
      total,
      breakdown,
    };
  }

  /**
   * Estimate tokens for a typical user message
   */
  estimateUserMessage(length: 'short' | 'medium' | 'long' = 'medium'): number {
    const lengths = {
      short: 50, // "Create a user profile"
      medium: 200, // A paragraph of instructions
      long: 800, // Detailed requirements with context
    };
    return lengths[length];
  }

  /**
   * Estimate tokens for a typical assistant response
   */
  estimateAssistantResponse(
    length: 'short' | 'medium' | 'long' = 'medium'
  ): number {
    const lengths = {
      short: 100, // Brief confirmation or result
      medium: 500, // Explanation with code snippet
      long: 2000, // Detailed response with examples
    };
    return lengths[length];
  }

  /**
   * Estimate total tokens for a conversation turn
   */
  estimateConversationTurn(
    systemTokens: number,
    userLength: 'short' | 'medium' | 'long' = 'medium',
    assistantLength: 'short' | 'medium' | 'long' = 'medium'
  ): {
    input: number;
    output: number;
    total: number;
  } {
    const userTokens = this.estimateUserMessage(userLength);
    const assistantTokens = this.estimateAssistantResponse(assistantLength);

    // Input = system + user message + conversation history overhead
    const input = systemTokens + userTokens;

    // Output = assistant response
    const output = assistantTokens;

    return {
      input,
      output,
      total: input + output,
    };
  }

  /**
   * Format token count for display
   */
  formatTokenCount(count: number): string {
    if (count < 1000) {
      return `${count} tokens`;
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K tokens`;
    } else {
      return `${(count / 1000000).toFixed(2)}M tokens`;
    }
  }
}
