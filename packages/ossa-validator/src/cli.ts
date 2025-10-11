#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import chalk from 'chalk';
import { OSSAValidator, ValidationResult } from './validator';
import { OSSA_SPECIFICATION_VERSION } from '@ossa/specification';

const program = new Command();
const validator = new OSSAValidator();

program
  .name('ossa-validate')
  .description('OSSA Validator CLI - Validate agent manifests and workflows')
  .version(OSSA_SPECIFICATION_VERSION);

program
  .command('agent')
  .description('Validate an agent manifest file')
  .argument('<file>', 'Path to agent.yml or agent.yaml file')
  .option('-f, --format <format>', 'Output format (json, table)', 'table')
  .option('--strict', 'Enable strict validation')
  .action(async (file: string, options: any) => {
    try {
      const result = await validateAgentFile(file, options);
      outputResult(result, options.format);
      process.exit(result.valid ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('workflow')
  .description('Validate a workflow specification file')
  .argument('<file>', 'Path to workflow.yml or workflow.yaml file')
  .option('-f, --format <format>', 'Output format (json, table)', 'table')
  .action(async (file: string, options: any) => {
    try {
      const result = await validateWorkflowFile(file, options);
      outputResult(result, options.format);
      process.exit(result.valid ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('directory')
  .description('Validate all OSSA files in a directory')
  .argument('<dir>', 'Directory to validate')
  .option('-r, --recursive', 'Validate recursively')
  .option('-f, --format <format>', 'Output format (json, table)', 'table')
  .action(async (dir: string, options: any) => {
    console.log(chalk.yellow('Directory validation not yet implemented'));
    process.exit(1);
  });

program
  .command('remote')
  .description('Validate a remote agent via HTTP')
  .argument('<url>', 'Base URL of the agent')
  .option('-f, --format <format>', 'Output format (json, table)', 'table')
  .action(async (url: string, options: any) => {
    console.log(chalk.yellow('Remote validation not yet implemented'));
    process.exit(1);
  });

program
  .command('conformance')
  .description('Check conformance level of an agent')
  .argument('<file>', 'Path to agent.yml file')
  .option('-l, --level <level>', 'Target conformance level (bronze, silver, gold, advanced)')
  .action(async (file: string, options: any) => {
    try {
      const result = await validateAgentFile(file, options);

      if (!result.valid) {
        console.log(chalk.red('✗ Agent manifest is invalid'));
        outputResult(result, 'table');
        process.exit(1);
      }

      console.log(chalk.green('✓ Agent manifest is valid'));
      console.log(chalk.blue(`Conformance Level: ${result.conformanceLevel}`));
      console.log(chalk.blue(`Score: ${result.score}/100`));

      if (options.level) {
        const targetLevel = options.level.toLowerCase();
        const levels = ['bronze', 'silver', 'gold', 'advanced'];
        const currentIndex = levels.indexOf(result.conformanceLevel || 'bronze');
        const targetIndex = levels.indexOf(targetLevel);

        if (currentIndex >= targetIndex) {
          console.log(chalk.green(`✓ Meets ${targetLevel} conformance level`));
          process.exit(0);
        } else {
          console.log(chalk.red(`✗ Does not meet ${targetLevel} conformance level`));
          process.exit(1);
        }
      }

      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function validateAgentFile(filePath: string, options: any): Promise<ValidationResult> {
  const fullPath = resolve(filePath);

  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const content = readFileSync(fullPath, 'utf8');
  const data = filePath.endsWith('.json') ? JSON.parse(content) : parseYaml(content);

  return validator.validateAgentManifest(data);
}

async function validateWorkflowFile(filePath: string, options: any): Promise<ValidationResult> {
  const fullPath = resolve(filePath);

  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const content = readFileSync(fullPath, 'utf8');
  const data = filePath.endsWith('.json') ? JSON.parse(content) : parseYaml(content);

  return validator.validateWorkflow(data);
}

function outputResult(result: ValidationResult, format: string) {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Table format
  if (result.valid) {
    console.log(chalk.green('✓ Validation passed'));
    if (result.conformanceLevel) {
      console.log(chalk.blue(`Conformance Level: ${result.conformanceLevel}`));
    }
    if (result.score !== undefined) {
      console.log(chalk.blue(`Score: ${result.score}/100`));
    }
  } else {
    console.log(chalk.red('✗ Validation failed'));
  }

  if (result.errors.length > 0) {
    console.log('\nIssues found:');
    result.errors.forEach((error, index) => {
      const icon = error.severity === 'error' ? '✗' :
                  error.severity === 'warning' ? '⚠' : 'ℹ';
      const color = error.severity === 'error' ? chalk.red :
                   error.severity === 'warning' ? chalk.yellow : chalk.blue;

      console.log(`${color(icon)} ${error.path}: ${error.message}`);
    });
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled rejection:'), reason);
  process.exit(1);
});

program.parse();