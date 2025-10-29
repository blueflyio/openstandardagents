/**
 * OSSA Validate Command
 * Validate OSSA agent manifest against JSON schema
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import type { SchemaVersion } from '../../types/index.js';

export const validateCommand = new Command('validate')
  .argument('<path>', 'Path to OSSA manifest (YAML or JSON)')
  .option(
    '-s, --schema <version>',
    'Schema version (0.2.2, 0.1.9, or 1.0)',
    '0.2.2'
  )
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
            const m = result.manifest as any;
            if (m.apiVersion) {
              console.log(`  Name: ${chalk.cyan(m.metadata.name)}`);
              console.log(`  Version: ${chalk.cyan(m.metadata.version)}`);
              console.log(`  Role: ${chalk.cyan(m.spec.role)}`);
            } else if (m.agent) {
              console.log(`  ID: ${chalk.cyan(m.agent.id)}`);
              console.log(`  Name: ${chalk.cyan(m.agent.name)}`);
              console.log(`  Version: ${chalk.cyan(m.agent.version)}`);
              console.log(`  Role: ${chalk.cyan(m.agent.role)}`);
            }
            if (m.spec) {
              if (m.spec.tools) {
                console.log(`  Tools: ${chalk.cyan(m.spec.tools.length)}`);
              }
              if (m.spec.llm) {
                console.log(
                  `  LLM: ${chalk.cyan(m.spec.llm.provider)} / ${chalk.cyan(m.spec.llm.model)}`
                );
              }
            }

            if (m.agent?.capabilities) {
              console.log(
                `  Capabilities: ${chalk.cyan(m.agent.capabilities.length)}`
              );
            }
            if (m.agent?.runtime) {
              console.log(`  Runtime: ${chalk.cyan(m.agent.runtime.type)}`);
            }

            if (m.agent?.llm) {
              console.log(
                `  LLM: ${chalk.cyan(m.agent.llm.provider)} / ${chalk.cyan(m.agent.llm.model)}`
              );
            }

            if (m.extensions) {
              const extensions = Object.keys(m.extensions);
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
