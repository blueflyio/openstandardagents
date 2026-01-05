#!/usr/bin/env node
/**
 * OSSA CLI - Main entry point
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('ossa')
  .description('OSSA CLI - Open Standard for Scalable AI Agents')
  .version('0.3.2');

program
  .command('init')
  .description('Initialize a new OSSA project')
  .option('--name <name>', 'Project name')
  .option('--template <template>', 'Project template: minimal, full, enterprise', 'minimal')
  .option('--typescript', 'Use TypeScript')
  .option('--git', 'Initialize git repository')
  .action(async (options) => {
    const { initProject } = await import('./commands/init.js');
    await initProject(options);
  });

program
  .command('validate <path>')
  .description('Validate OSSA agent manifest')
  .option('--version <version>', 'OSSA version', '0.3.2')
  .option('--strict', 'Enable strict validation')
  .option('--format <format>', 'Output format: json, yaml, table', 'table')
  .option('--verbose', 'Show detailed errors')
  .action(async (path, options) => {
    const { validateManifest } = await import('./commands/validate.js');
    await validateManifest(path, options);
  });

program
  .command('run <manifest>')
  .description('Run an OSSA agent locally')
  .option('--env <file>', 'Environment variables file')
  .option('--port <port>', 'Port to run on', '3000')
  .option('--watch', 'Watch for changes')
  .option('--debug', 'Enable debug logging')
  .action(async (manifest, options) => {
    const { runAgent } = await import('./commands/run.js');
    await runAgent(manifest, options);
  });

program
  .command('export <manifest>')
  .description('Export agent manifest to different formats')
  .option('--format <format>', 'Export format: json, yaml, openapi, k8s', 'json')
  .option('--output <path>', 'Output file path')
  .option('--pretty', 'Pretty print output')
  .action(async (manifest, options) => {
    const { exportManifest } = await import('./commands/export.js');
    await exportManifest(manifest, options);
  });

program
  .command('providers')
  .description('Manage LLM provider configurations')
  .option('list', 'List providers')
  .option('add <name>', 'Add provider')
  .option('remove <name>', 'Remove provider')
  .option('set-default <name>', 'Set default provider')
  .action(async (options) => {
    const { manageProviders } = await import('./commands/providers.js');
    await manageProviders(options);
  });

program.parse();
