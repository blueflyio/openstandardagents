#!/usr/bin/env node

/**
 * OSSA Workspace Generation Commands
 * Tools for other projects to initialize OSSA workspaces
 */

import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import * as yaml from 'js-yaml';

export interface WorkspaceOptions {
  type: 'local' | 'shared';
  force: boolean;
  template?: string;
}

export interface WorkspaceConfig {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version: string;
    project: string;
  };
  spec: {
    workspace: {
      type: string;
      global_path?: string;
      local_path?: string;
    };
    agents: {
      base_path: string;
      auto_discover: boolean;
      validation: string;
    };
    registry: {
      project: string;
      global?: string;
    };
  };
}

/**
 * Initialize OSSA workspace in target project
 */
export async function initializeWorkspace(projectPath: string, options: WorkspaceOptions): Promise<void> {
  const targetPath = resolve(projectPath);
  const agentsPath = join(targetPath, '.agents');
  const workspacePath = join(targetPath, '.agents-workspace');

  console.log(chalk.blue(`🚀 Initializing OSSA workspace in: ${targetPath}`));

  try {
    // Check if workspace already exists
    if ((existsSync(agentsPath) || existsSync(workspacePath)) && !options.force) {
      console.log(chalk.yellow('⚠️  OSSA workspace already exists. Use --force to overwrite.'));
      return;
    }

    // Create .agents directory structure
    console.log(chalk.gray('📁 Creating .agents structure...'));
    const agentDirs = [
      '.agents/agents',
      '.agents/manifests',
      '.agents/schemas/openapi',
      '.agents/schemas/json/manifests',
      '.agents/workflows',
      '.agents/governance/policies',
      '.agents/governance/audits/logs',
      '.agents/config'
    ];

    agentDirs.forEach((dir) => {
      mkdirSync(join(targetPath, dir), { recursive: true });
    });

    // Create .agents-workspace structure (if local type)
    if (options.type === 'local') {
      console.log(chalk.gray('📁 Creating .agents-workspace structure...'));
      const workspaceDirs = [
        '.agents-workspace/data/cache',
        '.agents-workspace/data/artifacts/builds',
        '.agents-workspace/data/artifacts/deployments',
        '.agents-workspace/data/artifacts/validations',
        '.agents-workspace/data/snapshots',
        '.agents-workspace/logs/orchestration',
        '.agents-workspace/logs/agents',
        '.agents-workspace/logs/errors',
        '.agents-workspace/metrics/prometheus',
        '.agents-workspace/metrics/custom',
        '.agents-workspace/metrics/dashboards',
        '.agents-workspace/monitoring/health',
        '.agents-workspace/monitoring/alerts',
        '.agents-workspace/monitoring/traces',
        '.agents-workspace/orchestration/workflows',
        '.agents-workspace/orchestration/schedules',
        '.agents-workspace/orchestration/queues',
        '.agents-workspace/security/certificates',
        '.agents-workspace/security/policies',
        '.agents-workspace/security/secrets',
        '.agents-workspace/validation/schemas',
        '.agents-workspace/validation/results',
        '.agents-workspace/validation/reports',
        '.agents-workspace/workflows/active',
        '.agents-workspace/workflows/completed',
        '.agents-workspace/workflows/templates',
        '.agents-workspace/compliance/reports',
        '.agents-workspace/compliance/violations',
        '.agents-workspace/compliance/audit-trail',
        '.agents-workspace/config'
      ];

      workspaceDirs.forEach((dir) => {
        mkdirSync(join(targetPath, dir), { recursive: true });
      });
    }

    // Generate ossa.config.yaml
    console.log(chalk.gray('⚙️  Creating ossa.config.yaml...'));
    const projectName = targetPath.split('/').pop() || 'unknown-project';
    const config = generateWorkspaceConfig(projectName, options);
    writeFileSync(join(targetPath, 'ossa.config.yaml'), yaml.dump(config));

    // Generate .agents/registry.yml
    console.log(chalk.gray('📋 Creating agents registry...'));
    const registry = generateAgentRegistry(projectName);
    writeFileSync(join(targetPath, '.agents/registry.yml'), yaml.dump(registry));

    // Generate .agents-workspace files (if local)
    if (options.type === 'local') {
      console.log(chalk.gray('📄 Creating workspace configuration files...'));

      // workspace.yml
      const workspaceConfig = generateLocalWorkspaceConfig(projectName);
      writeFileSync(join(targetPath, '.agents-workspace/workspace.yml'), yaml.dump(workspaceConfig));

      // memory.json
      const memoryConfig = generateMemoryConfig(projectName);
      writeFileSync(join(targetPath, '.agents-workspace/memory.json'), JSON.stringify(memoryConfig, null, 2));

      // README.md
      const readmeContent = generateWorkspaceReadme(projectName, options.type);
      writeFileSync(join(targetPath, '.agents-workspace/README.md'), readmeContent);
    }

    // Generate .agents/README.md
    const agentsReadme = generateAgentsReadme(projectName);
    writeFileSync(join(targetPath, '.agents/README.md'), agentsReadme);

    console.log(chalk.green('✅ OSSA workspace initialized successfully!'));
    console.log(chalk.blue('\n📋 Next steps:'));
    console.log(chalk.gray('1. ossa agent create <name> --type worker'));
    console.log(chalk.gray('2. ossa spec create <name> --template worker'));
    console.log(chalk.gray('3. ossa validate workspace'));
  } catch (error) {
    console.error(
      chalk.red('❌ Failed to initialize workspace:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

/**
 * Generate workspace from template
 */
export async function generateWorkspace(template: string, outputPath: string): Promise<void> {
  console.log(chalk.blue(`📁 Generating workspace from ${template} template...`));

  const templateOptions: WorkspaceOptions = {
    type: template === 'basic' ? 'local' : 'shared',
    force: false
  };

  await initializeWorkspace(outputPath, templateOptions);
}

/**
 * Generate workspace configuration
 */
function generateWorkspaceConfig(projectName: string, options: WorkspaceOptions): WorkspaceConfig {
  const config: WorkspaceConfig = {
    apiVersion: 'open-standards-scalable-agents/v0.1.9',
    kind: 'ProjectConfiguration',
    metadata: {
      name: projectName,
      version: '0.1.9-alpha.1',
      project: `project-${projectName}`
    },
    spec: {
      workspace: {
        type: options.type,
        ...(options.type === 'shared' && {
          global_path: '../.agent-workspace'
        }),
        ...(options.type === 'local' && {
          local_path: '.agents-workspace'
        })
      },
      agents: {
        base_path: '.agents',
        auto_discover: true,
        validation: 'strict'
      },
      registry: {
        project: '.agents/registry.yml',
        ...(options.type === 'shared' && {
          global: '../.agent-workspace/registry.yml'
        })
      }
    }
  };

  return config;
}

/**
 * Generate agent registry
 */
function generateAgentRegistry(projectName: string) {
  return {
    apiVersion: 'open-standards-scalable-agents/v0.1.9',
    kind: 'Registry',
    metadata: {
      name: `${projectName}-agents`,
      scope: 'project'
    },
    spec: {
      agents: [],
      discovery: {
        enabled: true,
        methods: ['filesystem', 'git', 'uadp']
      }
    }
  };
}

/**
 * Generate local workspace config
 */
function generateLocalWorkspaceConfig(projectName: string) {
  return {
    apiVersion: 'open-standards-scalable-agents/v0.1.9',
    kind: 'LocalWorkspaceConfiguration',
    metadata: {
      name: `${projectName}-workspace`,
      project: projectName,
      version: '0.1.9-alpha.1'
    },
    spec: {
      workspace: {
        type: 'local',
        project: projectName
      },
      agents: {
        total: 0,
        local_execution: true,
        artifact_storage: 'data/artifacts/'
      },
      compliance: {
        standard: 'ossa-v0.1.9'
      },
      storage: {
        artifacts: 'data/artifacts/',
        logs: 'logs/',
        cache: 'data/cache/',
        snapshots: 'data/snapshots/'
      }
    }
  };
}

/**
 * Generate memory config
 */
function generateMemoryConfig(projectName: string) {
  return {
    version: '0.1.9-alpha.1',
    workspace: {
      id: `${projectName}-workspace`,
      type: 'local',
      created: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      project: projectName
    },
    agents: {
      total: 0,
      active: 0,
      categories: {}
    },
    execution: {
      workflows_executed: 0,
      tasks_completed: 0,
      artifacts_generated: 0
    },
    compliance: {
      standard: 'ossa-v0.1.9',
      level: 'core',
      last_validation: new Date().toISOString(),
      violations: 0,
      score: 100
    }
  };
}

/**
 * Generate workspace README
 */
function generateWorkspaceReadme(projectName: string, type: string): string {
  return `# ${projectName} OSSA Workspace

This is an OSSA v0.1.9-alpha.1 compliant workspace for the ${projectName} project.

## Type: ${type}

${
  type === 'local'
    ? `This workspace operates independently with local artifact storage and execution.`
    : `This workspace coordinates with a global workspace for cross-project collaboration.`
}

## Structure

\`\`\`
.agents-workspace/
├── data/                    # Local data storage
├── logs/                    # Local logging
├── metrics/                 # Local metrics
├── monitoring/              # Local monitoring
├── orchestration/           # Local orchestration
├── security/                # Local security
├── validation/              # Local validation
├── workflows/               # Workflow management
└── compliance/              # Compliance tracking
\`\`\`

## Usage

Use the OSSA CLI to manage agents and workflows:

\`\`\`bash
# Create new agent
ossa agent create my-worker --type worker

# Validate workspace
ossa validate workspace

# List agents
ossa agent list
\`\`\`

Generated by OSSA CLI v0.1.9-alpha.1
`;
}

/**
 * Generate agents README
 */
function generateAgentsReadme(projectName: string): string {
  return `# ${projectName} OSSA Agents

This directory contains OSSA v0.1.9-alpha.1 compliant agent definitions for the ${projectName} project.

## Structure

\`\`\`
.agents/
├── agents/                  # Individual agent implementations
├── manifests/               # Versioned agent catalogs
├── schemas/                 # Shared schemas
├── workflows/               # Reference workflows
├── governance/              # Policies and audits
├── config/                  # Project configuration
└── registry.yml            # Project agent registry
\`\`\`

## Creating Agents

Use the OSSA CLI to create new agents:

\`\`\`bash
# Create worker agent
ossa agent create data-processor --type worker

# Create orchestrator
ossa agent create workflow-manager --type orchestrator

# Generate from OpenAPI spec
ossa agent generate-from-openapi api-spec.yml --name api-handler
\`\`\`

## Agent Types

- **orchestrators**: Coordinate workflows and other agents
- **workers**: Execute specific tasks and operations
- **critics**: Analyze and validate outputs
- **governors**: Enforce policies and manage resources
- **monitors**: Track performance and health
- **integrators**: Connect with external systems

Generated by OSSA CLI v0.1.9-alpha.1
`;
}
