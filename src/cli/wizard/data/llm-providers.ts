/**
 * OSSA LLM Providers Data
 * LLM provider and model information with pricing
 */

import type { LLMProviderInfo } from '../types.js';

export const LLM_PROVIDERS: LLMProviderInfo[] = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    pricingTier: 'medium',
    models: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        description: 'Best balance of intelligence and speed',
        contextWindow: 200000,
        costPer1MTokens: 3.0,
        recommended: true,
        supportsFunctionCalling: true,
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        description: 'Most capable model for complex tasks',
        contextWindow: 200000,
        costPer1MTokens: 15.0,
        recommended: false,
        supportsFunctionCalling: true,
      },
      {
        id: 'claude-haiku-4-20250514',
        name: 'Claude Haiku 4',
        description: 'Fast and cost-effective',
        contextWindow: 200000,
        costPer1MTokens: 0.8,
        recommended: false,
        supportsFunctionCalling: true,
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    pricingTier: 'medium',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Multimodal flagship model',
        contextWindow: 128000,
        costPer1MTokens: 2.5,
        recommended: true,
        supportsFunctionCalling: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Affordable and capable',
        contextWindow: 128000,
        costPer1MTokens: 0.15,
        recommended: false,
        supportsFunctionCalling: true,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Enhanced GPT-4 with lower pricing',
        contextWindow: 128000,
        costPer1MTokens: 10.0,
        recommended: false,
        supportsFunctionCalling: true,
      },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    pricingTier: 'low',
    models: [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash',
        description: 'Fast and efficient experimental model',
        contextWindow: 1000000,
        costPer1MTokens: 0.0,
        recommended: true,
        supportsFunctionCalling: true,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Advanced reasoning and long context',
        contextWindow: 2000000,
        costPer1MTokens: 1.25,
        recommended: false,
        supportsFunctionCalling: true,
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast multimodal model',
        contextWindow: 1000000,
        costPer1MTokens: 0.075,
        recommended: false,
        supportsFunctionCalling: true,
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    pricingTier: 'low',
    models: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        description: 'Flagship model with top-tier performance',
        contextWindow: 128000,
        costPer1MTokens: 2.0,
        recommended: true,
        supportsFunctionCalling: true,
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Mixture of experts model',
        contextWindow: 32768,
        costPer1MTokens: 0.7,
        recommended: false,
        supportsFunctionCalling: true,
      },
    ],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    pricingTier: 'medium',
    models: [
      {
        id: 'command-r-plus',
        name: 'Command R+',
        description: 'Enterprise-grade model with RAG',
        contextWindow: 128000,
        costPer1MTokens: 3.0,
        recommended: true,
        supportsFunctionCalling: true,
      },
      {
        id: 'command-r',
        name: 'Command R',
        description: 'Balanced performance and cost',
        contextWindow: 128000,
        costPer1MTokens: 0.5,
        recommended: false,
        supportsFunctionCalling: true,
      },
    ],
  },
];

export function getProviderById(id: string): LLMProviderInfo | undefined {
  return LLM_PROVIDERS.find((p) => p.id === id);
}

export function getModelById(
  providerId: string,
  modelId: string
): LLMProviderInfo['models'][0] | undefined {
  const provider = getProviderById(providerId);
  return provider?.models.find((m) => m.id === modelId);
}

export function estimateMonthlyCost(
  modelId: string,
  tokensPerDay: number
): number {
  for (const provider of LLM_PROVIDERS) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) {
      const tokensPerMonth = tokensPerDay * 30;
      return (tokensPerMonth / 1000000) * model.costPer1MTokens;
    }
  }
  return 0;
}
