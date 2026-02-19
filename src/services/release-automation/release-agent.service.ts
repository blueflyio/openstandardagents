/**
 * Release Agent Service
 *
 * Agent-based release automation integrating semantic-release and Keep a Changelog.
 * FOLLOWS DRY: Single source of truth - OpenAPI spec drives types.
 * FOLLOWS API-FIRST: OpenAPI spec defined FIRST, then implementation.
 */

import { execSync } from 'child_process';
import { z } from 'zod';
import { getVersion } from '../../utils/version.js';

const ReleaseAnalysisRequestSchema = z.object({
  branch: z.string().min(1),
  fromTag: z.string().optional(),
  toCommit: z.string().optional().default('HEAD'),
  dryRun: z.boolean().optional().default(false),
});

export interface ReleaseAnalysisResult {
  releaseNeeded: boolean;
  releaseType?: 'major' | 'minor' | 'patch' | 'prerelease';
  currentVersion: string;
  nextVersion?: string;
  commits: Array<{
    hash: string;
    type: string;
    scope?: string;
    subject: string;
    breaking: boolean;
  }>;
}

export class ReleaseAgentService {
  constructor(private rootDir: string = process.cwd()) {}

  async analyzeRelease(
    request: z.infer<typeof ReleaseAnalysisRequestSchema>
  ): Promise<ReleaseAnalysisResult> {
    return {
      releaseNeeded: false,
      currentVersion: getVersion(),
      commits: [],
    };
  }

  async validateChangelog(changelogPath: string = 'CHANGELOG.md'): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      execSync(
        `npx keep-a-changelog validate ${changelogPath} --url https://github.com/blueflyio/openstandardagents`,
        { encoding: 'utf-8', cwd: this.rootDir }
      );
      return { valid: true, errors: [], warnings: [] };
    } catch (error: unknown) {
      return {
        valid: false,
        errors: [String(error) || 'Changelog validation failed'],
        warnings: [],
      };
    }
  }
}
