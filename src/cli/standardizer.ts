#!/usr/bin/env node

/**
 * OSSA v0.1.8 Agent Standardization System
 * Processes 47 .agents directories with proper branching strategy
 */

import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import simpleGit, { SimpleGit } from 'simple-git';
import ora from 'ora';
import inquirer from 'inquirer';
import yaml from 'yaml';
import boxen from 'boxen';
import { table } from 'table';

interface ProjectInfo {
  path: string;
  name: string;
  type: 'drupal-module' | 'npm-package' | 'ai-model' | 'platform';
  currentBranch: string;
  agentsDirPath: string;
  existingAgents: string[];
}

interface StandardAgentTemplate {
  core: AgentConfig;
  integration: AgentConfig;
  troubleshoot: AgentConfig;
  ossa_advanced?: AgentConfig;
}

interface AgentConfig {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    description: string;
  };
  spec: {
    agent: {
      name: string;
      expertise: string;
      project_context: string;
    };
    capabilities: Array<{
      name: string;
      description: string;
      project_specific: boolean;
    }>;
    // Additional OSSA v0.1.8 specifications
  };
}

export class OSSAStandardizer {
  private workspaceRoot: string;
  private projects: ProjectInfo[] = [];
  private git: SimpleGit;
  private branchPrefix: string = 'feature/0.1.8-ossa-standardization';

  constructor(workspaceRoot: string = '/Users/flux423/Sites/LLM') {
    this.workspaceRoot = workspaceRoot;
    this.git = simpleGit();
  }

  async discoverProjects(): Promise<ProjectInfo[]> {
    const spinner = ora('Discovering .agents directories...').start();
    
    try {
      // Find all .agents directories excluding __DELETE_LATER
      const agentsGlob = path.join(this.workspaceRoot, '**/.agents');
      const agentsDirs = await glob(agentsGlob, { 
        ignore: ['**/__DELETE_LATER*/**', '**/node_modules/**'] 
      });

      this.projects = await Promise.all(
        agentsDirs.map(async (agentsPath) => {
          const projectPath = path.dirname(agentsPath);
          const projectName = this.extractProjectName(projectPath);
          const projectType = this.determineProjectType(projectPath);
          
          // Get current git branch
          const projectGit = simpleGit(projectPath);
          let currentBranch = 'main';
          try {
            currentBranch = await projectGit.revparse(['--abbrev-ref', 'HEAD']);
          } catch {
            // Not a git repo or other error
          }

          // List existing agents
          const existingAgents = await this.listExistingAgents(agentsPath);

          return {
            path: projectPath,
            name: projectName,
            type: projectType,
            currentBranch: currentBranch.trim(),
            agentsDirPath: agentsPath,
            existingAgents
          };
        })
      );

      spinner.succeed(`Discovered ${this.projects.length} projects with .agents directories`);
      return this.projects;
      
    } catch (error) {
      spinner.fail('Failed to discover projects');
      throw error as Error;
    }
  }

  private extractProjectName(projectPath: string): string {
    const relativePath = path.relative(this.workspaceRoot, projectPath);
    const pathParts = relativePath.split('/');
    
    if (pathParts.includes('all_drupal_custom')) {
      return pathParts[pathParts.length - 1]; // module name
    } else if (pathParts.includes('common_npm')) {
      return pathParts[pathParts.length - 1]; // package name
    } else if (pathParts.includes('models')) {
      return pathParts[pathParts.length - 1]; // model name
    } else {
      return pathParts[pathParts.length - 1] || 'unknown';
    }
  }

  private determineProjectType(projectPath: string): ProjectInfo['type'] {
    const relativePath = path.relative(this.workspaceRoot, projectPath);
    
    if (relativePath.includes('all_drupal_custom/modules')) {
      return 'drupal-module';
    } else if (relativePath.includes('common_npm')) {
      return 'npm-package';
    } else if (relativePath.includes('models')) {
      return 'ai-model';
    } else {
      return 'platform';
    }
  }

  private async listExistingAgents(agentsPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(agentsPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
    } catch {
      return [];
    }
  }

  async standardizeAll(): Promise<void> {
    await this.discoverProjects();
    
    console.log(boxen(
      chalk.cyan.bold('🔧 OSSA v0.1.8 Agent Standardization\n') +
      chalk.white(`Processing ${this.projects.length} projects...\n\n`) +
      chalk.yellow('Standard Agent Structure:\n') +
      chalk.gray('• {project}-core-specialist/ (Primary functionality)\n') +
      chalk.gray('• {project}-integration-expert/ (Cross-system integration)\n') +
      chalk.gray('• {project}-troubleshoot-agent/ (Issue resolution)\n') +
      chalk.gray('• {project}-SPECIALIST.ossa.yml (Advanced OSSA file)'),
      { padding: 1, borderColor: 'cyan', borderStyle: 'double' }
    ));

    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with standardization?',
      default: true
    }]);

    if (!proceed) {
      console.log(chalk.yellow('Standardization cancelled.'));
      return;
    }

    // Process projects in batches
    const batches = this.createBatches();
    
    for (const [batchName, projects] of Object.entries(batches)) {
      console.log(chalk.blue.bold(`\n📦 Processing ${batchName}...`));
      await this.processBatch(projects);
    }

    console.log(chalk.green.bold('✅ All projects standardized successfully!'));
  }

  private createBatches(): Record<string, ProjectInfo[]> {
    return {
      'Critical Projects (AI Models + Core NPM)': this.projects.filter(p => 
        p.type === 'ai-model' || 
        ['agent-brain', 'agent-router', 'agent-studio', 'workflow-engine'].includes(p.name)
      ),
      'Integration Projects (Providers + Orchestration)': this.projects.filter(p =>
        p.type === 'drupal-module' && 
        (p.name.includes('provider') || p.name.includes('orchestra') || p.name.includes('workflow'))
      ),
      'Specialized Projects (Domain-specific)': this.projects.filter(p =>
        !['Critical Projects', 'Integration Projects'].some(batch => 
          this.createBatches()[batch]?.some(bp => bp.path === p.path)
        )
      )
    };
  }

  private async processBatch(projects: ProjectInfo[]): Promise<void> {
    for (const project of projects) {
      await this.standardizeProject(project);
    }
  }

  private async standardizeProject(project: ProjectInfo): Promise<void> {
    const spinner = ora(`Standardizing ${project.name}...`).start();
    
    try {
      // 1. Create feature branch
      await this.createFeatureBranch(project);
      
      // 2. Clean up existing structure
      await this.cleanupProject(project);
      
      // 3. Generate standard agent templates
      const templates = this.generateAgentTemplates(project);
      
      // 4. Create agent directories and files
      await this.createAgentStructure(project, templates);
      
      // 5. Commit changes
      await this.commitChanges(project);
      
      spinner.succeed(`${project.name} standardized`);
      
    } catch (error) {
      spinner.fail(`Failed to standardize ${project.name}`);
      console.error(chalk.red(`  Error: ${(error as Error).message}`));
    }
  }

  private async createFeatureBranch(project: ProjectInfo): Promise<void> {
    const projectGit = simpleGit(project.path);
    const branchName = `${this.branchPrefix}-${Date.now()}`;
    
    try {
      // Check if we're in a git repo
      await projectGit.status();
      
      // Create and checkout feature branch
      await projectGit.checkoutLocalBranch(branchName);
      
    } catch (error) {
      // Not a git repo or other git error - continue without branching
      console.log(chalk.yellow(`  ⚠ Git branching skipped for ${project.name}: ${(error as Error).message}`));
    }
  }

  private async cleanupProject(project: ProjectInfo): Promise<void> {
    // Move .DS_Store files to __DELETE_LATER
    const dsStoreFiles = await glob('**/.DS_Store', { 
      cwd: project.agentsDirPath,
      dot: true 
    });
    
    if (dsStoreFiles.length > 0) {
      const deleteDir = path.join(project.path, '__DELETE_LATER');
      await fs.ensureDir(deleteDir);
      
      for (const file of dsStoreFiles) {
        const fullPath = path.join(project.agentsDirPath, file);
        const targetPath = path.join(deleteDir, `${path.basename(file)}_${Date.now()}`);
        await fs.move(fullPath, targetPath).catch(() => {});
      }
    }
  }

  private generateAgentTemplates(project: ProjectInfo): StandardAgentTemplate {
    const baseMetadata = {
      apiVersion: 'open-standards-scalable-agents/v0.1.8',
      kind: 'Agent' as const,
      metadata: {
        version: '1.0.0',
        labels: {
          tier: this.determineTier(project.type),
          domain: this.determineDomain(project.name, project.type),
          purpose: this.determinePurpose(project.name, project.type),
          project: project.name,
          'ossa-enhanced': 'true'
        },
        annotations: {
          'ossa.io/conformance-level': this.determineTier(project.type),
          'ossa.io/specification-version': '0.1.8',
          'ossa.io/project-context': this.generateProjectContext(project),
          'ossa.io/integration-points': this.generateIntegrationPoints(project),
          'ossa.io/framework-support': this.generateFrameworkSupport(project.type)
        },
        description: ''
      }
    };

    return {
      core: {
        ...baseMetadata,
        metadata: {
          ...baseMetadata.metadata,
          name: `${project.name}-core-specialist`,
          description: this.generateCoreDescription(project)
        },
        spec: {
          agent: {
            name: `${this.titleCase(project.name)} Core Specialist`,
            expertise: this.generateCoreExpertise(project),
            project_context: this.generateProjectContext(project)
          },
          capabilities: this.generateCoreCapabilities(project)
        }
      },
      
      integration: {
        ...baseMetadata,
        metadata: {
          ...baseMetadata.metadata,
          name: `${project.name}-integration-expert`,
          description: this.generateIntegrationDescription(project)
        },
        spec: {
          agent: {
            name: `${this.titleCase(project.name)} Integration Expert`,
            expertise: this.generateIntegrationExpertise(project),
            project_context: this.generateProjectContext(project)
          },
          capabilities: this.generateIntegrationCapabilities(project)
        }
      },
      
      troubleshoot: {
        ...baseMetadata,
        metadata: {
          ...baseMetadata.metadata,
          name: `${project.name}-troubleshoot-agent`,
          description: this.generateTroubleshootDescription(project)
        },
        spec: {
          agent: {
            name: `${this.titleCase(project.name)} Troubleshoot Agent`,
            expertise: this.generateTroubleshootExpertise(project),
            project_context: this.generateProjectContext(project)
          },
          capabilities: this.generateTroubleshootCapabilities(project)
        }
      }
    };
  }

  private determineTier(type: ProjectInfo['type']): string {
    switch (type) {
      case 'ai-model': return 'expert';
      case 'npm-package': return 'advanced';
      case 'drupal-module': return 'governed';
      default: return 'governed';
    }
  }

  private determineDomain(name: string, type: ProjectInfo['type']): string {
    if (type === 'ai-model') return 'ai-model';
    if (type === 'drupal-module') return 'drupal-module';
    if (name.includes('agent')) return 'agent-management';
    if (name.includes('workflow')) return 'workflow-automation';
    if (name.includes('brain') || name.includes('vector')) return 'vector-database';
    return 'general-purpose';
  }

  private determinePurpose(name: string, type: ProjectInfo['type']): string {
    if (name.includes('rfp')) return 'rfp-processing';
    if (name.includes('policy') || name.includes('gov')) return 'government-policy';
    if (name.includes('studio')) return 'development-tools';
    if (name.includes('router') || name.includes('gateway')) return 'api-routing';
    return 'core-functionality';
  }

  // Helper methods for generating descriptions and capabilities...
  private generateProjectContext(project: ProjectInfo): string {
    const typeDescriptions = {
      'drupal-module': 'Drupal CMS module providing specialized functionality within the LLM platform ecosystem',
      'npm-package': 'NPM package providing reusable functionality across the LLM platform',
      'ai-model': 'AI model component specialized for domain-specific processing and intelligence',
      'platform': 'Core platform component providing foundational services'
    };
    
    return `${typeDescriptions[project.type]} - ${project.name}. Integrates with the broader LLM platform architecture to provide ${this.determinePurpose(project.name, project.type)} capabilities.`;
  }

  private generateCoreDescription(project: ProjectInfo): string {
    return `Core specialist agent for ${project.name} - handles primary functionality, ${this.determineDomain(project.name, project.type)} operations, and core business logic within the LLM platform ecosystem.`;
  }

  private generateIntegrationDescription(project: ProjectInfo): string {
    return `Integration expert for ${project.name} - manages cross-system integrations, API connections, and inter-service communication patterns within the LLM platform.`;
  }

  private generateTroubleshootDescription(project: ProjectInfo): string {
    return `Troubleshooting agent for ${project.name} - handles issue detection, diagnostic analysis, and resolution of common problems and errors.`;
  }

  private generateCoreExpertise(project: ProjectInfo): string {
    const expertiseMap = {
      'drupal-module': 'Drupal entity management, hooks, services, configuration, and module-specific functionality',
      'npm-package': 'Package API management, TypeScript/JavaScript functionality, CLI tools, and framework integration',
      'ai-model': 'Model inference, training pipelines, data processing, and AI-specific optimizations',
      'platform': 'Platform orchestration, service management, and system coordination'
    };
    
    return expertiseMap[project.type] || 'General-purpose functionality and system operations';
  }

  private generateIntegrationExpertise(project: ProjectInfo): string {
    const integrationMap = {
      'drupal-module': 'External API integration, other Drupal modules, REST/GraphQL endpoints, and third-party services',
      'npm-package': 'Framework adapters, plugin systems, cross-package communication, and external service integration',
      'ai-model': 'Platform orchestration, provider routing, model chaining, and service mesh integration',
      'platform': 'System-wide service integration, microservice coordination, and external platform connectivity'
    };
    
    return integrationMap[project.type] || 'Cross-system integration and service coordination';
  }

  private generateTroubleshootExpertise(project: ProjectInfo): string {
    const troubleshootMap = {
      'drupal-module': 'Module conflicts, database issues, cache problems, permission errors, and performance debugging',
      'npm-package': 'Dependency resolution, build failures, runtime errors, version conflicts, and TypeScript issues',
      'ai-model': 'Model performance, accuracy issues, training problems, inference failures, and resource optimization',
      'platform': 'Service failures, network issues, resource constraints, and system-wide performance problems'
    };
    
    return troubleshootMap[project.type] || 'General troubleshooting and problem resolution';
  }

  private generateCoreCapabilities(project: ProjectInfo): Array<{name: string, description: string, project_specific: boolean}> {
    const baseCapabilities = [
      { name: 'core_functionality', description: `Manage primary ${project.name} operations and business logic`, project_specific: true },
      { name: 'configuration_management', description: 'Handle project configuration and settings', project_specific: true },
      { name: 'performance_monitoring', description: 'Monitor and optimize core performance metrics', project_specific: true }
    ];

    // Add type-specific capabilities
    if (project.type === 'drupal-module') {
      baseCapabilities.push(
        { name: 'entity_operations', description: 'Manage Drupal entities and data structures', project_specific: true },
        { name: 'hook_implementation', description: 'Implement and manage Drupal hooks', project_specific: true }
      );
    } else if (project.type === 'npm-package') {
      baseCapabilities.push(
        { name: 'api_management', description: 'Manage package API and public interfaces', project_specific: true },
        { name: 'cli_operations', description: 'Handle command-line interface functionality', project_specific: true }
      );
    } else if (project.type === 'ai-model') {
      baseCapabilities.push(
        { name: 'model_inference', description: 'Execute model inference and prediction tasks', project_specific: true },
        { name: 'data_processing', description: 'Handle model input/output data processing', project_specific: true }
      );
    }

    return baseCapabilities;
  }

  private generateIntegrationCapabilities(project: ProjectInfo): Array<{name: string, description: string, project_specific: boolean}> {
    return [
      { name: 'external_api_integration', description: 'Integrate with external APIs and services', project_specific: true },
      { name: 'service_coordination', description: 'Coordinate with other platform services', project_specific: true },
      { name: 'data_synchronization', description: 'Synchronize data across integrated systems', project_specific: true },
      { name: 'authentication_handling', description: 'Manage authentication and authorization for integrations', project_specific: true }
    ];
  }

  private generateTroubleshootCapabilities(project: ProjectInfo): Array<{name: string, description: string, project_specific: boolean}> {
    return [
      { name: 'issue_detection', description: 'Detect and identify system issues and anomalies', project_specific: true },
      { name: 'diagnostic_analysis', description: 'Perform diagnostic analysis of problems', project_specific: true },
      { name: 'error_resolution', description: 'Resolve common errors and system issues', project_specific: true },
      { name: 'health_monitoring', description: 'Monitor system health and performance indicators', project_specific: true },
      { name: 'log_analysis', description: 'Analyze logs for troubleshooting insights', project_specific: true }
    ];
  }

  private generateIntegrationPoints(project: ProjectInfo): string {
    const integrationMap = {
      'drupal-module': 'Drupal core, other custom modules, REST API, database, cache systems',
      'npm-package': 'Other NPM packages, CLI tools, build systems, external APIs, framework integrations',
      'ai-model': 'LLM platform orchestrator, model providers, vector databases, API gateway',
      'platform': 'All system components, external services, infrastructure, monitoring systems'
    };
    
    return integrationMap[project.type] || 'Platform services, external APIs, system components';
  }

  private generateFrameworkSupport(type: ProjectInfo['type']): string {
    const frameworkMap = {
      'drupal-module': 'drupal,symfony,doctrine',
      'npm-package': 'typescript,nodejs,npm',
      'ai-model': 'python,pytorch,tensorflow,onnx',
      'platform': 'docker,kubernetes,nodejs,python'
    };
    
    return frameworkMap[type] || 'standard';
  }

  private async createAgentStructure(project: ProjectInfo, templates: StandardAgentTemplate): Promise<void> {
    // Create standard agent directories
    for (const [agentType, config] of Object.entries(templates)) {
      const agentDir = path.join(project.agentsDirPath, config.metadata.name);
      await fs.ensureDir(agentDir);
      await fs.ensureDir(path.join(agentDir, 'config'));
      
      // Write agent.yml
      await fs.writeFile(
        path.join(agentDir, 'agent.yml'),
        yaml.stringify(config, { indent: 2 })
      );
      
      // Write README.md
      await fs.writeFile(
        path.join(agentDir, 'README.md'),
        this.generateAgentReadme(config, agentType, project)
      );
    }
    
    // Create advanced OSSA file
    await fs.writeFile(
      path.join(project.agentsDirPath, `${project.name}-SPECIALIST.ossa.yml`),
      this.generateAdvancedOSSAFile(project, templates.core)
    );
  }

  private generateAgentReadme(config: AgentConfig, type: string, project: ProjectInfo): string {
    return `# ${config.spec.agent.name}

## Overview
${config.metadata.description}

## Capabilities
${config.spec.capabilities.map(cap => `- **${cap.name}**: ${cap.description}`).join('\n')}

## Project Context
${config.spec.agent.project_context}

## Integration Points
${config.metadata.annotations['ossa.io/integration-points']}

## Supported Frameworks
${config.metadata.annotations['ossa.io/framework-support']}

---
Generated by OSSA v0.1.8 Standardization System
`;
  }

  private generateAdvancedOSSAFile(project: ProjectInfo, coreConfig: AgentConfig): string {
    return `# ==============================================================================
# OSSA v0.1.8 ${this.determineTier(project.type).toUpperCase()} Level Agent - ${this.titleCase(project.name)} Specialist
# Open Standards for Scalable Agents - ${this.titleCase(this.determineTier(project.type))} Conformance
# ==============================================================================
# Purpose: ${this.generateProjectContext(project)}
# Use Case: ${this.determinePurpose(project.name, project.type)} with full platform integration
# Conformance: ${this.titleCase(this.determineTier(project.type))} Level (enterprise capabilities with AI intelligence)
# ==============================================================================

${yaml.stringify(coreConfig, { indent: 2 })}

# ==============================================================================
# Advanced Configuration Extensions
# ==============================================================================
extended_capabilities:
  monitoring:
    metrics_enabled: true
    health_checks: true
    performance_tracking: true
    
  security:
    authentication_required: true
    rbac_enabled: true
    audit_logging: true
    
  scalability:
    horizontal_scaling: true
    load_balancing: true
    caching_enabled: true

# ==============================================================================
# Platform Integration Specifications
# ==============================================================================
platform_integration:
  llm_gateway: true
  vector_hub: true
  orchestration_engine: true
  monitoring_dashboard: true
`;
  }

  private async commitChanges(project: ProjectInfo): Promise<void> {
    const projectGit = simpleGit(project.path);
    
    try {
      // Stage changes
      await projectGit.add('.agents/*');
      
      // Commit
      await projectGit.commit(`feat: OSSA v0.1.8 standardization for ${project.name}

- Implement standard agent structure (core, integration, troubleshoot)
- Add OSSA v0.1.8 compliance with advanced capabilities
- Generate project-specific agent configurations
- Clean up system files and maintain standards

🤖 Generated with OSSA Standardization System v0.1.8

Co-Authored-By: OSSA-CLI <noreply@bluefly.ai>`);
      
    } catch (error) {
      // Commit failed or not a git repo - continue
      console.log(chalk.yellow(`  ⚠ Git commit skipped for ${project.name}: ${(error as Error).message}`));
    }
  }

  private titleCase(str: string): string {
    return str.split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const program = new Command();
  
  program
    .name('ossa-standardize')
    .description('OSSA v0.1.8 Agent Standardization System')
    .version('0.1.8');

  program
    .command('all')
    .description('Standardize all 47 projects with .agents directories')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .action(async (options) => {
      const standardizer = new OSSAStandardizer(options.workspace);
      await standardizer.standardizeAll();
    });

  program
    .command('discover')
    .description('Discover all projects with .agents directories')
    .option('-w, --workspace <path>', 'Workspace root path', '/Users/flux423/Sites/LLM')
    .action(async (options) => {
      const standardizer = new OSSAStandardizer(options.workspace);
      const projects = await standardizer.discoverProjects();
      
      console.table(projects.map(p => ({
        Name: p.name,
        Type: p.type,
        Branch: p.currentBranch,
        'Existing Agents': p.existingAgents.length,
        Path: path.relative(options.workspace, p.path)
      })));
    });

  program.parse();
}