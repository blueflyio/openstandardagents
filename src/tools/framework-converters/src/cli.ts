#!/usr/bin/env node

/**
 * OSSA Framework Converter CLI
 *
 * Convert agents from popular frameworks to OSSA manifests
 */

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { stringify } from 'yaml';
import chalk from 'chalk';
import ora from 'ora';
import { autoConvert, getConverter, converters } from './index.js';

const program = new Command();

program
  .name('ossa-convert')
  .description('Convert agents from popular frameworks to OSSA manifests')
  .version('0.3.5');

program
  .command('convert')
  .description('Convert agent configuration to OSSA manifest')
  .argument('<input>', 'Input file (JSON or YAML)')
  .option('-f, --framework <name>', 'Framework name (langchain, crewai, autogen)')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('-s, --strict', 'Enable strict mode', false)
  .option('--target-version <version>', 'Target OSSA version', '0.3')
  .action(async (input: string, options: Record<string, unknown>) => {
    const spinner = ora('Converting agent configuration...').start();

    try {
      // Read input file
      const content = await readFile(input, 'utf-8');
      const config = JSON.parse(content);

      // Convert
      let result;
      if (options.framework) {
        const converter = getConverter(options.framework as string);
        result = await converter.convert(config, {
          strict: options.strict as boolean,
          target_version: options.targetVersion as string,
        });
      } else {
        const auto = await autoConvert(config);
        spinner.text = `Detected framework: ${auto.framework}`;
        result = auto.result;
      }

      spinner.succeed('Conversion complete!');

      // Show warnings
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        result.warnings.forEach((warning) => {
          console.log(chalk.yellow(`  ⚠ ${warning}`));
        });
      }

      // Output
      const yaml = stringify(result.manifest);

      if (options.output) {
        await writeFile(options.output as string, yaml, 'utf-8');
        console.log(chalk.green(`\n✓ Saved to: ${options.output}`));
      } else {
        console.log('\n' + yaml);
      }

      // Show metadata
      console.log(chalk.dim('\nMetadata:'));
      console.log(chalk.dim(`  Framework: ${result.metadata.source_framework}`));
      console.log(chalk.dim(`  OSSA Version: ${result.metadata.ossa_version}`));
      console.log(chalk.dim(`  Converted: ${result.metadata.conversion_time}`));
    } catch (error) {
      spinner.fail('Conversion failed');
      console.error(chalk.red('\nError:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate if input can be converted')
  .argument('<input>', 'Input file (JSON or YAML)')
  .option('-f, --framework <name>', 'Framework name (langchain, crewai, autogen)')
  .action(async (input: string, options: Record<string, unknown>) => {
    const spinner = ora('Validating input...').start();

    try {
      const content = await readFile(input, 'utf-8');
      const config = JSON.parse(content);

      if (options.framework) {
        const converter = getConverter(options.framework as string);
        const valid = await converter.validate(config);

        if (valid) {
          spinner.succeed(`Valid ${options.framework} configuration!`);
        } else {
          spinner.fail(`Invalid ${options.framework} configuration`);
          process.exit(1);
        }
      } else {
        // Try all converters
        for (const [name, converter] of Object.entries(converters)) {
          if (await converter.validate(config)) {
            spinner.succeed(`Detected: ${name}`);
            process.exit(0);
          }
        }

        spinner.fail('Could not detect framework');
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Validation failed');
      console.error(chalk.red('\nError:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List supported frameworks')
  .action(() => {
    console.log(chalk.bold('Supported Frameworks:\n'));

    Object.entries(converters).forEach(([name, converter]) => {
      console.log(chalk.green(`  • ${name}`));
      console.log(chalk.dim(`    Version: ${converter.version}`));
    });

    console.log(chalk.dim('\nUsage:'));
    console.log(chalk.dim('  ossa-convert convert input.json --framework langchain'));
    console.log(chalk.dim('  ossa-convert convert input.json --output agent.ossa.yaml'));
  });

program.parse();
