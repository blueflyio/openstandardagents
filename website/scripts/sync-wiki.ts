#!/usr/bin/env npx tsx
/**
 * GitLab Wiki Sync Script
 *
 * Fetches wiki pages from GitLab and saves them to content/docs for static site generation.
 * Run this during build or manually with: npx tsx scripts/sync-wiki.ts
 */

import fs from 'fs';
import path from 'path';

const GITLAB_HOST = process.env.GITLAB_HOST || 'gitlab.bluefly.io';
const PROJECT_PATH = 'llm/openstandardagents';
const DOCS_DIR = path.join(process.cwd(), 'content/docs');
const BLOG_DIR = path.join(process.cwd(), 'content/blog');

interface WikiPage {
  slug: string;
  title: string;
  content: string;
  format: string;
}

async function getGitLabToken(): Promise<string | null> {
  // Try environment variable first
  if (process.env.GITLAB_TOKEN) {
    return process.env.GITLAB_TOKEN;
  }

  // Try reading from ~/.tokens/gitlab
  const tokenPath = path.join(process.env.HOME || '', '.tokens', 'gitlab');
  if (fs.existsSync(tokenPath)) {
    return fs.readFileSync(tokenPath, 'utf-8').trim();
  }

  return null;
}

async function fetchWikiPages(): Promise<WikiPage[]> {
  const token = await getGitLabToken();

  if (!token) {
    console.log('⚠️  No GitLab token found - skipping wiki sync');
    console.log('   Set GITLAB_TOKEN env var or create ~/.tokens/gitlab to enable sync');
    return [];
  }

  const encodedPath = encodeURIComponent(PROJECT_PATH);

  const response = await fetch(
    `https://${GITLAB_HOST}/api/v4/projects/${encodedPath}/wikis?with_content=1`,
    {
      headers: {
        'PRIVATE-TOKEN': token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch wiki pages: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function slugToFilePath(slug: string): string {
  // Convert GitLab wiki slug to local file path
  // e.g., "Getting-Started/5-Minute-Overview" -> "getting-started/5-minute-overview.md"
  const parts = slug.split('/');

  // Lowercase everything for URL-friendly paths
  if (parts.length > 1) {
    const dirs = parts.slice(0, -1).map(d => d.toLowerCase());
    const filename = parts[parts.length - 1].toLowerCase();
    return path.join(...dirs, `${filename}.md`);
  }

  return `${slug.toLowerCase()}.md`;
}

function processContent(content: string, title: string): string {
  // Add frontmatter if not present
  if (!content.startsWith('---')) {
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
---

`;
    return frontmatter + content;
  }
  return content;
}

function processBlogContent(content: string, title: string): string {
  // Extract or generate blog metadata from content
  let bodyContent = content;
  let existingMeta: Record<string, string> = {};

  // Parse existing frontmatter if present
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('---', 3);
    if (endIndex !== -1) {
      const frontmatterText = content.substring(3, endIndex).trim();
      bodyContent = content.substring(endIndex + 3).trim();

      // Parse simple key: value frontmatter
      frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          existingMeta[key] = value;
        }
      });
    }
  }

  // Look for author in content (e.g., "**Thomas Scola**")
  const authorMatch = bodyContent.match(/\*\*([^*]+)\*\*\s*\n\s*\*([^*]+)\*/);
  const extractedAuthor = authorMatch ? authorMatch[1].trim() : null;

  // Try to extract excerpt from abstract or first paragraph
  let excerpt = '';
  const abstractMatch = bodyContent.match(/###\s*Abstract\s*\n+([^\n#]+)/i);
  if (abstractMatch) {
    excerpt = abstractMatch[1].substring(0, 200).trim();
    if (abstractMatch[1].length > 200) excerpt += '...';
  } else {
    const lines = bodyContent.split('\n');
    const firstPara = lines.find(line =>
      line.trim() &&
      !line.startsWith('#') &&
      !line.startsWith('*') &&
      !line.startsWith('[')
    );
    if (firstPara) {
      excerpt = firstPara.substring(0, 200).trim();
      if (firstPara.length > 200) excerpt += '...';
    }
  }

  // Build final frontmatter with blog-specific fields
  const finalTitle = existingMeta.title || title;
  const date = existingMeta.date || new Date().toISOString().split('T')[0];
  const author = existingMeta.author || extractedAuthor || 'OSSA Team';
  const category = existingMeta.category || 'Research';
  const tags = existingMeta.tags || '["OSSA", "AI Agents", "Standards"]';
  const finalExcerpt = existingMeta.excerpt || excerpt;

  const frontmatter = `---
title: "${finalTitle.replace(/"/g, '\\"').replace(/\\/g, '')}"
date: "${date}"
author: "${author}"
category: "${category}"
tags: ${tags}
excerpt: "${finalExcerpt.replace(/"/g, '\\"')}"
---

`;
  return frontmatter + bodyContent;
}

async function syncWiki(): Promise<void> {
  console.log('🔄 Syncing GitLab wiki...');

  // Fetch all wiki pages
  const pages = await fetchWikiPages();

  // If no pages returned (no token or empty wiki), skip sync
  if (pages.length === 0) {
    console.log('📋 No pages to sync - using existing content');
    return;
  }

  console.log(`📚 Found ${pages.length} wiki pages`);

  // Track synced files for cleanup
  const syncedDocs = new Set<string>();
  const syncedBlogs = new Set<string>();

  for (const page of pages) {
    // Skip Home page (we have our own docs landing)
    if (page.slug === 'Home') {
      console.log(`⏭️  Skipping Home page (using custom landing)`);
      continue;
    }

    // Handle Blog pages separately
    if (page.slug === 'Blog' || page.slug.startsWith('Blog/')) {
      // Skip the Blog index and template pages
      if (page.slug === 'Blog' || page.slug === 'Blog/Template') {
        console.log(`⏭️  Skipping ${page.slug} (not a blog post)`);
        continue;
      }

      // Extract blog post name from slug (Blog/My-Post -> My-Post)
      const blogSlug = page.slug.replace('Blog/', '');
      const filename = `${blogSlug}.md`;
      const fullPath = path.join(BLOG_DIR, filename);

      // Ensure blog directory exists
      if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
      }

      // Process and write blog content
      const processedContent = processBlogContent(page.content, page.title);
      fs.writeFileSync(fullPath, processedContent);
      syncedBlogs.add(filename);

      console.log(`📝 Blog: ${page.slug} -> content/blog/${filename}`);
      continue;
    }

    // Regular docs pages
    const relativePath = slugToFilePath(page.slug);
    const fullPath = path.join(DOCS_DIR, relativePath);
    const dirPath = path.dirname(fullPath);

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Process and write content
    const processedContent = processContent(page.content, page.title);
    fs.writeFileSync(fullPath, processedContent);
    syncedDocs.add(relativePath);

    console.log(`✅ ${page.slug} -> ${relativePath}`);
  }

  console.log(`\n✨ Synced ${syncedDocs.size} docs + ${syncedBlogs.size} blog posts`);

  // Write manifest for tracking
  const manifest = {
    lastSync: new Date().toISOString(),
    source: `https://${GITLAB_HOST}/${PROJECT_PATH}/-/wikis/home`,
    docs: Array.from(syncedDocs).sort(),
    blogs: Array.from(syncedBlogs).sort(),
  };

  fs.writeFileSync(
    path.join(DOCS_DIR, '.wiki-sync-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('📋 Updated .wiki-sync-manifest.json');
}

// Run if called directly
syncWiki().catch((error) => {
  console.error('❌ Wiki sync failed:', error.message);
  process.exit(1);
});
