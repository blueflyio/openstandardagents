/**
 * OSSA Service Registry
 * Manages service discovery, registration, and health monitoring for the OSSA ecosystem
 */

import { EventEmitter } from 'events';

/**
 * Service capability definition
 */
export interface ServiceCapability {
  /** Capability name */
  name: string;
  /** Capability version */
  version: string;
  /** Input schema definition */
  inputs?: Record<string, any>;
  /** Output schema definition */
  outputs?: Record<string, any>;
  /** Capability description */
  description?: string;
}

/**
 * Service health status
 */
export enum ServiceHealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
  UNKNOWN = 'unknown',
  MAINTENANCE = 'maintenance'
}

/**
 * Service health check result
 */
export interface ServiceHealth {
  /** Current health status */
  status: ServiceHealthStatus;
  /** Last health check timestamp */
  lastCheck: Date;
  /** Health check response time in milliseconds */
  responseTime?: number;
  /** Additional health details */
  details?: Record<string, any>;
  /** Error message if unhealthy */
  error?: string;
}

/**
 * Service definition interface
 */
export interface ServiceDefinition {
  /** Unique service name */
  name: string;
  /** Service endpoint URL */
  endpoint: string;
  /** Service capabilities */
  capabilities: ServiceCapability[];
  /** Service version */
  version: string;
  /** Current health status */
  health: ServiceHealth;
  /** Service metadata */
  metadata?: {
    description?: string;
    tags?: string[];
    author?: string;
    documentation?: string;
    environment?: string;
  };
  /** Registration timestamp */
  registeredAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Service discovery filter options
 */
export interface ServiceDiscoveryFilter {
  /** Filter by service name pattern */
  namePattern?: string;
  /** Filter by capability name */
  capability?: string;
  /** Filter by health status */
  healthStatus?: ServiceHealthStatus;
  /** Filter by tags */
  tags?: string[];
  /** Filter by version */
  version?: string;
  /** Filter by environment */
  environment?: string;
}

/**
 * Redis-based service registry configuration
 */
export interface ServiceRegistryConfig {
  /** Redis connection options */
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  /** Health check configuration */
  healthCheck: {
    /** Health check interval in milliseconds */
    intervalMs: number;
    /** Health check timeout in milliseconds */
    timeoutMs: number;
    /** Number of failed checks before marking as unhealthy */
    failureThreshold: number;
    /** Number of successful checks before marking as healthy */
    successThreshold: number;
  };
  /** Service TTL in seconds */
  serviceTtlSeconds: number;
}

/**
 * Service registry events
 */
export interface ServiceRegistryEvents {
  'service:registered': (service: ServiceDefinition) => void;
  'service:updated': (service: ServiceDefinition) => void;
  'service:unregistered': (serviceName: string) => void;
  'service:health:changed': (serviceName: string, oldStatus: ServiceHealthStatus, newStatus: ServiceHealthStatus) => void;
  'registry:error': (error: Error) => void;
}

/**
 * Redis client interface (to support different Redis libraries)
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, field: string, value: string): Promise<number>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ping(): Promise<string>;
  quit(): Promise<void>;
}

/**
 * OSSA Service Registry Implementation
 * 
 * Features:
 * - Redis-based persistence for service registrations
 * - Automatic health monitoring with configurable intervals
 * - Service discovery with flexible filtering
 * - Event-driven architecture for real-time updates
 * - TTL-based automatic cleanup of stale services
 */
export class ServiceRegistry extends EventEmitter {
  private readonly config: ServiceRegistryConfig;
  private readonly redis: RedisClient;
  private readonly services = new Map<string, ServiceDefinition>();
  private readonly healthCheckIntervals = new Map<string, NodeJS.Timeout>();
  private readonly healthCheckCounters = new Map<string, { failures: number; successes: number }>();
  private isHealthMonitoringActive = false;

  /**
   * Creates a new ServiceRegistry instance
   * @param config Registry configuration
   * @param redisClient Redis client instance
   */
  constructor(config: ServiceRegistryConfig, redisClient: RedisClient) {
    super();
    this.config = config;
    this.redis = redisClient;
    this.setupEventHandlers();
  }

  /**
   * Register a new service in the registry
   * @param service Service definition to register
   * @throws {Error} If service registration fails
   */
  async register(service: Omit<ServiceDefinition, 'registeredAt' | 'updatedAt'>): Promise<ServiceDefinition> {
    try {
      const now = new Date();
      const serviceDefinition: ServiceDefinition = {
        ...service,
        registeredAt: now,
        updatedAt: now
      };

      // Validate service definition
      this.validateServiceDefinition(serviceDefinition);

      // Store in Redis
      await this.storeServiceInRedis(serviceDefinition);

      // Store in local cache
      this.services.set(service.name, serviceDefinition);

      // Start health monitoring for this service
      if (this.isHealthMonitoringActive) {
        this.startServiceHealthMonitoring(service.name);
      }

      this.emit('service:registered', serviceDefinition);
      return serviceDefinition;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('registry:error', err);
      throw err;
    }
  }

  /**
   * Discover services based on filter criteria
   * @param filter Discovery filter options
   * @returns Array of matching services
   */
  async discover(filter: ServiceDiscoveryFilter = {}): Promise<ServiceDefinition[]> {
    try {
      // Load services from Redis if cache is empty
      if (this.services.size === 0) {
        await this.loadServicesFromRedis();
      }

      let services = Array.from(this.services.values());

      // Apply filters
      if (filter.namePattern) {
        const regex = new RegExp(filter.namePattern, 'i');
        services = services.filter(s => regex.test(s.name));
      }

      if (filter.capability) {
        services = services.filter(s => 
          s.capabilities.some(cap => cap.name === filter.capability)
        );
      }

      if (filter.healthStatus) {
        services = services.filter(s => s.health.status === filter.healthStatus);
      }

      if (filter.tags && filter.tags.length > 0) {
        services = services.filter(s => 
          s.metadata?.tags?.some(tag => filter.tags!.includes(tag))
        );
      }

      if (filter.version) {
        services = services.filter(s => s.version === filter.version);
      }

      if (filter.environment) {
        services = services.filter(s => s.metadata?.environment === filter.environment);
      }

      return services;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('registry:error', err);
      throw err;
    }
  }

  /**
   * Get health status of a specific service
   * @param serviceName Name of the service
   * @returns Service health information
   */
  async health(serviceName: string): Promise<ServiceHealth | null> {
    try {
      const service = this.services.get(serviceName);
      if (!service) {
        // Try loading from Redis
        await this.loadServiceFromRedis(serviceName);
        const reloadedService = this.services.get(serviceName);
        return reloadedService?.health || null;
      }

      return service.health;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('registry:error', err);
      throw err;
    }
  }

  /**
   * Unregister a service from the registry
   * @param serviceName Name of the service to unregister
   * @returns True if service was unregistered, false if not found
   */
  async unregister(serviceName: string): Promise<boolean> {
    try {
      // Remove from Redis
      const redisKey = this.getRedisKey(serviceName);
      const deleted = await this.redis.del(redisKey);

      // Remove from local cache
      const existed = this.services.delete(serviceName);

      // Stop health monitoring
      this.stopServiceHealthMonitoring(serviceName);

      if (existed || deleted > 0) {
        this.emit('service:unregistered', serviceName);
        return true;
      }

      return false;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('registry:error', err);
      throw err;
    }
  }

  /**
   * Update an existing service registration
   * @param serviceName Name of the service to update
   * @param updates Partial service definition with updates
   * @returns Updated service definition or null if not found
   */
  async updateService(serviceName: string, updates: Partial<ServiceDefinition>): Promise<ServiceDefinition | null> {
    try {
      let service = this.services.get(serviceName);
      
      if (!service) {
        // Try loading from Redis
        await this.loadServiceFromRedis(serviceName);
        service = this.services.get(serviceName);
        
        if (!service) {
          return null;
        }
      }

      // Apply updates
      const updatedService: ServiceDefinition = {
        ...service,
        ...updates,
        updatedAt: new Date()
      };

      // Validate updated service
      this.validateServiceDefinition(updatedService);

      // Store in Redis
      await this.storeServiceInRedis(updatedService);

      // Update local cache
      this.services.set(serviceName, updatedService);

      this.emit('service:updated', updatedService);
      return updatedService;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('registry:error', err);
      throw err;
    }
  }

  /**
   * Start health monitoring for all registered services
   */
  async startHealthMonitoring(): Promise<void> {
    if (this.isHealthMonitoringActive) {
      return;
    }

    this.isHealthMonitoringActive = true;
    
    // Load services from Redis if needed
    if (this.services.size === 0) {
      await this.loadServicesFromRedis();
    }

    // Start monitoring for all services
    for (const serviceName of this.services.keys()) {
      this.startServiceHealthMonitoring(serviceName);
    }
  }

  /**
   * Stop health monitoring for all services
   */
  stopHealthMonitoring(): void {
    this.isHealthMonitoringActive = false;
    
    for (const serviceName of this.services.keys()) {
      this.stopServiceHealthMonitoring(serviceName);
    }
  }

  /**
   * Get all registered services
   * @returns Array of all service definitions
   */
  async getAllServices(): Promise<ServiceDefinition[]> {
    if (this.services.size === 0) {
      await this.loadServicesFromRedis();
    }
    return Array.from(this.services.values());
  }

  /**
   * Get registry statistics
   * @returns Registry statistics
   */
  async getStats(): Promise<{
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    degradedServices: number;
    unknownServices: number;
    servicesInMaintenance: number;
  }> {
    const services = await this.getAllServices();
    
    const stats = {
      totalServices: services.length,
      healthyServices: 0,
      unhealthyServices: 0,
      degradedServices: 0,
      unknownServices: 0,
      servicesInMaintenance: 0
    };

    for (const service of services) {
      switch (service.health.status) {
        case ServiceHealthStatus.HEALTHY:
          stats.healthyServices++;
          break;
        case ServiceHealthStatus.UNHEALTHY:
          stats.unhealthyServices++;
          break;
        case ServiceHealthStatus.DEGRADED:
          stats.degradedServices++;
          break;
        case ServiceHealthStatus.MAINTENANCE:
          stats.servicesInMaintenance++;
          break;
        default:
          stats.unknownServices++;
      }
    }

    return stats;
  }

  /**
   * Cleanup expired services based on TTL
   */
  async cleanup(): Promise<number> {
    try {
      const now = new Date();
      const ttlMs = this.config.serviceTtlSeconds * 1000;
      let cleaned = 0;

      for (const [serviceName, service] of this.services) {
        const age = now.getTime() - service.updatedAt.getTime();
        if (age > ttlMs) {
          await this.unregister(serviceName);
          cleaned++;
        }
      }

      return cleaned;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('registry:error', err);
      throw err;
    }
  }

  /**
   * Close the registry and cleanup resources
   */
  async close(): Promise<void> {
    this.stopHealthMonitoring();
    await this.redis.quit();
  }

  // Private methods

  private setupEventHandlers(): void {
    this.on('error', (error) => {
      console.error('ServiceRegistry error:', error);
    });
  }

  private validateServiceDefinition(service: ServiceDefinition): void {
    if (!service.name || typeof service.name !== 'string') {
      throw new Error('Service name is required and must be a string');
    }

    if (!service.endpoint || typeof service.endpoint !== 'string') {
      throw new Error('Service endpoint is required and must be a string');
    }

    try {
      new URL(service.endpoint);
    } catch {
      throw new Error('Service endpoint must be a valid URL');
    }

    if (!service.version || typeof service.version !== 'string') {
      throw new Error('Service version is required and must be a string');
    }

    if (!Array.isArray(service.capabilities)) {
      throw new Error('Service capabilities must be an array');
    }
  }

  private getRedisKey(serviceName: string): string {
    const prefix = this.config.redis.keyPrefix || 'ossa:services';
    return `${prefix}:${serviceName}`;
  }

  private async storeServiceInRedis(service: ServiceDefinition): Promise<void> {
    const key = this.getRedisKey(service.name);
    const value = JSON.stringify(service);
    await this.redis.set(key, value, this.config.serviceTtlSeconds);
  }

  private async loadServiceFromRedis(serviceName: string): Promise<void> {
    const key = this.getRedisKey(serviceName);
    const data = await this.redis.get(key);
    
    if (data) {
      const service: ServiceDefinition = JSON.parse(data);
      this.services.set(serviceName, service);
    }
  }

  private async loadServicesFromRedis(): Promise<void> {
    const prefix = this.config.redis.keyPrefix || 'ossa:services';
    const pattern = `${prefix}:*`;
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const service: ServiceDefinition = JSON.parse(data);
        this.services.set(service.name, service);
      }
    }
  }

  private startServiceHealthMonitoring(serviceName: string): void {
    // Clear any existing interval
    this.stopServiceHealthMonitoring(serviceName);

    // Initialize counters
    this.healthCheckCounters.set(serviceName, { failures: 0, successes: 0 });

    // Start health check interval
    const interval = setInterval(async () => {
      await this.performHealthCheck(serviceName);
    }, this.config.healthCheck.intervalMs);

    this.healthCheckIntervals.set(serviceName, interval);
  }

  private stopServiceHealthMonitoring(serviceName: string): void {
    const interval = this.healthCheckIntervals.get(serviceName);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(serviceName);
    }
    this.healthCheckCounters.delete(serviceName);
  }

  private async performHealthCheck(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) return;

    const startTime = Date.now();
    const counters = this.healthCheckCounters.get(serviceName);
    if (!counters) return;

    try {
      // Perform health check by making a request to the service endpoint
      const healthEndpoint = `${service.endpoint.replace(/\/$/, '')}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheck.timeoutMs);

      const response = await fetch(healthEndpoint, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const oldStatus = service.health.status;

      if (response.ok) {
        counters.successes++;
        counters.failures = 0;

        if (counters.successes >= this.config.healthCheck.successThreshold) {
          service.health = {
            status: ServiceHealthStatus.HEALTHY,
            lastCheck: new Date(),
            responseTime,
            details: { httpStatus: response.status }
          };
        }
      } else {
        counters.failures++;
        counters.successes = 0;

        if (counters.failures >= this.config.healthCheck.failureThreshold) {
          service.health = {
            status: ServiceHealthStatus.UNHEALTHY,
            lastCheck: new Date(),
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      }

      // Update service in Redis and emit event if status changed
      if (service.health.status !== oldStatus) {
        await this.updateService(serviceName, { health: service.health });
        this.emit('service:health:changed', serviceName, oldStatus, service.health.status);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      counters.failures++;
      counters.successes = 0;

      const oldStatus = service.health.status;
      if (counters.failures >= this.config.healthCheck.failureThreshold) {
        service.health = {
          status: ServiceHealthStatus.UNHEALTHY,
          lastCheck: new Date(),
          responseTime,
          error: error instanceof Error ? error.message : String(error)
        };

        if (service.health.status !== oldStatus) {
          await this.updateService(serviceName, { health: service.health });
          this.emit('service:health:changed', serviceName, oldStatus, service.health.status);
        }
      }
    }
  }
}

/**
 * Default service registry configuration
 */
export const DEFAULT_SERVICE_REGISTRY_CONFIG: ServiceRegistryConfig = {
  redis: {
    host: 'localhost',
    port: 6379,
    keyPrefix: 'ossa:services'
  },
  healthCheck: {
    intervalMs: 30000, // 30 seconds
    timeoutMs: 5000,   // 5 seconds
    failureThreshold: 3,
    successThreshold: 2
  },
  serviceTtlSeconds: 300 // 5 minutes
};

export default ServiceRegistry;