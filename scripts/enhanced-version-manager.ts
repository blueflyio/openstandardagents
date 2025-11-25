#!/usr/bin/env tsx
/**
 * Enhanced Version Manager Script
 * 
 * Integrates with GitLab agents for automated version management.
 * Can run standalone or be invoked by GitLab agents.
 * 
 * Features:
 * - GitLab API integration for milestone-based versioning
 * - Automated MR creation
 * - Version consistency validation
 * - Documentation template processing
 * - GitLab agent orchestration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const VERSION_FILE = path.join(process.cwd(), '.version.json');
const GITLAB_API_URL = process.env.CI_API_V4_URL || process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';
// Use service account token (preferred) or fallback to user token
const GITLAB_TOKEN = process.env.SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN || 
                      process.env.GITLAB_TOKEN || 
                      process.env.GITLAB_PUSH_TOKEN || '';
const PROJECT_ID = process.env.CI_PROJECT_ID || '';

// ============================================================================
// Zod Schemas
// ============================================================================

const VersionConfigSchema = z.object({
  current: z.string(),
  latest_stable: z.string(),
  spec_path: z.string(),
  schema_file: z.string(),
});

const BumpTypeSchema = z.enum(['major', 'minor', 'patch', 'rc', 'release']);

type VersionConfig = z.infer<typeof VersionConfigSchema>;
type BumpType = z.infer<typeof BumpTypeSchema>;

// ============================================================================
// Version Management
// ============================================================================

function getVersionConfig(): VersionConfig {
  if (!fs.existsSync(VERSION_FILE)) {
    throw new Error('.version.json not found');
  }
  const config = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
  return VersionConfigSchema.parse(config);
}

function bumpVersion(current: string, type: BumpType): string {
  const rcMatch = current.match(/^(\d+)\.(\d+)\.(\d+)-RC$/);
  if (rcMatch) {
    if (type === 'release') {
      return `${rcMatch[1]}.${rcMatch[2]}.${rcMatch[3]}`;
    }
  }
  
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Invalid version format: ${current}`);
  
  let [, major, minor, patch] = match.map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'rc':
      return `${major}.${minor}.${patch + 1}-RC`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

// ============================================================================
// GitLab Integration
// ============================================================================

async function getMilestoneVersion(milestoneId?: string): Promise<string | null> {
  if (!milestoneId || !GITLAB_TOKEN || !PROJECT_ID) {
    return null;
  }

  try {
    const response = await fetch(
      `${GITLAB_API_URL}/projects/${PROJECT_ID}/milestones/${milestoneId}`,
      {
        headers: {
          'PRIVATE-TOKEN': GITLAB_TOKEN,
        },
      }
    );

    if (!response.ok) return null;

    const milestone = await response.json();
    const title = milestone.title || '';
    
    // Extract version from milestone title (e.g., "v0.2.6" or "0.2.6")
    const versionMatch = title.match(/(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : null;
  } catch (error) {
    console.warn('Failed to fetch milestone:', error);
    return null;
  }
}

async function createMergeRequest(
  sourceBranch: string,
  targetBranch: string,
  title: string,
  description: string
): Promise<number | null> {
  if (!GITLAB_TOKEN || !PROJECT_ID) {
    console.warn('GitLab credentials not available, skipping MR creation');
    return null;
  }

  try {
    const response = await fetch(
      `${GITLAB_API_URL}/projects/${PROJECT_ID}/merge_requests`,
      {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': GITLAB_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_branch: sourceBranch,
          target_branch: targetBranch,
          title,
          description,
          labels: ['version-bump', 'automated', 'chore'],
          remove_source_branch: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create MR: ${error}`);
    }

    const mr = await response.json();
    return mr.iid;
  } catch (error) {
    console.error('Failed to create merge request:', error);
    return null;
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const bumpType = BumpTypeSchema.parse(args[0] || 'patch');
  const milestoneId = process.env.CI_MILESTONE_ID || args[1];

  console.log('🤖 Enhanced Version Manager');
  console.log('===========================\n');

  const config = getVersionConfig();
  console.log(`📦 Current version: ${config.current}`);

  // Try to get version from milestone
  let targetVersion: string | null = null;
  if (milestoneId) {
    targetVersion = await getMilestoneVersion(milestoneId);
    if (targetVersion) {
      console.log(`🎯 Milestone version: ${targetVersion}`);
    }
  }

  // Calculate new version
  const newVersion = targetVersion || bumpVersion(config.current, bumpType);
  console.log(`🚀 New version: ${newVersion}\n`);

  // Update .version.json
  config.latest_stable = config.current.replace('-RC', '');
  config.current = newVersion;
  fs.writeFileSync(VERSION_FILE, JSON.stringify(config, null, 2) + '\n');
  console.log('✅ Updated .version.json');

  // Run sync
  console.log('\n📝 Syncing version references...');
  execSync('npm run version:sync', { stdio: 'inherit' });

  // Process docs
  console.log('\n📚 Processing documentation templates...');
  execSync('npm run docs:process', { stdio: 'inherit' });

  // Validate
  console.log('\n🔍 Validating version consistency...');
  try {
    execSync('npm run version:sync -- --check', { stdio: 'inherit' });
    console.log('✅ Version consistency validated');
  } catch (error) {
    console.error('❌ Version consistency check failed');
    process.exit(1);
  }

  // Git operations (if in CI or explicitly requested)
  if (process.env.CI || process.argv.includes('--create-mr')) {
    const targetBranch = process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || 'development';
    const sourceBranch = `chore/version-bump-${newVersion}`;

    console.log(`\n🌿 Creating branch: ${sourceBranch}`);
    execSync(`git checkout -b ${sourceBranch}`, { stdio: 'inherit' });

    console.log('\n📝 Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });

    console.log('\n⬆️  Pushing branch...');
    execSync(`git push -u origin ${sourceBranch}`, { stdio: 'inherit' });

    console.log('\n🔀 Creating merge request...');
    const mrId = await createMergeRequest(
      sourceBranch,
      targetBranch,
      `chore: bump version to ${newVersion}`,
      `Automated version bump to ${newVersion}\n\nTriggered by: ${milestoneId ? 'Milestone' : 'Manual'}\n\nChanges:\n- Updated .version.json\n- Synced package.json files\n- Updated documentation\n- Created spec/v${newVersion}/ directory`
    );

    if (mrId) {
      console.log(`✅ Merge request created: !${mrId}`);
    }
  }

  console.log('\n✅ Version management complete!');
  console.log(`   ${config.current} → ${newVersion}`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

