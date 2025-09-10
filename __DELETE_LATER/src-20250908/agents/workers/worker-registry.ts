/**
 * Worker Registry - OSSA v0.1.8 Compliant
 * 
 * Central registry for managing worker agent lifecycle, discovery,
 * and orchestration with performance tracking and load balancing.
 * 
 * Features:
 * - Dynamic worker registration and deregistration
 * - Capability-based worker discovery and matching
 * - Load balancing and health monitoring
 * - Performance metrics collection and analysis
 * - Automated scaling and resource management
 */

import { EventEmitter } from 'events';
import { UADPDiscoveryEngine, UADPAgent } from '../../types/uadp-discovery';
import { BaseWorkerAgent } from './base-worker-agent';
import { TokenOptimizingWorkerAgent } from './token-optimizing-worker-agent';
import { SelfAssessingWorkerAgent } from './self-assessing-worker-agent';
import { SpecializedWorkerAgentFactory } from './specialized-worker-agents';
import {
  WorkerTask,
  WorkerExecutionResult,
  WorkerConfiguration,
  WorkerHealthStatus,
  WorkerPerformanceMetrics,
  WorkerCapability
} from './types';

export interface WorkerRegistryEntry {
  worker_id: string;
  worker_instance: BaseWorkerAgent;
  registration_time: number;
  last_heartbeat: number;
  status: 'active' | 'idle' | 'busy' | 'maintenance' | 'error';
  current_load: number; // 0-1 scale
  queue_length: number;
  capabilities: string[];
  specialization?: string;
  worker_type: string;
  performance_tier: 'bronze' | 'silver' | 'gold';
  cost_efficiency_score: number;
  reliability_score: number;
}

export interface WorkerDiscoveryOptions {
  required_capabilities?: string[];
  worker_types?: string[];
  specializations?: string[];
  performance_tier?: 'bronze' | 'silver' | 'gold';
  max_load_threshold?: number;
  min_reliability_score?: number;
  min_cost_efficiency?: number;
  exclude_worker_ids?: string[];
  max_results?: number;
  sort_by?: 'load' | 'performance' | 'cost_efficiency' | 'reliability';
  load_balancing_strategy?: 'round_robin' | 'least_loaded' | 'weighted' | 'random';
}

export interface WorkerAssignmentResult {
  assigned_worker: WorkerRegistryEntry;
  assignment_confidence: number;
  estimated_completion_time: number;
  assignment_metadata: {
    selection_criteria: string[];
    alternatives_considered: number;
    load_balancing_applied: boolean;
    cost_optimization_potential: number;
  };
}

export interface RegistryMetrics {
  total_workers: number;
  active_workers: number;
  busy_workers: number;
  average_load: number;
  total_capabilities_available: number;
  cost_efficiency_average: number;
  reliability_average: number;
  task_distribution: Record<string, number>;
  performance_tier_distribution: Record<string, number>;
}

export class WorkerRegistry extends EventEmitter {
  private registry: Map<string, WorkerRegistryEntry> = new Map();
  private discoveryEngine: UADPDiscoveryEngine;
  private heartbeat_interval: NodeJS.Timeout | null = null;
  private load_balancer_state: Map<string, number> = new Map(); // Round-robin counters
  
  // Configuration
  private heartbeat_timeout = 30000; // 30 seconds
  private max_workers_per_type = 10;
  private auto_scaling_enabled = true;
  private load_balancing_enabled = true;
  
  // Performance tracking
  private assignment_history: Array<{
    task_id: string;
    worker_id: string;
    assignment_time: number;
    completion_time?: number;
    success: boolean;
    cost_reduction_achieved: number;
  }> = [];

  constructor(discoveryEngine?: UADPDiscoveryEngine) {
    super();
    this.discoveryEngine = discoveryEngine || new UADPDiscoveryEngine();
    this.startHeartbeatMonitoring();
  }

  /**
   * Register a worker agent in the registry
   */
  async registerWorker(worker: BaseWorkerAgent, configuration?: {
    specialization?: string;
    performance_tier?: 'bronze' | 'silver' | 'gold';
    auto_start?: boolean;
  }): Promise<string> {
    const worker_id = worker.id;
    
    // Check if worker already registered
    if (this.registry.has(worker_id)) {
      throw new Error(`Worker ${worker_id} is already registered`);
    }

    // Get worker capabilities
    const capabilities = worker.getCapabilities();
    const capability_ids = capabilities.map(cap => cap.id);

    // Calculate initial performance scores
    const performance_metrics = worker.getPerformanceMetrics();
    const cost_efficiency_score = this.calculateCostEfficiencyScore(performance_metrics);
    const reliability_score = this.calculateReliabilityScore(performance_metrics);

    // Create registry entry
    const registry_entry: WorkerRegistryEntry = {
      worker_id,
      worker_instance: worker,
      registration_time: Date.now(),
      last_heartbeat: Date.now(),
      status: 'idle',
      current_load: 0,
      queue_length: 0,
      capabilities: capability_ids,
      specialization: configuration?.specialization,
      worker_type: worker.constructor.name,
      performance_tier: configuration?.performance_tier || 'bronze',
      cost_efficiency_score,
      reliability_score
    };

    // Register in local registry
    this.registry.set(worker_id, registry_entry);

    // Register with UADP discovery if available
    try {
      await this.discoveryEngine.registerAgent({
        name: worker.name,
        version: worker.version,
        endpoint: worker.endpoint,
        health_endpoint: worker.health_endpoint,
        capabilities_endpoint: worker.capabilities_endpoint,
        status: 'healthy',
        last_seen: new Date().toISOString(),
        metadata: {
          ...worker.metadata,
          specialization: configuration?.specialization,
          worker_type: worker.constructor.name
        },
        capabilities: capability_ids,
        protocols: worker.protocols,
        compliance_frameworks: worker.compliance_frameworks,
        performance_metrics: worker.performance_metrics,
        framework_integrations: worker.framework_integrations
      });
    } catch (error) {
      console.warn(`[WorkerRegistry] Failed to register with UADP discovery: ${error.message}`);
    }

    // Set up worker event listeners
    this.setupWorkerEventListeners(worker, registry_entry);

    // Auto-start worker if requested
    if (configuration?.auto_start !== false) {
      await this.startWorker(worker_id);
    }

    console.log(`[WorkerRegistry] Registered worker: ${worker_id} (type: ${registry_entry.worker_type})`);
    this.emit('worker_registered', { worker_id, registry_entry });

    return worker_id;
  }

  /**
   * Deregister a worker from the registry
   */
  async deregisterWorker(worker_id: string): Promise<void> {
    const entry = this.registry.get(worker_id);
    if (!entry) {
      throw new Error(`Worker ${worker_id} not found in registry`);
    }

    // Update status to maintenance
    entry.status = 'maintenance';
    
    // Remove event listeners
    entry.worker_instance.removeAllListeners();

    // Remove from registry
    this.registry.delete(worker_id);

    console.log(`[WorkerRegistry] Deregistered worker: ${worker_id}`);
    this.emit('worker_deregistered', { worker_id });
  }

  /**
   * Discover and select optimal worker for a task
   */
  async discoverWorker(
    task: WorkerTask,
    options?: WorkerDiscoveryOptions
  ): Promise<WorkerAssignmentResult | null> {
    // Filter workers based on options
    const eligible_workers = this.filterEligibleWorkers(task, options);
    
    if (eligible_workers.length === 0) {
      console.warn(`[WorkerRegistry] No eligible workers found for task: ${task.id}`);
      return null;
    }

    // Apply load balancing strategy
    const selected_worker = this.applyLoadBalancingStrategy(
      eligible_workers,
      options?.load_balancing_strategy || 'weighted'
    );

    // Calculate assignment metadata
    const assignment_confidence = this.calculateAssignmentConfidence(selected_worker, task);
    const estimated_completion_time = this.estimateCompletionTime(selected_worker, task);
    const cost_optimization_potential = this.calculateCostOptimizationPotential(selected_worker, task);

    return {
      assigned_worker: selected_worker,
      assignment_confidence,
      estimated_completion_time,
      assignment_metadata: {
        selection_criteria: this.getSelectionCriteria(task, options),
        alternatives_considered: eligible_workers.length - 1,
        load_balancing_applied: this.load_balancing_enabled,
        cost_optimization_potential
      }
    };
  }

  /**
   * Assign and execute task on selected worker
   */
  async assignTask(
    assignment_result: WorkerAssignmentResult,
    task: WorkerTask
  ): Promise<WorkerExecutionResult> {
    const { assigned_worker } = assignment_result;
    const start_time = Date.now();

    try {
      // Update worker status
      assigned_worker.status = 'busy';
      assigned_worker.current_load = Math.min(1.0, assigned_worker.current_load + 0.2);
      assigned_worker.queue_length++;

      // Execute task
      const result = await assigned_worker.worker_instance.execute(task);

      // Update assignment history
      this.assignment_history.push({
        task_id: task.id,
        worker_id: assigned_worker.worker_id,
        assignment_time: start_time,
        completion_time: Date.now(),
        success: result.status === 'completed',
        cost_reduction_achieved: result.optimization_applied.cost_savings_percentage
      });

      // Update worker metrics
      this.updateWorkerMetrics(assigned_worker, result, Date.now() - start_time);

      return result;

    } catch (error) {
      // Update assignment history with failure
      this.assignment_history.push({
        task_id: task.id,
        worker_id: assigned_worker.worker_id,
        assignment_time: start_time,
        completion_time: Date.now(),
        success: false,
        cost_reduction_achieved: 0
      });

      throw error;
    } finally {
      // Update worker status
      assigned_worker.status = 'idle';
      assigned_worker.current_load = Math.max(0, assigned_worker.current_load - 0.2);
      assigned_worker.queue_length = Math.max(0, assigned_worker.queue_length - 1);
    }
  }

  /**
   * Get all registered workers
   */
  getAllWorkers(): WorkerRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get worker by ID
   */
  getWorker(worker_id: string): WorkerRegistryEntry | null {
    return this.registry.get(worker_id) || null;
  }

  /**
   * Get workers by capability
   */
  getWorkersByCapability(capability: string): WorkerRegistryEntry[] {
    return Array.from(this.registry.values())
      .filter(entry => entry.capabilities.includes(capability));
  }

  /**
   * Get workers by type
   */
  getWorkersByType(worker_type: string): WorkerRegistryEntry[] {
    return Array.from(this.registry.values())
      .filter(entry => entry.worker_type === worker_type);
  }

  /**
   * Get registry statistics and metrics
   */
  getRegistryMetrics(): RegistryMetrics {
    const all_workers = Array.from(this.registry.values());
    
    const active_workers = all_workers.filter(w => w.status === 'active' || w.status === 'idle').length;
    const busy_workers = all_workers.filter(w => w.status === 'busy').length;
    const average_load = all_workers.reduce((sum, w) => sum + w.current_load, 0) / all_workers.length || 0;
    
    // Count unique capabilities
    const all_capabilities = new Set(all_workers.flatMap(w => w.capabilities));
    
    // Calculate averages
    const cost_efficiency_average = all_workers.reduce((sum, w) => sum + w.cost_efficiency_score, 0) / all_workers.length || 0;
    const reliability_average = all_workers.reduce((sum, w) => sum + w.reliability_score, 0) / all_workers.length || 0;

    // Task distribution from assignment history
    const recent_assignments = this.assignment_history.slice(-100); // Last 100 assignments
    const task_distribution: Record<string, number> = {};
    recent_assignments.forEach(assignment => {
      const worker = this.registry.get(assignment.worker_id);
      if (worker) {
        task_distribution[worker.worker_type] = (task_distribution[worker.worker_type] || 0) + 1;
      }
    });

    // Performance tier distribution
    const performance_tier_distribution: Record<string, number> = {
      bronze: 0,
      silver: 0,
      gold: 0
    };
    all_workers.forEach(worker => {
      performance_tier_distribution[worker.performance_tier]++;
    });

    return {
      total_workers: all_workers.length,
      active_workers,
      busy_workers,
      average_load,
      total_capabilities_available: all_capabilities.size,
      cost_efficiency_average,
      reliability_average,
      task_distribution,
      performance_tier_distribution
    };
  }

  /**
   * Start a worker (set to active status)
   */
  async startWorker(worker_id: string): Promise<void> {
    const entry = this.registry.get(worker_id);
    if (!entry) {
      throw new Error(`Worker ${worker_id} not found`);
    }

    entry.status = 'active';
    entry.last_heartbeat = Date.now();
    
    console.log(`[WorkerRegistry] Started worker: ${worker_id}`);
    this.emit('worker_started', { worker_id });
  }

  /**
   * Stop a worker (set to maintenance status)
   */
  async stopWorker(worker_id: string): Promise<void> {
    const entry = this.registry.get(worker_id);
    if (!entry) {
      throw new Error(`Worker ${worker_id} not found`);
    }

    entry.status = 'maintenance';
    
    console.log(`[WorkerRegistry] Stopped worker: ${worker_id}`);
    this.emit('worker_stopped', { worker_id });
  }

  /**
   * Health check all workers
   */
  async performHealthCheck(): Promise<Record<string, WorkerHealthStatus>> {
    const health_results: Record<string, WorkerHealthStatus> = {};
    
    for (const [worker_id, entry] of this.registry) {
      try {
        const health_status = await entry.worker_instance.healthCheck();
        health_results[worker_id] = health_status;
        
        // Update registry entry based on health
        entry.last_heartbeat = Date.now();
        if (health_status.status === 'unhealthy') {
          entry.status = 'error';
        } else if (entry.status === 'error' && health_status.status === 'healthy') {
          entry.status = 'idle';
        }
        
      } catch (error) {
        console.error(`[WorkerRegistry] Health check failed for ${worker_id}:`, error);
        entry.status = 'error';
        health_results[worker_id] = {
          worker_id,
          status: 'unhealthy',
          health_score: 0,
          last_health_check: Date.now(),
          performance_indicators: {
            response_time: 'poor',
            success_rate: 'poor',
            resource_usage: 'high',
            cost_efficiency: 'needs_improvement'
          },
          active_tasks: 0,
          queue_length: 0,
          recent_errors: []
        };
      }
    }
    
    return health_results;
  }

  /**
   * Create specialized workers using factory methods
   */
  async createSpecializedWorker(
    worker_type: 'code' | 'document' | 'analysis' | 'creative',
    specialization: string,
    configuration?: Partial<WorkerConfiguration>
  ): Promise<string> {
    const worker_id = `${worker_type}-${specialization}-${Date.now()}`;
    
    let worker: BaseWorkerAgent;
    
    switch (worker_type) {
      case 'code':
        worker = SpecializedWorkerAgentFactory.createCodeWorker(
          worker_id,
          specialization as any,
          configuration
        );
        break;
      case 'document':
        worker = SpecializedWorkerAgentFactory.createDocumentWorker(
          worker_id,
          specialization as any,
          configuration
        );
        break;
      case 'analysis':
        worker = SpecializedWorkerAgentFactory.createAnalysisWorker(
          worker_id,
          specialization as any,
          configuration
        );
        break;
      case 'creative':
        worker = SpecializedWorkerAgentFactory.createCreativeWorker(
          worker_id,
          specialization as any,
          configuration
        );
        break;
      default:
        throw new Error(`Unknown worker type: ${worker_type}`);
    }

    await this.registerWorker(worker, {
      specialization,
      performance_tier: 'silver', // Default for specialized workers
      auto_start: true
    });

    return worker_id;
  }

  /**
   * Auto-scale workers based on load
   */
  async autoScaleWorkers(): Promise<void> {
    if (!this.auto_scaling_enabled) return;

    const metrics = this.getRegistryMetrics();
    
    // Scale up if average load is high
    if (metrics.average_load > 0.8 && metrics.active_workers < this.max_workers_per_type * 4) {
      console.log(`[WorkerRegistry] Auto-scaling up - average load: ${metrics.average_load.toFixed(2)}`);
      
      // Create additional general-purpose workers
      await this.createSpecializedWorker('code', 'code_generation');
      await this.createSpecializedWorker('document', 'documentation');
    }
    
    // Scale down if load is consistently low
    if (metrics.average_load < 0.2 && metrics.active_workers > 2) {
      console.log(`[WorkerRegistry] Auto-scaling down - average load: ${metrics.average_load.toFixed(2)}`);
      
      // Find least utilized worker to stop
      const workers = this.getAllWorkers()
        .filter(w => w.status === 'idle')
        .sort((a, b) => a.current_load - b.current_load);
      
      if (workers.length > 0) {
        await this.stopWorker(workers[0].worker_id);
      }
    }
  }

  // Private helper methods

  private filterEligibleWorkers(task: WorkerTask, options?: WorkerDiscoveryOptions): WorkerRegistryEntry[] {
    let eligible = Array.from(this.registry.values())
      .filter(entry => entry.status === 'active' || entry.status === 'idle')
      .filter(entry => entry.capabilities.includes(task.required_capability));

    // Apply filters
    if (options?.worker_types) {
      eligible = eligible.filter(w => options.worker_types!.includes(w.worker_type));
    }

    if (options?.specializations) {
      eligible = eligible.filter(w => 
        w.specialization && options.specializations!.includes(w.specialization));
    }

    if (options?.performance_tier) {
      const tier_order = { bronze: 0, silver: 1, gold: 2 };
      const min_tier = tier_order[options.performance_tier];
      eligible = eligible.filter(w => tier_order[w.performance_tier] >= min_tier);
    }

    if (options?.max_load_threshold) {
      eligible = eligible.filter(w => w.current_load <= options.max_load_threshold!);
    }

    if (options?.min_reliability_score) {
      eligible = eligible.filter(w => w.reliability_score >= options.min_reliability_score!);
    }

    if (options?.min_cost_efficiency) {
      eligible = eligible.filter(w => w.cost_efficiency_score >= options.min_cost_efficiency!);
    }

    if (options?.exclude_worker_ids) {
      eligible = eligible.filter(w => !options.exclude_worker_ids!.includes(w.worker_id));
    }

    // Sort if requested
    if (options?.sort_by) {
      eligible = this.sortWorkers(eligible, options.sort_by);
    }

    // Limit results
    if (options?.max_results) {
      eligible = eligible.slice(0, options.max_results);
    }

    return eligible;
  }

  private sortWorkers(workers: WorkerRegistryEntry[], sort_by: string): WorkerRegistryEntry[] {
    switch (sort_by) {
      case 'load':
        return workers.sort((a, b) => a.current_load - b.current_load);
      case 'performance':
        return workers.sort((a, b) => b.reliability_score - a.reliability_score);
      case 'cost_efficiency':
        return workers.sort((a, b) => b.cost_efficiency_score - a.cost_efficiency_score);
      case 'reliability':
        return workers.sort((a, b) => b.reliability_score - a.reliability_score);
      default:
        return workers;
    }
  }

  private applyLoadBalancingStrategy(
    workers: WorkerRegistryEntry[],
    strategy: string
  ): WorkerRegistryEntry {
    switch (strategy) {
      case 'round_robin':
        return this.roundRobinSelection(workers);
      case 'least_loaded':
        return workers.sort((a, b) => a.current_load - b.current_load)[0];
      case 'weighted':
        return this.weightedSelection(workers);
      case 'random':
        return workers[Math.floor(Math.random() * workers.length)];
      default:
        return workers[0];
    }
  }

  private roundRobinSelection(workers: WorkerRegistryEntry[]): WorkerRegistryEntry {
    const key = workers.map(w => w.worker_type).join(',');
    const current_index = this.load_balancer_state.get(key) || 0;
    const selected_worker = workers[current_index % workers.length];
    this.load_balancer_state.set(key, current_index + 1);
    return selected_worker;
  }

  private weightedSelection(workers: WorkerRegistryEntry[]): WorkerRegistryEntry {
    // Calculate weights based on performance and availability
    const weights = workers.map(worker => {
      const load_factor = 1 - worker.current_load; // Higher weight for less loaded
      const performance_factor = worker.reliability_score;
      const efficiency_factor = worker.cost_efficiency_score;
      return load_factor * 0.4 + performance_factor * 0.3 + efficiency_factor * 0.3;
    });

    // Weighted random selection
    const total_weight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * total_weight;
    
    let cumulative_weight = 0;
    for (let i = 0; i < workers.length; i++) {
      cumulative_weight += weights[i];
      if (random <= cumulative_weight) {
        return workers[i];
      }
    }
    
    return workers[0]; // Fallback
  }

  private calculateAssignmentConfidence(worker: WorkerRegistryEntry, task: WorkerTask): number {
    let confidence = 0.7; // Base confidence

    // Capability match bonus
    if (worker.capabilities.includes(task.required_capability)) {
      confidence += 0.2;
    }

    // Performance tier bonus
    const tier_bonus = { bronze: 0, silver: 0.05, gold: 0.1 };
    confidence += tier_bonus[worker.performance_tier];

    // Load penalty
    confidence -= worker.current_load * 0.1;

    // Reliability bonus
    confidence += worker.reliability_score * 0.1;

    return Math.min(1, Math.max(0, confidence));
  }

  private estimateCompletionTime(worker: WorkerRegistryEntry, task: WorkerTask): number {
    const base_time = 2000; // Base 2 seconds
    const load_multiplier = 1 + worker.current_load;
    const efficiency_multiplier = 1 / Math.max(0.1, worker.cost_efficiency_score);
    
    return base_time * load_multiplier * efficiency_multiplier;
  }

  private calculateCostOptimizationPotential(worker: WorkerRegistryEntry, task: WorkerTask): number {
    // Check if worker has optimization capabilities
    if (worker.worker_instance instanceof TokenOptimizingWorkerAgent) {
      return 65; // High optimization potential
    } else if (worker.capabilities.includes('token_optimization')) {
      return 45; // Moderate optimization potential
    }
    return 20; // Basic optimization
  }

  private getSelectionCriteria(task: WorkerTask, options?: WorkerDiscoveryOptions): string[] {
    const criteria = [`required_capability:${task.required_capability}`];
    
    if (options?.worker_types) {
      criteria.push(`worker_types:${options.worker_types.join(',')}`);
    }
    if (options?.performance_tier) {
      criteria.push(`min_performance_tier:${options.performance_tier}`);
    }
    if (options?.load_balancing_strategy) {
      criteria.push(`load_balancing:${options.load_balancing_strategy}`);
    }
    
    return criteria;
  }

  private calculateCostEfficiencyScore(metrics: WorkerPerformanceMetrics): number {
    if (!metrics.cost_efficiency) return 0.5;
    
    return Math.min(1, Math.max(0, 
      metrics.cost_efficiency.cost_reduction_percentage / 65 // Normalize to 65% target
    ));
  }

  private calculateReliabilityScore(metrics: WorkerPerformanceMetrics): number {
    if (!metrics.reliability_metrics) return 0.8;
    
    return metrics.reliability_metrics.success_rate;
  }

  private setupWorkerEventListeners(worker: BaseWorkerAgent, entry: WorkerRegistryEntry): void {
    worker.on('task_started', (data) => {
      entry.current_load = Math.min(1.0, entry.current_load + 0.1);
      entry.status = 'busy';
    });

    worker.on('task_completed', (data) => {
      entry.current_load = Math.max(0, entry.current_load - 0.1);
      entry.status = entry.current_load > 0.1 ? 'busy' : 'idle';
      
      // Update performance scores
      const performance_metrics = worker.getPerformanceMetrics();
      entry.cost_efficiency_score = this.calculateCostEfficiencyScore(performance_metrics);
      entry.reliability_score = this.calculateReliabilityScore(performance_metrics);
    });

    worker.on('task_failed', (data) => {
      entry.current_load = Math.max(0, entry.current_load - 0.1);
      entry.status = 'idle';
      
      // Penalize reliability score
      entry.reliability_score = Math.max(0, entry.reliability_score * 0.95);
    });
  }

  private updateWorkerMetrics(
    entry: WorkerRegistryEntry,
    result: WorkerExecutionResult,
    execution_time: number
  ): void {
    // Update last heartbeat
    entry.last_heartbeat = Date.now();
    
    // Update performance tier based on recent performance
    if (entry.cost_efficiency_score > 0.8 && entry.reliability_score > 0.9) {
      entry.performance_tier = 'gold';
    } else if (entry.cost_efficiency_score > 0.6 && entry.reliability_score > 0.8) {
      entry.performance_tier = 'silver';
    } else {
      entry.performance_tier = 'bronze';
    }
  }

  private startHeartbeatMonitoring(): void {
    this.heartbeat_interval = setInterval(async () => {
      const now = Date.now();
      
      // Check for stale workers
      for (const [worker_id, entry] of this.registry) {
        if (now - entry.last_heartbeat > this.heartbeat_timeout) {
          console.warn(`[WorkerRegistry] Worker ${worker_id} heartbeat timeout`);
          entry.status = 'error';
          this.emit('worker_timeout', { worker_id });
        }
      }
      
      // Perform auto-scaling if enabled
      if (this.auto_scaling_enabled) {
        await this.autoScaleWorkers();
      }
      
    }, this.heartbeat_timeout / 2); // Check every 15 seconds
  }

  /**
   * Cleanup and shutdown the registry
   */
  async shutdown(): Promise<void> {
    if (this.heartbeat_interval) {
      clearInterval(this.heartbeat_interval);
      this.heartbeat_interval = null;
    }

    // Deregister all workers
    const worker_ids = Array.from(this.registry.keys());
    for (const worker_id of worker_ids) {
      await this.deregisterWorker(worker_id);
    }

    console.log('[WorkerRegistry] Shutdown completed');
  }
}