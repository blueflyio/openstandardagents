/**
 * OSSA CLI Banner & Branding
 * Displays beautiful ASCII art and branding for the OSSA wizard
 */

import chalk from 'chalk';

export const OSSA_BANNER = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}                                                                       ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.bold.blue('  ____   _____ _____         __      ___  _  _   ___  ')}              ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.bold.blue(' / __ \\ / ____/ ____|  /\\    \\ \\    / / || || | / _ \\ ')}              ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.bold.blue('| |  | | (___| (___   /  \\    \\ \\  / /| || || || | | |')}              ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.bold.blue('| |  | |\\___ \\\\___ \\ / /\\ \\    \\ \\/ / |__   _|| | | |')}              ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.bold.blue('| |__| |____) |___) / ____ \\    \\  /     | |(_| |_| |')}              ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.bold.blue(' \\____/|_____/_____/_/    \\_\\    \\/      |_|(_)\\___/ ')}              ${chalk.cyan('║')}
${chalk.cyan('║')}                                                                       ${chalk.cyan('║')}
${chalk.cyan('║')}        ${chalk.yellow.bold('Open Standard for Software Agents')}                          ${chalk.cyan('║')}
${chalk.cyan('║')}        ${chalk.gray('The Universal Agent Specification Language')}               ${chalk.cyan('║')}
${chalk.cyan('║')}                                                                       ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════════════════╝')}
`;

export const WIZARD_BANNER = `
${chalk.magenta('╔═══════════════════════════════════════════════════════════════════════╗')}
${chalk.magenta('║')}                                                                       ${chalk.magenta('║')}
${chalk.magenta('║')}          ${chalk.bold.yellow('🧙  OSSA Agent Creation Wizard v2.0')}                        ${chalk.magenta('║')}
${chalk.magenta('║')}                                                                       ${chalk.magenta('║')}
${chalk.magenta('║')}      ${chalk.gray('Create production-ready agents with AI superpowers')}            ${chalk.magenta('║')}
${chalk.magenta('║')}                                                                       ${chalk.magenta('║')}
${chalk.magenta('╚═══════════════════════════════════════════════════════════════════════╝')}
`;

export const FEATURES_GRAPHIC = `
${chalk.cyan('┌────────────────────────────────────────────────────────────────────────┐')}
${chalk.cyan('│')} ${chalk.bold.green('✓')} Skills System          ${chalk.cyan('│')} ${chalk.bold.green('✓')} RAG & Vector DB      ${chalk.cyan('│')} ${chalk.bold.green('✓')} A2A Messaging ${chalk.cyan('│')}
${chalk.cyan('│')} ${chalk.bold.green('✓')} Knowledge Sources      ${chalk.cyan('│')} ${chalk.bold.green('✓')} Cost Management      ${chalk.cyan('│')} ${chalk.bold.green('✓')} Workflows     ${chalk.cyan('│')}
${chalk.cyan('│')} ${chalk.bold.green('✓')} Multi-Platform Export  ${chalk.cyan('│')} ${chalk.bold.green('✓')} Observability        ${chalk.cyan('│')} ${chalk.bold.green('✓')} Security      ${chalk.cyan('│')}
${chalk.cyan('│')} ${chalk.bold.green('✓')} Testing & Validation   ${chalk.cyan('│')} ${chalk.bold.green('✓')} State Management     ${chalk.cyan('│')} ${chalk.bold.green('✓')} Deployment    ${chalk.cyan('│')}
${chalk.cyan('└────────────────────────────────────────────────────────────────────────┘')}
`;

export const VERSION_INFO = `
${chalk.gray('Version:')} ${chalk.white('0.4.1')}  ${chalk.gray('│')}  ${chalk.gray('Spec:')} ${chalk.white('v0.4.1')}  ${chalk.gray('│')}  ${chalk.gray('License:')} ${chalk.white('MIT')}
${chalk.gray('Docs:')} ${chalk.blue.underline('https://openstandardagents.org')}
${chalk.gray('GitHub:')} ${chalk.blue.underline('https://github.com/openstandardagents')}
`;

export const COMPLETION_GRAPHIC = `
${chalk.green('╔═══════════════════════════════════════════════════════════════════════╗')}
${chalk.green('║')}                                                                       ${chalk.green('║')}
${chalk.green('║')}                  ${chalk.bold.yellow('🎉  Agent Created Successfully!')}                    ${chalk.green('║')}
${chalk.green('║')}                                                                       ${chalk.green('║')}
${chalk.green('║')}               ${chalk.gray('Your agent is ready for production')}                    ${chalk.green('║')}
${chalk.green('║')}                                                                       ${chalk.green('║')}
${chalk.green('╚═══════════════════════════════════════════════════════════════════════╝')}
`;

export const TEMPLATES_GRAPHIC = `
${chalk.blue('╭─────────────────────────────────────────────────────────────────────╮')}
${chalk.blue('│')}  ${chalk.bold.white('📦  Quick Start Templates')}                                          ${chalk.blue('│')}
${chalk.blue('├─────────────────────────────────────────────────────────────────────┤')}
${chalk.blue('│')}  ${chalk.yellow('1.')} Code Reviewer      - Automated code review with best practices ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('2.')} Web Scraper        - Extract data from websites intelligently  ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('3.')} Data Analyst       - Analyze datasets and generate insights    ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('4.')} DevOps Agent       - CI/CD automation and infrastructure       ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('5.')} Support Bot        - Customer support automation               ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('6.')} Content Generator  - Blog posts, docs, and marketing copy     ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('7.')} Security Scanner   - Vulnerability detection and analysis      ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('8.')} Testing Agent      - Automated test generation and execution   ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('9.')} Documentation Gen  - Auto-generate project documentation       ${chalk.blue('│')}
${chalk.blue('│')}  ${chalk.yellow('10.')} Custom Agent      - Start from scratch with guided setup      ${chalk.blue('│')}
${chalk.blue('╰─────────────────────────────────────────────────────────────────────╯')}
`;

export function printBanner() {
  console.clear();
  console.log(OSSA_BANNER);
  console.log(VERSION_INFO);
  console.log('');
}

export function printWizardBanner() {
  console.log(WIZARD_BANNER);
  console.log(FEATURES_GRAPHIC);
  console.log('');
}

export function printTemplates() {
  console.log(TEMPLATES_GRAPHIC);
  console.log('');
}

export function printCompletion() {
  console.log('');
  console.log(COMPLETION_GRAPHIC);
  console.log('');
}

export function printProgress(current: number, total: number, step: string) {
  const percentage = Math.round((current / total) * 100);
  const bar =
    '█'.repeat(Math.floor(percentage / 5)) +
    '░'.repeat(20 - Math.floor(percentage / 5));

  console.log('');
  console.log(chalk.cyan('Progress:'));
  console.log(chalk.white(`[${bar}] ${percentage}% - ${step}`));
  console.log(chalk.gray(`Step ${current} of ${total}`));
  console.log('');
}

export function printError(message: string) {
  console.log('');
  console.log(
    chalk.red(
      '╔═══════════════════════════════════════════════════════════════════════╗'
    )
  );
  console.log(
    chalk.red('║') +
      '  ' +
      chalk.bold.red('❌  ERROR') +
      '                                                          ' +
      chalk.red('║')
  );
  console.log(
    chalk.red(
      '╚═══════════════════════════════════════════════════════════════════════╝'
    )
  );
  console.log('');
  console.log(chalk.red(message));
  console.log('');
}

export function printWarning(message: string) {
  console.log('');
  console.log(chalk.yellow('⚠️  WARNING:'), chalk.white(message));
  console.log('');
}

export function printSuccess(message: string) {
  console.log('');
  console.log(chalk.green('✓'), chalk.white(message));
}

export function printInfo(message: string) {
  console.log(chalk.blue('ℹ'), chalk.gray(message));
}

export function printStep(
  step: number,
  total: number,
  title: string,
  description?: string
) {
  console.log('');
  console.log(chalk.cyan('═'.repeat(75)));
  console.log(
    chalk.cyan(`Step ${step}/${total}:`) + ' ' + chalk.bold.white(title)
  );
  if (description) {
    console.log(chalk.gray(description));
  }
  console.log(chalk.cyan('═'.repeat(75)));
  console.log('');
}
