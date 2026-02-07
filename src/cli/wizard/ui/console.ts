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
import { logger } from '../../../utils/logger.js';

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
    const output = boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
      title: 'OSSA',
      titleAlignment: 'center',
    });
    logger.info({ action: 'show-header', title }, output);
  },

  section(title: string): void {
    const output = `\n${'═'.repeat(70)}\n  ${title}\n${'═'.repeat(70)}\n`;
    logger.info({ action: 'show-section', section: title }, output);
  },

  step(current: number, total: number, title: string): void {
    const output = `\n[Step ${current}/${total}] ${title}\n${'─'.repeat(70)}`;
    logger.info({ step: current, total, title }, output);
  },

  info(message: string): void {
    logger.info({ action: 'ui-info' }, message);
  },

  success(message: string): void {
    logger.info({ action: 'ui-success' }, message);
  },

  warning(message: string): void {
    logger.warn({ action: 'ui-warning' }, message);
  },

  error(message: string): void {
    logger.error({ action: 'ui-error' }, message);
  },

  example(text: string): void {
    logger.info({ action: 'show-example' }, `Example: ${text}`);
  },

  list(items: string[]): void {
    const output = items.map((item) => `  • ${item}`).join('\n');
    logger.info({ itemCount: items.length }, output);
  },

  table(headers: string[], rows: string[][]): void {
    const table = new Table({
      head: headers.map((h) => chalk.cyan(h)),
      style: { border: ['gray'] },
    });
    rows.forEach((row) => table.push(row));
    logger.info({ rowCount: rows.length }, table.toString());
  },

  box(content: string, title?: string): void {
    const output = boxen(content, {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'blue',
      title: title,
    });
    logger.info({ action: 'show-box', boxTitle: title }, output);
  },

  divider(): void {
    logger.info({ action: 'divider' }, '─'.repeat(70));
  },

  spacer(): void {
    logger.info({ action: 'spacer' }, '');
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
