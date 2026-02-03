/**
 * Cost Estimator
 * Estimates runtime costs for OSSA agents based on LLM provider, model, and usage
 *
 * SOLID: Single Responsibility - Only handles cost estimation
 * DRY: Centralized pricing data and calculation logic
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * Pricing per 1K tokens (input/output)
 */
interface ModelPricing {
  input: number;
  output: number;
}

/**
 * Provider pricing map
 */
const PRICING_MAP: Record<string, Record<string, ModelPricing>> = {
  openai: {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'o1-preview': { input: 0.015, output: 0.06 },
    'o1-mini': { input: 0.003, output: 0.012 },
  },
  anthropic: {
    'claude-opus-4': { input: 0.015, output: 0.075 },
    'claude-sonnet-4': { input: 0.003, output: 0.015 },
    'claude-haiku-4': { input: 0.00025, output: 0.00125 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  },
  google: {
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
    'gemini-pro': { input: 0.0005, output: 0.0015 },
  },
  cohere: {
    'command-r-plus': { input: 0.003, output: 0.015 },
    'command-r': { input: 0.0005, output: 0.0015 },
    'command': { input: 0.001, output: 0.002 },
  },
  mistral: {
    'mistral-large': { input: 0.004, output: 0.012 },
    'mistral-medium': { input: 0.0027, output: 0.0081 },
    'mistral-small': { input: 0.001, output: 0.003 },
  },
};

/**
 * Default usage estimates (tokens per request)
 */
const DEFAULT_USAGE = {
  inputTokens: 1000,
  outputTokens: 500,
  requestsPerDay: 100,
};

/**
 * Cost estimate result
 */
export interface CostEstimate {
  provider: string;
  model: string;
  estimatedDailyCost: number;
  estimatedMonthlyCost: number;
  breakdown: {
    inputCost: number;
    outputCost: number;
    requestsPerDay: number;
    tokensPerRequest: {
      input: number;
      output: number;
    };
  };
  recommendations: string[];
  currency: string;
}

/**
 * Cost Estimator Service
 */
export class CostEstimator {
  /**
   * Estimate costs for an agent manifest
   */
  estimate(manifest: OssaAgent): CostEstimate {
    const llmConfig = this.extractLLMConfig(manifest);
    const pricing = this.getPricing(llmConfig.provider, llmConfig.model);
    const usage = this.estimateUsage(manifest);

    const inputCost =
      (usage.inputTokens / 1000) * pricing.input * usage.requestsPerDay;
    const outputCost =
      (usage.outputTokens / 1000) * pricing.output * usage.requestsPerDay;
    const dailyCost = inputCost + outputCost;

    const recommendations = this.generateRecommendations(
      llmConfig.provider,
      llmConfig.model,
      dailyCost,
      manifest
    );

    return {
      provider: llmConfig.provider,
      model: llmConfig.model,
      estimatedDailyCost: parseFloat(dailyCost.toFixed(4)),
      estimatedMonthlyCost: parseFloat((dailyCost * 30).toFixed(2)),
      breakdown: {
        inputCost: parseFloat(inputCost.toFixed(4)),
        outputCost: parseFloat(outputCost.toFixed(4)),
        requestsPerDay: usage.requestsPerDay,
        tokensPerRequest: {
          input: usage.inputTokens,
          output: usage.outputTokens,
        },
      },
      recommendations,
      currency: 'USD',
    };
  }

  /**
   * Extract LLM configuration from manifest
   */
  private extractLLMConfig(manifest: OssaAgent): {
    provider: string;
    model: string;
  } {
    const llm = manifest.spec?.llm || manifest.agent?.llm;

    if (!llm) {
      return { provider: 'unknown', model: 'unknown' };
    }

    return {
      provider: this.normalizeProvider(llm.provider || 'unknown'),
      model: this.normalizeModel(llm.model || 'unknown'),
    };
  }

  /**
   * Normalize provider name
   */
  private normalizeProvider(provider: string): string {
    const normalized = provider.toLowerCase().trim();

    if (normalized.includes('openai')) return 'openai';
    if (normalized.includes('anthropic') || normalized.includes('claude'))
      return 'anthropic';
    if (normalized.includes('google') || normalized.includes('gemini'))
      return 'google';
    if (normalized.includes('cohere')) return 'cohere';
    if (normalized.includes('mistral')) return 'mistral';

    return normalized;
  }

  /**
   * Normalize model name
   */
  private normalizeModel(model: string): string {
    const normalized = model.toLowerCase().trim();

    // Handle version suffixes
    const baseModel = normalized.split('-202')[0];

    return baseModel;
  }

  /**
   * Get pricing for provider and model
   */
  private getPricing(provider: string, model: string): ModelPricing {
    const providerPricing = PRICING_MAP[provider];

    if (!providerPricing) {
      return { input: 0, output: 0 };
    }

    // Try exact match
    if (providerPricing[model]) {
      return providerPricing[model];
    }

    // Try fuzzy match
    for (const [key, pricing] of Object.entries(providerPricing)) {
      if (model.includes(key) || key.includes(model)) {
        return pricing;
      }
    }

    return { input: 0, output: 0 };
  }

  /**
   * Estimate usage from manifest
   */
  private estimateUsage(manifest: OssaAgent): {
    inputTokens: number;
    outputTokens: number;
    requestsPerDay: number;
  } {
    const constraints = manifest.spec?.constraints?.cost;
    const llm = manifest.spec?.llm || manifest.agent?.llm;

    // Use constraints if available
    if (constraints?.maxTokensPerRequest) {
      const inputTokens = Math.floor(constraints.maxTokensPerRequest * 0.7);
      const outputTokens = Math.floor(constraints.maxTokensPerRequest * 0.3);
      const requestsPerDay = constraints.maxTokensPerDay
        ? Math.floor(constraints.maxTokensPerDay / constraints.maxTokensPerRequest)
        : DEFAULT_USAGE.requestsPerDay;

      return { inputTokens, outputTokens, requestsPerDay };
    }

    // Use LLM maxTokens if available
    if (llm?.maxTokens) {
      return {
        inputTokens: Math.floor(llm.maxTokens * 0.7),
        outputTokens: Math.floor(llm.maxTokens * 0.3),
        requestsPerDay: DEFAULT_USAGE.requestsPerDay,
      };
    }

    // Fall back to defaults
    return DEFAULT_USAGE;
  }

  /**
   * Generate cost optimization recommendations
   */
  private generateRecommendations(
    provider: string,
    model: string,
    dailyCost: number,
    manifest: OssaAgent
  ): string[] {
    const recommendations: string[] = [];

    // High cost warning
    if (dailyCost > 10) {
      recommendations.push(
        `Daily cost ($${dailyCost.toFixed(2)}) is high. Consider using a smaller model.`
      );
    }

    // Model-specific recommendations
    if (provider === 'openai' && model.includes('gpt-4') && !model.includes('mini')) {
      recommendations.push(
        'Consider using gpt-4o-mini for cost savings (up to 99% reduction)'
      );
    }

    if (provider === 'anthropic' && model.includes('opus')) {
      recommendations.push(
        'Consider using claude-sonnet-4 for cost savings (80% reduction) with similar quality'
      );
    }

    // Missing constraints
    if (!manifest.spec?.constraints?.cost) {
      recommendations.push(
        'Add cost constraints (maxTokensPerDay, maxCostPerDay) to control spending'
      );
    }

    // Missing rate limits
    if (!manifest.spec?.constraints?.performance?.maxLatencySeconds) {
      recommendations.push(
        'Add performance constraints (maxLatencySeconds, timeoutSeconds) to optimize costs'
      );
    }

    // Token optimization
    const llm = manifest.spec?.llm || manifest.agent?.llm;
    if (llm?.maxTokens && llm.maxTokens > 4000) {
      recommendations.push(
        `maxTokens (${llm.maxTokens}) is high. Reduce if possible to lower costs.`
      );
    }

    return recommendations;
  }

  /**
   * Compare costs between different models
   */
  compareCosts(
    manifest: OssaAgent,
    alternativeModels: Array<{ provider: string; model: string }>
  ): Array<CostEstimate> {
    const estimates: CostEstimate[] = [];

    // Current model
    estimates.push(this.estimate(manifest));

    // Alternative models
    for (const alternative of alternativeModels) {
      const altManifest = JSON.parse(JSON.stringify(manifest));
      if (altManifest.spec?.llm) {
        altManifest.spec.llm.provider = alternative.provider;
        altManifest.spec.llm.model = alternative.model;
      }
      estimates.push(this.estimate(altManifest));
    }

    return estimates.sort((a, b) => a.estimatedDailyCost - b.estimatedDailyCost);
  }
}
