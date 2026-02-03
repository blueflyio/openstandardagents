/**
 * OSSA Cost Estimation - Scenario Estimator
 * Estimates costs for different usage scenarios
 */

import type { TokenCount } from './token-counter.service.js';
import type { ModelPricing } from './pricing.js';
import { TokenCounterService } from './token-counter.service.js';

export interface UsageScenario {
  name: string;
  interactions: number;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  userMessageLength: 'short' | 'medium' | 'long';
  assistantResponseLength: 'short' | 'medium' | 'long';
}

export interface CostEstimate {
  scenario: UsageScenario;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  costs: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  perInteraction: {
    tokens: number;
    cost: number;
  };
}

export class ScenarioEstimatorService {
  private tokenCounter: TokenCounterService;

  constructor() {
    this.tokenCounter = new TokenCounterService();
  }

  /**
   * Estimate cost for a usage scenario
   */
  estimateScenario(
    agentTokens: TokenCount,
    scenario: UsageScenario,
    pricing: ModelPricing
  ): CostEstimate {
    // Calculate tokens per interaction
    const turnTokens = this.tokenCounter.estimateConversationTurn(
      agentTokens.total,
      scenario.userMessageLength,
      scenario.assistantResponseLength
    );

    // Calculate total tokens for all interactions
    const inputTokens = turnTokens.input * scenario.interactions;
    const outputTokens = turnTokens.output * scenario.interactions;
    const totalTokens = inputTokens + outputTokens;

    // Calculate costs
    const inputCost = (inputTokens / 1000000) * pricing.inputPricePerMillion;
    const outputCost = (outputTokens / 1000000) * pricing.outputPricePerMillion;
    const totalCost = inputCost + outputCost;

    return {
      scenario,
      tokenUsage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
      costs: {
        inputCost,
        outputCost,
        totalCost,
      },
      perInteraction: {
        tokens: turnTokens.total,
        cost: totalCost / scenario.interactions,
      },
    };
  }

  /**
   * Generate standard scenarios for comparison
   */
  getStandardScenarios(): UsageScenario[] {
    return [
      {
        name: 'Low Usage - Personal/Testing',
        interactions: 10,
        timeframe: 'day',
        userMessageLength: 'medium',
        assistantResponseLength: 'medium',
      },
      {
        name: 'Medium Usage - Small Team',
        interactions: 100,
        timeframe: 'day',
        userMessageLength: 'medium',
        assistantResponseLength: 'medium',
      },
      {
        name: 'High Usage - Production',
        interactions: 1000,
        timeframe: 'day',
        userMessageLength: 'medium',
        assistantResponseLength: 'medium',
      },
      {
        name: 'Very High Usage - Enterprise',
        interactions: 10000,
        timeframe: 'day',
        userMessageLength: 'medium',
        assistantResponseLength: 'medium',
      },
    ];
  }

  /**
   * Estimate monthly costs based on daily usage
   */
  projectMonthly(dailyEstimate: CostEstimate): CostEstimate {
    const monthlyInteractions = dailyEstimate.scenario.interactions * 30;

    return {
      scenario: {
        ...dailyEstimate.scenario,
        interactions: monthlyInteractions,
        timeframe: 'month',
      },
      tokenUsage: {
        inputTokens: dailyEstimate.tokenUsage.inputTokens * 30,
        outputTokens: dailyEstimate.tokenUsage.outputTokens * 30,
        totalTokens: dailyEstimate.tokenUsage.totalTokens * 30,
      },
      costs: {
        inputCost: dailyEstimate.costs.inputCost * 30,
        outputCost: dailyEstimate.costs.outputCost * 30,
        totalCost: dailyEstimate.costs.totalCost * 30,
      },
      perInteraction: dailyEstimate.perInteraction,
    };
  }

  /**
   * Format cost for display
   */
  formatCost(amount: number): string {
    if (amount < 0.01) {
      return `$${amount.toFixed(4)}`;
    } else if (amount < 1) {
      return `$${amount.toFixed(3)}`;
    } else if (amount < 100) {
      return `$${amount.toFixed(2)}`;
    } else {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  /**
   * Compare costs across multiple models
   */
  compareModels(
    agentTokens: TokenCount,
    scenario: UsageScenario,
    models: ModelPricing[]
  ): CostEstimate[] {
    return models
      .map((model) => this.estimateScenario(agentTokens, scenario, model))
      .sort((a, b) => a.costs.totalCost - b.costs.totalCost);
  }

  /**
   * Calculate break-even point between two models
   */
  calculateBreakeven(
    agentTokens: TokenCount,
    modelA: ModelPricing,
    modelB: ModelPricing,
    userLength: 'short' | 'medium' | 'long' = 'medium',
    assistantLength: 'short' | 'medium' | 'long' = 'medium'
  ): number | null {
    const turnTokens = this.tokenCounter.estimateConversationTurn(
      agentTokens.total,
      userLength,
      assistantLength
    );

    const costPerTurnA =
      (turnTokens.input / 1000000) * modelA.inputPricePerMillion +
      (turnTokens.output / 1000000) * modelA.outputPricePerMillion;

    const costPerTurnB =
      (turnTokens.input / 1000000) * modelB.inputPricePerMillion +
      (turnTokens.output / 1000000) * modelB.outputPricePerMillion;

    // If costs are the same, no breakeven point
    if (Math.abs(costPerTurnA - costPerTurnB) < 0.0001) {
      return null;
    }

    // Return the number of interactions where switching makes sense
    // (This is simplified - real analysis would need setup costs, etc.)
    return Math.abs(1 / (costPerTurnA - costPerTurnB));
  }
}
