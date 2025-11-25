#!/usr/bin/env node

/**
 * OSSA Version Sync Script (Zod Edition)
 *
 * Automatically synchronizes version references across the entire project.
 * Single source of truth: package.json version field
 *
 * Uses Zod for runtime validation and type safety.
 *
 * Updates:
 * - README.md (schema links, badges, examples)
 * - spec/vX.Y.Z/ directory creation
 * - website/docs version references
 * - OpenAPI spec version fields
 * - CHANGELOG.md unreleased section
 *
 * Usage:
 *   npx tsx scripts/sync-versions.ts [--check|--fix]
 *
 *   --check: Validate version consistency (CI mode)
 *   --fix:   Update all version references
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Zod Schemas
// ============================================================================

const PackageJsonSchema = z.object({
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, 'Invalid semver version'),
  exports: z.object({
    './schema': z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

const ConfigSchema = z.object({
  root: z.string(),
  packageJson: z.string(),
  readme: z.string(),
  changelog: z.string(),
  releasing: z.string(),
  specDir: z.string(),
  mode: z.enum(['check', 'fix']),
});

const ResultSchema = z.object({
  errors: z.array(z.string()),
  changes: z.array(z.string()),
  warnings: z.array(z.string()),
});

type PackageJson = z.infer<typeof PackageJsonSchema>;
type Config = z.infer<typeof ConfigSchema>;
type Result = z.infer<typeof ResultSchema>;

// ============================================================================
// Configuration
// ============================================================================

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const README = path.join(ROOT, 'README.md');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const RELEASING = path.join(ROOT, 'RELEASING.md');
const SPEC_DIR = path.join(ROOT, 'spec');

// Mode: check or fix
const MODE = process.argv[2] === '--check' ? 'check' : 'fix';

const config: Config = ConfigSchema.parse({
  root: ROOT,
  packageJson: PACKAGE_JSON,
  readme: README,
  changelog: CHANGELOG,
  releasing: RELEASING,
  specDir: SPEC_DIR,
  mode: MODE,
});

const result: Result = {
  errors: [],
  changes: [],
  warnings: [],
};

// ============================================================================
// Version Management
// ============================================================================

/**
 * Get current version from package.json with validation
 */
function getCurrentVersion(): string {
  try {
    const pkgRaw = fs.readFileSync(config.packageJson, 'utf8');
    const pkg = PackageJsonSchema.parse(JSON.parse(pkgRaw));
    return pkg.version;
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.errors.push(`package.json validation failed: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
    } else {
      result.errors.push(`Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  }
}

/**
 * Get package.json as validated object
 */
function getPackageJson(): PackageJson {
  const pkgRaw = fs.readFileSync(config.packageJson, 'utf8');
  return PackageJsonSchema.parse(JSON.parse(pkgRaw));
}

// ============================================================================
// Spec Directory Management
// ============================================================================

/**
 * Check if spec directory exists for version
 */
function checkSpecDirectory(version: string): boolean {
  const specPath = path.join(config.specDir, `v${version}`);
  return fs.existsSync(specPath);
}

/**
 * Create spec directory for version (copy from latest)
 */
function createSpecDirectory(version: string): void {
  const newSpecPath = path.join(config.specDir, `v${version}`);

  if (fs.existsSync(newSpecPath)) {
    console.log(`✓ Spec directory already exists: spec/v${version}/`);
    return;
  }

  // Find latest spec directory
  const specDirs = fs.readdirSync(config.specDir)
    .filter(d => d.startsWith('v') && !d.includes('-dev') && fs.statSync(path.join(config.specDir, d)).isDirectory())
    .sort((a, b) => {
      const aVer = a.slice(1).split('.').map(Number);
      const bVer = b.slice(1).split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if (aVer[i] !== bVer[i]) return (bVer[i] || 0) - (aVer[i] || 0);
      }
      return 0;
    });

  if (specDirs.length === 0) {
    result.errors.push(`No existing spec directories found to copy from`);
    return;
  }

  const latestSpec = specDirs[0];
  const sourceSpecPath = path.join(config.specDir, latestSpec);

  if (config.mode === 'check') {
    result.errors.push(`Spec directory missing: spec/v${version}/`);
    return;
  }

  // Copy directory
  console.log(`Creating spec/v${version}/ from ${latestSpec}...`);
  try {
    fs.cpSync(sourceSpecPath, newSpecPath, { recursive: true });
  } catch (error) {
    result.errors.push(`Failed to copy spec directory: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  // Update schema version in copied files
  const oldVersion = latestSpec.slice(1);
  const schemaFile = path.join(newSpecPath, `ossa-${oldVersion}.schema.json`);
  const newSchemaFile = path.join(newSpecPath, `ossa-${version}.schema.json`);

  if (fs.existsSync(schemaFile)) {
    try {
      const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
      schema.$id = schema.$id.replace(`v${oldVersion}`, `v${version}`);
      schema.properties.ossaVersion.const = version;

      fs.writeFileSync(newSchemaFile, JSON.stringify(schema, null, 2));

      if (schemaFile !== newSchemaFile) {
        fs.unlinkSync(schemaFile);
      }
    } catch (error) {
      result.errors.push(`Failed to update schema file: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }

  result.changes.push(`Created spec/v${version}/ directory`);
}

// ============================================================================
// File Updates
// ============================================================================

/**
 * Semver pattern that matches versions with optional pre-release tags
 * Matches: 0.2.5, 0.2.5-RC, 0.2.5-alpha.1, 1.0.0-beta.2, etc.
 */
const SEMVER_PATTERN = '[\\d]+\\.[\\d]+\\.[\\d]+(?:-[a-zA-Z0-9.]+)?';

/**
 * Update README.md version references
 */
function updateReadme(version: string): void {
  if (!fs.existsSync(config.readme)) {
    result.errors.push('README.md not found');
    return;
  }

  let readme = fs.readFileSync(config.readme, 'utf8');
  const original = readme;

  // Update schema references (spec/vX.Y.Z/ossa-X.Y.Z.schema.json)
  const schemaRegex = new RegExp(`spec/v${SEMVER_PATTERN}/ossa-${SEMVER_PATTERN}\\.schema\\.json`, 'g');
  readme = readme.replace(schemaRegex, `spec/v${version}/ossa-${version}.schema.json`);

  // Update version in YAML examples (ossaVersion: "X.Y.Z")
  const yamlVersionRegex = new RegExp(`ossaVersion:\\s*["']${SEMVER_PATTERN}["']`, 'g');
  readme = readme.replace(yamlVersionRegex, `ossaVersion: "${version}"`);

  // Update "OSSA vX.Y.Z Schema:" header pattern
  const headerRegex = new RegExp(`OSSA v${SEMVER_PATTERN} Schema:`, 'g');
  readme = readme.replace(headerRegex, `OSSA v${version} Schema:`);

  // Update version references in spec paths (e.g., spec/v0.2.5-RC/)
  const versionLinkRegex = new RegExp(`spec/v${SEMVER_PATTERN}/`, 'g');
  readme = readme.replace(versionLinkRegex, `spec/v${version}/`);

  // Update ossa-X.Y.Z.yaml references
  const yamlFileRegex = new RegExp(`ossa-${SEMVER_PATTERN}\\.yaml`, 'g');
  readme = readme.replace(yamlFileRegex, `ossa-${version}.yaml`);

  if (readme !== original) {
    if (config.mode === 'check') {
      result.errors.push('README.md has outdated version references');
    } else {
      fs.writeFileSync(config.readme, readme);
      result.changes.push('Updated README.md version references');
    }
  } else {
    console.log('✓ README.md version references are current');
  }
}

/**
 * Update RELEASING.md current version
 */
function updateReleasing(version: string): void {
  if (!fs.existsSync(config.releasing)) {
    result.warnings.push('RELEASING.md not found');
    return;
  }

  let releasing = fs.readFileSync(config.releasing, 'utf8');
  const original = releasing;

  // Update "Current Version: X.Y.Z" line
  const currentVersionRegex = /\*\*Current Version\*\*:\s*[\d.\-a-zA-Z]+/;
  if (currentVersionRegex.test(releasing)) {
    releasing = releasing.replace(currentVersionRegex, `**Current Version**: ${version}`);
  }

  if (releasing !== original) {
    if (config.mode === 'check') {
      result.errors.push(`RELEASING.md has outdated version (should be ${version})`);
    } else {
      fs.writeFileSync(config.releasing, releasing);
      result.changes.push('Updated RELEASING.md current version');
    }
  } else {
    console.log('✓ RELEASING.md is current');
  }
}

/**
 * Update CHANGELOG.md unreleased section
 */
function updateChangelog(version: string): void {
  if (!fs.existsSync(config.changelog)) {
    result.warnings.push('CHANGELOG.md not found');
    return;
  }

  let changelog = fs.readFileSync(config.changelog, 'utf8');
  const original = changelog;

  // Replace [Unreleased] with [vX.Y.Z] - YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const unreleasedRegex = /## \[Unreleased\]/;

  if (unreleasedRegex.test(changelog)) {
    changelog = changelog.replace(
      unreleasedRegex,
      `## [v${version}] - ${today}`
    );

    if (config.mode === 'check') {
      result.errors.push('CHANGELOG.md has [Unreleased] section that should be versioned');
    } else {
      fs.writeFileSync(config.changelog, changelog);
      result.changes.push(`Updated CHANGELOG.md: [Unreleased] → [v${version}]`);
    }
  } else {
    console.log('✓ CHANGELOG.md is current');
  }
}

/**
 * Update package.json exports
 */
function updatePackageExports(version: string): void {
  const pkg = getPackageJson();

  if (pkg.exports && pkg.exports['./schema']) {
    const expectedSchema = `./spec/v${version}/ossa-${version}.schema.json`;
    const currentSchema = pkg.exports['./schema'];

    // Check if current schema matches ANY version pattern (not just the expected one)
    const schemaVersionRegex = new RegExp(`\\./spec/v${SEMVER_PATTERN}/ossa-${SEMVER_PATTERN}\\.schema\\.json`);

    if (currentSchema !== expectedSchema) {
      if (config.mode === 'check') {
        result.errors.push(`package.json exports["./schema"] is "${currentSchema}", should be "${expectedSchema}"`);
      } else {
        pkg.exports['./schema'] = expectedSchema;
        fs.writeFileSync(config.packageJson, JSON.stringify(pkg, null, 2) + '\n');
        result.changes.push('Updated package.json schema export');
      }
    } else {
      console.log('✓ package.json schema export is current');
    }
  }
}

/**
 * Update website documentation
 */
function updateWebsiteDocs(version: string): void {
  const websiteDir = path.join(config.root, 'website', 'content', 'docs');

  if (!fs.existsSync(websiteDir)) {
    result.warnings.push('website/content/docs/ not found (skipping)');
    return;
  }

  // Recursively find all .md files
  function findMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
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

    // Update version references (but not version history sections)
    // Use same SEMVER_PATTERN to catch pre-release versions like -RC, -alpha, -beta
    const yamlVersionRegex = new RegExp(`ossaVersion:\\s*["']${SEMVER_PATTERN}["']`, 'g');
    content = content.replace(yamlVersionRegex, `ossaVersion: "${version}"`);

    const schemaRegex = new RegExp(`spec/v${SEMVER_PATTERN}/ossa-${SEMVER_PATTERN}\\.schema\\.json`, 'g');
    content = content.replace(schemaRegex, `spec/v${version}/ossa-${version}.schema.json`);

    // Also update spec directory links
    const specLinkRegex = new RegExp(`spec/v${SEMVER_PATTERN}/`, 'g');
    content = content.replace(specLinkRegex, `spec/v${version}/`);

    if (content !== original) {
      if (config.mode === 'check') {
        result.errors.push(`${path.relative(config.root, file)} has outdated version references`);
      } else {
        fs.writeFileSync(file, content);
        updated++;
      }
    }
  });

  if (updated > 0) {
    result.changes.push(`Updated ${updated} website documentation files`);
  } else if (mdFiles.length > 0) {
    console.log('✓ Website documentation is current');
  }
}

// ============================================================================
// Main Execution
// ============================================================================

function main(): void {
  console.log('🔄 OSSA Version Sync (Zod Edition)');
  console.log('==================================\n');

  const version = getCurrentVersion();
  console.log(`📦 Current version: ${version}`);
  console.log(`🔧 Mode: ${config.mode.toUpperCase()}\n`);

  // Run checks/fixes
  createSpecDirectory(version);
  updateReadme(version);
  updateReleasing(version);
  updateChangelog(version);
  updatePackageExports(version);
  updateWebsiteDocs(version);

  // Report results
  console.log('\n' + '='.repeat(50));

  if (config.mode === 'check') {
    if (result.errors.length > 0) {
      console.log('\n❌ Version consistency check FAILED:\n');
      result.errors.forEach(err => console.log(`  • ${err}`));
      console.log('\nRun with --fix to update all references');
      process.exit(1);
    } else {
      console.log('\n✅ All version references are consistent!');
      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:\n');
        result.warnings.forEach(warn => console.log(`  • ${warn}`));
      }
      process.exit(0);
    }
  } else {
    if (result.changes.length > 0) {
      console.log('\n✅ Version sync complete:\n');
      result.changes.forEach(change => console.log(`  • ${change}`));
      console.log('\n💡 Review changes and commit:');
      console.log(`   git add .`);
      console.log(`   git commit -m "chore: sync version references to v${version}"`);
    } else {
      console.log('\n✅ All version references are already current!');
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:\n');
      result.errors.forEach(err => console.log(`  • ${err}`));
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:\n');
      result.warnings.forEach(warn => console.log(`  • ${warn}`));
    }
  }
}

// Run
try {
  main();
} catch (error) {
  console.error('\n❌ Fatal Error:', error instanceof Error ? error.message : String(error));
  if (error instanceof z.ZodError) {
    console.error('\nValidation Errors:');
    error.issues.forEach((err: z.ZodIssue) => console.error(`  • ${err.path.join('.')}: ${err.message}`));
  }
  process.exit(1);
}
