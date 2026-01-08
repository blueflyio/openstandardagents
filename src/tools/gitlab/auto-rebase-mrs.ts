#!/usr/bin/env tsx
/**
 * Auto-rebase all open MRs onto their target branches
 * Runs in CI or manually to keep MRs up to date
 */

import { Gitlab } from '@gitbeaker/rest';
import { execSync } from 'child_process';

const PROJECT_ID = 'blueflyio/openstandardagents';
const TOKEN = process.env.GITLAB_TOKEN || process.env.SERVICE_ACCOUNT_OSSA_TOKEN || process.env.GITLAB_PUSH_TOKEN;

if (!TOKEN) {
  console.error('[FAIL] Error: GITLAB_TOKEN or SERVICE_ACCOUNT_OSSA_TOKEN required');
  process.exit(1);
}

const gitlab = new Gitlab({
  host: 'https://gitlab.com',
  token: TOKEN,
});

async function rebaseMR(mr: any): Promise<boolean> {
  const { iid, source_branch, target_branch, merge_status } = mr;
  
  console.log(`\n[SYNC] Rebasing MR !${iid}: ${source_branch} -> ${target_branch}`);
  
  try {
    // Fetch branches
    execSync(`git fetch origin ${source_branch} ${target_branch}`, { stdio: 'inherit' });
    
    // Check if behind
    const behind = execSync(
      `git rev-list --count origin/${target_branch}..origin/${source_branch} 2>/dev/null || echo 0`
    ).toString().trim();
    
    if (behind === '0') {
      console.log(`  [PASS] Already up to date`);
      return true;
    }
    
    console.log(`  [WARN]  ${behind} commits behind, rebasing...`);
    
    // Create worktree
    const worktreePath = `../rebase-${iid}-${source_branch.replace(/\//g, '-')}`;
    try {
      execSync(`git worktree remove ${worktreePath}`, { stdio: 'ignore' });
    } catch {
      // Worktree may not exist
    }
    
    execSync(`git worktree add ${worktreePath} origin/${source_branch}`, { stdio: 'inherit' });
    
    // Rebase
    try {
      execSync(`cd ${worktreePath} && git rebase origin/${target_branch}`, { stdio: 'inherit' });
      
      // Push
      execSync(`cd ${worktreePath} && git push origin ${source_branch} --force-with-lease`, { stdio: 'inherit' });
      
      console.log(`  [PASS] Rebased and pushed successfully`);
      
      // Cleanup
      execSync(`git worktree remove ${worktreePath}`, { stdio: 'ignore' });
      
      return true;
    } catch (error) {
      console.error(`  [FAIL] Rebase failed - conflicts may exist`);
      console.error(`  Worktree: ${worktreePath}`);
      return false;
    }
  } catch (error: any) {
    console.error(`  [FAIL] Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('[SYNC] Auto-rebasing all open MRs\n');
  
  try {
    const mrs = await gitlab.MergeRequests.all({
      projectId: PROJECT_ID,
      state: 'opened',
      perPage: 20,
    });
    
    console.log(`Found ${mrs.length} open MRs\n`);
    
    const results = await Promise.all(mrs.map(rebaseMR));
    
    const success = results.filter(Boolean).length;
    const failed = results.length - success;
    
    console.log(`\n[PASS] Summary:`);
    console.log(`  Successfully rebased: ${success}`);
    console.log(`  Failed: ${failed}`);
    
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('[FAIL] Error:', error.message);
    process.exit(1);
  }
}

main();
