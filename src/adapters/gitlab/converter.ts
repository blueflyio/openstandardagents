/**
 * GitLab Converter
 * Converts OSSA agent to GitLab CI job
 */

import type { OssaAgent } from '../../types/index.js';
import type { GitLabJobConfig, GitLabPipelineConfig } from './types.js';

export class GitLabConverter {
  /**
   * Convert OSSA agent to GitLab CI job
   */
  convertJob(manifest: OssaAgent): GitLabJobConfig {
    const spec = manifest.spec as Record<string, unknown>;
    const runtime = spec.runtime as
      | {
          type?: string;
          image?: string;
          command?: string[];
        }
      | undefined;

    const scripts: string[] = [];

    // Add setup commands
    scripts.push('npm ci');
    scripts.push('npm run build');

    // Add agent execution
    if (runtime?.command && runtime.command.length > 0) {
      scripts.push(...runtime.command);
    } else {
      scripts.push('node dist/index.js');
    }

    return {
      image: runtime?.image || 'node:20-alpine',
      stage: 'deploy',
      script: scripts,
      variables: {
        NODE_ENV: 'production',
      },
      artifacts: {
        paths: ['dist/'],
        expire_in: '1 week',
      },
      rules: [
        {
          if: '$CI_COMMIT_BRANCH == "main"',
          when: 'on_success',
        },
      ],
    };
  }

  /**
   * Convert OSSA workflow to GitLab pipeline
   */
  convertPipeline(workflow: {
    spec?: { steps?: unknown[] };
  }): GitLabPipelineConfig {
    const spec = workflow.spec as Record<string, unknown>;
    const steps = spec.steps as Array<{ name?: string }> | undefined;

    const jobs: Record<string, GitLabJobConfig> = {};
    const stages: string[] = ['build', 'test', 'deploy'];

    if (steps) {
      for (const step of steps) {
        const jobName = step.name || 'job';
        jobs[jobName] = {
          stage: 'deploy',
          script: [`echo "Executing ${step.name || 'step'}"`],
        };
      }
    }

    return {
      stages,
      jobs,
    };
  }

  /**
   * Generate .gitlab-ci.yml content
   */
  generateYAML(manifest: OssaAgent): string {
    const job = this.convertJob(manifest);
    const jobName = manifest.metadata?.name || 'agent';

    return `# GitLab CI/CD Pipeline
# Generated from OSSA manifest: ${manifest.metadata?.name || 'agent'}

stages:
  - build
  - test
  - deploy

${jobName}:
  image: ${job.image || 'node:20-alpine'}
  stage: ${job.stage || 'deploy'}
  script:
${job.script.map((s) => `    - ${s}`).join('\n')}
  variables:
${Object.entries(job.variables || {})
  .map(([k, v]) => `    ${k}: ${v}`)
  .join('\n')}
  artifacts:
    paths:
${(job.artifacts?.paths || []).map((p) => `      - ${p}`).join('\n')}
    expire_in: ${job.artifacts?.expire_in || '1 week'}
  rules:
${(job.rules || []).map((r) => `    - if: ${r.if || 'true'}\n      when: ${r.when || 'on_success'}`).join('\n')}
`;
  }
}
