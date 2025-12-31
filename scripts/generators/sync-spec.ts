#!/usr/bin/env tsx
/**
 * OSSA Spec & Examples Sync Script
 *
 * Syncs OSSA schema files and examples from @bluefly/openstandardagents package
 * to the openstandardagents.org website public directories.
 *
 * Usage:
 *   pnpm sync:spec              # Sync everything
 *   pnpm sync:spec --schema     # Sync schema only
 *   pnpm sync:spec --examples   # Sync examples only
 *   pnpm sync:spec --dry-run    # Preview changes without writing
 *
 * @author OSSA Platform Team
 * @license Apache-2.0
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SyncOptions {
  schema: boolean;
  examples: boolean;
  dryRun: boolean;
  verbose: boolean;
}

interface SyncStats {
  schemaFiles: number;
  exampleFiles: number;
  totalSize: number;
  errors: string[];
}

class OSSASyncService {
  private readonly projectRoot: string;
  private readonly packageRoot: string;
  private readonly websitePublicDir: string;
  private stats: SyncStats;

  constructor() {
    this.projectRoot = join(__dirname, '..');
    this.websitePublicDir = join(this.projectRoot, 'website', 'public');

    // Try to locate @bluefly/openstandardagents package
    this.packageRoot = this.findPackageRoot();

    this.stats = {
      schemaFiles: 0,
      exampleFiles: 0,
      totalSize: 0,
      errors: []
    };
  }

  private findPackageRoot(): string {
    // Try different locations for the package
    const possiblePaths = [
      // node_modules in project root
      join(this.projectRoot, 'node_modules', '@bluefly', 'openstandardagents'),
      // node_modules in website workspace
      join(this.projectRoot, 'website', 'node_modules', '@bluefly', 'openstandardagents'),
      // pnpm global store (for development)
      join(this.projectRoot, '..', 'openstandardagents'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(join(path, 'package.json'))) {
        return path;
      }
    }

    throw new Error(
      '@bluefly/openstandardagents package not found. ' +
      'Please run: pnpm add -D @bluefly/openstandardagents'
    );
  }

  private log(message: string, verbose = false): void {
    if (!verbose) {
      console.log(`🔄 ${message}`);
    }
  }

  private logVerbose(message: string): void {
    console.log(`   ${message}`);
  }

  private logSuccess(message: string): void {
    console.log(`✅ ${message}`);
  }

  private logError(message: string): void {
    console.error(`❌ ${message}`);
    this.stats.errors.push(message);
  }

  private ensureDir(dir: string, dryRun: boolean): void {
    if (!dryRun && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private getFileSize(filePath: string): number {
    try {
      return statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  private copyFile(src: string, dest: string, dryRun: boolean, verbose: boolean): boolean {
    try {
      const size = this.getFileSize(src);
      this.stats.totalSize += size;

      if (verbose) {
        this.logVerbose(`${relative(this.packageRoot, src)} → ${relative(this.projectRoot, dest)}`);
      }

      if (!dryRun) {
        this.ensureDir(dirname(dest), dryRun);
        cpSync(src, dest);
      }
      return true;
    } catch (error) {
      this.logError(`Failed to copy ${src}: ${error}`);
      return false;
    }
  }

  private copyDirectory(src: string, dest: string, dryRun: boolean, verbose: boolean): number {
    let count = 0;

    if (!existsSync(src)) {
      this.logError(`Source directory not found: ${src}`);
      return 0;
    }

    this.ensureDir(dest, dryRun);

    const entries = readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        count += this.copyDirectory(srcPath, destPath, dryRun, verbose);
      } else if (entry.isFile()) {
        if (this.copyFile(srcPath, destPath, dryRun, verbose)) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Sync OSSA schema files from package to website
   */
  async syncSchema(dryRun: boolean, verbose: boolean): Promise<void> {
    this.log('Syncing OSSA schema files...');

    const schemaSource = join(this.packageRoot, 'spec');
    const schemaDest = join(this.websitePublicDir, 'schema');

    if (!existsSync(schemaSource)) {
      this.logError(`Schema source not found: ${schemaSource}`);
      return;
    }

    // Get package version to determine latest schema
    const packageJsonPath = join(this.packageRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version;

    this.log(`Current OSSA version: ${version}`);

    // Copy all schema versions
    const count = this.copyDirectory(schemaSource, schemaDest, dryRun, verbose);
    this.stats.schemaFiles = count;

    // Create a latest.json symlink/copy pointing to current version
    const latestSchemaPath = join(schemaSource, `v${version}`, `ossa-${version}.schema.json`);
    const latestDest = join(schemaDest, 'latest.json');

    if (existsSync(latestSchemaPath)) {
      this.copyFile(latestSchemaPath, latestDest, dryRun, verbose);
      this.logSuccess(`Schema synced: ${count} files from v${version}`);
    } else {
      this.logError(`Latest schema not found at: ${latestSchemaPath}`);
    }

    // Generate index.json with metadata
    await this.generateSchemaIndex(schemaDest, dryRun);
  }

  /**
   * Generate schema index metadata
   */
  private async generateSchemaIndex(schemaDir: string, dryRun: boolean): Promise<void> {
    const versions: any[] = [];

    if (!existsSync(schemaDir) || dryRun) {
      return;
    }

    const entries = readdirSync(schemaDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('v')) {
        const version = entry.name.substring(1);
        const schemaFiles = readdirSync(join(schemaDir, entry.name))
          .filter(f => f.endsWith('.schema.json'));

        versions.push({
          version,
          path: `schema/${entry.name}`,
          schemas: schemaFiles,
          date: statSync(join(schemaDir, entry.name)).mtime.toISOString()
        });
      }
    }

    // Sort by version descending
    versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

    const indexData = {
      latest: versions[0]?.version || null,
      versions,
      generated: new Date().toISOString()
    };

    const indexPath = join(schemaDir, 'index.json');
    if (!dryRun) {
      writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
      this.logVerbose('Generated schema/index.json');
    }
  }

  /**
   * Sync OSSA examples from package to website
   */
  async syncExamples(dryRun: boolean, verbose: boolean): Promise<void> {
    this.log('Syncing OSSA examples...');

    const examplesSource = join(this.packageRoot, 'examples');
    const examplesDest = join(this.websitePublicDir, 'examples');

    if (!existsSync(examplesSource)) {
      this.logError(`Examples source not found: ${examplesSource}`);
      return;
    }

    const count = this.copyDirectory(examplesSource, examplesDest, dryRun, verbose);
    this.stats.exampleFiles = count;

    this.logSuccess(`Examples synced: ${count} files`);

    // Generate examples index
    await this.generateExamplesIndex(examplesDest, dryRun);
  }

  /**
   * Generate examples index metadata
   */
  private async generateExamplesIndex(examplesDir: string, dryRun: boolean): Promise<void> {
    const categories: any[] = [];

    if (!existsSync(examplesDir) || dryRun) {
      return;
    }

    const entries = readdirSync(examplesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const categoryPath = join(examplesDir, entry.name);
        const files = readdirSync(categoryPath, { withFileTypes: true })
          .filter(f => f.isFile())
          .map(f => ({
            name: f.name,
            path: `examples/${entry.name}/${f.name}`,
            size: this.getFileSize(join(categoryPath, f.name))
          }));

        // Try to read README if exists
        const readmePath = join(categoryPath, 'README.md');
        let description = '';
        if (existsSync(readmePath)) {
          const readme = readFileSync(readmePath, 'utf-8');
          // Extract first paragraph as description
          const firstPara = readme.split('\n\n')[0];
          description = firstPara.replace(/^#+ /, '').trim();
        }

        categories.push({
          name: entry.name,
          description,
          path: `examples/${entry.name}`,
          files
        });
      }
    }

    const indexData = {
      categories,
      total: categories.reduce((sum, cat) => sum + cat.files.length, 0),
      generated: new Date().toISOString()
    };

    const indexPath = join(examplesDir, 'index.json');
    if (!dryRun) {
      writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
      this.logVerbose('Generated examples/index.json');
    }
  }

  /**
   * Print sync statistics
   */
  private printStats(): void {
    console.log('\n📊 Sync Statistics:');
    console.log(`   Schema files: ${this.stats.schemaFiles}`);
    console.log(`   Example files: ${this.stats.exampleFiles}`);
    console.log(`   Total size: ${(this.stats.totalSize / 1024).toFixed(2)} KB`);

    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(err => console.log(`   - ${err}`));
    }
  }

  /**
   * Main sync execution
   */
  async sync(options: SyncOptions): Promise<void> {
    console.log('🚀 OSSA Spec & Examples Sync\n');
    console.log(`📦 Package: ${this.packageRoot}`);
    console.log(`🌐 Website: ${this.websitePublicDir}\n`);

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    try {
      if (options.schema) {
        await this.syncSchema(options.dryRun, options.verbose);
      }

      if (options.examples) {
        await this.syncExamples(options.dryRun, options.verbose);
      }

      this.printStats();

      if (this.stats.errors.length === 0) {
        console.log('\n✅ Sync completed successfully!');
      } else {
        console.log('\n⚠️  Sync completed with errors');
        process.exit(1);
      }
    } catch (error) {
      console.error(`\n❌ Sync failed: ${error}`);
      process.exit(1);
    }
  }
}

// CLI parsing
function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);

  const options: SyncOptions = {
    schema: false,
    examples: false,
    dryRun: false,
    verbose: false
  };

  // If no specific targets, sync everything
  const hasTarget = args.includes('--schema') || args.includes('--examples');

  if (!hasTarget) {
    options.schema = true;
    options.examples = true;
  } else {
    options.schema = args.includes('--schema');
    options.examples = args.includes('--examples');
  }

  options.dryRun = args.includes('--dry-run');
  options.verbose = args.includes('--verbose') || args.includes('-v');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: pnpm sync:spec [options]

Options:
  --schema      Sync schema files only
  --examples    Sync examples only
  --dry-run     Preview changes without writing
  --verbose, -v Verbose output
  --help, -h    Show this help

Examples:
  pnpm sync:spec              # Sync everything
  pnpm sync:spec --schema     # Sync schema only
  pnpm sync:spec --dry-run    # Preview changes
    `);
    process.exit(0);
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  const service = new OSSASyncService();
  await service.sync(options);
}

main().catch(console.error);
