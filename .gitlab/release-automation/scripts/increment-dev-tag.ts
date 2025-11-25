#!/usr/bin/env node
/**
 * Auto-increment dev tag on successful merge to development
 * Runs in CI after merge
 */

import { Gitlab } from '@gitbeaker/rest';
import { execSync } from 'child_process';

const gitlab = new Gitlab({
  token: process.env.CI_JOB_TOKEN!,
});

async function incrementDevTag() {
  const projectId = process.env.CI_PROJECT_ID!;
  const commitSha = process.env.CI_COMMIT_SHA!;
  
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
  
  // Create new tag
  await gitlab.Tags.create(projectId, {
    tag_name: tagName,
    ref: commitSha,
    message: `Auto-incremented dev tag after successful CI`,
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
}

incrementDevTag().catch(console.error);
