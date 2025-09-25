/**
 * OSSA v0.1.9 Service Registry Integration for Redis Event Bus
 * Integrates event bus with existing OSSA ServiceRegistry for seamless discovery
 */

import { RedisEventBus } from './RedisEventBus.js';
import { ServiceRegistry, ServiceDefinition, ServiceHealthStatus } from '../ServiceRegistry.js';
import { EventPayload, EVENT_TYPES, CrossProjectEventContract } from './types.js';

export interface ServiceEventIntegrationConfig {
  /** Enable automatic service registration on event bus connection */
  autoRegisterServices: boolean;
  /** Enable service health monitoring via events */
  healthMonitoring: boolean;
  /** Enable automatic contract discovery */
  contractDiscovery: boolean;
  /** Service discovery refresh interval */
  discoveryRefreshInterval: number;
}

export class ServiceRegistryIntegration {
  private eventBus: RedisEventBus;
  private serviceRegistry: ServiceRegistry;
  private config: ServiceEventIntegrationConfig;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private serviceEventHandlers = new Map<string, Function>();

  constructor(
    eventBus: RedisEventBus,
    serviceRegistry: ServiceRegistry,
    config: Partial<ServiceEventIntegrationConfig> = {}
  ) {
    this.eventBus = eventBus;
    this.serviceRegistry = serviceRegistry;
    this.config = {
      autoRegisterServices: true,
      healthMonitoring: true,
      contractDiscovery: true,
      discoveryRefreshInterval: 60000, // 1 minute
      ...config
    };

    this.setupIntegration();
  }

  /**
   * Initialize the integration between EventBus and ServiceRegistry
   */
  private async setupIntegration(): Promise<void> {
    // Listen for service registry events
    this.setupServiceRegistryEventHandlers();

    // Listen for event bus events
    this.setupEventBusEventHandlers();

    // Start service discovery if enabled
    if (this.config.contractDiscovery) {
      await this.startServiceDiscovery();
    }

    // Setup health monitoring
    if (this.config.healthMonitoring) {
      this.setupHealthMonitoring();
    }

    console.log('✅ Service Registry Integration initialized');
  }

  /**
   * Setup event handlers for service registry events
   */
  private setupServiceRegistryEventHandlers(): void {
    // Service registered - announce via event bus
    this.serviceRegistry.on('service:registered', async (service: ServiceDefinition) => {
      await this.eventBus.publish(EVENT_TYPES.SYSTEM.CONFIGURATION_CHANGED, {
        action: 'service_registered',
        service: {
          name: service.name,
          endpoint: service.endpoint,
          version: service.version,
          capabilities: service.capabilities.map(cap => cap.name)
        }
      });

      // Auto-discover event contracts if enabled
      if (this.config.contractDiscovery) {
        await this.discoverServiceContracts(service);
      }
    });

    // Service health changed - broadcast health status
    this.serviceRegistry.on('service:health:changed', async (
      serviceName: string,
      oldStatus: ServiceHealthStatus,
      newStatus: ServiceHealthStatus
    ) => {
      await this.eventBus.publish(EVENT_TYPES.SYSTEM.HEALTH_CHECK, {
        serviceName,
        oldStatus,
        newStatus,
        timestamp: new Date()
      });
    });

    // Service unregistered - cleanup event subscriptions
    this.serviceRegistry.on('service:unregistered', async (serviceName: string) => {
      await this.eventBus.publish(EVENT_TYPES.SYSTEM.CONFIGURATION_CHANGED, {
        action: 'service_unregistered',
        serviceName
      });

      // Cleanup service-specific event handlers
      this.cleanupServiceEventHandlers(serviceName);
    });
  }

  /**
   * Setup event handlers for event bus events
   */
  private setupEventBusEventHandlers(): void {
    // Monitor event bus health and update service registry
    this.eventBus.on('health:status:changed', async (oldStatus: string, newStatus: string) => {
      // Update event bus service health in registry if registered
      const eventBusService = await this.findEventBusServiceInRegistry();
      if (eventBusService) {
        const healthStatus = this.mapEventBusStatusToServiceHealth(newStatus);
        await this.serviceRegistry.updateService(eventBusService.name, {
          health: {
            status: healthStatus,
            lastCheck: new Date(),
            details: { eventBusStatus: newStatus }
          }
        });
      }
    });

    // Track service communication patterns
    this.eventBus.on('event:consumed', (eventType: string, payload: EventPayload) => {
      this.trackServiceCommunication(payload.metadata.source, eventType);
    });
  }

  /**
   * Discover and register event contracts from services
   */
  private async discoverServiceContracts(service: ServiceDefinition): Promise<void> {
    try {
      // Check if service exposes event contracts endpoint
      const contractsEndpoint = `${service.endpoint.replace(/\/$/, '')}/events/contracts`;

      const response = await fetch(contractsEndpoint);
      if (response.ok) {
        const contracts = await response.json() as CrossProjectEventContract[];

        for (const contract of contracts) {
          await this.eventBus.registerContract({
            ...contract,
            sourceProject: service.name,
            metadata: {
              ...contract.metadata,
              tags: [...(contract.metadata.tags || []), 'discovered', 'auto-generated']
            }
          });

          console.log(`📋 Discovered contract ${contract.name} from ${service.name}`);
        }
      }

    } catch (error) {
      // Service doesn't expose contracts or error occurred - continue silently
      console.debug(`Service ${service.name} doesn't expose event contracts`);
    }
  }

  /**
   * Start periodic service discovery for event bus integration
   */
  private async startServiceDiscovery(): Promise<void> {
    const discoverServices = async () => {
      try {
        // Get all healthy services
        const services = await this.serviceRegistry.discover({
          healthStatus: ServiceHealthStatus.HEALTHY
        });

        // Setup event routing for each service based on capabilities
        for (const service of services) {
          await this.setupServiceEventRouting(service);
        }

      } catch (error) {
        console.error('Service discovery error:', error);
      }
    };

    // Initial discovery
    await discoverServices();

    // Periodic discovery
    this.discoveryInterval = setInterval(
      discoverServices,
      this.config.discoveryRefreshInterval
    );
  }

  /**
   * Setup event routing for a specific service
   */
  private async setupServiceEventRouting(service: ServiceDefinition): Promise<void> {
    // Create service-specific event handlers based on capabilities
    for (const capability of service.capabilities) {
      const eventType = this.mapCapabilityToEventType(capability.name);

      if (eventType && !this.serviceEventHandlers.has(`${service.name}:${eventType}`)) {
        const handler = this.createServiceEventHandler(service, capability.name);

        await this.eventBus.subscribe(eventType, handler, {
          group: `service-${service.name}`
        });

        this.serviceEventHandlers.set(`${service.name}:${eventType}`, handler);
      }
    }
  }

  /**
   * Create event handler for specific service capability
   */
  private createServiceEventHandler(
    service: ServiceDefinition,
    capability: string
  ): (payload: EventPayload) => Promise<void> {
    return async (payload: EventPayload) => {
      try {
        // Forward event to service endpoint
        const serviceEndpoint = `${service.endpoint.replace(/\/$/, '')}/events`;

        await fetch(serviceEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Event-Type': payload.metadata.type,
            'X-Correlation-ID': payload.metadata.correlationId || ''
          },
          body: JSON.stringify(payload)
        });

        console.debug(`Forwarded ${payload.metadata.type} to ${service.name}`);

      } catch (error) {
        console.error(`Failed to forward event to ${service.name}:`, error);

        // Update service health if multiple failures
        await this.handleServiceEventFailure(service.name, error);
      }
    };
  }

  /**
   * Setup health monitoring via events
   */
  private setupHealthMonitoring(): void {
    // Monitor agent lifecycle events for health insights
    this.eventBus.subscribe(EVENT_TYPES.AGENT.FAILED, async (payload: EventPayload) => {
      const agentId = payload.data.agentId;
      const serviceName = payload.metadata.source;

      // Find service and update health if needed
      try {
        const service = await this.findServiceByName(serviceName);
        if (service && service.health.status === ServiceHealthStatus.HEALTHY) {
          await this.serviceRegistry.updateService(serviceName, {
            health: {
              status: ServiceHealthStatus.DEGRADED,
              lastCheck: new Date(),
              details: { agentFailures: agentId },
              error: 'Agent failures detected'
            }
          });
        }
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    });

    // Monitor performance metrics
    this.eventBus.subscribe(EVENT_TYPES.PERFORMANCE.METRICS, async (payload: EventPayload) => {
      const metrics = payload.data.metrics;
      const serviceName = payload.metadata.source;

      // Update service health based on performance metrics
      if (metrics.errorRate > 0.1 || metrics.responseTime > 5000) {
        try {
          const service = await this.findServiceByName(serviceName);
          if (service) {
            await this.serviceRegistry.updateService(serviceName, {
              health: {
                status: ServiceHealthStatus.DEGRADED,
                lastCheck: new Date(),
                details: { performanceMetrics: metrics },
                error: 'Performance degradation detected'
              }
            });
          }
        } catch (error) {
          console.error('Performance monitoring error:', error);
        }
      }
    });
  }

  /**
   * Register event bus as a service in the registry
   */
  async registerEventBusService(): Promise<void> {
    try {
      const eventBusStatus = await this.eventBus.getStatus();

      await this.serviceRegistry.register({
        name: 'ossa-event-bus',
        endpoint: 'redis://internal', // Internal service
        version: '0.1.9',
        capabilities: [
          {
            name: 'event-publishing',
            version: '1.0.0',
            description: 'Publish events to the event bus'
          },
          {
            name: 'event-subscription',
            version: '1.0.0',
            description: 'Subscribe to events from the event bus'
          },
          {
            name: 'cross-project-communication',
            version: '1.0.0',
            description: 'Enable communication between projects'
          }
        ],
        health: {
          status: this.mapEventBusStatusToServiceHealth(eventBusStatus.status),
          lastCheck: new Date(),
          details: {
            metrics: eventBusStatus.metrics,
            subscriptions: eventBusStatus.subscriptions,
            streams: eventBusStatus.streams
          }
        },
        metadata: {
          description: 'OSSA Redis Event Bus for cross-project communication',
          tags: ['event-bus', 'redis', 'messaging', 'ossa'],
          author: 'OSSA System',
          environment: process.env.NODE_ENV || 'development'
        }
      });

      console.log('✅ Event Bus registered in Service Registry');

    } catch (error) {
      console.error('Failed to register Event Bus service:', error);
      throw error;
    }
  }

  /**
   * Create event-driven service discovery
   */
  async enableEventDrivenDiscovery(): Promise<void> {
    // Subscribe to system configuration changes
    await this.eventBus.subscribe(
      EVENT_TYPES.SYSTEM.CONFIGURATION_CHANGED,
      async (payload: EventPayload) => {
        if (payload.data.action === 'service_registered') {
          // Refresh service routing for new service
          const service = await this.findServiceByName(payload.data.service.name);
          if (service) {
            await this.setupServiceEventRouting(service);
          }
        }
      },
      { group: 'service-discovery' }
    );

    console.log('✅ Event-driven service discovery enabled');
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(): Promise<{
    registeredServices: number;
    eventContracts: number;
    activeEventHandlers: number;
    healthyServices: number;
    eventBusStatus: string;
  }> {
    const services = await this.serviceRegistry.getAllServices();
    const stats = await this.serviceRegistry.getStats();
    const eventBusStatus = await this.eventBus.getStatus();

    return {
      registeredServices: stats.totalServices,
      eventContracts: 0, // Would need to be tracked separately
      activeEventHandlers: this.serviceEventHandlers.size,
      healthyServices: stats.healthyServices,
      eventBusStatus: eventBusStatus.status
    };
  }

  /**
   * Cleanup integration resources
   */
  async cleanup(): Promise<void> {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    // Remove all service event handlers
    this.serviceEventHandlers.clear();

    console.log('✅ Service Registry Integration cleaned up');
  }

  // Private utility methods

  private async findEventBusServiceInRegistry(): Promise<ServiceDefinition | null> {
    const services = await this.serviceRegistry.discover({ namePattern: 'ossa-event-bus' });
    return services.length > 0 ? services[0] : null;
  }

  private async findServiceByName(serviceName: string): Promise<ServiceDefinition | null> {
    const services = await this.serviceRegistry.discover({ namePattern: serviceName });
    return services.length > 0 ? services[0] : null;
  }

  private mapEventBusStatusToServiceHealth(status: string): ServiceHealthStatus {
    switch (status) {
      case 'healthy': return ServiceHealthStatus.HEALTHY;
      case 'degraded': return ServiceHealthStatus.DEGRADED;
      case 'unhealthy': return ServiceHealthStatus.UNHEALTHY;
      default: return ServiceHealthStatus.UNKNOWN;
    }
  }

  private mapCapabilityToEventType(capability: string): string | null {
    // Map service capabilities to event types
    const capabilityEventMap: Record<string, string> = {
      'agent-orchestration': EVENT_TYPES.AGENT.SPAWNED,
      'task-management': EVENT_TYPES.TASK.ASSIGNED,
      'performance-monitoring': EVENT_TYPES.PERFORMANCE.METRICS,
      'resource-management': EVENT_TYPES.RESOURCE.ALLOCATED
    };

    return capabilityEventMap[capability] || null;
  }

  private trackServiceCommunication(source: string, eventType: string): void {
    // Track service communication patterns for analytics
    // Implementation would store communication metrics in Redis or database
    console.debug(`Service communication: ${source} -> ${eventType}`);
  }

  private cleanupServiceEventHandlers(serviceName: string): void {
    // Remove all event handlers for a specific service
    for (const [key, handler] of this.serviceEventHandlers) {
      if (key.startsWith(`${serviceName}:`)) {
        this.serviceEventHandlers.delete(key);
      }
    }
  }

  private async handleServiceEventFailure(serviceName: string, error: unknown): Promise<void> {
    // Track service event failures and update health status if needed
    console.error(`Service ${serviceName} event failure:`, error);

    // Implementation would track failure count and update service health
    // after threshold is exceeded
  }
}

export default ServiceRegistryIntegration;