/**
 * OSSA Contract Command
 * Cross-agent contract testing and validation
 *
 * SOLID Principles:
 * - Uses shared manifest loading utilities (DRY)
 * - Uses shared output utilities (DRY)
 * - Single Responsibility: Only handles contract validation
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ContractValidator } from '../../services/validators/contract.validator.js';
import {
  outputJSON,
  loadManifestsByGlob,
  handleCommandError,
  printPatternInfo,
  exitNoManifestsFound,
} from '../utils/index.js';

/**
 * ossa contract validate <pattern>
 * Validate all agent contracts
 */
const validateContractsCommand = new Command('validate')
  .argument('<pattern>', 'Glob pattern for agent manifests (e.g., .gitlab/agents/**/*.ossa.yaml)')
  .option('-v, --verbose', 'Verbose output with detailed validation info')
  .option('--runtime-events <events...>', 'Runtime events to validate against (comma-separated)')
  .option(
    '--runtime-commands <commands...>',
    'Runtime commands to validate against (comma-separated)'
  )
  .description('Validate all agent contracts')
  .action(
    async (
      pattern: string,
      options: {
        verbose?: boolean;
        runtimeEvents?: string[];
        runtimeCommands?: string[];
      }
    ) => {
      try {
        console.log(chalk.blue(`\n[CHECK] Validating agent contracts...`));
        printPatternInfo(pattern, 0);

        // Load all manifests using shared utility
        const { loaded, errors } = await loadManifestsByGlob(pattern, { verbose: options.verbose });

        // Update count display
        console.log(chalk.gray(`Found ${loaded.length + errors.length} manifests\n`));

        if (loaded.length === 0) {
          exitNoManifestsFound('matching pattern');
        }

        const manifests = loaded.map((l) => l.manifest);

        // Validate contracts
        const validator = container.get(ContractValidator);
        const result = validator.validateAllContracts(manifests);

        // Output results
        if (result.valid) {
          console.log(chalk.green('\n[PASS] All agent contracts are valid!\n'));
          if (options.verbose) {
            console.log(chalk.gray(`Validated ${manifests.length} agents`));

            // Show contract summary
            let totalEvents = 0;
            let totalCommands = 0;
            let totalSubscriptions = 0;

            for (const manifest of manifests) {
              const messaging = manifest.spec?.messaging;
              if (messaging) {
                totalEvents += (messaging.publishes || []).length;
                totalCommands += (messaging.commands || []).length;
                totalSubscriptions += (messaging.subscribes || []).length;
              }
            }

            console.log(chalk.gray(`Total events published: ${totalEvents}`));
            console.log(chalk.gray(`Total commands exposed: ${totalCommands}`));
            console.log(chalk.gray(`Total subscriptions: ${totalSubscriptions}`));
          }

          if (result.warnings.length > 0) {
            console.log(chalk.yellow('\n[WARN]  Warnings:'));
            for (const warning of result.warnings) {
              console.log(chalk.yellow(`  - ${warning}`));
            }
            console.log();
          }

          process.exit(0);
        } else {
          console.log(chalk.red('\n[FAIL] Contract validation failed!\n'));

          // Group errors by type
          const errorsByType = new Map<string, any[]>();
          for (const error of result.errors) {
            if (!errorsByType.has(error.type)) {
              errorsByType.set(error.type, []);
            }
            errorsByType.get(error.type)!.push(error);
          }

          // Show missing events
          const missingEvents = errorsByType.get('missing_event') || [];
          if (missingEvents.length > 0) {
            console.log(chalk.yellow('[WARN]  Missing Events:'));
            for (const error of missingEvents) {
              console.log(chalk.red(`  ${error.agent}: ${error.message}`));
            }
            console.log();
          }

          // Show missing commands
          const missingCommands = errorsByType.get('missing_command') || [];
          if (missingCommands.length > 0) {
            console.log(chalk.yellow('[WARN]  Missing Commands:'));
            for (const error of missingCommands) {
              console.log(chalk.red(`  ${error.agent}: ${error.message}`));
            }
            console.log();
          }

          // Show schema mismatches
          const schemaMismatches = errorsByType.get('schema_mismatch') || [];
          if (schemaMismatches.length > 0) {
            console.log(chalk.yellow('[WARN]  Schema Mismatches:'));
            for (const error of schemaMismatches) {
              console.log(chalk.red(`  ${error.agent}: ${error.message}`));
              if (options.verbose && error.details) {
                console.log(chalk.gray(`    ${JSON.stringify(error.details, null, 2)}`));
              }
            }
            console.log();
          }

          // Show signature mismatches
          const signatureMismatches = errorsByType.get('signature_mismatch') || [];
          if (signatureMismatches.length > 0) {
            console.log(chalk.yellow('[WARN]  Signature Mismatches:'));
            for (const error of signatureMismatches) {
              console.log(chalk.red(`  ${error.agent}: ${error.message}`));
            }
            console.log();
          }

          // Show warnings
          if (result.warnings.length > 0) {
            console.log(chalk.yellow('[WARN]  Warnings:'));
            for (const warning of result.warnings) {
              console.log(chalk.yellow(`  - ${warning}`));
            }
            console.log();
          }

          process.exit(1);
        }
      } catch (error) {
        handleCommandError(error, { verbose: options.verbose });
      }
    }
  );

/**
 * ossa contract test <agent1> <agent2>
 * Test contract between two specific agents
 */
const testContractCommand = new Command('test')
  .argument('<consumer>', 'Path to consumer agent manifest')
  .argument('<provider>', 'Path to provider agent manifest')
  .option('-v, --verbose', 'Verbose output with detailed information')
  .description('Test contract compatibility between two agents')
  .action(async (consumerPath: string, providerPath: string, options: { verbose?: boolean }) => {
    try {
      console.log(chalk.blue('\n[CHECK] Testing contract between agents...\n'));

      // Load manifests
      const manifestRepo = container.get(ManifestRepository);
      const consumer = await manifestRepo.load(consumerPath);
      const provider = await manifestRepo.load(providerPath);

      const consumerName = consumer.metadata?.name || path.basename(consumerPath);
      const providerName = provider.metadata?.name || path.basename(providerPath);

      console.log(chalk.gray(`Consumer: ${consumerName}`));
      console.log(chalk.gray(`Provider: ${providerName}\n`));

      // Test contract
      const validator = container.get(ContractValidator);
      const result = validator.testContractBetweenAgents(consumer, provider);

      // Output results
      if (result.valid) {
        console.log(
          chalk.green(`[PASS] Contract between ${consumerName} and ${providerName} is valid!\n`)
        );

        if (options.verbose) {
          // Show what the consumer expects
          const consumerMessaging = consumer.spec?.messaging;
          if (consumerMessaging?.subscribes) {
            console.log(chalk.gray('Consumer subscriptions:'));
            for (const sub of consumerMessaging.subscribes) {
              console.log(chalk.cyan(`  - ${sub.channel}`));
            }
            console.log();
          }

          // Show what the provider publishes
          const providerMessaging = provider.spec?.messaging;
          if (providerMessaging?.publishes) {
            console.log(chalk.gray('Provider publications:'));
            for (const pub of providerMessaging.publishes) {
              console.log(chalk.cyan(`  - ${pub.channel}`));
            }
            console.log();
          }
        }

        if (result.warnings.length > 0) {
          console.log(chalk.yellow('[WARN]  Warnings:'));
          for (const warning of result.warnings) {
            console.log(chalk.yellow(`  - ${warning}`));
          }
          console.log();
        }

        process.exit(0);
      } else {
        console.log(chalk.red(`[FAIL] Contract incompatibility detected!\n`));

        for (const error of result.errors) {
          console.log(chalk.red(`  ${error.type}: ${error.message}`));
          if (options.verbose && error.details) {
            console.log(chalk.gray(`    ${JSON.stringify(error.details, null, 2)}`));
          }
        }
        console.log();

        if (result.warnings.length > 0) {
          console.log(chalk.yellow('[WARN]  Warnings:'));
          for (const warning of result.warnings) {
            console.log(chalk.yellow(`  - ${warning}`));
          }
          console.log();
        }

        process.exit(1);
      }
    } catch (error) {
      handleCommandError(error, { verbose: options.verbose });
    }
  });

/**
 * ossa contract breaking-changes <old-version> <new-version>
 * Detect breaking changes between two versions
 */
const breakingChangesCommand = new Command('breaking-changes')
  .argument('<old-version>', 'Path to old version manifest')
  .argument('<new-version>', 'Path to new version manifest')
  .option('-v, --verbose', 'Verbose output with detailed information')
  .option('-f, --format <format>', 'Output format: text, json', 'text')
  .description('Detect breaking changes between agent versions')
  .action(
    async (oldPath: string, newPath: string, options: { verbose?: boolean; format?: string }) => {
      try {
        console.log(chalk.blue('\n[CHECK] Detecting breaking changes...\n'));

        // Load manifests
        const manifestRepo = container.get(ManifestRepository);
        const oldManifest = await manifestRepo.load(oldPath);
        const newManifest = await manifestRepo.load(newPath);

        const agentName = oldManifest.metadata?.name || 'unknown';
        const oldVersion = oldManifest.metadata?.version || 'unknown';
        const newVersion = newManifest.metadata?.version || 'unknown';

        console.log(chalk.gray(`Agent: ${agentName}`));
        console.log(chalk.gray(`Old version: ${oldVersion}`));
        console.log(chalk.gray(`New version: ${newVersion}\n`));

        // Detect breaking changes
        const validator = container.get(ContractValidator);
        const result = validator.detectBreakingChanges(oldManifest, newManifest);

        // Output results
        if (options.format === 'json') {
          outputJSON(result);
          process.exit(result.hasBreakingChanges ? 1 : 0);
        }

        if (!result.hasBreakingChanges) {
          console.log(chalk.green('[PASS] No breaking changes detected!\n'));

          if (result.changes.length > 0) {
            console.log(chalk.blue(`Found ${result.changes.length} non-breaking change(s):`));
            for (const change of result.changes) {
              console.log(
                chalk.yellow(
                  `  [${change.severity.toUpperCase()}] ${change.type}: ${change.description}`
                )
              );
            }
            console.log();
          }

          process.exit(0);
        } else {
          console.log(chalk.red(`[FAIL] Breaking changes detected!\n`));
          console.log(chalk.red(`Total: ${result.summary.total} changes`));
          console.log(chalk.red(`Major (breaking): ${result.summary.major}`));
          console.log(chalk.yellow(`Minor (non-breaking): ${result.summary.minor}\n`));

          // Group by severity
          const majorChanges = result.changes.filter((c) => c.severity === 'major');
          const minorChanges = result.changes.filter((c) => c.severity === 'minor');

          if (majorChanges.length > 0) {
            console.log(chalk.red.bold('Major Breaking Changes:'));
            for (const change of majorChanges) {
              console.log(chalk.red(`  ${change.type}: ${change.description}`));
              console.log(chalk.gray(`    Resource: ${change.resource}`));
              if (options.verbose) {
                console.log(
                  chalk.gray(`    Old: ${change.oldVersion} → New: ${change.newVersion}`)
                );
              }
            }
            console.log();
          }

          if (minorChanges.length > 0) {
            console.log(chalk.yellow.bold('Minor Changes:'));
            for (const change of minorChanges) {
              console.log(chalk.yellow(`  ${change.type}: ${change.description}`));
              console.log(chalk.gray(`    Resource: ${change.resource}`));
            }
            console.log();
          }

          console.log(chalk.red('[TIP] Breaking changes may require:'));
          console.log(chalk.gray('  - Major version bump (semantic versioning)'));
          console.log(chalk.gray('  - Update all dependent agents'));
          console.log(chalk.gray('  - Migration guide for consumers\n'));

          process.exit(1);
        }
      } catch (error) {
        handleCommandError(error, { verbose: options.verbose });
      }
    }
  );

/**
 * ossa contract extract <path>
 * Extract and display agent contract
 */
const extractContractCommand = new Command('extract')
  .argument('<path>', 'Path to agent manifest')
  .option('-f, --format <format>', 'Output format: text, json', 'text')
  .description('Extract and display agent contract')
  .action(async (manifestPath: string, options: { format?: string }) => {
    try {
      // Load manifest
      const manifestRepo = container.get(ManifestRepository);
      const manifest = await manifestRepo.load(manifestPath);

      // Extract contract
      const validator = container.get(ContractValidator);
      const contract = validator.extractContract(manifest);

      // Output
      if (options.format === 'json') {
        outputJSON(contract);
      } else {
        console.log(chalk.blue(`\n[LIST] Contract for ${contract.name} v${contract.version}\n`));

        if (contract.publishes.length > 0) {
          console.log(chalk.yellow('Published Events:'));
          for (const event of contract.publishes) {
            console.log(chalk.cyan(`  - ${event.channel}`));
            if (event.description) {
              console.log(chalk.gray(`    ${event.description}`));
            }
            if (event.tags && event.tags.length > 0) {
              console.log(chalk.gray(`    Tags: ${event.tags.join(', ')}`));
            }
          }
          console.log();
        }

        if (contract.subscribes.length > 0) {
          console.log(chalk.yellow('Subscribed Channels:'));
          for (const sub of contract.subscribes) {
            console.log(chalk.cyan(`  - ${sub.channel}`));
            if (sub.description) {
              console.log(chalk.gray(`    ${sub.description}`));
            }
          }
          console.log();
        }

        if (contract.commands.length > 0) {
          console.log(chalk.yellow('Exposed Commands:'));
          for (const command of contract.commands) {
            console.log(chalk.cyan(`  - ${command.name}`));
            if (command.description) {
              console.log(chalk.gray(`    ${command.description}`));
            }
            if (command.async) {
              console.log(chalk.gray(`    Async: true`));
            }
            if (command.idempotent) {
              console.log(chalk.gray(`    Idempotent: true`));
            }
            if (command.timeoutSeconds) {
              console.log(chalk.gray(`    Timeout: ${command.timeoutSeconds}s`));
            }
          }
          console.log();
        }

        if (
          contract.publishes.length === 0 &&
          contract.subscribes.length === 0 &&
          contract.commands.length === 0
        ) {
          console.log(chalk.yellow('[WARN]  Agent has no messaging contract defined\n'));
        }
      }

      process.exit(0);
    } catch (error) {
      handleCommandError(error);
    }
  });

/**
 * Main contract command group
 */
export const contractCommand = new Command('contract')
  .description('Cross-agent contract testing and validation')
  .addCommand(validateContractsCommand)
  .addCommand(testContractCommand)
  .addCommand(breakingChangesCommand)
  .addCommand(extractContractCommand);
