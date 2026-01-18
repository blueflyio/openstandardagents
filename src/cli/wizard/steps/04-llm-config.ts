/**
 * Step 4: LLM Configuration
 * Configure LLM provider, model, and parameters
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';
import { LLM_PROVIDERS, estimateMonthlyCost } from '../data/llm-providers.js';

export async function configureLLMStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(4, state.totalSteps, 'LLM Configuration');

  const { providerId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'providerId',
      message: 'Select LLM provider:',
      choices: LLM_PROVIDERS.map((p) => ({
        name: `${p.name} (${p.pricingTier} cost)`,
        value: p.id,
      })),
    },
  ]);

  const provider = LLM_PROVIDERS.find((p) => p.id === providerId);
  if (!provider) return state;

  const { modelId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'modelId',
      message: 'Select model:',
      choices: provider.models.map((m) => ({
        name: `${m.name}${m.recommended ? ' (recommended)' : ''} - ${m.description} ($${m.costPer1MTokens}/1M tokens)`,
        value: m.id,
      })),
    },
  ]);

  const model = provider.models.find((m) => m.id === modelId);

  const { temperature, maxTokens, topP } = await inquirer.prompt([
    {
      type: 'number',
      name: 'temperature',
      message: 'Temperature (0.0-2.0):',
      default: 0.7,
      validate: (input: number) => {
        if (input < 0 || input > 2) return 'Must be between 0.0 and 2.0';
        return true;
      },
    },
    {
      type: 'number',
      name: 'maxTokens',
      message: 'Max output tokens (optional):',
      default: model?.contextWindow
        ? Math.min(4096, model.contextWindow)
        : 4096,
    },
    {
      type: 'number',
      name: 'topP',
      message: 'Top P (0.0-1.0, optional):',
      default: 1.0,
      validate: (input: number) => {
        if (input < 0 || input > 1) return 'Must be between 0.0 and 1.0';
        return true;
      },
    },
  ]);

  if (!state.agent.spec) state.agent.spec = { role: '' };
  state.agent.spec = {
    ...state.agent.spec,
    llm: {
      provider: providerId,
      model: modelId,
      temperature,
      maxTokens: maxTokens,
      topP: topP,
    },
  };

  // Show cost estimate
  const monthlyCost = estimateMonthlyCost(modelId, 100000);
  console_ui.info(
    `Estimated monthly cost (100k tokens/day): $${monthlyCost.toFixed(2)}`
  );
  console_ui.success(`LLM configured: ${provider.name} - ${modelId}`);

  return state;
}
