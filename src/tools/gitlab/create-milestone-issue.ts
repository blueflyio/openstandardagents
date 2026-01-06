#!/usr/bin/env tsx

/**
 * Create GitLab Issue for Milestone
 * Quick script to create issues via GitLab API
 */

import { readFileSync } from 'fs';

const GITLAB_API_URL = process.env.CI_API_V4_URL || 'https://gitlab.com/api/v4';
const GITLAB_TOKEN = process.env.SERVICE_ACCOUNT_OSSA_TOKEN || 
                      process.env.GITLAB_TOKEN || 
                      process.env.GITLAB_PUSH_TOKEN || '';
const PROJECT_ID = process.env.CI_PROJECT_ID || 'blueflyio/openstandardagents';

async function createIssue(
  title: string,
  description: string,
  milestoneId: number,
  labels: string[] = []
) {
  if (!GITLAB_TOKEN) {
    console.error('[FAIL] GITLAB_TOKEN or SERVICE_ACCOUNT_OSSA_TOKEN required');
    process.exit(1);
  }

  const projectPath = encodeURIComponent(PROJECT_ID);
  const url = `${GITLAB_API_URL}/projects/${projectPath}/issues`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': GITLAB_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        milestone_id: milestoneId,
        labels: labels.join(','),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create issue: ${error}`);
    }

    const issue = await response.json();
    console.log(`[PASS] Issue created: !${issue.iid}`);
    console.log(`   URL: ${issue.web_url}`);
    return issue.iid;
  } catch (error) {
    console.error('[FAIL] Error creating issue:', error);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: tsx src/tools/gitlab/create-milestone-issue.ts <title> <milestone-id> <labels> [description-file]');
  console.log('Example: tsx src/tools/gitlab/create-milestone-issue.ts "Enhance bin" 3 "enhancement,cli"');
  process.exit(1);
}

const [title, milestoneId, labelsStr, descFile] = args;
const labels = labelsStr.split(',').map(l => l.trim());
const description = descFile && readFileSync(descFile, 'utf-8') || '';

createIssue(title, description, parseInt(milestoneId), labels);

