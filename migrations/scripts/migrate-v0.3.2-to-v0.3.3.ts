#!/usr/bin/env tsx
/**
 * Migration Script: v0.3.2 → v0.3.3
 *
 * Automatically migrates OSSA manifests from v0.3.2 to v0.3.3
 *
 * Features:
 * - Updates apiVersion from ossa/v0.3.2 to ossa/v0.3.3
 * - Optionally adds Skills extension if requested
 * - Preserves all existing configuration
 * - Adds migration annotations
 *
 * Usage:
 *   tsx migrations/scripts/migrate-v0.3.2-to-v0.3.3.ts <manifest-file> [--add-skills]
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';
import type { OssaAgent } from '../../src/types/index.js';

interface MigrationOptions {
  addSkills?: boolean;
  dryRun?: boolean;
}

function migrateManifest(filePath: string, options: MigrationOptions = {}): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const manifest = parse(content) as OssaAgent;

    // Check if already migrated
    if (manifest.apiVersion === 'ossa/v0.3.3') {
      console.log(`✅ ${filePath} is already at v0.3.3`);
      return;
    }

    // Check if source version is v0.3.2
    if (manifest.apiVersion !== 'ossa/v0.3.2') {
      console.log(`⚠️  ${filePath} is not v0.3.2 (current: ${manifest.apiVersion}), skipping`);
      return;
    }

    console.log(`🔄 Migrating ${filePath} from v0.3.2 to v0.3.3...`);

    // Update apiVersion
    manifest.apiVersion = 'ossa/v0.3.3';

    // Ensure metadata exists
    if (!manifest.metadata) {
      manifest.metadata = { name: 'unknown' };
    }

    // Add migration annotation
    if (!manifest.metadata.annotations) {
      manifest.metadata.annotations = {};
    }
    manifest.metadata.annotations['ossa.io/migration'] = 'v0.3.2-to-v0.3.3';
    manifest.metadata.annotations['ossa.io/migrated-date'] = new Date().toISOString().split('T')[0];

    // Optionally add Skills extension
    if (options.addSkills) {
      if (!manifest.extensions) {
        manifest.extensions = {};
      }
      manifest.extensions.skills = {
        enabled: true,
        platforms: ['Claude', 'Claude Code', 'Cursor'],
        allowedTools: ['Read', 'Write', 'Bash'],
        progressiveDisclosure: {
          metadataTokens: 100,
          instructionsTokens: 5000
        }
      };
      console.log(`  ✓ Added Skills extension`);
    }

    if (options.dryRun) {
      console.log(`  📝 Dry run - would write:`);
      console.log(stringify(manifest, { indent: 2 }));
    } else {
      writeFileSync(filePath, stringify(manifest, { indent: 2 }), 'utf-8');
      console.log(`  ✅ Migration complete`);
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const filePath = args[0];
const options: MigrationOptions = {
  addSkills: args.includes('--add-skills'),
  dryRun: args.includes('--dry-run')
};

if (!filePath) {
  console.error('Usage: tsx migrations/scripts/migrate-v0.3.2-to-v0.3.3.ts <manifest-file> [--add-skills] [--dry-run]');
  process.exit(1);
}

migrateManifest(filePath, options);
