/**
 * OSSA Management Service
 * API-first implementation for OSSA taxonomy management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { OpenAPIV3 } from 'openapi-types';

// Types from OpenAPI spec
export enum TaxonomyCategory {
  CRITICS = 'critics',
  GOVERNORS = 'governors',
  INTEGRATORS = 'integrators',
  JUDGES = 'judges',
  MONITORS = 'monitors',
  ORCHESTRATORS = 'orchestrators',
  TRAINERS = 'trainers',
  VOICE = 'voice',
  WORKERS = 'workers'
}

export interface Repository {
  id: string;
  path: string;
  name: string;
  type: 'npm' | 'model' | 'component' | 'other';
  hasAgentsDirectory: boolean;
  agentCount: number;
  lastScanned: Date;
}

export interface Agent {
  id: string;
  name: string;
  category: TaxonomyCategory;
  type: string;
  description: string;
  version: string;
  repository: string;
  path: string;
}

export interface AgentDetail extends Agent {
  capabilities: string[];
  domains: string[];
  integrations: string[];
  requirements: {
    runtime?: string;
    memory?: string;
    gpu?: boolean;
  };
  validation: ValidationResult;
  openApiSpec?: OpenAPIV3.Document;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface MigrationChange {
  type: 'move' | 'rename' | 'delete' | 'create';
  source: string;
  target: string;
  reason: string;
  agentName?: string;
}

export interface ComplianceReport {
  timestamp: Date;
  repositories: Array<{
    path: string;
    compliant: boolean;
    score: number;
    agents: Array<{
      name: string;
      valid: boolean;
      errors: string[];
    }>;
  }>;
  summary: {
    totalRepositories: number;
    compliantRepositories: number;
    totalAgents: number;
    validAgents: number;
    averageScore: number;
  };
}

/**
 * OSSA Management Service - CRUD Operations
 */
export class OSSAManagementService {
  private repositories: Map<string, Repository> = new Map();
  private agents: Map<string, Agent> = new Map();

  constructor(private basePath: string = '/Users/flux423/Sites/LLM') {}

  // ============= REPOSITORY OPERATIONS =============

  /**
   * List all managed repositories
   */
  async listRepositories(hasAgents?: boolean): Promise<Repository[]> {
    const repos = Array.from(this.repositories.values());

    if (hasAgents !== undefined) {
      return repos.filter(r => r.hasAgentsDirectory === hasAgents);
    }

    return repos;
  }

  /**
   * Register a new repository
   */
  async registerRepository(registration: {
    path: string;
    name?: string;
    type?: 'npm' | 'model' | 'component' | 'other';
    autoScan?: boolean;
  }): Promise<Repository> {
    const id = uuidv4();
    const agentsDir = path.join(registration.path, '.agents');
    const hasAgentsDirectory = await this.directoryExists(agentsDir);

    const repository: Repository = {
      id,
      path: registration.path,
      name: registration.name || path.basename(registration.path),
      type: registration.type || 'other',
      hasAgentsDirectory,
      agentCount: 0,
      lastScanned: new Date()
    };

    if (registration.autoScan !== false && hasAgentsDirectory) {
      repository.agentCount = await this.countAgents(agentsDir);
    }

    this.repositories.set(id, repository);
    return repository;
  }

  /**
   * Get repository details
   */
  async getRepository(repoId: string): Promise<Repository | null> {
    return this.repositories.get(repoId) || null;
  }

  /**
   * Update repository configuration
   */
  async updateRepository(repoId: string, update: Partial<Repository>): Promise<Repository | null> {
    const repo = this.repositories.get(repoId);
    if (!repo) return null;

    const updated = { ...repo, ...update };
    this.repositories.set(repoId, updated);
    return updated;
  }

  /**
   * Delete repository
   */
  async deleteRepository(repoId: string): Promise<boolean> {
    return this.repositories.delete(repoId);
  }

  // ============= AGENT OPERATIONS =============

  /**
   * List agents in repository
   */
  async listAgents(repoId: string, category?: TaxonomyCategory): Promise<Agent[]> {
    const repo = this.repositories.get(repoId);
    if (!repo) return [];

    const agentsDir = path.join(repo.path, '.agents');
    const agents: Agent[] = [];

    for (const cat of Object.values(TaxonomyCategory)) {
      if (category && cat !== category) continue;

      const categoryDir = path.join(agentsDir, cat);
      if (!await this.directoryExists(categoryDir)) continue;

      const agentDirs = await fs.readdir(categoryDir);
      for (const agentName of agentDirs) {
        const agentPath = path.join(categoryDir, agentName);
        const stat = await fs.stat(agentPath);

        if (stat.isDirectory()) {
          const agent = await this.loadAgent(repo, cat, agentName);
          if (agent) agents.push(agent);
        }
      }
    }

    return agents;
  }

  /**
   * Create new agent
   */
  async createAgent(repoId: string, agentData: {
    name: string;
    category: TaxonomyCategory;
    description?: string;
    version?: string;
    capabilities?: string[];
    domains?: string[];
    template?: 'basic' | 'advanced' | 'ml' | 'integration';
  }): Promise<Agent> {
    const repo = this.repositories.get(repoId);
    if (!repo) throw new Error('Repository not found');

    const agentPath = path.join(repo.path, '.agents', agentData.category, agentData.name);

    // Create agent directory
    await fs.mkdir(agentPath, { recursive: true });

    // Create agent.yml
    const agentConfig = {
      name: agentData.name,
      category: agentData.category,
      type: this.getCategoryType(agentData.category),
      description: agentData.description || '',
      version: agentData.version || '0.1.0',
      capabilities: agentData.capabilities || [],
      domains: agentData.domains || [],
      integrations: [],
      requirements: {
        runtime: 'node:20',
        memory: '512MB',
        gpu: false
      }
    };

    await fs.writeFile(
      path.join(agentPath, 'agent.yml'),
      yaml.dump(agentConfig, { indent: 2 })
    );

    // Create OpenAPI spec
    const openApiSpec = this.generateOpenApiTemplate(agentData.name, agentData.category);
    await fs.writeFile(
      path.join(agentPath, 'openapi.yaml'),
      yaml.dump(openApiSpec, { indent: 2 })
    );

    // Create README
    const readme = this.generateReadmeTemplate(agentData.name, agentData.category, agentData.description);
    await fs.writeFile(path.join(agentPath, 'README.md'), readme);

    const agent: Agent = {
      id: uuidv4(),
      name: agentData.name,
      category: agentData.category,
      type: this.getCategoryType(agentData.category),
      description: agentData.description || '',
      version: agentData.version || '0.1.0',
      repository: repoId,
      path: agentPath
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  /**
   * Get agent details
   */
  async getAgent(repoId: string, agentId: string): Promise<AgentDetail | null> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.repository !== repoId) return null;

    const configPath = path.join(agent.path, 'agent.yml');
    const config = yaml.load(await fs.readFile(configPath, 'utf8')) as any;

    const agentDetail: AgentDetail = {
      ...agent,
      capabilities: config.capabilities || [],
      domains: config.domains || [],
      integrations: config.integrations || [],
      requirements: config.requirements || {},
      validation: await this.validateAgent(agent.path)
    };

    // Load OpenAPI spec if exists
    const openApiPath = path.join(agent.path, 'openapi.yaml');
    if (await this.fileExists(openApiPath)) {
      agentDetail.openApiSpec = yaml.load(await fs.readFile(openApiPath, 'utf8')) as OpenAPIV3.Document;
    }

    return agentDetail;
  }

  /**
   * Update agent
   */
  async updateAgent(repoId: string, agentId: string, update: Partial<Agent>): Promise<Agent | null> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.repository !== repoId) return null;

    // Update agent.yml
    const configPath = path.join(agent.path, 'agent.yml');
    const config = yaml.load(await fs.readFile(configPath, 'utf8')) as any;

    if (update.description) config.description = update.description;
    if (update.version) config.version = update.version;

    await fs.writeFile(configPath, yaml.dump(config, { indent: 2 }));

    // Update in memory
    const updated = { ...agent, ...update };
    this.agents.set(agentId, updated);

    return updated;
  }

  /**
   * Delete agent
   */
  async deleteAgent(repoId: string, agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.repository !== repoId) return false;

    // Backup before deletion
    const backupDir = `/tmp/ossa-deleted-agents/${new Date().toISOString()}`;
    await fs.mkdir(backupDir, { recursive: true });
    await this.copyDirectory(agent.path, path.join(backupDir, agent.name));

    // Delete agent directory
    await fs.rm(agent.path, { recursive: true });

    return this.agents.delete(agentId);
  }

  /**
   * Move agent to different category
   */
  async moveAgent(repoId: string, agentId: string, targetCategory: TaxonomyCategory): Promise<Agent | null> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.repository !== repoId) return null;

    const repo = this.repositories.get(repoId);
    if (!repo) return null;

    const newPath = path.join(repo.path, '.agents', targetCategory, agent.name);

    // Create target directory
    await fs.mkdir(path.dirname(newPath), { recursive: true });

    // Move agent directory
    await fs.rename(agent.path, newPath);

    // Update agent.yml
    const configPath = path.join(newPath, 'agent.yml');
    const config = yaml.load(await fs.readFile(configPath, 'utf8')) as any;
    config.category = targetCategory;
    config.type = this.getCategoryType(targetCategory);
    await fs.writeFile(configPath, yaml.dump(config, { indent: 2 }));

    // Update agent record
    agent.category = targetCategory;
    agent.path = newPath;
    agent.type = this.getCategoryType(targetCategory);
    this.agents.set(agentId, agent);

    return agent;
  }

  // ============= MIGRATION OPERATIONS =============

  /**
   * Analyze repositories for migration needs
   */
  async analyzeMigration(repositoryPaths: string[]): Promise<any> {
    const analysis = {
      repositories: [] as any[]
    };

    for (const repoPath of repositoryPaths) {
      const agentsDir = path.join(repoPath, '.agents');
      if (!await this.directoryExists(agentsDir)) continue;

      const currentStructure = await this.analyzeStructure(agentsDir);
      const proposedChanges = this.calculateMigrationChanges(currentStructure);

      analysis.repositories.push({
        path: repoPath,
        currentStructure,
        proposedChanges,
        estimatedImpact: this.calculateImpact(proposedChanges)
      });
    }

    return analysis;
  }

  /**
   * Execute OSSA taxonomy migration
   */
  async executeMigration(plan: {
    repositories: Array<{
      path: string;
      changes: MigrationChange[];
    }>;
    createBackup?: boolean;
    dryRun?: boolean;
    updateConfigs?: boolean;
  }): Promise<any> {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      status: 'running',
      startedAt: new Date(),
      progress: 0
    };

    // Process each repository
    for (const repo of plan.repositories) {
      if (plan.createBackup !== false) {
        await this.backupRepository(repo.path);
      }

      if (!plan.dryRun) {
        for (const change of repo.changes) {
          await this.applyMigrationChange(repo.path, change);
        }
      }
    }

    job.status = 'completed';
    return job;
  }

  // ============= VALIDATION OPERATIONS =============

  /**
   * Run OSSA compliance check
   */
  async checkCompliance(repositories: string[], strict: boolean = false): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      timestamp: new Date(),
      repositories: [],
      summary: {
        totalRepositories: 0,
        compliantRepositories: 0,
        totalAgents: 0,
        validAgents: 0,
        averageScore: 0
      }
    };

    let totalScore = 0;

    for (const repoPath of repositories) {
      const agentsDir = path.join(repoPath, '.agents');
      if (!await this.directoryExists(agentsDir)) continue;

      const repoResult = {
        path: repoPath,
        compliant: true,
        score: 100,
        agents: [] as any[]
      };

      // Check each category
      for (const category of Object.values(TaxonomyCategory)) {
        const categoryDir = path.join(agentsDir, category);
        if (!await this.directoryExists(categoryDir)) {
          if (strict) {
            repoResult.compliant = false;
            repoResult.score -= 10;
          }
          continue;
        }

        const agents = await fs.readdir(categoryDir);
        for (const agentName of agents) {
          const agentPath = path.join(categoryDir, agentName);
          const validation = await this.validateAgent(agentPath);

          repoResult.agents.push({
            name: agentName,
            valid: validation.valid,
            errors: validation.errors
          });

          if (!validation.valid) {
            repoResult.compliant = false;
          }

          report.summary.totalAgents++;
          if (validation.valid) {
            report.summary.validAgents++;
          }
        }
      }

      report.repositories.push(repoResult);
      report.summary.totalRepositories++;
      if (repoResult.compliant) {
        report.summary.compliantRepositories++;
      }
      totalScore += repoResult.score;
    }

    report.summary.averageScore = totalScore / report.summary.totalRepositories;

    return report;
  }

  // ============= HELPER METHODS =============

  private async directoryExists(path: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async countAgents(agentsDir: string): Promise<number> {
    let count = 0;
    for (const category of Object.values(TaxonomyCategory)) {
      const categoryDir = path.join(agentsDir, category);
      if (await this.directoryExists(categoryDir)) {
        const agents = await fs.readdir(categoryDir);
        count += agents.filter(a => !a.startsWith('.')).length;
      }
    }
    return count;
  }

  private getCategoryType(category: TaxonomyCategory): string {
    const typeMap: Record<TaxonomyCategory, string> = {
      [TaxonomyCategory.CRITICS]: 'critic',
      [TaxonomyCategory.GOVERNORS]: 'governor',
      [TaxonomyCategory.INTEGRATORS]: 'integrator',
      [TaxonomyCategory.JUDGES]: 'judge',
      [TaxonomyCategory.MONITORS]: 'monitor',
      [TaxonomyCategory.ORCHESTRATORS]: 'orchestrator',
      [TaxonomyCategory.TRAINERS]: 'trainer',
      [TaxonomyCategory.VOICE]: 'voice',
      [TaxonomyCategory.WORKERS]: 'worker'
    };
    return typeMap[category] || 'worker';
  }

  private async loadAgent(repo: Repository, category: TaxonomyCategory, agentName: string): Promise<Agent | null> {
    const agentPath = path.join(repo.path, '.agents', category, agentName);
    const configPath = path.join(agentPath, 'agent.yml');

    if (!await this.fileExists(configPath)) return null;

    try {
      const config = yaml.load(await fs.readFile(configPath, 'utf8')) as any;

      return {
        id: uuidv4(),
        name: agentName,
        category,
        type: config.type || this.getCategoryType(category),
        description: config.description || '',
        version: config.version || '0.1.0',
        repository: repo.id,
        path: agentPath
      };
    } catch {
      return null;
    }
  }

  private async validateAgent(agentPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      score: 100,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check required files
    const requiredFiles = ['agent.yml', 'openapi.yaml', 'README.md'];
    for (const file of requiredFiles) {
      const filePath = path.join(agentPath, file);
      const altPath = filePath.replace('.yaml', '.yml');

      if (!await this.fileExists(filePath) && !await this.fileExists(altPath)) {
        result.errors.push(`Missing required file: ${file}`);
        result.valid = false;
        result.score -= 20;
      }
    }

    return result;
  }

  private generateOpenApiTemplate(name: string, category: TaxonomyCategory): any {
    return {
      openapi: '3.1.0',
      info: {
        title: `${name} Agent API`,
        version: '0.1.0',
        description: `Agent in ${category} category`
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
            responses: {
              200: {
                description: 'Healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' }
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
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object'
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'Success'
              }
            }
          }
        }
      }
    };
  }

  private generateReadmeTemplate(name: string, category: TaxonomyCategory, description?: string): string {
    return `# ${name} Agent

## Description

${description || `Agent in the ${category} category following OSSA taxonomy standards.`}

## Category

${category}

## Capabilities

- TBD

## Usage

\`\`\`typescript
// Example usage
const agent = new ${name}Agent();
await agent.execute(params);
\`\`\`

## Requirements

- Runtime: Node.js 20+
- Memory: 512MB

## API Reference

See \`openapi.yaml\` for full API specification.
`;
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  private async backupRepository(repoPath: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = `/tmp/ossa-backups/${timestamp}/${path.basename(repoPath)}`;
    const agentsDir = path.join(repoPath, '.agents');

    if (await this.directoryExists(agentsDir)) {
      await this.copyDirectory(agentsDir, path.join(backupPath, '.agents'));
    }
  }

  private async analyzeStructure(agentsDir: string): Promise<any> {
    const structure: any = {};
    const dirs = await fs.readdir(agentsDir);

    for (const dir of dirs) {
      const dirPath = path.join(agentsDir, dir);
      const stat = await fs.stat(dirPath);

      if (stat.isDirectory()) {
        const agents = await fs.readdir(dirPath);
        structure[dir] = agents.filter(a => !a.startsWith('.'));
      }
    }

    return structure;
  }

  private calculateMigrationChanges(structure: any): MigrationChange[] {
    const changes: MigrationChange[] = [];
    const validCategories = Object.values(TaxonomyCategory);

    for (const [dir, agents] of Object.entries(structure)) {
      if (!validCategories.includes(dir as TaxonomyCategory)) {
        // Non-OSSA directory - move agents to workers
        for (const agent of agents as string[]) {
          changes.push({
            type: 'move',
            source: `${dir}/${agent}`,
            target: `workers/${agent}`,
            reason: 'Non-OSSA directory',
            agentName: agent
          });
        }
      }
    }

    return changes;
  }

  private calculateImpact(changes: MigrationChange[]): 'none' | 'low' | 'medium' | 'high' {
    if (changes.length === 0) return 'none';
    if (changes.length < 5) return 'low';
    if (changes.length < 20) return 'medium';
    return 'high';
  }

  private async applyMigrationChange(repoPath: string, change: MigrationChange): Promise<void> {
    const agentsDir = path.join(repoPath, '.agents');

    switch (change.type) {
      case 'move':
        const sourcePath = path.join(agentsDir, change.source);
        const targetPath = path.join(agentsDir, change.target);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.rename(sourcePath, targetPath);
        break;

      case 'create':
        const createPath = path.join(agentsDir, change.target);
        await fs.mkdir(createPath, { recursive: true });
        break;

      case 'delete':
        const deletePath = path.join(agentsDir, change.source);
        await fs.rm(deletePath, { recursive: true });
        break;
    }
  }
}