/**
 * LangChain CLI Commands
 * 
 * Framework integration commands for LangChain.
 * SOLID: Single Responsibility - LangChain CLI only
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';
import { LangChainImporterService } from '../../services/framework-import/langchain-importer.service.js';
import { LangChainAdapter } from '../../adapters/langchain-adapter.js';
import { LangChainRuntime } from '../../runtime/langchain.runtime.js';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

export const langchainCommand = new Command('langchain')
  .alias('lc')
  .description('LangChain integration commands');

// langchain:convert - Convert LangChain agent → OSSA
langchainCommand
  .command('convert')
  .description('Convert LangChain agent to OSSA manifest')
  .argument('<source>', 'Path to LangChain Python file or config file')
  .option('-o, --output <path>', 'Output path for OSSA manifest', 'agent.ossa.yaml')
  .option('--from-python', 'Source is Python code file')
  .option('--from-config', 'Source is config file (JSON/YAML)')
  .action(async (source: string, options: { output: string; fromPython?: boolean; fromConfig?: boolean }) => {
    console.log(chalk.blue('🔄 Converting LangChain Agent to OSSA'));
    console.log(chalk.gray('========================================\n'));

    if (!existsSync(source)) {
      console.error(chalk.red(`❌ File not found: ${source}`));
      process.exit(1);
    }

    try {
      const importer = new LangChainImporterService();
      let manifest;

      if (options.fromConfig || source.endsWith('.json') || source.endsWith('.yaml') || source.endsWith('.yml')) {
        manifest = await importer.importFromConfig(source);
      } else {
        manifest = await importer.importFromPythonFile(source);
      }

      // Write to output file
      const { dump } = await import('yaml');
      writeFileSync(options.output, dump(manifest));

      console.log(chalk.green(`\n✅ Converted LangChain agent to: ${options.output}`));
      console.log(chalk.gray(`\nAgent: ${manifest.metadata.name}`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// langchain:export - Export OSSA → LangChain Python code
langchainCommand
  .command('export')
  .description('Export OSSA manifest to LangChain Python code')
  .argument('<manifestFile>', 'Path to OSSA manifest file')
  .option('-o, --output <path>', 'Output path for Python file', 'agent.py')
  .action(async (manifestFile: string, options: { output: string }) => {
    console.log(chalk.blue('📤 Exporting OSSA to LangChain'));
    console.log(chalk.gray('==============================\n'));

    if (!existsSync(manifestFile)) {
      console.error(chalk.red(`❌ File not found: ${manifestFile}`));
      process.exit(1);
    }

    try {
      const manifest = await loadManifest(manifestFile);
      const pythonCode = LangChainAdapter.toPythonCode(manifest as any);

      writeFileSync(options.output, pythonCode);

      console.log(chalk.green(`\n✅ Exported OSSA manifest to: ${options.output}`));
      console.log(chalk.gray('\nYou can run this Python file directly'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// langchain:execute - Execute OSSA agent via LangChain
langchainCommand
  .command('execute')
  .description('Execute OSSA agent via LangChain')
  .argument('<manifestFile>', 'Path to OSSA manifest file')
  .option('--input <json>', 'Input JSON string', '{}')
  .option('--python-path <path>', 'Python executable path', 'python3')
  .action(async (manifestFile: string, options: { input: string; pythonPath: string }) => {
    console.log(chalk.blue('🚀 Executing OSSA Agent via LangChain'));
    console.log(chalk.gray('======================================\n'));

    if (!existsSync(manifestFile)) {
      console.error(chalk.red(`❌ File not found: ${manifestFile}`));
      process.exit(1);
    }

    try {
      const manifest = await loadManifest(manifestFile);
      const inputs = JSON.parse(options.input);

      const runtime = new LangChainRuntime({
        python_path: options.pythonPath,
      });

      console.log(chalk.gray('Executing agent via LangChain...'));
      const result = await runtime.execute(manifest as any, inputs);

      console.log(chalk.green('\n✅ Execution complete:'));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
