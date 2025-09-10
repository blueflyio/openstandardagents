#!/usr/bin/env node

/**
 * OSSA Compliance Engine CLI v0.1.9-alpha.1
 * 
 * Enterprise compliance command-line interface for OSSA Platform.
 * Provides tools for conformance validation, regulatory compliance,
 * policy enforcement, and audit trail management.
 */

import { Command } from 'commander';
import { ComplianceEngine, ComplianceContext } from '../core/compliance/ComplianceEngine.js';
import { OSSAAgent } from '../types/agents/index.js';
import { startComplianceServer } from '../api/compliance/server.js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const program = new Command();
const complianceEngine = new ComplianceEngine();

program
  .name('ossa-compliance')
  .description('OSSA Enterprise Compliance Engine CLI')
  .version('0.1.9-alpha.1');

/**
 * Start compliance server command
 */
program
  .command('server')
  .description('Start the OSSA Compliance Engine API server')
  .option('-p, --port <port>', 'Server port', '3004')
  .option('-e, --env <environment>', 'Environment', 'production')
  .action(async (options) => {
    try {
      process.env.OSSA_COMPLIANCE_PORT = options.port;
      process.env.NODE_ENV = options.env;
      
      console.log(chalk.blue('🛡️  Starting OSSA Compliance Engine...'));
      console.log(chalk.gray(`   Port: ${options.port}`));
      console.log(chalk.gray(`   Environment: ${options.env}`));
      console.log();
      
      await startComplianceServer();
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start compliance server:'), error);
      process.exit(1);
    }
  });

/**
 * Validate agent conformance command
 */
program
  .command('validate')
  .description('Validate OSSA agent conformance and compliance')
  .argument('<agent-file>', 'Path to agent manifest file (YAML or JSON)')
  .option('-c, --context <context-file>', 'Compliance context configuration file')
  .option('-f, --frameworks <frameworks...>', 'Required compliance frameworks', [])
  .option('-e, --environment <env>', 'Deployment environment', 'production')
  .option('-r, --region <region>', 'Deployment region', 'us-east-1')
  .option('--classification <level>', 'Data classification level', 'internal')
  .option('--output <format>', 'Output format (json|table|report)', 'table')
  .action(async (agentFile, options) => {
    try {
      console.log(chalk.blue('🔍 Validating OSSA agent conformance...'));
      console.log(chalk.gray(`   Agent: ${agentFile}`));
      console.log(chalk.gray(`   Environment: ${options.environment}`));
      console.log(chalk.gray(`   Frameworks: ${options.frameworks.join(', ') || 'None'}`));
      console.log();

      // Load agent manifest
      if (!fs.existsSync(agentFile)) {
        throw new Error(`Agent file not found: ${agentFile}`);
      }
      
      const agentContent = fs.readFileSync(agentFile, 'utf-8');
      let agent: OSSAAgent;
      
      if (agentFile.endsWith('.json')) {
        agent = JSON.parse(agentContent);
      } else if (agentFile.endsWith('.yml') || agentFile.endsWith('.yaml')) {
        const yaml = await import('yaml');
        agent = yaml.parse(agentContent);
      } else {
        throw new Error('Agent file must be JSON or YAML format');
      }

      // Load or create compliance context
      let context: ComplianceContext;
      if (options.context && fs.existsSync(options.context)) {
        const contextContent = fs.readFileSync(options.context, 'utf-8');
        context = JSON.parse(contextContent);
      } else {
        context = {
          environment: options.environment as 'development' | 'staging' | 'production',
          classification: options.classification as 'public' | 'internal' | 'confidential' | 'restricted',
          region: options.region
        };
      }

      // Validate conformance
      const result = await complianceEngine.validateOSSAConformance(
        agent,
        context,
        options.frameworks
      );

      // Output results
      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else if (options.output === 'report') {
        outputDetailedReport(agent, result, context, options.frameworks);
      } else {
        outputTableResults(agent, result);
      }

      // Exit with error code if not compliant
      if (!result.compliant) {
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Batch validate multiple agents
 */
program
  .command('validate-batch')
  .description('Validate multiple OSSA agents from a directory or manifest list')
  .argument('<input>', 'Directory containing agent files or JSON file with agent list')
  .option('-c, --context <context-file>', 'Compliance context configuration file')
  .option('-f, --frameworks <frameworks...>', 'Required compliance frameworks', [])
  .option('-e, --environment <env>', 'Deployment environment', 'production')
  .option('-r, --region <region>', 'Deployment region', 'us-east-1')
  .option('--classification <level>', 'Data classification level', 'internal')
  .option('--output <format>', 'Output format (json|table|report)', 'table')
  .option('--fail-fast', 'Stop validation on first failure', false)
  .action(async (input, options) => {
    try {
      console.log(chalk.blue('🔍 Batch validating OSSA agents...'));
      console.log(chalk.gray(`   Input: ${input}`));
      console.log();

      // Load agents
      const agents: OSSAAgent[] = [];
      
      if (fs.statSync(input).isDirectory()) {
        // Load all agent files from directory
        const files = fs.readdirSync(input).filter(f => 
          f.endsWith('.json') || f.endsWith('.yml') || f.endsWith('.yaml')
        );
        
        for (const file of files) {
          const filePath = path.join(input, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          let agent: OSSAAgent;
          if (file.endsWith('.json')) {
            agent = JSON.parse(content);
          } else {
            const yaml = await import('yaml');
            agent = yaml.parse(content);
          }
          agents.push(agent);
        }
      } else {
        // Load from JSON manifest file
        const content = fs.readFileSync(input, 'utf-8');
        const manifest = JSON.parse(content);
        agents.push(...manifest.agents || [manifest]);
      }

      if (agents.length === 0) {
        throw new Error('No agents found to validate');
      }

      // Load compliance context
      let context: ComplianceContext;
      if (options.context && fs.existsSync(options.context)) {
        const contextContent = fs.readFileSync(options.context, 'utf-8');
        context = JSON.parse(contextContent);
      } else {
        context = {
          environment: options.environment as 'development' | 'staging' | 'production',
          classification: options.classification as 'public' | 'internal' | 'confidential' | 'restricted',
          region: options.region
        };
      }

      // Generate compliance report
      const report = await complianceEngine.generateComplianceReport(
        agents,
        context,
        options.frameworks
      );

      // Output results
      if (options.output === 'json') {
        console.log(JSON.stringify(report, null, 2));
      } else if (options.output === 'report') {
        outputBatchReport(report, context, options.frameworks);
      } else {
        outputBatchTable(report);
      }

      // Exit with error code if any critical findings
      if (report.summary.criticalFindings > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('❌ Batch validation failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * List supported frameworks
 */
program
  .command('frameworks')
  .description('List supported compliance frameworks')
  .option('--details', 'Show detailed framework information', false)
  .action(async (options) => {
    try {
      const frameworks = complianceEngine.getSupportedFrameworks();
      
      console.log(chalk.blue('📋 Supported Compliance Frameworks'));
      console.log();
      
      if (options.details) {
        frameworks.forEach(framework => {
          console.log(chalk.green(`${framework.name} (${framework.id})`));
          console.log(chalk.gray(`   Standard: ${framework.standard}`));
          console.log(chalk.gray(`   Version: ${framework.version}`));
          console.log(chalk.gray(`   Requirements: ${framework.requirements.length}`));
          console.log(chalk.gray(`   OSSA Mappings: ${framework.mappings.length}`));
          console.log();
        });
      } else {
        frameworks.forEach(framework => {
          console.log(`${chalk.green('•')} ${framework.name} (${framework.id}) - v${framework.version}`);
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to list frameworks:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Show conformance levels
 */
program
  .command('conformance-levels')
  .description('Show OSSA conformance levels and requirements')
  .action(async () => {
    try {
      const levels = complianceEngine.getConformanceLevels();
      
      console.log(chalk.blue('📊 OSSA Conformance Levels'));
      console.log();
      
      Object.entries(levels).forEach(([level, requirements]) => {
        console.log(chalk.green(`${level.toUpperCase()} Level`));
        console.log(chalk.gray(`   Minimum Capabilities: ${requirements.minCapabilities}`));
        console.log(chalk.gray(`   Minimum Protocols: ${requirements.minProtocols}`));
        console.log(chalk.gray(`   Audit Logging: ${requirements.auditLogging ? 'Required' : 'Optional'}`));
        console.log(chalk.gray(`   Feedback Loop: ${requirements.feedbackLoop ? 'Required' : 'Optional'}`));
        console.log(chalk.gray(`   PROPS Tokens: ${requirements.propsTokens ? 'Required' : 'Optional'}`));
        console.log(chalk.gray(`   Learning Signals: ${requirements.learningSignals ? 'Required' : 'Optional'}`));
        console.log();
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to show conformance levels:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Audit trail command
 */
program
  .command('audit')
  .description('View compliance audit trail')
  .option('--since <date>', 'Show entries since date (ISO 8601)')
  .option('--limit <count>', 'Limit number of entries', '50')
  .option('--output <format>', 'Output format (json|table)', 'table')
  .action(async (options) => {
    try {
      const auditTrail = complianceEngine.getAuditTrail(options.since);
      const limit = parseInt(options.limit);
      const entries = auditTrail.slice(-limit);
      
      if (options.output === 'json') {
        console.log(JSON.stringify(entries, null, 2));
      } else {
        console.log(chalk.blue(`📜 Compliance Audit Trail (${entries.length} entries)`));
        console.log();
        
        entries.forEach(entry => {
          const status = entry.outcome === 'success' ? chalk.green('✓') : 
                        entry.outcome === 'failure' ? chalk.red('✗') : 
                        chalk.yellow('!');
          
          console.log(`${status} ${chalk.gray(entry.timestamp)} ${chalk.blue(entry.action)} ${entry.resource}`);
          console.log(`   ${chalk.gray(`Actor: ${entry.actor}, Outcome: ${entry.outcome}`)}`);
          if (entry.compliance?.length) {
            console.log(`   ${chalk.gray(`Frameworks: ${entry.compliance.join(', ')}`)}`);
          }
          console.log();
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to retrieve audit trail:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Helper functions for output formatting
function outputTableResults(agent: OSSAAgent, result: any): void {
  console.log(chalk.blue(`📊 Compliance Results for ${agent.metadata.name}`));
  console.log();
  
  const status = result.compliant ? chalk.green('✓ COMPLIANT') : chalk.red('✗ NON-COMPLIANT');
  console.log(`Status: ${status}`);
  console.log(`Score: ${chalk.yellow(result.score.toFixed(1))}/100`);
  console.log(`Conformance: ${chalk.blue(agent.spec.conformance?.level || 'bronze')}`);
  console.log();
  
  if (result.findings.length > 0) {
    console.log(chalk.red('🚨 Findings:'));
    result.findings.forEach((finding: any) => {
      const severity = finding.severity === 'critical' ? chalk.red('CRITICAL') :
                      finding.severity === 'high' ? chalk.yellow('HIGH') :
                      finding.severity === 'medium' ? chalk.blue('MEDIUM') :
                      chalk.gray('LOW');
      
      console.log(`   ${severity} ${finding.requirement}`);
      console.log(`   ${chalk.gray(finding.description)}`);
      console.log(`   ${chalk.gray('Remediation:')} ${finding.remediation}`);
      console.log();
    });
  }
  
  if (result.recommendations.length > 0) {
    console.log(chalk.blue('💡 Recommendations:'));
    result.recommendations.forEach((rec: string) => {
      console.log(`   • ${rec}`);
    });
  }
}

function outputDetailedReport(agent: OSSAAgent, result: any, context: ComplianceContext, frameworks: string[]): void {
  console.log(chalk.blue('📋 OSSA Compliance Report'));
  console.log('═'.repeat(50));
  console.log();
  
  console.log(chalk.green('Agent Information:'));
  console.log(`   Name: ${agent.metadata.name}`);
  console.log(`   Version: ${agent.metadata.version}`);
  console.log(`   Type: ${agent.spec.type}`);
  console.log(`   Conformance Level: ${agent.spec.conformance?.level || 'bronze'}`);
  console.log();
  
  console.log(chalk.green('Compliance Context:'));
  console.log(`   Environment: ${context.environment}`);
  console.log(`   Classification: ${context.classification}`);
  console.log(`   Region: ${context.region}`);
  console.log(`   Frameworks: ${frameworks.join(', ') || 'None'}`);
  console.log();
  
  const status = result.compliant ? chalk.green('✓ COMPLIANT') : chalk.red('✗ NON-COMPLIANT');
  console.log(chalk.green('Compliance Status:'));
  console.log(`   Overall: ${status}`);
  console.log(`   Score: ${result.score.toFixed(1)}/100`);
  console.log(`   Findings: ${result.findings.length}`);
  console.log(`   Critical: ${result.findings.filter((f: any) => f.severity === 'critical').length}`);
  console.log();
  
  if (result.findings.length > 0) {
    console.log(chalk.red('Detailed Findings:'));
    result.findings.forEach((finding: any, index: number) => {
      console.log(`   ${index + 1}. ${finding.requirement}`);
      console.log(`      Severity: ${finding.severity.toUpperCase()}`);
      console.log(`      Description: ${finding.description}`);
      console.log(`      Remediation: ${finding.remediation}`);
      console.log();
    });
  }
}

function outputBatchTable(report: any): void {
  console.log(chalk.blue('📊 Batch Compliance Report'));
  console.log('═'.repeat(50));
  console.log();
  
  console.log(chalk.green('Summary:'));
  console.log(`   Total Agents: ${report.summary.totalAgents}`);
  console.log(`   Compliant: ${report.summary.compliantAgents}`);
  console.log(`   Average Score: ${report.summary.averageScore.toFixed(1)}`);
  console.log(`   Critical Findings: ${report.summary.criticalFindings}`);
  console.log();
  
  console.log(chalk.blue('Agent Results:'));
  report.agentResults.forEach((result: any) => {
    const status = result.result.compliant ? chalk.green('✓') : chalk.red('✗');
    console.log(`   ${status} ${result.agent.metadata.name} (${result.result.score.toFixed(1)}/100)`);
  });
}

function outputBatchReport(report: any, context: ComplianceContext, frameworks: string[]): void {
  console.log(chalk.blue('📋 Comprehensive Compliance Report'));
  console.log('═'.repeat(60));
  console.log();
  
  console.log(chalk.green('Executive Summary:'));
  console.log(`   Total Agents Evaluated: ${report.summary.totalAgents}`);
  console.log(`   Compliant Agents: ${report.summary.compliantAgents}`);
  console.log(`   Compliance Rate: ${(report.summary.compliantAgents / report.summary.totalAgents * 100).toFixed(1)}%`);
  console.log(`   Average Score: ${report.summary.averageScore.toFixed(1)}/100`);
  console.log(`   Critical Findings: ${report.summary.criticalFindings}`);
  console.log(`   Risk Level: ${report.summary.criticalFindings > 0 ? 'High' : report.summary.averageScore < 70 ? 'Medium' : 'Low'}`);
  console.log();
  
  console.log(chalk.green('Context:'));
  console.log(`   Environment: ${context.environment}`);
  console.log(`   Classification: ${context.classification}`);
  console.log(`   Region: ${context.region}`);
  console.log(`   Frameworks: ${frameworks.join(', ') || 'None'}`);
  console.log(`   Report Generated: ${report.summary.timestamp}`);
  console.log();
  
  console.log(chalk.blue('Agent Details:'));
  report.agentResults.forEach((result: any) => {
    const status = result.result.compliant ? chalk.green('✓') : chalk.red('✗');
    console.log(`   ${status} ${result.agent.metadata.name}`);
    console.log(`      Score: ${result.result.score.toFixed(1)}/100`);
    console.log(`      Findings: ${result.result.findings.length} (${result.result.findings.filter((f: any) => f.severity === 'critical').length} critical)`);
    console.log();
  });
  
  if (report.recommendations.length > 0) {
    console.log(chalk.yellow('System Recommendations:'));
    report.recommendations.forEach((rec: string) => {
      console.log(`   • ${rec}`);
    });
  }
}

// Parse command line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}