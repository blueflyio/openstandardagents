/**
 * OSSA Release Command Group
 * CRUD operations for release automation (tags, milestones, deployments)
 * Uses Zod validation and existing release automation services
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { z } from 'zod';
import { TagService, MilestoneService } from '../../services/release-automation/index.js';
import type {
  CreateTagRequest,
  CreateMilestoneRequest,
} from '../../services/release-automation/schemas/release.schema.js';

// ============================================================================
// Zod Schemas for CLI Input
// ============================================================================

const GitLabConfigSchema = z.object({
  token: z.string().min(1, 'GitLab token is required'),
  projectId: z.union([z.string(), z.number()]).optional(),
  apiUrl: z.string().url().optional(),
});

// ============================================================================
// Helper: Get GitLab Config
// ============================================================================

function getGitLabConfig(): z.infer<typeof GitLabConfigSchema> {
  const token =
    process.env.SERVICE_ACCOUNT_OSSA_TOKEN ||
    process.env.SERVICE_ACCOUNT_VERSION_MANAGER_TOKEN ||
    process.env.GITLAB_TOKEN ||
    process.env.CI_JOB_TOKEN ||
    '';

  if (!token) {
    throw new Error(
      'GitLab token required. Set one of: SERVICE_ACCOUNT_OSSA_TOKEN, GITLAB_TOKEN, or CI_JOB_TOKEN'
    );
  }

  return GitLabConfigSchema.parse({
    token,
    projectId: process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID,
    apiUrl: process.env.CI_API_V4_URL || process.env.GITLAB_API_URL,
  });
}

// ============================================================================
// Tag Subcommands
// ============================================================================

const tagCommand = new Command('tag')
  .description('Manage Git tags (dev, rc, release)')
  .alias('tags');

tagCommand
  .command('create')
  .description('Create a new tag')
  .requiredOption('-n, --name <name>', 'Tag name (e.g., v0.2.5-dev.1)')
  .requiredOption('-r, --ref <ref>', 'Git ref (branch, commit SHA)')
  .option('-m, --message <message>', 'Tag message')
  .action(async (options: { name: string; ref: string; message?: string }) => {
    try {
      const config = getGitLabConfig();
      const tagService = new TagService(config.token, config.projectId);

      const tagRequest: CreateTagRequest = {
        name: options.name,
        ref: options.ref,
        message: options.message || `Tag ${options.name}`,
      };

      const tag = await tagService.create(tagRequest);

      console.log(chalk.green('[PASS] Tag created successfully!'));
      console.log(chalk.cyan(`   Name: ${tag.name}`));
      console.log(chalk.cyan(`   Type: ${tag.type}`));
      console.log(chalk.cyan(`   Version: ${tag.version}`));
      console.log(chalk.cyan(`   Commit: ${tag.commitSha.substring(0, 8)}`));
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to create tag:'), error);
      process.exit(1);
    }
  });

tagCommand
  .command('list')
  .description('List tags with filtering')
  .option('-t, --type <type>', 'Filter by type (dev, rc, release, all)', 'all')
  .option('-v, --version <version>', 'Filter by version')
  .option('-p, --page <page>', 'Page number', '1')
  .option('--per-page <count>', 'Items per page', '20')
  .action(async (options: { type: string; version?: string; page: string; perPage: string }) => {
    try {
      const config = getGitLabConfig();
      const tagService = new TagService(config.token, config.projectId);

      const result = await tagService.list({
        type: options.type as 'dev' | 'rc' | 'release' | 'all',
        version: options.version,
        page: parseInt(options.page, 10),
        perPage: parseInt(options.perPage, 10),
      });

      console.log(chalk.blue(`[LIST] Tags (${result.pagination.total} total):\n`));

      if (result.items.length === 0) {
        console.log(chalk.yellow('   No tags found'));
        return;
      }

      result.items.forEach((tag) => {
        const typeColor =
          tag.type === 'release' ? chalk.green : tag.type === 'rc' ? chalk.yellow : chalk.cyan;
        console.log(
          `   ${typeColor(tag.name.padEnd(25))} ${chalk.gray(tag.type.padEnd(6))} ${chalk.gray(tag.commitSha.substring(0, 8))}`
        );
      });

      console.log(
        chalk.gray(`\n   Page ${result.pagination.page} of ${result.pagination.totalPages}`)
      );
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to list tags:'), error);
      process.exit(1);
    }
  });

tagCommand
  .command('show')
  .description('Show tag details')
  .argument('<name>', 'Tag name')
  .action(async (name: string) => {
    try {
      const config = getGitLabConfig();
      const tagService = new TagService(config.token, config.projectId);

      const tag = await tagService.read(name);

      if (!tag) {
        console.error(chalk.red(`[FAIL] Tag not found: ${name}`));
        process.exit(1);
      }

      console.log(chalk.blue(`[LIST] Tag: ${tag.name}\n`));
      console.log(chalk.cyan(`   Type: ${tag.type}`));
      console.log(chalk.cyan(`   Version: ${tag.version}`));
      console.log(chalk.cyan(`   Commit: ${tag.commitSha}`));
      console.log(chalk.cyan(`   Ref: ${tag.ref}`));
      console.log(chalk.cyan(`   Message: ${tag.message || '(none)'}`));
      console.log(chalk.cyan(`   Created: ${tag.createdAt}`));
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to show tag:'), error);
      process.exit(1);
    }
  });

tagCommand
  .command('delete')
  .description('Delete a tag')
  .argument('<name>', 'Tag name')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (name: string, options: { force?: boolean }) => {
    try {
      if (!options.force) {
        console.log(chalk.yellow(`[WARN]  This will delete tag: ${name}`));
        console.log(chalk.yellow('   Use --force to skip confirmation'));
        process.exit(1);
      }

      const config = getGitLabConfig();
      const tagService = new TagService(config.token, config.projectId);

      await tagService.delete(name);

      console.log(chalk.green(`[PASS] Tag deleted: ${name}`));
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to delete tag:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// Milestone Subcommands
// ============================================================================

const milestoneCommand = new Command('milestone')
  .description('Manage milestones')
  .alias('milestones')
  .alias('ms');

milestoneCommand
  .command('create')
  .description('Create a new milestone')
  .requiredOption('-t, --title <title>', 'Milestone title (e.g., v0.2.5)')
  .option('-d, --description <desc>', 'Milestone description')
  .option('--due-date <date>', 'Due date (YYYY-MM-DD)')
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .action(
    async (options: {
      title: string;
      description?: string;
      dueDate?: string;
      startDate?: string;
    }) => {
      try {
        const config = getGitLabConfig();
        const milestoneService = new MilestoneService(config.token, config.projectId);

        const milestoneRequest: CreateMilestoneRequest = {
          title: options.title,
          description: options.description,
          dueDate: options.dueDate || undefined,
          startDate: options.startDate || undefined,
        };

        const milestone = await milestoneService.create(milestoneRequest);

        console.log(chalk.green('[PASS] Milestone created successfully!'));
        console.log(chalk.cyan(`   ID: ${milestone.id}`));
        console.log(chalk.cyan(`   Title: ${milestone.title}`));
        console.log(chalk.cyan(`   State: ${milestone.state}`));
        if (milestone.dueDate) {
          console.log(chalk.cyan(`   Due: ${milestone.dueDate}`));
        }
        console.log(
          chalk.cyan(
            `   Issues: ${milestone.statistics.closedIssues}/${milestone.statistics.totalIssues} closed`
          )
        );
      } catch (error) {
        console.error(chalk.red('[FAIL] Failed to create milestone:'), error);
        process.exit(1);
      }
    }
  );

milestoneCommand
  .command('list')
  .description('List milestones')
  .option('-s, --state <state>', 'Filter by state (active, closed)')
  .option('-p, --page <page>', 'Page number', '1')
  .option('--per-page <count>', 'Items per page', '20')
  .action(async (options: { state?: string; page: string; perPage: string }) => {
    try {
      const config = getGitLabConfig();
      const milestoneService = new MilestoneService(config.token, config.projectId);

      const result = await milestoneService.list({
        state: options.state as 'active' | 'closed' | undefined,
        page: parseInt(options.page, 10),
        perPage: parseInt(options.perPage, 10),
      });

      console.log(chalk.blue(`[LIST] Milestones (${result.pagination.total} total):\n`));

      if (result.items.length === 0) {
        console.log(chalk.yellow('   No milestones found'));
        return;
      }

      result.items.forEach((ms) => {
        const stateColor = ms.state === 'closed' ? chalk.green : chalk.yellow;
        const progress = `${ms.statistics.closedIssues}/${ms.statistics.totalIssues}`;
        console.log(
          `   ${chalk.cyan(ms.title.padEnd(20))} ${stateColor(ms.state.padEnd(8))} ${chalk.gray(progress)}`
        );
      });

      console.log(
        chalk.gray(`\n   Page ${result.pagination.page} of ${result.pagination.totalPages}`)
      );
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to list milestones:'), error);
      process.exit(1);
    }
  });

milestoneCommand
  .command('show')
  .description('Show milestone details')
  .argument('<id>', 'Milestone ID')
  .action(async (id: string) => {
    try {
      const config = getGitLabConfig();
      const milestoneService = new MilestoneService(config.token, config.projectId);

      const milestone = await milestoneService.read(parseInt(id, 10));

      if (!milestone) {
        console.error(chalk.red(`[FAIL] Milestone not found: ${id}`));
        process.exit(1);
      }

      console.log(chalk.blue(`[LIST] Milestone: ${milestone.title}\n`));
      console.log(chalk.cyan(`   ID: ${milestone.id}`));
      console.log(chalk.cyan(`   State: ${milestone.state}`));
      if (milestone.description) {
        console.log(chalk.cyan(`   Description: ${milestone.description}`));
      }
      if (milestone.dueDate) {
        console.log(chalk.cyan(`   Due Date: ${milestone.dueDate}`));
      }
      if (milestone.startDate) {
        console.log(chalk.cyan(`   Start Date: ${milestone.startDate}`));
      }
      console.log(
        chalk.cyan(
          `   Issues: ${milestone.statistics.closedIssues}/${milestone.statistics.totalIssues} closed`
        )
      );
      console.log(chalk.cyan(`   Created: ${milestone.createdAt}`));
      console.log(chalk.cyan(`   Updated: ${milestone.updatedAt}`));
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to show milestone:'), error);
      process.exit(1);
    }
  });

// ============================================================================
// Release Subcommands
// ============================================================================

const releaseCommand = new Command('release')
  .description('Release automation commands')
  .alias('rel');

releaseCommand
  .command('increment-dev')
  .description('Increment dev tag version')
  .option('-b, --base-version <version>', 'Base version (e.g., 0.2.5)')
  .option('-r, --ref <ref>', 'Git ref to tag', 'development')
  .action(async (options: { baseVersion?: string; ref: string }) => {
    try {
      const config = getGitLabConfig();
      const tagService = new TagService(config.token, config.projectId);

      // Get current version from package.json if not provided
      let baseVersion = options.baseVersion;
      if (!baseVersion) {
        const fs = await import('fs');
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        baseVersion = packageJson.version.split('-dev.')[0];
      }

      // Find latest dev tag
      const tags = await tagService.list({
        type: 'dev',
        version: baseVersion,
        page: 1,
        perPage: 100,
      });

      let nextNum = 0;
      if (tags.items.length > 0) {
        const latest = tags.items[0];
        const match = latest.name.match(/-dev\.(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }

      const tagName = `v${baseVersion}-dev.${nextNum}`;

      const tag = await tagService.create({
        name: tagName,
        ref: options.ref,
        message: `Auto-incremented dev tag ${nextNum}`,
      });

      console.log(chalk.green(`[PASS] Created dev tag: ${tag.name}`));
    } catch (error) {
      console.error(chalk.red('[FAIL] Failed to increment dev tag:'), error);
      process.exit(1);
    }
  });

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
  .description('Sync version to all files with {{VERSION}} placeholders')
  .option('--dry-run', 'Show what would change without making changes')
  .option('--include-examples', 'Also sync version in example files')
  .action(async (options: { dryRun?: boolean; includeExamples?: boolean }) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
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
            if (content.includes('{{VERSION}}')) {
              if (options.dryRun) {
                console.log(chalk.yellow(`   Would update: ${file}`));
              } else {
                const newContent = content.replace(/\{\{VERSION\}\}/g, version);
                fs.writeFileSync(file, newContent);
                console.log(chalk.green(`   Updated: ${file}`));
              }
              filesUpdated++;
            }
          } catch (err) {
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
      if (packageJson.version !== version && packageJson.version !== '{{VERSION}}') {
        issues.push(`package.json has version ${packageJson.version}, expected ${version} or {{VERSION}}`);
      }

      // Check for stray {{VERSION}} placeholders in built files
      // Skip version utility files that intentionally reference {{VERSION}} to detect it
      const versionUtilityFiles = [
        'dist/utils/version.js',
        'dist/repositories/schema.repository.js',
        'dist/cli/commands/release.command.js',
      ];
      const builtFiles = await glob('dist/**/*.{js,json}', { nodir: true });
      for (const file of builtFiles) {
        // Skip files that intentionally check for {{VERSION}} placeholder
        if (versionUtilityFiles.some(util => file.endsWith(util.replace('dist/', '')))) {
          continue;
        }
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('{{VERSION}}')) {
          issues.push(`${file} contains unresolved {{VERSION}} placeholder`);
        }
      }

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
      const isPlaceholder = packageJson.version === '{{VERSION}}';
      if (isPlaceholder) {
        console.log(chalk.green('\n   [PASS] Using {{VERSION}} placeholder (correct for CI)'));
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
// Main Release Command Group
// ============================================================================

export const releaseCommandGroup = new Command('release')
  .description('Release automation (version, tags, milestones)')
  .addCommand(versionCommand)
  .addCommand(tagCommand)
  .addCommand(milestoneCommand)
  .addCommand(releaseCommand);
