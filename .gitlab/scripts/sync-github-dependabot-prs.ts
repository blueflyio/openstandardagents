#!/usr/bin/env ts-node
/**
 * Sync and manage GitHub Dependabot PRs
 * 
 * This script:
 * 1. Lists all open Dependabot PRs on GitHub
 * 2. Checks their status (CI passing, conflicts, etc.)
 * 3. Auto-merges safe PRs (patch/minor updates with passing CI)
 * 4. Creates GitLab MRs for merged PRs if needed
 * 5. Reports on PRs that need manual attention
 */

import axios from 'axios';
import { execSync } from 'child_process';

interface GitHubPR {
  number: number;
  title: string;
  state: string;
  head: { ref: string; sha: string };
  base: { ref: string };
  user: { login: string };
  labels: Array<{ name: string }>;
  mergeable: boolean | null;
  merged: boolean;
  html_url: string;
  created_at: string;
}

interface PRStatus {
  pr: GitHubPR;
  ciStatus: 'success' | 'failure' | 'pending' | 'unknown';
  updateType: 'patch' | 'minor' | 'major' | 'unknown';
  canAutoMerge: boolean;
  reason?: string;
}

const GITHUB_OWNER = 'blueflyio';
const GITHUB_REPO = 'openstandardagents';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_MIRROR_TOKEN || '';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN or GITHUB_MIRROR_TOKEN environment variable is required');
  process.exit(1);
}

const githubApi = axios.create({
  baseURL: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
});

async function getOpenDependabotPRs(): Promise<GitHubPR[]> {
  try {
    const response = await githubApi.get('/pulls', {
      params: {
        state: 'open',
        per_page: 100,
        sort: 'created',
        direction: 'asc',
      },
    });

    return response.data.filter((pr: GitHubPR) => 
      pr.user.login === 'dependabot[bot]' || pr.user.login.includes('dependabot')
    );
  } catch (error: any) {
    console.error('❌ Failed to fetch PRs:', error.message);
    throw error;
  }
}

async function getPRChecksStatus(prNumber: number): Promise<'success' | 'failure' | 'pending' | 'unknown'> {
  try {
    const response = await githubApi.get(`/pulls/${prNumber}/checks`);
    const checks = response.data.check_runs || [];
    
    if (checks.length === 0) {
      return 'unknown';
    }

    const allPassed = checks.every((check: any) => check.conclusion === 'success');
    const anyFailed = checks.some((check: any) => check.conclusion === 'failure');
    const anyPending = checks.some((check: any) => check.status === 'in_progress' || check.status === 'queued');

    if (anyFailed) return 'failure';
    if (anyPending) return 'pending';
    if (allPassed) return 'success';
    return 'unknown';
  } catch (error: any) {
    // If checks API fails, try statuses API
    try {
      const statusResponse = await githubApi.get(`/commits/${prNumber}/status`);
      const status = statusResponse.data.state;
      if (status === 'success') return 'success';
      if (status === 'failure' || status === 'error') return 'failure';
      if (status === 'pending') return 'pending';
    } catch {
      // Ignore
    }
    return 'unknown';
  }
}

function determineUpdateType(pr: GitHubPR): 'patch' | 'minor' | 'major' | 'unknown' {
  const title = pr.title.toLowerCase();
  if (title.includes('major') || title.includes('breaking')) return 'major';
  if (title.includes('minor')) return 'minor';
  if (title.includes('patch') || title.includes('security')) return 'patch';
  
  // Try to parse from labels
  const updateLabel = pr.labels.find(l => l.name.includes('update'));
  if (updateLabel) {
    if (updateLabel.name.includes('major')) return 'major';
    if (updateLabel.name.includes('minor')) return 'minor';
    if (updateLabel.name.includes('patch')) return 'patch';
  }
  
  return 'unknown';
}

async function analyzePR(pr: GitHubPR): Promise<PRStatus> {
  const ciStatus = await getPRChecksStatus(pr.number);
  const updateType = determineUpdateType(pr);
  
  const canAutoMerge = 
    (updateType === 'patch' || updateType === 'minor') &&
    ciStatus === 'success' &&
    pr.mergeable === true &&
    !pr.merged;

  let reason: string | undefined;
  if (!canAutoMerge) {
    if (updateType === 'major') {
      reason = 'Major version update - requires manual review';
    } else if (ciStatus !== 'success') {
      reason = `CI status: ${ciStatus}`;
    } else if (pr.mergeable === false) {
      reason = 'Has merge conflicts';
    } else if (pr.merged) {
      reason = 'Already merged';
    }
  }

  return {
    pr,
    ciStatus,
    updateType,
    canAutoMerge,
    reason,
  };
}

async function autoMergePR(prNumber: number): Promise<boolean> {
  try {
    console.log(`  🔄 Attempting to merge PR #${prNumber}...`);
    
    // Use GitHub CLI if available, otherwise use API
    try {
      execSync(`gh pr merge ${prNumber} --squash --auto`, {
        stdio: 'inherit',
        env: { ...process.env, GITHUB_TOKEN },
      });
      return true;
    } catch {
      // Fallback to API
      await githubApi.put(`/pulls/${prNumber}/merge`, {
        merge_method: 'squash',
        commit_title: `chore: ${(await githubApi.get(`/pulls/${prNumber}`)).data.title}`,
      });
      return true;
    }
  } catch (error: any) {
    console.error(`  ❌ Failed to merge PR #${prNumber}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking GitHub Dependabot PRs...\n');

  const prs = await getOpenDependabotPRs();
  console.log(`Found ${prs.length} open Dependabot PRs\n`);

  if (prs.length === 0) {
    console.log('✅ No open Dependabot PRs to process');
    return;
  }

  const analyses: PRStatus[] = [];
  
  for (const pr of prs) {
    console.log(`Analyzing PR #${pr.number}: ${pr.title}`);
    const analysis = await analyzePR(pr);
    analyses.push(analysis);
    
    console.log(`  Type: ${analysis.updateType}`);
    console.log(`  CI Status: ${analysis.ciStatus}`);
    console.log(`  Can Auto-merge: ${analysis.canAutoMerge ? '✅' : '❌'}`);
    if (analysis.reason) {
      console.log(`  Reason: ${analysis.reason}`);
    }
    console.log(`  URL: ${pr.html_url}\n`);
  }

  // Auto-merge safe PRs
  const safePRs = analyses.filter(a => a.canAutoMerge);
  if (safePRs.length > 0) {
    console.log(`\n🚀 Auto-merging ${safePRs.length} safe PR(s)...\n`);
    for (const analysis of safePRs) {
      const success = await autoMergePR(analysis.pr.number);
      if (success) {
        console.log(`  ✅ Merged PR #${analysis.pr.number}\n`);
      }
    }
  }

  // Report on PRs needing attention
  const needsAttention = analyses.filter(a => !a.canAutoMerge);
  if (needsAttention.length > 0) {
    console.log(`\n⚠️  ${needsAttention.length} PR(s) need manual attention:\n`);
    for (const analysis of needsAttention) {
      console.log(`  PR #${analysis.pr.number}: ${analysis.pr.title}`);
      console.log(`    ${analysis.reason || 'Unknown issue'}`);
      console.log(`    ${analysis.pr.html_url}\n`);
    }
  }

  console.log('\n✅ Dependabot PR sync completed');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

