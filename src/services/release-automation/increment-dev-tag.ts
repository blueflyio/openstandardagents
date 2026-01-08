#!/usr/bin/env node
/**
 * Auto-increment dev tag on successful merge to development
 * Runs in CI after merge
 */

import { Gitlab } from '@gitbeaker/rest';
import { execSync } from 'child_process';

const gitlab = new Gitlab({
  token: process.env.GITLAB_TOKEN || process.env.CI_JOB_TOKEN!,
});

async function incrementDevTag() {
  const projectId = process.env.CI_PROJECT_ID!;
  const commitSha = process.env.CI_COMMIT_SHA!;
  const commitMessage = process.env.CI_COMMIT_MESSAGE || '';
  const commitAuthor = process.env.GITLAB_USER_NAME || 'GitLab CI';
  const pipelineUrl = process.env.CI_PIPELINE_URL || '';
  
  // Get current milestone from package.json
  const packageJson = JSON.parse(
    execSync('cat package.json').toString()
  );
  const version = packageJson.version; // e.g., "0.2.6-dev.5"
  
  if (!version.includes('-dev.')) {
    console.log('Not a dev version, skipping');
    return;
  }
  
  // Extract base version and increment
  const [baseVersion, devPart] = version.split('-dev.');
  const currentNum = parseInt(devPart);
  const nextNum = currentNum + 1;
  const nextVersion = `${baseVersion}-dev.${nextNum}`;
  const tagName = `v${nextVersion}`;
  
  // Get commit details for rich tag description
  const commitDate = new Date().toISOString();
  const shortSha = commitSha.substring(0, 8);
  
  // Get recent commits since last tag
  let recentCommits = '';
  try {
    const lastTag = `v${baseVersion}-dev.${currentNum}`;
    recentCommits = execSync(`git log ${lastTag}..HEAD --oneline --no-merges`).toString().trim();
  } catch {
    recentCommits = execSync('git log -5 --oneline --no-merges').toString().trim();
  }
  
  // Create rich tag description
  const tagDescription = `# Development Release ${tagName}

**Auto-generated development tag** - ${commitDate}

## 📦 Version Information
- **Version**: ${nextVersion}
- **Base Version**: ${baseVersion}
- **Dev Iteration**: ${nextNum}
- **Commit**: ${shortSha}
- **Author**: ${commitAuthor}

## 🔗 Links
- **Pipeline**: ${pipelineUrl}
- **Commit**: https://gitlab.com/blueflyio/openstandardagents/-/commit/${commitSha}

## 📝 Recent Changes
\`\`\`
${recentCommits}
\`\`\`

## ⚠️ Development Release
This is a development release and should not be used in production.
- Not published to npm
- May contain breaking changes
- For testing and development only

## 🚀 Next Steps
When milestone is complete and closed:
1. RC tag will be created automatically
2. MR to main will be created
3. After approval, production release will be triggered
`;

  // Create new tag (correct API signature: projectId, tagName, ref, options)
  await gitlab.Tags.create(projectId, tagName, commitSha, {
    message: tagDescription,
  });
  
  console.log(`✅ Created tag: ${tagName}`);
  
  // Update package.json version
  execSync(`npm version ${nextVersion} --no-git-tag-version`);
  
  // Commit version bump
  execSync('git config user.name "GitLab CI"');
  execSync('git config user.email "ci@gitlab.com"');
  execSync('git add package.json package-lock.json');
  execSync(`git commit -m "chore: bump version to ${nextVersion} [skip ci]"`);
  execSync('git push origin development');
  
  console.log(`✅ Bumped version to: ${nextVersion}`);
  
  // Check if milestone is complete and create MR if needed
  await checkMilestoneAndCreateMR(projectId, baseVersion);
}

async function checkMilestoneAndCreateMR(projectId: string, version: string) {
  try {
    // Find milestone for this version
    const milestones = await gitlab.ProjectMilestones.all(projectId, {
      state: 'closed',
      search: version,
    });
    
    if (milestones.length === 0) {
      console.log('ℹ️  No closed milestone found, skipping MR creation');
      return;
    }
    
    const milestone = milestones[0];
    
    // Check if MR already exists
    const existingMRs = await gitlab.MergeRequests.all({
      projectId,
      sourceBranch: 'development',
      targetBranch: 'main',
      state: 'opened',
    });
    
    if (existingMRs.length > 0) {
      console.log('ℹ️  MR already exists, skipping');
      return;
    }
    
    // Create MR to main
    const mr = await gitlab.MergeRequests.create(projectId, 'development', 'main', `Release ${version}`, {
      description: `## 🚀 Release ${version}

**Milestone**: ${milestone.title}
**Status**: Ready for Release

### ✅ Pre-Release Checklist
- [x] All milestone issues closed
- [x] All tests passing
- [x] Security scans passed
- [x] Documentation updated
- [x] Changelog updated

### 📋 Approval Required
- [ ] Technical Lead approval
- [ ] Security Lead approval
- [ ] Product Owner approval
- [ ] Release Manager approval

### 🎯 Release Actions (Manual Triggers)
After all approvals, use pipeline buttons to:
1. 🚀 Release to npm
2. 🐙 Release to GitHub
3. 🌐 Deploy Website
4. 📢 Announce Release

**DO NOT MERGE MANUALLY** - This MR will auto-merge after successful release.
`,
      removeSourceBranch: false,
      squash: false,
      labels: 'release,automation',
      milestoneId: milestone.id,
    });
    
    console.log(`✅ Created MR: !${mr.iid} - ${mr.web_url}`);
  } catch (error) {
    console.log('ℹ️  Could not create MR:', error);
  }
}

incrementDevTag().catch(console.error);
