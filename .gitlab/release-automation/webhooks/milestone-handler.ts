#!/usr/bin/env node
/**
 * Milestone Webhook Handler
 * Triggered when milestones are created/updated/closed
 * 
 * Actions:
 * - CREATE: Create dev tag, milestone branch, tracking issue
 * - CLOSE: Create RC tag, create MR to main, run validations
 */

import { Gitlab } from '@gitbeaker/rest';

interface MilestoneEvent {
  object_kind: 'milestone';
  project: { id: number; path_with_namespace: string };
  object_attributes: {
    id: number;
    title: string;
    state: 'active' | 'closed';
    created_at: string;
    updated_at: string;
  };
}

const gitlab = new Gitlab({
  token: process.env.GITLAB_TOKEN!,
});

async function handleMilestoneCreate(event: MilestoneEvent) {
  const { project, object_attributes: milestone } = event;
  const version = milestone.title; // e.g., "v0.2.6"
  
  console.log(`📍 Milestone created: ${version}`);
  
  // 1. Create initial dev tag
  const devTag = `${version}-dev.0`;
  await gitlab.Tags.create(project.id, devTag, 'development', {
    message: `Initial dev tag for ${version}`,
  });
  console.log(`✅ Created tag: ${devTag}`);
  
  // 2. Create milestone branch
  const branchName = `milestone/${version}`;
  await gitlab.Branches.create(project.id, branchName, 'development');
  console.log(`✅ Created branch: ${branchName}`);
  
  // 3. Protect milestone branch
  await gitlab.ProtectedBranches.protect(project.id, branchName, {
    push_access_level: 40, // Maintainer
    merge_access_level: 40,
  });
  
  // 4. Create tracking issue
  const issue = await gitlab.Issues.create(project.id, {
    title: `Release ${version}`,
    description: `
## Release Tracking Issue

**Milestone**: ${version}
**Status**: In Development
**Branch**: \`${branchName}\`
**Tag**: \`${devTag}\`

### Checklist
- [ ] All milestone issues resolved
- [ ] Tests passing
- [ ] Security scans passed
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Migration guide (if breaking changes)
- [ ] RC created
- [ ] MR to main created
- [ ] Approvals obtained
- [ ] Released to npm
- [ ] Released to GitHub
- [ ] Website deployed

### Automated Actions
This issue is automatically updated by the release automation system.
    `,
    milestone_id: milestone.id,
    labels: 'release,automation',
  });
  console.log(`✅ Created tracking issue: #${issue.iid}`);
}

async function handleMilestoneClose(event: MilestoneEvent) {
  const { project, object_attributes: milestone } = event;
  const version = milestone.title;
  
  console.log(`🎯 Milestone closed: ${version}`);
  
  // 1. Check all issues are closed
  const openIssues = await gitlab.Issues.all({
    projectId: project.id,
    milestoneId: milestone.id,
    state: 'opened',
  });
  
  if (openIssues.length > 0) {
    console.error(`❌ Cannot create RC: ${openIssues.length} issues still open`);
    return;
  }
  
  // 2. Get latest dev tag number
  const tags = await gitlab.Tags.all(project.id);
  const devTags = tags.filter(t => t.name.startsWith(`${version}-dev.`));
  const latestDevNum = Math.max(...devTags.map(t => 
    parseInt(t.name.split('.').pop()!)
  ));
  
  // 3. Create RC tag
  const rcTag = `${version}-rc.1`;
  await gitlab.Tags.create(project.id, rcTag, 'development', {
    message: `Release candidate for ${version}`,
  });
  console.log(`✅ Created RC tag: ${rcTag}`);
  
  // 4. Create MR: development → main
  const mr = await gitlab.MergeRequests.create(project.id, 
    'development',
    'main',
    `Release ${version}`,
    {
      description: `
## Release ${version}

**RC Tag**: \`${rcTag}\`
**Milestone**: ${version}

### Pre-Release Checklist
- [ ] All CI stages passed
- [ ] Security scans passed
- [ ] Dry-run: npm publish
- [ ] Dry-run: GitHub release
- [ ] Dry-run: Website deploy
- [ ] Technical Lead approval
- [ ] Security Lead approval
- [ ] Product Owner approval
- [ ] Release Manager approval

### Release Actions (Manual Triggers)
After all approvals, use pipeline buttons to:
1. 🚀 Release to npm
2. 🐙 Release to GitHub  
3. 🌐 Deploy Website
4. 📢 Announce Release

**DO NOT MERGE MANUALLY** - This MR will auto-merge after successful release.
      `,
      remove_source_branch: false,
      squash: false,
      labels: 'release,automation',
      milestone_id: milestone.id,
    }
  );
  console.log(`✅ Created MR: !${mr.iid}`);
  
  // 5. Update tracking issue
  const issues = await gitlab.Issues.all({
    projectId: project.id,
    milestoneId: milestone.id,
    labels: 'release,automation',
  });
  
  if (issues.length > 0) {
    await gitlab.Issues.edit(project.id, issues[0].iid, {
      description: issues[0].description + `\n\n---\n**RC Created**: ${rcTag}\n**MR Created**: !${mr.iid}`,
    });
  }
}

// Main handler
async function main() {
  const event: MilestoneEvent = JSON.parse(process.env.WEBHOOK_PAYLOAD!);
  
  if (event.object_kind !== 'milestone') {
    console.log('Not a milestone event, skipping');
    return;
  }
  
  const action = event.object_attributes.state;
  
  if (action === 'active' && !event.object_attributes.updated_at) {
    // New milestone created
    await handleMilestoneCreate(event);
  } else if (action === 'closed') {
    await handleMilestoneClose(event);
  }
}

main().catch(console.error);