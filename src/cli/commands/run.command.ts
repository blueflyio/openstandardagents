/**
 * OSSA Run Command
 * Run an OSSA agent interactively
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as readline from 'readline';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { OpenAIAdapter } from '../../services/runtime/openai.adapter.js';
import type { SchemaVersion } from '../../types/index.js';

export const runCommand = new Command('run')
  .argument('<path>', 'Path to OSSA agent manifest (YAML or JSON)')
  .option('-r, --runtime <runtime>', 'Runtime adapter (openai)', 'openai')
  .option('-v, --verbose', 'Verbose output with tool calls')
  .option('--no-validate', 'Skip validation before running')
  .option('-m, --message <message>', 'Single message mode (non-interactive)')
  .option('--max-turns <turns>', 'Maximum tool call turns', '10')
  .description('Run an OSSA agent interactively')
  .action(
    async (
      path: string,
      options: {
        runtime: string;
        verbose?: boolean;
        validate?: boolean;
        message?: string;
        maxTurns: string;
      }
    ) => {
      try {
        // Get services from DI container
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        // Load manifest
        console.log(chalk.blue(`Loading agent: ${path}`));
        const manifest = await manifestRepo.load(path);

        // Validate if not skipped
        if (options.validate !== false) {
          const result = await validationService.validate(
            manifest,
            '0.2.3' as SchemaVersion
          );

          if (!result.valid) {
            console.error(chalk.red('✗ Agent manifest validation failed\n'));
            result.errors.forEach((error, index) => {
              console.error(
                chalk.red(`  ${index + 1}. ${error.instancePath}: ${error.message}`)
              );
            });
            process.exit(1);
          }

          if (options.verbose) {
            console.log(chalk.green('✓ Agent manifest validated'));
          }
        }

        // Check runtime
        if (options.runtime !== 'openai') {
          console.error(
            chalk.red(`Runtime '${options.runtime}' not supported yet`)
          );
          console.error(chalk.yellow('Available runtimes: openai'));
          process.exit(1);
        }

        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
          console.error(chalk.red('Error: OPENAI_API_KEY environment variable not set'));
          console.error(chalk.yellow('Set it with: export OPENAI_API_KEY=sk-...'));
          process.exit(1);
        }

        // Create adapter
        const adapter = new OpenAIAdapter(manifest as import('../../services/runtime/openai.adapter.js').OssaManifest);
        adapter.initialize();

        const info = adapter.getAgentInfo();
        console.log(chalk.green(`\n✓ Agent '${info.name}' loaded`));
        console.log(chalk.gray(`  Model: ${info.model}`));
        if (info.tools.length > 0) {
          console.log(chalk.gray(`  Tools: ${info.tools.join(', ')}`));
        }

        // Single message mode
        if (options.message) {
          console.log(chalk.gray('\n---'));
          const response = await adapter.chat(options.message, {
            verbose: options.verbose,
            maxTurns: parseInt(options.maxTurns),
          });
          console.log(chalk.cyan('\nAgent:'), response);
          process.exit(0);
        }

        // Interactive REPL mode
        console.log(chalk.gray('\nEntering interactive mode. Type "exit" to quit.\n'));

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const prompt = () => {
          rl.question(chalk.yellow('You: '), async (input) => {
            const trimmed = input.trim();

            if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
              console.log(chalk.gray('\nGoodbye!'));
              rl.close();
              process.exit(0);
            }

            if (!trimmed) {
              prompt();
              return;
            }

            try {
              const response = await adapter.chat(trimmed, {
                verbose: options.verbose,
                maxTurns: parseInt(options.maxTurns),
              });
              console.log(chalk.cyan('\nAgent:'), response, '\n');
            } catch (error) {
              console.error(
                chalk.red('\nError:'),
                error instanceof Error ? error.message : String(error),
                '\n'
              );
            }

            prompt();
          });
        };

        prompt();
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );

        if (options.verbose && error instanceof Error) {
          console.error(chalk.gray(error.stack));
        }

        process.exit(1);
      }
    }
  );
