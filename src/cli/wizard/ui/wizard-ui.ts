/**
 * Wizard UI Module
 * Beautiful console interface for wizard
 */

import chalk from 'chalk';
import { logger } from '../../../utils/logger.js';
import type { WizardOptions } from '../types.js';

export class WizardUI {
  private options: WizardOptions;

  constructor(options?: WizardOptions) {
    this.options = options || {};
  }

  /**
   * Show welcome screen
   */
  showWelcome(totalSteps: number): void {
    console.clear();
    const welcomeMessage = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         🤖  OSSA Agent Creation Wizard  🤖                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

  Create a production-ready AI agent in ${totalSteps} steps
  Mode: ${this.options.mode || 'standard'}
${this.options.template ? `  ✓ Template: ${this.options.template}` : ''}

  Tips:
    • Press Enter to use suggested values
    • Type ? for help at any step
    • Type back to go to previous step
    • Type save to save progress
    • Press Ctrl+C to exit
`;
    logger.info({ action: 'wizard-welcome', totalSteps }, welcomeMessage);
  }

  /**
   * Show progress bar
   */
  showProgress(current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;

    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const message = `Progress: [${bar}] ${percentage}% (${current}/${total})`;

    logger.info({ step: current, total, percentage }, message);
  }

  /**
   * Show step header
   */
  showStepHeader(
    stepNumber: number,
    totalSteps: number,
    title: string,
    description: string
  ): void {
    const header = `Step ${stepNumber}/${totalSteps}: ${title}\n${description}`;
    logger.info({ step: stepNumber, totalSteps, title }, header);
  }

  /**
   * Show examples
   */
  showExamples(examples: string[]): void {
    if (examples.length === 0) return;

    const exampleList = examples.slice(0, 3).join('\n    • ');
    logger.info(
      { exampleCount: examples.length },
      `Examples:\n    • ${exampleList}`
    );
  }

  /**
   * Show help text
   */
  showHelp(help: string): void {
    const helpLines = help.split('\n').join('\n    ');
    logger.info({ action: 'show-help' }, `Help:\n    ${helpLines}`);
  }

  /**
   * Show suggestions
   */
  showSuggestions(suggestions: string[]): void {
    if (suggestions.length === 0) return;

    const suggestionsList = suggestions
      .slice(0, 5)
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n    ');
    logger.info(
      { suggestionCount: suggestions.length },
      `Suggestions:\n    ${suggestionsList}`
    );
  }

  /**
   * Show validation errors
   */
  showValidationErrors(errors: string[]): void {
    const errorList = errors.join('\n    • ');
    logger.error(
      { errorCount: errors.length },
      `Validation Errors:\n    • ${errorList}`
    );
  }

  /**
   * Show warnings
   */
  showWarnings(warnings: string[]): void {
    const warningList = warnings.join('\n    • ');
    logger.warn(
      { warningCount: warnings.length },
      `Warnings:\n    • ${warningList}`
    );
  }

  /**
   * Show info message
   */
  showInfo(message: string): void {
    logger.info({ action: 'show-info' }, message);
  }

  /**
   * Show warning message
   */
  showWarning(message: string): void {
    logger.warn({ action: 'show-warning' }, message);
  }

  /**
   * Show error message
   */
  showError(message: string): void {
    logger.error({ action: 'show-error' }, `ERROR: ${message}`);
  }

  /**
   * Show completion screen
   */
  showCompletion(): void {
    const completionMessage = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              ✨  Agent Created Successfully!  ✨           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`;
    logger.info({ action: 'wizard-completed' }, completionMessage);
  }

  /**
   * Show preview of manifest
   */
  showPreview(manifest: Record<string, unknown>): void {
    logger.info({ action: 'show-preview', manifest }, 'Agent Preview');
  }

  /**
   * Show template selection
   */
  showTemplateGrid(
    templates: Array<{
      id: string;
      name: string;
      icon: string;
      description: string;
    }>
  ): void {
    const templateList = templates
      .map((t, i) => `[${i + 1}] ${t.icon}  ${t.name}\n      ${t.description}`)
      .join('\n');
    logger.info(
      { templateCount: templates.length },
      `Available Templates:\n\n${templateList}`
    );
  }

  /**
   * Show summary
   */
  showSummary(data: Record<string, unknown>): void {
    logger.info({ action: 'show-summary', summary: data }, 'Summary');
  }
}
