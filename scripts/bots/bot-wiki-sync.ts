#!/usr/bin/env node
/**
 * Bot: Wiki Sync Agent
 * Syncs markdown files from repository to GitLab Wiki
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';

const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
const PROJECT_ID = process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID || '';
const SOURCE_DIR = process.env.SOURCE_DIR || 'website/content/docs';

interface WikiPage {
  slug: string;
  title: string;
  content: string;
}

async function fetchWikiPages(): Promise<WikiPage[]> {
  const response = await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/wikis`, {
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch wiki pages: ${response.statusText}`);
  }

  return await response.json();
}

async function createOrUpdateWikiPage(slug: string, title: string, content: string): Promise<boolean> {
  const existingPages = await fetchWikiPages();
  const exists = existingPages.some(p => p.slug === slug);

  const url = exists
    ? `${GITLAB_URL}/projects/${PROJECT_ID}/wikis/${encodeURIComponent(slug)}`
    : `${GITLAB_URL}/projects/${PROJECT_ID}/wikis`;

  const method = exists ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      content,
      format: 'markdown'
    })
  });

  return response.ok;
}

function findMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, baseDir));
    } else if (entry.endsWith('.md')) {
      files.push(relative(baseDir, fullPath));
    }
  }

  return files;
}

function slugFromPath(path: string): string {
  return path
    .replace(/\.md$/, '')
    .replace(/\//g, '-')
    .toLowerCase();
}

function titleFromPath(path: string): string {
  const name = path.replace(/\.md$/, '').split('/').pop() || '';
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function syncWiki(): Promise<void> {
  if (!GITLAB_TOKEN) {
    throw new Error('GITLAB_TOKEN environment variable is required');
  }

  if (!PROJECT_ID) {
    throw new Error('PROJECT_ID or CI_PROJECT_ID environment variable is required');
  }

  console.log(`Syncing wiki from ${SOURCE_DIR}...`);

  const mdFiles = findMarkdownFiles(SOURCE_DIR);
  console.log(`Found ${mdFiles.length} markdown files`);

  let pagesCreated = 0;
  let pagesUpdated = 0;
  const errors: string[] = [];

  for (const file of mdFiles) {
    try {
      const fullPath = join(SOURCE_DIR, file);
      const content = readFileSync(fullPath, 'utf-8');
      const slug = slugFromPath(file);
      const title = titleFromPath(file);

      const success = await createOrUpdateWikiPage(slug, title, content);

      if (success) {
        const existingPages = await fetchWikiPages();
        const exists = existingPages.some(p => p.slug === slug);
        
        if (exists) {
          pagesUpdated++;
          console.log(`✅ Updated: ${slug}`);
        } else {
          pagesCreated++;
          console.log(`✅ Created: ${slug}`);
        }
      } else {
        errors.push(`Failed to sync ${file}`);
      }
    } catch (error) {
      errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\n✅ Sync complete:`);
  console.log(`  Created: ${pagesCreated}`);
  console.log(`  Updated: ${pagesUpdated}`);
  console.log(`  Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.error('\nErrors:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

if (require.main === module) {
  syncWiki().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { syncWiki };
