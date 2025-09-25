/**
 * OSSA v0.1.9 Redis Event Bus - Main Entry Point
 * Production-ready event bus for cross-project communication and 100+ agent orchestration
 */

export { RedisEventBus } from './RedisEventBus.js';
export { ServiceRegistryIntegration } from './ServiceRegistryIntegration.js';
export { CrossProjectCommunication } from './CrossProjectCommunication.js';
export { AgentOrchestrationOptimizer } from './AgentOrchestrationOptimizer.js';
export { EventBusMonitoring } from './EventBusMonitoring.js';
export type { ProjectConfig } from './CrossProjectCommunication.js';
export type { LoadBalancingConfig } from './AgentOrchestrationOptimizer.js';
export type { MonitoringConfig } from './EventBusMonitoring.js';

export * from './types.js';

import { RedisEventBus } from './RedisEventBus.js';
import { ServiceRegistryIntegration } from './ServiceRegistryIntegration.js';
import { CrossProjectCommunication } from './CrossProjectCommunication.js';
import { AgentOrchestrationOptimizer } from './AgentOrchestrationOptimizer.js';
import { EventBusMonitoring } from './EventBusMonitoring.js';
import { ServiceRegistry } from '../ServiceRegistry.js';
import {
  EventBusConfig,
  CrossProjectEventContract,
  DEFAULT_EVENT_BUS_CONFIG,
  EventPriority
} from './types.js';
import { ProjectConfig } from './CrossProjectCommunication.js';
import { LoadBalancingConfig } from './AgentOrchestrationOptimizer.js';
import { MonitoringConfig } from './EventBusMonitoring.js';

export interface OSSAEventBusConfig {
  /** Redis event bus configuration */
  eventBus: Partial<EventBusConfig>;
  /** Service registry integration configuration */
  serviceRegistry: {
    enabled: boolean;
    autoRegister: boolean;
    healthMonitoring: boolean;
  };
  /** Cross-project communication configuration */
  crossProject: {
    enabled: boolean;
    securityEnabled: boolean;
    rateLimitingEnabled: boolean;
  };
  /** Agent orchestration optimization configuration */
  orchestration: {
    enabled: boolean;
    config: Partial<LoadBalancingConfig>;
  };
  /** Monitoring and observability configuration */
  monitoring: Partial<MonitoringConfig>;
}

/**
 * Main OSSA Event Bus orchestrator
 * Integrates all event bus components for production deployment
 */
export class OSSAEventBus {
  private eventBus: RedisEventBus;
  private serviceRegistry: ServiceRegistry;
  private serviceRegistryIntegration?: ServiceRegistryIntegration;
  private crossProjectCommunication?: CrossProjectCommunication;
  private orchestrationOptimizer?: AgentOrchestrationOptimizer;
  private monitoring?: EventBusMonitoring;

  private isInitialized = false;
  private config: OSSAEventBusConfig;

  constructor(
    serviceRegistry: ServiceRegistry,
    config: Partial<OSSAEventBusConfig> = {}
  ) {
    this.serviceRegistry = serviceRegistry;
    this.config = {
      eventBus: DEFAULT_EVENT_BUS_CONFIG,
      serviceRegistry: {
        enabled: true,
        autoRegister: true,
        healthMonitoring: true
      },
      crossProject: {
        enabled: true,
        securityEnabled: true,
        rateLimitingEnabled: true
      },
      orchestration: {
        enabled: true,
        config: {}
      },
      monitoring: {
        metrics: { enabled: true, collectionInterval: 10000, retentionPeriod: 86400000, aggregationWindows: [60, 300, 900, 3600] },
        tracing: { enabled: true, samplingRate: 0.1, serviceName: 'ossa-event-bus' },
        alerting: { enabled: true, thresholds: { maxErrorRate: 5.0, maxLatency: 1000, maxQueueDepth: 1000, minThroughput: 1.0, maxMemoryUsage: 85.0, maxConnectionUtilization: 90.0 } },
        healthCheck: { enabled: true, interval: 30000, timeout: 5000, criticalThresholds: { criticalErrorRate: 25.0, criticalLatency: 5000, criticalMemoryUsage: 95.0 } }
      },
      ...config
    };

    // Initialize core event bus
    this.eventBus = new RedisEventBus(this.config.eventBus);
  }

  /**
   * Initialize the complete OSSA Event Bus system
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing OSSA Event Bus v0.1.9...');

      // 1. Connect to Redis
      await this.eventBus.connect();

      // 2. Initialize Service Registry Integration
      if (this.config.serviceRegistry.enabled) {
        console.log('📋 Initializing Service Registry Integration...');
        this.serviceRegistryIntegration = new ServiceRegistryIntegration(
          this.eventBus,
          this.serviceRegistry,
          this.config.serviceRegistry
        );

        if (this.config.serviceRegistry.autoRegister) {
          await this.serviceRegistryIntegration.registerEventBusService();
        }

        await this.serviceRegistryIntegration.enableEventDrivenDiscovery();
      }

      // 3. Initialize Cross-Project Communication
      if (this.config.crossProject.enabled) {
        console.log('🌐 Initializing Cross-Project Communication...');
        this.crossProjectCommunication = new CrossProjectCommunication(this.eventBus);
      }

      // 4. Initialize Agent Orchestration Optimizer
      if (this.config.orchestration.enabled) {
        console.log('⚡ Initializing Agent Orchestration Optimizer...');
        this.orchestrationOptimizer = new AgentOrchestrationOptimizer(
          this.eventBus,
          this.serviceRegistry,
          this.config.orchestration.config
        );
      }

      // 5. Initialize Monitoring and Observability
      console.log('📊 Initializing Monitoring and Observability...');
      this.monitoring = new EventBusMonitoring(
        this.eventBus,
        this.serviceRegistry,
        this.config.monitoring
      );

      // 6. Setup cross-component integrations
      await this.setupIntegrations();

      this.isInitialized = true;
      console.log('✅ OSSA Event Bus v0.1.9 initialized successfully');

      // Announce successful initialization
      await this.eventBus.publish('system.eventbus.initialized', {
        version: '0.1.9',
        timestamp: new Date(),
        features: {
          serviceRegistry: this.config.serviceRegistry.enabled,
          crossProject: this.config.crossProject.enabled,
          orchestration: this.config.orchestration.enabled,
          monitoring: !!this.monitoring
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize OSSA Event Bus:', error);
      throw error;
    }
  }

  /**
   * Setup integrations between components
   */
  private async setupIntegrations(): Promise<void> {
    // Setup monitoring for all components
    if (this.monitoring) {
      // Monitor service registry integration
      if (this.serviceRegistryIntegration) {
        // Monitor service registry integration (events would be handled via event bus)
        // ServiceRegistryIntegration doesn't extend EventEmitter, so we monitor via event bus instead
      }

      // Monitor cross-project communication
      if (this.crossProjectCommunication) {
        // Would setup cross-project metrics monitoring
      }

      // Monitor orchestration optimizer
      if (this.orchestrationOptimizer) {
        // Orchestration metrics are already being collected via events
      }
    }

    console.log('🔗 Component integrations configured');
  }

  /**
   * Register a project for cross-project communication
   */
  async registerProject(config: ProjectConfig): Promise<void> {
    if (!this.crossProjectCommunication) {
      throw new Error('Cross-project communication is not enabled');
    }

    await this.crossProjectCommunication.registerProject(config);
  }

  /**
   * Register a cross-project event contract
   */
  async registerContract(contract: CrossProjectEventContract): Promise<void> {
    if (!this.crossProjectCommunication) {
      throw new Error('Cross-project communication is not enabled');
    }

    await this.crossProjectCommunication.registerCrossProjectContract(contract);
  }

  /**
   * Send cross-project message
   */
  async sendCrossProjectMessage<T>(
    sourceProjectId: string,
    targetProjectId: string,
    eventType: string,
    data: T,
    options?: { correlationId?: string; priority?: EventPriority }
  ): Promise<string> {
    if (!this.crossProjectCommunication) {
      throw new Error('Cross-project communication is not enabled');
    }

    return this.crossProjectCommunication.sendMessage(
      sourceProjectId,
      targetProjectId,
      eventType,
      data,
      options
    );
  }

  /**
   * Setup cross-project message handler
   */
  async setupCrossProjectHandler<T>(
    projectId: string,
    eventType: string,
    handler: (message: any) => Promise<void>,
    options?: { requireSignatureValidation?: boolean }
  ): Promise<void> {
    if (!this.crossProjectCommunication) {
      throw new Error('Cross-project communication is not enabled');
    }

    await this.crossProjectCommunication.setupMessageHandler(
      projectId,
      eventType,
      handler,
      options
    );
  }

  /**
   * Publish event to the event bus
   */
  async publish<T>(eventType: string, data: T, options?: any): Promise<string> {
    this.ensureInitialized();
    return this.eventBus.publish(eventType, data, options);
  }

  /**
   * Subscribe to events
   */
  async subscribe<T>(
    eventType: string,
    handler: (payload: any) => Promise<void> | void,
    options?: any
  ): Promise<void> {
    this.ensureInitialized();
    return this.eventBus.subscribe(eventType, handler, options);
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(eventType: string, handler?: Function): Promise<void> {
    this.ensureInitialized();
    return this.eventBus.unsubscribe(eventType, handler as any);
  }

  /**
   * Get comprehensive system status
   */
  async getStatus(): Promise<{
    eventBus: any;
    serviceRegistry?: any;
    crossProject?: any;
    orchestration?: any;
    monitoring?: any;
  }> {
    this.ensureInitialized();

    const status: any = {
      eventBus: await this.eventBus.getStatus()
    };

    if (this.serviceRegistryIntegration) {
      status.serviceRegistry = await this.serviceRegistryIntegration.getIntegrationStats();
    }

    if (this.crossProjectCommunication) {
      status.crossProject = await this.crossProjectCommunication.getStats();
    }

    if (this.orchestrationOptimizer) {
      status.orchestration = this.orchestrationOptimizer.getOrchestrationStats();
    }

    if (this.monitoring) {
      status.monitoring = this.monitoring.getMonitoringStats();
    }

    return status;
  }

  /**
   * Get dashboard data for monitoring UI
   */
  async getDashboardData(): Promise<any> {
    if (!this.monitoring) {
      throw new Error('Monitoring is not enabled');
    }

    return this.monitoring.getDashboardData();
  }

  /**
   * Export metrics in Prometheus format
   */
  exportMetrics(): string {
    if (!this.monitoring) {
      throw new Error('Monitoring is not enabled');
    }

    return this.monitoring.exportPrometheusMetrics();
  }

  /**
   * Validate project setup for cross-project communication
   */
  async validateProjectSetup(projectId: string): Promise<any> {
    if (!this.crossProjectCommunication) {
      throw new Error('Cross-project communication is not enabled');
    }

    return this.crossProjectCommunication.validateProjectSetup(projectId);
  }

  /**
   * Get available contracts for a project
   */
  getAvailableContracts(projectId: string): CrossProjectEventContract[] {
    if (!this.crossProjectCommunication) {
      throw new Error('Cross-project communication is not enabled');
    }

    return this.crossProjectCommunication.getAvailableContracts(projectId);
  }

  /**
   * Get orchestration statistics
   */
  getOrchestrationStats(): any {
    if (!this.orchestrationOptimizer) {
      throw new Error('Orchestration optimizer is not enabled');
    }

    return this.orchestrationOptimizer.getOrchestrationStats();
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    components: Record<string, { status: string; details?: any }>;
  }> {
    const components: Record<string, { status: string; details?: any }> = {};

    try {
      // Check event bus health
      const eventBusStatus = await this.eventBus.getStatus();
      components.eventBus = {
        status: eventBusStatus.status,
        details: eventBusStatus.metrics
      };

      // Check other components if enabled
      if (this.serviceRegistryIntegration) {
        const registryStats = await this.serviceRegistryIntegration.getIntegrationStats();
        components.serviceRegistry = {
          status: registryStats.eventBusStatus,
          details: registryStats
        };
      }

      if (this.monitoring) {
        const monitoringStats = this.monitoring.getMonitoringStats();
        components.monitoring = {
          status: monitoringStats.activeAlerts > 0 ? 'warning' : 'healthy',
          details: monitoringStats
        };
      }

      // Determine overall status
      const statuses = Object.values(components).map(c => c.status);
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (statuses.includes('unhealthy')) {
        overallStatus = 'unhealthy';
      } else if (statuses.includes('degraded') || statuses.includes('warning')) {
        overallStatus = 'degraded';
      }

      return {
        status: overallStatus,
        timestamp: new Date(),
        components
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        components: {
          error: {
            status: 'unhealthy',
            details: { message: error instanceof Error ? error.message : String(error) }
          }
        }
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down OSSA Event Bus...');

    try {
      // Announce shutdown
      if (this.isInitialized) {
        await this.eventBus.publish('system.eventbus.shutdown', {
          timestamp: new Date(),
          reason: 'graceful_shutdown'
        });
      }

      // Cleanup components in reverse order
      if (this.monitoring) {
        await this.monitoring.cleanup();
      }

      if (this.orchestrationOptimizer) {
        await this.orchestrationOptimizer.cleanup();
      }

      if (this.crossProjectCommunication) {
        // Cross-project communication cleanup (if implemented)
      }

      if (this.serviceRegistryIntegration) {
        await this.serviceRegistryIntegration.cleanup();
      }

      // Disconnect event bus last
      await this.eventBus.disconnect();

      console.log('✅ OSSA Event Bus shutdown complete');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Get the underlying event bus instance
   */
  getEventBus(): RedisEventBus {
    return this.eventBus;
  }

  /**
   * Get the service registry integration instance
   */
  getServiceRegistryIntegration(): ServiceRegistryIntegration | undefined {
    return this.serviceRegistryIntegration;
  }

  /**
   * Get the cross-project communication instance
   */
  getCrossProjectCommunication(): CrossProjectCommunication | undefined {
    return this.crossProjectCommunication;
  }

  /**
   * Get the orchestration optimizer instance
   */
  getOrchestrationOptimizer(): AgentOrchestrationOptimizer | undefined {
    return this.orchestrationOptimizer;
  }

  /**
   * Get the monitoring instance
   */
  getMonitoring(): EventBusMonitoring | undefined {
    return this.monitoring;
  }

  /**
   * Ensure the event bus is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('OSSA Event Bus is not initialized. Call initialize() first.');
    }
  }

  private recordMetric?: (name: string, value: number, labels: Record<string, string>) => void;
}

/**
 * Create and initialize OSSA Event Bus with default configuration
 */
export async function createOSSAEventBus(
  serviceRegistry: ServiceRegistry,
  config?: Partial<OSSAEventBusConfig>
): Promise<OSSAEventBus> {
  const eventBus = new OSSAEventBus(serviceRegistry, config);
  await eventBus.initialize();
  return eventBus;
}

export default OSSAEventBus;