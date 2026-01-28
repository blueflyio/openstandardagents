#!/usr/bin/env tsx
/**
 * Automated Changelog Generator from Milestone Issues
 * Generates changelog from closed issues in a milestone
 */

import { Gitlab } from '@gitbeaker/rest';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

interface Issue {
  iid: number;
  title: string;
  labels: string[];
  web_url: string;
  author: {
    name: string;
    username: string;
  };
  closed_at: string;
}

interface MilestoneData {
  id: number;
  title: string;
  description: string;
  state: string;
  due_date?: string;
  web_url: string;
}

// CI_SERVER_HOST is just 'gitlab.com' without protocol - ensure we have the full URL
const gitlabHost = process.env.CI_SERVER_HOST
  ? process.env.CI_SERVER_HOST.startsWith('http')
    ? process.env.CI_SERVER_HOST
    : `https://${process.env.CI_SERVER_HOST}`
  : 'https://gitlab.com';

const gitlab = new Gitlab({
  host: gitlabHost,
  token: process.env.GITLAB_PUSH_TOKEN || process.env.CI_JOB_TOKEN!,
});

const projectId = process.env.CI_PROJECT_ID!;

/**
 * Categorize issues by type based on labels and title
 */
function categorizeIssue(issue: Issue): string {
  const title = issue.title.toLowerCase();
  const labels = issue.labels.map((l) => l.toLowerCase());

  // Check labels first
  if (labels.some((l) => l.includes('breaking'))) return 'breaking';
  if (labels.some((l) => l.includes('feature') || l.includes('enhancement')))
    return 'features';
  if (labels.some((l) => l.includes('bug') || l.includes('fix')))
    return 'fixes';
  if (labels.some((l) => l.includes('security'))) return 'security';
  if (labels.some((l) => l.includes('performance'))) return 'performance';
  if (labels.some((l) => l.includes('documentation') || l.includes('docs')))
    return 'documentation';
  if (labels.some((l) => l.includes('deprecation'))) return 'deprecations';

  // Check title patterns
  if (title.startsWith('feat:') || title.startsWith('feature:'))
    return 'features';
  if (title.startsWith('fix:')) return 'fixes';
  if (title.startsWith('docs:')) return 'documentation';
  if (title.startsWith('perf:')) return 'performance';
  if (title.startsWith('security:')) return 'security';

  return 'other';
}

/**
 * Generate emoji for category
 */
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    breaking: '💥',
    features: '✨',
    fixes: '🐛',
    security: '🔒',
    performance: '⚡',
    documentation: '📚',
    deprecations: '⚠️',
    other: '🔧',
  };
  return emojiMap[category] || '🔧';
}

/**
 * Get category title
 */
function getCategoryTitle(category: string): string {
  const titleMap: Record<string, string> = {
    breaking: 'Breaking Changes',
    features: 'Features',
    fixes: 'Bug Fixes',
    security: 'Security',
    performance: 'Performance',
    documentation: 'Documentation',
    deprecations: 'Deprecations',
    other: 'Other Changes',
  };
  return titleMap[category] || 'Other Changes';
}

/**
 * Fetch all issues for a milestone
 */
async function fetchMilestoneIssues(milestoneId: number): Promise<Issue[]> {
  try {
    const issues = (await gitlab.Issues.all({
      projectId,
      milestoneId: milestoneId.toString(),
      state: 'closed',
      perPage: 100,
    })) as any[];

    return issues.map((issue) => ({
      iid: issue.iid,
      title: issue.title,
      labels: issue.labels || [],
      web_url: issue.web_url,
      author: issue.author,
      closed_at: issue.closed_at,
    }));
  } catch (error) {
    console.error('Error fetching milestone issues:', error);
    return [];
  }
}

/**
 * Fetch milestone data
 */
async function fetchMilestone(
  milestoneId: number
): Promise<MilestoneData | null> {
  try {
    const milestone = (await gitlab.ProjectMilestones.show(
      projectId,
      milestoneId
    )) as any;
    return {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description || '',
      state: milestone.state,
      due_date: milestone.due_date,
      web_url: milestone.web_url,
    };
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return null;
  }
}

/**
 * Generate changelog content
 */
function generateChangelog(
  milestone: MilestoneData,
  issues: Issue[],
  version: string
): string {
  const releaseDate = new Date().toISOString().split('T')[0];

  // Group issues by category
  const categorized: Record<string, Issue[]> = {};
  issues.forEach((issue) => {
    const category = categorizeIssue(issue);
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(issue);
  });

  // Sort categories by importance
  const categoryOrder = [
    'breaking',
    'security',
    'features',
    'fixes',
    'performance',
    'deprecations',
    'documentation',
    'other',
  ];

  let changelog = `# Changelog - v${version}\n\n`;
  changelog += `**Release Date:** ${releaseDate}\n\n`;
  changelog += `**Milestone:** [${milestone.title}](${milestone.web_url})\n\n`;

  if (milestone.description) {
    changelog += `## Overview\n\n${milestone.description}\n\n`;
  }

  changelog += `## What's Changed\n\n`;

  // Generate sections for each category
  categoryOrder.forEach((category) => {
    if (categorized[category] && categorized[category].length > 0) {
      const emoji = getCategoryEmoji(category);
      const title = getCategoryTitle(category);
      changelog += `### ${emoji} ${title}\n\n`;

      categorized[category].forEach((issue) => {
        const cleanTitle = issue.title
          .replace(
            /^(feat|fix|docs|perf|security|chore|refactor|test|build|ci):\s*/i,
            ''
          )
          .trim();
        changelog += `- ${cleanTitle} ([#${issue.iid}](${issue.web_url}))\n`;
      });

      changelog += `\n`;
    }
  });

  // Add statistics
  changelog += `## Statistics\n\n`;
  changelog += `- **Total Issues Closed:** ${issues.length}\n`;

  const contributors = new Set(issues.map((i) => i.author.username));
  changelog += `- **Contributors:** ${contributors.size}\n`;

  if (milestone.due_date) {
    changelog += `- **Planned Release Date:** ${milestone.due_date}\n`;
  }
  changelog += `- **Actual Release Date:** ${releaseDate}\n\n`;

  // Add contributors list
  if (contributors.size > 0) {
    changelog += `## Contributors\n\n`;
    changelog += `Thanks to all contributors who made this release possible:\n\n`;
    Array.from(contributors)
      .sort()
      .forEach((username) => {
        changelog += `- @${username}\n`;
      });
    changelog += `\n`;
  }

  // Add links
  changelog += `## Links\n\n`;
  changelog += `- [Milestone](${milestone.web_url})\n`;
  changelog += `- [Full Changelog](https://gitlab.com/${process.env.CI_PROJECT_PATH}/-/compare/v${getPreviousVersion(version)}...v${version})\n`;
  changelog += `- [npm Package](https://www.npmjs.com/package/@bluefly/openstandardagents/v/${version})\n`;
  changelog += `- [Documentation](https://openstandardagents.org/)\n`;

  return changelog;
}

/**
 * Get previous version (simple implementation)
 */
function getPreviousVersion(version: string): string {
  try {
    const tags = execSync('git tag --sort=-version:refname')
      .toString()
      .trim()
      .split('\n')
      .filter((tag) => tag.startsWith('v') && tag !== `v${version}`);

    return tags[0] || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
}

/**
 * Main execution
 */
async function main() {
  const milestoneId = process.env.MILESTONE_ID || process.env.CI_MILESTONE_ID;
  const version =
    process.env.RELEASE_VERSION || process.env.CI_COMMIT_TAG?.replace(/^v/, '');
  const outputPath = process.env.CHANGELOG_OUTPUT || './RELEASE_NOTES.md';

  if (!milestoneId) {
    console.error('❌ ERROR: MILESTONE_ID not set');
    process.exit(1);
  }

  if (!version) {
    console.error('❌ ERROR: RELEASE_VERSION not set');
    process.exit(1);
  }

  console.log('📝 Generating Changelog');
  console.log('======================');
  console.log(`Milestone ID: ${milestoneId}`);
  console.log(`Version: v${version}`);
  console.log('');

  // Fetch milestone data
  console.log('Fetching milestone data...');
  const milestone = await fetchMilestone(parseInt(milestoneId));
  if (!milestone) {
    console.error('❌ ERROR: Failed to fetch milestone');
    process.exit(1);
  }

  console.log(`Milestone: ${milestone.title}`);
  console.log(`State: ${milestone.state}`);
  console.log('');

  // Fetch issues
  console.log('Fetching closed issues...');
  const issues = await fetchMilestoneIssues(parseInt(milestoneId));
  console.log(`Found ${issues.length} closed issues`);
  console.log('');

  if (issues.length === 0) {
    console.warn('⚠️  WARNING: No closed issues found in milestone');
  }

  // Generate changelog
  console.log('Generating changelog...');
  const changelog = generateChangelog(milestone, issues, version);

  // Write to file
  writeFileSync(outputPath, changelog, 'utf-8');
  console.log(`✅ Changelog written to: ${outputPath}`);
  console.log('');
  console.log('Preview:');
  console.log('--------');
  console.log(changelog);

  // Also export to environment
  console.log('');
  console.log('Exported environment variables:');
  console.log(`CHANGELOG_PATH=${outputPath}`);
  console.log(`ISSUE_COUNT=${issues.length}`);
  console.log(`MILESTONE_TITLE=${milestone.title}`);

  // Write dotenv file for GitLab CI
  const envContent = `CHANGELOG_PATH=${outputPath}
ISSUE_COUNT=${issues.length}
MILESTONE_TITLE=${milestone.title}
MILESTONE_URL=${milestone.web_url}
`;
  writeFileSync('changelog.env', envContent, 'utf-8');
}

main().catch((error) => {
  console.error('❌ Changelog generation failed:', error);
  process.exit(1);
});
