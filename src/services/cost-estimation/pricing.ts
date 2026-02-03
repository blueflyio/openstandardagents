/**
 * OSSA Cost Estimation - Pricing Database
 * Model pricing information for major LLM providers
 *
 * Pricing as of 2026-02-03
 * All prices in USD per 1M tokens
 */

export interface ModelPricing {
  provider: string;
  model: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  contextWindow: number;
  description?: string;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI Models
  'gpt-4': {
    provider: 'openai',
    model: 'gpt-4',
    inputPricePerMillion: 30.0,
    outputPricePerMillion: 60.0,
    contextWindow: 8192,
    description: 'GPT-4 (8K context)',
  },
  'gpt-4-32k': {
    provider: 'openai',
    model: 'gpt-4-32k',
    inputPricePerMillion: 60.0,
    outputPricePerMillion: 120.0,
    contextWindow: 32768,
    description: 'GPT-4 (32K context)',
  },
  'gpt-4-turbo': {
    provider: 'openai',
    model: 'gpt-4-turbo',
    inputPricePerMillion: 10.0,
    outputPricePerMillion: 30.0,
    contextWindow: 128000,
    description: 'GPT-4 Turbo',
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    inputPricePerMillion: 5.0,
    outputPricePerMillion: 15.0,
    contextWindow: 128000,
    description: 'GPT-4o (optimized)',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    contextWindow: 128000,
    description: 'GPT-4o Mini (cost-optimized)',
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    inputPricePerMillion: 0.5,
    outputPricePerMillion: 1.5,
    contextWindow: 16385,
    description: 'GPT-3.5 Turbo',
  },
  'gpt-3.5-turbo-16k': {
    provider: 'openai',
    model: 'gpt-3.5-turbo-16k',
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 4.0,
    contextWindow: 16385,
    description: 'GPT-3.5 Turbo (16K)',
  },

  // Anthropic Models
  'claude-opus-4': {
    provider: 'anthropic',
    model: 'claude-opus-4',
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
    contextWindow: 200000,
    description: 'Claude Opus 4 (most capable)',
  },
  'claude-sonnet-4': {
    provider: 'anthropic',
    model: 'claude-sonnet-4',
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    contextWindow: 200000,
    description: 'Claude Sonnet 4 (balanced)',
  },
  'claude-haiku-4': {
    provider: 'anthropic',
    model: 'claude-haiku-4',
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4.0,
    contextWindow: 200000,
    description: 'Claude Haiku 4 (fast and affordable)',
  },
  'claude-3-opus': {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
    contextWindow: 200000,
    description: 'Claude 3 Opus',
  },
  'claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    contextWindow: 200000,
    description: 'Claude 3 Sonnet',
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
    contextWindow: 200000,
    description: 'Claude 3 Haiku',
  },

  // Google Models
  'gemini-pro': {
    provider: 'google',
    model: 'gemini-pro',
    inputPricePerMillion: 0.5,
    outputPricePerMillion: 1.5,
    contextWindow: 32000,
    description: 'Gemini Pro',
  },
  'gemini-pro-vision': {
    provider: 'google',
    model: 'gemini-pro-vision',
    inputPricePerMillion: 0.5,
    outputPricePerMillion: 1.5,
    contextWindow: 16000,
    description: 'Gemini Pro Vision',
  },
  'gemini-1.5-pro': {
    provider: 'google',
    model: 'gemini-1.5-pro',
    inputPricePerMillion: 3.5,
    outputPricePerMillion: 10.5,
    contextWindow: 1000000,
    description: 'Gemini 1.5 Pro (1M context)',
  },
  'gemini-1.5-flash': {
    provider: 'google',
    model: 'gemini-1.5-flash',
    inputPricePerMillion: 0.35,
    outputPricePerMillion: 1.05,
    contextWindow: 1000000,
    description: 'Gemini 1.5 Flash (1M context)',
  },

  // AWS Bedrock (example models)
  'bedrock-claude-3-opus': {
    provider: 'aws-bedrock',
    model: 'anthropic.claude-3-opus',
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
    contextWindow: 200000,
    description: 'Claude 3 Opus (Bedrock)',
  },
  'bedrock-claude-3-sonnet': {
    provider: 'aws-bedrock',
    model: 'anthropic.claude-3-sonnet',
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    contextWindow: 200000,
    description: 'Claude 3 Sonnet (Bedrock)',
  },

  // Azure OpenAI (typically same pricing as OpenAI)
  'azure-gpt-4': {
    provider: 'azure',
    model: 'gpt-4',
    inputPricePerMillion: 30.0,
    outputPricePerMillion: 60.0,
    contextWindow: 8192,
    description: 'GPT-4 (Azure)',
  },
  'azure-gpt-4-turbo': {
    provider: 'azure',
    model: 'gpt-4-turbo',
    inputPricePerMillion: 10.0,
    outputPricePerMillion: 30.0,
    contextWindow: 128000,
    description: 'GPT-4 Turbo (Azure)',
  },
};

/**
 * Find pricing for a model (case-insensitive, fuzzy matching)
 */
export function findModelPricing(modelName: string): ModelPricing | null {
  const normalized = modelName.toLowerCase().trim();

  // Exact match
  if (MODEL_PRICING[normalized]) {
    return MODEL_PRICING[normalized];
  }

  // Fuzzy match - check if model name contains key
  const matches = Object.entries(MODEL_PRICING).filter(([key, pricing]) => {
    return (
      normalized.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(normalized) ||
      pricing.model.toLowerCase().includes(normalized)
    );
  });

  if (matches.length === 1) {
    return matches[0][1];
  }

  // Multiple matches or no matches
  return null;
}

/**
 * Get all available models for a provider
 */
export function getModelsByProvider(provider: string): ModelPricing[] {
  return Object.values(MODEL_PRICING).filter(
    (p) => p.provider.toLowerCase() === provider.toLowerCase()
  );
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: string): ModelPricing | null {
  const providerLower = provider.toLowerCase();

  const defaults: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4',
    google: 'gemini-1.5-flash',
    'aws-bedrock': 'bedrock-claude-3-sonnet',
    azure: 'azure-gpt-4-turbo',
  };

  const defaultModel = defaults[providerLower];
  return defaultModel ? MODEL_PRICING[defaultModel] || null : null;
}
