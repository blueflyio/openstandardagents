/**
 * OSSA Compliance Command
 * 
 * Check compliance badges and standards adherence.
 * 
 * Checks:
 * - OSSA schema compliance
 * - Best practices compliance
 * - Security compliance
 * - Documentation compliance
 * 
 * DRY: Uses existing services (ValidationService)
 * SOLID: Single responsibility - only checks compliance
 * 
 * @module commands/compliance.command
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import {
  findManifestFilesFromPaths,
  handleCommandError,
  outputJSON,
  isJSONOutput,
} from '../utils/index.js';
import type { OssaAgent } from '../../types/index.js';

interface ComplianceBadge {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  criteria: string[];
}

export const complianceCommand = new Command('compliance')
  .description('Check compliance badges and standards adherence')
  .argument('[paths...]', 'Paths to manifests or directories (default: current directory)')
  .option('--json', 'Output as JSON')
  .option('--badge <name>', 'Check specific badge (ossa, security, docs, practices)')
  .action(async (paths: string[] = [], options?: {
    json?: boolean;
    badge?: string;
  }) => {
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

      console.log(chalk.blue(`Checking compliance for ${manifestFiles.length} manifest(s)...`));
      console.log(chalk.gray('─'.repeat(50)));

      const allResults: Array<{
        file: string;
        badges: ComplianceBadge[];
      }> = [];

      for (const file of manifestFiles) {
        try {
          const manifest = await manifestRepo.load(file);
          const badges: ComplianceBadge[] = [];

          // Badge 1: OSSA Schema Compliance
          if (!options?.badge || options.badge === 'ossa') {
            const validation = await validationService.validate(manifest);
            badges.push({
              name: 'OSSA Schema',
              status: validation.valid ? 'pass' : 'fail',
              message: validation.valid
                ? 'Manifest is OSSA schema compliant'
                : `Schema validation failed: ${validation.errors.length} error(s)`,
              criteria: [
                'Valid apiVersion',
                'Valid kind',
                'Valid metadata structure',
                'Valid spec structure',
              ],
            });
          }

          // Badge 2: Security Compliance
          if (!options?.badge || options.badge === 'security') {
            const securityIssues: string[] = [];
            let securityStatus: 'pass' | 'fail' | 'warning' = 'pass';

            // Check for hardcoded secrets
            if (manifest.spec?.llm?.model && !manifest.spec.llm.model.includes('${')) {
              securityIssues.push('Hardcoded model name (should use environment variable)');
              securityStatus = 'warning';
            }

            // Check for API keys in tools
            if (manifest.spec?.tools) {
              for (const tool of manifest.spec.tools) {
                if (tool && typeof tool === 'object' && 'auth' in tool && 
                    (tool as any).auth?.apiKey && typeof (tool as any).auth.apiKey === 'string') {
                  securityIssues.push('Hardcoded API key in tool configuration');
                  securityStatus = 'fail';
                }
              }
            }

            badges.push({
              name: 'Security',
              status: securityStatus,
              message: securityIssues.length === 0
                ? 'No security issues found'
                : securityIssues.join('; '),
              criteria: [
                'No hardcoded secrets',
                'Environment variables for sensitive data',
                'Secure tool authentication',
              ],
            });
          }

          // Badge 3: Documentation Compliance
          if (!options?.badge || options.badge === 'docs') {
            const docIssues: string[] = [];
            let docStatus: 'pass' | 'fail' | 'warning' = 'pass';

            if (!manifest.metadata?.description) {
              docIssues.push('Missing description');
              docStatus = 'warning';
            }

            if (manifest.spec?.tools && manifest.spec.tools.length > 0) {
              for (const tool of manifest.spec.tools) {
                if (tool && typeof tool === 'object' && !(tool as any).description) {
                  docIssues.push(`Tool ${(tool as any).name || 'unnamed'} missing description`);
                  docStatus = 'warning';
                }
              }
            }

            badges.push({
              name: 'Documentation',
              status: docStatus,
              message: docIssues.length === 0
                ? 'Documentation is complete'
                : docIssues.join('; '),
              criteria: [
                'Has description',
                'Tools have descriptions',
                'Clear agent purpose',
              ],
            });
          }

          // Badge 4: Best Practices Compliance
          if (!options?.badge || options.badge === 'practices') {
            const practiceIssues: string[] = [];
            let practiceStatus: 'pass' | 'fail' | 'warning' = 'pass';

            // Check DNS-1123 name format
            if (manifest.metadata?.name && !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(manifest.metadata.name)) {
              practiceIssues.push('Agent name not DNS-1123 compliant');
              practiceStatus = 'warning';
            }

            // Check version format
            if (manifest.metadata?.version && !/^\d+\.\d+\.\d+/.test(manifest.metadata.version)) {
              practiceIssues.push('Version not semantic versioning');
              practiceStatus = 'warning';
            }

            // Check for required role
            if (!manifest.spec?.role) {
              practiceIssues.push('Missing spec.role');
              practiceStatus = 'fail';
            }

            badges.push({
              name: 'Best Practices',
              status: practiceStatus,
              message: practiceIssues.length === 0
                ? 'Follows best practices'
                : practiceIssues.join('; '),
              criteria: [
                'DNS-1123 compliant name',
                'Semantic versioning',
                'Has role definition',
                'Uses environment variables',
              ],
            });
          }

          allResults.push({ file, badges });
        } catch (error: any) {
          console.log(chalk.red(`✗ Failed to check ${file}: ${error.message}`));
        }
      }

      // Output results
      if (options?.json || isJSONOutput(options)) {
        outputJSON({
          checked: allResults.length,
          total: manifestFiles.length,
          results: allResults,
        });
        process.exit(0);
      }

      // Display results
      for (const { file, badges } of allResults) {
        console.log(chalk.cyan(`\n${file}`));
        for (const badge of badges) {
          const icon =
            badge.status === 'pass' ? chalk.green('✓') :
            badge.status === 'fail' ? chalk.red('✗') :
            chalk.yellow('⚠');

          console.log(`  ${icon} ${badge.name}: ${badge.message}`);
        }
      }

      // Summary
      console.log('');
      const totalBadges = allResults.reduce((sum, r) => sum + r.badges.length, 0);
      const passedBadges = allResults.reduce((sum, r) => sum + r.badges.filter(b => b.status === 'pass').length, 0);
      const failedBadges = allResults.reduce((sum, r) => sum + r.badges.filter(b => b.status === 'fail').length, 0);
      const warningBadges = allResults.reduce((sum, r) => sum + r.badges.filter(b => b.status === 'warning').length, 0);

      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.blue('Compliance Summary:'));
      console.log(chalk.green(`  ✓ Passed: ${passedBadges}`));
      if (failedBadges > 0) {
        console.log(chalk.red(`  ✗ Failed: ${failedBadges}`));
      }
      if (warningBadges > 0) {
        console.log(chalk.yellow(`  ⚠ Warnings: ${warningBadges}`));
      }
      console.log(chalk.gray(`  Total: ${totalBadges}`));

      process.exit(failedBadges > 0 ? 1 : 0);
    } catch (error) {
      handleCommandError(error);
    }
  });
