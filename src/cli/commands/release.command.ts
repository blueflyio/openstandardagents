/**
 * OSSA Release Command Group
 *
 * OSSA-native version management commands (platform-agnostic).
 * GitLab-specific commands (tag, milestone) have been moved to the
 * GitLab extension at: src/cli/extensions/gitlab-release.commands.ts
 *
 * This file contains ONLY the version management commands which work
 * with local files (.version.json, package.json) and don't require
 * any external API access.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { z } from 'zod';
import { outputJSON } from '../utils/index.js';

// ============================================================================
// Version Subcommands - Consolidates ALL version management
// Replaces: bump-version.ts, sync-version.js, sync-versions.ts,
//           version-sync.ts, ci-version-sync.ts, enhanced-version-manager.ts,
//           version-examples.ts, sync-example-versions.sh
// ============================================================================

const versionCommand = new Command('version')
  .description('Version management (bump, sync, check)')
  .alias('ver')
  .alias('v');

// Schema for .version.json
const VersionConfigSchema = z.object({
  current: z.string(),
  latest_stable: z.string(),
  spec_version: z.string(),
  spec_path: z.string(),
  schema_file: z.string(),
});

type VersionConfig = z.infer<typeof VersionConfigSchema>;

/**
 * Read version config from .version.json
 */
async function readVersionConfig(): Promise<VersionConfig> {
  const fs = await import('fs');
  const path = await import('path');
  const configPath = path.join(process.cwd(), '.version.json');

  if (!fs.existsSync(configPath)) {
    throw new Error('.version.json not found. Run from project root.');
  }

  const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return VersionConfigSchema.parse(content);
}

/**
 * Write version config to .version.json
 */
async function writeVersionConfig(config: VersionConfig): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const configPath = path.join(process.cwd(), '.version.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Bump version according to semver rules
 */
function bumpVersion(current: string, type: 'major' | 'minor' | 'patch' | 'rc' | 'release'): string {
  // Handle RC → release
  const rcMatch = current.match(/^(\d+)\.(\d+)\.(\d+)-RC$/);
  if (rcMatch && type === 'release') {
    return `${rcMatch[1]}.${rcMatch[2]}.${rcMatch[3]}`;
  }

  // Parse version
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)(-.*)?$/);
  if (!match) throw new Error(`Invalid version: ${current}`);

  const [, majorStr, minorStr, patchStr] = match;
  const major = parseInt(majorStr, 10);
  const minor = parseInt(minorStr, 10);
  const patch = parseInt(patchStr, 10);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'rc':
      return `${major}.${minor}.${patch + 1}-RC`;
    case 'release':
      return `${major}.${minor}.${patch}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

versionCommand
  .command('bump')
  .description('Bump version (major, minor, patch, rc, release)')
  .argument('<type>', 'Bump type: major | minor | patch | rc | release')
  .option('--dry-run', 'Show what would change without making changes')
  .action(async (type: string, options: { dryRun?: boolean }) => {
    try {
      const validTypes = ['major', 'minor', 'patch', 'rc', 'release'];
      if (!validTypes.includes(type)) {
        console.error(chalk.red(`[FAIL] Invalid type. Must be one of: ${validTypes.join(', ')}`));
        process.exit(1);
      }

      const config = await readVersionConfig();
      const newVersion = bumpVersion(config.current, type as 'major' | 'minor' | 'patch' | 'rc' | 'release');

      console.log(chalk.blue(`[PKG] Version bump: ${type}`));
      console.log(chalk.cyan(`   Current: ${config.current}`));
      console.log(chalk.green(`   New:     ${newVersion}`));

      if (options.dryRun) {
        console.log(chalk.yellow('\n   --dry-run: No changes made'));
        return;
      }

      // Update config
      const updatedConfig: VersionConfig = {
        ...config,
        current: newVersion,
        latest_stable: newVersion.replace(/-.*$/, ''), // Remove any suffix
        spec_version: newVersion.replace(/-.*$/, ''),
        spec_path: `spec/v${newVersion.replace(/-.*$/, '')}`,
        schema_file: `ossa-${newVersion.replace(/-.*$/, '')}.schema.json`,
      };

      await writeVersionConfig(updatedConfig);

      // Create spec directory if needed
      const fs = await import('fs');
      const path = await import('path');
      const specDir = path.join(process.cwd(), updatedConfig.spec_path);
      if (!fs.existsSync(specDir)) {
        fs.mkdirSync(specDir, { recursive: true });
        console.log(chalk.green(`   Created: ${updatedConfig.spec_path}`));
      }

      console.log(chalk.green('\n[PASS] Version bumped successfully!'));
      console.log(chalk.gray(`\n   Next: Run 'ossa release version sync' to update all files`));
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to bump version:'), error);
      process.exit(1);
    }
  });

versionCommand
  .command('sync')
  .description('Sync version to all files with 0.3.3 placeholders')
  .option('--dry-run', 'Show what would change without making changes')
  .option('--include-examples', 'Also sync version in example files')
  .action(async (options: { dryRun?: boolean; includeExamples?: boolean }) => {
    try {
      const fs = await import('fs');
      const { glob } = await import('glob');

      const config = await readVersionConfig();
      const version = config.current;

      console.log(chalk.blue(`[PKG] Syncing version: ${version}`));

      // Files to sync
      const patterns = [
        'package.json',
        'package-lock.json',
        'README.md',
        'CHANGELOG.md',
        '.wiki-config.json',
        'spec/**/*.{yaml,yml,json}',
        'openapi/**/*.{yaml,yml,json}',
        '.gitlab/**/*.{yaml,yml}',
        'bin/**/*.{ts,js,sh}',
        'src/tools/**/*.{ts,js}',
      ];

      if (options.includeExamples) {
        patterns.push('examples/**/*.{yaml,yml}');
      }

      let filesUpdated = 0;

      for (const pattern of patterns) {
        const files = await glob(pattern, {
          ignore: ['**/node_modules/**', '**/dist/**'],
          nodir: true
        });

        for (const file of files) {
          try {
            const content = fs.readFileSync(file, 'utf-8');
            if (content.includes('0.3.3')) {
              if (options.dryRun) {
                console.log(chalk.yellow(`   Would update: ${file}`));
              } else {
                const newContent = content.replace(/\{\{VERSION\}\}/g, version);
                fs.writeFileSync(file, newContent);
                console.log(chalk.green(`   Updated: ${file}`));
              }
              filesUpdated++;
            }
          } catch {
            // Skip files that can't be read
          }
        }
      }

      if (options.dryRun) {
        console.log(chalk.yellow(`\n   --dry-run: Would update ${filesUpdated} files`));
      } else {
        console.log(chalk.green(`\n[PASS] Synced ${filesUpdated} files`));
      }
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to sync version:'), error);
      process.exit(1);
    }
  });

versionCommand
  .command('check')
  .description('Validate version consistency across all files')
  .action(async () => {
    try {
      const fs = await import('fs');
      const { glob } = await import('glob');

      const config = await readVersionConfig();
      const version = config.current;

      console.log(chalk.blue(`[PKG] Checking version consistency: ${version}\n`));

      const issues: string[] = [];

      // Check package.json
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      if (packageJson.version !== version && packageJson.version !== '0.3.3') {
        issues.push(`package.json has version ${packageJson.version}, expected ${version} or 0.3.3`);
      }

      // Skip dist directory - it's build artifacts, not source
      // On release branches, dist files will have resolved versions (0.3.3), not placeholders
      // This is expected and correct behavior

      // Check .version.json consistency
      if (config.spec_version !== config.current.replace(/-.*$/, '')) {
        issues.push(`.version.json spec_version (${config.spec_version}) doesn't match current (${config.current})`);
      }

      if (issues.length === 0) {
        console.log(chalk.green('[PASS] All version checks passed!'));
      } else {
        console.log(chalk.red('[FAIL] Version consistency issues found:\n'));
        issues.forEach(issue => console.log(chalk.yellow(`   • ${issue}`)));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to check version:'), error);
      process.exit(1);
    }
  });

versionCommand
  .command('status')
  .description('Show current version information')
  .action(async () => {
    try {
      const fs = await import('fs');
      const config = await readVersionConfig();

      // Get package.json version
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      // Get latest git tag
      let latestTag = 'unknown';
      try {
        const { execSync } = await import('child_process');
        latestTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo "none"', { encoding: 'utf-8' }).trim();
      } catch {
        // Git not available or no tags
      }

      console.log(chalk.blue('[PKG] Version Status\n'));
      console.log(chalk.cyan('   .version.json:'));
      console.log(chalk.white(`      current:       ${config.current}`));
      console.log(chalk.white(`      latest_stable: ${config.latest_stable}`));
      console.log(chalk.white(`      spec_version:  ${config.spec_version}`));
      console.log(chalk.white(`      spec_path:     ${config.spec_path}`));
      console.log(chalk.white(`      schema_file:   ${config.schema_file}`));
      console.log(chalk.cyan('\n   package.json:'));
      console.log(chalk.white(`      version:       ${packageJson.version}`));
      console.log(chalk.cyan('\n   Git:'));
      console.log(chalk.white(`      latest_tag:    ${latestTag}`));

      // Show if there are inconsistencies
      const isPlaceholder = packageJson.version === '0.3.3';
      if (isPlaceholder) {
        console.log(chalk.green('\n   ✅ Using 0.3.3 placeholder (correct for CI)'));
      } else if (packageJson.version !== config.current) {
        console.log(chalk.yellow(`\n   [WARN]  Version mismatch: package.json (${packageJson.version}) vs .version.json (${config.current})`));
      }
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to get version status:'), error);
      process.exit(1);
    }
  });

versionCommand
  .command('examples')
  .description('Update apiVersion in all example files')
  .option('--dry-run', 'Show what would change without making changes')
  .option('--target <version>', 'Target apiVersion (default: ossa/v{current})')
  .action(async (options: { dryRun?: boolean; target?: string }) => {
    try {
      const fs = await import('fs');
      const { glob } = await import('glob');

      const config = await readVersionConfig();
      const targetVersion = options.target || `ossa/v${config.spec_version}`;

      console.log(chalk.blue(`[PKG] Updating examples to apiVersion: ${targetVersion}\n`));

      const files = await glob('examples/**/*.{yaml,yml}', {
        ignore: ['**/node_modules/**'],
        nodir: true
      });

      let updated = 0;
      const apiVersionPattern = /^apiVersion:\s*['"]?ossa\/v[\d.]+(-\w+)?['"]?\s*$/m;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (apiVersionPattern.test(content)) {
          const newContent = content.replace(apiVersionPattern, `apiVersion: ${targetVersion}`);
          if (newContent !== content) {
            if (options.dryRun) {
              console.log(chalk.yellow(`   Would update: ${file}`));
            } else {
              fs.writeFileSync(file, newContent);
              console.log(chalk.green(`   Updated: ${file}`));
            }
            updated++;
          }
        }
      }

      if (options.dryRun) {
        console.log(chalk.yellow(`\n   --dry-run: Would update ${updated} files`));
      } else {
        console.log(chalk.green(`\n[PASS] Updated ${updated} example files`));
      }
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to update examples:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// Changelog Subcommand (OSSA-native)
// ============================================================================

const changelogCommand = new Command('changelog')
  .description('Generate changelog from conventional commits')
  .alias('cl');

changelogCommand
  .command('generate')
  .description('Generate changelog from git history')
  .option('--from <ref>', 'Starting ref (tag or commit)')
  .option('--to <ref>', 'Ending ref (default: HEAD)', 'HEAD')
  .option('--format <format>', 'Output format (markdown|json)', 'markdown')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .action(async (options: { from?: string; to: string; format: string; output: string }) => {
    try {
      const { execSync } = await import('child_process');

      // Get latest tag if --from not specified
      let fromRef = options.from;
      if (!fromRef) {
        try {
          fromRef = execSync('git describe --tags --abbrev=0 2>/dev/null', { encoding: 'utf-8' }).trim();
        } catch {
          fromRef = ''; // No tags, use all commits
        }
      }

      const range = fromRef ? `${fromRef}..${options.to}` : options.to;

      // Get commits with conventional commit format
      const logFormat = '%H|%s|%b|%an|%aI';
      const rawLog = execSync(`git log ${range} --pretty=format:"${logFormat}" 2>/dev/null || true`, {
        encoding: 'utf-8',
      });

      if (!rawLog.trim()) {
        console.log(chalk.yellow('No commits found in range'));
        return;
      }

      // Parse commits
      interface ChangelogEntry {
        hash: string;
        type: string;
        scope?: string;
        breaking: boolean;
        subject: string;
        body: string;
        author: string;
        date: string;
      }

      const entries: ChangelogEntry[] = [];
      const lines = rawLog.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        const [hash, subject, body, author, date] = line.split('|');
        const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);

        if (match) {
          entries.push({
            hash: hash.substring(0, 8),
            type: match[1],
            scope: match[2] || undefined,
            breaking: match[3] === '!',
            subject: match[4],
            body: body || '',
            author,
            date,
          });
        }
      }

      // Group by type
      const grouped: Record<string, ChangelogEntry[]> = {};
      for (const entry of entries) {
        const key = entry.type;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(entry);
      }

      if (options.output === 'json') {
        outputJSON({ range, entries: grouped });
        return;
      }

      // Output markdown
      const typeLabels: Record<string, string> = {
        feat: '✨ Features',
        fix: '🐛 Bug Fixes',
        docs: '📚 Documentation',
        style: '💄 Styles',
        refactor: '♻️ Refactoring',
        perf: '⚡ Performance',
        test: '✅ Tests',
        build: '🔧 Build',
        ci: '👷 CI/CD',
        chore: '🔨 Chores',
      };

      console.log(chalk.blue(`\n# Changelog (${range || 'all'})\n`));

      for (const [type, items] of Object.entries(grouped)) {
        const label = typeLabels[type] || `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        console.log(chalk.cyan(`\n## ${label}\n`));

        for (const item of items) {
          const scope = item.scope ? chalk.gray(`(${item.scope})`) : '';
          const breaking = item.breaking ? chalk.red('[BREAKING]') : '';
          console.log(`- ${breaking}${scope} ${item.subject} ${chalk.gray(`(${item.hash})`)}`);
        }
      }
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to generate changelog:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// Main Release Command Group (OSSA-native only)
//
// Note: GitLab-specific commands (tag, milestone) are available via the
// GitLab extension. Enable with: OSSA_EXTENSIONS=true
// ============================================================================

export const releaseCommandGroup = new Command('release')
  .description('Version management (bump, sync, check, changelog)')
  .addCommand(versionCommand)
  .addCommand(changelogCommand);
