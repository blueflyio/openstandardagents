/**
 * Step 16: Best Practices Review
 * Review agent configuration and suggest best practices
 */

import inquirer from 'inquirer';
import { logger } from '../../../utils/logger.js';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';
import { container } from '../../../di-container.js';
import { ValidationService } from '../../../services/validation.service.js';
import { TaxonomyValidatorService } from '../../../services/taxonomy-validator.service.js';

interface BestPractice {
  category: string;
  recommendation: string;
  severity: 'info' | 'warning' | 'error';
}

export async function bestPracticesStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(17, state.totalSteps, 'Best Practices Review');

  const { reviewPractices } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'reviewPractices',
      message: 'Review best practices?',
      default: true,
    },
  ]);

  if (!reviewPractices) return state;

  const practices: BestPractice[] = [];

  // Validate manifest
  const validationService = container.get(ValidationService);
  const validationResult = await validationService.validate(state.agent);

  if (!validationResult.valid) {
    practices.push({
      category: 'Validation',
      recommendation: 'Fix validation errors before proceeding',
      severity: 'error',
    });
  }

  // Check taxonomy
  const taxonomyValidator = container.get(TaxonomyValidatorService);
  const taxonomyResult = await taxonomyValidator.validate(state.agent);

  if (taxonomyResult.conflicts.length > 0) {
    taxonomyResult.conflicts.forEach((conflict) => {
      practices.push({
        category: 'Taxonomy',
        recommendation: `${conflict.field}: ${conflict.reason}. Consider: ${conflict.suggestion || 'N/A'}`,
        severity: 'warning',
      });
    });
  }

  // Check LLM configuration
  const llmConfig = state.agent.spec?.llm;
  if (!llmConfig) {
    practices.push({
      category: 'LLM Configuration',
      recommendation: 'Add LLM configuration for agent execution',
      severity: 'warning',
    });
  } else {
    if (
      (llmConfig as any).temperature === undefined ||
      (llmConfig as any).temperature > 0.7
    ) {
      practices.push({
        category: 'LLM Configuration',
        recommendation:
          'Consider lower temperature (0.1-0.3) for deterministic tasks',
        severity: 'info',
      });
    }
  }

  // Check tools
  const tools = state.agent.spec?.tools;
  if (!tools || tools.length === 0) {
    practices.push({
      category: 'Tools',
      recommendation: 'Consider adding tools to extend agent capabilities',
      severity: 'info',
    });
  }

  // Check role/system message
  const role = state.agent.spec?.role;
  if (!role || role.length < 50) {
    practices.push({
      category: 'System Message',
      recommendation:
        'Provide detailed role/system message for better agent behavior',
      severity: 'warning',
    });
  }

  // Check taxonomy completeness
  const taxonomy = (state.agent.spec as Record<string, unknown>)?.taxonomy as
    | Record<string, unknown>
    | undefined;
  if (!taxonomy) {
    practices.push({
      category: 'Taxonomy',
      recommendation: 'Add taxonomy classification for better discoverability',
      severity: 'info',
    });
  } else {
    if (!taxonomy.maturity) {
      practices.push({
        category: 'Taxonomy',
        recommendation:
          'Specify maturity level (prototype, beta, stable, production)',
        severity: 'info',
      });
    }
    if (!taxonomy.deployment_pattern) {
      practices.push({
        category: 'Taxonomy',
        recommendation: 'Specify deployment pattern for deployment guidance',
        severity: 'info',
      });
    }
  }

  // Display recommendations
  if (practices.length === 0) {
    console_ui.success(
      '\n✓ No recommendations - agent follows best practices!'
    );
  } else {
    console_ui.info('\nBest Practices Recommendations:');

    const errors = practices.filter((p) => p.severity === 'error');
    const warnings = practices.filter((p) => p.severity === 'warning');
    const infos = practices.filter((p) => p.severity === 'info');

    if (errors.length > 0) {
      const errorsList = errors
        .map((p) => `    [${p.category}] ${p.recommendation}`)
        .join('\n');
      logger.error({ errorCount: errors.length }, `Errors:\n${errorsList}`);
    }

    if (warnings.length > 0) {
      const warningsList = warnings
        .map((p) => `    [${p.category}] ${p.recommendation}`)
        .join('\n');
      logger.warn({ warningCount: warnings.length }, `Warnings:\n${warningsList}`);
    }

    if (infos.length > 0) {
      const suggestionsList = infos
        .map((p) => `    [${p.category}] ${p.recommendation}`)
        .join('\n');
      logger.info({ suggestionCount: infos.length }, `Suggestions:\n${suggestionsList}`);
    }

    // Ask if user wants to apply suggestions
    const { applySuggestions } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'applySuggestions',
        message: 'Apply suggested improvements?',
        default: false,
      },
    ]);

    if (applySuggestions) {
      // Apply non-breaking suggestions
      const safePractices = practices.filter((p) => p.severity !== 'error');

      for (const practice of safePractices) {
        if (
          practice.category === 'Taxonomy' &&
          practice.recommendation.includes('maturity')
        ) {
          if (!taxonomy) {
            if (!state.agent.spec) state.agent.spec = { role: '' };
            (state.agent.spec as Record<string, unknown>).taxonomy = {
              maturity: 'beta',
            };
          } else {
            (taxonomy as Record<string, unknown>).maturity = 'beta';
          }
        }

        if (
          practice.category === 'Taxonomy' &&
          practice.recommendation.includes('deployment_pattern')
        ) {
          if (!taxonomy) {
            if (!state.agent.spec) state.agent.spec = { role: '' };
            (state.agent.spec as Record<string, unknown>).taxonomy = {
              deployment_pattern: 'container',
            };
          } else {
            (taxonomy as Record<string, unknown>).deployment_pattern =
              'container';
          }
        }
      }

      console_ui.success('\n✓ Applied safe suggestions');
    }
  }

  return state;
}
