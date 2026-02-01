/**
 * Wizard UI Module
 * Beautiful console interface for wizard
 */

import chalk from 'chalk';
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
    console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║                                                            ║'));
    console.log(chalk.blue.bold('║         🤖  OSSA Agent Creation Wizard  🤖                ║'));
    console.log(chalk.blue.bold('║                                                            ║'));
    console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════════╝\n'));

    console.log(chalk.cyan(`  Create a production-ready AI agent in ${totalSteps} steps`));
    console.log(chalk.gray(`  Mode: ${this.options.mode || 'standard'}\n`));

    if (this.options.template) {
      console.log(chalk.green(`  ✓ Template: ${this.options.template}\n`));
    }

    console.log(chalk.gray('  Tips:'));
    console.log(chalk.gray('    • Press Enter to use suggested values'));
    console.log(chalk.gray('    • Type ? for help at any step'));
    console.log(chalk.gray('    • Type back to go to previous step'));
    console.log(chalk.gray('    • Type save to save progress'));
    console.log(chalk.gray('    • Press Ctrl+C to exit\n'));
  }

  /**
   * Show progress bar
   */
  showProgress(current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;

    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

    console.log(
      chalk.cyan(`\n  Progress: [${bar}] ${percentage}% (${current}/${total})`)
    );
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
    console.log(chalk.blue.bold(`\n┌─ Step ${stepNumber}/${totalSteps}: ${title}`));
    console.log(chalk.blue('│'));
    console.log(chalk.blue(`│  ${description}`));
    console.log(chalk.blue('└─\n'));
  }

  /**
   * Show examples
   */
  showExamples(examples: string[]): void {
    if (examples.length === 0) return;

    console.log(chalk.gray('  Examples:'));
    examples.slice(0, 3).forEach((example) => {
      console.log(chalk.gray(`    • ${example}`));
    });
    console.log();
  }

  /**
   * Show help text
   */
  showHelp(help: string): void {
    console.log(chalk.yellow('  ℹ Help:'));
    help.split('\n').forEach((line) => {
      console.log(chalk.yellow(`    ${line}`));
    });
    console.log();
  }

  /**
   * Show suggestions
   */
  showSuggestions(suggestions: string[]): void {
    if (suggestions.length === 0) return;

    console.log(chalk.cyan('  💡 Suggestions:'));
    suggestions.slice(0, 5).forEach((suggestion, index) => {
      console.log(chalk.cyan(`    ${index + 1}. ${suggestion}`));
    });
    console.log();
  }

  /**
   * Show validation errors
   */
  showValidationErrors(errors: string[]): void {
    console.log(chalk.red.bold('\n  ❌ Validation Errors:\n'));
    errors.forEach((error) => {
      console.log(chalk.red(`    • ${error}`));
    });
    console.log();
  }

  /**
   * Show warnings
   */
  showWarnings(warnings: string[]): void {
    console.log(chalk.yellow('\n  ⚠️  Warnings:\n'));
    warnings.forEach((warning) => {
      console.log(chalk.yellow(`    • ${warning}`));
    });
    console.log();
  }

  /**
   * Show info message
   */
  showInfo(message: string): void {
    console.log(chalk.blue(`\n  ℹ ${message}\n`));
  }

  /**
   * Show warning message
   */
  showWarning(message: string): void {
    console.log(chalk.yellow(`\n  ⚠️  ${message}\n`));
  }

  /**
   * Show error message
   */
  showError(message: string): void {
    console.log(chalk.red.bold(`\n  ❌ ERROR: ${message}\n`));
  }

  /**
   * Show completion screen
   */
  showCompletion(): void {
    console.log(chalk.green.bold('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                                                            ║'));
    console.log(chalk.green.bold('║              ✨  Agent Created Successfully!  ✨           ║'));
    console.log(chalk.green.bold('║                                                            ║'));
    console.log(chalk.green.bold('╚════════════════════════════════════════════════════════════╝\n'));
  }

  /**
   * Show preview of manifest
   */
  showPreview(manifest: Record<string, unknown>): void {
    console.log(chalk.blue.bold('\n📋 Agent Preview:\n'));
    console.log(chalk.gray(JSON.stringify(manifest, null, 2)));
    console.log();
  }

  /**
   * Show template selection
   */
  showTemplateGrid(templates: Array<{ id: string; name: string; icon: string; description: string }>): void {
    console.log(chalk.blue.bold('\n📚 Available Templates:\n'));

    templates.forEach((template, index) => {
      const number = chalk.cyan(`[${index + 1}]`);
      const icon = template.icon;
      const name = chalk.bold(template.name);
      const desc = chalk.gray(template.description);

      console.log(`  ${number} ${icon}  ${name}`);
      console.log(`      ${desc}\n`);
    });
  }

  /**
   * Show summary
   */
  showSummary(data: Record<string, unknown>): void {
    console.log(chalk.blue.bold('\n📊 Summary:\n'));

    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = chalk.cyan(`  ${key}:`);
      const formattedValue = typeof value === 'object'
        ? chalk.gray(JSON.stringify(value))
        : chalk.white(String(value));

      console.log(`${formattedKey} ${formattedValue}`);
    });

    console.log();
  }
}
