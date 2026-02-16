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
   * Run comprehensive codebase audit
   */
  async runFullAudit(projectId: string, ref: string) {
    const tree = await this.gitlab.Repositories.allRepositoryTrees(projectId, { ref, recursive: true });
    const sourceFiles = (tree as any[]).filter(
      (item: any) => item.type === 'blob' && /\.(ts|js|py|rb|go|rs)$/.test(item.path)
    );

    const metrics = {
      totalFiles: sourceFiles.length,
      scannedAt: new Date().toISOString(),
      ref,
      findings: [] as Array<{ file: string; type: string; message: string }>,
    };

    // Sample a subset of files for analysis (avoid rate limits)
    const filesToScan = sourceFiles.slice(0, 50);
    for (const file of filesToScan) {
      try {
        const content = await this.gitlab.RepositoryFiles.show(projectId, file.path, ref);
        const decoded = Buffer.from(content.content, 'base64').toString('utf-8');

        if (decoded.includes('throw new Error(\'Not implemented')) {
          metrics.findings.push({
            file: file.path,
            type: 'stub',
            message: 'Contains unimplemented stub method',
          });
        }
        if (decoded.includes('// TODO')) {
          metrics.findings.push({
            file: file.path,
            type: 'todo',
            message: 'Contains TODO comment',
          });
        }
      } catch {
        // Skip files that cannot be read
      }
    }

    return metrics;
  }

  /**
   * Get metrics from previous scans by reading scan issues
   */
  async getHistoricalMetrics(projectId: string, daysBack: number) {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();
    const issues = await this.gitlab.Issues.all({
      projectId,
      labels: 'code-scan',
      createdAfter: since,
    });

    return (issues as any[]).map((issue: any) => ({
      date: issue.created_at,
      title: issue.title,
      state: issue.state,
      url: issue.web_url,
    }));
  }

  /**
   * Create GitLab issue
   */
  async createIssue(
    projectId: string,
    title: string,
    description: string,
    labels: string[],
    severity: string
  ) {
    return await this.gitlab.Issues.create(projectId, {
      title,
      description,
      labels: labels.join(','),
    });
  }

  /**
   * Update quality metrics dashboard by writing metrics to a wiki page
   */
  async updateMetricsDashboard(projectId: string, metrics: { totalFiles: number; findings: any[]; scannedAt: string }) {
    const dashboardContent = [
      '# Code Quality Metrics Dashboard',
      '',
      `**Last Scan:** ${metrics.scannedAt}`,
      `**Total Files:** ${metrics.totalFiles}`,
      `**Findings:** ${metrics.findings.length}`,
      '',
      '## Findings',
      '',
      ...metrics.findings.map((f) => `- **${f.type}** \`${f.file}\`: ${f.message}`),
    ].join('\n');

    try {
      await this.gitlab.RepositoryFiles.edit(
        projectId,
        'docs/quality-metrics.md',
        'main',
        dashboardContent,
        'chore: update quality metrics dashboard'
      );
    } catch {
      // File does not exist yet, create it
      await this.gitlab.RepositoryFiles.create(
        projectId,
        'docs/quality-metrics.md',
        'main',
        dashboardContent,
        'chore: create quality metrics dashboard'
      );
    }
  }
}
