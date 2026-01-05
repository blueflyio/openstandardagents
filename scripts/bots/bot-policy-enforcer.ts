#!/usr/bin/env node
/**
 * Bot: Policy Enforcement Agent
 * Validates MRs against all project policies
 */

const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
const PROJECT_ID = process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID || '';
const MR_IID = process.env.CI_MERGE_REQUEST_IID || '';

interface PolicyViolation {
  policy: string;
  severity: 'error' | 'warning';
  message: string;
}

async function getMRDetails(): Promise<any> {
  const response = await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests/${MR_IID}`, {
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch MR: ${response.statusText}`);
  }

  return await response.json();
}

async function getMRCommits(): Promise<any[]> {
  const response = await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests/${MR_IID}/commits`, {
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.statusText}`);
  }

  return await response.json();
}

function validateBranchNaming(branch: string): PolicyViolation | null {
  const validPatterns = [
    /^feature\/\d+-[a-z0-9._-]+$/,
    /^bugfix\/[a-z0-9._-]+$/,
    /^hotfix\/[a-z0-9._-]+$/,
    /^chore\/[a-z0-9._-]+$/,
    /^release\/v\d+\.\d+\.x$/,
    /^\d+-[a-z0-9._-]+$/
  ];

  const isValid = validPatterns.some(pattern => pattern.test(branch));

  if (!isValid) {
    return {
      policy: 'branch-naming',
      severity: 'error',
      message: `Branch "${branch}" does not follow naming convention. Expected: feature/{issue#}-{slug}, bugfix/{slug}, etc.`
    };
  }

  return null;
}

function validateCommitMessage(message: string): PolicyViolation | null {
  const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?: .+/;

  if (!conventionalCommitPattern.test(message)) {
    return {
      policy: 'commit-message',
      severity: 'warning',
      message: `Commit message does not follow conventional commit format: "${message}"`
    };
  }

  return null;
}

function validateMRTarget(sourceBranch: string, targetBranch: string): PolicyViolation | null {
  if (sourceBranch.match(/^(feature|bugfix|chore|hotfix)\//)) {
    if (!targetBranch.match(/^release\/v\d+\.\d+\.x$/)) {
      return {
        policy: 'mr-target',
        severity: 'error',
        message: `Feature branches must target release/* branches, not "${targetBranch}"`
      };
    }
  }

  if (sourceBranch.match(/^release\//)) {
    if (targetBranch !== 'main') {
      return {
        policy: 'mr-target',
        severity: 'error',
        message: `Release branches must target main, not "${targetBranch}"`
      };
    }
  }

  return null;
}

function validateIssueLink(mr: any): PolicyViolation | null {
  if (!mr.references?.full?.match(/#\d+/)) {
    return {
      policy: 'issue-link',
      severity: 'error',
      message: 'MR must be linked to a GitLab issue'
    };
  }

  return null;
}

function validateMilestone(mr: any): PolicyViolation | null {
  if (!mr.milestone) {
    return {
      policy: 'milestone',
      severity: 'error',
      message: 'MR must have a milestone assigned'
    };
  }

  return null;
}

async function enforcePolicies(): Promise<void> {
  if (!GITLAB_TOKEN || !PROJECT_ID || !MR_IID) {
    throw new Error('GITLAB_TOKEN, PROJECT_ID, and MR_IID are required');
  }

  console.log(`Validating MR !${MR_IID} against policies...`);

  const mr = await getMRDetails();
  const commits = await getMRCommits();

  const violations: PolicyViolation[] = [];

  violations.push(validateBranchNaming(mr.source_branch) || validateMRTarget(mr.source_branch, mr.target_branch) || validateIssueLink(mr) || validateMilestone(mr));

  for (const commit of commits) {
    const violation = validateCommitMessage(commit.message);
    if (violation) {
      violations.push(violation);
    }
  }

  const errors = violations.filter(v => v?.severity === 'error');
  const warnings = violations.filter(v => v?.severity === 'warning');

  if (errors.length > 0) {
    console.error('\n❌ Policy violations (blocking):');
    errors.forEach(v => console.error(`  - ${v.policy}: ${v.message}`));
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Policy violations (non-blocking):');
    warnings.forEach(v => console.warn(`  - ${v.policy}: ${v.message}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All policies passed');
    process.exit(0);
  }

  if (errors.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  enforcePolicies().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { enforcePolicies };
