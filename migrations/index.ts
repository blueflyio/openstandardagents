#!/usr/bin/env tsx
/**
 * OSSA Migration Runner
 *
 * Automatically detects installed version and applies necessary migrations
 *
 * This follows npm best practices:
 * - Runs on postinstall (via package.json scripts)
 * - Detects version from package.json
 * - Applies migrations incrementally
 * - Tracks migration state in .migration-state.json
 * - Supports dry-run mode
 *
 * Usage:
 *   npm run migrate          # Auto-detect and migrate
 *   npm run migrate:check   # Check migration status
 *   npm run migrate:dry     # Dry run without changes
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { parse, stringify } from 'yaml';
import type { OssaAgent } from '../src/types/index.js';

interface MigrationState {
  lastMigratedVersion: string | null;
  migrations: Array<{
    version: string;
    date: string;
    files: string[];
  }>;
}

interface Migration {
  from: string;
  to: string;
  script: string;
  description: string;
}

// Migration registry - add new migrations here
const MIGRATIONS: Migration[] = [
  {
    from: '0.3.3',
    to: '0.3.3',
    script: 'migrations/scripts/migrate-v0.3.3-to-v0.3.3.ts',
    description: 'Add Skills Compatibility Extension'
  }
  // Add future migrations here:
  // {
  //   from: '0.3.3',
  //   to: '0.3.4',
  //   script: 'migrations/scripts/migrate-v0.3.3-to-v0.3.4.ts',
  //   description: 'Description of changes'
  // }
];

class MigrationRunner {
  private stateFile: string;
  private state: MigrationState;
  private currentVersion: string;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.stateFile = join(this.projectRoot, '.migration-state.json');
    this.state = this.loadState();
    this.currentVersion = this.getCurrentVersion();
  }

  private loadState(): MigrationState {
    if (existsSync(this.stateFile)) {
      try {
        return JSON.parse(readFileSync(this.stateFile, 'utf-8'));
      } catch {
        // Invalid state file, start fresh
      }
    }
    return {
      lastMigratedVersion: null,
      migrations: []
    };
  }

  private saveState(): void {
    writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2) + '\n');
  }

  private getCurrentVersion(): string {
    // Try to get from package.json first
    try {
      const pkg = JSON.parse(readFileSync(join(this.projectRoot, 'package.json'), 'utf-8'));
      const version = pkg.version;

      // Check if version is a template placeholder (e.g., "0.3.6")
      if (version && !this.isTemplateVersion(version)) {
        return version;
      }
      // If version is a template placeholder, fall through to spec directory discovery
    } catch {
      // Fall through to spec directory discovery
    }

    // Fallback: get latest version from spec directory
    const specDir = join(this.projectRoot, 'spec');
    if (existsSync(specDir)) {
      try {
        const dirs = readdirSync(specDir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory() && dirent.name.startsWith('v'))
          .map((dirent) => dirent.name)
          .sort((a: string, b: string) => {
            // Sort versions numerically (e.g., v0.3.3 < v0.3.3 < v0.3.3)
            const v1 = a.replace(/^v/, '').split('.').map(Number);
            const v2 = b.replace(/^v/, '').split('.').map(Number);
            for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
              const p1 = v1[i] || 0;
              const p2 = v2[i] || 0;
              if (p1 < p2) return -1;
              if (p1 > p2) return 1;
            }
            return 0;
          });

        if (dirs.length > 0) {
          // Return the highest version (last in sorted array), remove 'v' prefix
          return dirs[dirs.length - 1].replace(/^v/, '');
        }
      } catch {
        // Continue to error handling
      }
    }

    // Ultimate fallback - should never reach here in normal operation
    console.error('❌ Could not determine current version from package.json or spec directory');
    console.error('   package.json version is a placeholder (0.3.6) and no spec directories found');
    process.exit(1);
  }

  /**
   * Check if version string is a template placeholder
   */
  private isTemplateVersion(version: string): boolean {
    return /^\{\{[A-Z_]+\}\}$/.test(version);
  }

  private getManifestVersion(filePath: string): string | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const manifest = parse(content) as OssaAgent;
      if (manifest.apiVersion && manifest.apiVersion.startsWith('ossa/v')) {
        return manifest.apiVersion.replace('ossa/v', '');
      }
    } catch {
      // Not a valid manifest
    }
    return null;
  }

  private findManifestFiles(): string[] {
    const patterns = [
      '**/*.ossa.yaml',
      '**/*.ossa.yml',
      '**/agent.yml',
      '**/agent.yaml',
      '.gitlab/agents/**/*.yaml',
      'examples/**/*.yaml',
      'examples/**/*.yml'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = glob.sync(pattern, {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', 'dist/**', '.git/**']
      });
      files.push(...matches.map(f => join(this.projectRoot, f)));
    }

    return [...new Set(files)]; // Remove duplicates
  }


  private compareVersions(v1: string, v2: string): number {
    // Validate inputs - reject template placeholders or invalid versions
    if (this.isTemplateVersion(v1) || this.isTemplateVersion(v2)) {
      throw new Error(`Cannot compare template version placeholder: ${this.isTemplateVersion(v1) ? v1 : v2}`);
    }

    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    // Validate that all parts are valid numbers (not NaN)
    if (parts1.some(isNaN) || parts2.some(isNaN)) {
      throw new Error(`Invalid version format: ${parts1.some(isNaN) ? v1 : v2}`);
    }

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }

  async check(): Promise<void> {
    console.log('🔍 Checking migration status...\n');
    console.log(`📦 Current package version: ${this.currentVersion}`);
    console.log(`📦 Last migrated version: ${this.state.lastMigratedVersion || 'none'}\n`);

    const files = this.findManifestFiles();
    const needsMigration: Array<{ file: string; version: string }> = [];

    for (const file of files) {
      const version = this.getManifestVersion(file);
      if (!version) continue;

      // Check if any migrations apply to this version
      const applicableMigrations = MIGRATIONS.filter(m => {
        const manifestNeedsMigration = this.compareVersions(version, m.from) === 0;
        const packageSupportsTarget = this.compareVersions(this.currentVersion, m.to) >= 0;
        return manifestNeedsMigration && packageSupportsTarget;
      });

      if (applicableMigrations.length > 0) {
        needsMigration.push({ file, version });
      }
    }

    if (needsMigration.length === 0) {
      console.log('✅ All manifests are up to date');
    } else {
      console.log(`⚠️  Found ${needsMigration.length} manifest(s) needing migration:\n`);
      for (const { file, version } of needsMigration) {
        console.log(`  ${file.replace(this.projectRoot + '/', '')} (${version})`);
      }
    }
  }

  async migrate(dryRun = false): Promise<void> {
    console.log('🔄 OSSA Migration Runner\n');
    console.log(`📦 Current package version: ${this.currentVersion}`);
    console.log(`📦 Last migrated version: ${this.state.lastMigratedVersion || 'none'}\n`);

    const files = this.findManifestFiles();
    const migratedFiles: string[] = [];

    for (const file of files) {
      const version = this.getManifestVersion(file);
      if (!version) continue;

      // Find applicable migrations
      // A migration applies if:
      // 1. Manifest version matches migration.from (or is older)
      // 2. Current package version matches migration.to (or is newer)
      const applicableMigrations = MIGRATIONS.filter(m => {
        // Check if manifest version needs this migration
        const manifestNeedsMigration = this.compareVersions(version, m.from) === 0;
        // Check if current package version supports this migration target
        const packageSupportsTarget = this.compareVersions(this.currentVersion, m.to) >= 0;
        return manifestNeedsMigration && packageSupportsTarget;
      });

      if (applicableMigrations.length === 0) continue;

      console.log(`🔄 Migrating ${file.replace(this.projectRoot + '/', '')}...`);

      for (const migration of applicableMigrations) {
        console.log(`  → ${migration.from} → ${migration.to}: ${migration.description}`);

        if (!dryRun) {
          // Execute migration script
          const { execSync } = await import('child_process');
          try {
            execSync(`tsx ${migration.script} "${file}"`, {
              cwd: this.projectRoot,
              stdio: 'inherit'
            });
            migratedFiles.push(file);
          } catch (error) {
            console.error(`  ❌ Migration failed: ${error}`);
          }
        } else {
          console.log(`  📝 Dry run - would execute: tsx ${migration.script} "${file}"`);
        }
      }
    }

    if (migratedFiles.length > 0 && !dryRun) {
      this.state.lastMigratedVersion = this.currentVersion;
      this.state.migrations.push({
        version: this.currentVersion,
        date: new Date().toISOString(),
        files: migratedFiles
      });
      this.saveState();
      console.log(`\n✅ Migrated ${migratedFiles.length} file(s)`);
    } else if (dryRun) {
      console.log(`\n📝 Dry run complete - no changes made`);
    } else {
      console.log(`\n✅ All manifests are up to date`);
    }
  }
}

// Main execution
const command = process.argv[2] || 'migrate';

// Skip migrations if SKIP_MIGRATIONS env var is set (useful for CI/CD)
if (process.env.SKIP_MIGRATIONS === 'true' && command === 'migrate') {
  console.log('⏭️  Skipping migrations (SKIP_MIGRATIONS=true)');
  process.exit(0);
}

const runner = new MigrationRunner();

if (command === 'check') {
  runner.check().catch((error) => {
    console.error('❌ Migration check failed:', error);
    process.exit(1);
  });
} else if (command === 'dry-run' || command === 'dry') {
  runner.migrate(true).catch((error) => {
    console.error('❌ Migration dry-run failed:', error);
    process.exit(1);
  });
} else if (command === 'migrate') {
  runner.migrate(false).catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
} else {
  console.error('Usage: npm run migrate [check|dry-run|migrate]');
  process.exit(1);
}
