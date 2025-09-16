/**
 * OSSA Git Worktree Manager
 * Provides git worktree integration for parallel agent development
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { EventEmitter } from 'events';

export interface WorktreeConfig {
  agentName: string;
  baseBranch: string;
  featureBranch: string;
  workingDirectory: string;
  gitRepository: string;
  ossaVersion: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  phase: number;
  dependencies: string[];
}

export interface BranchStrategy {
  pattern: string;
  description: string;
  mergeTarget: string;
  autoMerge: boolean;
  requiresReview: boolean;
}

export class GitWorktreeManager extends EventEmitter {
  private readonly worktreeBase: string;
  private readonly configPath: string;
  private readonly branchStrategies: Map<string, BranchStrategy>;
  
  constructor(baseDirectory: string = process.env.OSSA_WORKTREE_BASE || '.worktrees') {
    super();
    this.worktreeBase = resolve(baseDirectory);
    this.configPath = join(this.worktreeBase, 'config');
    this.branchStrategies = new Map();
    
    this.initializeWorktreeBase();
    this.loadBranchStrategies();
  }

  private initializeWorktreeBase(): void {
    if (!existsSync(this.worktreeBase)) {
      mkdirSync(this.worktreeBase, { recursive: true });
    }
    
    if (!existsSync(this.configPath)) {
      mkdirSync(this.configPath, { recursive: true });
    }
  }

  private loadBranchStrategies(): void {
    // OSSA v0.1.9 Development Branch Strategy
    this.branchStrategies.set('feature', {
      pattern: 'feature/v0.1.9-{agent-name}-{task}',
      description: 'Feature development branches for individual agent tasks',
      mergeTarget: 'v0.1.9-dev',
      autoMerge: false,
      requiresReview: true
    });

    this.branchStrategies.set('hotfix', {
      pattern: 'hotfix/v0.1.8-{agent-name}-{issue}',
      description: 'Critical fixes for production v0.1.8',
      mergeTarget: 'feature/0.1.8',
      autoMerge: false,
      requiresReview: true
    });

    this.branchStrategies.set('experiment', {
      pattern: 'experiment/v0.1.9-{agent-name}-{concept}',
      description: 'Experimental branches for research and prototyping',
      mergeTarget: 'v0.1.9-dev',
      autoMerge: false,
      requiresReview: false
    });

    this.branchStrategies.set('integration', {
      pattern: 'integration/v0.1.9-phase-{phase}-{agents}',
      description: 'Integration branches for coordinating multiple agents',
      mergeTarget: 'v0.1.9-dev',
      autoMerge: true,
      requiresReview: true
    });

    this.branchStrategies.set('release', {
      pattern: 'release/v0.1.9-{milestone}',
      description: 'Release preparation branches',
      mergeTarget: 'main',
      autoMerge: false,
      requiresReview: true
    });
  }

  /**
   * Create a new worktree for an agent with proper branching strategy
   */
  async createAgentWorktree(config: WorktreeConfig): Promise<string> {
    const worktreePath = join(this.worktreeBase, config.agentName);
    const branchName = this.generateBranchName(config);
    
    try {
      // Ensure we're in a git repository
      this.ensureGitRepository(config.gitRepository);
      
      // Fetch latest changes
      execSync('git fetch --all', { cwd: config.gitRepository });
      
      // Create feature branch from base branch
      execSync(`git checkout ${config.baseBranch}`, { cwd: config.gitRepository });
      execSync(`git pull origin ${config.baseBranch}`, { cwd: config.gitRepository });
      execSync(`git checkout -b ${branchName}`, { cwd: config.gitRepository });
      
      // Create worktree
      execSync(`git worktree add ${worktreePath} ${branchName}`, { cwd: config.gitRepository });
      
      // Configure worktree for agent
      await this.configureWorktree(worktreePath, config);
      
      // Save worktree configuration
      this.saveWorktreeConfig(config.agentName, {
        ...config,
        featureBranch: branchName,
        workingDirectory: worktreePath
      });
      
      this.emit('worktree:created', {
        agent: config.agentName,
        branch: branchName,
        path: worktreePath
      });
      
      return worktreePath;
      
    } catch (error) {
      this.emit('worktree:error', {
        agent: config.agentName,
        error: error.message
      });
      throw new Error(`Failed to create worktree for ${config.agentName}: ${error.message}`);
    }
  }

  /**
   * Generate branch name following OSSA naming conventions
   */
  private generateBranchName(config: WorktreeConfig): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sanitizedAgentName = config.agentName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Determine branch type based on agent configuration
    let branchType = 'feature';
    if (config.priority === 'critical') {
      branchType = 'hotfix';
    } else if (config.phase > 4) {
      branchType = 'experiment';
    }
    
    return `${branchType}/v${config.ossaVersion}-${sanitizedAgentName}-${timestamp}`;
  }

  /**
   * Configure worktree with OSSA-specific settings and agent context
   */
  private async configureWorktree(worktreePath: string, config: WorktreeConfig): Promise<void> {
    // Set up git configuration for this worktree
    execSync('git config user.name "OSSA Agent System"', { cwd: worktreePath });
    execSync('git config user.email "agents@ossa.bluefly.io"', { cwd: worktreePath });
    
    // Create agent-specific configuration
    const agentConfig = {
      agent: {
        name: config.agentName,
        version: config.ossaVersion,
        phase: config.phase,
        priority: config.priority,
        baseBranch: config.baseBranch,
        featureBranch: config.featureBranch,
        workingDirectory: worktreePath,
        dependencies: config.dependencies,
        created: new Date().toISOString()
      },
      git: {
        repository: config.gitRepository,
        worktreePath: worktreePath,
        branch: config.featureBranch,
        autoCommit: true,
        autoSync: config.priority === 'critical',
        commitPrefix: `[${config.agentName}]`
      },
      ossa: {
        version: config.ossaVersion,
        compliance: 'v0.1.8+',
        namingConvention: 'v1.0.0',
        discoveryEnabled: true
      }
    };
    
    // Write agent configuration to worktree
    writeFileSync(
      join(worktreePath, '.ossa-agent-config.json'),
      JSON.stringify(agentConfig, null, 2)
    );
    
    // Create agent-specific directories following OSSA structure
    const directories = [
      '.agents/manifests',
      '.agents/runtime',
      '.agents/cache',
      '.agents/state',
      '.agents-workspace/config',
      '.agents-workspace/workflows',
      '.agents-workspace/data',
      '.agents-workspace/logs'
    ];
    
    directories.forEach(dir => {
      mkdirSync(join(worktreePath, dir), { recursive: true });
    });
    
    // Initialize agent workspace configuration
    const workspaceConfig = {
      workspace: {
        id: `${config.agentName}-workspace`,
        version: config.ossaVersion,
        agents: [config.agentName],
        orchestration: {
          enabled: true,
          coordinator: 'master-orchestration-coordinator',
          priority: config.priority,
          phase: config.phase
        }
      }
    };
    
    writeFileSync(
      join(worktreePath, '.agents-workspace/config/workspace.json'),
      JSON.stringify(workspaceConfig, null, 2)
    );
  }

  /**
   * Save worktree configuration for tracking and management
   */
  private saveWorktreeConfig(agentName: string, config: WorktreeConfig): void {
    const configFile = join(this.configPath, `${agentName}.json`);
    writeFileSync(configFile, JSON.stringify(config, null, 2));
  }

  /**
   * Load worktree configuration for an agent
   */
  loadWorktreeConfig(agentName: string): WorktreeConfig | null {
    const configFile = join(this.configPath, `${agentName}.json`);
    if (!existsSync(configFile)) {
      return null;
    }
    
    return JSON.parse(readFileSync(configFile, 'utf-8'));
  }

  /**
   * Get branch awareness information for an agent
   */
  getBranchAwareness(agentName: string): {
    currentBranch: string;
    baseBranch: string;
    ossaVersion: string;
    branchType: string;
    mergeTarget: string;
    canAutoMerge: boolean;
    requiresReview: boolean;
  } | null {
    const config = this.loadWorktreeConfig(agentName);
    if (!config) return null;

    const branchType = config.featureBranch.split('/')[0];
    const strategy = this.branchStrategies.get(branchType);
    
    return {
      currentBranch: config.featureBranch,
      baseBranch: config.baseBranch,
      ossaVersion: config.ossaVersion,
      branchType,
      mergeTarget: strategy?.mergeTarget || config.baseBranch,
      canAutoMerge: strategy?.autoMerge || false,
      requiresReview: strategy?.requiresReview || true
    };
  }

  /**
   * Synchronize agent worktree with remote repository
   */
  async syncWorktree(agentName: string): Promise<void> {
    const config = this.loadWorktreeConfig(agentName);
    if (!config) {
      throw new Error(`No worktree configuration found for agent: ${agentName}`);
    }

    try {
      const worktreePath = config.workingDirectory;
      
      // Commit any pending changes
      const status = execSync('git status --porcelain', { 
        cwd: worktreePath, 
        encoding: 'utf-8' 
      });
      
      if (status.trim()) {
        const commitMessage = `[${agentName}] Auto-sync: Work in progress
        
Agent: ${agentName}
Phase: ${config.phase}
Priority: ${config.priority}
OSSA Version: ${config.ossaVersion}

🤖 Generated with OSSA Agent System

Co-Authored-By: ${agentName} <agents@ossa.bluefly.io>`;

        execSync('git add -A', { cwd: worktreePath });
        execSync(`git commit -m "${commitMessage}"`, { cwd: worktreePath });
      }
      
      // Push to remote branch
      execSync(`git push -u origin ${config.featureBranch}`, { cwd: worktreePath });
      
      this.emit('worktree:synced', {
        agent: agentName,
        branch: config.featureBranch
      });
      
    } catch (error) {
      this.emit('worktree:sync-error', {
        agent: agentName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Coordinate merge between multiple agent worktrees
   */
  async coordinateIntegration(agentNames: string[], integrationBranch?: string): Promise<string> {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const branchName = integrationBranch || `integration/v0.1.9-multi-agent-${timestamp}`;
    
    try {
      // Get first agent's repository as base
      const firstConfig = this.loadWorktreeConfig(agentNames[0]);
      if (!firstConfig) {
        throw new Error(`Configuration not found for agent: ${agentNames[0]}`);
      }
      
      const gitRepo = firstConfig.gitRepository;
      
      // Create integration branch
      execSync(`git checkout v0.1.9-dev`, { cwd: gitRepo });
      execSync(`git pull origin v0.1.9-dev`, { cwd: gitRepo });
      execSync(`git checkout -b ${branchName}`, { cwd: gitRepo });
      
      // Merge each agent's branch
      for (const agentName of agentNames) {
        const config = this.loadWorktreeConfig(agentName);
        if (!config) continue;
        
        // Ensure agent branch is up to date
        await this.syncWorktree(agentName);
        
        // Merge agent branch into integration branch
        execSync(`git merge ${config.featureBranch} --no-ff -m "Integrate ${agentName} work"`, {
          cwd: gitRepo
        });
        
        this.emit('integration:merged', {
          agent: agentName,
          branch: config.featureBranch,
          integrationBranch: branchName
        });
      }
      
      // Push integration branch
      execSync(`git push -u origin ${branchName}`, { cwd: gitRepo });
      
      return branchName;
      
    } catch (error) {
      this.emit('integration:error', {
        agents: agentNames,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean up completed worktrees
   */
  async cleanupWorktree(agentName: string, keepBranch: boolean = false): Promise<void> {
    const config = this.loadWorktreeConfig(agentName);
    if (!config) return;

    try {
      const gitRepo = config.gitRepository;
      const worktreePath = config.workingDirectory;
      
      // Remove worktree
      execSync(`git worktree remove ${worktreePath} --force`, { cwd: gitRepo });
      
      // Optionally remove branch
      if (!keepBranch) {
        execSync(`git branch -D ${config.featureBranch}`, { cwd: gitRepo });
        execSync(`git push origin --delete ${config.featureBranch}`, { cwd: gitRepo });
      }
      
      // Remove configuration
      const configFile = join(this.configPath, `${agentName}.json`);
      if (existsSync(configFile)) {
        execSync(`rm ${configFile}`);
      }
      
      this.emit('worktree:cleaned', {
        agent: agentName,
        branch: config.featureBranch,
        branchRemoved: !keepBranch
      });
      
    } catch (error) {
      this.emit('worktree:cleanup-error', {
        agent: agentName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List all active agent worktrees
   */
  listActiveWorktrees(): Array<{
    agent: string;
    branch: string;
    path: string;
    phase: number;
    priority: string;
    ossaVersion: string;
  }> {
    const worktrees: Array<any> = [];
    
    try {
      const configFiles = execSync('ls *.json', { 
        cwd: this.configPath, 
        encoding: 'utf-8' 
      }).trim().split('\n');
      
      for (const file of configFiles) {
        if (file.endsWith('.json')) {
          const agentName = file.replace('.json', '');
          const config = this.loadWorktreeConfig(agentName);
          if (config) {
            worktrees.push({
              agent: config.agentName,
              branch: config.featureBranch,
              path: config.workingDirectory,
              phase: config.phase,
              priority: config.priority,
              ossaVersion: config.ossaVersion
            });
          }
        }
      }
    } catch (error) {
      // No config files found
    }
    
    return worktrees;
  }

  private ensureGitRepository(repoPath: string): void {
    if (!existsSync(join(repoPath, '.git'))) {
      throw new Error(`Not a git repository: ${repoPath}`);
    }
  }

  /**
   * Get project version awareness for an agent
   */
  getProjectVersionAwareness(agentName: string): {
    currentVersion: string;
    targetVersion: string;
    branchType: string;
    developmentPhase: number;
    compatibilityLevel: string;
  } | null {
    const config = this.loadWorktreeConfig(agentName);
    if (!config) return null;

    const branchAwareness = this.getBranchAwareness(agentName);
    if (!branchAwareness) return null;

    return {
      currentVersion: config.ossaVersion,
      targetVersion: branchAwareness.branchType === 'hotfix' ? 'v0.1.8' : 'v0.1.9',
      branchType: branchAwareness.branchType,
      developmentPhase: config.phase,
      compatibilityLevel: config.ossaVersion >= '0.1.8' ? 'production' : 'development'
    };
  }
}

export default GitWorktreeManager;