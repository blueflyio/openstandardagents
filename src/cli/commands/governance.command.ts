/**
 * OSSA Governance CLI Commands
 *
 * Delegates to configured governance provider (Cedar, OPA, etc.)
 */

import { Command } from 'commander';
import { GovernanceClient } from '../../services/governance-client.service.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';

const governanceClient = new GovernanceClient();

/**
 * Check if agent meets governance requirements
 */
const checkCommand = new Command('check')
  .description('Check if agent configuration meets governance requirements')
  .requiredOption('--agent <path>', 'Path to agent manifest (agent.ossa.yaml)')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📋 Loading agent manifest...'));

      const manifestPath = path.resolve(options.agent);
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = yaml.load(manifestContent) as any;

      if (!manifest.spec?.governance) {
        console.log(chalk.yellow('⚠️  No governance configuration found in agent manifest'));
        console.log(chalk.gray('Add a "governance" section to your agent manifest to use this feature.'));
        process.exit(0);
      }

      console.log(chalk.blue('🔍 Checking compliance...'));
      const result = await governanceClient.checkCompliance(manifest.spec.governance);

      if (result.compliant) {
        console.log(chalk.green('✅ COMPLIANT'));
      } else {
        console.log(chalk.red('❌ NON-COMPLIANT'));
      }

      if (result.issues.length > 0) {
        console.log(chalk.red('\n🚫 Issues:'));
        result.issues.forEach(issue => console.log(chalk.red(`  - ${issue}`)));
      }

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        result.warnings.forEach(warning => console.log(chalk.yellow(`  - ${warning}`)));
      }

      process.exit(result.compliant ? 0 : 1);
    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Authorize agent action
 */
const authorizeCommand = new Command('authorize')
  .description('Check if agent is authorized to perform action')
  .requiredOption('--agent <name>', 'Agent identifier')
  .requiredOption('--action <action>', 'Action to authorize')
  .requiredOption('--resource <resource>', 'Resource to act on')
  .option('--confidence <score>', 'Confidence score (0-100)', '70')
  .option('--context <json>', 'Additional context (JSON)', '{}')
  .action(async (options) => {
    try {
      const context = JSON.parse(options.context);
      context.confidence_score = parseInt(options.confidence, 10);

      console.log(chalk.blue('🔐 Checking authorization...'));
      console.log(chalk.gray(`  Agent: ${options.agent}`));
      console.log(chalk.gray(`  Action: ${options.action}`));
      console.log(chalk.gray(`  Resource: ${options.resource}`));
      console.log(chalk.gray(`  Confidence: ${options.confidence}%\n`));

      const result = await governanceClient.authorize({
        agent: options.agent,
        action: options.action,
        resource: options.resource,
        context,
      });

      if (result.decision === 'ALLOW') {
        console.log(chalk.green('✅ ALLOW'));
        if (result.reason) {
          console.log(chalk.gray(`Reason: ${result.reason}`));
        }
        process.exit(0);
      } else {
        console.log(chalk.red('❌ DENY'));
        if (result.reason) {
          console.log(chalk.gray(`Reason: ${result.reason}`));
        }
        if (result.diagnostics?.policies_evaluated) {
          console.log(chalk.gray(`\nPolicies evaluated: ${result.diagnostics.policies_evaluated.join(', ')}`));
        }
        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Evaluate quality gate
 */
const qualityGateCommand = new Command('quality-gate')
  .description('Evaluate quality gate for deployment')
  .requiredOption('--environment <env>', 'Target environment (production|staging|development)')
  .requiredOption('--coverage <pct>', 'Test coverage percentage', parseInt)
  .requiredOption('--security-score <score>', 'Security scan score', parseInt)
  .requiredOption('--confidence <score>', 'Confidence score', parseInt)
  .requiredOption('--vulnerabilities <count>', 'Vulnerability count', parseInt)
  .option('--pipeline-id <id>', 'Pipeline identifier')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚦 Evaluating quality gate...'));
      console.log(chalk.gray(`  Environment: ${options.environment}`));
      console.log(chalk.gray(`  Test Coverage: ${options.coverage}%`));
      console.log(chalk.gray(`  Security Score: ${options.securityScore}%`));
      console.log(chalk.gray(`  Confidence: ${options.confidence}%`));
      console.log(chalk.gray(`  Vulnerabilities: ${options.vulnerabilities}\n`));

      const result = await governanceClient.evaluateQualityGate({
        pipeline_id: options.pipelineId,
        environment: options.environment,
        metrics: {
          test_coverage: options.coverage,
          security_score: options.securityScore,
          confidence_score: options.confidence,
          vulnerability_count: options.vulnerabilities,
        },
      });

      if (result.decision === 'PASS') {
        console.log(chalk.green('✅ PASS - Deployment approved'));
        process.exit(0);
      } else {
        console.log(chalk.red('❌ FAIL - Deployment blocked'));

        if (result.blocked_by && result.blocked_by.length > 0) {
          console.log(chalk.red('\n🚫 Blocked by:'));
          result.blocked_by.forEach(policy => console.log(chalk.red(`  - ${policy}`)));
        }

        if (result.policy_decision?.reason) {
          console.log(chalk.gray(`\nReason: ${result.policy_decision.reason}`));
        }

        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Export main governance command with subcommands
 */
export const governanceCommand = new Command('governance')
  .description('Governance operations (authorization, quality gates, compliance)')
  .addCommand(checkCommand)
  .addCommand(authorizeCommand)
  .addCommand(qualityGateCommand);
