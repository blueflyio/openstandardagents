#!/usr/bin/env node
/**
 * OSSA Version Sync Script
 *
 * Dynamically injects version from package.json into all relevant files:
 * - Agent manifests (.agents/, .gitlab/agents/, .github/agents/, examples/)
 * - Config files (.env.example, .version.json, .wiki-config.json)
 * - Source code defaults
 *
 * Usage:
 *   npm run version:sync           # Sync current version
 *   npm run version:sync -- --dry-run  # Preview changes
 *   npm run version:sync -- --check    # Check if sync needed
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SyncResult {
  file: string;
  updated: boolean;
  matches: number;
  oldValue?: string;
  newValue?: string;
}

interface VersionSyncConfig {
  /** Current version to inject */
  version: string;
  /** Root directory to search */
  rootDir: string;
  /** Patterns to search for files */
  patterns: string[];
  /** Version patterns to replace */
  replacements: VersionReplacement[];
  /** Dry run mode */
  dryRun: boolean;
  /** Check mode (exit non-zero if changes needed) */
  checkMode: boolean;
}

interface VersionReplacement {
  /** File extensions to apply to */
  extensions: string[];
  /** Regex pattern to match */
  pattern: RegExp;
  /** Replacement template (use $version placeholder) */
  replacement: string;
}

const DEFAULT_REPLACEMENTS: VersionReplacement[] = [
  // YAML: apiVersion: ossa/v0.x.x
  {
    extensions: ['.yaml', '.yml'],
    pattern: /apiVersion:\s*ossa\/v[\d]+\.[\d]+\.[\d]+(-[\w.]+)?/g,
    replacement: 'apiVersion: ossa/v$version',
  },
  // YAML: ossaVersion: "0.x.x"
  {
    extensions: ['.yaml', '.yml'],
    pattern: /ossaVersion:\s*["']?[\d]+\.[\d]+\.[\d]+(-[\w.]+)?["']?/g,
    replacement: 'ossaVersion: "$version"',
  },
  // JSON: "apiVersion": "ossa/v0.x.x"
  {
    extensions: ['.json'],
    pattern: /"apiVersion":\s*"ossa\/v[\d]+\.[\d]+\.[\d]+(-[\w.]+)?"/g,
    replacement: '"apiVersion": "ossa/v$version"',
  },
  // JSON: "$id": "https://ossa.dev/schema/..."
  {
    extensions: ['.json'],
    pattern: /"\$id":\s*"https:\/\/ossa\.dev\/schema\/v[\d]+\.[\d]+\.[\d]+/g,
    replacement: '"$id": "https://ossa.dev/schema/v$version',
  },
  // TypeScript/JavaScript: OSSA_VERSION = '0.x.x'
  {
    extensions: ['.ts', '.js', '.mjs'],
    pattern: /OSSA_VERSION\s*=\s*['"][\d]+\.[\d]+\.[\d]+(-[\w.]+)?['"]/g,
    replacement: "OSSA_VERSION = '$version'",
  },
  // .env files: OSSA_VERSION=0.x.x
  {
    extensions: ['.env', '.env.example', '.env.local'],
    pattern: /OSSA_VERSION=[\d]+\.[\d]+\.[\d]+(-[\w.]+)?/g,
    replacement: 'OSSA_VERSION=$version',
  },
  // Markdown: version 0.x.x
  {
    extensions: ['.md'],
    pattern: /OSSA\s+v[\d]+\.[\d]+\.[\d]+(-[\w.]+)?/g,
    replacement: 'OSSA v$version',
  },
];

const DEFAULT_PATTERNS = [
  '.agents/**/*.yaml',
  '.agents/**/*.yml',
  '.gitlab/agents/**/*.yaml',
  '.gitlab/agents/**/*.yml',
  '.github/agents/**/*.yaml',
  '.github/agents/**/*.yml',
  'examples/**/*.yaml',
  'examples/**/*.yml',
  'spec/**/*.json',
  'src/**/*.ts',
  'src/**/*.js',
  '.env.example',
  '.version.json',
  '.wiki-config.json',
  'README.md',
  'docs/**/*.md',
];

async function getVersion(rootDir: string): Promise<string> {
  const packageJsonPath = path.join(rootDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

async function findFiles(rootDir: string, patterns: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: rootDir,
      absolute: true,
      nodir: true,
      ignore: ['**/node_modules/**', '**/vendor/**', '**/dist/**'],
    });
    files.push(...matches);
  }

  // Deduplicate
  return [...new Set(files)];
}

function syncFile(
  filePath: string,
  version: string,
  replacements: VersionReplacement[],
  dryRun: boolean
): SyncResult {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath);

  // Find applicable replacements
  const applicableReplacements = replacements.filter(
    (r) => r.extensions.includes(ext) || r.extensions.some((e) => basename.endsWith(e))
  );

  if (applicableReplacements.length === 0) {
    return { file: filePath, updated: false, matches: 0 };
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let totalMatches = 0;
  let updated = false;

  for (const replacement of applicableReplacements) {
    const matches = content.match(replacement.pattern);
    if (matches && matches.length > 0) {
      totalMatches += matches.length;
      const newContent = content.replace(
        replacement.pattern,
        replacement.replacement.replace('$version', version)
      );

      if (newContent !== content) {
        content = newContent;
        updated = true;
      }
    }
  }

  if (updated && !dryRun) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return {
    file: filePath,
    updated,
    matches: totalMatches,
    newValue: version,
  };
}

async function versionSync(config: VersionSyncConfig): Promise<SyncResult[]> {
  const files = await findFiles(config.rootDir, config.patterns);
  const results: SyncResult[] = [];

  console.log(`\n[PKG] OSSA Version Sync`);
  console.log(`   Version: ${config.version}`);
  console.log(`   Mode: ${config.dryRun ? 'Dry Run' : config.checkMode ? 'Check' : 'Sync'}`);
  console.log(`   Files to scan: ${files.length}\n`);

  for (const file of files) {
    const result = syncFile(file, config.version, config.replacements, config.dryRun);

    if (result.matches > 0) {
      results.push(result);

      const status = result.updated ? '[PASS]' : '⏸️';
      const relativePath = path.relative(config.rootDir, result.file);
      console.log(`   ${status} ${relativePath} (${result.matches} matches)`);
    }
  }

  const updatedCount = results.filter((r) => r.updated).length;
  const totalMatches = results.reduce((sum, r) => sum + r.matches, 0);

  console.log(`\n[STATS] Summary:`);
  console.log(`   Files with version strings: ${results.length}`);
  console.log(`   Total version matches: ${totalMatches}`);
  console.log(`   Files updated: ${updatedCount}`);

  return results;
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const checkMode = args.includes('--check');

  const rootDir = process.cwd();

  try {
    const version = await getVersion(rootDir);

    const config: VersionSyncConfig = {
      version,
      rootDir,
      patterns: DEFAULT_PATTERNS,
      replacements: DEFAULT_REPLACEMENTS,
      dryRun,
      checkMode,
    };

    const results = await versionSync(config);

    if (checkMode) {
      const needsUpdate = results.some((r) => r.updated);
      if (needsUpdate) {
        console.log('\n[FAIL] Version sync needed. Run `npm run version:sync` to update.');
        process.exit(1);
      } else {
        console.log('\n[PASS] All versions are in sync.');
      }
    } else if (dryRun) {
      console.log('\n[CHECK] Dry run complete. No files were modified.');
    } else {
      console.log('\n[PASS] Version sync complete.');
    }
  } catch (error) {
    console.error('[FAIL] Error:', error);
    process.exit(1);
  }
}

main();

export { versionSync, VersionSyncConfig, SyncResult, DEFAULT_REPLACEMENTS, DEFAULT_PATTERNS };
