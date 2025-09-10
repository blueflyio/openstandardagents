/**
 * OSSA Graceful Shutdown Manager
 * Handles graceful shutdown with cleanup protocols, connection draining, and state preservation
 */

import { EventEmitter } from 'events';

export enum ShutdownPhase {
  PREPARATION = 'preparation',
  DRAIN_CONNECTIONS = 'drain_connections',
  FINISH_REQUESTS = 'finish_requests',
  CLEANUP_RESOURCES = 'cleanup_resources',
  SAVE_STATE = 'save_state',
  STOP_SERVICES = 'stop_services',
  FINAL_CLEANUP = 'final_cleanup',
  COMPLETE = 'complete'
}

export enum ShutdownReason {
  USER_INITIATED = 'user_initiated',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  HEALTH_CHECK_FAILED = 'health_check_failed',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  DEPLOYMENT = 'deployment',
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency'
}

export interface ShutdownConfig {
  gracefulTimeout: number; // Total time allowed for graceful shutdown
  phaseTimeouts: {
    [key in ShutdownPhase]: number;
  };
  drainTimeout: number; // Time to drain connections
  cleanupTimeout: number; // Time for cleanup tasks
  saveStateTimeout: number; // Time to save state
  forceKillTimeout: number; // Time before force kill
  retryAttempts: number; // Retry attempts for failed cleanup
  backoffDelay: number; // Delay between retries
  enableStatePreservation: boolean;
  enableConnectionDraining: boolean;
  enableResourceCleanup: boolean;
  emergencyShutdownTimeout: number; // Timeout for emergency shutdowns
}

export interface ShutdownTask {
  id: string;
  name: string;
  description: string;
  phase: ShutdownPhase;
  priority: number; // 1 = highest priority
  timeout: number;
  retryable: boolean;
  critical: boolean; // If true, failure will abort graceful shutdown
  dependencies: string[]; // Other tasks this depends on
  execute: (context: ShutdownContext) => Promise<void>;
}

export interface ShutdownContext {
  agentId: string;
  reason: ShutdownReason;
  startedAt: Date;
  phase: ShutdownPhase;
  timeRemaining: number;
  emergencyMode: boolean;
  preserveState: boolean;
  drainConnections: boolean;
  metadata: Record<string, any>;
}

export interface ShutdownProgress {
  agentId: string;
  phase: ShutdownPhase;
  progress: number; // 0-100
  currentTask: string | null;
  completedTasks: string[];
  failedTasks: string[];
  timeElapsed: number;
  timeRemaining: number;
  warnings: string[];
  errors: string[];
}

export interface ConnectionInfo {
  id: string;
  type: 'http' | 'websocket' | 'grpc' | 'tcp' | 'udp';
  remoteAddress: string;
  establishedAt: Date;
  lastActivity: Date;
  requestsInProgress: number;
  closeable: boolean;
}

export interface ResourceInfo {
  type: 'file' | 'database' | 'cache' | 'memory' | 'network' | 'process';
  id: string;
  description: string;
  size?: number;
  critical: boolean;
  cleanup: () => Promise<void>;
}

export interface StateSnapshot {
  agentId: string;
  timestamp: Date;
  version: string;
  data: any;
  metadata: {
    size: number;
    checksum: string;
    encrypted: boolean;
  };
}

export class ShutdownManager extends EventEmitter {
  private shutdowns: Map<string, ShutdownOperation> = new Map();
  private tasks: Map<string, ShutdownTask> = new Map();
  private connections: Map<string, ConnectionInfo[]> = new Map();
  private resources: Map<string, ResourceInfo[]> = new Map();
  private isShuttingDown = false;
  private globalShutdownOperation: ShutdownOperation | null = null;

  constructor(private config: ShutdownConfig) {
    super();
    this.initializeDefaultTasks();
    this.setupSignalHandlers();
  }

  /**
   * Initiate graceful shutdown for a specific agent
   */
  async initiateShutdown(
    agentId: string,
    reason: ShutdownReason,
    emergencyMode = false
  ): Promise<ShutdownOperation> {
    if (this.shutdowns.has(agentId)) {
      throw new Error(`Shutdown already in progress for agent ${agentId}`);
    }

    const operation = new ShutdownOperation(
      agentId,
      reason,
      emergencyMode,
      this.config,
      Array.from(this.tasks.values()),
      this.connections.get(agentId) || [],
      this.resources.get(agentId) || []
    );

    this.shutdowns.set(agentId, operation);

    // Set up event forwarding
    operation.on('phaseChanged', (event) => this.emit('phaseChanged', event));
    operation.on('taskCompleted', (event) => this.emit('taskCompleted', event));
    operation.on('taskFailed', (event) => this.emit('taskFailed', event));
    operation.on('warning', (event) => this.emit('warning', event));
    operation.on('error', (event) => this.emit('error', event));
    operation.on('completed', (event) => {
      this.shutdowns.delete(agentId);
      this.emit('shutdownCompleted', event);
    });

    // Start shutdown process
    const result = await operation.execute();
    
    return result;
  }

  /**
   * Initiate system-wide shutdown
   */
  async initiateSystemShutdown(reason: ShutdownReason): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('System shutdown already in progress');
    }

    this.isShuttingDown = true;
    this.emit('systemShutdownInitiated', { reason, timestamp: new Date() });

    const agentIds = Array.from(this.connections.keys())
      .concat(Array.from(this.resources.keys()))
      .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

    // Create global shutdown operation
    this.globalShutdownOperation = new ShutdownOperation(
      'system',
      reason,
      reason === ShutdownReason.EMERGENCY,
      this.config,
      Array.from(this.tasks.values()),
      [],
      []
    );

    try {
      // Shutdown agents in dependency order (simplified - would use actual dependency graph)
      for (const agentId of agentIds) {
        try {
          await this.initiateShutdown(agentId, reason);
        } catch (error) {
          this.emit('agentShutdownFailed', {
            agentId,
            error: error.message,
            timestamp: new Date()
          });
        }
      }

      this.emit('systemShutdownCompleted', { timestamp: new Date() });

    } finally {
      this.isShuttingDown = false;
      this.globalShutdownOperation = null;
    }
  }

  /**
   * Add a shutdown task
   */
  addTask(task: ShutdownTask): void {
    this.tasks.set(task.id, task);
    this.emit('taskAdded', { task, timestamp: new Date() });
  }

  /**
   * Remove a shutdown task
   */
  removeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.delete(taskId);
      this.emit('taskRemoved', { task, timestamp: new Date() });
    }
  }

  /**
   * Register connections for an agent
   */
  registerConnections(agentId: string, connections: ConnectionInfo[]): void {
    this.connections.set(agentId, connections);
  }

  /**
   * Register resources for an agent
   */
  registerResources(agentId: string, resources: ResourceInfo[]): void {
    this.resources.set(agentId, resources);
  }

  /**
   * Get shutdown progress for an agent
   */
  getShutdownProgress(agentId: string): ShutdownProgress | null {
    const operation = this.shutdowns.get(agentId);
    return operation ? operation.getProgress() : null;
  }

  /**
   * Cancel shutdown for an agent
   */
  cancelShutdown(agentId: string): void {
    const operation = this.shutdowns.get(agentId);
    if (operation) {
      operation.cancel();
      this.shutdowns.delete(agentId);
      this.emit('shutdownCancelled', { agentId, timestamp: new Date() });
    }
  }

  /**
   * Force shutdown (skip graceful process)
   */
  async forceShutdown(agentId: string): Promise<void> {
    const operation = this.shutdowns.get(agentId);
    if (operation) {
      await operation.forceKill();
    } else {
      // Create minimal operation for force shutdown
      const forceOperation = new ShutdownOperation(
        agentId,
        ShutdownReason.EMERGENCY,
        true,
        this.config,
        [],
        [],
        []
      );
      await forceOperation.forceKill();
    }
  }

  /**
   * Get overview of all shutdown operations
   */
  getShutdownOverview(): {
    active: number;
    completed: number;
    failed: number;
    averageTime: number;
    systemShutdown: boolean;
  } {
    const operations = Array.from(this.shutdowns.values());
    
    return {
      active: operations.filter(op => !op.isComplete()).length,
      completed: 0, // Would track in real implementation
      failed: 0, // Would track in real implementation
      averageTime: 0, // Would calculate from history
      systemShutdown: this.isShuttingDown
    };
  }

  // Private methods

  private setupSignalHandlers(): void {
    // Handle process signals for graceful shutdown
    process.on('SIGTERM', () => {
      this.initiateSystemShutdown(ShutdownReason.SYSTEM_SHUTDOWN);
    });

    process.on('SIGINT', () => {
      this.initiateSystemShutdown(ShutdownReason.USER_INITIATED);
    });

    process.on('SIGUSR2', () => {
      this.initiateSystemShutdown(ShutdownReason.MAINTENANCE);
    });
  }

  private initializeDefaultTasks(): void {
    const defaultTasks: ShutdownTask[] = [
      {
        id: 'stop_accepting_requests',
        name: 'Stop Accepting New Requests',
        description: 'Stop accepting new incoming requests',
        phase: ShutdownPhase.PREPARATION,
        priority: 1,
        timeout: 5000,
        retryable: false,
        critical: true,
        dependencies: [],
        execute: async (context: ShutdownContext) => {
          // Implementation would stop accepting new requests
          console.log(`[${context.agentId}] Stopped accepting new requests`);
        }
      },
      {
        id: 'drain_connections',
        name: 'Drain Connections',
        description: 'Gracefully close all connections',
        phase: ShutdownPhase.DRAIN_CONNECTIONS,
        priority: 1,
        timeout: 30000,
        retryable: true,
        critical: false,
        dependencies: ['stop_accepting_requests'],
        execute: async (context: ShutdownContext) => {
          // Implementation would drain connections
          console.log(`[${context.agentId}] Draining connections...`);
        }
      },
      {
        id: 'finish_in_progress_requests',
        name: 'Finish In-Progress Requests',
        description: 'Wait for in-progress requests to complete',
        phase: ShutdownPhase.FINISH_REQUESTS,
        priority: 1,
        timeout: 60000,
        retryable: false,
        critical: false,
        dependencies: ['drain_connections'],
        execute: async (context: ShutdownContext) => {
          // Implementation would wait for requests to finish
          console.log(`[${context.agentId}] Waiting for requests to finish...`);
        }
      },
      {
        id: 'cleanup_temp_files',
        name: 'Cleanup Temporary Files',
        description: 'Remove temporary files and directories',
        phase: ShutdownPhase.CLEANUP_RESOURCES,
        priority: 3,
        timeout: 10000,
        retryable: true,
        critical: false,
        dependencies: [],
        execute: async (context: ShutdownContext) => {
          // Implementation would cleanup temp files
          console.log(`[${context.agentId}] Cleaning up temporary files...`);
        }
      },
      {
        id: 'close_database_connections',
        name: 'Close Database Connections',
        description: 'Properly close all database connections',
        phase: ShutdownPhase.CLEANUP_RESOURCES,
        priority: 2,
        timeout: 15000,
        retryable: true,
        critical: false,
        dependencies: ['finish_in_progress_requests'],
        execute: async (context: ShutdownContext) => {
          // Implementation would close DB connections
          console.log(`[${context.agentId}] Closing database connections...`);
        }
      },
      {
        id: 'save_agent_state',
        name: 'Save Agent State',
        description: 'Persist current agent state for recovery',
        phase: ShutdownPhase.SAVE_STATE,
        priority: 1,
        timeout: 20000,
        retryable: true,
        critical: false,
        dependencies: ['cleanup_temp_files'],
        execute: async (context: ShutdownContext) => {
          if (context.preserveState) {
            // Implementation would save state
            console.log(`[${context.agentId}] Saving agent state...`);
          }
        }
      },
      {
        id: 'stop_background_services',
        name: 'Stop Background Services',
        description: 'Stop all background services and timers',
        phase: ShutdownPhase.STOP_SERVICES,
        priority: 1,
        timeout: 10000,
        retryable: false,
        critical: false,
        dependencies: ['save_agent_state'],
        execute: async (context: ShutdownContext) => {
          // Implementation would stop services
          console.log(`[${context.agentId}] Stopping background services...`);
        }
      },
      {
        id: 'final_cleanup',
        name: 'Final Cleanup',
        description: 'Perform final cleanup operations',
        phase: ShutdownPhase.FINAL_CLEANUP,
        priority: 1,
        timeout: 5000,
        retryable: false,
        critical: false,
        dependencies: ['stop_background_services'],
        execute: async (context: ShutdownContext) => {
          // Implementation would perform final cleanup
          console.log(`[${context.agentId}] Performing final cleanup...`);
        }
      }
    ];

    defaultTasks.forEach(task => this.addTask(task));
  }
}

class ShutdownOperation extends EventEmitter {
  private context: ShutdownContext;
  private progress: ShutdownProgress;
  private cancelled = false;
  private completed = false;
  private startTime: Date;

  constructor(
    private agentId: string,
    private reason: ShutdownReason,
    private emergencyMode: boolean,
    private config: ShutdownConfig,
    private tasks: ShutdownTask[],
    private connections: ConnectionInfo[],
    private resources: ResourceInfo[]
  ) {
    super();
    
    this.startTime = new Date();
    this.context = {
      agentId,
      reason,
      startedAt: this.startTime,
      phase: ShutdownPhase.PREPARATION,
      timeRemaining: emergencyMode ? config.emergencyShutdownTimeout : config.gracefulTimeout,
      emergencyMode,
      preserveState: config.enableStatePreservation && !emergencyMode,
      drainConnections: config.enableConnectionDraining && !emergencyMode,
      metadata: {}
    };

    this.progress = {
      agentId,
      phase: ShutdownPhase.PREPARATION,
      progress: 0,
      currentTask: null,
      completedTasks: [],
      failedTasks: [],
      timeElapsed: 0,
      timeRemaining: this.context.timeRemaining,
      warnings: [],
      errors: []
    };
  }

  async execute(): Promise<ShutdownOperation> {
    try {
      this.emit('started', {
        agentId: this.agentId,
        reason: this.reason,
        emergencyMode: this.emergencyMode,
        timestamp: this.startTime
      });

      if (this.emergencyMode) {
        await this.executeEmergencyShutdown();
      } else {
        await this.executeGracefulShutdown();
      }

      this.completed = true;
      this.progress.progress = 100;
      this.progress.phase = ShutdownPhase.COMPLETE;
      
      this.emit('completed', {
        agentId: this.agentId,
        duration: Date.now() - this.startTime.getTime(),
        success: this.progress.errors.length === 0,
        timestamp: new Date()
      });

    } catch (error) {
      this.progress.errors.push(error.message);
      this.emit('error', {
        agentId: this.agentId,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }

    return this;
  }

  async forceKill(): Promise<void> {
    this.emit('forceKillInitiated', {
      agentId: this.agentId,
      timestamp: new Date()
    });

    // Immediate cleanup without waiting
    try {
      // Force close connections
      await this.forceCloseConnections();
      
      // Force cleanup resources
      await this.forceCleanupResources();
      
      this.completed = true;
      this.progress.progress = 100;
      this.progress.phase = ShutdownPhase.COMPLETE;
      
      this.emit('forceKillCompleted', {
        agentId: this.agentId,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('forceKillFailed', {
        agentId: this.agentId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  cancel(): void {
    this.cancelled = true;
    this.emit('cancelled', {
      agentId: this.agentId,
      timestamp: new Date()
    });
  }

  getProgress(): ShutdownProgress {
    this.progress.timeElapsed = Date.now() - this.startTime.getTime();
    this.progress.timeRemaining = Math.max(0, this.context.timeRemaining - this.progress.timeElapsed);
    return { ...this.progress };
  }

  isComplete(): boolean {
    return this.completed;
  }

  // Private methods

  private async executeGracefulShutdown(): Promise<void> {
    const phases = Object.values(ShutdownPhase).filter(p => p !== ShutdownPhase.COMPLETE);
    const totalPhases = phases.length;

    for (let i = 0; i < phases.length; i++) {
      if (this.cancelled) break;

      const phase = phases[i];
      this.context.phase = phase;
      this.progress.phase = phase;
      this.progress.progress = (i / totalPhases) * 100;

      this.emit('phaseChanged', {
        agentId: this.agentId,
        phase,
        timestamp: new Date()
      });

      await this.executePhase(phase);
    }
  }

  private async executeEmergencyShutdown(): Promise<void> {
    // Emergency shutdown - execute only critical tasks quickly
    const criticalTasks = this.tasks.filter(t => t.critical);
    const timeout = this.config.emergencyShutdownTimeout / criticalTasks.length;

    for (const task of criticalTasks) {
      if (this.cancelled) break;

      try {
        await Promise.race([
          this.executeTask(task),
          this.createTimeout(timeout)
        ]);
      } catch (error) {
        this.progress.warnings.push(`Emergency task ${task.name} failed: ${error.message}`);
      }
    }
  }

  private async executePhase(phase: ShutdownPhase): Promise<void> {
    const phaseTasks = this.tasks
      .filter(t => t.phase === phase)
      .sort((a, b) => a.priority - b.priority);

    if (phaseTasks.length === 0) return;

    const phaseTimeout = this.config.phaseTimeouts[phase] || 30000;
    const phaseStartTime = Date.now();

    for (const task of phaseTasks) {
      if (this.cancelled) break;
      
      const remainingPhaseTime = phaseTimeout - (Date.now() - phaseStartTime);
      if (remainingPhaseTime <= 0) {
        this.progress.warnings.push(`Phase ${phase} timeout, skipping remaining tasks`);
        break;
      }

      // Check dependencies
      if (!this.areDependenciesMet(task)) {
        this.progress.warnings.push(`Task ${task.name} dependencies not met, skipping`);
        continue;
      }

      this.progress.currentTask = task.name;
      
      try {
        await Promise.race([
          this.executeTask(task),
          this.createTimeout(Math.min(task.timeout, remainingPhaseTime))
        ]);

        this.progress.completedTasks.push(task.id);
        this.emit('taskCompleted', {
          agentId: this.agentId,
          task: task.name,
          phase,
          timestamp: new Date()
        });

      } catch (error) {
        this.progress.failedTasks.push(task.id);
        
        if (task.critical) {
          this.progress.errors.push(`Critical task ${task.name} failed: ${error.message}`);
          throw new Error(`Critical shutdown task failed: ${task.name}`);
        } else {
          this.progress.warnings.push(`Task ${task.name} failed: ${error.message}`);
          this.emit('taskFailed', {
            agentId: this.agentId,
            task: task.name,
            error: error.message,
            phase,
            timestamp: new Date()
          });
        }
      }
    }

    this.progress.currentTask = null;
  }

  private async executeTask(task: ShutdownTask): Promise<void> {
    let attempts = 0;
    const maxAttempts = task.retryable ? this.config.retryAttempts : 1;

    while (attempts < maxAttempts) {
      try {
        await task.execute(this.context);
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.backoffDelay * attempts));
      }
    }
  }

  private areDependenciesMet(task: ShutdownTask): boolean {
    return task.dependencies.every(dep => 
      this.progress.completedTasks.includes(dep)
    );
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), ms);
    });
  }

  private async forceCloseConnections(): Promise<void> {
    const closePromises = this.connections.map(async conn => {
      try {
        // Implementation would force close connection
        console.log(`Force closing connection ${conn.id}`);
      } catch (error) {
        console.error(`Failed to force close connection ${conn.id}:`, error);
      }
    });

    await Promise.allSettled(closePromises);
  }

  private async forceCleanupResources(): Promise<void> {
    const cleanupPromises = this.resources.map(async resource => {
      try {
        await Promise.race([
          resource.cleanup(),
          this.createTimeout(1000) // 1 second max per resource
        ]);
      } catch (error) {
        console.error(`Failed to cleanup resource ${resource.id}:`, error);
      }
    });

    await Promise.allSettled(cleanupPromises);
  }
}

export default ShutdownManager;