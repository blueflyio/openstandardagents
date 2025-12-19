/**
 * OSSA Validate Command
 * Validate OSSA agent manifest against JSON schema
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import {
  formatValidationErrors,
  formatErrorCompact,
} from '../utils/error-formatter.js';
import type {
  OssaAgent,
  SchemaVersion,
  ValidationResult,
} from '../../types/index.js';

export const validateCommand = new Command('validate')
  .argument('<path>', 'Path to OSSA manifest or OpenAPI spec (YAML or JSON)')
  .option(
    '-s, --schema <version>',
    'Schema version to validate against. If not specified, auto-detects from manifest apiVersion. (0.3.0, 0.2.9, 0.2.8, 0.2.6, 0.2.5, 0.2.3, 0.2.2, or 1.0)'
  )
  .option('--openapi', 'Validate as OpenAPI specification with OSSA extensions')
  .option('--check-messaging', 'Validate messaging extension (v0.3.0+)')
  .option('-v, --verbose', 'Verbose output with detailed information')
  .description(
    'Validate OSSA agent manifest or OpenAPI spec against JSON schema'
  )
  .action(
    async (
      path: string,
      options: {
        schema?: string;
        openapi?: boolean;
        checkMessaging?: boolean;
        verbose?: boolean;
      }
    ) => {
      try {
        // Get services from DI container
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        // Load file
        if (options.openapi) {
          console.log(
            chalk.blue(`Validating OpenAPI spec with OSSA extensions: ${path}`)
          );
        } else {
          console.log(chalk.blue(`Validating OSSA agent: ${path}`));
        }
        const manifest = await manifestRepo.load(path);

        // Validate
        let result: ValidationResult;
        if (options.openapi) {
          result = await validationService.validateOpenAPIExtensions(manifest);
        } else {
          result = await validationService.validate(
            manifest,
            options.schema ? (options.schema as SchemaVersion) : undefined
          );
        }

        // Output results
        if (result.valid) {
          if (options.openapi) {
            console.log(
              chalk.green('✓ OpenAPI spec is valid with OSSA extensions')
            );
          } else {
            // Extract version from result manifest or use provided option
            const m = result.manifest as OssaAgent;
            const detectedVersion =
              m?.apiVersion?.replace('ossa/', '') ||
              options.schema ||
              'unknown';
            console.log(
              chalk.green('✓ Agent manifest is valid OSSA ' + detectedVersion)
            );
          }

          if (options.verbose && result.manifest) {
            console.log(chalk.gray('\nAgent Details:'));
            const m = result.manifest as OssaAgent;
            if (m.apiVersion) {
              console.log(
                `  Name: ${chalk.cyan(m.metadata?.name || 'unknown')}`
              );
              console.log(
                `  Version: ${chalk.cyan(m.metadata?.version || 'unknown')}`
              );
              console.log(`  Role: ${chalk.cyan(m.spec?.role || 'unknown')}`);
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

            if (m.spec?.messaging) {
              console.log(chalk.gray('\nMessaging Configuration:'));
              if (m.spec.messaging.publishes) {
                console.log(
                  `  Publishes: ${chalk.cyan(m.spec.messaging.publishes.length)} channel(s)`
                );
                m.spec.messaging.publishes.forEach((ch: any) => {
                  console.log(`    - ${chalk.cyan(ch.channel)}`);
                });
              }
              if (m.spec.messaging.subscribes) {
                console.log(
                  `  Subscribes: ${chalk.cyan(m.spec.messaging.subscribes.length)} channel(s)`
                );
                m.spec.messaging.subscribes.forEach((sub: any) => {
                  console.log(`    - ${chalk.cyan(sub.channel)}`);
                });
              }
              if (m.spec.messaging.commands) {
                console.log(
                  `  Commands: ${chalk.cyan(m.spec.messaging.commands.length)}`
                );
                m.spec.messaging.commands.forEach((cmd: any) => {
                  console.log(`    - ${chalk.cyan(cmd.name)}`);
                });
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
          // Use the new error formatter for better error messages
          if (options.verbose) {
            // Detailed, helpful error messages with manifest context
            console.error(formatValidationErrors(result.errors, manifest));
          } else {
            // Compact error messages
            console.error(chalk.red.bold('\n✗ Validation Failed'));
            console.error(
              chalk.red(`Found ${result.errors.length} error(s):\n`)
            );
            result.errors.forEach((error, index) => {
              console.error(formatErrorCompact(error, index, manifest));
            });
            console.error(
              chalk.gray('\nUse --verbose for detailed error information')
            );
            console.error(
              chalk.blue('📚 Docs: https://openstandardagents.org/docs\n')
            );
          }

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
