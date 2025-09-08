/**
 * OSSA Agent Lifecycle Management System
 * Comprehensive lifecycle management with health monitoring, graceful shutdown,
 * hot-swapping, dependency resolution, and failure detection
 */

export { default as LifecycleManager, LifecycleState, HealthStatus, FailureDetectionTier, FailureAction } from './lifecycle-manager.js';
export { default as HeartbeatMonitor } from './heartbeat-monitor.js';
export { default as FailureDetector } from './failure-detector.js';
export { default as ShutdownManager, ShutdownPhase, ShutdownReason } from './shutdown-manager.js';
export { default as HotSwapManager, SwapPhase, SwapStrategy, CompatibilityLevel } from './hot-swap-manager.js';
export { default as DependencyResolver, DependencyType, ResolutionStrategy, DependencyState } from './dependency-resolver.js';
export { default as HealthCheckSystem, CheckType, CheckProtocol } from './health-check-system.js';

// Re-export key types and interfaces
export type {
  LifecycleAgent,
  HeartbeatConfig,
  FailureDetectionConfig,
  ShutdownConfig,
  HotSwapConfig,
  DependencyConfig,
  HealthCheckConfig,
  LifecycleEvent,
  HeartbeatEvent,
  FailureEvent,
  ShutdownProgress,
  SwapOperation,
  DependencyGraph,
  HealthResult,
  HealthSummary
} from './lifecycle-manager.js';

import LifecycleManager from './lifecycle-manager.js';
import HeartbeatMonitor from './heartbeat-monitor.js';
import FailureDetector from './failure-detector.js';
import ShutdownManager from './shutdown-manager.js';
import HotSwapManager from './hot-swap-manager.js';
import DependencyResolver from './dependency-resolver.js';
import HealthCheckSystem from './health-check-system.js';

/**
 * Integrated Lifecycle Management System
 * Combines all lifecycle components into a unified system
 */
export class IntegratedLifecycleSystem {
  private lifecycleManager: LifecycleManager;
  private heartbeatMonitor: HeartbeatMonitor;
  private failureDetector: FailureDetector;
  private shutdownManager: ShutdownManager;
  private hotSwapManager: HotSwapManager;
  private dependencyResolver: DependencyResolver;
  private healthCheckSystem: HealthCheckSystem;

  constructor(config: {
    lifecycle: any;
    heartbeat: any;
    failureDetection: any;
    shutdown: any;
    hotSwap: any;
    dependency: any;
  }) {
    // Initialize all components
    this.lifecycleManager = new LifecycleManager(config.lifecycle);
    this.heartbeatMonitor = new HeartbeatMonitor(config.heartbeat);
    this.failureDetector = new FailureDetector(config.failureDetection);
    this.shutdownManager = new ShutdownManager(config.shutdown);
    this.hotSwapManager = new HotSwapManager(config.hotSwap);
    this.dependencyResolver = new DependencyResolver(config.dependency);
    this.healthCheckSystem = new HealthCheckSystem();

    // Wire up event handlers
    this.setupEventHandlers();
  }

  /**
   * Get lifecycle manager instance
   */
  getLifecycleManager(): LifecycleManager {
    return this.lifecycleManager;
  }

  /**
   * Get heartbeat monitor instance
   */
  getHeartbeatMonitor(): HeartbeatMonitor {
    return this.heartbeatMonitor;
  }

  /**
   * Get failure detector instance
   */
  getFailureDetector(): FailureDetector {
    return this.failureDetector;
  }

  /**
   * Get shutdown manager instance
   */
  getShutdownManager(): ShutdownManager {
    return this.shutdownManager;
  }

  /**
   * Get hot swap manager instance
   */
  getHotSwapManager(): HotSwapManager {
    return this.hotSwapManager;
  }

  /**
   * Get dependency resolver instance
   */
  getDependencyResolver(): DependencyResolver {
    return this.dependencyResolver;
  }

  /**
   * Get health check system instance
   */
  getHealthCheckSystem(): HealthCheckSystem {
    return this.healthCheckSystem;
  }

  /**
   * Start the integrated lifecycle system
   */
  async start(): Promise<void> {
    // Start all components
    this.heartbeatMonitor.start();
    this.healthCheckSystem.start();
    
    console.log('Integrated Lifecycle Management System started');
  }

  /**
   * Stop the integrated lifecycle system
   */
  async stop(): Promise<void> {
    // Graceful shutdown of all components
    await this.shutdownManager.initiateSystemShutdown('system_shutdown' as any);
    
    this.heartbeatMonitor.stop();
    this.healthCheckSystem.stop();
    
    console.log('Integrated Lifecycle Management System stopped');
  }

  /**
   * Get system health overview
   */
  getSystemHealth(): {
    overall: string;
    components: Record<string, any>;
    agents: any;
    dependencies: any;
  } {
    const systemHealth = this.lifecycleManager.getSystemHealth();
    const heartbeatOverview = this.heartbeatMonitor.getOverview();
    const failureOverview = this.failureDetector.getDetectionOverview();
    const shutdownOverview = this.shutdownManager.getShutdownOverview();

    return {
      overall: systemHealth.overall,
      components: {
        heartbeat: heartbeatOverview,
        failureDetection: failureOverview,
        shutdown: shutdownOverview,
        lifecycle: systemHealth
      },
      agents: systemHealth.agents,
      dependencies: systemHealth.dependencies
    };
  }

  private setupEventHandlers(): void {
    // Wire heartbeat failures to failure detector
    this.heartbeatMonitor.on('heartbeatEvent', (event) => {
      if (event.type === 'heartbeat_failed') {
        // Notify failure detector of heartbeat failure
        this.failureDetector.updateMetrics(event.agentId, {
          responseTime: event.metadata?.responseTime || 0,
          throughput: 0,
          errorRate: 100,
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          networkLatency: 0,
          customMetrics: {}
        });
      }
    });

    // Wire failure detector to lifecycle manager
    this.failureDetector.on('failureDetected', async (failure) => {
      // Handle failure through lifecycle manager
      console.log(`Failure detected for agent ${failure.agentId}: ${failure.description}`);
    });

    // Wire shutdown requests
    this.lifecycleManager.on('agentStopFailed', async (event) => {
      // Escalate to force shutdown through shutdown manager
      await this.shutdownManager.forceShutdown(event.agentId);
    });

    // Wire hot swap events
    this.hotSwapManager.on('swapCompleted', (event) => {
      console.log(`Hot swap completed for agent ${event.operation.request.agentId}`);
    });

    // Wire dependency resolution
    this.dependencyResolver.on('resolutionCompleted', (event) => {
      console.log(`Dependencies resolved for agent ${event.agentId}`);
    });

    // Wire health check events
    this.healthCheckSystem.on('checkCompleted', (result) => {
      // Update heartbeat monitor with health check results
      if (result.success) {
        // Simulate successful heartbeat
        console.log(`Health check passed for agent ${result.agentId}`);
      }
    });
  }
}

export default IntegratedLifecycleSystem;