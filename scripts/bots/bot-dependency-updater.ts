#!/usr/bin/env node
/**
 * Bot: Dependency Updater Agent
 * Automatically updates project dependencies with security patches
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
const PROJECT_ID = process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID || '';
const UPDATE_TYPE = process.env.UPDATE_TYPE || 'security';
const CREATE_MR = process.env.CREATE_MR !== 'false';

interface PackageUpdate {
  name: string;
  current: string;
  latest: string;
  type: 'patch' | 'minor' | 'major' | 'security';
}

async function checkNpmUpdates(): Promise<PackageUpdate[]> {
  try {
    execSync('npm outdated --json', { stdio: 'pipe' });
  } catch (error: any) {
    const output = error.stdout?.toString() || '{}';
    const outdated = JSON.parse(output);
    
    const updates: PackageUpdate[] = [];
    
    for (const [name, info] of Object.entries(outdated)) {
      if (typeof info === 'object' && info !== null) {
        const pkg = info as any;
        updates.push({
          name,
          current: pkg.current || '',
          latest: pkg.latest || '',
          type: pkg.type || 'patch'
        });
      }
    }
    
    return updates.filter(update => {
      if (UPDATE_TYPE === 'security') {
        return update.type === 'security';
      }
      return update.type === UPDATE_TYPE;
    });
  }
  
  return [];
}

async function updatePackageJson(updates: PackageUpdate[]): Promise<void> {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  let updated = false;
  
  for (const update of updates) {
    if (packageJson.dependencies?.[update.name]) {
      packageJson.dependencies[update.name] = `^${update.latest}`;
      updated = true;
    }
    if (packageJson.devDependencies?.[update.name]) {
      packageJson.devDependencies[update.name] = `^${update.latest}`;
      updated = true;
    }
  }
  
  if (updated) {
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ Updated package.json');
  }
}

async function createMergeRequest(updates: PackageUpdate[]): Promise<string | null> {
  if (!CREATE_MR || !GITLAB_TOKEN || !PROJECT_ID) {
    return null;
  }

  const branchName = `chore/dependency-updates-${Date.now()}`;
  const title = `chore(deps): update ${updates.length} dependencies`;
  const description = `## Dependency Updates\n\nUpdated ${updates.length} dependencies:\n\n${updates.map(u => `- ${u.name}: ${u.current} → ${u.latest}`).join('\n')}`;

  try {
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
    execSync('git add package.json package-lock.json', { stdio: 'inherit' });
    execSync(`git commit -m "${title}"`, { stdio: 'inherit' });
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });

    const response = await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITLAB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_branch: branchName,
        target_branch: 'release/v0.3.x',
        title,
        description
      })
    });

    if (response.ok) {
      const mr = await response.json();
      return mr.web_url;
    }
  } catch (error) {
    console.error('Failed to create MR:', error);
  }

  return null;
}

async function updateDependencies(): Promise<void> {
  console.log(`Checking for ${UPDATE_TYPE} updates...`);

  const updates = await checkNpmUpdates();
  
  if (updates.length === 0) {
    console.log('✅ No updates available');
    return;
  }

  console.log(`Found ${updates.length} updates:`);
  updates.forEach(u => console.log(`  - ${u.name}: ${u.current} → ${u.latest}`));

  await updatePackageJson(updates);
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Installed updated dependencies');
  } catch (error) {
    console.error('Failed to install dependencies:', error);
    process.exit(1);
  }

  if (CREATE_MR) {
    const mrUrl = await createMergeRequest(updates);
    if (mrUrl) {
      console.log(`✅ Created MR: ${mrUrl}`);
    }
  }
}

if (require.main === module) {
  updateDependencies().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { updateDependencies };
