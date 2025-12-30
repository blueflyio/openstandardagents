#!/usr/bin/env node
/**
 * Validates internal documentation links in markdown files.
 *
 * Checks that all /docs/* links point to existing files:
 * - /docs/path → content/docs/path.md or content/docs/path/index.md
 * - Supports anchor links (ignores #fragment)
 *
 * Exit codes:
 * - 0: All links valid
 * - 1: Broken links found
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '..', '..', 'website', 'content', 'docs');
const LINK_PATTERN = /\]\(\/docs\/([^)#]+)/g;

function resolveDocPath(docPath) {
  // /docs/path → content/docs/path
  const basePath = path.join(CONTENT_DIR, docPath);

  // Check direct .md file
  if (fs.existsSync(`${basePath}.md`)) {
    return `${basePath}.md`;
  }

  // Check index.md in directory
  if (fs.existsSync(path.join(basePath, 'index.md'))) {
    return path.join(basePath, 'index.md');
  }

  // Check 00-index.md pattern (used in some dirs)
  if (fs.existsSync(path.join(basePath, '00-index.md'))) {
    return path.join(basePath, '00-index.md');
  }

  return null;
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Extract all /docs/* links from a file
 */
function extractLinks(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const links = [];
  let match;

  // Reset regex state
  LINK_PATTERN.lastIndex = 0;

  // Find line numbers for each link
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const linePattern = /\]\(\/docs\/([^)#]+)/g;
    while ((match = linePattern.exec(line)) !== null) {
      links.push({
        path: match[1],
        line: i + 1,
        fullMatch: match[0]
      });
    }
  }

  return links;
}

/**
 * Validate schema URLs in markdown files
 */
function validateSchemaUrls() {
  console.log('Validating schema URLs...');
  
  const mdFiles = findMarkdownFiles(CONTENT_DIR);
  const outdatedSchemas = [];
  
  // Pattern to match schema URLs
  const schemaPattern = /https:\/\/openstandardagents\.org\/schemas\/([^/]+)\/agent\.json/g;
  
  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativeFile = path.relative(CONTENT_DIR, file);
    
    let match;
    schemaPattern.lastIndex = 0;
    
    while ((match = schemaPattern.exec(content)) !== null) {
      const version = match[1];
      // Allow v0.3.x (any patch version), v1, and v1.x
      if (!version.match(/^v0\.3\.\d+$/) && !version.match(/^v1(\.\d+)?$/)) {
        outdatedSchemas.push({
          file: relativeFile,
          url: match[0],
          version: version
        });
      }
    }
  }
  
  if (outdatedSchemas.length > 0) {
    console.log('ERROR: Found outdated schema references (not v0.3.x or v1):');
    for (const schema of outdatedSchemas) {
      console.log(`${schema.file}:${schema.url}`);
      // Find and print the line context
      const content = fs.readFileSync(path.join(CONTENT_DIR, schema.file), 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(schema.url)) {
          console.log(`${schema.file}:  ${lines[i].trim()}`);
        }
      }
    }
    return 1;
  }
  
  return 0;
}

/**
 * Main validation function
 */
function validateLinks() {
  console.log('🔗 Validating internal documentation links...\n');

  const mdFiles = findMarkdownFiles(CONTENT_DIR);
  console.log(`📁 Found ${mdFiles.length} markdown files\n`);

  const brokenLinks = [];
  const validLinks = new Set();

  for (const file of mdFiles) {
    const relativeFile = path.relative(CONTENT_DIR, file);
    const links = extractLinks(file);

    for (const link of links) {
      const resolved = resolveDocPath(link.path);

      if (resolved) {
        validLinks.add(link.path);
      } else {
        brokenLinks.push({
          file: relativeFile,
          link: `/docs/${link.path}`,
          line: link.line
        });
      }
    }
  }

  // Report results
  if (brokenLinks.length === 0) {
    console.log(`✅ All ${validLinks.size} unique internal links are valid\n`);
    
    // Now validate schema URLs
    const schemaExitCode = validateSchemaUrls();
    if (schemaExitCode !== 0) {
      return schemaExitCode;
    }
    
    return 0;
  }

  // Group broken links by target for cleaner output
  const byTarget = {};
  for (const broken of brokenLinks) {
    if (!byTarget[broken.link]) {
      byTarget[broken.link] = [];
    }
    byTarget[broken.link].push(`${broken.file}:${broken.line}`);
  }

  console.log(`❌ Found ${brokenLinks.length} broken links to ${Object.keys(byTarget).length} missing targets:\n`);

  for (const [target, sources] of Object.entries(byTarget)) {
    console.log(`\n  ${target}`);
    console.log(`  └─ Missing: content/docs/${target.replace('/docs/', '')}.md`);
    console.log(`  └─ Referenced in:`);
    for (const source of sources.slice(0, 5)) {
      console.log(`       - ${source}`);
    }
    if (sources.length > 5) {
      console.log(`       ... and ${sources.length - 5} more`);
    }
  }

  console.log('\n');
  console.log('💡 To fix:');
  console.log('   1. Create the missing .md file, OR');
  console.log('   2. Update the link to point to an existing page, OR');
  console.log('   3. Remove the dead link\n');

  return 1;
}

// Run validation
const exitCode = validateLinks();
process.exit(exitCode);
