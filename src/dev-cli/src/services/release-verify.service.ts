/**
 * Release Verify Service
 * 
 * Validates repository state, versions, tags, and CI configuration
 * before any release operations
 * 
 * Architecture:
 * - OpenAPI-First: Spec in openapi/dev-cli.openapi.yml
 * - Zod Validation: All inputs/outputs validated with Zod schemas
 * - CRUD: Read operation (validates state, doesn't modify)
 * - DRY: Reuses existing services (VersionValidateService, GitService)
 * - SOLID: Single Responsibility - Release readiness validation only
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import {
  ReleaseVerifyRequestSchema,
  ReleaseVerifyResponseSchema,
  RepositoryStateSchema,
  VersionStateSchema,
  TagStateSchema,
  CIConfigStateSchema,
  RepositoryCheckSchema,
  type ReleaseVerifyRequest,
  type ReleaseVerifyResponse,
  type RepositoryState,
  type VersionState,
  type TagState,
  type CIConfigState,
} from '../schemas/release.schema.js';
import { VersionConfigSchema } from '../schemas/version.schema.js';
import { VersionValidateService } from './version-validate.service.js';

export class ReleaseVerifyService {
  private readonly rootDir: string;
  private readonly versionValidateService: VersionValidateService;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.versionValidateService = new VersionValidateService(rootDir);
  }

  /**
   * Verify release readiness
   * CRUD: Read operation (validates state, doesn't modify)
   * 
   * @param request - Verification request (validated with Zod)
   * @returns Verification result (validated with Zod)
   */
  async verify(request: Partial<ReleaseVerifyRequest> = {}): Promise<ReleaseVerifyResponse> {
    // Validate input with Zod (with defaults)
    const validatedRequest = ReleaseVerifyRequestSchema.parse(request);

    const errors: string[] = [];
    const warnings: string[] = [];
    const nextSteps: string[] = [];

    // 1. Repository State (CRUD: Read)
    const repository = await this.verifyRepository();

    // 2. Version State (CRUD: Read, reuses VersionValidateService - DRY)
    const versionState = await this.verifyVersion(validatedRequest.version);

    // 3. Tag State (CRUD: Read)
    const tagState = await this.verifyTags(versionState.versionTag);

    // 4. CI Configuration (CRUD: Read)
    let ciConfig: CIConfigState | undefined;
    if (!validatedRequest.skipCIConfig) {
      ciConfig = await this.verifyCIConfig();
    }

    // Collect errors and warnings from all checks
    repository.checks.forEach(check => {
      if (!check.passed) errors.push(check.message);
    });
    versionState.checks.forEach(check => {
      if (!check.passed) errors.push(check.message);
    });
    tagState.checks.forEach(check => {
      if (!check.passed) errors.push(check.message);
    });
    if (ciConfig) {
      ciConfig.checks.forEach(check => {
        if (!check.passed) errors.push(check.message);
      });
    }

    // Next steps if ready
    if (errors.length === 0) {
      nextSteps.push('Ensure CI pipeline passes on target branch');
      nextSteps.push('Verify protected tag rules allow CI_DEPLOY_OSSA to create tags');
      nextSteps.push(`Promote RC tag to stable: git tag -a ${versionState.versionTag} -m 'Release ${versionState.versionTag}' <commit-sha>`);
      nextSteps.push(`Push tag: git push origin ${versionState.versionTag}`);
      nextSteps.push('Monitor release pipeline for npm publish');
    }

    // Build and validate response with Zod
    const response: ReleaseVerifyResponse = ReleaseVerifyResponseSchema.parse({
      ready: errors.length === 0,
      version: versionState.versionFromJson,
      versionTag: versionState.versionTag,
      repository,
      versionState,
      tagState,
      ciConfig,
      errors,
      warnings,
      nextSteps,
    });

    return response;
  }

  /**
   * Verify repository state
   * CRUD: Read
   */
  private async verifyRepository(): Promise<RepositoryState> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];
    let remoteUrl = '';
    let currentBranch = '';
    let isClean = false;

    try {
      remoteUrl = execSync('git remote get-url origin', {
        encoding: 'utf-8',
        cwd: this.rootDir,
      }).trim();


      const expectedRepo = process.env.EXPECTED_REPO_URL || 'gitlab.com/blueflyio/ossa/openstandardagents';
      if (!remoteUrl.includes(expectedRepo)) {
        checks.push({
          name: 'Repository Identity',
          passed: false,
          message: 'Remote URL does not match expected GitLab repository',
        });
      } else {
        checks.push({
          name: 'Repository Identity',
          passed: true,
          message: 'Remote URL points to GitLab source-of-truth',
        });
      }

      currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        cwd: this.rootDir,
      }).trim();

      const status = execSync('git status --porcelain', {
        encoding: 'utf-8',
        cwd: this.rootDir,
      }).trim();

      isClean = status === '';

      if (!isClean) {
        checks.push({
          name: 'Working Tree',
          passed: false,
          message: 'Working tree is not clean - commit or stash changes first',
        });
      } else {
        checks.push({
          name: 'Working Tree',
          passed: true,
          message: 'Working tree is clean',
        });
      }

      execSync('git fetch --tags --prune', {
        stdio: 'ignore',
        cwd: this.rootDir,
      });

      checks.push({
        name: 'Tags Sync',
        passed: true,
        message: 'Fetched latest tags from remote',
      });
    } catch (error) {
      checks.push({
        name: 'Git Operations',
        passed: false,
        message: `Git operations failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return RepositoryStateSchema.parse({
      remoteUrl,
      currentBranch,
      isClean,
      checks: checks.map(c => RepositoryCheckSchema.parse(c)),
    });
  }

  /**
   * Verify version state
   * CRUD: Read
   * DRY: Reuses VersionValidateService
   */
  private async verifyVersion(versionArg?: string): Promise<VersionState> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];
    const versionJsonPath = join(this.rootDir, '.version.json');
    const packageJsonPath = join(this.rootDir, 'package.json');

    if (!existsSync(versionJsonPath)) {
      checks.push({
        name: 'Version File',
        passed: false,
        message: '.version.json not found',
      });
      return VersionStateSchema.parse({
        versionFromJson: '',
        packageVersion: '',
        versionTag: '',
        isSynced: false,
        checks: checks.map(c => RepositoryCheckSchema.parse(c)),
      });
    }

    if (!existsSync(packageJsonPath)) {
      checks.push({
        name: 'Package File',
        passed: false,
        message: 'package.json not found',
      });
      return VersionStateSchema.parse({
        versionFromJson: '',
        packageVersion: '',
        versionTag: '',
        isSynced: false,
        checks: checks.map(c => RepositoryCheckSchema.parse(c)),
      });
    }

    // Use Zod to validate and parse (DRY - reuses existing schema)
    const versionConfig = VersionConfigSchema.parse(
      JSON.parse(readFileSync(versionJsonPath, 'utf-8'))
    );
    
    // Validate package.json with Zod
    const PackageJsonSchema = z.object({
      version: z.string(),
    }).passthrough();
    const packageJson = PackageJsonSchema.parse(
      JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    );

    const versionFromJson = versionConfig.current;
    const packageVersion = packageJson.version;
    const isSynced = versionFromJson === packageVersion;

    if (!isSynced) {
      checks.push({
        name: 'Version Sync',
        passed: false,
        message: `Version mismatch: .version.json=${versionFromJson}, package.json=${packageVersion}`,
      });
    } else {
      checks.push({
        name: 'Version Sync',
        passed: true,
        message: `Versions match: ${versionFromJson}`,
      });
    }

    if (versionArg && versionArg !== versionFromJson) {
      checks.push({
        name: 'Version Argument',
        passed: false,
        message: `Provided version (${versionArg}) does not match repository version (${versionFromJson})`,
      });
    }

    const versionTag = `v${versionFromJson}`;

    return VersionStateSchema.parse({
      versionFromJson,
      packageVersion,
      versionTag,
      isSynced,
      checks: checks.map(c => RepositoryCheckSchema.parse(c)),
    });
  }

  /**
   * Verify tag state
   * CRUD: Read
   */
  private async verifyTags(versionTag: string): Promise<TagState> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];
    let stableTagExists = false;
    const rcTags: string[] = [];
    const devTags: string[] = [];

    try {
      const allTags = execSync('git tag -l', {
        encoding: 'utf-8',
        cwd: this.rootDir,
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      stableTagExists = allTags.includes(versionTag);

      if (stableTagExists) {
        checks.push({
          name: 'Stable Tag',
          passed: false,
          message: `Stable tag ${versionTag} already exists - cannot create duplicate`,
        });
      } else {
        checks.push({
          name: 'Stable Tag',
          passed: true,
          message: `Tag ${versionTag} does not exist (ready for promotion)`,
        });
      }

      const rcTagOutput = execSync(`git tag -l "${versionTag}-rc.*"`, {
        encoding: 'utf-8',
        cwd: this.rootDir,
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      rcTags.push(...rcTagOutput);

      if (rcTags.length > 0) {
        checks.push({
          name: 'RC Tags',
          passed: true,
          message: `Found ${rcTags.length} RC tag(s)`,
        });
      }

      const devTagOutput = execSync(`git tag -l "${versionTag}-dev.*"`, {
        encoding: 'utf-8',
        cwd: this.rootDir,
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      devTags.push(...devTagOutput);
    } catch (error) {
      checks.push({
        name: 'Tag Check',
        passed: false,
        message: `Tag check failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return TagStateSchema.parse({
      versionTag,
      stableTagExists,
      rcTags,
      devTags,
      checks: checks.map(c => RepositoryCheckSchema.parse(c)),
    });
  }

  /**
   * Verify CI configuration
   * CRUD: Read
   */
  private async verifyCIConfig(): Promise<CIConfigState> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];
    const ciFiles = [
      { path: '.gitlab-ci.yml', name: 'Main CI Config' },
      { path: '.gitlab/ci/rules.yml', name: 'Rules Config' },
      { path: '.gitlab/ci/quality-gates.yml', name: 'Quality Gates' },
      { path: '.gitlab/ci/security-jobs.yml', name: 'Security Jobs' },
    ];

    const fileChecks = ciFiles.map(file => {
      const filePath = join(this.rootDir, file.path);
      const exists = existsSync(filePath);

      if (!exists) {
        checks.push({
          name: file.name,
          passed: false,
          message: `${file.path} not found`,
        });
        return {
          filePath: file.path,
          exists: false,
          checks: [],
        };
      }

      checks.push({
        name: file.name,
        passed: true,
        message: `${file.path} exists`,
      });

      let hasFastGate = false;
      let hasFullGate = false;

      if (file.path === '.gitlab/ci/quality-gates.yml') {
        const content = readFileSync(filePath, 'utf-8');
        hasFastGate = content.includes('quality:gates:fast');
        hasFullGate = content.includes('quality:gates:full');

        if (!hasFastGate) {
          checks.push({
            name: 'Fast Gate',
            passed: false,
            message: 'quality:gates:fast not found in quality-gates.yml',
          });
        }
        if (!hasFullGate) {
          checks.push({
            name: 'Full Gate',
            passed: false,
            message: 'quality:gates:full not found in quality-gates.yml',
          });
        }
      }

      return {
        filePath: file.path,
        exists: true,
        hasFastGate,
        hasFullGate,
        checks: [],
      };
    });

    return CIConfigStateSchema.parse({
      files: fileChecks,
      checks: checks.map(c => RepositoryCheckSchema.parse(c)),
    });
  }
}
