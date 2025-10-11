/**
 * Automated Import Path Fixer
 * Resolves all import path errors using IMPORT_PATH_MAPPINGS.json
 * Integrated into OSSA CLI as `ossa fix imports`
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

export interface ImportMapping {
  [key: string]: string;
}

export interface FixResult {
  file: string;
  originalImports: string[];
  fixedImports: string[];
  errors: string[];
}

export interface FixSummary {
  totalFiles: number;
  filesFixed: number;
  importsFix: number;
  errors: number;
  results: FixResult[];
  timestamp: string;
}

export class ImportFixer {
  private mappings: ImportMapping = {};
  private rootDir: string;
  private backupDir: string;
  private results: FixResult[] = [];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.backupDir = path.join(rootDir, '.import-fixer-backups', new Date().toISOString().replace(/[:.]/g, '-'));
  }

  /**
   * Load import path mappings from IMPORT_PATH_MAPPINGS.json
   */
  async loadMappings(): Promise<void> {
    const mappingPath = path.join(this.rootDir, 'IMPORT_PATH_MAPPINGS.json');

    if (!fs.existsSync(mappingPath)) {
      throw new Error(`Import mappings file not found: ${mappingPath}`);
    }

    const content = fs.readFileSync(mappingPath, 'utf8');
    this.mappings = JSON.parse(content);

    console.log(chalk.blue(`✓ Loaded ${Object.keys(this.mappings).length} import mappings`));
  }

  /**
   * Get all TypeScript files in the project
   */
  private getAllTsFiles(): string[] {
    const files: string[] = [];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules, dist, .git
          if (!['node_modules', 'dist', '.git', '.agents', 'coverage'].includes(entry)) {
            walk(fullPath);
          }
        } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    };

    walk(this.rootDir);
    return files;
  }

  /**
   * Backup a file before modification
   */
  private backupFile(filePath: string): void {
    const relativePath = path.relative(this.rootDir, filePath);
    const backupPath = path.join(this.backupDir, relativePath);
    const backupDir = path.dirname(backupPath);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.copyFileSync(filePath, backupPath);
  }

  /**
   * Fix imports in a single file
   */
  private fixFileImports(filePath: string): FixResult {
    const result: FixResult = {
      file: path.relative(this.rootDir, filePath),
      originalImports: [],
      fixedImports: [],
      errors: []
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let modified = false;

      const newLines = lines.map((line) => {
        // Match import statements
        const importMatch = line.match(/^(import\s+(?:{[^}]+}|[^'"]+)\s+from\s+['"])([^'"]+)(['"];?)$/);

        if (importMatch) {
          const [, prefix, importPath, suffix] = importMatch;
          result.originalImports.push(importPath);

          // Check if this import needs to be fixed
          if (this.mappings[importPath]) {
            const newPath = this.mappings[importPath];
            result.fixedImports.push(newPath);
            modified = true;
            return `${prefix}${newPath}${suffix}`;
          }

          // Check for partial matches (e.g., '../utils/logger' -> '../../core/utils/logger')
          for (const [oldPath, newPath] of Object.entries(this.mappings)) {
            if (importPath.includes(oldPath) && oldPath.includes('/')) {
              const fixedPath = importPath.replace(oldPath, newPath);
              result.fixedImports.push(fixedPath);
              modified = true;
              return `${prefix}${fixedPath}${suffix}`;
            }
          }
        }

        return line;
      });

      if (modified) {
        this.backupFile(filePath);
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      }

      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }
  }

  /**
   * Run the automated fixer
   */
  async fix(options: { dryRun?: boolean; validate?: boolean } = {}): Promise<FixSummary> {
    console.log(chalk.bold.cyan('\n🔧 OSSA Automated Import Fixer\n'));

    // Git safety check
    try {
      const status = execSync('git status --porcelain', { cwd: this.rootDir, encoding: 'utf8' });
      if (status.trim() !== '') {
        console.log(chalk.yellow('⚠️  Warning: Working directory has uncommitted changes'));
        console.log(chalk.yellow('   Create a backup or commit changes before proceeding'));

        if (!options.dryRun) {
          throw new Error('Refusing to modify files with uncommitted changes. Use --dry-run to test.');
        }
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not check git status'));
    }

    // Load mappings
    await this.loadMappings();

    // Get all files
    const files = this.getAllTsFiles();
    console.log(chalk.blue(`📁 Found ${files.length} TypeScript files\n`));

    // Process files
    let filesFixed = 0;
    let totalImports = 0;

    for (const file of files) {
      const result = this.fixFileImports(file);

      if (result.fixedImports.length > 0) {
        filesFixed++;
        totalImports += result.fixedImports.length;

        console.log(chalk.green(`✓ ${result.file}`));
        console.log(chalk.gray(`  Fixed ${result.fixedImports.length} import(s)`));

        this.results.push(result);
      }

      if (result.errors.length > 0) {
        console.log(chalk.red(`✗ ${result.file}`));
        result.errors.forEach((err) => console.log(chalk.red(`  Error: ${err}`)));
        this.results.push(result);
      }
    }

    // Build summary
    const summary: FixSummary = {
      totalFiles: files.length,
      filesFixed,
      importsFix: totalImports,
      errors: this.results.filter((r) => r.errors.length > 0).length,
      results: this.results,
      timestamp: new Date().toISOString()
    };

    // Save report
    const reportPath = path.join(this.rootDir, 'reports', `import-fix-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf8');

    // Print summary
    console.log(chalk.bold.cyan('\n📊 Summary\n'));
    console.log(`  Total files scanned: ${summary.totalFiles}`);
    console.log(chalk.green(`  Files fixed: ${summary.filesFixed}`));
    console.log(chalk.green(`  Imports fixed: ${summary.importsFix}`));
    console.log(chalk.red(`  Errors: ${summary.errors}`));
    console.log(chalk.gray(`\n  Report saved: ${path.relative(this.rootDir, reportPath)}`));

    if (this.results.length > 0) {
      console.log(chalk.gray(`  Backups saved: ${path.relative(this.rootDir, this.backupDir)}`));
    }

    // Validate if requested
    if (options.validate && !options.dryRun) {
      console.log(chalk.bold.cyan('\n🔍 Validating TypeScript compilation...\n'));

      try {
        execSync('npx tsc --noEmit', { cwd: this.rootDir, stdio: 'inherit' });
        console.log(chalk.green('\n✅ TypeScript validation passed!'));
      } catch (error) {
        console.log(chalk.red('\n❌ TypeScript validation failed'));
        console.log(chalk.yellow('   Review errors above and run fix again if needed'));
      }
    }

    return summary;
  }

  /**
   * Generate a revert script to undo all changes
   */
  generateRevertScript(): string {
    const scriptPath = path.join(this.rootDir, 'revert-import-fixes.sh');

    const script = [
      '#!/bin/bash',
      '# Revert all import fixes',
      '# Generated by OSSA Import Fixer',
      '',
      `BACKUP_DIR="${path.relative(this.rootDir, this.backupDir)}"`,
      '',
      'echo "Reverting import fixes..."',
      '',
      ...this.results
        .filter((r) => r.fixedImports.length > 0)
        .map((r) => {
          const backupPath = path.join('$BACKUP_DIR', r.file);
          return `cp "${backupPath}" "${r.file}"`;
        }),
      '',
      'echo "✓ Reverted all changes"',
      `echo "Backups remain in: $BACKUP_DIR"`
    ].join('\n');

    fs.writeFileSync(scriptPath, script, { mode: 0o755 });

    return scriptPath;
  }
}

/**
 * CLI Command Handler
 */
export async function fixImportsCommand(options: { dryRun?: boolean; validate?: boolean }): Promise<void> {
  const fixer = new ImportFixer();

  try {
    const summary = await fixer.fix(options);

    if (summary.filesFixed > 0) {
      const revertScript = fixer.generateRevertScript();
      console.log(chalk.bold.cyan('\n🔄 Revert Script Generated\n'));
      console.log(chalk.gray(`  Run to undo: ./${path.basename(revertScript)}`));
    }

    if (options.dryRun) {
      console.log(chalk.yellow('\n⚠️  Dry run mode - no files were modified'));
    }

    process.exit(summary.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('\n❌ Import fixer failed:'));
    console.error(chalk.red(`   ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
