#!/usr/bin/env tsx
/**
 * Manage Merge Requests for a specific milestone
 * Helps clean up and organize MRs for controlled releases
 */

import { Gitlab } from '@gitbeaker/node';
import { Command } from 'commander';

const gitlab = new Gitlab({
  token: process.env.GITLAB_TOKEN || process.env.GITLAB_ACCESS_TOKEN,
  host: 'https://gitlab.com',
});

const PROJECT_ID = '76265294'; // blueflyio/openstandardagents

interface MRInfo {
  iid: number;
  title: string;
  state: string;
  target_branch: string;
  source_branch: string;
  milestone?: { title: string };
  has_conflicts: boolean;
  merge_status: string;
  web_url: string;
}

async function listMRsInMilestone(milestone: string) {
  console.log(`\n[LIST] Listing MRs in milestone: ${milestone}\n`);

  const mrs = await gitlab.MergeRequests.all({
    projectId: PROJECT_ID,
    state: 'opened',
    milestone,
  });

  if (mrs.length === 0) {
    console.log('No open MRs found in this milestone.');
    return;
  }

  console.log(`Found ${mrs.length} open MRs:\n`);

  for (const mr of mrs) {
    const status = mr.has_conflicts ? '[FAIL] CONFLICTS' : '[PASS] Clean';
    const target = mr.target_branch === 'development' ? '[PASS] dev' : `[WARN]  ${mr.target_branch}`;
    
    console.log(`!${mr.iid}: ${mr.title}`);
    console.log(`   Target: ${target} | Status: ${status}`);
    console.log(`   ${mr.web_url}\n`);
  }
}

async function listMRsNotInMilestone(milestone: string) {
  console.log(`\n[LIST] Listing open MRs NOT in milestone: ${milestone}\n`);

  const allMRs = await gitlab.MergeRequests.all({
    projectId: PROJECT_ID,
    state: 'opened',
  });

  const outsideMRs = allMRs.filter(
    (mr: any) => !mr.milestone || mr.milestone.title !== milestone
  );

  if (outsideMRs.length === 0) {
    console.log('All open MRs are in the milestone.');
    return;
  }

  console.log(`Found ${outsideMRs.length} MRs outside milestone:\n`);

  for (const mr of outsideMRs) {
    const milestoneText = mr.milestone ? mr.milestone.title : 'No milestone';
    console.log(`!${mr.iid}: ${mr.title}`);
    console.log(`   Milestone: ${milestoneText}`);
    console.log(`   Target: ${mr.target_branch}`);
    console.log(`   ${mr.web_url}\n`);
  }
}

async function retargetMR(mrId: number, targetBranch: string) {
  console.log(`\n[TARGET] Retargeting MR !${mrId} to ${targetBranch}...\n`);

  try {
    await gitlab.MergeRequests.edit(PROJECT_ID, mrId, {
      target_branch: targetBranch,
    });

    console.log(`[PASS] Successfully retargeted MR !${mrId} to ${targetBranch}`);
  } catch (error: any) {
    console.error(`[FAIL] Failed to retarget MR: ${error.message}`);
    process.exit(1);
  }
}

async function closeMR(mrId: number, reason: string) {
  console.log(`\n[BLOCK] Closing MR !${mrId}...\n`);

  try {
    // Add comment explaining closure
    await gitlab.MergeRequestNotes.create(PROJECT_ID, mrId, {
      body: `Closing this MR: ${reason}\n\nIf this work is still needed, please rebase and assign to the appropriate milestone.`,
    });

    // Close the MR
    await gitlab.MergeRequests.edit(PROJECT_ID, mrId, {
      state_event: 'close',
    });

    console.log(`[PASS] Successfully closed MR !${mrId}`);
  } catch (error: any) {
    console.error(`[FAIL] Failed to close MR: ${error.message}`);
    process.exit(1);
  }
}

async function rebaseMR(mrId: number) {
  console.log(`\n[SYNC] Rebasing MR !${mrId}...\n`);

  try {
    await gitlab.MergeRequests.rebase(PROJECT_ID, mrId);
    console.log(`[PASS] Rebase initiated for MR !${mrId}`);
    console.log('   Check the MR page for rebase status.');
  } catch (error: any) {
    console.error(`[FAIL] Failed to rebase MR: ${error.message}`);
    process.exit(1);
  }
}

async function assignMilestone(mrId: number, milestone: string) {
  console.log(`\n[TAG]  Assigning MR !${mrId} to milestone ${milestone}...\n`);

  try {
    // Get milestone ID
    const milestones = await gitlab.ProjectMilestones.all(PROJECT_ID);
    const targetMilestone = milestones.find((m: any) => m.title === milestone);

    if (!targetMilestone) {
      throw new Error(`Milestone "${milestone}" not found`);
    }

    await gitlab.MergeRequests.edit(PROJECT_ID, mrId, {
      milestone_id: targetMilestone.id,
    });

    console.log(`[PASS] Successfully assigned MR !${mrId} to milestone ${milestone}`);
  } catch (error: any) {
    console.error(`[FAIL] Failed to assign milestone: ${error.message}`);
    process.exit(1);
  }
}

async function bulkRetarget(milestone: string, targetBranch: string) {
  console.log(`\n[TARGET] Bulk retargeting all MRs in ${milestone} to ${targetBranch}...\n`);

  const mrs = await gitlab.MergeRequests.all({
    projectId: PROJECT_ID,
    state: 'opened',
    milestone,
  });

  console.log(`Found ${mrs.length} MRs to retarget\n`);

  for (const mr of mrs) {
    if (mr.target_branch !== targetBranch) {
      console.log(`Retargeting !${mr.iid}: ${mr.title}`);
      await retargetMR(mr.iid, targetBranch);
    } else {
      console.log(`Skipping !${mr.iid}: already targets ${targetBranch}`);
    }
  }

  console.log(`\n[PASS] Bulk retarget complete`);
}

async function bulkRebase(milestone: string) {
  console.log(`\n[SYNC] Bulk rebasing all MRs in ${milestone}...\n`);

  const mrs = await gitlab.MergeRequests.all({
    projectId: PROJECT_ID,
    state: 'opened',
    milestone,
  });

  console.log(`Found ${mrs.length} MRs to rebase\n`);

  for (const mr of mrs) {
    if (mr.has_conflicts) {
      console.log(`Rebasing !${mr.iid}: ${mr.title} (has conflicts)`);
      await rebaseMR(mr.iid);
      // Wait a bit between rebases
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      console.log(`Skipping !${mr.iid}: no conflicts`);
    }
  }

  console.log(`\n[PASS] Bulk rebase complete`);
}

// CLI
const program = new Command();

program
  .name('manage-milestone-mrs')
  .description('Manage merge requests for milestone-based releases')
  .version('1.0.0');

program
  .command('list')
  .description('List all MRs in a milestone')
  .requiredOption('-m, --milestone <milestone>', 'Milestone name (e.g., v0.2.6)')
  .action(async (options) => {
    await listMRsInMilestone(options.milestone);
  });

program
  .command('list-outside')
  .description('List all MRs NOT in a milestone')
  .requiredOption('-m, --milestone <milestone>', 'Milestone name (e.g., v0.2.6)')
  .action(async (options) => {
    await listMRsNotInMilestone(options.milestone);
  });

program
  .command('retarget')
  .description('Retarget an MR to a different branch')
  .requiredOption('-i, --id <id>', 'MR ID (e.g., 123)')
  .requiredOption('-t, --target <branch>', 'Target branch (e.g., development)')
  .action(async (options) => {
    await retargetMR(parseInt(options.id), options.target);
  });

program
  .command('close')
  .description('Close an MR with a reason')
  .requiredOption('-i, --id <id>', 'MR ID (e.g., 123)')
  .requiredOption('-r, --reason <reason>', 'Reason for closing')
  .action(async (options) => {
    await closeMR(parseInt(options.id), options.reason);
  });

program
  .command('rebase')
  .description('Rebase an MR')
  .requiredOption('-i, --id <id>', 'MR ID (e.g., 123)')
  .action(async (options) => {
    await rebaseMR(parseInt(options.id));
  });

program
  .command('assign')
  .description('Assign an MR to a milestone')
  .requiredOption('-i, --id <id>', 'MR ID (e.g., 123)')
  .requiredOption('-m, --milestone <milestone>', 'Milestone name (e.g., v0.2.6)')
  .action(async (options) => {
    await assignMilestone(parseInt(options.id), options.milestone);
  });

program
  .command('bulk-retarget')
  .description('Retarget all MRs in a milestone to a branch')
  .requiredOption('-m, --milestone <milestone>', 'Milestone name (e.g., v0.2.6)')
  .requiredOption('-t, --target <branch>', 'Target branch (e.g., development)')
  .action(async (options) => {
    await bulkRetarget(options.milestone, options.target);
  });

program
  .command('bulk-rebase')
  .description('Rebase all MRs with conflicts in a milestone')
  .requiredOption('-m, --milestone <milestone>', 'Milestone name (e.g., v0.2.6)')
  .action(async (options) => {
    await bulkRebase(options.milestone);
  });

program.parse();
