/**
 * Task Decomposition Service for Agent Mesh
 * Breaks down complex tasks into smaller sub-tasks for multi-agent coordination
 */

import { v4 as uuidv4 } from 'uuid';

export interface SubTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: number; // 1-10 scale
  estimatedDuration: number; // minutes
  dependencies: string[]; // IDs of other subtasks
  agentType?: string; // suggested agent specialization
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  branchRequirement?: string; // required branch pattern
}

export interface TaskDecomposition {
  id: string;
  originalTask: string;
  totalComplexity: number;
  orchestrationPattern: 'sequential' | 'parallel' | 'hierarchical' | 'pipeline';
  subTasks: SubTask[];
  agentAllocation: { [agentType: string]: string[] }; // agent type -> subtask IDs
  executionPlan: ExecutionStep[];
  branchStrategy: BranchStrategy;
}

export interface ExecutionStep {
  stepNumber: number;
  subTaskIds: string[];
  canRunInParallel: boolean;
  requiredBranch?: string;
  branchCheckRequired: boolean;
}

export interface BranchStrategy {
  mainBranch: string;
  featureBranchPrefix: string;
  requiresBranchPerSubtask: boolean;
  branchNamingPattern: string;
}

export class TaskDecompositionService {
  private readonly AI_AGENT_TYPES = [
    'syntax-fixer', 'security-scanner', 'test-writer', 'documentation-writer',
    'code-reviewer', 'performance-optimizer', 'ui-designer', 'api-designer',
    'database-designer', 'devops-specialist', 'git-manager', 'branch-enforcer'
  ];

  private readonly COMPLEXITY_WEIGHTS = {
    'file-creation': 2,
    'file-modification': 1,
    'file-deletion': 3,
    'git-operation': 2,
    'build-operation': 4,
    'test-writing': 3,
    'documentation': 2,
    'security-scan': 5,
    'deployment': 6
  };

  async analyzeTask(taskDescription: string): Promise<TaskDecomposition> {
    const taskId = uuidv4();
    
    // Parse the task and identify components
    const components = this.parseTaskComponents(taskDescription);
    
    // Generate sub-tasks based on components
    const subTasks = this.generateSubTasks(components);
    
    // Calculate complexity and determine orchestration pattern
    const totalComplexity = subTasks.reduce((sum, task) => sum + task.complexity, 0);
    const orchestrationPattern = this.determineOrchestrationPattern(subTasks);
    
    // Create agent allocation
    const agentAllocation = this.allocateAgents(subTasks);
    
    // Generate execution plan with branch requirements
    const executionPlan = this.createExecutionPlan(subTasks, orchestrationPattern);
    
    // Define branch strategy
    const branchStrategy = this.createBranchStrategy(taskDescription, subTasks);

    return {
      id: taskId,
      originalTask: taskDescription,
      totalComplexity,
      orchestrationPattern,
      subTasks,
      agentAllocation,
      executionPlan,
      branchStrategy
    };
  }

  private parseTaskComponents(taskDescription: string): string[] {
    const components: string[] = [];
    
    // Look for common task patterns
    if (taskDescription.match(/create|add|implement|build/i)) {
      components.push('file-creation');
    }
    if (taskDescription.match(/modify|update|change|edit|fix/i)) {
      components.push('file-modification');
    }
    if (taskDescription.match(/delete|remove|clean/i)) {
      components.push('file-deletion');
    }
    if (taskDescription.match(/test|spec|jest|vitest/i)) {
      components.push('test-writing');
    }
    if (taskDescription.match(/document|readme|docs/i)) {
      components.push('documentation');
    }
    if (taskDescription.match(/security|auth|permission/i)) {
      components.push('security-scan');
    }
    if (taskDescription.match(/deploy|build|compile/i)) {
      components.push('build-operation');
    }
    if (taskDescription.match(/git|branch|commit|merge/i)) {
      components.push('git-operation');
    }

    return components.length > 0 ? components : ['file-modification'];
  }

  private generateSubTasks(components: string[]): SubTask[] {
    const subTasks: SubTask[] = [];

    // Always start with branch compliance check
    subTasks.push({
      id: uuidv4(),
      title: 'Branch Compliance Check',
      description: 'Verify current branch is appropriate for AI bot work and follows naming conventions',
      priority: 'critical',
      complexity: 1,
      estimatedDuration: 2,
      dependencies: [],
      agentType: 'branch-enforcer',
      status: 'pending',
      branchRequirement: 'feature/*'
    });

    const branchCheckId = subTasks[0].id;

    // Generate sub-tasks for each component
    components.forEach(component => {
      const task = this.createSubTaskForComponent(component, branchCheckId);
      subTasks.push(task);
    });

    // Add final validation step
    subTasks.push({
      id: uuidv4(),
      title: 'Final Validation',
      description: 'Run tests, lint checks, and validate all changes before completion',
      priority: 'high',
      complexity: 3,
      estimatedDuration: 10,
      dependencies: subTasks.slice(1).map(t => t.id), // depends on all work tasks
      agentType: 'code-reviewer',
      status: 'pending'
    });

    return subTasks;
  }

  private createSubTaskForComponent(component: string, branchCheckId: string): SubTask {
    const baseTask = {
      id: uuidv4(),
      dependencies: [branchCheckId],
      status: 'pending' as const
    };

    switch (component) {
      case 'file-creation':
        return {
          ...baseTask,
          title: 'Create New Files',
          description: 'Create new files following project structure and conventions',
          priority: 'medium',
          complexity: this.COMPLEXITY_WEIGHTS[component],
          estimatedDuration: 15,
          agentType: 'syntax-fixer'
        };

      case 'file-modification':
        return {
          ...baseTask,
          title: 'Modify Existing Files',
          description: 'Update existing files with required changes',
          priority: 'medium',
          complexity: this.COMPLEXITY_WEIGHTS[component],
          estimatedDuration: 10,
          agentType: 'syntax-fixer'
        };

      case 'test-writing':
        return {
          ...baseTask,
          title: 'Write Tests',
          description: 'Create comprehensive tests for new/modified functionality',
          priority: 'high',
          complexity: this.COMPLEXITY_WEIGHTS[component],
          estimatedDuration: 20,
          agentType: 'test-writer'
        };

      case 'security-scan':
        return {
          ...baseTask,
          title: 'Security Analysis',
          description: 'Scan for security vulnerabilities and ensure best practices',
          priority: 'high',
          complexity: this.COMPLEXITY_WEIGHTS[component],
          estimatedDuration: 15,
          agentType: 'security-scanner'
        };

      case 'documentation':
        return {
          ...baseTask,
          title: 'Update Documentation',
          description: 'Update docs, README, and code comments',
          priority: 'medium',
          complexity: this.COMPLEXITY_WEIGHTS[component],
          estimatedDuration: 12,
          agentType: 'documentation-writer'
        };

      default:
        return {
          ...baseTask,
          title: 'General Task',
          description: 'Execute required changes',
          priority: 'medium',
          complexity: 2,
          estimatedDuration: 10,
          agentType: 'syntax-fixer'
        };
    }
  }

  private determineOrchestrationPattern(subTasks: SubTask[]): 'sequential' | 'parallel' | 'hierarchical' | 'pipeline' {
    const totalTasks = subTasks.length;
    const hasDependencies = subTasks.some(task => task.dependencies.length > 0);
    const highComplexityTasks = subTasks.filter(task => task.complexity >= 4).length;

    if (totalTasks <= 3) return 'sequential';
    if (highComplexityTasks > totalTasks / 2) return 'hierarchical';
    if (hasDependencies) return 'pipeline';
    return 'parallel';
  }

  private allocateAgents(subTasks: SubTask[]): { [agentType: string]: string[] } {
    const allocation: { [agentType: string]: string[] } = {};

    subTasks.forEach(task => {
      const agentType = task.agentType || 'syntax-fixer';
      if (!allocation[agentType]) {
        allocation[agentType] = [];
      }
      allocation[agentType].push(task.id);
    });

    return allocation;
  }

  private createExecutionPlan(subTasks: SubTask[], pattern: string): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    
    if (pattern === 'sequential') {
      subTasks.forEach((task, index) => {
        steps.push({
          stepNumber: index + 1,
          subTaskIds: [task.id],
          canRunInParallel: false,
          requiredBranch: task.branchRequirement,
          branchCheckRequired: index === 0 || !!task.branchRequirement
        });
      });
    } else if (pattern === 'parallel') {
      // First step: branch check (always sequential)
      const branchCheckTask = subTasks.find(t => t.agentType === 'branch-enforcer');
      if (branchCheckTask) {
        steps.push({
          stepNumber: 1,
          subTaskIds: [branchCheckTask.id],
          canRunInParallel: false,
          requiredBranch: branchCheckTask.branchRequirement,
          branchCheckRequired: true
        });

        // Second step: all work tasks in parallel
        const workTasks = subTasks.filter(t => t.agentType !== 'branch-enforcer' && t.agentType !== 'code-reviewer');
        if (workTasks.length > 0) {
          steps.push({
            stepNumber: 2,
            subTaskIds: workTasks.map(t => t.id),
            canRunInParallel: true,
            branchCheckRequired: false
          });
        }

        // Final step: validation (sequential)
        const validationTask = subTasks.find(t => t.agentType === 'code-reviewer');
        if (validationTask) {
          steps.push({
            stepNumber: 3,
            subTaskIds: [validationTask.id],
            canRunInParallel: false,
            branchCheckRequired: false
          });
        }
      }
    } else {
      // Pipeline/hierarchical: respect dependencies
      const processed = new Set<string>();
      let stepNumber = 1;

      while (processed.size < subTasks.length) {
        const readyTasks = subTasks.filter(task => 
          !processed.has(task.id) && 
          task.dependencies.every(dep => processed.has(dep))
        );

        if (readyTasks.length > 0) {
          steps.push({
            stepNumber: stepNumber++,
            subTaskIds: readyTasks.map(t => t.id),
            canRunInParallel: readyTasks.length > 1,
            branchCheckRequired: readyTasks.some(t => t.agentType === 'branch-enforcer')
          });

          readyTasks.forEach(task => processed.add(task.id));
        } else {
          break; // Circular dependency or error
        }
      }
    }

    return steps;
  }

  private createBranchStrategy(taskDescription: string, subTasks: SubTask[]): BranchStrategy {
    const sanitizedTask = taskDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    return {
      mainBranch: 'development',
      featureBranchPrefix: 'feature/',
      requiresBranchPerSubtask: subTasks.length > 5,
      branchNamingPattern: `feature/${sanitizedTask}`
    };
  }

  async executeDecomposition(decomposition: TaskDecomposition): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = [];
    
    console.log(`🚀 Executing task decomposition: ${decomposition.originalTask}`);
    console.log(`📋 Pattern: ${decomposition.orchestrationPattern}`);
    console.log(`🔀 Steps: ${decomposition.executionPlan.length}`);
    
    for (const step of decomposition.executionPlan) {
      console.log(`\n📍 Step ${step.stepNumber}: ${step.subTaskIds.length} tasks`);
      
      if (step.branchCheckRequired) {
        console.log('🔍 Running branch compliance check...');
        // This would integrate with BranchAwarenessService
      }
      
      const stepResults = await this.executeStep(step, decomposition.subTasks);
      results.push(...stepResults);
    }
    
    return {
      success: results.every(r => r.success),
      results
    };
  }

  private async executeStep(step: ExecutionStep, allTasks: SubTask[]): Promise<any[]> {
    const tasksToExecute = allTasks.filter(task => step.subTaskIds.includes(task.id));
    const results: any[] = [];
    
    for (const task of tasksToExecute) {
      console.log(`  ⚡ ${task.title} (${task.agentType})`);
      
      // Simulate task execution
      const result = {
        taskId: task.id,
        title: task.title,
        agentType: task.agentType,
        success: true,
        executedAt: new Date().toISOString()
      };
      
      results.push(result);
    }
    
    return results;
  }
}