/**
 * OSSA Estimate Command
 * Estimate token counts and costs for agent deployments
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles cost estimation
 * - Uses dependency injection for services
 * - DRY: Reuses existing validation and manifest loading
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { TokenCounterService } from '../../services/cost-estimation/token-counter.service.js';
import { ScenarioEstimatorService } from '../../services/cost-estimation/scenario-estimator.js';
import {
  MODEL_PRICING,
  findModelPricing,
  getDefaultModel,
  getModelsByProvider,
  type ModelPricing,
} from '../../services/cost-estimation/pricing.js';
import type { UsageScenario } from '../../services/cost-estimation/scenario-estimator.js';
import {
  addGlobalOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';

export const estimateCommand = new Command('estimate')
  .argument('[path]', 'Path to OSSA manifest (YAML or JSON)')
  .option(
    '-m, --model <model>',
    'Model to estimate for (e.g., gpt-4o, claude-sonnet-4). If not specified, uses model from manifest.'
  )
  .option(
    '-p, --provider <provider>',
    'Provider to estimate for (openai, anthropic, google, aws-bedrock, azure)'
  )
  .option(
    '-i, --interactions <number>',
    'Number of interactions to estimate',
    '100'
  )
  .option(
    '-t, --timeframe <timeframe>',
    'Timeframe for interactions (hour, day, week, month)',
    'day'
  )
  .option(
    '--user-length <length>',
    'Average user message length (short, medium, long)',
    'medium'
  )
  .option(
    '--response-length <length>',
    'Average assistant response length (short, medium, long)',
    'medium'
  )
  .option('--compare', 'Compare costs across multiple models')
  .option('--list-models', 'List all available models and exit')
  .description('Estimate token counts and costs for agent deployments');

// Apply standard options
addGlobalOptions(estimateCommand);

estimateCommand.action(
  async (
    path: string | undefined,
    options: {
      model?: string;
      provider?: string;
      interactions?: string;
      timeframe?: string;
      userLength?: string;
      responseLength?: string;
      compare?: boolean;
      listModels?: boolean;
      verbose?: boolean;
      quiet?: boolean;
      json?: boolean;
      color?: boolean;
    }
  ) => {
    const useColor = shouldUseColor(options);
    const log = (msg: string, color?: (s: string) => string) => {
      if (options.quiet) return;
      const output = useColor && color ? color(msg) : msg;
      console.log(output);
    };

    try {
      // Handle --list-models
      if (options.listModels) {
        log('\n📋 Available Models:', chalk.bold);
        log('');

        const providers = [
          'openai',
          'anthropic',
          'google',
          'aws-bedrock',
          'azure',
        ];
        for (const provider of providers) {
          const models = getModelsByProvider(provider);
          if (models.length > 0) {
            log(`\n${chalk.bold.blue(provider.toUpperCase())}:`);
            models.forEach((model) => {
              const input = `$${model.inputPricePerMillion}/1M`;
              const output = `$${model.outputPricePerMillion}/1M`;
              log(
                `  ${chalk.cyan(model.model.padEnd(30))} ${chalk.gray(`Input: ${input.padEnd(12)} Output: ${output}`)}`
              );
              if (model.description) {
                log(`    ${chalk.gray(model.description)}`);
              }
            });
          }
        }
        log('');
        process.exit(ExitCode.SUCCESS);
      }

      // Validate path is provided
      if (!path) {
        log(chalk.red('❌ Error: Path to OSSA manifest is required'));
        log(chalk.gray('Usage: ossa estimate <path>'));
        process.exit(ExitCode.MISUSE);
      }

      // Load manifest
      const manifestRepo = container.get(ManifestRepository);
      const manifest = await manifestRepo.load(path);

      log(
        `\n💰 Cost Estimation for Agent: ${chalk.cyan(manifest.metadata?.name || 'Unknown')}`,
        chalk.bold
      );
      log('');

      // Initialize services
      const tokenCounter = new TokenCounterService();
      const scenarioEstimator = new ScenarioEstimatorService();

      // Count tokens in agent
      const agentTokens = tokenCounter.countAgentTokens(manifest);

      log('📊 Agent Token Breakdown:', chalk.bold);
      log('');
      Object.entries(agentTokens.breakdown).forEach(([key, value]) => {
        if (value > 0) {
          const formatted = tokenCounter.formatTokenCount(value);
          log(`  ${chalk.gray(key.padEnd(20))}: ${chalk.yellow(formatted)}`);
        }
      });
      log(`  ${chalk.gray('─'.repeat(40))}`);
      log(
        `  ${chalk.gray('Total'.padEnd(20))}: ${chalk.bold.yellow(tokenCounter.formatTokenCount(agentTokens.total))}`
      );
      log('');

      // Determine model to use
      let modelPricing: ModelPricing | null = null;

      if (options.model) {
        modelPricing = findModelPricing(options.model);
        if (!modelPricing) {
          log(chalk.red(`❌ Model not found: ${options.model}`));
          log(chalk.gray('Use --list-models to see available models'));
          process.exit(ExitCode.MISUSE);
        }
      } else if (options.provider) {
        modelPricing = getDefaultModel(options.provider);
        if (!modelPricing) {
          log(chalk.red(`❌ Unknown provider: ${options.provider}`));
          process.exit(ExitCode.MISUSE);
        }
      } else {
        // Try to infer from manifest
        const llmProvider =
          manifest.spec?.llm?.provider ||
          manifest.agent?.llm?.provider ||
          'openai';
        const llmModel =
          manifest.spec?.llm?.model || manifest.agent?.llm?.model;

        if (llmModel) {
          modelPricing = findModelPricing(llmModel);
        }

        if (!modelPricing) {
          modelPricing = getDefaultModel(llmProvider);
        }

        if (!modelPricing) {
          log(chalk.yellow('⚠️  Could not determine model from manifest'));
          log(chalk.gray('Using default: gpt-4o'));
          modelPricing = MODEL_PRICING['gpt-4o'];
        }
      }

      // Show model being used
      log('🤖 Model Configuration:', chalk.bold);
      log('');
      log(`  ${chalk.gray('Model')}: ${chalk.cyan(modelPricing.model)}`);
      log(`  ${chalk.gray('Provider')}: ${chalk.cyan(modelPricing.provider)}`);
      log(
        `  ${chalk.gray('Context Window')}: ${chalk.yellow(tokenCounter.formatTokenCount(modelPricing.contextWindow))}`
      );
      log('');
      log('💵 Pricing:', chalk.bold);
      log('');
      log(
        `  ${chalk.gray('Input')}: ${chalk.green(`$${modelPricing.inputPricePerMillion}/1M tokens`)}`
      );
      log(
        `  ${chalk.gray('Output')}: ${chalk.green(`$${modelPricing.outputPricePerMillion}/1M tokens`)}`
      );
      log('');

      // Compare mode
      if (options.compare) {
        log('📊 Model Comparison:', chalk.bold);
        log('');

        const scenario: UsageScenario = {
          name: 'Comparison',
          interactions: parseInt(options.interactions || '100'),
          timeframe:
            (options.timeframe as 'hour' | 'day' | 'week' | 'month') || 'day',
          userMessageLength:
            (options.userLength as 'short' | 'medium' | 'long') || 'medium',
          assistantResponseLength:
            (options.responseLength as 'short' | 'medium' | 'long') || 'medium',
        };

        // Select representative models
        const modelsToCompare: ModelPricing[] = [
          MODEL_PRICING['gpt-4o-mini'],
          MODEL_PRICING['gpt-4o'],
          MODEL_PRICING['gpt-4-turbo'],
          MODEL_PRICING['claude-haiku-4'],
          MODEL_PRICING['claude-sonnet-4'],
          MODEL_PRICING['claude-opus-4'],
          MODEL_PRICING['gemini-1.5-flash'],
          MODEL_PRICING['gemini-1.5-pro'],
        ];

        const estimates = scenarioEstimator.compareModels(
          agentTokens,
          scenario,
          modelsToCompare
        );

        estimates.forEach((estimate, index) => {
          const rank = index === 0 ? chalk.green('🏆 CHEAPEST') : '';
          const modelName =
            estimate.scenario.name || modelsToCompare[index].model;
          const cost = scenarioEstimator.formatCost(estimate.costs.totalCost);

          log(
            `  ${chalk.cyan(modelsToCompare[index].model.padEnd(30))} ${chalk.yellow(cost.padStart(12))} ${rank}`
          );
        });
        log('');
      } else {
        // Standard estimation
        const scenario: UsageScenario = {
          name: 'Custom',
          interactions: parseInt(options.interactions || '100'),
          timeframe:
            (options.timeframe as 'hour' | 'day' | 'week' | 'month') || 'day',
          userMessageLength:
            (options.userLength as 'short' | 'medium' | 'long') || 'medium',
          assistantResponseLength:
            (options.responseLength as 'short' | 'medium' | 'long') || 'medium',
        };

        const estimate = scenarioEstimator.estimateScenario(
          agentTokens,
          scenario,
          modelPricing
        );

        log(
          `💬 Usage Scenario: ${chalk.cyan(`${scenario.interactions} interactions/${scenario.timeframe}`)}`,
          chalk.bold
        );
        log('');
        log('📈 Token Usage:', chalk.bold);
        log('');
        log(
          `  ${chalk.gray('Input tokens')}: ${chalk.yellow(tokenCounter.formatTokenCount(estimate.tokenUsage.inputTokens))}`
        );
        log(
          `  ${chalk.gray('Output tokens')}: ${chalk.yellow(tokenCounter.formatTokenCount(estimate.tokenUsage.outputTokens))}`
        );
        log(
          `  ${chalk.gray('Total tokens')}: ${chalk.yellow(tokenCounter.formatTokenCount(estimate.tokenUsage.totalTokens))}`
        );
        log('');

        log('💰 Cost Estimate:', chalk.bold);
        log('');
        log(
          `  ${chalk.gray('Input cost')}: ${chalk.green(scenarioEstimator.formatCost(estimate.costs.inputCost))}`
        );
        log(
          `  ${chalk.gray('Output cost')}: ${chalk.green(scenarioEstimator.formatCost(estimate.costs.outputCost))}`
        );
        log(`  ${chalk.gray('─'.repeat(40))}`);
        log(
          `  ${chalk.gray('Total cost')}: ${chalk.bold.green(scenarioEstimator.formatCost(estimate.costs.totalCost))}`
        );
        log('');
        log(
          `  ${chalk.gray('Per interaction')}: ${chalk.cyan(scenarioEstimator.formatCost(estimate.perInteraction.cost))}`
        );
        log('');

        // Project to monthly if timeframe is day
        if (scenario.timeframe === 'day') {
          const monthly = scenarioEstimator.projectMonthly(estimate);
          log(
            `📅 Monthly Projection (${monthly.scenario.interactions.toLocaleString()} interactions):`,
            chalk.bold
          );
          log('');
          log(
            `  ${chalk.gray('Estimated cost')}: ${chalk.bold.green(scenarioEstimator.formatCost(monthly.costs.totalCost))}`
          );
          log('');
        }
      }

      // Context window warning
      const turnTokens = agentTokens.total + 200 + 500; // Rough estimate per turn
      if (turnTokens > modelPricing.contextWindow * 0.8) {
        log(
          chalk.yellow(
            '⚠️  Warning: Agent prompt is large relative to context window'
          )
        );
        log(
          chalk.gray(`   This may limit conversation history or tool usage.`)
        );
        log('');
      }

      process.exit(ExitCode.SUCCESS);
    } catch (error) {
      log(
        chalk.red(
          `❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      if (options.verbose && error instanceof Error && error.stack) {
        log(chalk.gray(error.stack));
      }
      process.exit(ExitCode.GENERAL_ERROR);
    }
  }
);
