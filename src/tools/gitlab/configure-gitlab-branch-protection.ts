#!/usr/bin/env tsx
/**
 * Configure GitLab Branch Protection Rules
 * Sets up protection for main and development branches via GitLab API
 */

import { Gitlab } from '@gitbeaker/rest';

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

interface ProtectionRule {
  name: string;
  push_access_levels?: Array<{ access_level: number }>;
  merge_access_levels?: Array<{ access_level: number }>;
  allow_force_push?: boolean;
  allowed_to_push?: Array<{ user_id?: number; group_id?: number }>;
  allowed_to_merge?: Array<{ user_id?: number; group_id?: number }>;
}

async function protectBranch(branch: string, rules: ProtectionRule): Promise<void> {
  try {
    console.log(`\n[LOCK] Protecting branch: ${branch}`);
    
    // Check if branch is already protected
    const existing = await gitlab.ProtectedBranches.all(PROJECT_ID);
    const isProtected = existing.some((pb: any) => pb.name === branch);
    
    if (isProtected) {
      console.log(`  [WARN]  ${branch} is already protected. Updating...`);
      await gitlab.ProtectedBranches.unprotect(PROJECT_ID, branch);
    }
    
    // Protect the branch
    await gitlab.ProtectedBranches.protect(PROJECT_ID, branch, {
      pushAccessLevel: 0, // No one can push
      mergeAccessLevel: 40, // Maintainers can merge
      allowForcePush: false,
    });
    
    console.log(`  [PASS] ${branch} protected successfully`);
    console.log(`     - Push: Blocked (no direct pushes)`);
    console.log(`     - Merge: Maintainers only (via MR)`);
    console.log(`     - Force push: Disabled`);
  } catch (error: any) {
    console.error(`  [FAIL] Failed to protect ${branch}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('[LOCK] Configuring GitLab Branch Protection Rules\n');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Token: ${TOKEN?.substring(0, 10) || 'NOT SET'}...`);
  
  try {
    // Protect main branch
    await protectBranch('main', {
      name: 'main',
      pushAccessLevel: 0, // No one
      mergeAccessLevel: 40, // Maintainers
      allowForcePush: false,
    });
    
    // Protect development branch
    await protectBranch('development', {
      name: 'development',
      pushAccessLevel: 0, // No one
      mergeAccessLevel: 40, // Maintainers
      allowForcePush: false,
    });
    
    console.log('\n[PASS] Branch protection configured successfully!');
    console.log('\nProtected branches:');
    console.log('  - main: No direct pushes, MR required');
    console.log('  - development: No direct pushes, MR required');
    console.log('\nView in GitLab:');
    console.log(`  https://gitlab.com/${PROJECT_ID}/-/settings/repository#protected-branches`);
  } catch (error: any) {
    console.error('\n[FAIL] Error configuring branch protection:', error.message);
    process.exit(1);
  }
}

main();
