/**
 * Release Preparation Service
 * 
 * Comprehensive validation for v0.3.3 release to GitLab, GitHub, and npmjs
 * 
 * Architecture:
 * - OpenAPI-First: Spec in openapi/dev-cli.openapi.yml
 * - Zod Validation: All inputs/outputs validated with Zod schemas
 * - CRUD: Read operation (validates, doesn't modify)
 * - DRY: Reuses existing services
 * - SOLID: Single Responsibility - Release preparation validation only
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ReleasePrepRequestSchema,
  ReleasePrepResponseSchema,
  GitLabValidationSchema,
  GitHubValidationSchema,
  NPMValidationSchema,
  type ReleasePrepRequest,
  type ReleasePrepResponse,
  type GitLabValidation,
  type GitHubValidation,
  type NPMValidation,
} from '../schemas/release-prep.schema.js';
import { VersionConfigSchema } from '../schemas/version.schema.js';
import { ReleaseVerifyService } from './release-verify.service.js';

export class ReleasePrepService {
  private readonly rootDir: string;
  private readonly releaseVerifyService: ReleaseVerifyService;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.releaseVerifyService = new ReleaseVerifyService(rootDir);
  }

  /**
   * Prepare release - comprehensive validation
   * CRUD: Read operation (validates all platforms)
   */
  async prepare(request: ReleasePrepRequest): Promise<ReleasePrepResponse> {
    // Validate input with Zod
    const validatedRequest = ReleasePrepRequestSchema.parse(request);
    const version = validatedRequest.version;
    const versionTag = `v${version}`;

    // 1. Run release verification first (DRY - reuses existing service)
    const verifyResult = await this.releaseVerifyService.verify({
      version,
      skipBuildTests: true,
      skipCIConfig: false,
    });

    if (!verifyResult.ready) {
      return this.buildResponse(
        false,
        version,
        versionTag,
        {
          ready: false,
          remoteUrl: verifyResult.repository.remoteUrl,
          branch: verifyResult.repository.currentBranch,
          tagExists: verifyResult.tagState.stableTagExists,
          tagCanBeCreated: false,
          releaseCanBeCreated: false,
          protectedTagRules: { pattern: versionTag, allowed: false },
          ciTokenConfigured: false,
          errors: verifyResult.errors,
          warnings: verifyResult.warnings,
        },
        undefined,
        undefined,
        verifyResult.errors,
        verifyResult.warnings,
        [],
        []
      );
    }

    // 2. Validate GitLab (required)
    const gitlab = await this.validateGitLab(version, versionTag);

    // 3. Validate GitHub (optional)
    let github: GitHubValidation | undefined;
    if (!validatedRequest.skipGitHub) {
      github = await this.validateGitHub(version, versionTag);
    }

    // 4. Validate npmjs (optional)
    let npm: NPMValidation | undefined;
    if (!validatedRequest.skipNPM) {
      npm = await this.validateNPM(version);
    }

    // Build comprehensive checklist
    const checklist = this.buildChecklist(verifyResult, gitlab, github, npm);

    // Collect all errors and warnings
    const allErrors = [
      ...verifyResult.errors,
      ...gitlab.errors,
      ...(github?.errors || []),
      ...(npm?.errors || []),
    ];

    const allWarnings = [
      ...verifyResult.warnings,
      ...gitlab.warnings,
      ...(github?.warnings || []),
      ...(npm?.warnings || []),
    ];

    // Determine overall readiness
    const ready = allErrors.length === 0 && gitlab.ready;

    // Build next steps
    const nextSteps = this.buildNextSteps(version, versionTag, gitlab, github, npm, ready);

    // Build rollback plan
    const rollbackPlan = this.buildRollbackPlan(version, versionTag);

    return ReleasePrepResponseSchema.parse({
      ready,
      version,
      versionTag,
      gitlab,
      github,
      npm,
      allErrors,
      allWarnings,
      checklist,
      nextSteps,
      rollbackPlan,
    });
  }

  /**
   * Validate GitLab readiness
   * CRUD: Read
   */
  private async validateGitLab(version: string, versionTag: string): Promise<GitLabValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let remoteUrl = '';
    let branch = '';
    let tagExists = false;
    let tagCanBeCreated = true;
    let releaseCanBeCreated = true;
    let ciTokenConfigured = false;

    try {
      remoteUrl = execSync('git remote get-url origin', {
        encoding: 'utf-8',
        cwd: this.rootDir,
      }).trim();

      if (!remoteUrl.includes('gitlab.com')) {
        errors.push('Remote URL does not point to GitLab');
      }

      branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        cwd: this.rootDir,
      }).trim();

      // Check if tag exists
      const existingTags = execSync('git tag -l', {
        encoding: 'utf-8',
        cwd: this.rootDir,
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      tagExists = existingTags.includes(versionTag);

      if (tagExists) {
        errors.push(`Tag ${versionTag} already exists - cannot create duplicate`);
        tagCanBeCreated = false;
      }

      // Check CI token (CI_DEPLOY_OSSA)
      if (process.env.CI_DEPLOY_OSSA) {
        ciTokenConfigured = true;
      } else {
        warnings.push('CI_DEPLOY_OSSA not set - tag creation may fail in CI');
      }

      // Validate protected tag rules (heuristic - check if we can create tags)
      const protectedTagRules = {
        pattern: versionTag,
        allowed: true, // Assume allowed if we get here
      };

      // Check if we're on correct branch
      if (branch !== 'main' && !branch.startsWith('release/')) {
        warnings.push(`Not on main or release/* branch (current: ${branch})`);
      }

    } catch (error) {
      errors.push(`GitLab validation failed: ${error instanceof Error ? error.message : String(error)}`);
      tagCanBeCreated = false;
      releaseCanBeCreated = false;
    }

    return GitLabValidationSchema.parse({
      ready: errors.length === 0 && tagCanBeCreated,
      remoteUrl,
      branch,
      tagExists,
      tagCanBeCreated,
      releaseCanBeCreated,
      protectedTagRules: {
        pattern: versionTag,
        allowed: tagCanBeCreated,
      },
      ciTokenConfigured,
      errors,
      warnings,
    });
  }

  /**
   * Validate GitHub readiness
   * CRUD: Read
   */
  private async validateGitHub(version: string, versionTag: string): Promise<GitHubValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let remoteConfigured = false;
    let mirrorEnabled = false;
    let tokenConfigured = false;
    let releaseCanBeCreated = false;

    try {
      // Check for GitHub remote
      const remotes = execSync('git remote -v', {
        encoding: 'utf-8',
        cwd: this.rootDir,
      });

      if (remotes.includes('github.com')) {
        remoteConfigured = true;
      } else {
        warnings.push('GitHub remote not configured - mirror may not work');
      }

      // Check if GitHub mirror is enabled (heuristic - check for GitHub remote)
      mirrorEnabled = remoteConfigured;

      // Check GitHub token
      if (process.env.GITHUB_TOKEN) {
        tokenConfigured = true;
      } else {
        warnings.push('GITHUB_TOKEN not set - GitHub releases may fail');
      }

      releaseCanBeCreated = remoteConfigured && tokenConfigured;

    } catch (error) {
      errors.push(`GitHub validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return GitHubValidationSchema.parse({
      ready: errors.length === 0 && releaseCanBeCreated,
      remoteConfigured,
      mirrorEnabled,
      tokenConfigured,
      releaseCanBeCreated,
      errors,
      warnings,
    });
  }

  /**
   * Validate npmjs readiness
   * CRUD: Read
   */
  private async validateNPM(version: string): Promise<NPMValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let canPublish = true;
    let tokenConfigured = false;
    let registryAccessible = false;
    let packageName = '';
    let currentPublishedVersion: string | undefined;
    let versionExists = false;

    try {
      // Read package.json
      const packageJsonPath = join(this.rootDir, 'package.json');
      if (!existsSync(packageJsonPath)) {
        errors.push('package.json not found');
        return NPMValidationSchema.parse({
          ready: false,
          versionExists: false,
          canPublish: false,
          tokenConfigured: false,
          registryAccessible: false,
          packageName: '',
          errors,
          warnings,
        });
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      packageName = packageJson.name || '';

      // Check NPM token
      if (process.env.NPM_TOKEN) {
        tokenConfigured = true;
      } else {
        errors.push('NPM_TOKEN not set - cannot publish to npmjs.org');
        canPublish = false;
      }

      // Validate package name format to prevent command injection (single validation point - DRY)
      // NPM package name rules: scoped packages must be @scope/name, alphanumeric + - . _ ~
      if (!/^@[a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-~][a-z0-9-._~]*$/.test(packageName)) {
        errors.push(`Invalid package name format: ${packageName} (must be scoped: @scope/name)`);
        canPublish = false;
        return NPMValidationSchema.parse({
          ready: false,
          versionExists: false,
          canPublish: false,
          tokenConfigured,
          registryAccessible: false,
          packageName,
          errors,
          warnings,
        });
      }

      // Validate version format to prevent command injection
      // Semantic versioning: major.minor.patch[-pre-release]
      if (!/^[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9-]+(\.[0-9]+)?)?$/.test(version)) {
        errors.push(`Invalid version format: ${version} (must be semantic version)`);
        canPublish = false;
        return NPMValidationSchema.parse({
          ready: false,
          versionExists: false,
          canPublish: false,
          tokenConfigured,
          registryAccessible: false,
          packageName,
          errors,
          warnings,
        });
      }

      // Check if version already exists on npm (packageName and version validated above)
      try {
        const npmViewOutput = execSync(`npm view ${packageName}@${version} version`, {
          encoding: 'utf-8',
          stdio: 'pipe',
          cwd: this.rootDir,
        }).trim();

        if (npmViewOutput) {
          versionExists = true;
          errors.push(`Version ${version} already published to npmjs.org`);
          canPublish = false;
        }
      } catch {
        // Version doesn't exist - that's good
        versionExists = false;
      }

      // Check current published version (packageName validated above)
      try {
        currentPublishedVersion = execSync(`npm view ${packageName} version`, {
          encoding: 'utf-8',
          stdio: 'pipe',
          cwd: this.rootDir,
        }).trim();
      } catch {
        warnings.push('Could not determine current published version');
      }

      // Test registry access
      try {
        execSync('npm ping', {
          encoding: 'utf-8',
          stdio: 'pipe',
          cwd: this.rootDir,
        });
        registryAccessible = true;
      } catch {
        warnings.push('npm registry not accessible - check network/firewall');
        registryAccessible = false;
      }

    } catch (error) {
      errors.push(`NPM validation failed: ${error instanceof Error ? error.message : String(error)}`);
      canPublish = false;
    }

    return NPMValidationSchema.parse({
      ready: errors.length === 0 && canPublish && tokenConfigured,
      versionExists,
      canPublish,
      tokenConfigured,
      registryAccessible,
      packageName,
      currentPublishedVersion,
      errors,
      warnings,
    });
  }

  /**
   * Build comprehensive checklist
   */
  private buildChecklist(
    verifyResult: any,
    gitlab: GitLabValidation,
    github: GitHubValidation | undefined,
    npm: NPMValidation | undefined
  ): Array<{ category: string; item: string; status: 'pass' | 'fail' | 'warning' | 'skip'; message: string }> {
    const checklist: Array<{ category: string; item: string; status: 'pass' | 'fail' | 'warning' | 'skip'; message: string }> = [];

    // Repository checks
    checklist.push({
      category: 'Repository',
      item: 'Working tree clean',
      status: verifyResult.repository.isClean ? 'pass' : 'fail',
      message: verifyResult.repository.isClean ? 'Working tree is clean' : 'Uncommitted changes found',
    });

    checklist.push({
      category: 'Repository',
      item: 'Version files synced',
      status: verifyResult.versionState.isSynced ? 'pass' : 'fail',
      message: verifyResult.versionState.isSynced
        ? 'Versions match'
        : `Mismatch: .version.json=${verifyResult.versionState.versionFromJson}, package.json=${verifyResult.versionState.packageVersion}`,
    });

    // GitLab checks
    checklist.push({
      category: 'GitLab',
      item: 'Tag does not exist',
      status: !gitlab.tagExists ? 'pass' : 'fail',
      message: gitlab.tagExists ? `Tag ${gitlab.protectedTagRules.pattern} already exists` : 'Tag can be created',
    });

    checklist.push({
      category: 'GitLab',
      item: 'CI token configured',
      status: gitlab.ciTokenConfigured ? 'pass' : 'warning',
      message: gitlab.ciTokenConfigured ? 'CI_DEPLOY_OSSA configured' : 'CI_DEPLOY_OSSA not set',
    });

    // GitHub checks
    if (github) {
      checklist.push({
        category: 'GitHub',
        item: 'Remote configured',
        status: github.remoteConfigured ? 'pass' : 'warning',
        message: github.remoteConfigured ? 'GitHub remote found' : 'GitHub remote not configured',
      });

      checklist.push({
        category: 'GitHub',
        item: 'Token configured',
        status: github.tokenConfigured ? 'pass' : 'warning',
        message: github.tokenConfigured ? 'GITHUB_TOKEN configured' : 'GITHUB_TOKEN not set',
      });
    } else {
      checklist.push({
        category: 'GitHub',
        item: 'Validation skipped',
        status: 'skip',
        message: 'GitHub validation skipped',
      });
    }

    // NPM checks
    if (npm) {
      checklist.push({
        category: 'NPM',
        item: 'Version not published',
        status: !npm.versionExists ? 'pass' : 'fail',
        message: npm.versionExists ? `Version ${npm.packageName}@${npm.currentPublishedVersion} already published` : 'Version not published',
      });

      checklist.push({
        category: 'NPM',
        item: 'Token configured',
        status: npm.tokenConfigured ? 'pass' : 'fail',
        message: npm.tokenConfigured ? 'NPM_TOKEN configured' : 'NPM_TOKEN not set',
      });

      checklist.push({
        category: 'NPM',
        item: 'Registry accessible',
        status: npm.registryAccessible ? 'pass' : 'warning',
        message: npm.registryAccessible ? 'npm registry accessible' : 'npm registry not accessible',
      });
    } else {
      checklist.push({
        category: 'NPM',
        item: 'Validation skipped',
        status: 'skip',
        message: 'NPM validation skipped',
      });
    }

    return checklist;
  }

  /**
   * Build next steps
   */
  private buildNextSteps(
    version: string,
    versionTag: string,
    gitlab: GitLabValidation,
    github: GitHubValidation | undefined,
    npm: NPMValidation | undefined,
    ready: boolean
  ): string[] {
    if (!ready) {
      return ['Fix all errors before proceeding with release'];
    }

    const steps: string[] = [];

    steps.push(`1. Create GitLab tag: git tag -a ${versionTag} -m 'Release ${versionTag}'`);
    steps.push(`2. Push GitLab tag: git push origin ${versionTag}`);
    steps.push('3. Monitor GitLab CI pipeline for release job');

    if (npm && npm.ready) {
      steps.push('4. Verify npm publish job completes in CI');
      steps.push(`5. Verify package on npmjs.org: npm view ${npm.packageName}@${version}`);
    }

    if (github && github.ready) {
      steps.push('6. Verify GitHub mirror syncs tag');
      steps.push('7. Verify GitHub release is created');
    }

    return steps;
  }

  /**
   * Build rollback plan
   */
  private buildRollbackPlan(version: string, versionTag: string): string[] {
    return [
      `If tag created but release fails: git tag -d ${versionTag} && git push origin :refs/tags/${versionTag}`,
      `If npm publish fails: npm unpublish ${version} --force (only within 72 hours)`,
      'If GitLab release created: Delete via GitLab UI',
      'If GitHub release created: Delete via GitHub UI',
      'Revert version in .version.json and package.json if needed',
    ];
  }

  /**
   * Build response (helper)
   */
  private buildResponse(
    ready: boolean,
    version: string,
    versionTag: string,
    gitlab: GitLabValidation,
    github: GitHubValidation | undefined,
    npm: NPMValidation | undefined,
    allErrors: string[],
    allWarnings: string[],
    checklist: Array<{ category: string; item: string; status: 'pass' | 'fail' | 'warning' | 'skip'; message: string }>,
    nextSteps: string[]
  ): ReleasePrepResponse {
    return ReleasePrepResponseSchema.parse({
      ready,
      version,
      versionTag,
      gitlab,
      github,
      npm,
      allErrors,
      allWarnings,
      checklist,
      nextSteps,
      rollbackPlan: this.buildRollbackPlan(version, versionTag),
    });
  }
}
