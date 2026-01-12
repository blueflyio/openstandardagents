/**
 * OSSA Lint Command
 * Lint OSSA agent manifests against best practices
 *
 * SOLID Principles:
 * - Uses shared output utilities (DRY)
 * - Uses shared manifest loading utilities (DRY)
 * - Single Responsibility: Only handles linting
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import type { OssaAgent } from '../../types/index.js';
import {
  outputJSON,
  findManifestFilesFromPaths,
  handleCommandError,
} from '../utils/index.js';

interface LintRule {
  id: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  check: (manifest: OssaAgent) => LintIssue[];
}

interface LintIssue {
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  path?: string;
  fix?: string;
}

const lintRules: LintRule[] = [
  {
    id: 'no-hardcoded-models',
    name: 'No hardcoded model names',
    severity: 'error',
    check: (manifest: OssaAgent) => {
      const issues: LintIssue[] = [];
      if (manifest.spec?.llm?.model && !manifest.spec.llm.model.includes('${')) {
        issues.push({
          rule: 'no-hardcoded-models',
          message: 'Model name should use environment variable (e.g., ${LLM_MODEL:-gpt-4})',
          severity: 'error',
          path: 'spec.llm.model',
          fix: `Replace with: \${LLM_MODEL:-${manifest.spec.llm.model}}`,
        });
      }
      return issues;
    },
  },
  {
    id: 'required-fields',
    name: 'Required fields present',
    severity: 'error',
    check: (manifest: OssaAgent) => {
      const issues: LintIssue[] = [];
      if (!manifest.metadata?.name) {
        issues.push({
          rule: 'required-fields',
          message: 'Missing required field: metadata.name',
          severity: 'error',
          path: 'metadata.name',
        });
      }
      if (!manifest.metadata?.version) {
        issues.push({
          rule: 'required-fields',
          message: 'Missing required field: metadata.version',
          severity: 'error',
          path: 'metadata.version',
        });
      }
      if (!manifest.spec?.role) {
        issues.push({
          rule: 'required-fields',
          message: 'Missing required field: spec.role',
          severity: 'error',
          path: 'spec.role',
        });
      }
      return issues;
    },
  },
  {
    id: 'capability-schemas',
    name: 'Capability input/output schemas defined',
    severity: 'warning',
    check: (manifest: OssaAgent) => {
      const issues: LintIssue[] = [];
      // Check legacy format capabilities
      if (manifest.agent?.capabilities) {
        manifest.agent.capabilities.forEach((cap: any, idx: number) => {
          if (!cap.input_schema && !cap.input?.schema) {
            issues.push({
              rule: 'capability-schemas',
              message: `Capability "${cap.name || idx}" missing input schema`,
              severity: 'warning',
              path: `agent.capabilities[${idx}].input_schema`,
            });
          }
          if (!cap.output_schema && !cap.output?.schema) {
            issues.push({
              rule: 'capability-schemas',
              message: `Capability "${cap.name || idx}" missing output schema`,
              severity: 'warning',
              path: `agent.capabilities[${idx}].output_schema`,
            });
          }
        });
      }
      return issues;
    },
  },
  {
    id: 'observability',
    name: 'Observability enabled',
    severity: 'info',
    check: (manifest: OssaAgent) => {
      const issues: LintIssue[] = [];
      const obs = manifest.spec?.observability;
      if (!obs || (!obs.tracing?.enabled && !obs.metrics?.enabled)) {
        issues.push({
          rule: 'observability',
          message: 'Observability (tracing/metrics) not explicitly enabled',
          severity: 'info',
          path: 'spec.observability',
        });
      }
      return issues;
    },
  },
  {
    id: 'cost-constraints',
    name: 'Cost constraints for production agents',
    severity: 'warning',
    check: (manifest: OssaAgent) => {
      const issues: LintIssue[] = [];
      const labels = manifest.metadata?.labels || {};
      const isProduction = Object.values(labels).some((v: unknown) => 
        typeof v === 'string' && v.toLowerCase().includes('production')
      );
      if (isProduction && !manifest.spec?.constraints?.cost) {
        issues.push({
          rule: 'cost-constraints',
          message: 'Production agent should have cost constraints configured',
          severity: 'warning',
          path: 'spec.constraints.cost',
        });
      }
      return issues;
    },
  },
];

export const lintCommand = new Command('lint')
  .argument('[paths...]', 'Paths to OSSA manifests (default: current directory)')
  .option('--fix', 'Auto-fix issues where possible')
  .option('--rule <rule>', 'Run specific rule only')
  .option('--format <format>', 'Output format (default, json, sarif)', 'default')
  .option('-o, --output <file>', 'Output file (for json/sarif formats)')
  .option('--max-warnings <number>', 'Maximum warnings before exit with error', '0')
  .description('Lint OSSA agent manifests against best practices')
  .action(
    async (
      paths: string[],
      options: {
        fix?: boolean;
        rule?: string;
        format?: string;
        output?: string;
        maxWarnings?: string;
      }
    ) => {
      try {
        const manifestRepo = container.get(ManifestRepository);
        const maxWarnings = parseInt(options.maxWarnings || '0', 10);

        // Determine files to lint (using shared utility)
        const filesToLint = findManifestFilesFromPaths(paths);

        if (filesToLint.length === 0) {
          console.log(chalk.yellow('No OSSA manifest files found'));
          process.exit(0);
        }

        // Filter rules if specific rule requested
        const rulesToRun = options.rule
          ? lintRules.filter((r) => r.id === options.rule)
          : lintRules;

        if (rulesToRun.length === 0) {
          console.error(chalk.red(`Unknown rule: ${options.rule}`));
          console.log(chalk.blue('Available rules:'));
          lintRules.forEach((r) => {
            console.log(`  - ${r.id}: ${r.name}`);
          });
          process.exit(1);
        }

        // Lint all files
        const allIssues: Array<LintIssue & { file: string }> = [];
        for (const file of filesToLint) {
          try {
            const manifest = await manifestRepo.load(file);
            for (const rule of rulesToRun) {
              const issues = rule.check(manifest);
              allIssues.push(
                ...issues.map((issue) => ({
                  ...issue,
                  file,
                }))
              );
            }
          } catch (error: any) {
            allIssues.push({
              rule: 'parse-error',
              message: `Failed to parse manifest: ${error.message}`,
              severity: 'error',
              file,
            });
          }
        }

        // Count issues by severity
        const errors = allIssues.filter((i) => i.severity === 'error');
        const warnings = allIssues.filter((i) => i.severity === 'warning');
        const infos = allIssues.filter((i) => i.severity === 'info');

        // Output results
        if (options.format === 'json') {
          const output = {
            files: filesToLint.length,
            issues: allIssues.length,
            errors: errors.length,
            warnings: warnings.length,
            infos: infos.length,
            results: allIssues,
          };
          if (options.output) {
            fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
            console.log(chalk.green(`Results written to ${options.output}`));
          } else {
            outputJSON(output);
          }
        } else if (options.format === 'sarif') {
          // SARIF format for CI integration
          const sarif = {
            version: '2.1.0',
            $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
            runs: [
              {
                tool: {
                  driver: {
                    name: 'OSSA Lint',
                    version: '0.3.0',
                  },
                },
                results: allIssues.map((issue) => ({
                  ruleId: issue.rule,
                  level: issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'note',
                  message: {
                    text: issue.message,
                  },
                  locations: [
                    {
                      physicalLocation: {
                        artifactLocation: {
                          uri: issue.file,
                        },
                      },
                    },
                  ],
                })),
              },
            ],
          };
          if (options.output) {
            fs.writeFileSync(options.output, JSON.stringify(sarif, null, 2));
            console.log(chalk.green(`SARIF results written to ${options.output}`));
          } else {
            outputJSON(sarif);
          }
        } else {
          // Default format
          console.log(chalk.blue(`\nLinting ${filesToLint.length} file(s)...\n`));

          if (allIssues.length === 0) {
            console.log(chalk.green('No linting issues found!'));
          } else {
            // Group by file
            const byFile = new Map<string, LintIssue[]>();
            for (const issue of allIssues) {
              if (!byFile.has(issue.file)) {
                byFile.set(issue.file, []);
              }
              byFile.get(issue.file)!.push(issue);
            }

            for (const [file, issues] of byFile) {
              console.log(chalk.cyan(`\n${file}:`));
              for (const issue of issues) {
                const color =
                  issue.severity === 'error'
                    ? chalk.red
                    : issue.severity === 'warning'
                      ? chalk.yellow
                      : chalk.blue;
                const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
                console.log(
                  color(`  ${icon} [${issue.rule}] ${issue.message}`) +
                    (issue.path ? chalk.gray(` (${issue.path})`) : '') +
                    (issue.fix ? chalk.gray(`\n      Fix: ${issue.fix}`) : '')
                );
              }
            }

            console.log(chalk.blue(`\nSummary:`));
            console.log(`  Errors: ${errors.length}`);
            console.log(`  Warnings: ${warnings.length}`);
            console.log(`  Info: ${infos.length}`);
          }
        }

        // Exit with appropriate code
        if (errors.length > 0) {
          process.exit(1);
        }
        if (warnings.length > maxWarnings) {
          process.exit(1);
        }
        process.exit(0);
      } catch (error) {
        handleCommandError(error);
      }
    }
  );
