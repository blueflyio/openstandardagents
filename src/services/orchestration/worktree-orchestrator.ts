/**
 * OSSA Worktree Orchestration Service
 * Coordinates git worktrees across multiple agents with intelligent flow management
 */

import { EventEmitter } from 'events';
import GitWorktreeManager from '../worktree/git-worktree-manager.js';
import BranchingStrategyManager from '../worktree/branching-strategy.js';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface OrchestrationConfig {
  maxConcurrentAgents: number;
  coordinationStrategy: 'centralized' | 'decentralized' | 'hybrid';
  flowAdaptationEnabled: boolean;
  autoIntegrationEnabled: boolean;
  conflictPreventionEnabled: boolean;
}

export interface AgentWorkloadDistribution {
  phase: number;
  agentCount: number;
  estimatedHours: number;
  priority: string;
  dependencies: string[];
  parallelizable: boolean;
}

export interface CoordinationMetrics {
  totalAgents: number;
  activeWorktrees: number;
  integrationsPending: number;
  conflictsDetected: number;
  averageCompletionTime: number;
  throughput: number;
  utilizationRate: number;
}

export class WorktreeOrchestrator extends EventEmitter {
  private readonly worktreeManager: GitWorktreeManager;
  private readonly branchingStrategy: BranchingStrategyManager;
  private readonly config: OrchestrationConfig;
  private readonly metricsHistory: CoordinationMetrics[] = [];
  
  constructor(config: Partial<OrchestrationConfig> = {}) {
    super();
    
    this.config = {
      maxConcurrentAgents: 25,
      coordinationStrategy: 'hybrid',
      flowAdaptationEnabled: true,
      autoIntegrationEnabled: false,
      conflictPreventionEnabled: true,
      ...config
    };
    
    this.worktreeManager = new GitWorktreeManager();
    this.branchingStrategy = new BranchingStrategyManager();
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Worktree event monitoring
    this.worktreeManager.on('worktree:created', this.handleWorktreeCreated.bind(this));
    this.worktreeManager.on('worktree:synced', this.handleWorktreeSynced.bind(this));
    this.worktreeManager.on('integration:merged', this.handleIntegrationMerged.bind(this));
    this.worktreeManager.on('worktree:error', this.handleWorktreeError.bind(this));

    // Periodic metrics collection
    setInterval(() => this.collectMetrics(), 5 * 60 * 1000); // Every 5 minutes
    
    // Flow adaptation check
    if (this.config.flowAdaptationEnabled) {
      setInterval(() => this.checkFlowAdaptation(), 15 * 60 * 1000); // Every 15 minutes
    }
  }

  /**
   * Deploy multiple agents with intelligent worktree distribution
   */
  async deployAgentSwarm(agents: Array<{
    name: string;
    specialization: string;
    phase: number;
    priority: string;
    dependencies?: string[];
  }>): Promise<{
    deployed: string[];
    failed: string[];
    estimatedCompletion: Date;
  }> {
    
    console.log(`🚀 Deploying agent swarm: ${agents.length} agents`);
    this.emit('swarm:deployment-started', { agentCount: agents.length });

    // Analyze workload and optimize distribution
    const workloadDistribution = this.analyzeWorkloadDistribution(agents);
    const optimizedFlow = this.optimizeDeploymentFlow(workloadDistribution);
    
    console.log(`📊 Workload analysis: ${workloadDistribution.length} phases, ${optimizedFlow} flow recommended`);

    const deployed: string[] = [];
    const failed: string[] = [];
    const deploymentPromises: Promise<void>[] = [];

    // Group agents by deployment strategy
    const deploymentGroups = this.groupAgentsForDeployment(agents, optimizedFlow);

    for (const group of deploymentGroups) {
      if (deploymentPromises.length >= this.config.maxConcurrentAgents) {
        // Wait for some deployments to complete before starting more
        await Promise.race(deploymentPromises);
      }

      const deploymentPromise = this.deployAgentGroup(group)
        .then(results => {
          deployed.push(...results.deployed);
          failed.push(...results.failed);
        })
        .catch(error => {
          console.error(`Group deployment failed:`, error);
          failed.push(...group.map(a => a.name));
        });

      deploymentPromises.push(deploymentPromise);
    }

    // Wait for all deployments to complete
    await Promise.allSettled(deploymentPromises);

    const estimatedCompletion = this.estimateCompletionTime(deployed);

    this.emit('swarm:deployment-completed', {
      deployed: deployed.length,
      failed: failed.length,
      estimatedCompletion
    });

    return { deployed, failed, estimatedCompletion };
  }

  /**
   * Deploy a group of agents with coordinated worktrees
   */
  private async deployAgentGroup(agents: Array<{
    name: string;
    specialization: string;
    phase: number;
    priority: string;
    dependencies?: string[];
  }>): Promise<{deployed: string[], failed: string[]}> {
    
    const deployed: string[] = [];
    const failed: string[] = [];

    // Sort agents by priority and dependencies
    const sortedAgents = this.sortAgentsByDependencies(agents);

    for (const agent of sortedAgents) {
      try {
        // Check if dependencies are met
        if (agent.dependencies && !this.areDependenciesMet(agent.dependencies, deployed)) {
          console.log(`⏸️  Waiting for dependencies for ${agent.name}: ${agent.dependencies.join(', ')}`);
          continue;
        }

        // Create worktree configuration
        const branchRecommendations = this.branchingStrategy.getBranchNamingRecommendations(
          agent.name,
          agent.specialization,
          agent.phase,
          agent.priority
        );

        const worktreeConfig = {
          agentName: agent.name,
          baseBranch: 'v0.1.9-dev',
          featureBranch: branchRecommendations.primary,
          workingDirectory: '',
          gitRepository: process.cwd(),
          ossaVersion: '0.1.9',
          priority: agent.priority as any,
          phase: agent.phase,
          dependencies: agent.dependencies || []
        };

        // Deploy agent worktree
        const worktreePath = await this.worktreeManager.createAgentWorktree(worktreeConfig);
        
        // Setup agent-specific coordination
        await this.setupAgentCoordination(agent.name, sortedAgents);
        
        deployed.push(agent.name);
        
        this.emit('agent:deployed', {
          name: agent.name,
          path: worktreePath,
          branch: branchRecommendations.primary
        });

      } catch (error) {
        console.error(`Failed to deploy agent ${agent.name}:`, (error as Error).message);
        failed.push(agent.name);
        
        this.emit('agent:deployment-failed', {
          name: agent.name,
          error: (error as Error).message
        });
      }
    }

    return { deployed, failed };
  }

  /**
   * Setup coordination configuration for an agent
   */
  private async setupAgentCoordination(
    agentName: string,
    allAgents: Array<{ name: string; dependencies?: string[] }>
  ): Promise<void> {
    
    const config = this.worktreeManager.loadWorktreeConfig(agentName);
    if (!config) return;

    // Determine peer agents (same phase, no dependencies)
    const agent = allAgents.find(a => a.name === agentName);
    const peerAgents = allAgents
      .filter(a => a.name !== agentName && !a.dependencies?.includes(agentName))
      .map(a => a.name);

    // Determine dependent agents
    const dependentAgents = allAgents
      .filter(a => a.dependencies?.includes(agentName))
      .map(a => a.name);

    // Create coordination configuration
    const coordinationConfig = {
      coordinatorAgent: 'master-orchestration-coordinator',
      peerAgents,
      dependentAgents,
      integrationBranch: `integration/v0.1.9-phase-${config.phase}-${Date.now()}`,
      syncSchedule: config.priority === 'critical' ? 'immediate' : 'hourly',
      conflictResolutionPriority: this.calculateConflictPriority(config.priority, config.phase)
    };

    // Save coordination configuration
    const coordinationPath = join(config.workingDirectory, '.agents-workspace/config/coordination.json');
    writeFileSync(coordinationPath, JSON.stringify(coordinationConfig, null, 2));

    this.emit('coordination:configured', { agent: agentName, coordination: coordinationConfig });
  }

  /**
   * Analyze workload distribution for optimal deployment
   */
  private analyzeWorkloadDistribution(agents: Array<{
    name: string;
    specialization: string;
    phase: number;
    priority: string;
    dependencies?: string[];
  }>): AgentWorkloadDistribution[] {
    
    const phases = new Map<number, typeof agents>();
    
    // Group agents by phase
    agents.forEach(agent => {
      if (!phases.has(agent.phase)) {
        phases.set(agent.phase, []);
      }
      phases.get(agent.phase)!.push(agent);
    });

    // Calculate workload distribution
    return Array.from(phases.entries()).map(([phase, phaseAgents]) => {
      const criticalCount = phaseAgents.filter(a => a.priority === 'critical').length;
      const highCount = phaseAgents.filter(a => a.priority === 'high').length;
      
      // Estimate based on priority and complexity
      const estimatedHours = this.estimatePhaseHours(phase, phaseAgents);
      
      // Check if phase work can be parallelized
      const totalDependencies = phaseAgents.reduce((acc, agent) => acc + (agent.dependencies?.length || 0), 0);
      const parallelizable = totalDependencies < phaseAgents.length * 0.3; // Less than 30% have dependencies

      return {
        phase,
        agentCount: phaseAgents.length,
        estimatedHours,
        priority: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'medium',
        dependencies: Array.from(new Set(phaseAgents.flatMap(a => a.dependencies || []))),
        parallelizable
      };
    });
  }

  /**
   * Optimize deployment flow based on workload analysis
   */
  private optimizeDeploymentFlow(workload: AgentWorkloadDistribution[]): string {
    const totalAgents = workload.reduce((sum, phase) => sum + phase.agentCount, 0);
    const hasCritical = workload.some(phase => phase.priority === 'critical');
    const highlyParallelizable = workload.every(phase => phase.parallelizable);
    const complexPhases = workload.filter(phase => phase.agentCount > 10);

    if (hasCritical && totalAgents < 20) {
      return 'sequential';
    }

    if (highlyParallelizable && totalAgents > 30) {
      return 'parallel';
    }

    if (complexPhases.length > 2) {
      return 'cascade';
    }

    return 'adaptive';
  }

  /**
   * Group agents for optimal deployment coordination
   */
  private groupAgentsForDeployment(
    agents: Array<{ name: string; specialization: string; phase: number; priority: string; dependencies?: string[]; }>,
    flow: string
  ): Array<typeof agents> {
    
    switch (flow) {
      case 'sequential':
        // Deploy one agent at a time, respecting dependencies
        return agents.map(agent => [agent]);
        
      case 'parallel':
        // Group by phase, deploy phases in parallel
        const phaseGroups = new Map<number, typeof agents>();
        agents.forEach(agent => {
          if (!phaseGroups.has(agent.phase)) {
            phaseGroups.set(agent.phase, []);
          }
          phaseGroups.get(agent.phase)!.push(agent);
        });
        return Array.from(phaseGroups.values());
        
      case 'cascade':
        // Group by specialization, cascade through phases
        const specializationGroups = new Map<string, typeof agents>();
        agents.forEach(agent => {
          if (!specializationGroups.has(agent.specialization)) {
            specializationGroups.set(agent.specialization, []);
          }
          specializationGroups.get(agent.specialization)!.push(agent);
        });
        return Array.from(specializationGroups.values());
        
      case 'adaptive':
      default:
        // Adaptive grouping based on dependencies and priority
        return this.createAdaptiveGroups(agents);
    }
  }

  /**
   * Create adaptive deployment groups based on dependencies and priority
   */
  private createAdaptiveGroups(agents: Array<{
    name: string;
    specialization: string;
    phase: number;
    priority: string;
    dependencies?: string[];
  }>): Array<typeof agents> {
    
    const groups: Array<typeof agents> = [];
    const processed = new Set<string>();
    
    // First pass: critical priority agents with no dependencies
    const criticalNoDeps = agents.filter(a => 
      a.priority === 'critical' && (!a.dependencies || a.dependencies.length === 0)
    );
    if (criticalNoDeps.length > 0) {
      groups.push(criticalNoDeps);
      criticalNoDeps.forEach(a => processed.add(a.name));
    }
    
    // Second pass: group agents by phase and specialization
    const remaining = agents.filter(a => !processed.has(a.name));
    const phaseSpecGroups = new Map<string, typeof agents>();
    
    remaining.forEach(agent => {
      const key = `phase-${agent.phase}-${agent.specialization}`;
      if (!phaseSpecGroups.has(key)) {
        phaseSpecGroups.set(key, []);
      }
      phaseSpecGroups.get(key)!.push(agent);
    });
    
    // Add remaining groups, sorted by priority
    const sortedGroups = Array.from(phaseSpecGroups.values())
      .sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const aWeight = Math.max(...a.map(agent => priorityWeight[agent.priority as keyof typeof priorityWeight]));
        const bWeight = Math.max(...b.map(agent => priorityWeight[agent.priority as keyof typeof priorityWeight]));
        return bWeight - aWeight;
      });
    
    groups.push(...sortedGroups);
    
    return groups;
  }

  /**
   * Handle worktree creation events
   */
  private handleWorktreeCreated(event: { agent: string; branch: string; path: string }): void {
    console.log(`✅ Worktree created for ${event.agent}: ${event.branch}`);
    this.emit('orchestration:agent-ready', event);
  }

  /**
   * Handle worktree synchronization events
   */
  private handleWorktreeSynced(event: { agent: string; branch: string }): void {
    console.log(`🔄 Worktree synced for ${event.agent}: ${event.branch}`);
    this.checkAutoIntegration(event.agent);
  }

  /**
   * Handle integration merge events
   */
  private handleIntegrationMerged(event: { agent: string; branch: string; integrationBranch: string }): void {
    console.log(`🔀 Integration merged: ${event.agent} → ${event.integrationBranch}`);
    this.emit('orchestration:integration-completed', event);
  }

  /**
   * Handle worktree error events
   */
  private handleWorktreeError(event: { agent: string; error: string }): void {
    console.error(`❌ Worktree error for ${event.agent}: ${event.error}`);
    this.emit('orchestration:agent-error', event);
  }

  /**
   * Check if auto-integration should be triggered
   */
  private checkAutoIntegration(agentName: string): void {
    if (!this.config.autoIntegrationEnabled) return;

    const config = this.worktreeManager.loadWorktreeConfig(agentName);
    if (!config) return;

    const branchAwareness = this.worktreeManager.getBranchAwareness(agentName);
    if (!branchAwareness?.canAutoMerge) return;

    // Check if all peer agents are ready for integration
    const coordinationPath = join(config.workingDirectory, '.agents-workspace/config/coordination.json');
    if (!existsSync(coordinationPath)) return;

    const coordination = JSON.parse(readFileSync(coordinationPath, 'utf-8'));
    const peerAgents = coordination.peerAgents || [];
    
    const readyPeers = peerAgents.filter((peer: string) => {
      const peerConfig = this.worktreeManager.loadWorktreeConfig(peer);
      return peerConfig && this.isAgentReady(peer);
    });

    if (readyPeers.length === peerAgents.length) {
      // All peers ready, trigger integration
      this.triggerIntegration([agentName, ...peerAgents]);
    }
  }

  /**
   * Trigger integration for a group of agents
   */
  private async triggerIntegration(agentNames: string[]): Promise<void> {
    try {
      const integrationBranch = await this.worktreeManager.coordinateIntegration(agentNames);
      console.log(`🔀 Auto-integration triggered: ${agentNames.join(', ')} → ${integrationBranch}`);
      
      this.emit('orchestration:auto-integration', {
        agents: agentNames,
        integrationBranch
      });
      
    } catch (error) {
      console.error('Auto-integration failed:', (error as Error).message);
      this.emit('orchestration:integration-failed', {
        agents: agentNames,
        error: (error as Error).message
      });
    }
  }

  /**
   * Check if agent is ready for integration
   */
  private isAgentReady(agentName: string): boolean {
    const config = this.worktreeManager.loadWorktreeConfig(agentName);
    if (!config) return false;

    try {
      // Check if there are uncommitted changes
      const status = execSync('git status --porcelain', {
        cwd: config.workingDirectory,
        encoding: 'utf-8'
      });

      // Agent is ready if there are no uncommitted changes
      return status.trim().length === 0;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Collect coordination metrics
   */
  private collectMetrics(): void {
    const activeWorktrees = this.worktreeManager.listActiveWorktrees();
    
    const metrics: CoordinationMetrics = {
      totalAgents: activeWorktrees.length,
      activeWorktrees: activeWorktrees.length,
      integrationsPending: this.calculateIntegrationsPending(activeWorktrees),
      conflictsDetected: this.detectConflicts(activeWorktrees),
      averageCompletionTime: this.calculateAverageCompletionTime(),
      throughput: this.calculateThroughput(),
      utilizationRate: this.calculateUtilizationRate(activeWorktrees)
    };

    this.metricsHistory.push(metrics);
    
    // Keep only last 24 hours of metrics (288 5-minute intervals)
    if (this.metricsHistory.length > 288) {
      this.metricsHistory.shift();
    }

    this.emit('orchestration:metrics', metrics);
  }

  /**
   * Calculate number of pending integrations from git state
   */
  private calculateIntegrationsPending(activeWorktrees: Array<any>): number {
    let pendingCount = 0;
    
    for (const worktree of activeWorktrees) {
      try {
        // Check if worktree has commits ready for integration
        const agentConfig = this.worktreeManager.loadWorktreeConfig(worktree.agentName);
        if (agentConfig) {
          const branchAwareness = this.worktreeManager.getBranchAwareness(worktree.agentName);
          
          // Count branches with commits ahead of their base
          if (branchAwareness.commitsAhead > 0 && !branchAwareness.hasConflicts) {
            pendingCount++;
          }
        }
      } catch (error) {
        // Skip if unable to check git state
        console.warn(`Unable to check integration status for ${worktree.agentName}:`, (error as Error).message);
      }
    }
    
    return pendingCount;
  }

  /**
   * Detect conflicts across active worktrees
   */
  private detectConflicts(activeWorktrees: Array<any>): number {
    let conflictCount = 0;
    
    for (const worktree of activeWorktrees) {
      try {
        const branchAwareness = this.worktreeManager.getBranchAwareness(worktree.agentName);
        if (branchAwareness.hasConflicts) {
          conflictCount++;
        }
      } catch (error) {
        // Skip if unable to check git state
        console.warn(`Unable to check conflict status for ${worktree.agentName}:`, (error as Error).message);
      }
    }
    
    return conflictCount;
  }

  /**
   * Calculate average completion time from historical data
   */
  private calculateAverageCompletionTime(): number {
    if (this.metricsHistory.length < 2) {
      return 0;
    }
    
    // Calculate based on agent completion rates over time
    const recentMetrics = this.metricsHistory.slice(-12); // Last hour (12 * 5-minute intervals)
    let totalCompletionTime = 0;
    let completions = 0;
    
    for (let i = 1; i < recentMetrics.length; i++) {
      const previous = recentMetrics[i - 1];
      const current = recentMetrics[i];
      
      // If active agents decreased, some completed
      if (previous.activeWorktrees > current.activeWorktrees) {
        const completedAgents = previous.activeWorktrees - current.activeWorktrees;
        totalCompletionTime += 5; // 5 minutes per interval
        completions += completedAgents;
      }
    }
    
    return completions > 0 ? totalCompletionTime / completions : 0;
  }

  /**
   * Calculate throughput (commits per hour)
   */
  private calculateThroughput(): number {
    if (this.metricsHistory.length < 12) {
      return 0;
    }
    
    // Count integrations completed in the last hour
    const recentMetrics = this.metricsHistory.slice(-12); // Last hour
    let totalIntegrations = 0;
    
    for (let i = 1; i < recentMetrics.length; i++) {
      const previous = recentMetrics[i - 1];
      const current = recentMetrics[i];
      
      // If pending integrations decreased, they were completed
      if (previous.integrationsPending > current.integrationsPending) {
        totalIntegrations += previous.integrationsPending - current.integrationsPending;
      }
    }
    
    // Convert to commits per hour (12 intervals = 1 hour)
    return totalIntegrations;
  }

  /**
   * Calculate utilization rate from agent activity
   */
  private calculateUtilizationRate(activeWorktrees: Array<any>): number {
    if (activeWorktrees.length === 0) {
      return 0;
    }
    
    let activeAgents = 0;
    
    for (const worktree of activeWorktrees) {
      try {
        const branchAwareness = this.worktreeManager.getBranchAwareness(worktree.agentName);
        
        // Consider agent active if it has recent commits or pending changes
        if (branchAwareness.commitsAhead > 0 || branchAwareness.hasUncommittedChanges) {
          activeAgents++;
        }
      } catch (error) {
        // Skip if unable to check activity
        console.warn(`Unable to check activity for ${worktree.agentName}:`, (error as Error).message);
      }
    }
    
    // Return percentage of active agents
    return Math.round((activeAgents / Math.max(activeWorktrees.length, this.config.maxConcurrentAgents)) * 100);
  }

  /**
   * Check if flow adaptation is needed
   */
  private checkFlowAdaptation(): void {
    if (this.metricsHistory.length < 3) return; // Need some history

    const recent = this.metricsHistory.slice(-3);
    const avgConflicts = recent.reduce((sum, m) => sum + m.conflictsDetected, 0) / recent.length;
    const avgUtilization = recent.reduce((sum, m) => sum + m.utilizationRate, 0) / recent.length;

    // Simple adaptation logic - can be made more sophisticated
    if (avgConflicts > 0.1) {
      this.emit('orchestration:adaptation-needed', {
        reason: 'High conflict rate',
        recommendation: 'Switch to sequential flow',
        metrics: { conflicts: avgConflicts, utilization: avgUtilization }
      });
    }
  }

  // Utility methods
  private sortAgentsByDependencies<T extends { name: string; dependencies?: string[] }>(agents: Array<T>): Array<T> {
    const sorted: typeof agents = [];
    const remaining = [...agents];

    while (remaining.length > 0) {
      const nextBatch = remaining.filter(agent => 
        !agent.dependencies || 
        agent.dependencies.every(dep => sorted.some(s => s.name === dep))
      );

      if (nextBatch.length === 0) {
        // Circular dependency detected, add remaining agents
        sorted.push(...remaining);
        break;
      }

      sorted.push(...nextBatch);
      nextBatch.forEach(agent => {
        const index = remaining.indexOf(agent);
        remaining.splice(index, 1);
      });
    }

    return sorted;
  }

  private areDependenciesMet(dependencies: string[], deployed: string[]): boolean {
    return dependencies.every(dep => deployed.includes(dep));
  }

  private calculateConflictPriority(priority: string, phase: number): number {
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    return (priorityWeight[priority as keyof typeof priorityWeight] || 1) * phase;
  }

  private estimatePhaseHours(phase: number, agents: Array<{ specialization: string; priority: string }>): number {
    // Rough estimation based on phase complexity and agent specializations
    const baseHours = { 1: 40, 2: 60, 3: 30, 4: 20 }[phase] || 40;
    const specializationMultiplier = agents.reduce((sum, agent) => {
      const multipliers = {
        'cli-infrastructure': 1.0,
        'industrial-protocols': 1.5,
        'production-analytics': 1.2,
        'multi-modal': 1.8,
        'security-framework': 1.3,
        'knowledge-management': 1.1,
        'quality-assurance': 0.8,
        'coordination': 0.9
      };
      return sum + (multipliers[agent.specialization as keyof typeof multipliers] || 1.0);
    }, 0) / agents.length;

    return Math.round(baseHours * specializationMultiplier);
  }

  private estimateCompletionTime(deployedAgents: string[]): Date {
    // Simple estimation - can be made more sophisticated
    const baseHoursPerAgent = 8;
    const totalHours = deployedAgents.length * baseHoursPerAgent;
    const parallelizationFactor = Math.min(this.config.maxConcurrentAgents / deployedAgents.length, 1);
    const adjustedHours = totalHours * parallelizationFactor;
    
    return new Date(Date.now() + adjustedHours * 60 * 60 * 1000);
  }

  /**
   * Get current orchestration status
   */
  getOrchestrationStatus(): {
    config: OrchestrationConfig;
    metrics: CoordinationMetrics | null;
    activeAgents: string[];
  } {
    return {
      config: this.config,
      metrics: this.metricsHistory[this.metricsHistory.length - 1] || null,
      activeAgents: this.worktreeManager.listActiveWorktrees().map(w => w.agent)
    };
  }
}

export default WorktreeOrchestrator;