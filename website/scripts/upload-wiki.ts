#!/usr/bin/env npx tsx
/**
 * Upload Wiki Export to GitLab
 *
 * Uploads prepared wiki files from .wiki-export to GitLab wiki via API
 */

import fs from 'fs';
import path from 'path';

const GITLAB_HOST = process.env.GITLAB_HOST || process.env.CI_SERVER_HOST || 'gitlab.bluefly.io';
const PROJECT_PATH = 'llm/openstandardagents';
const EXPORT_DIR = path.join(process.cwd(), '.wiki-export');

async function getGitLabToken(): Promise<string | null> {
  if (process.env.GITLAB_TOKEN) {
    return process.env.GITLAB_TOKEN;
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

