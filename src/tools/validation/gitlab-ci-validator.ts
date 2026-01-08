/**
 * GitLab CI Validator
 *
 * SOLID: Single Responsibility - Validates GitLab CI configuration
 * Zod: Validates CI structure
 * DRY: Reusable validation logic
 */

import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import { execSync } from 'child_process';

const GitLabCILintResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

type ValidationResult = {
  errors: number;
  warnings: number;
  messages: string[];
};

export class GitLabCIValidator {
  private errors = 0;
  private warnings = 0;
  private messages: string[] = [];

  /**
   * Validate GitLab CI file
   * CRUD: Read operation (validates file)
   */
  async validate(ciFile: string): Promise<ValidationResult> {
    this.errors = 0;
    this.warnings = 0;
    this.messages = [];

    if (!existsSync(ciFile)) {
      return { errors: 0, warnings: 0, messages: [] };
    }

    const content = readFileSync(ciFile, 'utf-8');

    // 1. Check for Docker image mismatches
    this.checkDockerImageMismatches(ciFile, content);

    // 2. Check for duplicate set commands
    this.checkDuplicateSetCommands(content);

    // 3. Check for unquoted variables
    this.checkUnquotedVariables(content);

    // 4. Check for missing error handling in curl
    this.checkCurlErrorHandling(content);

    // 5. Validate YAML syntax
    await this.validateYAMLSyntax(ciFile);

    // 6. Validate via GitLab API if token available
    await this.validateViaGitLabAPI(ciFile, content);

    return {
      errors: this.errors,
      warnings: this.warnings,
      messages: this.messages,
    };
  }

  private checkDockerImageMismatches(ciFile: string, content: string): void {
    const lines = content.split('\n');
    let currentJob = '';
    let hasNodeImage = false;
    let hasApk = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect job start
      if (/^[a-zA-Z0-9_-]+:/.test(line)) {
        if (currentJob && hasNodeImage && hasApk) {
          this.messages.push(
            `ERROR: Job '${currentJob}' uses 'node:\${NODE_VERSION}' (Debian) but runs 'apk' (Alpine)`
          );
          this.messages.push(
            `  Fix: Change to 'node:\${NODE_VERSION}-alpine' for jobs using apk`
          );
          this.errors++;
        }
        currentJob = line.split(':')[0];
        hasNodeImage = false;
        hasApk = false;
      }

      if (line.includes('image: node:${NODE_VERSION}')) {
        hasNodeImage = true;
      }
      if (line.includes('apk add')) {
        hasApk = true;
      }
    }
  }

  private checkDuplicateSetCommands(content: string): void {
    const scriptBlocks = content.match(/script:\s*\n(\s+-\s+\|\s*\n(?:\s+.*\n?)*)/g) || [];

    for (const block of scriptBlocks) {
      const setCommands = (block.match(/set\s+-euo\s+pipefail/g) || []).length;
      if (setCommands > 1) {
        this.messages.push(
          'ERROR: Script block has multiple \'set -euo pipefail\' commands'
        );
        this.messages.push('  Each script block should only have one \'set -euo pipefail\'');
        this.errors++;
      }
    }
  }

  private checkUnquotedVariables(content: string): void {
    if (!content.includes('set -euo pipefail')) {
      return;
    }

    const unquotedPattern = /\$\{[A-Z_]+\}[^"]/g;
    const matches = content.match(unquotedPattern) || [];
    const filtered = matches.filter(
      m => !m.includes('"${') && !m.includes("'${") && !m.includes('\\${')
    );

    if (filtered.length > 0) {
      this.messages.push(
        'WARNING: Unquoted variables found (may cause issues with set -euo pipefail)'
      );
      this.messages.push(...filtered.slice(0, 3));
      this.warnings++;
    }
  }

  private checkCurlErrorHandling(content: string): void {
    const curlLines = content.split('\n').filter(l => l.includes('curl') && l.includes('CI_API_V4_URL'));

    for (const line of curlLines) {
      const context = content.substring(
        Math.max(0, content.indexOf(line) - 200),
        content.indexOf(line) + 200
      );

      if (!context.includes('set -e') && !context.includes('||')) {
        this.messages.push('WARNING: curl commands may need error handling');
        this.warnings++;
        break;
      }
    }
  }

  private async validateYAMLSyntax(ciFile: string): Promise<void> {
    try {
      parse(readFileSync(ciFile, 'utf-8'));
    } catch (error) {
      this.messages.push(`ERROR: Invalid YAML syntax in ${ciFile}`);
      if (error instanceof Error) {
        this.messages.push(error.message);
      }
      this.errors++;
    }
  }

  private async validateViaGitLabAPI(ciFile: string, content: string): Promise<void> {
    const token = process.env.GITLAB_TOKEN ||
      (existsSync(`${process.env.HOME}/.tokens/gitlab`)
        ? readFileSync(`${process.env.HOME}/.tokens/gitlab`, 'utf-8').trim()
        : null);

    if (!token) {
      return;
    }

    try {
      const payload = JSON.stringify({ content });
      const response = execSync(
        `curl -s --request POST ` +
        `--header "PRIVATE-TOKEN: ${token}" ` +
        `--header "Content-Type: application/json" ` +
        `--data '${payload}' ` +
        `"https://gitlab.com/api/v4/ci/lint"`,
        { encoding: 'utf-8' }
      );

      const result = GitLabCILintResponseSchema.parse(JSON.parse(response));

      if (!result.valid) {
        this.messages.push('ERROR: GitLab CI validation failed:');
        this.messages.push(...(result.errors || []).slice(0, 10));
        this.errors++;
      } else if (result.warnings && result.warnings.length > 0) {
        this.messages.push('WARNING: GitLab CI validation warnings:');
        this.messages.push(...result.warnings.slice(0, 5));
        this.warnings += result.warnings.length;
      } else {
        this.messages.push('GitLab CI syntax validated successfully');
      }
    } catch (error) {
      // API validation failed, but don't block commit
      this.messages.push('WARNING: GitLab API validation unavailable');
      this.warnings++;
    }
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new GitLabCIValidator();
  const ciFile = process.argv[2] || '.gitlab-ci.yml';

  validator.validate(ciFile).then(result => {
    result.messages.forEach(msg => console.log(msg));

    if (result.errors > 0) {
      console.log(`\nBLOCKED: ${result.errors} error(s) found in ${ciFile}`);
      console.log('Fix these errors before committing to avoid wasting CI minutes');
      process.exit(1);
    }

    if (result.warnings > 0) {
      console.log(`\nWARNING: ${result.warnings} warning(s) found (commit will proceed)`);
    }

    process.exit(0);
  });
}
