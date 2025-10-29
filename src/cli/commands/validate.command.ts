/**
 * OSSA Validate Command
 * Validate OSSA agent manifest against JSON schema
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../di-container.js';
import { ValidationService } from '../../services/validation.service.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import type { SchemaVersion } from '../../types/index.js';

export const validateCommand = new Command('validate')
  .argument('<path>', 'Path to OSSA manifest (YAML or JSON)')
  .option('-s, --schema <version>', 'Schema version (0.2.2, 1.0, or 0.1.9)', '0.2.2')
  .option('-v, --verbose', 'Verbose output with detailed information')
  .description('Validate OSSA agent manifest against JSON schema')
  .action(
    async (path: string, options: { schema: string; verbose?: boolean }) => {
      try {
        // Get services from DI container
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        // Load manifest
        console.log(chalk.blue(`Validating OSSA agent: ${path}`));
        const manifest = await manifestRepo.load(path);

        // Validate
        const result = await validationService.validate(
          manifest,
          options.schema as SchemaVersion
        );

        // Output results
        if (result.valid) {
          console.log(
            chalk.green('✓ Agent manifest is valid OSSA ' + options.schema)
          );

          if (options.verbose && result.manifest) {
            console.log(chalk.gray('\nAgent Details:'));
            console.log(`  ID: ${chalk.cyan(result.manifest.agent.id)}`);
            console.log(`  Name: ${chalk.cyan(result.manifest.agent.name)}`);
            console.log(
              `  Version: ${chalk.cyan(result.manifest.agent.version)}`
            );
            console.log(`  Role: ${chalk.cyan(result.manifest.agent.role)}`);
            console.log(
              `  Capabilities: ${chalk.cyan(result.manifest.agent.capabilities.length)}`
            );
            console.log(
              `  Runtime: ${chalk.cyan(result.manifest.agent.runtime.type)}`
            );

            if (result.manifest.agent.llm) {
              console.log(
                `  LLM: ${chalk.cyan(result.manifest.agent.llm.provider)} / ${chalk.cyan(result.manifest.agent.llm.model)}`
              );
            }

            if (result.manifest.extensions) {
              const extensions = Object.keys(result.manifest.extensions);
              console.log(`  Extensions: ${chalk.cyan(extensions.join(', '))}`);
            }
          }

          // Show warnings if any
          if (result.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠  Warnings (Best Practices):'));
            result.warnings.forEach((warning) => {
              console.log(chalk.yellow(`  - ${warning}`));
            });
          }

          process.exit(0);
        } else {
          console.error(chalk.red('✗ Validation failed\n'));
          console.error(chalk.red('Errors:'));

          result.errors.forEach((error, index) => {
            const path = error.instancePath || 'root';
            const message = error.message || 'Unknown error';

            console.error(chalk.red(`  ${index + 1}. ${path}: ${message}`));

            if (options.verbose && error.params) {
              console.error(
                chalk.gray(`     Params: ${JSON.stringify(error.params)}`)
              );
            }
          });

          process.exit(1);
        }
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
