/**
 * OSSA Setup Command
 * Professional setup commands for branch protection and release automation
 * Follows DRY, OpenAPI, Zod, CRUD principles
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { z } from 'zod';

/**
 * Zod Schema for Setup Options
 */
const SetupOptionsSchema = z.object({
  force: z.boolean().optional().default(false),
  verbose: z.boolean().optional().default(false),
});

type SetupOptions = z.infer<typeof SetupOptionsSchema>;

/**
 * Base Setup Service (DRY)
 */
class SetupService {
  protected projectRoot: string;

  constructor() {
    this.projectRoot = this.findProjectRoot();
  }

  protected findProjectRoot(): string {
    let current = process.cwd();
    for (let i = 0; i < 10; i++) {
      const packageJson = path.join(current, 'package.json');
      if (fs.existsSync(packageJson)) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    return process.cwd();
  }

  protected log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };
    console.log(colors[type](message));
  }

  protected exec(command: string, options?: { cwd?: string; silent?: boolean }): string {
    try {
      const result = execSync(command, {
        cwd: options?.cwd || this.projectRoot,
        encoding: 'utf-8',
        stdio: options?.silent ? 'pipe' : 'inherit',
      });
      return result.toString();
    } catch {
      throw new Error(`Command failed: ${command}`);
    }
  }

  protected fileExists(filePath: string): boolean {
    return fs.existsSync(path.resolve(this.projectRoot, filePath));
  }

  protected ensureDirectory(dirPath: string): void {
    const fullPath = path.resolve(this.projectRoot, dirPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

/**
 * Branch Protection Setup Service
 */
class BranchProtectionService extends SetupService {
  private readonly protectedBranches = ['main', 'development'];
  private readonly hooksDir = '.git/hooks';
  private readonly hookFile = 'post-checkout';

  async setup(options: SetupOptions): Promise<void> {
    this.log('🔒 Setting up branch protection for main and development...', 'info');
    this.log('');

    // Ensure hooks directory exists
    this.ensureDirectory(this.hooksDir);

    // Create post-checkout hook
    await this.createPostCheckoutHook(options.force);

    // Configure git hooks path
    this.exec('git config core.hooksPath .git/hooks', { silent: true });

    this.log('');
    this.log('✅ Branch protection installed!', 'success');
    this.log('');
    this.log(`Protected branches: ${this.protectedBranches.join(', ')}`);
    this.log('');
    this.log(
      'The hook will automatically switch you back if you try to checkout these branches.'
    );
    this.log('');
  }

  private async createPostCheckoutHook(force: boolean): Promise<void> {
    const hookPath = path.resolve(this.projectRoot, this.hooksDir, this.hookFile);

    if (fs.existsSync(hookPath) && !force) {
      this.log(`✅ Post-checkout hook already exists`, 'info');
      // Ensure it's executable
      fs.chmodSync(hookPath, 0o755);
      return;
    }

    const hookContent = this.generateHookContent();
    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });

    this.log(`✅ Created post-checkout hook`, 'success');
  }

  private generateHookContent(): string {
    return `#!/bin/bash
#
# Git Post-Checkout Hook
# Prevents checking out main and development branches locally
# Enforces feature branch workflow
#

# Post-checkout hook receives:
# $1 = previous HEAD
# $2 = new HEAD
# $3 = flag (0=file checkout, 1=branch checkout)

# Only block branch checkouts, not file checkouts
if [ "$3" != "1" ]; then
  exit 0
fi

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

# Protected branches that cannot be checked out locally
PROTECTED_BRANCHES="main development"

# Check if we're on a protected branch
for PROTECTED in $PROTECTED_BRANCHES; do
  if [ "$CURRENT_BRANCH" = "$PROTECTED" ]; then
    echo ""
    echo "❌ ERROR: Cannot work on '$PROTECTED' branch locally"
    echo ""
    echo "This project enforces a feature branch workflow:"
    echo "  • Work is done on feature branches"
    echo "  • Feature branches → merge to development (via MR)"
    echo "  • Development → merge to main (via MR)"
    echo ""
    echo "Switching you back to your previous branch..."
    echo ""
    
    # Switch back to previous branch or a safe default
    PREVIOUS_BRANCH=$(git reflog | grep "checkout:" | head -2 | tail -1 | awk '{print $NF}' | sed 's|.*:||')
    
    if [ -n "$PREVIOUS_BRANCH" ] && [ "$PREVIOUS_BRANCH" != "$PROTECTED" ]; then
      git checkout "$PREVIOUS_BRANCH" 2>/dev/null
      echo "✅ Switched back to: $PREVIOUS_BRANCH"
    else
      # Try to find a feature branch
      FEATURE_BRANCH=$(git branch -a | grep -E "feat/|feature/" | head -1 | sed 's|.*/||' | xargs)
      if [ -n "$FEATURE_BRANCH" ]; then
        git checkout "$FEATURE_BRANCH" 2>/dev/null
        echo "✅ Switched to feature branch: $FEATURE_BRANCH"
      else
        echo "⚠️  Could not auto-switch. Please manually checkout a feature branch:"
        echo "   git checkout -b feat/your-feature development"
      fi
    fi
    
    echo ""
    echo "To work on this project:"
    echo "  1. Create a feature branch: git checkout -b feat/your-feature development"
    echo "  2. Make your changes"
    echo "  3. Push and create a merge request"
    echo ""
    echo "If you need to view $PROTECTED:"
    echo "  • Use: git worktree add ../project-$PROTECTED $PROTECTED"
    echo "  • Or view on GitLab: https://gitlab.com/blueflyio/openstandardagents/-/tree/$PROTECTED"
    echo ""
    exit 1
  fi
done

# Allow checkout
exit 0
`;
  }
}

/**
 * Release Automation Setup Service
 */
class ReleaseAutomationService extends SetupService {
  private readonly requiredDependencies = ['@gitbeaker/rest', '@octokit/rest'];
  private readonly requiredEnvVars = ['GITLAB_TOKEN', 'NPM_TOKEN', 'GITHUB_TOKEN'];

  async setup(options: SetupOptions): Promise<void> {
    this.log('🚀 Release Automation Setup', 'info');
    this.log('==============================', 'info');
    this.log('');

    // Check branch
    await this.checkBranch();

    // Check dependencies
    await this.checkDependencies();

    // Check CI/CD variables
    this.checkCICDVariables();

    // Check webhooks
    this.checkWebhooks();

    // Run tests
    await this.runTests();

    this.log('');
    this.log('==============================', 'info');
    this.log('✅ Setup checks complete!', 'success');
    this.log('');
    this.log('Next steps:');
    this.log('  1. Configure webhooks in GitLab UI');
    this.log('  2. Set CI/CD variables in GitLab UI');
    this.log('  3. Create test milestone: v0.2.8-test');
    this.log('  4. Verify automation works');
    this.log('');
  }

  private async checkBranch(): Promise<void> {
    try {
      const branch = this.exec('git branch --show-current', { silent: true }).trim();
      if (branch !== 'development') {
        this.log(
          `⚠️  Warning: Not on development branch (current: ${branch})`,
          'warning'
        );
        this.log('   Switch to development first: git checkout development', 'warning');
        throw new Error('Must be on development branch');
      }
      this.log('✅ On development branch', 'success');
      this.log('');
    } catch (error) {
      if (error instanceof Error && error.message === 'Must be on development branch') {
        throw error;
      }
      throw new Error('Failed to check git branch');
    }
  }

  private async checkDependencies(): Promise<void> {
    this.log('📦 Checking dependencies...', 'info');

    for (const dep of this.requiredDependencies) {
      try {
        this.exec(`npm list ${dep}`, { silent: true });
        this.log(`  ✅ ${dep}`, 'success');
      } catch {
        this.log(`  ❌ ${dep} not found`, 'error');
        this.log('   Run: npm install', 'error');
        throw new Error(`Missing dependency: ${dep}`);
      }
    }

    this.log('✅ Dependencies installed', 'success');
    this.log('');
  }

  private checkCICDVariables(): void {
    this.log('🔐 Checking CI/CD variables...', 'info');
    this.log('');
    this.log('Required variables (set in GitLab UI):');
    for (const varName of this.requiredEnvVars) {
      const exists = !!process.env[varName];
      const status = exists ? '✅' : '❌';
      this.log(`  ${status} ${varName}${exists ? ' (set)' : ' (missing)'}`);
    }
    this.log('');
    this.log('To set these:');
    this.log('  1. Go to: Settings → CI/CD → Variables');
    this.log('  2. Add each variable');
    this.log('  3. Mark as \'Protected\' and \'Masked\'');
    this.log('');
  }

  private checkWebhooks(): void {
    this.log('🔗 Webhooks to configure:', 'info');
    this.log('');
    this.log('Webhook 1: Milestone Events');
    this.log('  URL: https://your-webhook-endpoint.com/milestone');
    this.log('  Trigger: Milestone events');
    this.log('');
    this.log('Webhook 2: Push Events');
    this.log('  URL: https://your-webhook-endpoint.com/push');
    this.log('  Trigger: Push events (development branch)');
    this.log('');
    this.log('To configure:');
    this.log('  Go to: Settings → Webhooks');
    this.log('');
  }

  private async runTests(): Promise<void> {
    this.log('🧪 Running tests...', 'info');
    try {
      this.exec('npm test', { silent: false });
      this.log('✅ All tests passing', 'success');
    } catch {
      this.log('❌ Tests failed', 'error');
      throw new Error('Tests failed');
    }
  }
}

/**
 * Main Setup Command
 */
export const setupCommand = new Command('setup')
  .description('Setup OSSA project tools and automation')
  .option('-f, --force', 'Force overwrite existing configuration')
  .option('-v, --verbose', 'Verbose output');

/**
 * Branch Protection Subcommand
 */
const branchProtectionSubcommand = new Command('branch-protection')
  .alias('bp')
  .description('Setup git hooks to prevent checking out main/development locally')
  .option('-f, --force', 'Force overwrite existing hooks')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: { force?: boolean; verbose?: boolean }) => {
    try {
      const validated = SetupOptionsSchema.parse(options);
      const service = new BranchProtectionService();
      await service.setup(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red('Validation error:'), error.issues);
        process.exit(1);
      }
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Release Automation Subcommand
 */
const releaseAutomationSubcommand = new Command('release-automation')
  .alias('ra')
  .description('Setup release automation (dependencies, CI/CD variables, webhooks)')
  .option('-f, --force', 'Force setup even if checks fail')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: { force?: boolean; verbose?: boolean }) => {
    try {
      const validated = SetupOptionsSchema.parse(options);
      const service = new ReleaseAutomationService();
      await service.setup(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red('Validation error:'), error.issues);
        process.exit(1);
      }
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Register subcommands
setupCommand.addCommand(branchProtectionSubcommand);
setupCommand.addCommand(releaseAutomationSubcommand);

