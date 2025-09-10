/**
 * Branch Awareness Service
 * Provides AI bot branch validation and guidance
 */

import { execSync } from 'child_process';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export interface BranchStatus {
  currentBranch: string;
  isValidBranch: boolean;
  isAIBot: boolean;
  violations: string[];
  suggestions: string[];
  isGitRepo: boolean;
  protectedBranch: boolean;
}

export interface TaskDecomposition {
  taskDescription: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  suggestedAgents: string[];
  estimatedTokens: number;
  orchestrationPattern: 'sequential' | 'parallel' | 'hierarchical';
  subTasks: SubTask[];
}

export interface SubTask {
  id: string;
  description: string;
  agent: string;
  dependencies: string[];
  estimatedTokens: number;
  priority: 'high' | 'medium' | 'low';
}

export class BranchAwarenessService {
  private readonly PROTECTED_BRANCHES = ['main', 'master', 'develop', 'staging', 'production'];
  private readonly AI_BOT_PATTERNS = ['Claude', 'claude', 'GPT', 'gpt', 'AI', 'ai', 'bot', 'assistant', 'code'];
  
  constructor(private workingDir: string = process.cwd()) {}

  /**
   * Check branch status and compliance
   */
  async checkBranchStatus(): Promise<BranchStatus> {
    const status: BranchStatus = {
      currentBranch: 'unknown',
      isValidBranch: false,
      isAIBot: false,
      violations: [],
      suggestions: [],
      isGitRepo: false,
      protectedBranch: false
    };

    try {
      // Check if we're in a git repository
      if (!this.isGitRepository()) {
        status.suggestions.push('Not in a git repository - initialize with: git init');
        return status;
      }
      
      status.isGitRepo = true;

      // Get current branch
      status.currentBranch = this.getCurrentBranch();
      
      // Check if AI bot
      status.isAIBot = this.isAIBot();
      
      // Check if protected branch
      status.protectedBranch = this.PROTECTED_BRANCHES.includes(status.currentBranch);
      
      // Validate branch for AI bots
      if (status.isAIBot) {
        this.validateAIBotBranch(status);
      }
      
      // General branch validation
      this.validateGeneralBranch(status);
      
      status.isValidBranch = status.violations.length === 0;
      
    } catch (error: any) {
      logger.error('Error checking branch status:', error);
      status.violations.push(`Error checking branch: ${error.message}`);
    }

    return status;
  }

  /**
   * Suggest branch name for AI bots
   */
  suggestBranchName(description: string): string {
    // Clean up description
    const cleaned = description
      .toLowerCase()
      .replace(/version?|v?\d+\.\d+\.\d+|20\d{2}[-\/]\d{2}/g, '') // Remove versions/dates
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    return `feature/${cleaned}`;
  }

  /**
   * Create safe branch for AI bot
   */
  async createSafeBranch(description: string): Promise<string> {
    const branchName = this.suggestBranchName(description);
    
    try {
      // Check if branch already exists
      const existingBranches = this.getAllBranches();
      if (existingBranches.includes(branchName)) {
        const timestamp = Date.now();
        const uniqueBranch = `${branchName}-${timestamp}`;
        execSync(`git checkout -b ${uniqueBranch}`, { cwd: this.workingDir );
        logger.info(`Created unique branch: ${uniqueBranch}`);
        return uniqueBranch;
      }
      
      execSync(`git checkout -b ${branchName}`, { cwd: this.workingDir );
      logger.info(`Created branch: ${branchName}`);
      return branchName;
      
    } catch (error: any) {
      logger.error('Error creating branch:', error);
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Decompose task into smaller subtasks
   */
  async decomposeTask(taskDescription: string): Promise<TaskDecomposition> {
    const agentMatrix = await this.loadAgentMatrix();
    
    // Analyze task complexity
    const complexity = this.analyzeComplexity(taskDescription);
    
    // Determine orchestration pattern
    const orchestrationPattern = this.determineOrchestrationPattern(taskDescription, complexity);
    
    // Generate subtasks
    const subTasks = this.generateSubTasks(taskDescription, complexity, orchestrationPattern);
    
    // Select appropriate agents
    const suggestedAgents = this.selectAgents(taskDescription, complexity, subTasks);
    
    // Calculate token estimates
    const estimatedTokens = this.estimateTokens(complexity, subTasks.length);

    return {
      taskDescription,
      complexity,
      suggestedAgents,
      estimatedTokens,
      orchestrationPattern,
      subTasks
    };
  }

  /**
   * Force branch check before any AI operation
   */
  async enforceBranchCheck(): Promise<void> {
    const status = await this.checkBranchStatus();
    
    if (!status.isGitRepo) {
      logger.info('Not in git repository - skipping branch enforcement');
      return;
    }
    
    if (status.isAIBot && status.violations.length > 0) {
      logger.error('🚫 AI Bot Branch Violations Detected:');
      status.violations.forEach(violation => logger.error(`   ❌ ${violation}`));
      
      if (status.suggestions.length > 0) {
        logger.info('💡 Suggested Actions:');
        status.suggestions.forEach(suggestion => logger.info(`   📋 ${suggestion}`));
      }
      
      throw new Error('Branch compliance violations must be resolved before proceeding');
    }
    
    if (status.isAIBot && status.isValidBranch) {
      logger.info(`✅ AI Bot: Branch compliance verified - ${status.currentBranch}`);
    }
  }

  // Private helper methods
  
  private isGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', { cwd: this.workingDir, stdio: 'pipe' );
      return true;
    } catch {
      return false;
    }
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.workingDir,
        encoding: 'utf8'
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  private isAIBot(): boolean {
    try {
      const userName = execSync('git config user.name', {
        cwd: this.workingDir,
        encoding: 'utf8'
      }).trim();
      
      return this.AI_BOT_PATTERNS.some(pattern => 
        userName.toLowerCase().includes(pattern.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  private getAllBranches(): string[] {
    try {
      const output = execSync('git branch --format="%(refname:short)"', {
        cwd: this.workingDir,
        encoding: 'utf8'
      );
      return output.split('\n').filter(b => b.trim());
    } catch {
      return [];
    }
  }

  private validateAIBotBranch(status: BranchStatus): void {
    // Check for protected branches
    if (status.protectedBranch) {
      status.violations.push(`AI bots cannot work on protected branch: ${status.currentBranch}`);
      status.suggestions.push('Create feature branch: git checkout -b feature/your-work-description');
      return;
    }

    // Check for version/date patterns
    if (status.currentBranch.match(/^feature\/(v?\d+\.\d+\.\d+|.*-20\d{2})/)) {
      status.violations.push(`Branch name contains version/date pattern: ${status.currentBranch}`);
      status.suggestions.push('Rename branch: git branch -m feature/work-description');
      status.suggestions.push('Example: feature/agent-orchestration-enhancement');
    }

    // Check for release branches
    if (status.currentBranch.match(/^release\//)) {
      status.violations.push(`AI bots cannot create release branches: ${status.currentBranch}`);
      status.suggestions.push('Use feature branch: git branch -m feature/work-description');
    }

    // Validate feature branch pattern
    if (!status.currentBranch.match(/^feature\//)) {
      status.violations.push(`AI bots must use feature/ branches: ${status.currentBranch}`);
      status.suggestions.push('Create feature branch: git checkout -b feature/work-description');
    }
  }

  private validateGeneralBranch(status: BranchStatus): void {
    // Add general validations that apply to all users
    if (status.currentBranch === 'HEAD') {
      status.violations.push('Detached HEAD state detected');
      status.suggestions.push('Checkout a branch: git checkout -b feature/new-work');
    }
  }

  private async loadAgentMatrix(): Promise<any> {
    try {
      const matrixPath = path.join(this.workingDir, 'config', 'agent-routing-matrix.json');
      if (fs.existsSync(matrixPath)) {
        return JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
      }
      
      // Fallback to default matrix
      return {
        task_decomposition: {
          orchestration_patterns: {
            sequential: { token_budget: 8000 },
            parallel: { token_budget: 15000 },
            hierarchical: { token_budget: 20000 }
          }
        }
      };
    } catch (error) {
      logger.warn('Could not load agent matrix, using defaults');
      return {};
    }
  }

  private analyzeComplexity(taskDescription: string): 'simple' | 'moderate' | 'complex' | 'enterprise' {
    const complexityIndicators = {
      simple: ['fix', 'update', 'change', 'modify'],
      moderate: ['implement', 'create', 'add', 'build', 'develop'],
      complex: ['integrate', 'orchestrate', 'architect', 'design', 'system'],
      enterprise: ['platform', 'infrastructure', 'migrate', 'transform', 'enterprise']
    };

    const words = taskDescription.toLowerCase().split(' ');
    
    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => words.includes(indicator))) {
        return level as any;
      }
    }
    
    // Default based on length
    if (words.length > 20) return 'complex';
    if (words.length > 10) return 'moderate';
    return 'simple';
  }

  private determineOrchestrationPattern(
    taskDescription: string, 
    complexity: string
  ): 'sequential' | 'parallel' | 'hierarchical' {
    const parallelIndicators = ['frontend', 'backend', 'database', 'api', 'ui', 'service'];
    const hierarchicalIndicators = ['system', 'platform', 'infrastructure', 'architecture'];
    
    const words = taskDescription.toLowerCase();
    
    if (complexity === 'enterprise' || hierarchicalIndicators.some(indicator => words.includes(indicator))) {
      return 'hierarchical';
    }
    
    if (parallelIndicators.some(indicator => words.includes(indicator))) {
      return 'parallel';
    }
    
    return 'sequential';
  }

  private generateSubTasks(
    taskDescription: string,
    complexity: string,
    pattern: string
  ): SubTask[] {
    const baseSubTasks: SubTask[] = [];
    
    // Generate subtasks based on complexity and pattern
    if (complexity === 'simple') {
      baseSubTasks.push({
        id: 'task-1',
        description: `Implement ${taskDescription}`,
        agent: 'implementer',
        dependencies: [],
        estimatedTokens: 1500,
        priority: 'high'
      );
    } else if (complexity === 'moderate') {
      baseSubTasks.push(
        {
          id: 'task-1',
          description: `Plan ${taskDescription}`,
          agent: 'planner',
          dependencies: [],
          estimatedTokens: 1000,
          priority: 'high'
        },
        {
          id: 'task-2',
          description: `Implement ${taskDescription}`,
          agent: 'implementer',
          dependencies: ['task-1'],
          estimatedTokens: 3000,
          priority: 'high'
        },
        {
          id: 'task-3',
          description: `Test ${taskDescription}`,
          agent: 'tester',
          dependencies: ['task-2'],
          estimatedTokens: 1500,
          priority: 'medium'
        }
      );
    } else {
      // Complex/enterprise tasks get more detailed breakdown
      baseSubTasks.push(
        {
          id: 'task-1',
          description: `Analyze requirements for ${taskDescription}`,
          agent: 'analyst',
          dependencies: [],
          estimatedTokens: 2000,
          priority: 'high'
        },
        {
          id: 'task-2',
          description: `Design architecture for ${taskDescription}`,
          agent: 'architect',
          dependencies: ['task-1'],
          estimatedTokens: 3000,
          priority: 'high'
        },
        {
          id: 'task-3',
          description: `Implement core components`,
          agent: 'implementer',
          dependencies: ['task-2'],
          estimatedTokens: 5000,
          priority: 'high'
        },
        {
          id: 'task-4',
          description: `Integration testing`,
          agent: 'tester',
          dependencies: ['task-3'],
          estimatedTokens: 2000,
          priority: 'medium'
        },
        {
          id: 'task-5',
          description: `Documentation and deployment`,
          agent: 'deployer',
          dependencies: ['task-4'],
          estimatedTokens: 1500,
          priority: 'low'
        }
      );
    }
    
    return baseSubTasks;
  }

  private selectAgents(taskDescription: string, complexity: string, subTasks: SubTask[]): string[] {
    const uniqueAgents = Array.from(new Set(subTasks.map(task => task.agent)));
    
    // Add orchestrator for complex tasks
    if (complexity === 'complex' || complexity === 'enterprise') {
      uniqueAgents.unshift('orchestrator');
    }
    
    return uniqueAgents;
  }

  private estimateTokens(complexity: string, subTaskCount: number): number {
    const baseTokens = {
      simple: 3000,
      moderate: 8000,
      complex: 15000,
      enterprise: 25000
    };
    
    return baseTokens[complexity as keyof typeof baseTokens] || 8000;
  }
}