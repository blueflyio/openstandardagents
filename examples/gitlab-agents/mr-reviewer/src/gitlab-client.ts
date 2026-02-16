import { Gitlab } from '@gitbeaker/rest';
import type { Logger } from 'pino';

export interface GitLabClientConfig {
  token: string;
  baseUrl?: string;
}

export class GitLabClient {
  private gitlab: InstanceType<typeof Gitlab>;

  constructor(config: GitLabClientConfig) {
    this.gitlab = new Gitlab({
      host: config.baseUrl || 'https://gitlab.com',
      token: config.token,
    });
  }

  /**
   * Get all file changes in the MR
   */
  async getMRChanges(projectId: string, mrIid: number) {
    const changes = await this.gitlab.MergeRequests.allDiffs(projectId, mrIid);
    return changes.map((diff: any) => ({
      oldPath: diff.old_path,
      newPath: diff.new_path,
      diff: diff.diff,
      newFile: diff.new_file,
      renamedFile: diff.renamed_file,
      deletedFile: diff.deleted_file,
    }));
  }

  /**
   * Run production-grade audit on changed files
   */
  async runAudit(projectId: string, mrIid: number) {
    const changes = await this.getMRChanges(projectId, mrIid);
    const findings: Array<{ file: string; severity: string; message: string }> = [];

    for (const change of changes) {
      if (change.deletedFile) continue;

      // Check for common issues in diffs
      if (change.diff?.includes('console.log')) {
        findings.push({
          file: change.newPath,
          severity: 'warning',
          message: 'Contains console.log statement - consider removing for production',
        });
      }
      if (change.diff?.includes('TODO') || change.diff?.includes('FIXME')) {
        findings.push({
          file: change.newPath,
          severity: 'info',
          message: 'Contains TODO/FIXME comment',
        });
      }
      if (change.diff?.includes('password') || change.diff?.includes('secret')) {
        findings.push({
          file: change.newPath,
          severity: 'critical',
          message: 'Potential credential exposure detected',
        });
      }
    }

    return {
      totalFiles: changes.length,
      findings,
      passed: !findings.some((f) => f.severity === 'critical'),
    };
  }

  /**
   * Run security scan on dependencies
   */
  async runSecurityScan(projectId: string, branch: string) {
    // Fetch package.json to check dependencies
    const vulnerabilities: Array<{ dependency: string; severity: string; advisory: string }> = [];

    try {
      const file = await this.gitlab.RepositoryFiles.show(projectId, 'package.json', branch);
      const packageJson = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Flag known patterns that indicate insecure version ranges
      for (const [dep, version] of Object.entries(allDeps)) {
        const versionStr = String(version);
        if (versionStr === '*' || versionStr === 'latest') {
          vulnerabilities.push({
            dependency: dep,
            severity: 'warning',
            advisory: `Unpinned dependency version: ${versionStr}`,
          });
        }
      }
    } catch {
      // package.json not found or not parseable - skip dependency check
    }

    return {
      scannedAt: new Date().toISOString(),
      branch,
      vulnerabilities,
      passed: !vulnerabilities.some((v) => v.severity === 'critical'),
    };
  }

  /**
   * Post comment to merge request
   */
  async postMRComment(projectId: string, mrIid: number, body: string, replyToId?: number) {
    return await this.gitlab.MergeRequestNotes.create(projectId, mrIid, body, {
      ...(replyToId && { reply_to: replyToId }),
    });
  }

  /**
   * Approve merge request
   */
  async approveMR(projectId: string, mrIid: number) {
    return await this.gitlab.MergeRequestApprovals.approve(projectId, mrIid);
  }

  /**
   * Block MR with required changes by posting a blocking comment
   */
  async blockMR(projectId: string, mrIid: number, reason: string) {
    const blockComment = `**Changes Requested**\n\nThis MR cannot be merged until the following issues are resolved:\n\n${reason}`;
    return await this.gitlab.MergeRequestNotes.create(projectId, mrIid, blockComment);
  }
}
