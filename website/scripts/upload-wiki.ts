#!/usr/bin/env npx tsx
/**
 * Upload Wiki Export to GitLab
 *
 * Uploads prepared wiki files from .wiki-export to GitLab wiki via API
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const GITLAB_HOST = process.env.GITLAB_HOST || process.env.CI_SERVER_HOST || 'gitlab.com';
const PROJECT_PATH = 'blueflyio/openstandardagents';
const EXPORT_DIR = path.join(process.cwd(), '.wiki-export');

function loadEnvLocal(): void {
  // Check multiple common locations for .env.local
  const envPaths: string[] = [];
  
  // If ENV_FILE is set, use that first
  if (process.env.ENV_FILE) {
    envPaths.push(process.env.ENV_FILE);
  }
  
  // Current directory and parent directories (walk up to 5 levels)
  let currentDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    envPaths.push(path.join(currentDir, '.env.local'));
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // Reached filesystem root
    currentDir = parentDir;
  }
  
  // User home directory
  envPaths.push(path.join(os.homedir(), '.env.local'));

  for (const envLocalPath of envPaths) {
    if (fs.existsSync(envLocalPath)) {
      try {
        const envContent = fs.readFileSync(envLocalPath, 'utf-8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
              if (!process.env[key] && value) {
                process.env[key] = value;
              }
            }
          }
        });
        // Load from first found file only
        return;
      } catch (error) {
        // Continue to next location if this one fails
        continue;
      }
    }
  }
}

async function getGitLabToken(): Promise<string | null> {
  // Load .env.local first
  loadEnvLocal();

  // Try environment variables (check multiple possible names)
  if (process.env.GITLAB_TOKEN) {
    return process.env.GITLAB_TOKEN;
  }
  if (process.env.GITLAB_PUSH_TOKEN) {
    return process.env.GITLAB_PUSH_TOKEN;
  }
  if (process.env.CI_JOB_TOKEN) {
    return process.env.CI_JOB_TOKEN;
  }

  const tokenPath = path.join(process.env.HOME || '', '.tokens', 'gitlab');
  if (fs.existsSync(tokenPath)) {
    return fs.readFileSync(tokenPath, 'utf-8').trim();
  }

  return null;
}

async function uploadWikiPage(slug: string, content: string): Promise<boolean> {
  const token = await getGitLabToken();
  if (!token) {
    console.error('❌ No GitLab token found');
    console.error('   Set GITLAB_TOKEN env var or create ~/.tokens/gitlab');
    return false;
  }

  const encodedPath = encodeURIComponent(PROJECT_PATH);
  const url = `https://${GITLAB_HOST}/api/v4/projects/${encodedPath}/wikis`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: slug,
        content: content,
        format: 'markdown',
      }),
    });

    if (response.ok) {
      return true;
    } else if (response.status === 409 || response.status === 400) {
      // Page already exists, try to update it
      const updateUrl = `${url}/${encodeURIComponent(slug)}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          format: 'markdown',
        }),
      });
      if (updateResponse.ok) {
        return true;
      } else {
        const errorText = await updateResponse.text();
        console.error(`   Update error: ${updateResponse.status} ${updateResponse.statusText}`);
        console.error(`   ${errorText.substring(0, 200)}`);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.error(`   API error: ${response.status} ${response.statusText}`);
      console.error(`   ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error: any) {
    console.error(`   Network error: ${error.message}`);
    return false;
  }
}

async function uploadWikiFiles(): Promise<void> {
  console.log('🔄 Uploading wiki files to GitLab...\n');

  if (!fs.existsSync(EXPORT_DIR)) {
    console.error('❌ .wiki-export directory not found');
    console.error('   Run: npm run merge-docs-to-wiki first');
    return;
  }

  const manifestPath = path.join(EXPORT_DIR, 'MANIFEST.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ MANIFEST.json not found');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`📚 Found ${manifest.length} files to upload\n`);

  let successCount = 0;
  let failCount = 0;

  for (const item of manifest) {
    const filePath = path.join(EXPORT_DIR, `${item.slug}.md`);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${item.slug} - file not found, skipping`);
      failCount++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`📤 Uploading ${item.slug}...`);

    const success = await uploadWikiPage(item.slug, content);
    if (success) {
      console.log(`✅ ${item.slug} - uploaded successfully`);
      successCount++;
    } else {
      console.log(`❌ ${item.slug} - upload failed`);
      failCount++;
    }
  }

  console.log(`\n✨ Upload complete: ${successCount} succeeded, ${failCount} failed`);
}

uploadWikiFiles().catch((error) => {
  console.error('❌ Upload failed:', error.message);
  process.exit(1);
});

