#!/usr/bin/env node

/**
 * OSSA CLI Audit Command
 * OpenAPI-based agent auditing and fixing
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { table } from 'table';
import chalk from 'chalk';

// Repository paths to audit
const COMMON_NPM_REPOS = [
  'agent-brain',
  'agent-chat',
  'agent-docker',
  'agent-mesh',
  'agent-ops',
  'agent-protocol',
  'agent-router',
  'agent-studio',
  'agent-tracer',
  'agentic-flows',
  'compliance-engine',
  'doc-engine',
  'foundation-bridge',
  'rfp-automation',
  'studio-ui',
  'workflow-engine'
];

interface AgentAudit {
  path: string;
  name: string;
  category: string;
  exists: boolean;
  files: {
    hasAgentYml: boolean;
    hasOpenApiYaml: boolean;
    hasReadme: boolean;
  };
  issues: ComplianceIssue[];
  fixable: boolean;
}

interface ComplianceIssue {
  type: 'missing_file' | 'invalid_yaml' | 'wrong_category' | 'missing_field' | 'invalid_openapi' | 'no_description';
  severity: 'error' | 'warning' | 'info';
  file: string;
  message: string;
  fixable: boolean;
}

interface AuditReport {
  timestamp: Date;
  repositories: RepositoryAudit[];
  summary: {
    totalRepositories: number;
    totalAgents: number;
    compliantAgents: number;
    nonCompliantAgents: number;
    missingFiles: number;
    invalidConfigurations: number;
  };
}

interface RepositoryAudit {
  path: string;
  name: string;
  hasAgentsDirectory: boolean;
  agents: AgentAudit[];
  compliance: {
    score: number;
    compliant: boolean;
    issues: ComplianceIssue[];
  };
}

export class AuditCommand {
  private basePath = '/Users/flux423/Sites/LLM/common_npm';

  /**
   * Create the audit command for the CLI
   */
  createCommand(): Command {
    const command = new Command('audit');

    command
      .description('Audit agents for OSSA compliance')
      .option('-r, --repo <repos...>', 'Specific repositories to audit')
      .option('-f, --fix', 'Automatically fix issues')
      .option('-d, --deep', 'Deep validation of files', true)
      .option('-o, --output <file>', 'Output report to file')
      .action(async (options) => {
        await this.execute(options);
      });

    return command;
  }

  /**
   * Execute the audit command
   */
  async execute(options: any): Promise<void> {
    console.log(chalk.blue('🔍 OSSA Agent Audit Starting...\n'));

    // Determine which repos to audit
    const reposToAudit = options.repo || COMMON_NPM_REPOS;
    const repositories = reposToAudit.map((r: string) =>
      r.startsWith('/') ? r : path.join(this.basePath, r)
    );

    // Perform audit
    const report = await this.auditRepositories(repositories, options.deep);

    // Display results
    this.displayReport(report);

    // Fix issues if requested
    if (options.fix) {
      console.log(chalk.yellow('\n🔧 Fixing issues...\n'));
      await this.fixAllIssues(report);
    }

    // Save report if requested
    if (options.output) {
      await fs.writeFile(options.output, JSON.stringify(report, null, 2));
      console.log(chalk.green(`\n📄 Report saved to ${options.output}`));
    }
  }

  /**
   * Audit multiple repositories
   */
  async auditRepositories(repositories: string[], deep: boolean = true): Promise<AuditReport> {
    const report: AuditReport = {
      timestamp: new Date(),
      repositories: [],
      summary: {
        totalRepositories: 0,
        totalAgents: 0,
        compliantAgents: 0,
        nonCompliantAgents: 0,
        missingFiles: 0,
        invalidConfigurations: 0
      }
    };

    for (const repoPath of repositories) {
      const repoAudit = await this.auditRepository(repoPath, deep);
      report.repositories.push(repoAudit);

      // Update summary
      report.summary.totalRepositories++;
      report.summary.totalAgents += repoAudit.agents.length;

      for (const agent of repoAudit.agents) {
        if (agent.issues.length === 0) {
          report.summary.compliantAgents++;
        } else {
          report.summary.nonCompliantAgents++;

          for (const issue of agent.issues) {
            if (issue.type === 'missing_file') {
              report.summary.missingFiles++;
            } else if (issue.type === 'invalid_yaml' || issue.type === 'invalid_openapi') {
              report.summary.invalidConfigurations++;
            }
          }
        }
      }
    }

    return report;
  }

  /**
   * Audit single repository
   */
  async auditRepository(repoPath: string, deep: boolean): Promise<RepositoryAudit> {
    const repoName = path.basename(repoPath);
    const agentsDir = path.join(repoPath, '.agents');

    const audit: RepositoryAudit = {
      path: repoPath,
      name: repoName,
      hasAgentsDirectory: false,
      agents: [],
      compliance: {
        score: 100,
        compliant: true,
        issues: []
      }
    };

    try {
      const stat = await fs.stat(agentsDir);
      audit.hasAgentsDirectory = stat.isDirectory();
    } catch {
      audit.compliance.compliant = false;
      audit.compliance.score = 0;
      audit.compliance.issues.push({
        type: 'missing_file',
        severity: 'error',
        file: '.agents',
        message: 'No .agents directory found',
        fixable: true
      });
      return audit;
    }

    // Audit each category
    const categories = ['critics', 'governors', 'integrators', 'judges',
                       'monitors', 'orchestrators', 'trainers', 'voice', 'workers'];

    for (const category of categories) {
      const categoryPath = path.join(agentsDir, category);

      try {
        const agents = await fs.readdir(categoryPath);

        for (const agentName of agents) {
          const agentPath = path.join(categoryPath, agentName);
          const stat = await fs.stat(agentPath);

          if (stat.isDirectory()) {
            const agentAudit = await this.auditAgent(agentPath, agentName, category, deep);
            audit.agents.push(agentAudit);

            if (agentAudit.issues.length > 0) {
              audit.compliance.compliant = false;
              audit.compliance.score -= (agentAudit.issues.length * 5);
            }
          }
        }
      } catch {
        // Category directory doesn't exist, which is fine
      }
    }

    audit.compliance.score = Math.max(0, audit.compliance.score);
    return audit;
  }

  /**
   * Audit individual agent
   */
  async auditAgent(agentPath: string, name: string, category: string, deep: boolean): Promise<AgentAudit> {
    const audit: AgentAudit = {
      path: agentPath,
      name,
      category,
      exists: true,
      files: {
        hasAgentYml: false,
        hasOpenApiYaml: false,
        hasReadme: false
      },
      issues: [],
      fixable: true
    };

    // Check for required files
    const agentYmlPath = path.join(agentPath, 'agent.yml');
    const openApiPath = path.join(agentPath, 'openapi.yaml');
    const openApiAltPath = path.join(agentPath, 'openapi.yml');
    const readmePath = path.join(agentPath, 'README.md');

    // Check agent.yml
    try {
      await fs.access(agentYmlPath);
      audit.files.hasAgentYml = true;

      if (deep) {
        // Validate YAML content
        const content = await fs.readFile(agentYmlPath, 'utf8');
        const config = yaml.load(content) as any;

        if (!config.name) {
          audit.issues.push({
            type: 'missing_field',
            severity: 'error',
            file: 'agent.yml',
            message: 'Missing required field: name',
            fixable: true
          });
        }

        if (!config.description) {
          audit.issues.push({
            type: 'missing_field',
            severity: 'warning',
            file: 'agent.yml',
            message: 'Missing field: description',
            fixable: true
          });
        }

        if (config.category !== category) {
          audit.issues.push({
            type: 'wrong_category',
            severity: 'error',
            file: 'agent.yml',
            message: `Category mismatch: expected '${category}', found '${config.category}'`,
            fixable: true
          });
        }
      }
    } catch {
      audit.issues.push({
        type: 'missing_file',
        severity: 'error',
        file: 'agent.yml',
        message: 'Missing required file: agent.yml',
        fixable: true
      });
    }

    // Check OpenAPI spec
    try {
      await fs.access(openApiPath);
      audit.files.hasOpenApiYaml = true;
    } catch {
      try {
        await fs.access(openApiAltPath);
        audit.files.hasOpenApiYaml = true;
      } catch {
        audit.issues.push({
          type: 'missing_file',
          severity: 'error',
          file: 'openapi.yaml',
          message: 'Missing required file: openapi.yaml',
          fixable: true
        });
      }
    }

    // Check README
    try {
      await fs.access(readmePath);
      audit.files.hasReadme = true;
    } catch {
      audit.issues.push({
        type: 'missing_file',
        severity: 'warning',
        file: 'README.md',
        message: 'Missing file: README.md',
        fixable: true
      });
    }

    return audit;
  }

  /**
   * Fix all issues found in audit
   */
  async fixAllIssues(report: AuditReport): Promise<void> {
    let fixedCount = 0;
    let failedCount = 0;

    for (const repo of report.repositories) {
      console.log(chalk.cyan(`\nFixing ${repo.name}...`));

      // Create .agents directory if missing
      if (!repo.hasAgentsDirectory) {
        const agentsDir = path.join(repo.path, '.agents');
        await fs.mkdir(agentsDir, { recursive: true });

        // Create all OSSA categories
        const categories = ['critics', 'governors', 'integrators', 'judges',
                          'monitors', 'orchestrators', 'trainers', 'voice', 'workers'];
        for (const cat of categories) {
          await fs.mkdir(path.join(agentsDir, cat), { recursive: true });
        }
        console.log(chalk.green(`  ✓ Created .agents directory structure`));
      }

      // Fix each agent
      for (const agent of repo.agents) {
        if (agent.issues.length > 0) {
          const fixed = await this.fixAgent(agent);
          if (fixed) {
            fixedCount++;
            console.log(chalk.green(`  ✓ Fixed ${agent.name}`));
          } else {
            failedCount++;
            console.log(chalk.red(`  ✗ Failed to fix ${agent.name}`));
          }
        }
      }
    }

    console.log(chalk.blue(`\n📊 Fix Summary:`));
    console.log(chalk.green(`  ✓ Fixed: ${fixedCount} agents`));
    if (failedCount > 0) {
      console.log(chalk.red(`  ✗ Failed: ${failedCount} agents`));
    }
  }

  /**
   * Fix individual agent
   */
  async fixAgent(agent: AgentAudit): Promise<boolean> {
    try {
      for (const issue of agent.issues) {
        if (issue.type === 'missing_file') {
          await this.createMissingFile(agent.path, agent.name, agent.category, issue.file);
        } else if (issue.type === 'wrong_category') {
          await this.fixCategory(agent.path, agent.category);
        } else if (issue.type === 'missing_field') {
          await this.addMissingField(agent.path, issue.file, agent.name, agent.category);
        }
      }
      return true;
    } catch (error) {
      console.error(`Error fixing ${agent.name}:`, error);
      return false;
    }
  }

  /**
   * Create missing file
   */
  async createMissingFile(agentPath: string, agentName: string, category: string, fileName: string): Promise<void> {
    const filePath = path.join(agentPath, fileName);

    if (fileName === 'agent.yml') {
      const content = {
        name: agentName,
        category: category,
        type: this.getCategoryType(category),
        description: `${agentName} agent in ${category} category`,
        version: '0.1.0',
        capabilities: [],
        domains: [],
        integrations: [],
        requirements: {
          runtime: 'node:20',
          memory: '512MB',
          gpu: false
        }
      };
      await fs.writeFile(filePath, yaml.dump(content, { indent: 2 }));
    } else if (fileName === 'openapi.yaml') {
      const spec = {
        openapi: '3.1.0',
        info: {
          title: `${agentName} Agent API`,
          version: '0.1.0',
          description: `API for ${agentName} agent in ${category} category`
        },
        servers: [
          {
            url: 'http://localhost:3000/api/v1',
            description: 'Local development'
          }
        ],
        paths: {
          '/health': {
            get: {
              summary: 'Health check',
              operationId: 'getHealth',
              responses: {
                '200': {
                  description: 'Healthy',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', example: 'healthy' },
                          agent: { type: 'string', example: agentName }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/execute': {
            post: {
              summary: 'Execute agent action',
              operationId: 'executeAction',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        action: { type: 'string' },
                        params: { type: 'object' }
                      },
                      required: ['action']
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean' },
                          result: { type: 'object' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/capabilities': {
            get: {
              summary: 'Get agent capabilities',
              operationId: 'getCapabilities',
              responses: {
                '200': {
                  description: 'Agent capabilities',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          capabilities: {
                            type: 'array',
                            items: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      await fs.writeFile(filePath, yaml.dump(spec, { indent: 2 }));
    } else if (fileName === 'README.md') {
      const readme = `# ${agentName} Agent

## Description

${agentName} is an agent in the ${category} category following OSSA taxonomy standards.

## Category

${category}

## Capabilities

- TBD

## API Endpoints

- \`GET /health\` - Health check
- \`POST /execute\` - Execute agent action
- \`GET /capabilities\` - Get agent capabilities

## Usage

\`\`\`typescript
const agent = new ${this.toPascalCase(agentName)}Agent();
const result = await agent.execute({
  action: 'process',
  params: {}
});
\`\`\`

## Requirements

- Runtime: Node.js 20+
- Memory: 512MB minimum

## License

MIT
`;
      await fs.writeFile(filePath, readme);
    }
  }

  /**
   * Fix category in agent.yml
   */
  async fixCategory(agentPath: string, correctCategory: string): Promise<void> {
    const configPath = path.join(agentPath, 'agent.yml');
    const content = await fs.readFile(configPath, 'utf8');
    const config = yaml.load(content) as any;

    config.category = correctCategory;
    config.type = this.getCategoryType(correctCategory);

    await fs.writeFile(configPath, yaml.dump(config, { indent: 2 }));
  }

  /**
   * Add missing field to agent.yml
   */
  async addMissingField(agentPath: string, fileName: string, agentName: string, category: string): Promise<void> {
    if (fileName !== 'agent.yml') return;

    const configPath = path.join(agentPath, fileName);
    const content = await fs.readFile(configPath, 'utf8');
    const config = yaml.load(content) as any;

    if (!config.name) config.name = agentName;
    if (!config.description) config.description = `${agentName} agent in ${category} category`;
    if (!config.version) config.version = '0.1.0';
    if (!config.category) config.category = category;
    if (!config.type) config.type = this.getCategoryType(category);

    await fs.writeFile(configPath, yaml.dump(config, { indent: 2 }));
  }

  /**
   * Display audit report
   */
  displayReport(report: AuditReport): void {
    console.log(chalk.blue('\n📊 Audit Summary:'));
    console.log(`  Total Repositories: ${report.summary.totalRepositories}`);
    console.log(`  Total Agents: ${report.summary.totalAgents}`);
    console.log(chalk.green(`  Compliant Agents: ${report.summary.compliantAgents}`));
    console.log(chalk.red(`  Non-Compliant Agents: ${report.summary.nonCompliantAgents}`));
    console.log(chalk.yellow(`  Missing Files: ${report.summary.missingFiles}`));
    console.log(chalk.yellow(`  Invalid Configurations: ${report.summary.invalidConfigurations}`));

    // Show details for non-compliant repos
    console.log('\n📋 Repository Details:\n');

    const tableData = [
      ['Repository', 'Agents', 'Compliant', 'Issues', 'Score']
    ];

    for (const repo of report.repositories) {
      const compliantCount = repo.agents.filter(a => a.issues.length === 0).length;
      const issueCount = repo.agents.reduce((sum, a) => sum + a.issues.length, 0);

      tableData.push([
        repo.name,
        repo.agents.length.toString(),
        `${compliantCount}/${repo.agents.length}`,
        issueCount.toString(),
        `${repo.compliance.score}%`
      ]);
    }

    console.log(table(tableData));

    // Show non-compliant agents
    const nonCompliantAgents = report.repositories.flatMap(r =>
      r.agents.filter(a => a.issues.length > 0)
    );

    if (nonCompliantAgents.length > 0) {
      console.log(chalk.yellow('\n⚠️  Non-Compliant Agents:\n'));

      for (const agent of nonCompliantAgents.slice(0, 10)) {
        console.log(`  ${chalk.red('✗')} ${agent.name} (${agent.category})`);
        for (const issue of agent.issues) {
          console.log(`    - ${issue.message}`);
        }
      }

      if (nonCompliantAgents.length > 10) {
        console.log(`\n  ... and ${nonCompliantAgents.length - 10} more`);
      }
    } else {
      console.log(chalk.green('\n✅ All agents are OSSA compliant!'));
    }
  }

  /**
   * Get category type from category name
   */
  private getCategoryType(category: string): string {
    const typeMap: Record<string, string> = {
      critics: 'critic',
      governors: 'governor',
      integrators: 'integrator',
      judges: 'judge',
      monitors: 'monitor',
      orchestrators: 'orchestrator',
      trainers: 'trainer',
      voice: 'voice',
      workers: 'worker'
    };
    return typeMap[category] || 'worker';
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }
}

// Export for CLI
export default function createAuditCommand(): Command {
  const audit = new AuditCommand();
  return audit.createCommand();
}