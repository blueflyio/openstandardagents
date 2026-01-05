#!/usr/bin/env node
/**
 * Bot: Security Scanner Agent
 * Scans code changes for security vulnerabilities and exposed secrets
 */

const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
const PROJECT_ID = process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID || '';
const MR_IID = process.env.CI_MERGE_REQUEST_IID || '';

interface SecurityIssue {
  type: 'secret' | 'vulnerability' | 'injection' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  message: string;
}

const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
  /secret\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
  /password\s*[:=]\s*['"]?[a-zA-Z0-9]{8,}['"]?/i,
  /token\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
  /glpat-[a-zA-Z0-9_-]+/i,
  /ghp_[a-zA-Z0-9_-]+/i,
  /sk-[a-zA-Z0-9_-]+/i
];

async function getMRChanges(): Promise<any[]> {
  const response = await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests/${MR_IID}/changes`, {
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch MR changes: ${response.statusText}`);
  }

  const data = await response.json();
  return data.changes || [];
}

function scanForSecrets(content: string, file: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({
          type: 'secret',
          severity: 'critical',
          file,
          line: i + 1,
          message: `Potential secret exposure detected: ${line.trim().substring(0, 50)}...`
        });
      }
    }
  }

  return issues;
}

function scanForInjection(content: string, file: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  const injectionPatterns = [
    /eval\s*\(/i,
    /exec\s*\(/i,
    /Function\s*\(/i,
    /\$\{[^}]*\$\{/,
    /innerHTML\s*=/i
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of injectionPatterns) {
      if (pattern.test(line)) {
        issues.push({
          type: 'injection',
          severity: 'high',
          file,
          line: i + 1,
          message: `Potential code injection risk: ${line.trim().substring(0, 50)}...`
        });
      }
    }
  }

  return issues;
}

async function blockMR(reason: string): Promise<void> {
  const response = await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests/${MR_IID}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      blocking_discussions_resolved: false
    })
  });

  if (response.ok) {
    console.log(`🚨 Blocked MR: ${reason}`);
  }
}

async function postComment(issues: SecurityIssue[]): Promise<void> {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');

  let comment = '## 🔒 Security Scan Results\n\n';

  if (criticalIssues.length > 0) {
    comment += '### 🚨 Critical Issues (Blocking)\n\n';
    criticalIssues.forEach(issue => {
      comment += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
    });
    comment += '\n';
  }

  if (highIssues.length > 0) {
    comment += '### ⚠️ High Severity Issues\n\n';
    highIssues.forEach(issue => {
      comment += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
    });
  }

  if (issues.length === 0) {
    comment += '✅ No security issues detected';
  }

  await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests/${MR_IID}/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      body: comment
    })
  });
}

async function scanSecurity(): Promise<void> {
  if (!GITLAB_TOKEN || !PROJECT_ID || !MR_IID) {
    throw new Error('GITLAB_TOKEN, PROJECT_ID, and MR_IID are required');
  }

  console.log(`Scanning MR !${MR_IID} for security issues...`);

  const changes = await getMRChanges();
  const allIssues: SecurityIssue[] = [];

  for (const change of changes) {
    if (change.new_file || change.renamed_file || change.deleted_file) {
      continue;
    }

    const content = change.diff || '';
    const file = change.new_path || change.old_path || '';

    allIssues.push(...scanForSecrets(content, file));
    allIssues.push(...scanForInjection(content, file));
  }

  await postComment(allIssues);

  const criticalIssues = allIssues.filter(i => i.severity === 'critical');
  
  if (criticalIssues.length > 0) {
    await blockMR(`${criticalIssues.length} critical security issues detected`);
    console.error(`\n❌ Found ${criticalIssues.length} critical security issues`);
    process.exit(1);
  }

  console.log(`\n✅ Security scan complete: ${allIssues.length} issues found (none critical)`);
}

if (require.main === module) {
  scanSecurity().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { scanSecurity };
