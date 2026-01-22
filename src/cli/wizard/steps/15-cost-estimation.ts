/**
 * Step 15: Cost Estimation
 * Estimate agent costs based on LLM provider, model selection, and usage
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

interface CostEstimate {
  llmCost: number;
  infrastructureCost: number;
  toolCost: number;
  totalMonthly: number;
}

const LLM_COSTS: Record<string, Record<string, number>> = {
  openai: {
    'gpt-4': 0.03, // per 1K tokens
    'gpt-4-turbo': 0.01,
    'gpt-3.5-turbo': 0.0015,
  },
  anthropic: {
    'claude-3-opus': 0.015,
    'claude-3-sonnet': 0.003,
    'claude-3-haiku': 0.00025,
  },
  google: {
    'gemini-pro': 0.0005,
    'gemini-ultra': 0.005,
  },
};

const INFRASTRUCTURE_COSTS: Record<string, number> = {
  serverless: 0, // Pay per use
  container: 50, // Base monthly
  edge: 30,
  hybrid: 75,
};

export async function costEstimationStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(15, state.totalSteps, 'Cost Estimation');

  const { estimateCosts } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'estimateCosts',
      message: 'Estimate agent costs?',
      default: true,
    },
  ]);

  if (!estimateCosts) return state;

  const costAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'llmProvider',
      message: 'LLM Provider:',
      choices: ['openai', 'anthropic', 'google'],
      default: 'openai',
    },
    {
      type: 'list',
      name: 'model',
      message: 'Model:',
      choices: (answers: any) => {
        return Object.keys(LLM_COSTS[answers.llmProvider] || {}).map((m) => ({
          name: m,
          value: m,
        }));
      },
      default: 'gpt-4',
    },
    {
      type: 'number',
      name: 'monthlyRequests',
      message: 'Estimated monthly requests:',
      default: 10000,
    },
    {
      type: 'number',
      name: 'avgTokensPerRequest',
      message: 'Average tokens per request:',
      default: 2000,
    },
    {
      type: 'list',
      name: 'deploymentPattern',
      message: 'Deployment pattern:',
      choices: [
        { name: 'Serverless', value: 'serverless' },
        { name: 'Container', value: 'container' },
        { name: 'Edge', value: 'edge' },
        { name: 'Hybrid', value: 'hybrid' },
      ],
      default: 'container',
    },
  ]);

  // Calculate costs
  const llmCostPer1K =
    LLM_COSTS[costAnswers.llmProvider]?.[costAnswers.model] || 0.01;
  const totalTokens =
    costAnswers.monthlyRequests * costAnswers.avgTokensPerRequest;
  const llmCost = (totalTokens / 1000) * llmCostPer1K;
  const infrastructureCost =
    INFRASTRUCTURE_COSTS[costAnswers.deploymentPattern] || 50;
  const toolCost = costAnswers.monthlyRequests * 0.001; // Estimated tool cost
  const totalMonthly = llmCost + infrastructureCost + toolCost;

  const estimate: CostEstimate = {
    llmCost,
    infrastructureCost,
    toolCost,
    totalMonthly,
  };

  // Display cost breakdown
  console_ui.info('\nCost Estimation:');
  console.log(`  LLM Costs: $${estimate.llmCost.toFixed(2)}/month`);
  console.log(
    `  Infrastructure: $${estimate.infrastructureCost.toFixed(2)}/month`
  );
  console.log(`  Tool Costs: $${estimate.toolCost.toFixed(2)}/month`);
  console.log(`  Total Monthly: $${estimate.totalMonthly.toFixed(2)}/month`);

  // Store estimate
  if (!state.agent.spec) state.agent.spec = { role: '' };
  (state.agent.spec as any).cost_estimate = estimate;

  // Optimization suggestions
  if (estimate.totalMonthly > 500) {
    console_ui.warning('\nCost Optimization Suggestions:');
    console.log('  - Consider using a lower-cost model for non-critical tasks');
    console.log('  - Use serverless deployment to reduce infrastructure costs');
    console.log('  - Implement caching to reduce LLM API calls');
    console.log('  - Batch requests when possible');
  }

  return state;
}
