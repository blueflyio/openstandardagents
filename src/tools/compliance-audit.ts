#!/usr/bin/env tsx
/**
 * GitLab Ultimate Compliance Audit System
 *
 * Performs automated compliance checks for GitLab projects:
 * - Protected branches configuration
 * - Merge request approval rules
 * - Security scanning (SAST, dependency scanning, container scanning)
 * - DORA metrics configuration
 * - Compliance frameworks
 * - Pipeline configuration
 *
 * Usage:
 *   tsx src/tools/compliance-audit.ts [project-id]
 *
 * Environment Variables:
 *   GITLAB_TOKEN - GitLab API token (required)
 *   GITLAB_HOST - GitLab instance URL (default: https://gitlab.com)
 */

import { Gitlab } from '@gitbeaker/rest';
import { writeFileSync } from 'fs';

// Configuration
const DEFAULT_PROJECT = 'blueflyio/openstandardagents';
const GITLAB_HOST = process.env.GITLAB_HOST?.replace('gitlab.com', 'https://gitlab.com') || 'https://gitlab.com';
const TOKEN = process.env.GITLAB_TOKEN || process.env.SERVICE_ACCOUNT_OSSA_TOKEN || process.env.GITLAB_PUSH_TOKEN;

if (!TOKEN) {
  console.error('ERROR: GITLAB_TOKEN required');
  console.error('   Set environment variable: export GITLAB_TOKEN=<your-token>');
  process.exit(1);
}

const gitlab = new Gitlab({
  host: GITLAB_HOST.replace(/\/$/, ''),
  token: TOKEN,
});

// Compliance check results interface
interface ComplianceCheck {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  remediation?: string;
}

interface AuditReport {
  projectId: string;
  projectName: string;
  auditDate: string;
  overallStatus: 'compliant' | 'non-compliant' | 'partial';
  checks: ComplianceCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

// Helper functions
function createCheck(
  category: string,
  check: string,
  status: 'pass' | 'fail' | 'warning' | 'info',
  message: string,
  remediation?: string
): ComplianceCheck {
  return { category, check, status, message, remediation };
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pass': return '[PASS]';
    case 'fail': return '[FAIL]';
    case 'warning': return '[WARN]';
    case 'info': return '[INFO]';
    default: return '•';
  }
}

// Audit functions
async function auditProtectedBranches(projectId: string): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];
  const category = 'Branch Protection';

  try {
    const protectedBranches = await gitlab.ProtectedBranches.all(projectId);

    // Check main branch protection
    const mainProtected = protectedBranches.find((pb: any) => pb.name === 'main' || pb.name === 'master');
    if (mainProtected) {
      checks.push(createCheck(
        category,
        'Main Branch Protected',
        'pass',
        `Main branch is protected with ${mainProtected.push_access_levels?.length || 0} push rules and ${mainProtected.merge_access_levels?.length || 0} merge rules`
      ));

      // Check force push is disabled
      if (mainProtected.allow_force_push === false) {
        checks.push(createCheck(
          category,
          'Force Push Disabled',
          'pass',
          'Force push is disabled on main branch'
        ));
      } else {
        checks.push(createCheck(
          category,
          'Force Push Disabled',
          'fail',
          'Force push is enabled on main branch',
          'Disable force push: Settings > Repository > Protected branches'
        ));
      }
    } else {
      checks.push(createCheck(
        category,
        'Main Branch Protected',
        'fail',
        'Main branch is not protected',
        'Protect main branch: Settings > Repository > Protected branches'
      ));
    }

    // Check development branch protection
    const devProtected = protectedBranches.find((pb: any) => pb.name === 'development' || pb.name === 'develop');
    if (devProtected) {
      checks.push(createCheck(
        category,
        'Development Branch Protected',
        'pass',
        'Development branch is protected'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Development Branch Protected',
        'warning',
        'Development branch is not protected',
        'Consider protecting development branch for better workflow control'
      ));
    }

  } catch (error: any) {
    checks.push(createCheck(
      category,
      'Branch Protection Check',
      'fail',
      `Failed to check branch protection: ${error.message}`
    ));
  }

  return checks;
}

async function auditMergeRequestApprovals(projectId: string): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];
  const category = 'Merge Request Approvals';

  try {
    // Get project settings to check approval requirements
    const project = await gitlab.Projects.show(projectId);

    // Check if approvals are required (available in Free tier via project settings)
    const approvalsBeforeMerge = (project as any).approvals_before_merge;
    if (approvalsBeforeMerge && typeof approvalsBeforeMerge === 'number' && approvalsBeforeMerge > 0) {
      checks.push(createCheck(
        category,
        'Approvals Required',
        'pass',
        `${project.approvals_before_merge} approval(s) required before merge`
      ));
    } else {
      checks.push(createCheck(
        category,
        'Approvals Required',
        'warning',
        'No approvals required before merge',
        'Consider requiring at least 1 approval: Settings > Merge requests > Approvals'
      ));
    }

    // Try to get advanced approval rules (Premium/Ultimate feature)
    try {
      const rules = await (gitlab as any).ProjectApprovalRules?.all(projectId);
      if (rules && rules.length > 0) {
        checks.push(createCheck(
          category,
          'Approval Rules Defined',
          'pass',
          `${rules.length} approval rule(s) defined`
        ));

        // Check for CODEOWNERS integration
        const hasCodeOwners = rules.some((rule: any) => rule.rule_type === 'code_owner');
        if (hasCodeOwners) {
          checks.push(createCheck(
            category,
            'Code Owner Approvals',
            'pass',
            'Code owner approval rules are configured'
          ));
        }
      } else {
        checks.push(createCheck(
          category,
          'Approval Rules Defined',
          'info',
          'No specific approval rules defined',
          'Advanced approval rules require GitLab Premium/Ultimate'
        ));
      }
    } catch (rulesError: any) {
      // Advanced rules not available or not accessible
      checks.push(createCheck(
        category,
        'Advanced Approval Rules',
        'info',
        'Advanced approval rules not available',
        'This feature requires GitLab Premium/Ultimate'
      ));
    }

    // Check merge request settings
    if (project.only_allow_merge_if_pipeline_succeeds) {
      checks.push(createCheck(
        category,
        'Pipeline Success Required',
        'pass',
        'Merge is only allowed if pipeline succeeds'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Pipeline Success Required',
        'warning',
        'Merges are allowed without successful pipeline',
        'Enable: Settings > Merge requests > Pipelines must succeed'
      ));
    }

    if (project.only_allow_merge_if_all_discussions_are_resolved) {
      checks.push(createCheck(
        category,
        'Discussions Must Be Resolved',
        'pass',
        'All discussions must be resolved before merge'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Discussions Must Be Resolved',
        'info',
        'Merges are allowed with unresolved discussions',
        'Enable: Settings > Merge requests > All discussions must be resolved'
      ));
    }

  } catch (error: any) {
    checks.push(createCheck(
      category,
      'MR Approvals Check',
      'warning',
      `Could not check approval settings: ${error.message}`,
      'This may require GitLab Premium/Ultimate'
    ));
  }

  return checks;
}

async function auditSecurityScanning(projectId: string): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];
  const category = 'Security Scanning';

  try {
    // Get CI/CD configuration
    const cicdFile = await gitlab.RepositoryFiles.show(projectId, '.gitlab-ci.yml', 'HEAD');
    const cicdContent = Buffer.from(cicdFile.content, 'base64').toString('utf-8');

    // Check for SAST
    if (cicdContent.includes('sast') || cicdContent.includes('SAST')) {
      checks.push(createCheck(
        category,
        'SAST Enabled',
        'pass',
        'Static Application Security Testing (SAST) is configured'
      ));
    } else {
      checks.push(createCheck(
        category,
        'SAST Enabled',
        'warning',
        'SAST is not configured',
        'Add SAST template: include: - template: Security/SAST.gitlab-ci.yml'
      ));
    }

    // Check for dependency scanning
    if (cicdContent.includes('dependency_scanning') || cicdContent.includes('Dependency-Scanning')) {
      checks.push(createCheck(
        category,
        'Dependency Scanning Enabled',
        'pass',
        'Dependency scanning is configured'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Dependency Scanning Enabled',
        'warning',
        'Dependency scanning is not configured',
        'Add template: include: - template: Security/Dependency-Scanning.gitlab-ci.yml'
      ));
    }

    // Check for container scanning
    if (cicdContent.includes('container_scanning') || cicdContent.includes('Container-Scanning')) {
      checks.push(createCheck(
        category,
        'Container Scanning Enabled',
        'pass',
        'Container scanning is configured'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Container Scanning Enabled',
        'info',
        'Container scanning is not configured',
        'If using containers, add: include: - template: Security/Container-Scanning.gitlab-ci.yml'
      ));
    }

    // Check for secret detection
    if (cicdContent.includes('secret_detection') || cicdContent.includes('Secret-Detection')) {
      checks.push(createCheck(
        category,
        'Secret Detection Enabled',
        'pass',
        'Secret detection is configured'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Secret Detection Enabled',
        'warning',
        'Secret detection is not configured',
        'Add template: include: - template: Security/Secret-Detection.gitlab-ci.yml'
      ));
    }

  } catch (error: any) {
    checks.push(createCheck(
      category,
      'Security Scanning Check',
      'fail',
      `Failed to check CI/CD configuration: ${error.message}`
    ));
  }

  return checks;
}

async function auditDORAMetrics(projectId: string): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];
  const category = 'DORA Metrics';

  try {
    // Check if DORA metrics are available (GitLab Ultimate feature)
    const project = await gitlab.Projects.show(projectId);

    // Check for deployment frequency tracking
    const cicdFile = await gitlab.RepositoryFiles.show(projectId, '.gitlab-ci.yml', 'HEAD');
    const cicdContent = Buffer.from(cicdFile.content, 'base64').toString('utf-8');

    if (cicdContent.includes('environment:') || cicdContent.includes('deployment')) {
      checks.push(createCheck(
        category,
        'Deployment Tracking Configured',
        'pass',
        'Environment deployments are configured for DORA tracking'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Deployment Tracking Configured',
        'warning',
        'No deployment environments configured',
        'Configure environments in .gitlab-ci.yml to track deployment frequency'
      ));
    }

    // Check for incident management
    if (project.issues_enabled) {
      checks.push(createCheck(
        category,
        'Issues Enabled',
        'pass',
        'Issues are enabled for incident tracking'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Issues Enabled',
        'warning',
        'Issues are disabled',
        'Enable issues: Settings > General > Visibility > Issues'
      ));
    }

    // Check for merge request metrics
    if (project.merge_requests_enabled) {
      checks.push(createCheck(
        category,
        'Merge Requests Enabled',
        'pass',
        'Merge requests enabled for lead time tracking'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Merge Requests Enabled',
        'fail',
        'Merge requests are disabled',
        'Enable merge requests: Settings > General > Visibility > Merge requests'
      ));
    }

    checks.push(createCheck(
      category,
      'DORA Metrics Dashboard',
      'info',
      'View DORA metrics: Analytics > CI/CD Analytics',
      'DORA metrics require GitLab Ultimate'
    ));

  } catch (error: any) {
    checks.push(createCheck(
      category,
      'DORA Metrics Check',
      'info',
      `Could not fully verify DORA metrics setup: ${error.message}`,
      'DORA metrics are a GitLab Ultimate feature'
    ));
  }

  return checks;
}

async function auditSecurityPolicies(projectId: string): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];
  const category = 'Security Policies';

  try {
    const project = await gitlab.Projects.show(projectId);

    // Check for security policies project (modern approach)
    // Security policies are stored in a separate project linked via .gitlab/security-policies/policy.yml
    try {
      const policyFile = await gitlab.RepositoryFiles.show(projectId, '.gitlab/security-policies/policy.yml', 'HEAD');
      const policyContent = Buffer.from(policyFile.content, 'base64').toString('utf-8');

      // Check for scan execution policies
      if (policyContent.includes('scan_execution_policy:')) {
        checks.push(createCheck(
          category,
          'Scan Execution Policies',
          'pass',
          'Scan execution policies are defined to enforce security scans'
        ));

        // Check specific scan types
        if (policyContent.includes('scan: sast')) {
          checks.push(createCheck(category, 'SAST Policy', 'pass', 'SAST enforcement policy configured'));
        }
        if (policyContent.includes('scan: secret_detection')) {
          checks.push(createCheck(category, 'Secret Detection Policy', 'pass', 'Secret detection enforcement policy configured'));
        }
        if (policyContent.includes('scan: dependency_scanning')) {
          checks.push(createCheck(category, 'Dependency Scanning Policy', 'pass', 'Dependency scanning enforcement policy configured'));
        }
        if (policyContent.includes('scan: container_scanning')) {
          checks.push(createCheck(category, 'Container Scanning Policy', 'pass', 'Container scanning enforcement policy configured'));
        }
      } else {
        checks.push(createCheck(
          category,
          'Scan Execution Policies',
          'warning',
          'No scan execution policies found',
          'Add scan_execution_policy to enforce security scans: Secure > Policies > New policy'
        ));
      }

      // Check for scan result policies (approval gates)
      if (policyContent.includes('scan_result_policy:')) {
        checks.push(createCheck(
          category,
          'Scan Result Policies',
          'pass',
          'Scan result policies are defined to block vulnerable code'
        ));

        if (policyContent.includes('vulnerabilities_allowed: 0')) {
          checks.push(createCheck(
            category,
            'Zero Vulnerability Policy',
            'pass',
            'Zero-tolerance vulnerability policy configured for critical findings'
          ));
        }
      } else {
        checks.push(createCheck(
          category,
          'Scan Result Policies',
          'warning',
          'No scan result policies found',
          'Add scan_result_policy to require approvals for vulnerabilities'
        ));
      }

      // Check for pipeline execution policies
      if (policyContent.includes('pipeline_execution_policy:')) {
        checks.push(createCheck(
          category,
          'Pipeline Execution Policies',
          'pass',
          'Pipeline execution policies inject compliance jobs'
        ));
      }

    } catch {
      // Check if linked to group security policies project
      checks.push(createCheck(
        category,
        'Security Policies',
        'info',
        'No local security policies found - may be inherited from group',
        'Configure policies: Secure > Policies or link to group security-policies project'
      ));
    }

    // Check for merge trains (still relevant)
    if (project.merge_trains_enabled) {
      checks.push(createCheck(
        category,
        'Merge Trains Enabled',
        'pass',
        'Merge trains are enabled for better pipeline efficiency'
      ));
    } else {
      checks.push(createCheck(
        category,
        'Merge Trains Enabled',
        'info',
        'Merge trains are not enabled',
        'Enable: Settings > Merge requests > Merge trains (Premium/Ultimate)'
      ));
    }

    // Check for code owners
    try {
      await gitlab.RepositoryFiles.show(projectId, 'CODEOWNERS', 'HEAD');
      checks.push(createCheck(
        category,
        'Code Owners Defined',
        'pass',
        'CODEOWNERS file exists for code review requirements'
      ));
    } catch {
      checks.push(createCheck(
        category,
        'Code Owners Defined',
        'info',
        'No CODEOWNERS file found',
        'Create CODEOWNERS file to define code ownership'
      ));
    }

  } catch (error: any) {
    checks.push(createCheck(
      category,
      'Security Policies Check',
      'info',
      `Could not check security policies: ${error.message}`,
      'Security policies require GitLab Ultimate'
    ));
  }

  return checks;
}

async function auditPipelineConfiguration(projectId: string): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];
  const category = 'Pipeline Configuration';

  try {
    // Check for CI/CD configuration
    const cicdFile = await gitlab.RepositoryFiles.show(projectId, '.gitlab-ci.yml', 'HEAD');
    checks.push(createCheck(
      category,
      'CI/CD Configuration',
      'pass',
      '.gitlab-ci.yml file exists and is configured'
    ));

    // Get recent pipelines
    const pipelines = await gitlab.Pipelines.all(projectId, { perPage: 10 });
    if (pipelines && pipelines.length > 0) {
      const successCount = pipelines.filter((p: any) => p.status === 'success').length;
      const failCount = pipelines.filter((p: any) => p.status === 'failed').length;

      checks.push(createCheck(
        category,
        'Pipeline Activity',
        'pass',
        `Recent pipelines: ${successCount} passed, ${failCount} failed out of last ${pipelines.length}`
      ));

      const successRate = (successCount / pipelines.length) * 100;
      if (successRate >= 80) {
        checks.push(createCheck(
          category,
          'Pipeline Success Rate',
          'pass',
          `${successRate.toFixed(1)}% success rate`
        ));
      } else if (successRate >= 60) {
        checks.push(createCheck(
          category,
          'Pipeline Success Rate',
          'warning',
          `${successRate.toFixed(1)}% success rate - consider improving pipeline stability`
        ));
      } else {
        checks.push(createCheck(
          category,
          'Pipeline Success Rate',
          'fail',
          `${successRate.toFixed(1)}% success rate - pipeline needs attention`,
          'Review failing jobs and fix underlying issues'
        ));
      }
    } else {
      checks.push(createCheck(
        category,
        'Pipeline Activity',
        'warning',
        'No recent pipeline runs found',
        'Ensure pipelines are running on commits'
      ));
    }

  } catch (error: any) {
    checks.push(createCheck(
      category,
      'Pipeline Configuration Check',
      'fail',
      `Failed to check pipeline configuration: ${error.message}`
    ));
  }

  return checks;
}

// Main audit function
async function runAudit(projectId: string): Promise<AuditReport> {
  console.log(`\nRunning GitLab Ultimate Compliance Audit\n`);
  console.log(`Project: ${projectId}`);
  console.log(`GitLab Host: ${GITLAB_HOST}`);
  console.log(`Token: ${TOKEN?.substring(0, 10) || 'NOT SET'}...\n`);

  // Get project info
  const project = await gitlab.Projects.show(projectId);
  console.log(`Project Name: ${project.name}`);
  console.log(`Project Path: ${project.path_with_namespace}\n`);

  const checks: ComplianceCheck[] = [];

  // Run all audit checks
  console.log('Running audit checks...\n');

  checks.push(...await auditProtectedBranches(projectId));
  checks.push(...await auditMergeRequestApprovals(projectId));
  checks.push(...await auditSecurityScanning(projectId));
  checks.push(...await auditDORAMetrics(projectId));
  checks.push(...await auditSecurityPolicies(projectId));
  checks.push(...await auditPipelineConfiguration(projectId));

  // Calculate summary
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'pass').length,
    failed: checks.filter(c => c.status === 'fail').length,
    warnings: checks.filter(c => c.status === 'warning').length,
  };

  // Determine overall status
  let overallStatus: 'compliant' | 'non-compliant' | 'partial';
  if (summary.failed === 0 && summary.warnings === 0) {
    overallStatus = 'compliant';
  } else if (summary.failed > 0) {
    overallStatus = 'non-compliant';
  } else {
    overallStatus = 'partial';
  }

  return {
    projectId: project.path_with_namespace,
    projectName: project.name,
    auditDate: new Date().toISOString(),
    overallStatus,
    checks,
    summary,
  };
}

// Display functions
function displayReport(report: AuditReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('COMPLIANCE AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`Project: ${report.projectName} (${report.projectId})`);
  console.log(`Date: ${new Date(report.auditDate).toLocaleString()}`);
  console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
  console.log('='.repeat(80));

  // Group checks by category
  const categories = [...new Set(report.checks.map(c => c.category))];

  for (const category of categories) {
    console.log(`\n${category}`);
    console.log('-'.repeat(80));

    const categoryChecks = report.checks.filter(c => c.category === category);
    for (const check of categoryChecks) {
      console.log(`${getStatusIcon(check.status)} ${check.check}`);
      console.log(`   ${check.message}`);
      if (check.remediation) {
        console.log(`   TIP: ${check.remediation}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Checks: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  console.log(`Info: ${report.summary.total - report.summary.passed - report.summary.failed - report.summary.warnings}`);
  console.log('='.repeat(80) + '\n');
}

function saveReport(report: AuditReport, filename: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = filename || `compliance-audit-${report.projectId.replace('/', '-')}-${timestamp}.json`;

  writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${outputFile}`);
}

// Main execution
async function main() {
  const projectId = process.argv[2] || DEFAULT_PROJECT;
  const outputFile = process.argv[3];

  try {
    const report = await runAudit(projectId);
    displayReport(report);
    saveReport(report, outputFile);

    // Exit with appropriate code
    if (report.overallStatus === 'non-compliant') {
      console.log('WARNING: Project has compliance issues that need attention\n');
      process.exit(1);
    } else if (report.overallStatus === 'partial') {
      console.log('WARNING: Project is partially compliant - review warnings\n');
      process.exit(0);
    } else {
      console.log('Project is fully compliant!\n');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\nAudit failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
