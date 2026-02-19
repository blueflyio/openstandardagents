/**
 * Step 9a: Token Efficiency (v0.4)
 * Collects token_efficiency for cost-optimized execution: budget, cascade, routing,
 * consolidation, compression, custom_metrics. Writes to root token_efficiency.
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

export async function configureTokenEfficiencyStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(10, state.totalSteps, 'Token Efficiency (v0.4)');
  console_ui.info(
    'Token efficiency enables 70-95% cost savings via cascade, consolidation, and compression.'
  );
  console_ui.info(
    'Learn more: https://openstandardagents.org/docs/token-efficiency-and-deployment-tuning'
  );

  const { enable } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enable',
      message: 'Enable token efficiency for this agent?',
      default: true,
    },
  ]);

  if (!enable) {
    return state;
  }

  const answers = await inquirer.prompt<{
    serialization_profile: string;
    observation_format: string;
    max_input_tokens: number;
    allocation_strategy: string;
    use_cascade: boolean;
    consolidation_strategy: string;
    compression_strategy: string;
    compression_ratio?: number;
    min_quality?: number;
  }>([
    {
      type: 'list',
      name: 'serialization_profile',
      message: 'Manifest serialization profile:',
      choices: [
        { name: 'Compact (60-120 tokens, runtime)', value: 'compact' },
        { name: 'Full (200-400 tokens, discovery)', value: 'full' },
        { name: 'Fingerprint (15-30 tokens, routing)', value: 'fingerprint' },
      ],
      default: 'compact',
    },
    {
      type: 'list',
      name: 'observation_format',
      message: 'Tool observation format:',
      choices: [
        { name: 'Projected (only matched fields)', value: 'projected' },
        { name: 'Summary (compressed)', value: 'summary' },
        { name: 'Diff (returns diff not full file)', value: 'diff' },
        { name: 'Full', value: 'full' },
      ],
      default: 'projected',
    },
    {
      type: 'number',
      name: 'max_input_tokens',
      message: 'Max input tokens per request:',
      default: 50000,
    },
    {
      type: 'list',
      name: 'allocation_strategy',
      message: 'Budget allocation strategy:',
      choices: [
        { name: 'Adaptive', value: 'adaptive' },
        { name: 'Proportional', value: 'proportional' },
        { name: 'Equal', value: 'equal' },
      ],
      default: 'adaptive',
    },
    {
      type: 'confirm',
      name: 'use_cascade',
      message: 'Use model cascade (e.g. haiku -> sonnet -> opus)?',
      default: true,
    },
    {
      type: 'list',
      name: 'consolidation_strategy',
      message: 'Trajectory consolidation:',
      choices: [
        { name: 'Aggressive (max savings)', value: 'aggressive' },
        { name: 'Moderate', value: 'moderate' },
        { name: 'Minimal', value: 'minimal' },
        { name: 'None', value: 'none' },
      ],
      default: 'moderate',
    },
    {
      type: 'list',
      name: 'compression_strategy',
      message: 'Context compression:',
      choices: [
        { name: 'Hybrid', value: 'hybrid' },
        { name: 'Template', value: 'template' },
        { name: 'Semantic', value: 'semantic' },
        { name: 'None', value: 'none' },
      ],
      default: 'hybrid',
    },
    {
      type: 'number',
      name: 'compression_ratio',
      message: 'Target compression ratio (0.2 = 80% reduction):',
      default: 0.2,
      when: (a: { compression_strategy: string }) =>
        a.compression_strategy !== 'none',
      validate: (v: number) => (v >= 0 && v <= 1) || 'Must be between 0 and 1',
    },
    {
      type: 'number',
      name: 'min_quality',
      message: 'Minimum quality threshold (do not compress below):',
      default: 0.95,
      when: (a: { compression_strategy: string }) =>
        a.compression_strategy !== 'none',
      validate: (v: number) => (v >= 0 && v <= 1) || 'Must be between 0 and 1',
    },
  ]);

  const token_efficiency: Record<string, unknown> = {
    serialization_profile: answers.serialization_profile,
    observation_format: answers.observation_format,
    budget: {
      max_input_tokens: answers.max_input_tokens,
      allocation_strategy: answers.allocation_strategy,
    },
    consolidation: {
      strategy: answers.consolidation_strategy,
      retain: ['final_answer'],
      drop: ['raw_observations'],
    },
    compression: {
      enabled: answers.compression_strategy !== 'none',
      strategy: answers.compression_strategy,
      ...(answers.compression_strategy !== 'none' &&
        answers.compression_ratio != null && {
          compression_ratio: answers.compression_ratio,
        }),
      ...(answers.compression_strategy !== 'none' &&
        answers.min_quality != null && { min_quality: answers.min_quality }),
    },
    custom_metrics: [
      { name: 'tokens_consumed', type: 'counter' as const },
      { name: 'cost_per_execution', type: 'histogram' as const },
    ],
  };

  if (answers.use_cascade) {
    (token_efficiency.budget as Record<string, unknown>).cascade = [
      { model: 'haiku', max_complexity: 'low', budget_share: 0.2 },
      { model: 'sonnet', max_complexity: 'medium', budget_share: 0.5 },
      { model: 'opus', max_complexity: 'high', budget_share: 0.3 },
    ];
    token_efficiency.routing = {
      cascade: ['haiku', 'sonnet', 'opus'],
      complexity_threshold: [0.3, 0.7],
    };
  }

  (state.agent as Record<string, unknown>).token_efficiency = token_efficiency;
  console_ui.success('Token efficiency configured (v0.4)');
  return state;
}
