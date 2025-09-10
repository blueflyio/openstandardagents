/**
 * OSSA Dependency Resolution System
 * Advanced dependency management with circular detection, conflict resolution, and startup ordering
 */

import { EventEmitter } from 'events';

export enum DependencyType {
  HARD = 'hard',           // Required dependency - agent cannot start without it
  SOFT = 'soft',           // Optional dependency - agent can start but with reduced functionality
  PEER = 'peer',           // Peer dependency - should be at same level
  CIRCULAR = 'circular',   // Circular dependency detected
  CONDITIONAL = 'conditional' // Dependency based on configuration
}

export enum ResolutionStrategy {
  BREADTH_FIRST = 'breadth_first',
  DEPTH_FIRST = 'depth_first',
  PRIORITY_BASED = 'priority_based',
  TOPOLOGICAL = 'topological',
  PARALLEL = 'parallel'
}

export enum DependencyState {
  UNRESOLVED = 'unresolved',
  RESOLVING = 'resolving',
  RESOLVED = 'resolved',
  FAILED = 'failed',
  CIRCULAR = 'circular'
}

export interface DependencyConfig {
  resolutionStrategy: ResolutionStrategy;
  maxDepth: number;
  timeoutMs: number;
  enableCircularDetection: boolean;
  enableConflictResolution: boolean;
  enableParallelResolution: boolean;
  retryAttempts: number;
  backoffDelay: number;
  enableOptimizations: boolean;
}

export interface DependencySpec {
  id: string;
  name: string;
  version: string;
  type: DependencyType;
  agentId: string;
  endpoint?: string;
  healthEndpoint?: string;
  optional: boolean;
  conditions?: DependencyCondition[];
  constraints?: DependencyConstraint[];
  metadata: {
    priority: number;
    weight: number;
    criticality: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    description: string;
  };
}

export interface DependencyCondition {
  type: 'config' | 'environment' | 'feature_flag' | 'time' | 'custom';
  condition: string;
  value: any;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'matches';
}

export interface DependencyConstraint {
  type: 'version' | 'region' | 'resource' | 'capability' | 'custom';
  value: any;
  operator: string;
  description: string;
}

export interface DependencyNode {
  id: string;
  spec: DependencySpec;
  state: DependencyState;
  dependencies: string[]; // IDs of dependencies
  dependents: string[];   // IDs of dependents
  depth: number;
  resolvedAt?: Date;
  failureReason?: string;
  retryCount: number;
  lastRetry?: Date;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: Map<string, string[]>; // adjacency list
  roots: string[];              // nodes with no dependencies
  leaves: string[];             // nodes with no dependents
  cycles: CircularDependency[];
  metrics: {
    totalNodes: number;
    resolvedNodes: number;
    failedNodes: number;
    cyclicNodes: number;
    maxDepth: number;
    avgResolutionTime: number;
  };
}

export interface CircularDependency {
  id: string;
  cycle: string[];
  detectedAt: Date;
  severity: 'warning' | 'error' | 'critical';
  impact: string[];
  resolutionSuggestions: ResolutionSuggestion[];
}

export interface ResolutionSuggestion {
  type: 'break_cycle' | 'lazy_load' | 'decouple' | 'merge' | 'proxy';
  description: string;
  implementation: string;
  complexity: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface ResolutionPlan {
  id: string;
  strategy: ResolutionStrategy;
  phases: ResolutionPhase[];
  parallelGroups: string[][]; // Groups that can be resolved in parallel
  totalNodes: number;
  estimatedTime: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigations: string[];
  };
}

export interface ResolutionPhase {
  id: number;
  nodes: string[];
  type: 'sequential' | 'parallel';
  estimatedTime: number;
  dependencies: number[]; // Previous phases this depends on
}

export interface ResolutionResult {
  success: boolean;
  planId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  resolvedNodes: string[];
  failedNodes: string[];
  skippedNodes: string[];
  warnings: string[];
  errors: string[];
}

export interface DependencyConflict {
  type: 'version' | 'resource' | 'capability' | 'constraint';
  nodes: string[];
  description: string;
  severity: 'low' | 'medium' | 'high';
  autoResolvable: boolean;
  resolutions: ConflictResolution[];
}

export interface ConflictResolution {
  strategy: 'upgrade' | 'downgrade' | 'alternative' | 'proxy' | 'manual';
  description: string;
  impact: string;
  confidence: number;
  implementation: () => Promise<void>;
}

export class DependencyResolver extends EventEmitter {
  private graphs: Map<string, DependencyGraph> = new Map();
  private activeResolutions: Map<string, ResolutionOperation> = new Map();
  private resolutionCache: Map<string, ResolutionResult> = new Map();
  private conflictResolver: ConflictResolver;

  constructor(private config: DependencyConfig) {
    super();
    this.conflictResolver = new ConflictResolver();
  }

  /**
   * Build dependency graph for an agent and its dependencies
   */
  async buildDependencyGraph(
    agentId: string,
    dependencies: DependencySpec[]
  ): Promise<DependencyGraph> {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      roots: [],
      leaves: [],
      cycles: [],
      metrics: {
        totalNodes: 0,
        resolvedNodes: 0,
        failedNodes: 0,
        cyclicNodes: 0,
        maxDepth: 0,
        avgResolutionTime: 0
      }
    };

    // Add all dependencies as nodes
    for (const dep of dependencies) {
      const node: DependencyNode = {
        id: dep.id,
        spec: dep,
        state: DependencyState.UNRESOLVED,
        dependencies: [],
        dependents: [],
        depth: 0,
        retryCount: 0
      };

      graph.nodes.set(dep.id, node);
      graph.edges.set(dep.id, []);
    }

    // Build edges by resolving transitive dependencies
    await this.resolveTransitiveDependencies(graph, dependencies);

    // Calculate node depths
    this.calculateNodeDepths(graph);

    // Detect circular dependencies
    if (this.config.enableCircularDetection) {
      graph.cycles = this.detectCircularDependencies(graph);
    }

    // Find roots and leaves
    this.findRootsAndLeaves(graph);

    // Update metrics
    this.updateGraphMetrics(graph);

    this.graphs.set(agentId, graph);
    this.emit('graphBuilt', { agentId, graph, timestamp: new Date() });

    return graph;
  }

  /**
   * Resolve dependencies according to the specified strategy
   */
  async resolveDependencies(
    agentId: string,
    strategy?: ResolutionStrategy
  ): Promise<ResolutionResult> {
    const graph = this.graphs.get(agentId);
    if (!graph) {
      throw new Error(`No dependency graph found for agent ${agentId}`);
    }

    if (this.activeResolutions.has(agentId)) {
      throw new Error(`Resolution already in progress for agent ${agentId}`);
    }

    const resolveStrategy = strategy || this.config.resolutionStrategy;
    
    // Create resolution plan
    const plan = await this.createResolutionPlan(graph, resolveStrategy);
    
    // Check for conflicts
    const conflicts = this.detectConflicts(graph);
    if (conflicts.length > 0 && this.config.enableConflictResolution) {
      await this.resolveConflicts(conflicts);
    }

    // Execute resolution
    const operation = new ResolutionOperation(agentId, graph, plan, this.config);
    this.activeResolutions.set(agentId, operation);

    // Set up event forwarding
    operation.on('nodeResolved', (event) => this.emit('nodeResolved', event));
    operation.on('nodeFailed', (event) => this.emit('nodeFailed', event));
    operation.on('phaseCompleted', (event) => this.emit('phaseCompleted', event));

    try {
      const result = await operation.execute();
      
      // Cache result
      this.resolutionCache.set(agentId, result);
      
      this.emit('resolutionCompleted', { agentId, result, timestamp: new Date() });
      
      return result;

    } finally {
      this.activeResolutions.delete(agentId);
    }
  }

  /**
   * Get dependency graph for an agent
   */
  getDependencyGraph(agentId: string): DependencyGraph | null {
    return this.graphs.get(agentId) || null;
  }

  /**
   * Get circular dependencies for an agent
   */
  getCircularDependencies(agentId: string): CircularDependency[] {
    const graph = this.graphs.get(agentId);
    return graph ? graph.cycles : [];
  }

  /**
   * Get startup order based on dependency resolution
   */
  getStartupOrder(agentId: string): string[] {
    const graph = this.graphs.get(agentId);
    if (!graph) return [];

    return this.topologicalSort(graph);
  }

  /**
   * Get shutdown order (reverse of startup order)
   */
  getShutdownOrder(agentId: string): string[] {
    return this.getStartupOrder(agentId).reverse();
  }

  /**
   * Add dependency to existing graph
   */
  async addDependency(agentId: string, dependency: DependencySpec): Promise<void> {
    const graph = this.graphs.get(agentId);
    if (!graph) {
      throw new Error(`No dependency graph found for agent ${agentId}`);
    }

    // Add node
    const node: DependencyNode = {
      id: dependency.id,
      spec: dependency,
      state: DependencyState.UNRESOLVED,
      dependencies: [],
      dependents: [],
      depth: 0,
      retryCount: 0
    };

    graph.nodes.set(dependency.id, node);
    graph.edges.set(dependency.id, []);

    // Rebuild graph structure
    await this.rebuildGraph(graph);
    
    this.emit('dependencyAdded', { agentId, dependency, timestamp: new Date() });
  }

  /**
   * Remove dependency from graph
   */
  removeDependency(agentId: string, dependencyId: string): void {
    const graph = this.graphs.get(agentId);
    if (!graph) return;

    graph.nodes.delete(dependencyId);
    graph.edges.delete(dependencyId);

    // Remove references from other nodes
    for (const node of graph.nodes.values()) {
      node.dependencies = node.dependencies.filter(id => id !== dependencyId);
      node.dependents = node.dependents.filter(id => id !== dependencyId);
    }

    this.rebuildGraph(graph);
    
    this.emit('dependencyRemoved', { agentId, dependencyId, timestamp: new Date() });
  }

  /**
   * Check if dependencies are satisfied
   */
  areDependenciesSatisfied(agentId: string): boolean {
    const graph = this.graphs.get(agentId);
    if (!graph) return false;

    for (const node of graph.nodes.values()) {
      if (node.spec.type === DependencyType.HARD && node.state !== DependencyState.RESOLVED) {
        return false;
      }
    }

    return true;
  }

  // Private methods

  private async resolveTransitiveDependencies(
    graph: DependencyGraph,
    dependencies: DependencySpec[]
  ): Promise<void> {
    const visited = new Set<string>();
    
    for (const dep of dependencies) {
      if (!visited.has(dep.id)) {
        await this.discoverDependencies(graph, dep, visited, 0);
      }
    }
  }

  private async discoverDependencies(
    graph: DependencyGraph,
    dependency: DependencySpec,
    visited: Set<string>,
    depth: number
  ): Promise<void> {
    if (depth > this.config.maxDepth) {
      return;
    }

    visited.add(dependency.id);

    // Simulate dependency discovery - in real implementation,
    // this would query the dependency service or registry
    const transitiveDeps = await this.queryDependencies(dependency);
    
    for (const transDep of transitiveDeps) {
      if (!graph.nodes.has(transDep.id)) {
        const node: DependencyNode = {
          id: transDep.id,
          spec: transDep,
          state: DependencyState.UNRESOLVED,
          dependencies: [],
          dependents: [],
          depth: depth + 1,
          retryCount: 0
        };

        graph.nodes.set(transDep.id, node);
        graph.edges.set(transDep.id, []);
      }

      // Add edge
      const edges = graph.edges.get(dependency.id) || [];
      if (!edges.includes(transDep.id)) {
        edges.push(transDep.id);
        graph.edges.set(dependency.id, edges);
      }

      // Update node relationships
      const depNode = graph.nodes.get(dependency.id)!;
      const transNode = graph.nodes.get(transDep.id)!;
      
      if (!depNode.dependencies.includes(transDep.id)) {
        depNode.dependencies.push(transDep.id);
      }
      
      if (!transNode.dependents.includes(dependency.id)) {
        transNode.dependents.push(dependency.id);
      }

      // Recursively discover
      if (!visited.has(transDep.id)) {
        await this.discoverDependencies(graph, transDep, visited, depth + 1);
      }
    }
  }

  private async queryDependencies(dependency: DependencySpec): Promise<DependencySpec[]> {
    // Simulate querying dependency registry
    // In real implementation, this would make API calls to discover dependencies
    
    if (Math.random() > 0.7) { // 30% chance of having dependencies
      const numDeps = Math.floor(Math.random() * 3) + 1;
      const deps: DependencySpec[] = [];
      
      for (let i = 0; i < numDeps; i++) {
        deps.push({
          id: `${dependency.id}-dep-${i}`,
          name: `Dependency ${i} of ${dependency.name}`,
          version: '1.0.0',
          type: DependencyType.SOFT,
          agentId: `agent-${dependency.id}-dep-${i}`,
          optional: true,
          metadata: {
            priority: 5,
            weight: 1,
            criticality: 'medium',
            tags: ['transitive'],
            description: `Transitive dependency ${i}`
          }
        });
      }
      
      return deps;
    }
    
    return [];
  }

  private calculateNodeDepths(graph: DependencyGraph): void {
    const visited = new Set<string>();
    
    const calculateDepth = (nodeId: string, currentDepth: number): number => {
      if (visited.has(nodeId)) return currentDepth;
      
      visited.add(nodeId);
      const node = graph.nodes.get(nodeId)!;
      let maxDepth = currentDepth;
      
      for (const depId of node.dependencies) {
        const depDepth = calculateDepth(depId, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depDepth);
      }
      
      node.depth = maxDepth;
      return maxDepth;
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        calculateDepth(nodeId, 0);
      }
    }
  }

  private detectCircularDependencies(graph: DependencyGraph): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Circular dependency found
        const cycleStart = path.indexOf(nodeId);
        const cycle = [...path.slice(cycleStart), nodeId];
        
        cycles.push({
          id: `cycle-${Date.now()}-${Math.random()}`,
          cycle,
          detectedAt: new Date(),
          severity: this.getCycleSeverity(cycle, graph),
          impact: this.calculateCycleImpact(cycle, graph),
          resolutionSuggestions: this.generateResolutionSuggestions(cycle, graph)
        });
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = graph.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          dfs(depId, [...path]);
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  private getCycleSeverity(cycle: string[], graph: DependencyGraph): CircularDependency['severity'] {
    let hasHardDependency = false;
    let hasCriticalNode = false;

    for (const nodeId of cycle) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        if (node.spec.type === DependencyType.HARD) {
          hasHardDependency = true;
        }
        if (node.spec.metadata.criticality === 'critical') {
          hasCriticalNode = true;
        }
      }
    }

    if (hasCriticalNode) return 'critical';
    if (hasHardDependency) return 'error';
    return 'warning';
  }

  private calculateCycleImpact(cycle: string[], graph: DependencyGraph): string[] {
    const impact: string[] = [];
    
    for (const nodeId of cycle) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        impact.push(...node.dependents);
      }
    }

    return [...new Set(impact)]; // Remove duplicates
  }

  private generateResolutionSuggestions(
    cycle: string[],
    graph: DependencyGraph
  ): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];

    // Suggest breaking the cycle at the weakest link
    const weakestLink = this.findWeakestLinkInCycle(cycle, graph);
    if (weakestLink) {
      suggestions.push({
        type: 'break_cycle',
        description: `Break cycle by removing or making optional the dependency: ${weakestLink}`,
        implementation: 'Change dependency type to SOFT or CONDITIONAL',
        complexity: 'low',
        impact: 'low'
      });
    }

    // Suggest lazy loading
    suggestions.push({
      type: 'lazy_load',
      description: 'Implement lazy loading for one of the dependencies in the cycle',
      implementation: 'Use lazy initialization pattern',
      complexity: 'medium',
      impact: 'low'
    });

    // Suggest decoupling
    suggestions.push({
      type: 'decouple',
      description: 'Introduce an intermediary service to decouple the cycle',
      implementation: 'Create a proxy or event-based communication',
      complexity: 'high',
      impact: 'medium'
    });

    return suggestions;
  }

  private findWeakestLinkInCycle(cycle: string[], graph: DependencyGraph): string | null {
    let weakestLink: string | null = null;
    let lowestPriority = Infinity;

    for (let i = 0; i < cycle.length - 1; i++) {
      const current = cycle[i];
      const next = cycle[i + 1];
      
      const currentNode = graph.nodes.get(current);
      if (currentNode) {
        const priority = currentNode.spec.metadata.priority;
        if (priority < lowestPriority) {
          lowestPriority = priority;
          weakestLink = `${current} -> ${next}`;
        }
      }
    }

    return weakestLink;
  }

  private findRootsAndLeaves(graph: DependencyGraph): void {
    graph.roots = [];
    graph.leaves = [];

    for (const [nodeId, node] of graph.nodes) {
      if (node.dependencies.length === 0) {
        graph.roots.push(nodeId);
      }
      if (node.dependents.length === 0) {
        graph.leaves.push(nodeId);
      }
    }
  }

  private updateGraphMetrics(graph: DependencyGraph): void {
    graph.metrics.totalNodes = graph.nodes.size;
    graph.metrics.resolvedNodes = Array.from(graph.nodes.values())
      .filter(n => n.state === DependencyState.RESOLVED).length;
    graph.metrics.failedNodes = Array.from(graph.nodes.values())
      .filter(n => n.state === DependencyState.FAILED).length;
    graph.metrics.cyclicNodes = Array.from(graph.nodes.values())
      .filter(n => n.state === DependencyState.CIRCULAR).length;
    graph.metrics.maxDepth = Math.max(...Array.from(graph.nodes.values()).map(n => n.depth));
  }

  private async createResolutionPlan(
    graph: DependencyGraph,
    strategy: ResolutionStrategy
  ): Promise<ResolutionPlan> {
    const plan: ResolutionPlan = {
      id: `plan-${Date.now()}`,
      strategy,
      phases: [],
      parallelGroups: [],
      totalNodes: graph.nodes.size,
      estimatedTime: 0,
      riskAssessment: {
        level: 'low',
        factors: [],
        mitigations: []
      }
    };

    switch (strategy) {
      case ResolutionStrategy.TOPOLOGICAL:
        plan.phases = this.createTopologicalPhases(graph);
        break;
      case ResolutionStrategy.BREADTH_FIRST:
        plan.phases = this.createBreadthFirstPhases(graph);
        break;
      case ResolutionStrategy.DEPTH_FIRST:
        plan.phases = this.createDepthFirstPhases(graph);
        break;
      case ResolutionStrategy.PRIORITY_BASED:
        plan.phases = this.createPriorityBasedPhases(graph);
        break;
      case ResolutionStrategy.PARALLEL:
        plan.phases = this.createParallelPhases(graph);
        break;
    }

    // Calculate estimated time
    plan.estimatedTime = plan.phases.reduce((sum, phase) => sum + phase.estimatedTime, 0);

    // Assess risks
    plan.riskAssessment = this.assessResolutionRisk(graph);

    return plan;
  }

  private createTopologicalPhases(graph: DependencyGraph): ResolutionPhase[] {
    const phases: ResolutionPhase[] = [];
    const sorted = this.topologicalSort(graph);
    const visited = new Set<string>();

    let phaseId = 0;
    while (visited.size < sorted.length) {
      const phaseNodes: string[] = [];
      
      for (const nodeId of sorted) {
        if (visited.has(nodeId)) continue;
        
        const node = graph.nodes.get(nodeId)!;
        const allDepsVisited = node.dependencies.every(depId => visited.has(depId));
        
        if (allDepsVisited) {
          phaseNodes.push(nodeId);
          visited.add(nodeId);
        }
      }

      if (phaseNodes.length > 0) {
        phases.push({
          id: phaseId++,
          nodes: phaseNodes,
          type: 'parallel',
          estimatedTime: this.estimatePhaseTime(phaseNodes, graph),
          dependencies: phaseId > 0 ? [phaseId - 1] : []
        });
      }
    }

    return phases;
  }

  private createBreadthFirstPhases(graph: DependencyGraph): ResolutionPhase[] {
    const phases: ResolutionPhase[] = [];
    const visited = new Set<string>();
    const queue = [...graph.roots];
    let phaseId = 0;

    while (queue.length > 0) {
      const phaseNodes: string[] = [];
      const queueSize = queue.length;

      for (let i = 0; i < queueSize; i++) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;

        visited.add(nodeId);
        phaseNodes.push(nodeId);

        const node = graph.nodes.get(nodeId)!;
        for (const dependent of node.dependents) {
          if (!visited.has(dependent)) {
            queue.push(dependent);
          }
        }
      }

      if (phaseNodes.length > 0) {
        phases.push({
          id: phaseId++,
          nodes: phaseNodes,
          type: 'parallel',
          estimatedTime: this.estimatePhaseTime(phaseNodes, graph),
          dependencies: phaseId > 0 ? [phaseId - 1] : []
        });
      }
    }

    return phases;
  }

  private createDepthFirstPhases(graph: DependencyGraph): ResolutionPhase[] {
    // Implementation for depth-first phases
    return this.createTopologicalPhases(graph); // Simplified
  }

  private createPriorityBasedPhases(graph: DependencyGraph): ResolutionPhase[] {
    const phases: ResolutionPhase[] = [];
    const nodes = Array.from(graph.nodes.values());
    
    // Sort by priority
    nodes.sort((a, b) => b.spec.metadata.priority - a.spec.metadata.priority);
    
    // Group by priority level
    const priorityGroups = new Map<number, string[]>();
    for (const node of nodes) {
      const priority = node.spec.metadata.priority;
      if (!priorityGroups.has(priority)) {
        priorityGroups.set(priority, []);
      }
      priorityGroups.get(priority)!.push(node.id);
    }

    let phaseId = 0;
    for (const [priority, nodeIds] of Array.from(priorityGroups.entries()).reverse()) {
      phases.push({
        id: phaseId++,
        nodes: nodeIds,
        type: 'parallel',
        estimatedTime: this.estimatePhaseTime(nodeIds, graph),
        dependencies: phaseId > 0 ? [phaseId - 1] : []
      });
    }

    return phases;
  }

  private createParallelPhases(graph: DependencyGraph): ResolutionPhase[] {
    // Create single phase with all independent nodes
    const independentNodes = this.findIndependentNodes(graph);
    
    return [{
      id: 0,
      nodes: independentNodes,
      type: 'parallel',
      estimatedTime: this.estimatePhaseTime(independentNodes, graph),
      dependencies: []
    }];
  }

  private findIndependentNodes(graph: DependencyGraph): string[] {
    const independent: string[] = [];
    
    for (const [nodeId, node] of graph.nodes) {
      if (node.dependencies.length === 0 || node.spec.optional) {
        independent.push(nodeId);
      }
    }
    
    return independent;
  }

  private topologicalSort(graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string): void => {
      if (temp.has(nodeId)) return; // Skip if already in current path
      if (visited.has(nodeId)) return;

      temp.add(nodeId);
      const node = graph.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          visit(depId);
        }
      }
      temp.delete(nodeId);
      visited.add(nodeId);
      result.push(nodeId);
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return result.reverse();
  }

  private estimatePhaseTime(nodeIds: string[], graph: DependencyGraph): number {
    // Simple estimation based on node complexity and count
    let totalTime = 0;
    
    for (const nodeId of nodeIds) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        const baseTime = 1000; // 1 second base
        const complexityMultiplier = {
          'low': 1,
          'medium': 2,
          'high': 4,
          'critical': 8
        }[node.spec.metadata.criticality] || 1;
        
        totalTime += baseTime * complexityMultiplier;
      }
    }
    
    return totalTime;
  }

  private assessResolutionRisk(graph: DependencyGraph): ResolutionPlan['riskAssessment'] {
    const factors: string[] = [];
    const mitigations: string[] = [];
    
    if (graph.cycles.length > 0) {
      factors.push('Circular dependencies detected');
      mitigations.push('Implement lazy loading or break cycles');
    }
    
    const hardDeps = Array.from(graph.nodes.values())
      .filter(n => n.spec.type === DependencyType.HARD).length;
    
    if (hardDeps > 10) {
      factors.push('High number of hard dependencies');
      mitigations.push('Consider making some dependencies optional');
    }
    
    if (graph.metrics.maxDepth > 5) {
      factors.push('Deep dependency tree');
      mitigations.push('Consider flattening dependency structure');
    }

    const level = factors.length === 0 ? 'low' : factors.length < 3 ? 'medium' : 'high';

    return { level, factors, mitigations };
  }

  private detectConflicts(graph: DependencyGraph): DependencyConflict[] {
    const conflicts: DependencyConflict[] = [];
    
    // Simple conflict detection - in real implementation would be more sophisticated
    const versions = new Map<string, string[]>();
    
    for (const node of graph.nodes.values()) {
      const name = node.spec.name;
      if (!versions.has(name)) {
        versions.set(name, []);
      }
      versions.get(name)!.push(node.spec.version);
    }

    for (const [name, versionList] of versions) {
      const uniqueVersions = [...new Set(versionList)];
      if (uniqueVersions.length > 1) {
        conflicts.push({
          type: 'version',
          nodes: Array.from(graph.nodes.values())
            .filter(n => n.spec.name === name)
            .map(n => n.id),
          description: `Version conflict for ${name}: ${uniqueVersions.join(', ')}`,
          severity: 'medium',
          autoResolvable: true,
          resolutions: [
            {
              strategy: 'upgrade',
              description: 'Upgrade all to latest version',
              impact: 'May introduce breaking changes',
              confidence: 0.7,
              implementation: async () => {
                console.log(`Upgrading ${name} to latest version`);
              }
            }
          ]
        });
      }
    }

    return conflicts;
  }

  private async resolveConflicts(conflicts: DependencyConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      if (conflict.autoResolvable && conflict.resolutions.length > 0) {
        const resolution = conflict.resolutions[0]; // Use first resolution
        try {
          await resolution.implementation();
          this.emit('conflictResolved', { conflict, resolution, timestamp: new Date() });
        } catch (error) {
          this.emit('conflictResolutionFailed', { 
            conflict, 
            resolution, 
            error: error.message, 
            timestamp: new Date() 
          });
        }
      }
    }
  }

  private async rebuildGraph(graph: DependencyGraph): Promise<void> {
    // Recalculate depths, find roots/leaves, detect cycles, etc.
    this.calculateNodeDepths(graph);
    this.findRootsAndLeaves(graph);
    
    if (this.config.enableCircularDetection) {
      graph.cycles = this.detectCircularDependencies(graph);
    }
    
    this.updateGraphMetrics(graph);
  }
}

class ResolutionOperation extends EventEmitter {
  private startTime: Date = new Date();
  
  constructor(
    private agentId: string,
    private graph: DependencyGraph,
    private plan: ResolutionPlan,
    private config: DependencyConfig
  ) {
    super();
  }

  async execute(): Promise<ResolutionResult> {
    const result: ResolutionResult = {
      success: false,
      planId: this.plan.id,
      startTime: this.startTime,
      endTime: new Date(),
      duration: 0,
      resolvedNodes: [],
      failedNodes: [],
      skippedNodes: [],
      warnings: [],
      errors: []
    };

    try {
      // Execute phases
      for (const phase of this.plan.phases) {
        await this.executePhase(phase, result);
        
        this.emit('phaseCompleted', {
          agentId: this.agentId,
          phase: phase.id,
          timestamp: new Date()
        });
      }

      result.success = result.failedNodes.length === 0;

    } catch (error) {
      result.errors.push(error.message);
      result.success = false;
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    return result;
  }

  private async executePhase(phase: ResolutionPhase, result: ResolutionResult): Promise<void> {
    if (phase.type === 'parallel' && this.config.enableParallelResolution) {
      await this.executePhaseParallel(phase, result);
    } else {
      await this.executePhaseSequential(phase, result);
    }
  }

  private async executePhaseParallel(phase: ResolutionPhase, result: ResolutionResult): Promise<void> {
    const promises = phase.nodes.map(nodeId => this.resolveNode(nodeId));
    const results = await Promise.allSettled(promises);

    results.forEach((nodeResult, index) => {
      const nodeId = phase.nodes[index];
      if (nodeResult.status === 'fulfilled') {
        result.resolvedNodes.push(nodeId);
        this.emit('nodeResolved', { agentId: this.agentId, nodeId, timestamp: new Date() });
      } else {
        result.failedNodes.push(nodeId);
        result.errors.push(`Failed to resolve ${nodeId}: ${nodeResult.reason}`);
        this.emit('nodeFailed', { 
          agentId: this.agentId, 
          nodeId, 
          error: nodeResult.reason, 
          timestamp: new Date() 
        });
      }
    });
  }

  private async executePhaseSequential(phase: ResolutionPhase, result: ResolutionResult): Promise<void> {
    for (const nodeId of phase.nodes) {
      try {
        await this.resolveNode(nodeId);
        result.resolvedNodes.push(nodeId);
        this.emit('nodeResolved', { agentId: this.agentId, nodeId, timestamp: new Date() });
      } catch (error) {
        result.failedNodes.push(nodeId);
        result.errors.push(`Failed to resolve ${nodeId}: ${error.message}`);
        this.emit('nodeFailed', { 
          agentId: this.agentId, 
          nodeId, 
          error: error.message, 
          timestamp: new Date() 
        });
        
        // For sequential execution, we might want to stop on critical failures
        const node = this.graph.nodes.get(nodeId);
        if (node && node.spec.metadata.criticality === 'critical') {
          throw error;
        }
      }
    }
  }

  private async resolveNode(nodeId: string): Promise<void> {
    const node = this.graph.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    node.state = DependencyState.RESOLVING;

    try {
      // Check conditions
      if (!this.evaluateConditions(node.spec)) {
        node.state = DependencyState.RESOLVED; // Skip if conditions not met
        return;
      }

      // Simulate resolution - in real implementation would start the dependency
      await this.performResolution(node.spec);
      
      node.state = DependencyState.RESOLVED;
      node.resolvedAt = new Date();

    } catch (error) {
      node.state = DependencyState.FAILED;
      node.failureReason = error.message;
      node.retryCount++;
      node.lastRetry = new Date();
      
      // Retry logic
      if (node.retryCount < this.config.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.config.backoffDelay * node.retryCount));
        return this.resolveNode(nodeId); // Retry
      }
      
      throw error;
    }
  }

  private evaluateConditions(spec: DependencySpec): boolean {
    if (!spec.conditions) return true;

    return spec.conditions.every(condition => {
      // Simplified condition evaluation
      switch (condition.type) {
        case 'config':
          // Check configuration value
          return true; // Simplified
        case 'environment':
          // Check environment variable
          return process.env[condition.condition] === condition.value;
        default:
          return true;
      }
    });
  }

  private async performResolution(spec: DependencySpec): Promise<void> {
    // Simulate dependency resolution
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
    
    // Simulate random failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Failed to resolve ${spec.name}`);
    }
  }
}

class ConflictResolver {
  async resolve(conflicts: DependencyConflict[]): Promise<void> {
    // Implementation for conflict resolution
    for (const conflict of conflicts) {
      console.log(`Resolving conflict: ${conflict.description}`);
    }
  }
}

export default DependencyResolver;