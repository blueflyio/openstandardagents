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
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import {
  getDNS1123Regex,
  getSemanticVersionRegex,
} from '../../config/defaults.js';
import {
  isOssaAgent,
  isToolWithAuth,
  isToolWithDescription,
  safeGet,
  safeGetArray,
} from '../../utils/type-guards.js';
import {
  findManifestFilesFromPaths,
  handleCommandError,
  outputJSON,
  isJSONOutput,
} from '../utils/index.js';

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
          const loadedManifest = await manifestRepo.load(file);
          
          // Type guard validation before processing
          if (!isOssaAgent(loadedManifest)) {
            console.log(chalk.yellow(`⚠ Skipping ${file}: Invalid OSSA manifest structure`));
            continue;
          }

          const manifest = loadedManifest;
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
            const model = safeGet<string>(manifest.spec?.llm, 'model', (v): v is string => typeof v === 'string');
            if (model && !model.includes('${')) {
              securityIssues.push('Hardcoded model name (should use environment variable)');
              securityStatus = 'warning';
            }

            // Check for API keys in tools
            const tools = safeGetArray(manifest.spec?.tools, isToolWithAuth);
            for (const tool of tools) {
              const apiKey = safeGet<string>(tool.auth, 'apiKey', (v): v is string => typeof v === 'string');
              if (apiKey) {
                securityIssues.push('Hardcoded API key in tool configuration');
                securityStatus = 'fail';
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

            const description = safeGet<string>(manifest.metadata, 'description', (v): v is string => typeof v === 'string');
            if (!description) {
              docIssues.push('Missing description');
              docStatus = 'warning';
            }

            const tools = safeGetArray(manifest.spec?.tools, isToolWithDescription);
            for (const tool of tools) {
              const description = safeGet<string>(tool, 'description', (v): v is string => typeof v === 'string');
              if (!description) {
                const toolName = safeGet<string>(tool, 'name', (v): v is string => typeof v === 'string') || 'unnamed';
                docIssues.push(`Tool ${toolName} missing description`);
                docStatus = 'warning';
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
            const agentName = safeGet<string>(manifest.metadata, 'name', (v): v is string => typeof v === 'string');
            if (agentName && !getDNS1123Regex().test(agentName)) {
              practiceIssues.push('Agent name not DNS-1123 compliant');
              practiceStatus = 'warning';
            }

            // Check version format
            const version = safeGet<string>(manifest.metadata, 'version', (v): v is string => typeof v === 'string');
            if (version && !getSemanticVersionRegex().test(version)) {
              practiceIssues.push('Version not semantic versioning');
              practiceStatus = 'warning';
            }

            // Check for required role
            const role = safeGet<string>(manifest.spec, 'role', (v): v is string => typeof v === 'string');
            if (!role) {
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
        } catch (error: unknown) {
          console.log(chalk.red(`✗ Failed to check ${file}: ${error.message}`));
        }
      }

      // Output results
      if (options?.json || isJSONOutput({ output: options?.json ? 'json' : 'text' })) {
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
