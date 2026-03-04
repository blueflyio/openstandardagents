import * as fs from 'fs';
import { globSync } from 'glob';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * OSSA Architectural Validation Gate
 *
 * This script runs in CI/CD and pre-commit hooks to strictly enforce
 * repository boundaries against autonomous agent drift or human error.
 */
function runAudit() {
  console.log('[OSSA Audit] Starting Architectural Boundary Verification...');
  let hasErrors = false;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, '../../..');

  // Rule 1: No Frontend Code (UI belongs in other repos)
  const forbiddenExts = ['**/*.tsx', '**/*.jsx'];
  forbiddenExts.forEach(pattern => {
    const files = globSync(pattern, { cwd: rootDir, ignore: ['**/node_modules/**'] });
    if (files.length > 0) {
      console.error(`\n❌ [VIOLATION] Forbidden Frontend Code Detected:`);
      files.forEach(f => console.error(`   - ${f}`));
      console.error(`   > OSSA is a specification and SDK. React/UI files are strictly forbidden here.`);
      hasErrors = true;
    }
  });

  // Rule 2: Shell scripts are banned in favor of TypeScript CLI tooling
  const shellScripts = globSync('**/*.sh', { cwd: rootDir, ignore: ['**/node_modules/**', '**/dist/**'] });
  if (shellScripts.length > 0) {
    console.error(`\n❌ [VIOLATION] Shell Scripts Detected:`);
    shellScripts.forEach(f => console.error(`   - ${f}`));
    console.error(`   > Shell scripts are not portable. All tooling must be written in TypeScript execution scripts.`);
    hasErrors = true;
  }

  // Rule 3: DRY Domain Prevention (Prevent agentic overlapping folder creation)
  const srcDirs = fs.readdirSync(path.join(rootDir, 'src'), { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const overlapMaps = [
    { target: 'messaging', forbidden: ['bot', 'messenger', 'chat'] }
  ];

  overlapMaps.forEach(rule => {
    if (srcDirs.includes(rule.target)) {
      rule.forbidden.forEach(badDir => {
        if (srcDirs.includes(badDir)) {
          console.error(`\n❌ [VIOLATION] DRY Domain Violation:`);
          console.error(`   - 'src/${badDir}/' exists simultaneously with 'src/${rule.target}/'.`);
          console.error(`   > Consolidate ${badDir} into the bounded context of ${rule.target}.`);
          hasErrors = true;
        }
      });
    }
  });

  if (hasErrors) {
    console.error(`\n💥 [FAILED] Audit rejected the commit. Follow the .cursorrules architecture parameters.`);
    process.exit(1);
  }

  console.log('✅ [PASSED] Architectural Boundaries Maintained.');
}

runAudit();
