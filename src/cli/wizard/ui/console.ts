/**
 * OSSA Wizard UI Components
 * Beautiful console output utilities for the interactive wizard
 *
 * SOLID: Single Responsibility - Console UI only
 * DRY: Reusable UI components
 */

import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';

export interface ConsoleUI {
  header(title: string, subtitle?: string): void;
  section(title: string): void;
  step(current: number, total: number, title: string): void;
  info(message: string): void;
  success(message: string): void;
  warning(message: string): void;
  error(message: string): void;
  example(text: string): void;
  list(items: string[]): void;
  table(headers: string[], rows: string[][]): void;
  box(content: string, title?: string): void;
  divider(): void;
  spacer(): void;
}

export const console_ui: ConsoleUI = {
  header(title: string, subtitle?: string): void {
    const content = subtitle ? `${title}\n${chalk.gray(subtitle)}` : title;
    console.log(
      boxen(content, {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
        title: 'OSSA',
        titleAlignment: 'center',
      })
    );
  },

  section(title: string): void {
    console.log('');
    console.log(chalk.blue.bold('═'.repeat(70)));
    console.log(chalk.blue.bold(`  ${title}`));
    console.log(chalk.blue.bold('═'.repeat(70)));
    console.log('');
  },

  step(current: number, total: number, title: string): void {
    console.log('');
    console.log(
      chalk.cyan.bold(`[Step ${current}/${total}]`) + chalk.white(` ${title}`)
    );
    console.log(chalk.gray('─'.repeat(70)));
  },

  info(message: string): void {
    console.log(chalk.blue(`  ℹ ${message}`));
  },

  success(message: string): void {
    console.log(chalk.green(`  ✓ ${message}`));
  },

  warning(message: string): void {
    console.log(chalk.yellow(`  ⚠ ${message}`));
  },

  error(message: string): void {
    console.log(chalk.red(`  ✗ ${message}`));
  },

  example(text: string): void {
    console.log(chalk.gray(`  Example: ${text}`));
  },

  list(items: string[]): void {
    items.forEach((item) => {
      console.log(chalk.white(`  • ${item}`));
    });
  },

  table(headers: string[], rows: string[][]): void {
    const table = new Table({
      head: headers.map((h) => chalk.cyan(h)),
      style: { border: ['gray'] },
    });
    rows.forEach((row) => table.push(row));
    console.log(table.toString());
  },

  box(content: string, title?: string): void {
    console.log(
      boxen(content, {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 2, right: 2 },
        borderStyle: 'round',
        borderColor: 'blue',
        title: title,
      })
    );
  },

  divider(): void {
    console.log(chalk.gray('─'.repeat(70)));
  },

  spacer(): void {
    console.log('');
  },
};

export function createProgressBar(current: number, total: number): string {
  const width = 40;
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  const percentage = Math.round((current / total) * 100);

  return (
    chalk.green('█'.repeat(filled)) +
    chalk.gray('░'.repeat(empty)) +
    chalk.cyan(` ${percentage}%`)
  );
}

export function formatAgentType(type: string): string {
  const icons: Record<string, string> = {
    orchestrator: '🎭',
    worker: '🔧',
    planner: '🧠',
    reviewer: '👁️',
    critic: '⚖️',
    judge: '⚡',
    monitor: '📊',
    integrator: '🔌',
    voice: '🎤',
    trainer: '🎓',
    governor: '🛡️',
  };

  return `${icons[type] || '🤖'} ${type}`;
}
