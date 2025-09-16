/**
 * OSSA Branching Strategy & Agentic Flow Controller
 * Manages intelligent branch naming and adaptive development workflows
 */

export interface BranchNamingConvention {
  prefix: string;
  version: string;
  agentName: string;
  taskType: string;
  timestamp?: string;
  sequence?: number;
}

export interface AgenticFlowConfig {
  flowType: 'sequential' | 'parallel' | 'adaptive' | 'cascade' | 'experimental';
  coordinationLevel: 'autonomous' | 'supervised' | 'collaborative';
  branchLifecycle: 'ephemeral' | 'persistent' | 'conditional';
  mergeStrategy: 'fast-forward' | 'merge-commit' | 'squash' | 'rebase';
  conflictResolution: 'agent-priority' | 'timestamp' | 'human-review' | 'ai-mediated';
}

export interface FlowTransition {
  from: string;
  to: string;
  trigger: 'completion' | 'error' | 'dependency' | 'user-intervention' | 'ai-decision';
  condition?: (context: any) => boolean;
  actions: string[];
}

export class BranchingStrategyManager {
  private readonly conventions: Map<string, BranchNamingConvention>;
  private readonly flows: Map<string, AgenticFlowConfig>;
  private readonly transitions: Map<string, FlowTransition[]>;
  
  constructor() {
    this.conventions = new Map();
    this.flows = new Map();
    this.transitions = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.setupBranchingConventions();
    this.setupAgenticFlows();
    this.setupFlowTransitions();
  }

  private setupBranchingConventions(): void {
    // Feature Development Branches
    this.conventions.set('feature', {
      prefix: 'feature',
      version: 'v0.1.9',
      agentName: '{agent-name}',
      taskType: '{task-type}',
      timestamp: '{YYYYMMDD}',
      sequence: undefined
    });

    // Hotfix Branches for Production Issues
    this.conventions.set('hotfix', {
      prefix: 'hotfix',
      version: 'v0.1.8',
      agentName: '{agent-name}',
      taskType: '{issue-type}',
      timestamp: '{YYYYMMDD-HHMM}',
      sequence: undefined
    });

    // Experimental Research Branches
    this.conventions.set('experiment', {
      prefix: 'exp',
      version: 'v0.1.9',
      agentName: '{agent-name}',
      taskType: '{research-area}',
      timestamp: '{YYYYMMDD}',
      sequence: '{sequence}'
    });

    // Integration Coordination Branches
    this.conventions.set('integration', {
      prefix: 'integration',
      version: 'v0.1.9',
      agentName: 'phase-{phase}',
      taskType: '{agent-count}agents',
      timestamp: '{YYYYMMDD}',
      sequence: undefined
    });

    // Dependency Resolution Branches
    this.conventions.set('dependency', {
      prefix: 'deps',
      version: 'v0.1.9',
      agentName: '{coordinating-agent}',
      taskType: '{dependency-type}',
      timestamp: '{YYYYMMDD}',
      sequence: undefined
    });

    // Performance Optimization Branches
    this.conventions.set('performance', {
      prefix: 'perf',
      version: 'v0.1.9',
      agentName: '{agent-name}',
      taskType: '{optimization-target}',
      timestamp: '{YYYYMMDD}',
      sequence: undefined
    });

    // Security Enhancement Branches
    this.conventions.set('security', {
      prefix: 'sec',
      version: 'v0.1.9',
      agentName: '{security-agent}',
      taskType: '{security-domain}',
      timestamp: '{YYYYMMDD-HHMM}',
      sequence: undefined
    });

    // Quality Assurance Branches
    this.conventions.set('quality', {
      prefix: 'qa',
      version: 'v0.1.9',
      agentName: '{qa-agent}',
      taskType: '{quality-aspect}',
      timestamp: '{YYYYMMDD}',
      sequence: undefined
    });

    // Documentation Enhancement Branches
    this.conventions.set('docs', {
      prefix: 'docs',
      version: 'v0.1.9',
      agentName: '{doc-agent}',
      taskType: '{doc-type}',
      timestamp: '{YYYYMMDD}',
      sequence: undefined
    });

    // Refactoring and Cleanup Branches
    this.conventions.set('refactor', {
      prefix: 'refactor',
      version: 'v0.1.9',
      agentName: '{agent-name}',
      taskType: '{refactor-scope}',
      timestamp: '{YYYYMMDD}',
      sequence: undefined
    });
  }

  private setupAgenticFlows(): void {
    // Sequential Flow: Agents work one after another
    this.flows.set('sequential', {
      flowType: 'sequential',
      coordinationLevel: 'supervised',
      branchLifecycle: 'ephemeral',
      mergeStrategy: 'fast-forward',
      conflictResolution: 'timestamp'
    });

    // Parallel Flow: Independent agents working simultaneously
    this.flows.set('parallel', {
      flowType: 'parallel',
      coordinationLevel: 'autonomous',
      branchLifecycle: 'persistent',
      mergeStrategy: 'merge-commit',
      conflictResolution: 'ai-mediated'
    });

    // Adaptive Flow: Flow changes based on runtime conditions
    this.flows.set('adaptive', {
      flowType: 'adaptive',
      coordinationLevel: 'collaborative',
      branchLifecycle: 'conditional',
      mergeStrategy: 'squash',
      conflictResolution: 'agent-priority'
    });

    // Cascade Flow: Success triggers next phase automatically
    this.flows.set('cascade', {
      flowType: 'cascade',
      coordinationLevel: 'supervised',
      branchLifecycle: 'ephemeral',
      mergeStrategy: 'rebase',
      conflictResolution: 'human-review'
    });

    // Experimental Flow: High-risk, high-reward exploration
    this.flows.set('experimental', {
      flowType: 'experimental',
      coordinationLevel: 'autonomous',
      branchLifecycle: 'persistent',
      mergeStrategy: 'squash',
      conflictResolution: 'agent-priority'
    });
  }

  private setupFlowTransitions(): void {
    // Feature Development Transitions
    this.transitions.set('feature', [
      {
        from: 'development',
        to: 'testing',
        trigger: 'completion',
        condition: (ctx) => ctx.testsPass && ctx.codeQuality > 0.8,
        actions: ['run-tests', 'quality-check', 'notify-qa-agents']
      },
      {
        from: 'testing',
        to: 'integration',
        trigger: 'completion',
        condition: (ctx) => ctx.allTestsPass && ctx.noConflicts,
        actions: ['create-integration-branch', 'notify-integration-agents']
      },
      {
        from: 'integration',
        to: 'review',
        trigger: 'dependency',
        actions: ['request-review', 'notify-reviewers']
      },
      {
        from: 'review',
        to: 'merge',
        trigger: 'completion',
        condition: (ctx) => ctx.reviewApproved,
        actions: ['merge-to-dev', 'cleanup-branch', 'notify-completion']
      }
    ]);

    // Hotfix Flow Transitions (Critical Path)
    this.transitions.set('hotfix', [
      {
        from: 'identification',
        to: 'immediate-fix',
        trigger: 'error',
        actions: ['create-hotfix-branch', 'assign-priority-agent', 'alert-stakeholders']
      },
      {
        from: 'immediate-fix',
        to: 'verification',
        trigger: 'completion',
        actions: ['run-regression-tests', 'deploy-to-staging']
      },
      {
        from: 'verification',
        to: 'production-merge',
        trigger: 'completion',
        condition: (ctx) => ctx.stagingTestsPass && ctx.stakeholderApproval,
        actions: ['merge-to-production', 'deploy-production', 'post-mortem']
      }
    ]);

    // Experimental Flow Transitions
    this.transitions.set('experimental', [
      {
        from: 'hypothesis',
        to: 'exploration',
        trigger: 'user-intervention',
        actions: ['create-experiment-branch', 'setup-metrics', 'begin-exploration']
      },
      {
        from: 'exploration',
        to: 'evaluation',
        trigger: 'completion',
        actions: ['analyze-results', 'compare-baselines']
      },
      {
        from: 'evaluation',
        to: 'production-candidate',
        trigger: 'ai-decision',
        condition: (ctx) => ctx.experimentSuccess && ctx.metricsImproved,
        actions: ['prepare-production-integration', 'schedule-review']
      },
      {
        from: 'evaluation',
        to: 'archive',
        trigger: 'ai-decision',
        condition: (ctx) => !ctx.experimentSuccess,
        actions: ['document-learnings', 'archive-branch', 'notify-researchers']
      }
    ]);

    // Parallel Coordination Transitions
    this.transitions.set('parallel', [
      {
        from: 'coordination',
        to: 'parallel-execution',
        trigger: 'completion',
        actions: ['spawn-agent-worktrees', 'setup-coordination-dashboard']
      },
      {
        from: 'parallel-execution',
        to: 'conflict-resolution',
        trigger: 'error',
        condition: (ctx) => ctx.hasConflicts,
        actions: ['identify-conflicts', 'initiate-ai-mediation']
      },
      {
        from: 'parallel-execution',
        to: 'integration',
        trigger: 'completion',
        condition: (ctx) => ctx.allAgentsComplete && !ctx.hasConflicts,
        actions: ['create-integration-branch', 'coordinate-merge']
      },
      {
        from: 'conflict-resolution',
        to: 'integration',
        trigger: 'completion',
        actions: ['apply-resolutions', 'validate-integration']
      }
    ]);
  }

  /**
   * Generate branch name following OSSA conventions with agentic context
   */
  generateBranchName(
    type: string,
    agentName: string,
    taskType: string,
    options: {
      version?: string;
      sequence?: number;
      customSuffix?: string;
      timestamp?: boolean;
    } = {}
  ): string {
    const convention = this.conventions.get(type);
    if (!convention) {
      throw new Error(`Unknown branch type: ${type}`);
    }

    const version = options.version || convention.version;
    const timestamp = options.timestamp !== false ? this.generateTimestamp() : '';
    const sequence = options.sequence ? `-${options.sequence.toString().padStart(3, '0')}` : '';
    const customSuffix = options.customSuffix ? `-${options.customSuffix}` : '';

    // Sanitize agent name for branch naming
    const sanitizedAgentName = agentName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const sanitizedTaskType = taskType.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    let branchName = `${convention.prefix}/${version}-${sanitizedAgentName}-${sanitizedTaskType}`;
    
    if (timestamp) {
      branchName += `-${timestamp}`;
    }
    
    if (sequence) {
      branchName += sequence;
    }
    
    if (customSuffix) {
      branchName += customSuffix;
    }

    return branchName;
  }

  /**
   * Determine optimal agentic flow based on context
   */
  determineOptimalFlow(context: {
    agentCount: number;
    priority: string;
    complexity: 'low' | 'medium' | 'high';
    dependencies: string[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeline: 'immediate' | 'standard' | 'extended';
  }): string {
    // Critical priority always uses sequential for safety
    if (context.priority === 'critical') {
      return 'sequential';
    }

    // High-risk experimental work
    if (context.riskTolerance === 'aggressive' && context.complexity === 'high') {
      return 'experimental';
    }

    // Multiple agents with low interdependence
    if (context.agentCount > 5 && context.dependencies.length < 3) {
      return 'parallel';
    }

    // Complex interdependent work
    if (context.complexity === 'high' && context.dependencies.length > 5) {
      return 'cascade';
    }

    // Default to adaptive for most scenarios
    return 'adaptive';
  }

  /**
   * Get flow configuration for a specific flow type
   */
  getFlowConfig(flowType: string): AgenticFlowConfig | null {
    return this.flows.get(flowType) || null;
  }

  /**
   * Get available transitions for a flow state
   */
  getAvailableTransitions(flowType: string, currentState: string): FlowTransition[] {
    const transitions = this.transitions.get(flowType) || [];
    return transitions.filter(t => t.from === currentState);
  }

  /**
   * Execute flow transition with context evaluation
   */
  executeTransition(
    flowType: string,
    currentState: string,
    trigger: string,
    context: any
  ): {
    success: boolean;
    newState?: string;
    actions: string[];
    message: string;
  } {
    const availableTransitions = this.getAvailableTransitions(flowType, currentState);
    const matchingTransition = availableTransitions.find(
      t => t.trigger === trigger && (!t.condition || t.condition(context))
    );

    if (!matchingTransition) {
      return {
        success: false,
        actions: [],
        message: `No valid transition found from ${currentState} with trigger ${trigger}`
      };
    }

    return {
      success: true,
      newState: matchingTransition.to,
      actions: matchingTransition.actions,
      message: `Transitioned from ${currentState} to ${matchingTransition.to}`
    };
  }

  /**
   * Generate timestamp for branch naming
   */
  private generateTimestamp(): string {
    const now = new Date();
    return now.toISOString()
      .slice(0, 16)
      .replace(/[-:T]/g, '')
      .slice(0, 12); // YYYYMMDDHHMMSS format, truncated to YYYYMMDDHHMM
  }

  /**
   * Adaptive flow controller that changes strategy based on real-time conditions
   */
  adaptFlow(
    currentFlow: string,
    metrics: {
      completionRate: number;
      errorRate: number;
      conflictRate: number;
      agentUtilization: number;
      timeToCompletion: number;
    },
    constraints: {
      deadline?: Date;
      resourceLimit?: number;
      qualityThreshold?: number;
    }
  ): {
    recommendedFlow: string;
    reason: string;
    suggestedActions: string[];
  } {
    // High error rate suggests need for more controlled flow
    if (metrics.errorRate > 0.15) {
      return {
        recommendedFlow: 'sequential',
        reason: 'High error rate detected, switching to controlled sequential flow',
        suggestedActions: ['pause-parallel-agents', 'review-error-patterns', 'implement-sequential-gates']
      };
    }

    // High conflict rate suggests need for better coordination
    if (metrics.conflictRate > 0.10) {
      return {
        recommendedFlow: 'cascade',
        reason: 'High conflict rate, implementing cascade flow for better coordination',
        suggestedActions: ['create-integration-branches', 'setup-dependency-tracking', 'enable-conflict-prediction']
      };
    }

    // Low utilization with time pressure suggests parallel scaling
    if (metrics.agentUtilization < 0.6 && constraints.deadline) {
      const timeRemaining = constraints.deadline.getTime() - Date.now();
      if (timeRemaining < 48 * 60 * 60 * 1000) { // Less than 48 hours
        return {
          recommendedFlow: 'parallel',
          reason: 'Low agent utilization with approaching deadline, scaling to parallel execution',
          suggestedActions: ['spawn-additional-agents', 'partition-work-more-granularly', 'enable-aggressive-parallelization']
        };
      }
    }

    // High completion rate with stable metrics suggests experimental optimization
    if (metrics.completionRate > 0.8 && metrics.errorRate < 0.05 && metrics.conflictRate < 0.05) {
      return {
        recommendedFlow: 'experimental',
        reason: 'Stable high performance detected, enabling experimental optimizations',
        suggestedActions: ['enable-performance-experiments', 'try-advanced-algorithms', 'implement-predictive-coordination']
      };
    }

    return {
      recommendedFlow: currentFlow,
      reason: 'Current flow performing within acceptable parameters',
      suggestedActions: ['continue-monitoring', 'maintain-current-coordination']
    };
  }

  /**
   * Generate branch naming recommendations based on agent specialization
   */
  getBranchNamingRecommendations(
    agentName: string,
    specialization: string,
    phase: number,
    priority: string
  ): {
    primary: string;
    alternatives: string[];
    reasoning: string;
  } {
    const taskType = this.deriveTaskTypeFromSpecialization(specialization);
    
    let primaryType = 'feature';
    
    // Determine primary branch type based on context
    if (priority === 'critical' && phase <= 2) {
      primaryType = 'hotfix';
    } else if (specialization.includes('security') || specialization.includes('audit')) {
      primaryType = 'security';
    } else if (specialization.includes('performance') || specialization.includes('optimization')) {
      primaryType = 'performance';
    } else if (specialization.includes('quality') || specialization.includes('testing')) {
      primaryType = 'quality';
    } else if (phase > 4 || specialization.includes('research') || specialization.includes('experimental')) {
      primaryType = 'experiment';
    }

    const primary = this.generateBranchName(primaryType, agentName, taskType);
    
    const alternatives = [
      this.generateBranchName('feature', agentName, taskType),
      this.generateBranchName('experiment', agentName, taskType, { sequence: 1 }),
      this.generateBranchName('refactor', agentName, taskType)
    ].filter(alt => alt !== primary);

    return {
      primary,
      alternatives,
      reasoning: `Selected ${primaryType} branch type based on agent specialization (${specialization}), phase (${phase}), and priority (${priority})`
    };
  }

  private deriveTaskTypeFromSpecialization(specialization: string): string {
    const specializationMap: { [key: string]: string } = {
      'cli-infrastructure': 'cli-dev',
      'industrial-protocols': 'protocol-impl',
      'production-analytics': 'analytics-dev',
      'multi-modal': 'multimodal-dev',
      'security-framework': 'security-impl',
      'knowledge-management': 'knowledge-sys',
      'quality-assurance': 'qa-automation',
      'coordination': 'orchestration'
    };

    return specializationMap[specialization] || specialization.replace(/[^a-z0-9]/g, '-').toLowerCase();
  }
}

export default BranchingStrategyManager;