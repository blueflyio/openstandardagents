/**
 * OSSA CLI - Audit Command
 *
 * Scan folders for agents and generate health reports.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { AgentAuditService } from '../../services/audit.js';
import type { AgentHealth, AuditReport } from '../../services/audit.js';

export function createAuditCommand(): Command {
  const command = new Command('audit');

  command.description('Audit OSSA agents for health and compliance');

  // audit scan command
  command
    .command('scan')
    .description('Scan folder for agents and generate health report')
    .argument('[path]', 'Path to scan for agents', './packages/@ossa')
    .option('-r, --recursive', 'Recursively scan subdirectories', true)
    .option(
      '-l, --level <level>',
      'Validation level (basic|full|strict)',
      'full'
    )
    .option('-v, --spec-version <version>', 'OSSA spec version', '0.3.5')
    .option('--no-examples', 'Exclude example agents from report')
    .option(
      '-f, --format <format>',
      'Output format (table|json|markdown)',
      'table'
    )
    .option('-o, --output <file>', 'Write report to file')
    .action(async (scanPath: string, options: any) => {
      const auditService = new AgentAuditService();

      console.log(chalk.blue('🔍 Scanning agents...\n'));

      try {
        const report = await auditService.scanAndAudit({
          path: scanPath,
          recursive: options.recursive,
          validationLevel: options.level,
          specVersion: options.specVersion,
          includeExamples: options.examples,
        });

        // Output report
        if (options.format === 'json') {
          const output = JSON.stringify(report, null, 2);
          if (options.output) {
            fs.writeFileSync(options.output, output);
            console.log(chalk.green(`✅ Report saved to ${options.output}`));
          } else {
            console.log(output);
          }
        } else if (options.format === 'markdown') {
          const markdown = generateMarkdownReport(report);
          if (options.output) {
            fs.writeFileSync(options.output, markdown);
            console.log(chalk.green(`✅ Report saved to ${options.output}`));
          } else {
            console.log(markdown);
          }
        } else {
          // Table format (default)
          printTableReport(report);
          if (options.output) {
            const markdown = generateMarkdownReport(report);
            fs.writeFileSync(options.output, markdown);
            console.log(chalk.green(`\n✅ Report saved to ${options.output}`));
          }
        }
      } catch (error: any) {
        console.error(chalk.red(`❌ Error during audit: ${error.message}`));
        process.exit(1);
      }
    });

  // audit agent command
  command
    .command('agent <id>')
    .description('Audit a specific agent')
    .argument('<id>', 'Agent ID')
    .option('-p, --path <path>', 'Path to agent directory')
    .option('-l, --level <level>', 'Validation level', 'full')
    .action(async (agentId: string, options: any) => {
      const auditService = new AgentAuditService();

      const agentPath = options.path || `./packages/@ossa/${agentId}`;

      if (!fs.existsSync(agentPath)) {
        console.error(chalk.red(`❌ Agent not found at: ${agentPath}`));
        process.exit(1);
      }

      console.log(chalk.blue(`🔍 Auditing agent: ${agentId}\n`));

      try {
        const health = await auditService.auditAgent(agentPath, options.level);
        printAgentHealth(health);
      } catch (error: any) {
        console.error(chalk.red(`❌ Error during audit: ${error.message}`));
        process.exit(1);
      }
    });

  return command;
}

/**
 * Print report in table format
 */
function printTableReport(report: AuditReport): void {
  console.log(chalk.bold('=== AGENT HEALTH AUDIT REPORT ===\n'));

  // Summary
  console.log(chalk.bold('Summary:'));
  console.log(`  Total Agents:      ${report.summary.total}`);
  console.log(
    `  ${chalk.green('🟢 Healthy')}:        ${report.summary.healthy} (${Math.round((report.summary.healthy / report.summary.total) * 100)}%)`
  );
  console.log(
    `  ${chalk.yellow('🟡 Warning')}:        ${report.summary.warning} (${Math.round((report.summary.warning / report.summary.total) * 100)}%)`
  );
  console.log(
    `  ${chalk.red('🔴 Error')}:          ${report.summary.error} (${Math.round((report.summary.error / report.summary.total) * 100)}%)`
  );
  console.log(`  Overall Health:    ${report.summary.healthPercentage}%`);
  console.log(`  Scan Path:         ${report.scanPath}`);
  console.log(`  Validation Level:  ${report.validationLevel}`);
  console.log(
    `  Timestamp:         ${new Date(report.timestamp).toLocaleString()}\n`
  );

  // Group agents by status
  const healthyAgents = report.agents.filter((a) => a.status === 'healthy');
  const warningAgents = report.agents.filter((a) => a.status === 'warning');
  const errorAgents = report.agents.filter((a) => a.status === 'error');

  // Print healthy agents (brief)
  if (healthyAgents.length > 0) {
    console.log(
      chalk.green.bold(`🟢 Healthy Agents (${healthyAgents.length}):`)
    );
    healthyAgents.forEach((agent) => {
      console.log(`  ✅ ${agent.id} (score: ${agent.healthScore})`);
    });
    console.log('');
  }

  // Print warning agents (with issues)
  if (warningAgents.length > 0) {
    console.log(
      chalk.yellow.bold(`🟡 Warning Agents (${warningAgents.length}):`)
    );
    warningAgents.forEach((agent) => {
      console.log(`  ⚠️  ${agent.id} (score: ${agent.healthScore})`);
      if (agent.issues.length > 0) {
        agent.issues.forEach((issue) => {
          console.log(`      - ${issue.message}`);
        });
      }
    });
    console.log('');
  }

  // Print error agents (with issues)
  if (errorAgents.length > 0) {
    console.log(chalk.red.bold(`🔴 Error Agents (${errorAgents.length}):`));
    errorAgents.forEach((agent) => {
      console.log(`  ❌ ${agent.id} (score: ${agent.healthScore})`);
      if (agent.issues.length > 0) {
        agent.issues.forEach((issue) => {
          console.log(`      - ${issue.message}`);
        });
      }
    });
    console.log('');
  }
}

/**
 * Print single agent health
 */
function printAgentHealth(health: AgentHealth): void {
  console.log(chalk.bold(`Agent: ${health.id}`));
  console.log(`  Name:            ${health.name || 'N/A'}`);
  console.log(`  Path:            ${health.path}`);
  console.log(
    `  Status:          ${getStatusIcon(health.status)} ${health.status.toUpperCase()}`
  );
  console.log(`  Health Score:    ${health.healthScore}/100`);
  console.log(
    `  Manifest:        ${health.manifestExists ? '✅ Found' : '🔴 Missing'}`
  );
  if (health.manifestExists) {
    console.log(`  Manifest Format: ${health.manifestFormat}`);
    console.log(
      `  Manifest Valid:  ${health.manifestValid ? '✅ Yes' : '🔴 No'}`
    );
    console.log(`  Capabilities:    ${health.capabilitiesCount}`);
    console.log(`  Tools:           ${health.toolsCount}`);
    console.log(`  Triggers:        ${health.triggersCount}`);
  }

  if (health.issues.length > 0) {
    console.log(chalk.bold('\n  Issues:'));
    health.issues.forEach((issue) => {
      const icon =
        issue.severity === 'error'
          ? '❌'
          : issue.severity === 'warning'
            ? '⚠️'
            : 'ℹ️';
      console.log(`    ${icon} [${issue.code}] ${issue.message}`);
      if (issue.field) {
        console.log(`       Field: ${issue.field}`);
      }
    });
  }

  if (health.validationErrors.length > 0) {
    console.log(chalk.bold('\n  Validation Errors:'));
    health.validationErrors.forEach((error) => {
      console.log(`    ❌ ${error.path}: ${error.message}`);
    });
  }

  console.log('');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: AuditReport): string {
  let md = '# AGENT HEALTH AUDIT REPORT\n\n';

  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
  md += `**Scan Path:** \`${report.scanPath}\`\n`;
  md += `**Validation Level:** ${report.validationLevel}\n\n`;

  md += '## Summary\n\n';
  md += `- **Total Agents:** ${report.summary.total}\n`;
  md += `- **🟢 Healthy:** ${report.summary.healthy} (${Math.round((report.summary.healthy / report.summary.total) * 100)}%)\n`;
  md += `- **🟡 Warning:** ${report.summary.warning} (${Math.round((report.summary.warning / report.summary.total) * 100)}%)\n`;
  md += `- **🔴 Error:** ${report.summary.error} (${Math.round((report.summary.error / report.summary.total) * 100)}%)\n`;
  md += `- **Overall Health:** ${report.summary.healthPercentage}%\n\n`;

  md += '## Agent Details\n\n';
  md += '| Agent | Status | Score | Capabilities | Tools | Issues |\n';
  md += '|-------|--------|-------|--------------|-------|--------|\n';

  report.agents.forEach((agent) => {
    const statusIcon = getStatusIcon(agent.status);
    const issueCount = agent.issues.length + agent.validationErrors.length;
    md += `| ${agent.id} | ${statusIcon} ${agent.status} | ${agent.healthScore}/100 | ${agent.capabilitiesCount} | ${agent.toolsCount} | ${issueCount} |\n`;
  });

  md += '\n## Issues by Agent\n\n';
  report.agents
    .filter((a) => a.issues.length > 0 || a.validationErrors.length > 0)
    .forEach((agent) => {
      md += `### ${agent.id}\n\n`;
      if (agent.issues.length > 0) {
        agent.issues.forEach((issue) => {
          const icon =
            issue.severity === 'error'
              ? '❌'
              : issue.severity === 'warning'
                ? '⚠️'
                : 'ℹ️';
          md += `- ${icon} **[${issue.code}]** ${issue.message}\n`;
        });
      }
      if (agent.validationErrors.length > 0) {
        agent.validationErrors.forEach((error) => {
          md += `- ❌ **Validation Error** \`${error.path}\`: ${error.message}\n`;
        });
      }
      md += '\n';
    });

  return md;
}

/**
 * Get status icon
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'healthy':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'error':
      return '🔴';
    default:
      return '⚪';
  }
}
