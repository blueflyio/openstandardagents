/**
 * OSSA Validate Command
 * Validate OSSA agent manifest against JSON schema
 *
 * SOLID Principles:
 * - Uses shared output utilities (DRY)
 * - Single Responsibility: Only validates manifests
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { KAgentValidator } from '../../sdks/kagent/validator.js';
import {
  formatValidationErrors,
  formatErrorCompact,
  isJSONOutput,
  outputJSON,
} from '../utils/index.js';
import {
  addGlobalOptions,
  addQueryOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';
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
  .option(
    '-p, --platform <platform>',
    'Platform-specific validation (kagent, langchain, crewai, docker, kubernetes)'
  )
  .option('--all', 'Validate for all platforms', false)
  .description(
    'Validate OSSA agent manifest or OpenAPI spec against JSON schema'
  );

// Apply production-grade standard options
addGlobalOptions(validateCommand);
addQueryOptions(validateCommand);

validateCommand.action(
  async (
    path: string,
    options: {
      schema?: string;
      openapi?: boolean;
      checkMessaging?: boolean;
      verbose?: boolean;
      quiet?: boolean;
      json?: boolean;
      color?: boolean;
      output?: string;
      platform?: string;
      all?: boolean;
    }
  ) => {
    const useColor = shouldUseColor(options);
    const log = (msg: string, color?: (s: string) => string) => {
      if (options.quiet) return;
      const output = useColor && color ? color(msg) : msg;
      console.log(output);
    };

    try {
      // Get services from DI container
      const manifestRepo = container.get(ManifestRepository);
      const validationService = container.get(ValidationService);

      // Load file
      if (options.openapi) {
        log(
          `Validating OpenAPI spec with OSSA extensions: ${path}`,
          chalk.blue
        );
      } else {
        log(`Validating OSSA agent: ${path}`, chalk.blue);
      }
      const manifest = await manifestRepo.load(path);

      // Validate
      let result: ValidationResult;
      if (options.openapi) {
        result = await validationService.validateOpenAPIExtensions(manifest);
      } else {
        result = await validationService.validate(
          manifest,
          options.schema as SchemaVersion
        );
      }

      // Output results
      const isJSON = options.json || options.output === 'json';
      if (isJSON) {
        // JSON output for machine consumption (uses shared utility)
        const m = result.manifest as OssaAgent;
        outputJSON({
          valid: result.valid,
          path,
          schemaVersion:
            options.schema || m?.apiVersion?.replace('ossa/', '') || 'auto',
          errors: result.errors.map((e: any) => ({
            path: e.instancePath || e.path || '',
            message: e.message || String(e),
            keyword: e.keyword || 'validation',
          })),
          warnings: result.warnings || [],
          manifest: result.valid
            ? {
                name: m?.metadata?.name || m?.agent?.name,
                version: m?.metadata?.version || m?.agent?.version,
                kind: m?.kind || 'Agent',
                apiVersion: m?.apiVersion,
              }
            : undefined,
        });
        process.exit(result.valid ? ExitCode.SUCCESS : ExitCode.GENERAL_ERROR);
      }

      if (result.valid) {
        if (options.openapi) {
          log('✓ OpenAPI spec is valid with OSSA extensions', chalk.green);
        } else {
          // Extract version from result manifest or use provided option
          const m = result.manifest as OssaAgent;
          const detectedVersion =
            m?.apiVersion?.replace('ossa/', '') || options.schema || 'unknown';
          log('✓ Agent manifest is valid OSSA ' + detectedVersion, chalk.green);
        }

        if (options.verbose && result.manifest) {
          log('\nAgent Details:', chalk.gray);
          const m = result.manifest;
          if (m.apiVersion) {
            log(
              `  Name: ${useColor ? chalk.cyan(m.metadata?.name || 'unknown') : m.metadata?.name || 'unknown'}`
            );
            log(
              `  Version: ${useColor ? chalk.cyan(m.metadata?.version || 'unknown') : m.metadata?.version || 'unknown'}`
            );
            log(
              `  Role: ${useColor ? chalk.cyan(m.spec?.role || 'unknown') : m.spec?.role || 'unknown'}`
            );
          } else if (m.agent) {
            log(`  ID: ${useColor ? chalk.cyan(m.agent.id) : m.agent.id}`);
            log(
              `  Name: ${useColor ? chalk.cyan(m.agent.name) : m.agent.name}`
            );
            log(
              `  Version: ${useColor ? chalk.cyan(m.agent.version) : m.agent.version}`
            );
            log(
              `  Role: ${useColor ? chalk.cyan(m.agent.role) : m.agent.role}`
            );
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
          log('\n⚠  Warnings (Best Practices):', chalk.yellow);
          result.warnings.forEach((warning) => {
            log(`  - ${warning}`, chalk.yellow);
          });
        }

        // Platform-specific validation
        const platforms = options.all
          ? ['kagent', 'langchain', 'crewai', 'docker', 'kubernetes']
          : options.platform
            ? [options.platform]
            : [];

        if (platforms.length > 0) {
          log('\nPlatform-specific validation:', chalk.blue);
          for (const platform of platforms) {
            try {
              await validateForPlatform(manifest, platform);
              log(`  ✓ ${platform} validation passed`, chalk.green);
            } catch (error) {
              if (!options.quiet) {
                const msg = `  ✗ ${platform} validation failed: ${error instanceof Error ? error.message : String(error)}`;
                console.error(useColor ? chalk.red(msg) : msg);
              }
            }
          }
        }

        process.exit(ExitCode.SUCCESS);
      } else {
        // Use the new error formatter for better error messages
        if (!options.quiet) {
          if (options.verbose) {
            // Detailed, helpful error messages with manifest context
            console.error(formatValidationErrors(result.errors, manifest));
          } else {
            // Compact error messages
            const errHeader = '\n✗ Validation Failed';
            console.error(useColor ? chalk.red.bold(errHeader) : errHeader);
            const errCount = `Found ${result.errors.length} error(s):\n`;
            console.error(useColor ? chalk.red(errCount) : errCount);
            result.errors.forEach((error, index) => {
              console.error(formatErrorCompact(error, index, manifest));
            });
            const hint = '\nUse --verbose for detailed error information';
            console.error(useColor ? chalk.gray(hint) : hint);
            const docs = '📚 Docs: https://openstandardagents.org/docs\n';
            console.error(useColor ? chalk.blue(docs) : docs);
          }
        }

        process.exit(ExitCode.GENERAL_ERROR);
      }
    } catch (error) {
      if (!options.quiet) {
        const errMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(useColor ? chalk.red(errMsg) : errMsg);

        if (options.verbose && error instanceof Error) {
          const stack = error.stack || '';
          console.error(useColor ? chalk.gray(stack) : stack);
        }
      }

      process.exit(ExitCode.GENERAL_ERROR);
    }
  }
);

async function validateForPlatform(
  manifest: OssaAgent,
  platform: string
): Promise<void> {
  switch (platform) {
    case 'kagent': {
      const validator = new KAgentValidator();
      const result = validator.validate(manifest);
      if (!result.valid) {
        throw new Error(result.errors.join('; '));
      }
      break;
    }

    case 'langchain':
    case 'crewai':
    case 'docker':
    case 'kubernetes':
      // Platform validators not yet implemented
      console.log(chalk.yellow(`  ${platform} validator not yet implemented`));
      break;

    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
