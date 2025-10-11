/**
 * GitLab-OSSA Bridge
 * Integrates OSSA agents with GitLab CI/CD pipelines
 */

import * as yaml from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import { OSSAAgent } from '@ossa/specification';
import { OSSARoadmap } from '../../integrations/linear';

export interface GitLabCIConfig {
  stages: string[];
  variables?: Record<string, string>;
  include?: Array<string | { component: string; inputs?: Record<string, any> }>;
  [key: string]: any; // Job definitions
}

export interface GitLabJob {
  stage?: string;
  script: string | string[];
  image?: string;
  services?: string[];
  variables?: Record<string, string>;
  artifacts?: {
    paths?: string[];
    reports?: Record<string, string>;
    expire_in?: string;
  };
  cache?: {
    key?: string;
    paths?: string[];
  };
  only?: string[] | { refs?: string[]; changes?: string[] };
  except?: string[] | { refs?: string[]; changes?: string[] };
  needs?: string[];
  dependencies?: string[];
  allow_failure?: boolean;
  retry?: number | { max: number; when: string[] };
  coverage?: string;
  environment?: {
    name: string;
    url?: string;
    on_stop?: string;
  };
}

export class GitLabBridge {
  private defaultImage = 'node:20-alpine';
  private ossaCliImage = 'registry.gitlab.com/ossa/validator:latest';

  /**
   * Generate GitLab CI configuration for OSSA agent
   */
  async generateGitLabCI(agent: OSSAAgent): Promise<GitLabCIConfig> {
    const config: GitLabCIConfig = {
      stages: ['validate', 'test', 'build', 'deploy', 'monitor'],
      variables: {
        OSSA_VERSION: '1.0',
        AGENT_NAME: agent.agent.name,
        AGENT_VERSION: agent.agent.version,
        CONFORMANCE_LEVEL: agent.agent.conformance || 'bronze'
      }
    };

    // Include golden component if specified
    if (agent.agent.conformance && ['silver', 'gold', 'platinum'].includes(agent.agent.conformance)) {
      config.include = [{
        component: 'gitlab.bluefly.io/llm/gitlab_components/workflow/golden@v0.1.0',
        inputs: {
          project_name: agent.agent.name,
          enable_auto_flow: true,
          enable_comprehensive_testing: true,
          enable_security_scanning: true,
          test_coverage_threshold: this.getCoverageThreshold(agent.agent.conformance)
        }
      }];
    }

    // Add OSSA validation job
    config['ossa:validate'] = this.createValidationJob(agent);

    // Add conformance check
    config['ossa:conformance'] = this.createConformanceJob(agent);

    // Add test jobs based on conformance
    if (agent.agent.conformance !== 'bronze') {
      config['test:unit'] = this.createUnitTestJob(agent);
      config['test:integration'] = this.createIntegrationTestJob(agent);
    }

    // Add build job
    config['build:agent'] = this.createBuildJob(agent);

    // Add deployment jobs
    if (agent.agent.conformance && ['gold', 'platinum'].includes(agent.agent.conformance)) {
      config['deploy:staging'] = this.createDeployJob(agent, 'staging');
      config['deploy:production'] = this.createDeployJob(agent, 'production');
    }

    // Add monitoring jobs for Silver+
    if (agent.monitoring?.enabled) {
      config['monitor:health'] = this.createHealthCheckJob(agent);
      config['monitor:metrics'] = this.createMetricsJob(agent);
    }

    // Add bridge-specific jobs
    if (agent.bridge) {
      if (agent.bridge.mcp?.enabled) {
        config['bridge:mcp'] = this.createMCPBridgeJob(agent);
      }
      if (agent.bridge.langchain?.enabled) {
        config['bridge:langchain'] = this.createLangChainBridgeJob(agent);
      }
    }

    // Add performance benchmarking for Gold+
    if (agent.performance && ['gold', 'platinum'].includes(agent.agent.conformance || '')) {
      config['benchmark:performance'] = this.createBenchmarkJob(agent);
    }

    return config;
  }

  /**
   * Sync OSSA roadmap with GitLab milestones and epics
   */
  async syncRoadmapToGitLab(roadmap: OSSARoadmap): Promise<any> {
    const gitlabObjects = {
      milestones: [],
      epics: [],
      issues: []
    };

    // Convert OSSA milestones to GitLab milestones
    if (roadmap.spec.milestones) {
      for (const milestone of roadmap.spec.milestones) {
        gitlabObjects.milestones.push({
          title: milestone.name,
          description: milestone.description,
          due_date: milestone.date,
          state: new Date(milestone.date) > new Date() ? 'active' : 'closed'
        });
      }
    }

    // Convert initiatives to epics
    for (const initiative of roadmap.spec.initiatives) {
      const epic = {
        title: `[${initiative.id}] ${initiative.title}`,
        description: this.formatInitiativeForGitLab(initiative),
        labels: this.mapLabelsToGitLab(initiative.labels || []),
        start_date: initiative.startDate,
        due_date: initiative.endDate,
        assignee_id: initiative.assignee
      };
      gitlabObjects.epics.push(epic);

      // Convert tasks to issues
      if (initiative.tasks) {
        for (const task of initiative.tasks) {
          gitlabObjects.issues.push({
            title: task.title,
            description: task.description,
            epic_id: `${initiative.id}`, // Will be resolved to actual ID
            assignee_id: task.assignee,
            weight: this.parseWeight(task.estimate),
            labels: [`initiative:${initiative.id}`]
          });
        }
      }
    }

    return gitlabObjects;
  }

  /**
   * Generate GitLab CI job for BuildKit integration
   */
  async generateBuildKitJob(agent: OSSAAgent): Promise<GitLabJob> {
    return {
      stage: 'deploy',
      image: 'registry.gitlab.com/bluefly/agent-buildkit:latest',
      script: [
        '# BuildKit deployment',
        `buildkit validate agent --manifest ${agent.agent.name}/agent.yml`,
        `buildkit generate openapi --from-agent ${agent.agent.name}`,
        `buildkit deploy agent --target gitlab --ossa-compliant`
      ],
      artifacts: {
        paths: ['dist/', 'openapi.yaml'],
        reports: {
          coverage: 'coverage/cobertura-coverage.xml',
          junit: 'test-results/junit.xml'
        },
        expire_in: '1 week'
      },
      only: {
        refs: ['main', 'development'],
        changes: ['**/agent.yml', '**/openapi.yaml']
      }
    };
  }

  // Private job creation methods
  private createValidationJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'validate',
      image: this.ossaCliImage,
      script: [
        `ossa validate agent ${agent.agent.name}/agent.yml`,
        `ossa validate openapi ${agent.agent.name}/openapi.yaml`,
        'ossa validate dual --strict'
      ],
      artifacts: {
        reports: {
          junit: 'ossa-validation.xml'
        },
        paths: ['ossa-validation-report.json']
      },
      cache: {
        key: 'ossa-schemas',
        paths: ['.ossa-cache/']
      }
    };
  }

  private createConformanceJob(agent: OSSAAgent): GitLabJob {
    const level = agent.agent.conformance || 'bronze';
    return {
      stage: 'validate',
      image: this.ossaCliImage,
      script: [
        `ossa conformance check --level ${level} ${agent.agent.name}`,
        'ossa conformance report --format junit > conformance.xml'
      ],
      artifacts: {
        reports: {
          junit: 'conformance.xml'
        }
      },
      needs: ['ossa:validate']
    };
  }

  private createUnitTestJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'test',
      image: this.defaultImage,
      script: [
        'npm ci',
        'npm run test:unit -- --coverage',
        `# Minimum coverage: ${this.getCoverageThreshold(agent.agent.conformance)}`
      ],
      coverage: '/Lines\\s*:\\s*([\\d.]+)%/',
      artifacts: {
        reports: {
          coverage_report: {
            coverage_format: 'cobertura',
            path: 'coverage/cobertura-coverage.xml'
          }
        }
      }
    };
  }

  private createIntegrationTestJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'test',
      image: this.defaultImage,
      services: this.getRequiredServices(agent),
      script: [
        'npm ci',
        'npm run test:integration'
      ],
      artifacts: {
        reports: {
          junit: 'test-results/integration.xml'
        }
      }
    };
  }

  private createBuildJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'build',
      image: this.defaultImage,
      script: [
        'npm ci',
        'npm run build',
        `echo "Building OSSA agent: ${agent.agent.name} v${agent.agent.version}"`
      ],
      artifacts: {
        paths: ['dist/', 'build/'],
        expire_in: '1 week'
      }
    };
  }

  private createDeployJob(agent: OSSAAgent, environment: string): GitLabJob {
    return {
      stage: 'deploy',
      script: [
        `echo "Deploying ${agent.agent.name} to ${environment}"`,
        `ossa deploy --agent ${agent.agent.name} --env ${environment}`,
        'buildkit deploy agent --target gitlab'
      ],
      environment: {
        name: environment,
        url: `https://${environment}.${agent.agent.name}.ossa.ai`
      },
      only: environment === 'production'
        ? { refs: ['main'] }
        : { refs: ['main', 'development'] }
    };
  }

  private createHealthCheckJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'monitor',
      script: [
        'curl -f ${CI_ENVIRONMENT_URL}/health || exit 1',
        'echo "Health check passed"'
      ],
      retry: {
        max: 3,
        when: ['script_failure']
      },
      allow_failure: false
    };
  }

  private createMetricsJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'monitor',
      script: [
        'curl -s ${CI_ENVIRONMENT_URL}/metrics > metrics.txt',
        'ossa metrics analyze metrics.txt',
        'ossa metrics push --to prometheus'
      ],
      artifacts: {
        paths: ['metrics.txt'],
        expire_in: '1 day'
      }
    };
  }

  private createMCPBridgeJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'test',
      image: 'registry.gitlab.com/modelcontextprotocol/mcp-cli:latest',
      script: [
        'mcp validate --agent agent.yml',
        'mcp test --tools',
        'mcp bridge verify --ossa'
      ]
    };
  }

  private createLangChainBridgeJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'test',
      image: 'python:3.11',
      script: [
        'pip install langchain ossa-bridge',
        'python -m ossa_bridge.langchain validate agent.yml',
        'python -m ossa_bridge.langchain test'
      ]
    };
  }

  private createBenchmarkJob(agent: OSSAAgent): GitLabJob {
    return {
      stage: 'test',
      script: [
        'npm run benchmark',
        'ossa benchmark run --agent ${AGENT_NAME}',
        'ossa benchmark compare --baseline main'
      ],
      artifacts: {
        paths: ['benchmark-results/'],
        reports: {
          performance: 'benchmark-results/performance.json'
        }
      },
      allow_failure: true
    };
  }

  // Helper methods
  private getCoverageThreshold(conformance?: string): number {
    const thresholds: Record<string, number> = {
      bronze: 50,
      silver: 70,
      gold: 85,
      platinum: 95
    };
    return thresholds[conformance || 'bronze'] || 50;
  }

  private getRequiredServices(agent: OSSAAgent): string[] {
    const services: string[] = [];

    // Add database services based on agent requirements
    if (agent.bridge?.openapi?.enabled) {
      services.push('postgres:14');
    }

    if (agent.performance?.cache?.layers) {
      const hasRedis = agent.performance.cache.layers.some(l => l.type === 'redis');
      if (hasRedis) {
        services.push('redis:7');
      }
    }

    return services;
  }

  private formatInitiativeForGitLab(initiative: any): string {
    const parts = [];

    if (initiative.description) {
      parts.push(initiative.description);
      parts.push('');
    }

    parts.push('## Details');
    parts.push(`- **Status**: ${initiative.status}`);
    parts.push(`- **Priority**: ${initiative.priority || 'medium'}`);

    if (initiative.capabilities?.length) {
      parts.push(`- **Capabilities**: ${initiative.capabilities.join(', ')}`);
    }

    if (initiative.agents?.length) {
      parts.push(`- **Agents**: ${initiative.agents.join(', ')}`);
    }

    return parts.join('\n');
  }

  private mapLabelsToGitLab(labels: string[]): string[] {
    return labels.map(label => `ossa::${label}`);
  }

  private parseWeight(estimate?: string): number | undefined {
    if (!estimate) return undefined;

    const match = estimate.match(/^(\d+)([hdw])$/);
    if (!match) return undefined;

    const value = parseInt(match[1]);
    const unit = match[2];

    // Convert to story points (1 day = 1 point)
    switch (unit) {
      case 'h': return Math.ceil(value / 8);
      case 'd': return value;
      case 'w': return value * 5;
      default: return value;
    }
  }
}