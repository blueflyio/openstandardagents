/**
 * OSSA Conformance Command
 * Test agent manifests against conformance profiles
 *
 * SOLID Principles:
 * - Uses shared output utilities (DRY)
 * - Single Responsibility: Only manages conformance testing
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ConformanceService } from '../../services/conformance/conformance.service.js';
import { isJSONOutput, outputJSON } from '../utils/index.js';
import type { OssaAgent } from '../../types/index.js';
import type {
  ConformanceResult,
  ConformanceReport,
} from '../../services/conformance/types.js';

/**
 * Main conformance command group
 */
export const conformanceCommand = new Command('conformance')
  .description('Test agent manifests against conformance profiles')
  .addCommand(conformanceRunCommand())
  .addCommand(conformanceListCommand())
  .addCommand(conformanceProfileCommand());

/**
 * Run conformance test
 */
function conformanceRunCommand(): Command {
  return new Command('run')
    .argument('<manifest>', 'Path to OSSA agent manifest (YAML or JSON)')
    .option(
      '-p, --profile <name>',
      'Conformance profile to test against',
      'baseline'
    )
    .option('--strict', 'Fail if manifest has validation errors', false)
    .option('-v, --verbose', 'Show detailed test results', false)
    .option('--output <format>', 'Output format (json|text)', 'text')
    .description('Run conformance test against a profile')
    .action(
      async (
        manifestPath: string,
        options: {
          profile: string;
          strict: boolean;
          verbose: boolean;
          output: string;
        }
      ) => {
        try {
          // Get services from DI container
          const manifestRepo = container.get(ManifestRepository);
          const conformanceService = container.get(ConformanceService);

          // Check if profile exists
          if (!conformanceService.hasProfile(options.profile)) {
            console.error(chalk.red(`✗ Profile not found: ${options.profile}`));
            console.error(chalk.gray('\nAvailable profiles:'));
            const profiles = conformanceService.listProfiles();
            profiles.forEach((p) => {
              console.error(chalk.gray(`  - ${p.id}: ${p.name}`));
            });
            process.exit(1);
          }

          // Load manifest
          if (!isJSONOutput(options)) {
            console.log(chalk.blue(`Loading manifest: ${manifestPath}`));
            console.log(
              chalk.blue(`Testing against profile: ${options.profile}`)
            );
          }

          const manifest = (await manifestRepo.load(manifestPath)) as OssaAgent;

          // Run conformance test
          const report = await conformanceService.generateReport(
            manifest,
            options.profile,
            options.strict
          );

          // Output results
          if (isJSONOutput(options)) {
            outputJSON(report);
            process.exit(report.summary.passed ? 0 : 1);
          }

          // Text output
          printConformanceReport(report, options.verbose);

          process.exit(report.summary.passed ? 0 : 1);
        } catch (error) {
          console.error(
            chalk.red('Error:'),
            error instanceof Error ? error.message : String(error)
          );
          process.exit(1);
        }
      }
    );
}

/**
 * List available conformance profiles
 */
function conformanceListCommand(): Command {
  return new Command('list')
    .option('--output <format>', 'Output format (json|text)', 'text')
    .description('List available conformance profiles')
    .action(async (options: { output: string }) => {
      try {
        const conformanceService = container.get(ConformanceService);
        const profiles = conformanceService.listProfiles();

        if (isJSONOutput(options)) {
          outputJSON({ profiles });
          return;
        }

        console.log(chalk.bold('\nAvailable Conformance Profiles:\n'));
        profiles.forEach((profile) => {
          console.log(chalk.cyan(`  ${profile.id}`));
          console.log(chalk.white(`    ${profile.name}`));
          console.log(chalk.gray(`    ${profile.description}`));
          console.log();
        });
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}

/**
 * Show profile details
 */
function conformanceProfileCommand(): Command {
  return new Command('profile')
    .argument('<name>', 'Profile name to show details for')
    .option('--output <format>', 'Output format (json|text)', 'text')
    .description('Show details for a specific conformance profile')
    .action(async (name: string, options: { output: string }) => {
      try {
        const conformanceService = container.get(ConformanceService);

        if (!conformanceService.hasProfile(name)) {
          console.error(chalk.red(`✗ Profile not found: ${name}`));
          process.exit(1);
        }

        const profile = conformanceService.getProfile(name);

        if (isJSONOutput(options)) {
          outputJSON(profile);
          return;
        }

        console.log(chalk.bold(`\n${profile.name}\n`));
        console.log(chalk.gray(`ID: ${profile.id}`));
        console.log(chalk.gray(`Version: ${profile.version}`));
        console.log(chalk.gray(`Description: ${profile.description}`));

        if (profile.extends) {
          console.log(chalk.gray(`Extends: ${profile.extends}`));
        }

        console.log(chalk.bold('\nRequired Features:'));
        console.log(chalk.gray(`  Weight: ${profile.required.weight * 100}%`));
        profile.required.features.forEach((feature) => {
          console.log(chalk.white(`  - ${feature}`));
        });

        console.log(chalk.bold('\nOptional Features:'));
        console.log(chalk.gray(`  Weight: ${profile.optional.weight * 100}%`));
        profile.optional.features.forEach((feature) => {
          console.log(chalk.white(`  - ${feature}`));
        });

        console.log(chalk.bold('\nScoring:'));
        console.log(
          chalk.gray(
            `  Pass Threshold: ${profile.scoring.pass_threshold * 100}%`
          )
        );
        console.log(
          chalk.gray(
            `  Warn Threshold: ${profile.scoring.warn_threshold * 100}%`
          )
        );

        if (profile.constraints) {
          console.log(chalk.bold('\nConstraints:'));
          Object.entries(profile.constraints).forEach(
            ([feature, constraint]) => {
              console.log(chalk.white(`  ${feature}:`));
              console.log(chalk.gray(`    ${constraint.description}`));
            }
          );
        }

        console.log();
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}

/**
 * Print conformance report to console
 */
function printConformanceReport(
  report: ConformanceReport,
  verbose: boolean
): void {
  console.log();
  console.log(chalk.bold('═'.repeat(70)));
  console.log(chalk.bold.cyan('  OSSA CONFORMANCE TEST REPORT'));
  console.log(chalk.bold('═'.repeat(70)));
  console.log();

  // Summary
  console.log(chalk.bold('Summary:'));
  console.log(chalk.gray(`  Profile: ${report.summary.profile}`));
  console.log(chalk.gray(`  Manifest: ${report.manifest.name}`));
  console.log(chalk.gray(`  API Version: ${report.manifest.apiVersion}`));
  console.log(chalk.gray(`  Kind: ${report.manifest.kind}`));
  console.log();

  // Score
  const scoreColor = report.summary.passed
    ? chalk.green
    : report.results.score >= report.summary.threshold * 0.8
      ? chalk.yellow
      : chalk.red;

  console.log(chalk.bold('Score:'));
  console.log(
    scoreColor(
      `  ${(report.results.score * 100).toFixed(1)}% (threshold: ${(report.summary.threshold * 100).toFixed(0)}%)`
    )
  );
  console.log();

  // Result
  if (report.summary.passed) {
    console.log(chalk.green.bold('✓ PASSED'));
  } else {
    console.log(chalk.red.bold('✗ FAILED'));
  }
  console.log();

  // Details
  console.log(chalk.bold('Details:'));
  console.log(chalk.white('  Required Features:'));
  console.log(
    chalk.gray(
      `    ${report.results.details.required.present}/${report.results.details.required.total} present (${(report.results.details.required.score * 100).toFixed(1)}%)`
    )
  );

  if (report.results.details.required.missing.length > 0 && verbose) {
    console.log(chalk.red('    Missing:'));
    report.results.details.required.missing.forEach((feature) => {
      console.log(chalk.red(`      - ${feature}`));
    });
  }

  console.log(chalk.white('  Optional Features:'));
  console.log(
    chalk.gray(
      `    ${report.results.details.optional.present}/${report.results.details.optional.total} present (${(report.results.details.optional.score * 100).toFixed(1)}%)`
    )
  );

  if (report.results.details.optional.missing.length > 0 && verbose) {
    console.log(chalk.yellow('    Missing:'));
    report.results.details.optional.missing.forEach((feature) => {
      console.log(chalk.yellow(`      - ${feature}`));
    });
  }

  console.log();

  // Constraint violations
  if (report.results.constraintViolations.length > 0) {
    console.log(chalk.red.bold('Constraint Violations:'));
    report.results.constraintViolations.forEach((violation) => {
      console.log(chalk.red(`  ✗ ${violation.message}`));
      if (verbose) {
        console.log(chalk.gray(`    Feature: ${violation.feature}`));
        console.log(
          chalk.gray(`    Expected: ${JSON.stringify(violation.expected)}`)
        );
        console.log(
          chalk.gray(`    Actual: ${JSON.stringify(violation.actual)}`)
        );
      }
    });
    console.log();
  }

  // Recommendations
  if (report.results.recommendations.length > 0) {
    console.log(chalk.yellow.bold('Recommendations:'));
    report.results.recommendations.forEach((rec) => {
      console.log(chalk.yellow(`  • ${rec}`));
    });
    console.log();
  }

  console.log(chalk.bold('═'.repeat(70)));
  console.log();
}
