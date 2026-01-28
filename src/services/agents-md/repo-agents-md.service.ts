import { injectable, inject } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TemplateProcessorService,
  TemplateVariables,
} from '../template-processor.service.js';
import { GitService } from '../git.service.js';

export interface RepoConfig {
  repo_path: string;
  branch?: string;
  project_name?: string;
  project_type?: string;
  description?: string;
  gitlab_url?: string;
  wiki_url?: string;
}

export interface ValidationResult {
  valid: boolean;
  follows_standard: boolean;
  errors: string[];
  warnings: string[];
}

export interface GenerationResult {
  repo_path: string;
  status: 'success' | 'failed';
  content: string;
  commit_sha?: string;
  validation: ValidationResult;
  error?: string;
}

export interface BatchSummary {
  total: number;
  success: number;
  failed: number;
}

export interface RepoStatus {
  exists: boolean;
  content?: string;
  last_updated?: Date;
  validates: boolean;
}

@injectable()
export class RepoAgentsMdService {
  constructor(
    @inject(TemplateProcessorService)
    private templateProcessor: TemplateProcessorService,
    @inject(GitService) private gitService: GitService
  ) {}

  /**
   * Generate AGENTS.md for a repository
   */
  async generate(
    config: RepoConfig & {
      template_overrides?: Record<string, string>;
      auto_commit?: boolean;
      auto_push?: boolean;
    }
  ): Promise<GenerationResult> {
    try {
      // 1. Extract variables from repo
      const extractedVars =
        await this.templateProcessor.extractVariablesFromRepo(config.repo_path);

      // 2. Apply overrides
      const variables: TemplateVariables = {
        ...extractedVars,
        ...(config.project_name ? { PROJECT_NAME: config.project_name } : {}),
        ...(config.project_type ? { PROJECT_TYPE: config.project_type } : {}),
        ...(config.description
          ? { PROJECT_DESCRIPTION: config.description }
          : {}),
        ...(config.gitlab_url ? { REPO_URL: config.gitlab_url } : {}),
        ...(config.wiki_url ? { WIKI_URL: config.wiki_url } : {}),
        ...(config.template_overrides || {}),
      };

      // 3. Load and process template
      const template = await this.templateProcessor.loadDefaultTemplate();
      const content = await this.templateProcessor.process(template, variables);

      // 4. Validate
      const validation = await this.validate(content);

      // 5. Write file
      const outputPath = path.join(config.repo_path, 'AGENTS.md');
      await fs.writeFile(outputPath, content, 'utf-8');

      // 6. Git operations
      let commit_sha: string | undefined;
      if (config.auto_commit) {
        commit_sha = await this.gitService.commitAndPush(
          config.repo_path,
          'AGENTS.md',
          'docs: generate AGENTS.md documentation',
          config.branch || 'main'
        );
      }

      return {
        repo_path: config.repo_path,
        status: 'success',
        content,
        commit_sha,
        validation,
      };
    } catch (error) {
      const err = error as Error;
      return {
        repo_path: config.repo_path,
        status: 'failed',
        content: '',
        error: err.message,
        validation: {
          valid: false,
          follows_standard: false,
          errors: [err.message],
          warnings: [],
        },
      };
    }
  }

  /**
   * Batch generate for multiple repos
   */
  async batchGenerate(
    repos: RepoConfig[],
    parallel: boolean = true
  ): Promise<{ results: GenerationResult[]; summary: BatchSummary }> {
    const results: GenerationResult[] = [];

    if (parallel) {
      const promises = repos.map((repo) =>
        this.generate({ ...repo, auto_commit: true, auto_push: true })
      );
      results.push(...(await Promise.all(promises)));
    } else {
      for (const repo of repos) {
        results.push(
          await this.generate({ ...repo, auto_commit: true, auto_push: true })
        );
      }
    }

    const summary: BatchSummary = {
      total: results.length,
      success: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
    };

    return { results, summary };
  }

  /**
   * Validate AGENTS.md content
   */
  async validate(content: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!content) {
      errors.push('Content is empty');
    }

    // Check for unreplaced placeholders
    const placeholders = content.match(/\{[A-Z0-9_]+\}/g);
    if (placeholders) {
      warnings.push(
        `Contains unreplaced placeholders: ${placeholders.join(', ')}`
      );
    }

    // Standard compliance checks
    if (!content.includes('# ')) {
      errors.push('Missing H1 title');
    }

    const follows_standard = errors.length === 0;

    return {
      valid: errors.length === 0,
      follows_standard,
      errors,
      warnings,
    };
  }

  /**
   * Get AGENTS.md status for a repo
   */
  async getStatus(repoPath: string): Promise<RepoStatus> {
    const filePath = path.join(repoPath, 'AGENTS.md');
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const validation = await this.validate(content);

      return {
        exists: true,
        content,
        last_updated: stats.mtime,
        validates: validation.valid,
      };
    } catch (_error) {
      return {
        exists: false,
        validates: false,
      };
    }
  }

  /**
   * Get current template
   */
  async getTemplate(): Promise<{ template: string; variables: string[] }> {
    const template = await this.templateProcessor.loadDefaultTemplate();
    const variables = this.templateProcessor.getPlaceholders(template);
    return { template, variables };
  }

  /**
   * Update template
   */
  async updateTemplate(
    template: string
  ): Promise<{ status: 'success' | 'failure'; validation: ValidationResult }> {
    // Basic validation of the new template
    const validation = await this.validate(template);

    if (validation.valid) {
      // Use home directory for user updates to avoid permission issues
      const templatePath = path.join(
        process.env.HOME || '',
        '.ossa',
        'AGENTS.md.template'
      );
      const dir = path.dirname(templatePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(templatePath, template, 'utf-8');
      return { status: 'success', validation };
    }

    return { status: 'failure', validation };
  }

  /**
   * Remove AGENTS.md from repo
   */
  async delete(
    repoPath: string,
    auto_commit: boolean = false
  ): Promise<{
    status: 'success' | 'failure';
    commit_sha?: string;
    error?: string;
  }> {
    const filePath = path.join(repoPath, 'AGENTS.md');
    try {
      await fs.unlink(filePath);

      let commit_sha: string | undefined;
      if (auto_commit) {
        commit_sha = await this.gitService.removeFile(
          repoPath,
          'AGENTS.md',
          'docs: remove AGENTS.md'
        );
      }

      return { status: 'success', commit_sha };
    } catch (error) {
      const err = error as Error;
      return { status: 'failure', error: err.message };
    }
  }
}
