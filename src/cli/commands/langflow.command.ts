/**
 * Langflow CLI Commands
 *
 * Framework integration commands for Langflow.
 * SOLID: Single Responsibility - Langflow CLI only
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import { LangflowImporterService } from '../../services/framework-import/langflow-importer.service.js';
import { LangflowAdapter } from '../../adapters/langflow-adapter.js';
import { LangflowRuntime } from '../../runtime/langflow.runtime.js';

export const langflowCommand = new Command('langflow')
  .alias('lf')
  .description('Langflow integration commands');

// langflow:import - Import Langflow flow → OSSA
langflowCommand
  .command('import')
  .description('Import Langflow flow and convert to OSSA manifest')
  .argument('<flowFile>', 'Path to Langflow flow JSON file')
  .option(
    '-o, --output <path>',
    'Output path for OSSA manifest',
    'agent.ossa.yaml'
  )
  .action(async (flowFile: string, options: { output: string }) => {
    console.log(chalk.blue('📥 Importing Langflow Flow'));
    console.log(chalk.gray('==========================\n'));

    if (!existsSync(flowFile)) {
      console.error(chalk.red(`❌ File not found: ${flowFile}`));
      process.exit(1);
    }

    try {
      const importer = new LangflowImporterService();
      const manifest = await importer.importFromFile(flowFile);

      // Write to output file
      const yaml = await import('yaml');
      writeFileSync(options.output, yaml.stringify(manifest));

      console.log(
        chalk.green(`\n✅ Imported Langflow flow to: ${options.output}`)
      );
      console.log(
        chalk.gray(
          `\nManifest: ${manifest.metadata?.name || 'unknown'} (${manifest.kind})`
        )
      );
    } catch (error) {
      console.error(
        chalk.red(
          `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

// langflow:export - Export OSSA → Langflow
langflowCommand
  .command('export')
  .description('Export OSSA manifest to Langflow flow format')
  .argument('<manifestFile>', 'Path to OSSA manifest file')
  .option(
    '-o, --output <path>',
    'Output path for Langflow flow JSON',
    'flow.json'
  )
  .action(async (manifestFile: string, options: { output: string }) => {
    console.log(chalk.blue('📤 Exporting OSSA to Langflow'));
    console.log(chalk.gray('==============================\n'));

    if (!existsSync(manifestFile)) {
      console.error(chalk.red(`❌ File not found: ${manifestFile}`));
      process.exit(1);
    }

    try {
      const content = readFileSync(manifestFile, 'utf-8');
      const manifest = parse(content);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flowJson = LangflowAdapter.toJSON(manifest);

      writeFileSync(options.output, flowJson);

      console.log(
        chalk.green(`\n✅ Exported OSSA manifest to: ${options.output}`)
      );
      console.log(
        chalk.gray('\nYou can import this file into Langflow visual editor')
      );
    } catch (error) {
      console.error(
        chalk.red(
          `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

// langflow:execute - Execute OSSA agent via Langflow
langflowCommand
  .command('execute')
  .description('Execute OSSA agent via Langflow API')
  .argument('<manifestFile>', 'Path to OSSA manifest file')
  .option('--base-url <url>', 'Langflow base URL', 'http://localhost:7860')
  .option(
    '--api-key <key>',
    'Langflow API key (or set LANGFLOW_API_KEY env var)'
  )
  .option('--input <json>', 'Input JSON string', '{}')
  .action(
    async (
      manifestFile: string,
      options: { baseUrl: string; apiKey?: string; input: string }
    ) => {
      console.log(chalk.blue('🚀 Executing OSSA Agent via Langflow'));
      console.log(chalk.gray('=====================================\n'));

      if (!existsSync(manifestFile)) {
        console.error(chalk.red(`❌ File not found: ${manifestFile}`));
        process.exit(1);
      }

      try {
        const content = readFileSync(manifestFile, 'utf-8');
        const manifest = parse(content);
        const inputs = JSON.parse(options.input);

        // Get flow_id from extensions
        const extensions = manifest.extensions?.langflow;
        if (!extensions?.flow_id) {
          console.error(
            chalk.red('❌ Langflow flow_id not found in manifest extensions')
          );
          process.exit(1);
        }

        const runtime = new LangflowRuntime({
          base_url: options.baseUrl,
          api_key: options.apiKey || process.env.LANGFLOW_API_KEY,
          flow_id: extensions.flow_id,
        });

        console.log(chalk.gray(`Executing flow: ${extensions.flow_id}...`));
        const result = await runtime.execute(manifest, inputs);

        console.log(chalk.green('\n✅ Execution complete:'));
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(
          chalk.red(
            `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );
