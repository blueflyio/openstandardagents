#!/usr/bin/env node
/**
 * Fix hardcoded version references throughout the website
 * Replaces all hardcoded versions with current version from lib/version.ts
 *
 * Run during build: npm run fix-versions
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import path from 'path';


// Read current version from installed @bluefly/openstandardagents package
function getCurrentVersion() {
  const rootDir = path.join(__dirname, '..', '..');
  const websiteDir = path.join(rootDir, 'website');

  const locations = [
    path.join(rootDir, 'node_modules', '@bluefly', 'openstandardagents', 'package.json'),
    path.join(websiteDir, 'node_modules', '@bluefly', 'openstandardagents', 'package.json'),
  ];

  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(loc, 'utf-8'));
        return pkg.version;
      } catch (e) {
        console.error('Error reading package:', e);
      }
    }
  }

  // Fallback: try to parse from version.ts comment
  try {
    const versionTsPath = path.join(websiteDir, 'lib', 'version.ts');
    if (fs.existsSync(versionTsPath)) {
      const content = fs.readFileSync(versionTsPath, 'utf8');
      // Look for comment like "// Get version from the installed package (0.3.2)"
      const match = content.match(/installed package \(([^)]+)\)/);
      if (match) {
        return match[1];
      }
    }
  } catch (e) {
    console.error('Error reading version.ts:', e);
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
  // Examples are in scripts/public/
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
      
      // Replace apiVersion: ossa/vX.X.X (including pre-release suffixes like -RC, -dev, etc.)
      example.content = example.content.replace(
        /^(\s*)apiVersion:\s*ossa\/v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?/gim,
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
  // Docs are in website/content/docs/
  const docsPath = path.join(__dirname, '..', '..', 'website', 'content', 'docs');
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

        // Replace {{OSSA_VERSION}} placeholders with concrete versions
        content = content.replace(/\{\{OSSA_VERSION\}\}/g, version);
        content = content.replace(/\{\{OSSA_VERSION_TAG\}\}/g, `v${version}`);
        content = content.replace(/\{\{OSSA_DISPLAY_VERSION\}\}/g, displayVersion);
        content = content.replace(/\{\{OSSA_API_VERSION\}\}/g, `ossa/v${version}`);

        // Replace apiVersion: ossa/vX.X.X (including pre-release suffixes) with current version
        content = content.replace(
          /apiVersion:\s*ossa\/v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?/gi,
          `apiVersion: ossa/v${version}`
        );

        // Replace apiVersion: ossa/vX.X.x (display versions) with current display version
        content = content.replace(
          /apiVersion:\s*ossa\/v\d+\.\d+\.x(?!\.)/gi,
          `apiVersion: ossa/v${displayVersion}`
        );

        // Replace "version": "X.X.X" in JSON examples with current version
        content = content.replace(
          /"version":\s*"\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?"/g,
          `"version": "${version}"`
        );

        // Replace ossaVersion: "X.X.X" with current version
        content = content.replace(
          /ossaVersion:\s*"\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?"/gi,
          `ossaVersion: "${version}"`
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
  // This file is in website/lib/
  const filePath = path.join(__dirname, '..', '..', 'website', 'lib', 'get-version-for-metadata.ts');
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
