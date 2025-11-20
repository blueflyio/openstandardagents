#!/usr/bin/env npx tsx
/**
 * Merge Local Docs to GitLab Wiki
 *
 * This script helps prepare content from /docs directory for merging into GitLab wiki.
 * It reads files from the project's /docs directory and outputs them in a format
 * suitable for GitLab wiki pages.
 *
 * Usage:
 *   npx tsx scripts/merge-docs-to-wiki.ts
 *
 * This will:
 * 1. Read all markdown files from ../../docs
 * 2. Convert them to GitLab wiki format
 * 3. Output instructions for manual wiki upload
 */

import fs from 'fs';
import path from 'path';

const DOCS_SOURCE_DIR = path.join(process.cwd(), '../docs');
const OUTPUT_DIR = path.join(process.cwd(), '.wiki-export');

interface DocFile {
  relativePath: string;
  fullPath: string;
  content: string;
  wikiSlug: string;
}

function getAllDocFiles(dir: string, basePath: string = ''): DocFile[] {
  const files: DocFile[] = [];

  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory ${dir} does not exist`);
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Skip certain directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      files.push(...getAllDocFiles(fullPath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // Convert file path to wiki slug format
      // e.g., "getting-started.md" -> "Getting-Started"
      // e.g., "migration/general-agent-schema.yml" -> "Migration/General-Agent-Schema"
      const wikiSlug = relativePath
        .replace(/\.md$/, '')
        .split('/')
        .map(part => part
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('-')
        )
        .join('/');

      files.push({
        relativePath,
        fullPath,
        content,
        wikiSlug,
      });
    }
  }

  return files;
}

function processContentForWiki(content: string, filename: string): string {
  // Remove frontmatter if present (wiki doesn't use it)
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('---', 3);
    if (endIndex !== -1) {
      content = content.substring(endIndex + 3).trim();
    }
  }

  // Fix relative links - convert to wiki-relative format
  // This is a basic conversion - may need manual adjustment
  content = content.replace(/\]\(\.\.\/examples\//g, '](Examples/');
  content = content.replace(/\]\(\.\.\/spec\//g, '](Specification/');
  content = content.replace(/\]\(\.\.\/migration\//g, '](Migration/');
  content = content.replace(/\]\(getting-started\.md\)/g, '](Getting-Started)');
  content = content.replace(/\]\(openapi-extensions\.md\)/g, '](OpenAPI-Extensions)');

  return content;
}

async function mergeDocsToWiki(): Promise<void> {
  console.log('🔄 Preparing docs for GitLab wiki merge...\n');

  // Read all doc files
  const docFiles = getAllDocFiles(DOCS_SOURCE_DIR);

  if (docFiles.length === 0) {
    console.log('❌ No markdown files found in docs directory');
    return;
  }

  console.log(`📚 Found ${docFiles.length} documentation files\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Process and write files
  const manifest: Array<{ slug: string; file: string; size: number }> = [];

  for (const doc of docFiles) {
    const processedContent = processContentForWiki(doc.content, doc.relativePath);
    const outputPath = path.join(OUTPUT_DIR, `${doc.wikiSlug}.md`);

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, processedContent);
    manifest.push({
      slug: doc.wikiSlug,
      file: doc.relativePath,
      size: processedContent.length,
    });

    console.log(`✅ ${doc.relativePath} -> ${doc.wikiSlug}`);
  }

  // Write manifest
  const manifestPath = path.join(OUTPUT_DIR, 'MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Write instructions
  const instructions = `# GitLab Wiki Merge Instructions

## Files Prepared

${docFiles.length} documentation files have been prepared for GitLab wiki.

## How to Merge

### Option 1: Manual Upload (Recommended for First Time)

1. Go to your GitLab project: https://${process.env.GITLAB_HOST || 'gitlab.bluefly.io'}/llm/openstandardagents/-/wikis
2. For each file in the manifest:
   - Click "New Page"
   - Use the slug as the page title (e.g., "Getting-Started")
   - Copy the content from .wiki-export/[slug].md
   - Save the page

### Option 2: GitLab API (Automated)

You can use the GitLab API to upload pages programmatically:

\`\`\`bash
# Set your GitLab token
export GITLAB_TOKEN="your-token-here"
export GITLAB_HOST="gitlab.bluefly.io"

# Upload each page
for file in .wiki-export/*.md; do
  slug=$(basename "$file" .md)
  curl -X POST \\
    "https://\${GITLAB_HOST}/api/v4/projects/llm%2Fopenstandardagents/wikis" \\
    -H "PRIVATE-TOKEN: \${GITLAB_TOKEN}" \\
    -F "title=\${slug}" \\
    -F "content=@\${file}"
done
\`\`\`

## Files to Upload

See MANIFEST.json for the complete list of files and their wiki slugs.

## Notes

- Links may need manual adjustment after upload
- Images and assets should be uploaded separately
- Some relative links may need to be updated for wiki structure
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'INSTRUCTIONS.md'), instructions);

  console.log(`\n✨ Prepared ${docFiles.length} files for wiki merge`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Review files in ${OUTPUT_DIR}`);
  console.log(`   2. Follow instructions in ${OUTPUT_DIR}/INSTRUCTIONS.md`);
  console.log(`   3. Upload to GitLab wiki manually or via API`);
}

// Run if called directly
mergeDocsToWiki().catch((error) => {
  console.error('❌ Failed to prepare docs for wiki:', error.message);
  process.exit(1);
});

