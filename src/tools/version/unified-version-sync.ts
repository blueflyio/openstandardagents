#!/usr/bin/env tsx
/**
 * Unified Version Synchronization
 * 
 * Consolidates all version sync scripts into a single DRY implementation
 * 
 * Usage: npm run version:sync
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

interface VersionConfig {
  current: string;
  latest_stable: string;
  spec_version: string;
  spec_path: string;
}

class UnifiedVersionSync {
  private versionFile: string;
  private versionConfig: VersionConfig;

  constructor() {
    this.versionFile = join(process.cwd(), '.version.json');
    this.versionConfig = this.loadVersionConfig();
  }

  private loadVersionConfig(): VersionConfig {
    try {
      return JSON.parse(readFileSync(this.versionFile, 'utf-8'));
    } catch (error) {
      console.error(`❌ Failed to load ${this.versionFile}:`, error);
      process.exit(1);
    }
  }

  private findFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    function walk(currentDir: string) {
      try {
        const entries = readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip certain directories
            if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
              walk(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = entry.name.split('.').pop()?.toLowerCase();
            if (ext && extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    walk(dir);
    return files;
  }

  private syncFile(filePath: string): boolean {
    try {
      let content = readFileSync(filePath, 'utf-8');
      let updated = false;

      // Replace version placeholders
      const replacements: Record<string, string> = {
        '0.3.3': this.versionConfig.current,
        '0.3.3': this.versionConfig.latest_stable,
        '0.3.3': this.versionConfig.spec_version,
        'spec/v0.3.3': this.versionConfig.spec_path.replace('{version}', this.versionConfig.current),
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        if (content.includes(placeholder)) {
          content = content.replaceAll(placeholder, value);
          updated = true;
        }
      }

      // Also handle package.json version sync
      if (basename(filePath) === 'package.json') {
        const pkg = JSON.parse(content);
        if (pkg.version !== this.versionConfig.current) {
          pkg.version = this.versionConfig.current;
          content = JSON.stringify(pkg, null, 2) + '\n';
          updated = true;
        }
      }

      if (updated) {
        writeFileSync(filePath, content);
        return true;
      }

      return false;
    } catch (error) {
      console.warn(`⚠️  Failed to sync ${filePath}: ${(error as Error).message}`);
      return false;
    }
  }

  async sync(): Promise<void> {
    console.log('🔄 Unified Version Synchronization\n');
    console.log(`📦 Current version: ${this.versionConfig.current}`);
    console.log(`📦 Stable version: ${this.versionConfig.latest_stable}`);
    console.log(`📦 Spec version: ${this.versionConfig.spec_version}\n`);

    // Find all files that might contain version placeholders
    const extensions = ['json', 'yaml', 'yml', 'md', 'ts', 'js'];
    const files = this.findFiles(process.cwd(), extensions);

    console.log(`📁 Scanning ${files.length} file(s)...\n`);

    let synced = 0;
    for (const file of files) {
      if (this.syncFile(file)) {
        console.log(`✅ Synced: ${file.replace(process.cwd() + '/', '')}`);
        synced++;
      }
    }

    if (synced === 0) {
      console.log('ℹ️  No files needed version synchronization');
    } else {
      console.log(`\n✅ Synchronized ${synced} file(s)`);
    }
  }
}

// Run sync
const syncer = new UnifiedVersionSync();
syncer.sync().catch((error) => {
  console.error('❌ Error syncing versions:', error);
  process.exit(1);
});

