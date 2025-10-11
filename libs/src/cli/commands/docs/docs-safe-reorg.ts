/**
 * OSSA Documentation Safe Reorganization Tool
 * Preserves git history and provides incremental, reversible changes
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface ReorgOptions {
  dryRun: boolean;
  category: string;
}

export async function main(options: ReorgOptions = { dryRun: false, category: 'status' }) {
  try {
    console.log(chalk.blue('📚 OSSA Documentation Safe Reorganization Tool'));
    console.log(chalk.blue('=============================================='));
    console.log('');

    const DOCS_DIR = '/Users/flux423/Sites/LLM/OSSA/docs';

    if (options.dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made'));
      console.log('');
    }

    // Function to safely move with git
    function gitMove(source: string, dest: string): void {
      if (options.dryRun) {
        console.log(chalk.cyan(`[DRY RUN] Would move: ${source} → ${dest}`));
        return;
      }

      if (fs.existsSync(source)) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        execSync(`git mv "${source}" "${dest}"`, { stdio: 'inherit' });
        console.log(chalk.green(`✅ Moved: ${source} → ${dest}`));
      } else {
        console.log(chalk.red(`❌ Source not found: ${source}`));
      }
    }

    // Reorganization logic based on category
    switch (options.category) {
      case 'status':
        console.log(chalk.blue('📊 Current documentation structure:'));
        if (fs.existsSync(DOCS_DIR)) {
          execSync(`find "${DOCS_DIR}" -type f -name "*.md" | head -20`, { stdio: 'inherit' });
        }
        break;

      case 'reorganize':
        console.log(chalk.blue('🔄 Starting documentation reorganization...'));

        // Create new structure
        const newDirs = [
          `${DOCS_DIR}/api`,
          `${DOCS_DIR}/guides`,
          `${DOCS_DIR}/specifications`,
          `${DOCS_DIR}/architecture`
        ];

        newDirs.forEach((dir) => {
          if (!fs.existsSync(dir) && !options.dryRun) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(chalk.green(`✅ Created directory: ${dir}`));
          }
        });

        // Move files to appropriate locations
        const moves = [
          [`${DOCS_DIR}/api-reference.md`, `${DOCS_DIR}/api/reference.md`],
          [`${DOCS_DIR}/getting-started.md`, `${DOCS_DIR}/guides/getting-started.md`],
          [`${DOCS_DIR}/specification.md`, `${DOCS_DIR}/specifications/ossa.md`]
        ];

        moves.forEach(([source, dest]) => gitMove(source, dest));
        break;

      default:
        console.log(chalk.yellow(`Unknown category: ${options.category}`));
        console.log('Available categories: status, reorganize');
    }
  } catch (error) {
    console.error(chalk.red('❌ Error during documentation reorganization:'), error);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
  const category = process.argv.find((arg) => !arg.startsWith('-') && arg !== __filename.split('/').pop()) || 'status';

  main({ dryRun, category });
}
