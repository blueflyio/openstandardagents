#!/usr/bin/env node

/**
 * OSSA Version Sync Script
 *
 * Automatically synchronizes version references across the entire project.
 * Single source of truth: package.json version field
 *
 * Updates:
 * - README.md (schema links, badges, examples)
 * - spec/vX.Y.Z/ directory creation
 * - website/docs version references
 * - OpenAPI spec version fields
 * - CHANGELOG.md unreleased section
 *
 * Usage:
 *   node scripts/sync-versions.js [--check|--fix]
 *
 *   --check: Validate version consistency (CI mode)
 *   --fix:   Update all version references
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const README = path.join(ROOT, 'README.md');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const SPEC_DIR = path.join(ROOT, 'spec');

// Mode: check or fix
const MODE = process.argv[2] || '--fix';
const CHECK_MODE = MODE === '--check';

// State
let errors = [];
let changes = [];

/**
 * Get current version from package.json
 */
function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  return pkg.version;
}

/**
 * Check if spec directory exists for version
 */
function checkSpecDirectory(version) {
  const specPath = path.join(SPEC_DIR, `v${version}`);
  return fs.existsSync(specPath);
}

/**
 * Create spec directory for version (copy from latest)
 */
function createSpecDirectory(version) {
  const newSpecPath = path.join(SPEC_DIR, `v${version}`);

  if (fs.existsSync(newSpecPath)) {
    console.log(`✓ Spec directory already exists: spec/v${version}/`);
    return;
  }

  // Find latest spec directory
  const specDirs = fs.readdirSync(SPEC_DIR)
    .filter(d => d.startsWith('v') && fs.statSync(path.join(SPEC_DIR, d)).isDirectory())
    .sort()
    .reverse();

  if (specDirs.length === 0) {
    errors.push(`No existing spec directories found to copy from`);
    return;
  }

  const latestSpec = specDirs[0];
  const sourceSpecPath = path.join(SPEC_DIR, latestSpec);

  if (CHECK_MODE) {
    errors.push(`Spec directory missing: spec/v${version}/`);
    return;
  }

  // Copy directory
  console.log(`Creating spec/v${version}/ from ${latestSpec}...`);
  fs.cpSync(sourceSpecPath, newSpecPath, { recursive: true });

  // Update schema version in copied files
  const schemaFile = path.join(newSpecPath, `ossa-${latestSpec.slice(1)}.schema.json`);
  const newSchemaFile = path.join(newSpecPath, `ossa-${version}.schema.json`);

  if (fs.existsSync(schemaFile)) {
    let schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
    schema.version = version;
    schema.$id = schema.$id.replace(latestSpec, `v${version}`);

    fs.writeFileSync(newSchemaFile, JSON.stringify(schema, null, 2));

    if (schemaFile !== newSchemaFile) {
      fs.unlinkSync(schemaFile);
    }
  }

  changes.push(`Created spec/v${version}/ directory`);
}

/**
 * Update README.md version references
 */
function updateReadme(version) {
  if (!fs.existsSync(README)) {
    errors.push('README.md not found');
    return;
  }

  let readme = fs.readFileSync(README, 'utf8');
  const original = readme;

  // Update npm badge
  readme = readme.replace(
    /@bluefly\/open-standards-scalable-agents/g,
    '@bluefly/openstandardagents'
  );

  // Update schema references
  const schemaRegex = /spec\/v[\d.]+\/ossa-[\d.]+\.schema\.json/g;
  readme = readme.replace(schemaRegex, `spec/v${version}/ossa-${version}.schema.json`);

  // Update version in YAML examples
  const yamlVersionRegex = /ossaVersion:\s*["'][\d.]+["']/g;
  readme = readme.replace(yamlVersionRegex, `ossaVersion: "${version}"`);

  // Update badge version
  const badgeRegex = /https:\/\/img\.shields\.io\/npm\/v\/@bluefly\/[^.]+/g;
  readme = readme.replace(badgeRegex, `https://img.shields.io/npm/v/@bluefly/openstandardagents`);

  if (readme !== original) {
    if (CHECK_MODE) {
      errors.push('README.md has outdated version references');
    } else {
      fs.writeFileSync(README, readme);
      changes.push('Updated README.md version references');
    }
  } else {
    console.log('✓ README.md version references are current');
  }
}

/**
 * Update CHANGELOG.md unreleased section
 */
function updateChangelog(version) {
  if (!fs.existsSync(CHANGELOG)) {
    console.log('ℹ CHANGELOG.md not found (skipping)');
    return;
  }

  let changelog = fs.readFileSync(CHANGELOG, 'utf8');
  const original = changelog;

  // Replace [Unreleased] with [vX.Y.Z] - YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const unreleasedRegex = /## \[Unreleased\]/;

  if (unreleasedRegex.test(changelog)) {
    changelog = changelog.replace(
      unreleasedRegex,
      `## [v${version}] - ${today}`
    );

    if (CHECK_MODE) {
      errors.push('CHANGELOG.md has [Unreleased] section that should be versioned');
    } else {
      fs.writeFileSync(CHANGELOG, changelog);
      changes.push(`Updated CHANGELOG.md: [Unreleased] → [v${version}]`);
    }
  } else {
    console.log('✓ CHANGELOG.md is current');
  }
}

/**
 * Update package.json exports
 */
function updatePackageExports(version) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const original = JSON.stringify(pkg, null, 2);

  if (pkg.exports && pkg.exports['./schema']) {
    const expectedSchema = `./spec/v${version}/ossa-${version}.schema.json`;

    if (pkg.exports['./schema'] !== expectedSchema) {
      if (CHECK_MODE) {
        errors.push(`package.json exports["./schema"] should be ${expectedSchema}`);
      } else {
        pkg.exports['./schema'] = expectedSchema;
        fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
        changes.push('Updated package.json schema export');
      }
    } else {
      console.log('✓ package.json schema export is current');
    }
  }
}

/**
 * Find and update OpenAPI spec versions
 */
function updateOpenAPISpecs(version) {
  const openAPIDir = path.join(ROOT, 'spec', 'openapi');

  if (!fs.existsSync(openAPIDir)) {
    console.log('ℹ spec/openapi/ not found (skipping)');
    return;
  }

  const files = fs.readdirSync(openAPIDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  files.forEach(file => {
    const filePath = path.join(openAPIDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Update version in info section
    content = content.replace(
      /version:\s*['"]?[\d.]+['"]?/,
      `version: '${version}'`
    );

    if (content !== original) {
      if (CHECK_MODE) {
        errors.push(`${file} has outdated version`);
      } else {
        fs.writeFileSync(filePath, content);
        changes.push(`Updated ${file} version`);
      }
    }
  });

  if (files.length > 0 && changes.filter(c => c.includes('OpenAPI')).length === 0) {
    console.log('✓ OpenAPI specs are current');
  }
}

/**
 * Update website documentation
 */
function updateWebsiteDocs(version) {
  const websiteDir = path.join(ROOT, 'website', 'docs');

  if (!fs.existsSync(websiteDir)) {
    console.log('ℹ website/docs/ not found (skipping)');
    return;
  }

  // Recursively find all .md files
  function findMarkdownFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath));
      } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
        files.push(fullPath);
      }
    });

    return files;
  }

  const mdFiles = findMarkdownFiles(websiteDir);
  let updated = 0;

  mdFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Update version references
    content = content.replace(/OSSA v[\d.]+/g, `OSSA v${version}`);
    content = content.replace(/version[\s]*:[\s]*[\d.]+/g, `version: ${version}`);

    if (content !== original) {
      if (CHECK_MODE) {
        errors.push(`${path.relative(ROOT, file)} has outdated version references`);
      } else {
        fs.writeFileSync(file, content);
        updated++;
      }
    }
  });

  if (updated > 0) {
    changes.push(`Updated ${updated} website documentation files`);
  } else if (mdFiles.length > 0) {
    console.log('✓ Website documentation is current');
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 OSSA Version Sync');
  console.log('===================\n');

  const version = getCurrentVersion();
  console.log(`📦 Current version: ${version}\n`);

  if (CHECK_MODE) {
    console.log('🔍 Running in CHECK mode...\n');
  } else {
    console.log('🔧 Running in FIX mode...\n');
  }

  // Run checks/fixes
  createSpecDirectory(version);
  updateReadme(version);
  updateChangelog(version);
  updatePackageExports(version);
  updateOpenAPISpecs(version);
  updateWebsiteDocs(version);

  // Report results
  console.log('\n' + '='.repeat(50));

  if (CHECK_MODE) {
    if (errors.length > 0) {
      console.log('\n❌ Version consistency check FAILED:\n');
      errors.forEach(err => console.log(`  • ${err}`));
      console.log('\nRun with --fix to update all references');
      process.exit(1);
    } else {
      console.log('\n✅ All version references are consistent!');
      process.exit(0);
    }
  } else {
    if (changes.length > 0) {
      console.log('\n✅ Version sync complete:\n');
      changes.forEach(change => console.log(`  • ${change}`));
      console.log('\n💡 Review changes and commit:');
      console.log(`   git add .`);
      console.log(`   git commit -m "chore: sync version references to v${version}"`);
    } else {
      console.log('\n✅ All version references are already current!');
    }

    if (errors.length > 0) {
      console.log('\n⚠️  Warnings:\n');
      errors.forEach(err => console.log(`  • ${err}`));
    }
  }
}

// Run
try {
  main();
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
