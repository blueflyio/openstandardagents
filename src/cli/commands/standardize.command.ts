/**
 * OSSA Standardize Command
 *
 * Auto-fix standardization issues in OSSA manifests.
 *
 * Fixes:
 * - Hardcoded model names → environment variables
 * - Missing required fields
 * - Invalid field formats
 * - Naming convention violations
 *
 * DRY: Uses existing services (ValidationService, ManifestRepository)
 * SOLID: Single responsibility - only standardizes manifests
 *
 * @module commands/standardize.command
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { getApiVersion } from '../../utils/version.js';
import {
  getDefaultAgentVersion,
  getDefaultAgentKind,
  getDefaultAgentNameFallback,
  getDefaultRoleTemplate,
  getDefaultLLMProvider,
  getDNS1123Regex,
  getMaxDNS1123Length,
} from '../../config/defaults.js';
import { isOssaAgent, safeGet } from '../../utils/type-guards.js';
import {
  findManifestFilesFromPaths,
  handleCommandError,
  outputJSON,
  isJSONOutput,
} from '../utils/index.js';
import type { OssaAgent } from '../../types/index.js';

interface StandardizationFix {
  rule: string;
  message: string;
  path: string;
  oldValue?: any;
  newValue?: any;
  applied: boolean;
}

export const standardizeCommand = new Command('standardize')
  .description('Auto-fix standardization issues in OSSA manifests')
  .argument(
    '[paths...]',
    'Paths to manifests or directories (default: current directory)'
  )
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('--json', 'Output as JSON')
  .option('--fix-all', 'Apply all fixes automatically')
  .action(
    async (
      paths: string[] = [],
      options?: {
        dryRun?: boolean;
        json?: boolean;
        fixAll?: boolean;
      }
    ) => {
      try {
        const cwd = process.cwd();
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        // Find manifest files
        const searchPaths = paths.length > 0 ? paths : [cwd];
        const manifestFiles = await findManifestFilesFromPaths(searchPaths);

        if (manifestFiles.length === 0) {
          console.log(chalk.yellow('⚠ No OSSA manifests found'));
          process.exit(0);
        }

        console.log(
          chalk.blue(`Standardizing ${manifestFiles.length} manifest(s)...`)
        );
        if (options?.dryRun) {
          console.log(chalk.yellow('DRY RUN: No changes will be made'));
        }
        console.log(chalk.gray('─'.repeat(50)));

        const allFixes: Array<{
          file: string;
          fixes: StandardizationFix[];
        }> = [];

        for (const file of manifestFiles) {
          try {
            const loadedManifest = await manifestRepo.load(file);

            // Type guard validation before processing
            if (!isOssaAgent(loadedManifest)) {
              console.log(
                chalk.yellow(
                  `⚠ Skipping ${file}: Invalid OSSA manifest structure`
                )
              );
              continue;
            }

            const manifest = loadedManifest;
            const fixes: StandardizationFix[] = [];

            // Fix 1: Hardcoded model names
            const currentModel = safeGet<string>(
              manifest.spec?.llm,
              'model',
              (v): v is string => typeof v === 'string'
            );
            if (currentModel && !currentModel.includes('${')) {
              const oldModel = currentModel;

              // Create environment variable pattern for YAML
              // Template literal syntax: \${ escapes the $ so it becomes literal ${ in the string
              // The ${oldModel} part is interpolated, resulting in: ${LLM_MODEL:-gpt-4}
              // When saved via ManifestRepository.save(), the yaml library uses
              // defaultStringType: 'QUOTE_DOUBLE' which ensures strings containing special
              // characters ($, {, }, :) are automatically quoted in the YAML output.
              // Final YAML output: model: "${LLM_MODEL:-gpt-4}" (safely quoted)
              const newModel = `\${LLM_MODEL:-${oldModel}}`;

              // Verify the template literal produces the expected string format
              // This runtime validation ensures the pattern is correct before saving
              if (!newModel.startsWith('${') || !newModel.includes(':-')) {
                throw new Error(
                  `Failed to generate valid environment variable pattern: ${newModel}`
                );
              }

              fixes.push({
                rule: 'no-hardcoded-models',
                message: 'Replace hardcoded model with environment variable',
                path: 'spec.llm.model',
                oldValue: oldModel,
                newValue: newModel,
                applied: false,
              });

              if (!options?.dryRun) {
                // Set the model value - ManifestRepository.save() uses yaml.stringify with
                // defaultStringType: 'QUOTE_DOUBLE' to ensure proper YAML quoting
                // This guarantees that strings with special characters are quoted correctly
                if (!manifest.spec) {
                  const role =
                    safeGet<string>(
                      manifest.spec,
                      'role',
                      (v): v is string => typeof v === 'string'
                    ) ||
                    getDefaultRoleTemplate(
                      safeGet<string>(
                        manifest.metadata,
                        'name',
                        (v): v is string => typeof v === 'string'
                      ) || 'agent'
                    );
                  manifest.spec = { role };
                }
                if (
                  !manifest.spec.llm ||
                  typeof manifest.spec.llm !== 'object'
                ) {
                  const provider =
                    safeGet<string>(
                      manifest.spec.llm,
                      'provider',
                      (v): v is string => typeof v === 'string'
                    ) || getDefaultLLMProvider();
                  manifest.spec.llm = { provider, model: newModel };
                } else {
                  manifest.spec.llm.model = newModel;
                }
                fixes[fixes.length - 1].applied = true;
              }
            }

            // Fix 2: Missing apiVersion
            const currentApiVersion = safeGet<string>(
              manifest,
              'apiVersion',
              (v): v is string => typeof v === 'string'
            );
            if (!currentApiVersion) {
              const newApiVersion = getApiVersion();
              fixes.push({
                rule: 'missing-apiVersion',
                message: 'Add apiVersion field',
                path: 'apiVersion',
                oldValue: undefined,
                newValue: newApiVersion,
                applied: false,
              });

              if (!options?.dryRun) {
                // Type-safe assignment - apiVersion is optional in OssaAgent interface but required in practice
                // We're adding it, so we can safely assign
                Object.assign(manifest, { apiVersion: newApiVersion });
                fixes[fixes.length - 1].applied = true;
              }
            }

            // Fix 3: Missing kind
            const currentKind = safeGet<string>(
              manifest,
              'kind',
              (v): v is string => typeof v === 'string'
            );
            if (!currentKind) {
              const defaultKind = getDefaultAgentKind();
              fixes.push({
                rule: 'missing-kind',
                message: 'Add kind field',
                path: 'kind',
                oldValue: undefined,
                newValue: defaultKind,
                applied: false,
              });

              if (!options?.dryRun) {
                // Type-safe assignment - kind is optional in OssaAgent interface but required in practice
                // We're adding it, so we can safely assign
                Object.assign(manifest, { kind: defaultKind });
                fixes[fixes.length - 1].applied = true;
              }
            }

            // Fix 4: Missing metadata.version
            const currentVersion = safeGet<string>(
              manifest.metadata,
              'version',
              (v): v is string => typeof v === 'string'
            );
            if (!currentVersion) {
              const defaultVersion = getDefaultAgentVersion();
              fixes.push({
                rule: 'missing-version',
                message: 'Add metadata.version field',
                path: 'metadata.version',
                oldValue: undefined,
                newValue: defaultVersion,
                applied: false,
              });

              if (!options?.dryRun) {
                // Ensure metadata exists and is an object
                if (
                  !manifest.metadata ||
                  typeof manifest.metadata !== 'object'
                ) {
                  const existingName =
                    safeGet<string>(
                      manifest.metadata,
                      'name',
                      (v): v is string => typeof v === 'string'
                    ) || '';
                  Object.assign(manifest, { metadata: { name: existingName } });
                }

                // Type-safe assignment - metadata is guaranteed to exist and be an object at this point
                if (
                  manifest.metadata &&
                  typeof manifest.metadata === 'object'
                ) {
                  Object.assign(manifest.metadata, { version: defaultVersion });
                }
                fixes[fixes.length - 1].applied = true;
              }
            }

            // Fix 5: Invalid agent name format (DNS-1123)
            if (
              manifest.metadata?.name &&
              !getDNS1123Regex().test(manifest.metadata.name)
            ) {
              const oldName = manifest.metadata.name;
              const maxLength = getMaxDNS1123Length();
              let newName = oldName
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, maxLength);

              // Ensure name doesn't start or end with hyphen after substring
              newName = newName.replace(/^-+|-+$/g, '');

              // Ensure name is not empty
              if (!newName) {
                newName = getDefaultAgentNameFallback();
              }

              fixes.push({
                rule: 'invalid-name-format',
                message: 'Fix agent name to DNS-1123 format',
                path: 'metadata.name',
                oldValue: oldName,
                newValue: newName,
                applied: false,
              });

              if (!options?.dryRun) {
                manifest.metadata.name = newName;
                fixes[fixes.length - 1].applied = true;
              }
            }

            // Fix 6: Missing spec.role
            const currentRole = safeGet<string>(
              manifest.spec,
              'role',
              (v): v is string => typeof v === 'string'
            );
            if (!currentRole) {
              const agentName = safeGet<string>(
                manifest.metadata,
                'name',
                (v): v is string => typeof v === 'string'
              );
              const defaultRole = getDefaultRoleTemplate(agentName);

              fixes.push({
                rule: 'missing-role',
                message: 'Add spec.role field',
                path: 'spec.role',
                oldValue: undefined,
                newValue: defaultRole,
                applied: false,
              });

              if (!options?.dryRun) {
                // Ensure spec exists and is an object
                if (!manifest.spec || typeof manifest.spec !== 'object') {
                  manifest.spec = { role: defaultRole };
                } else {
                  manifest.spec.role = defaultRole;
                }
                fixes[fixes.length - 1].applied = true;
              }
            }

            // Save manifest if fixes were applied
            if (fixes.length > 0) {
              allFixes.push({ file, fixes });

              if (!options?.dryRun) {
                await manifestRepo.save(file, manifest);
              }
            }
          } catch (error: any) {
            console.log(
              chalk.red(`✗ Failed to process ${file}: ${error.message}`)
            );
          }
        }

        // Output results
        if (
          options?.json ||
          isJSONOutput({ output: options?.json ? 'json' : 'text' })
        ) {
          outputJSON({
            standardized: allFixes.length,
            total: manifestFiles.length,
            fixes: allFixes,
            dryRun: options?.dryRun || false,
          });
          process.exit(0);
        }

        // Display results
        if (allFixes.length === 0) {
          console.log(
            chalk.green('\n✓ All manifests are already standardized')
          );
          process.exit(0);
        }

        console.log('');
        for (const { file, fixes } of allFixes) {
          console.log(chalk.cyan(`\n${file}`));
          for (const fix of fixes) {
            const icon = fix.applied ? chalk.green('✓') : chalk.yellow('○');
            console.log(`  ${icon} ${fix.rule}: ${fix.message}`);
            if (fix.oldValue !== undefined) {
              console.log(chalk.gray(`    Old: ${fix.oldValue}`));
            }
            if (fix.newValue !== undefined) {
              console.log(chalk.gray(`    New: ${fix.newValue}`));
            }
          }
        }

        console.log('');
        const totalFixes = allFixes.reduce((sum, f) => sum + f.fixes.length, 0);
        const appliedFixes = allFixes.reduce(
          (sum, f) => sum + f.fixes.filter((fix) => fix.applied).length,
          0
        );

        if (options?.dryRun) {
          console.log(
            chalk.yellow(
              `Would apply ${totalFixes} fix(es) to ${allFixes.length} manifest(s)`
            )
          );
          console.log(chalk.gray('  Run without --dry-run to apply fixes'));
        } else {
          console.log(
            chalk.green(
              `✓ Applied ${appliedFixes} fix(es) to ${allFixes.length} manifest(s)`
            )
          );
        }

        process.exit(0);
      } catch (error) {
        handleCommandError(error);
      }
    }
  );
