#!/usr/bin/env node
/**
 * Fix hardcoded version references throughout the website
 * Replaces all hardcoded versions with current version from lib/version.ts
 *
 * Run during build: npm run fix-versions
 */

const fs = require('fs');
const path = require('path');

// Read current version from lib/version.ts
function getCurrentVersion() {
  try {
    const versionTsPath = path.join(__dirname, '..', 'lib', 'version.ts');
    if (fs.existsSync(versionTsPath)) {
      const content = fs.readFileSync(versionTsPath, 'utf8');
      const match = content.match(/export const OSSA_VERSION = "([^"]+)"/);
      if (match) {
        return match[1];
      }
    }
  } catch (e) {
    console.error('Error reading version:', e);
  }
  return null;
}

function getDisplayVersion(version) {
  const [major, minor] = version.split('.');
  return `${major}.${minor}.x`;
}

const version = getCurrentVersion();
if (!version) {
  console.error('Could not determine current version');
  process.exit(1);
}

const displayVersion = getDisplayVersion(version);
console.log(`\n🔄 Fixing version references to v${version} (display: ${displayVersion})\n`);

let totalReplaced = 0;

// 1. Fix examples.json - supports placeholders and direct replacement
function fixExamples() {
  const examplesPath = path.join(__dirname, '..', 'public', 'examples.json');
  if (!fs.existsSync(examplesPath)) {
    console.log('⚠️  examples.json not found, skipping');
    return 0;
  }

  const examples = JSON.parse(fs.readFileSync(examplesPath, 'utf8'));
  let replaced = 0;

  examples.forEach(example => {
    if (example.content) {
      const oldContent = example.content;
      
      // Replace {{OSSA_VERSION}} placeholders first (template system)
      example.content = example.content.replace(/\{\{OSSA_VERSION\}\}/g, version);
      example.content = example.content.replace(/\{\{OSSA_DISPLAY_VERSION\}\}/g, displayVersion);
      example.content = example.content.replace(/\{\{OSSA_API_VERSION\}\}/g, `ossa/v${version}`);
      
      // Replace apiVersion: ossa/vX.X.X
      example.content = example.content.replace(
        /apiVersion:\s*ossa\/v\d+\.\d+\.\d+/gi,
        `apiVersion: ossa/v${version}`
      );
      // Replace apiVersion: ossa/vX.X.x (display version)
      example.content = example.content.replace(
        /apiVersion:\s*ossa\/v\d+\.\d+\.x/gi,
        `apiVersion: ossa/v${displayVersion}`
      );
      if (oldContent !== example.content) {
        replaced++;
      }
    }
  });

  fs.writeFileSync(examplesPath, JSON.stringify(examples, null, 2));
  console.log(`  examples.json: ${replaced} examples updated`);
  return replaced;
}

// 2. Fix markdown docs - supports both placeholders and direct replacement
function fixDocs() {
  const docsPath = path.join(__dirname, '..', 'content', 'docs');
  if (!fs.existsSync(docsPath)) {
    console.log('⚠️  content/docs not found, skipping');
    return 0;
  }

  let replaced = 0;

  function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDir(filePath);
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        const oldContent = content;

        // Replace {{OSSA_VERSION}} placeholders first (template system)
        content = content.replace(/\{\{OSSA_VERSION\}\}/g, version);
        content = content.replace(/\{\{OSSA_DISPLAY_VERSION\}\}/g, displayVersion);
        content = content.replace(/\{\{OSSA_API_VERSION\}\}/g, `ossa/v${version}`);

        // Replace apiVersion: ossa/vX.X.X (exact versions) with placeholder
        content = content.replace(
          /apiVersion:\s*ossa\/v\d+\.\d+\.\d+/gi,
          `apiVersion: ossa/v{{OSSA_VERSION}}`
        );

        // Replace apiVersion: ossa/vX.X.x (display versions) - keep as display
        // These are intentionally kept as display versions for docs
        content = content.replace(
          /apiVersion:\s*ossa\/v\d+\.\d+\.x(?!\.)/gi,
          `apiVersion: ossa/v{{OSSA_DISPLAY_VERSION}}`
        );

        // Replace "version": "X.X.X" in JSON examples with placeholder
        content = content.replace(
          /"version":\s*"\d+\.\d+\.\d+"/g,
          `"version": "{{OSSA_VERSION}}"`
        );

        // Replace ossaVersion: "X.X.X" with placeholder
        content = content.replace(
          /ossaVersion:\s*"\d+\.\d+\.\d+"/gi,
          `ossaVersion: "{{OSSA_VERSION}}"`
        );

        // Replace hardcoded version references like "v0.2.8" or "0.2.8" in text
        // But preserve versioning.md examples and specific version references
        content = content.replace(
          /\b(v?0\.2\.\d+)\b(?!\s*→|\s*-|\s*→|spec\/|Last release|Example versions)/g,
          (match) => {
            // Don't replace if it's part of a path, URL, or specific example
            if (match.includes('/') || match.includes('http') || match.includes('spec/')) {
              return match;
            }
            // Replace with placeholder
            return match.startsWith('v') ? '{{OSSA_VERSION_TAG}}' : '{{OSSA_VERSION}}';
          }
        );

        if (oldContent !== content) {
          fs.writeFileSync(filePath, content);
          replaced++;
        }
      }
    }
  }

  processDir(docsPath);
  console.log(`  content/docs: ${replaced} files updated`);
  return replaced;
}

// 3. Fix get-version-for-metadata.ts fallback
function fixMetadataFallback() {
  const filePath = path.join(__dirname, '..', 'lib', 'get-version-for-metadata.ts');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  get-version-for-metadata.ts not found, skipping');
    return 0;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const oldContent = content;

  // Replace hardcoded fallback displayVersion
  content = content.replace(
    /displayVersion:\s*['"]?\d+\.\d+\.x['"]?/g,
    `displayVersion: '${displayVersion}'`
  );

  if (oldContent !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`  get-version-for-metadata.ts: 1 file updated`);
    return 1;
  }

  console.log(`  get-version-for-metadata.ts: no changes needed`);
  return 0;
}

// Run all fixes
console.log('Fixing version references...');
totalReplaced += fixExamples();
totalReplaced += fixDocs();
totalReplaced += fixMetadataFallback();

console.log(`\n✅ Total: ${totalReplaced} files/examples updated to v${version}\n`);
