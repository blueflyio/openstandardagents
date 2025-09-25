/**
 * OSSA Service Registry REST API
 * Express router for service registration, discovery, and health monitoring endpoints
 */

import express from 'express';

// Type definitions for Express v5 compatibility
type Router = any;
type Request = any;
type Response = any;
type NextFunction = any;

import ServiceRegistry, {
  ServiceDefinition,
  ServiceDiscoveryFilter,
  ServiceHealthStatus,
  ServiceCapability,
  RedisClient,
  ServiceRegistryConfig
} from '../services/ServiceRegistry.js';

/**
 * Request body for service registration
 */
export interface RegisterServiceRequest {
  name: string;
  endpoint: string;
  capabilities: ServiceCapability[];
  version: string;
  metadata?: {
    description?: string;
    tags?: string[];
    author?: string;
    documentation?: string;
    environment?: string;
  };
}

/**
 * Request body for service updates
 */
export interface UpdateServiceRequest {
  endpoint?: string;
  capabilities?: ServiceCapability[];
  version?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    author?: string;
    documentation?: string;
    environment?: string;
  };
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create service registry API router
 * @param serviceRegistry Service registry instance
 * @param options API configuration options
 * @returns Express router with all registry endpoints
 */
export function createRegistryApiRouter(
  serviceRegistry: ServiceRegistry,
  options: {
    enableCors?: boolean;
    enableRateLimit?: boolean;
    apiVersion?: string;
  } = {}
): any {
  const router = (express as any).Router();
  const apiVersion = options.apiVersion || '0.1.9';

  // Middleware for consistent response formatting
  const formatResponse = (req: any, res: any, next: any) => {
    const originalJson = res.json;
    res.json = function(body: any) {
      const response: ApiResponse = {
        success: true,
        data: body,
        meta: {
          timestamp: new Date().toISOString(),
          version: apiVersion,
          requestId: req.headers['x-request-id'] as string
        }
      };
      return originalJson.call(this, response);
    };
    next();
  };

  // Error handling middleware
  const handleError = (err: Error, req: any, res: any, next: any) => {
    console.error('Registry API error:', err);

    const isApiError = err instanceof ApiError;
    const statusCode = isApiError ? err.statusCode : 500;
    const code = isApiError ? err.code : 'INTERNAL_ERROR';
    const details = isApiError ? err.details : undefined;

    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message: err.message,
        details
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: apiVersion,
        requestId: req.headers['x-request-id'] as string
      }
    };

    res.status(statusCode).json(response);
  };

  // Apply middleware
  router.use(formatResponse);

  /**
   * GET /registry/services
   * Discover services with optional filtering
   */
  router.get('/services', async (req: any, res: any, next: any) => {
    try {
      const filter: ServiceDiscoveryFilter = {};

      if (req.query.name) {
        filter.namePattern = req.query.name as string;
      }

      if (req.query.capability) {
        filter.capability = req.query.capability as string;
      }

      if (req.query.health) {
        const healthStatus = req.query.health as string;
        if (Object.values(ServiceHealthStatus).includes(healthStatus as ServiceHealthStatus)) {
          filter.healthStatus = healthStatus as ServiceHealthStatus;
        }
      }

      if (req.query.tags) {
        const tags = typeof req.query.tags === 'string' 
          ? req.query.tags.split(',').map((t: string) => t.trim())
          : req.query.tags as string[];
        filter.tags = tags;
      }

      if (req.query.version) {
        filter.version = req.query.version as string;
      }

      if (req.query.environment) {
        filter.environment = req.query.environment as string;
      }

      const services = await serviceRegistry.discover(filter);
      res.json({
        services,
        count: services.length,
        filter
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /registry/services
   * Register a new service
   */
  router.post('/services', async (req: any, res: any, next: any) => {
    try {
      const serviceData: RegisterServiceRequest = req.body;

      // Validate required fields
      if (!serviceData.name || !serviceData.endpoint || !serviceData.version) {
        throw new ApiError(
          400,
          'INVALID_REQUEST',
          'Missing required fields: name, endpoint, and version are required'
        );
      }

      if (!Array.isArray(serviceData.capabilities)) {
        throw new ApiError(
          400,
          'INVALID_REQUEST',
          'Capabilities must be an array'
        );
      }

      // Create service definition
      const serviceDefinition: Omit<ServiceDefinition, 'registeredAt' | 'updatedAt'> = {
        name: serviceData.name,
        endpoint: serviceData.endpoint,
        capabilities: serviceData.capabilities,
        version: serviceData.version,
        health: {
          status: ServiceHealthStatus.UNKNOWN,
          lastCheck: new Date()
        },
        metadata: serviceData.metadata
      };

      const registeredService = await serviceRegistry.register(serviceDefinition);
      res.status(201).json(registeredService);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /registry/services/:serviceName
   * Get details of a specific service
   */
  router.get('/services/:serviceName', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceName = req.params.serviceName;
      const services = await serviceRegistry.discover({ namePattern: `^${serviceName}$` });
      
      if (services.length === 0) {
        throw new ApiError(
          404,
          'SERVICE_NOT_FOUND',
          `Service '${serviceName}' not found`
        );
      }

      res.json(services[0]);
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /registry/services/:serviceName
   * Update an existing service
   */
  router.put('/services/:serviceName', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceName = req.params.serviceName;
      const updates: UpdateServiceRequest = req.body;

      const updatedService = await serviceRegistry.updateService(serviceName, updates);
      
      if (!updatedService) {
        throw new ApiError(
          404,
          'SERVICE_NOT_FOUND',
          `Service '${serviceName}' not found`
        );
      }

      res.json(updatedService);
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /registry/services/:serviceName
   * Unregister a service
   */
  router.delete('/services/:serviceName', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceName = req.params.serviceName;
      const unregistered = await serviceRegistry.unregister(serviceName);
      
      if (!unregistered) {
        throw new ApiError(
          404,
          'SERVICE_NOT_FOUND',
          `Service '${serviceName}' not found`
        );
      }

      res.json({ message: `Service '${serviceName}' successfully unregistered` });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /registry/services/:serviceName/health
   * Get health status of a specific service
   */
  router.get('/services/:serviceName/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceName = req.params.serviceName;
      const health = await serviceRegistry.health(serviceName);
      
      if (!health) {
        throw new ApiError(
          404,
          'SERVICE_NOT_FOUND',
          `Service '${serviceName}' not found`
        );
      }

      res.json(health);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /registry/health
   * Get overall registry health and statistics
   */
  router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await serviceRegistry.getStats();
      const healthStatus = stats.unhealthyServices > 0 ? 'degraded' : 'healthy';
      
      res.json({
        status: healthStatus,
        timestamp: new Date().toISOString(),
        statistics: stats
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /registry/cleanup
   * Manually trigger cleanup of expired services
   */
  router.post('/cleanup', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cleaned = await serviceRegistry.cleanup();
      res.json({
        message: 'Cleanup completed',
        servicesRemoved: cleaned
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /registry/stats
   * Get detailed registry statistics
   */
  router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await serviceRegistry.getStats();
      const allServices = await serviceRegistry.getAllServices();
      
      // Calculate additional metrics
      const capabilities = new Set<string>();
      const versions = new Set<string>();
      const tags = new Set<string>();
      let totalCapabilities = 0;

      for (const service of allServices) {
        service.capabilities.forEach(cap => {
          capabilities.add(cap.name);
          totalCapabilities++;
        });
        versions.add(service.version);
        service.metadata?.tags?.forEach(tag => tags.add(tag));
      }

      res.json({
        ...stats,
        uniqueCapabilities: capabilities.size,
        totalCapabilities,
        uniqueVersions: versions.size,
        uniqueTags: tags.size,
        averageCapabilitiesPerService: totalCapabilities / (stats.totalServices || 1)
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /registry/capabilities
   * Get list of all available capabilities across services
   */
  router.get('/capabilities', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allServices = await serviceRegistry.getAllServices();
      const capabilityMap = new Map<string, {
        name: string;
        versions: Set<string>;
        services: string[];
        description?: string;
      }>();

      for (const service of allServices) {
        for (const capability of service.capabilities) {
          if (!capabilityMap.has(capability.name)) {
            capabilityMap.set(capability.name, {
              name: capability.name,
              versions: new Set(),
              services: [],
              description: capability.description
            });
          }

          const capInfo = capabilityMap.get(capability.name)!;
          capInfo.versions.add(capability.version);
          if (!capInfo.services.includes(service.name)) {
            capInfo.services.push(service.name);
          }
        }
      }

      const capabilities = Array.from(capabilityMap.values()).map(cap => ({
        name: cap.name,
        versions: Array.from(cap.versions),
        services: cap.services,
        serviceCount: cap.services.length,
        description: cap.description
      }));

      res.json({
        capabilities,
        totalCapabilities: capabilities.length
      });
    } catch (error) {
      next(error);
    }
  });

  // Apply error handling middleware
  router.use(handleError);

  return router;
}

/**
 * Simple Redis client implementation for testing/development
 * In production, use a proper Redis client like ioredis or node-redis
 */
export class SimpleRedisClient implements RedisClient {
  private storage = new Map<string, { value: string; expiry?: number }>();
  private hashStorage = new Map<string, Map<string, string>>();

  async get(key: string): Promise<string | null> {
    const item = this.storage.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + (ttl * 1000) : undefined;
    this.storage.set(key, { value, expiry });
  }

  async del(key: string): Promise<number> {
    const existed = this.storage.has(key);
    this.storage.delete(key);
    this.hashStorage.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const item = this.storage.get(key);
    if (!item) return 0;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.storage.delete(key);
      return 0;
    }
    
    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const matchedKeys: string[] = [];
    
    for (const [key, item] of this.storage) {
      if (item.expiry && Date.now() > item.expiry) {
        this.storage.delete(key);
        continue;
      }
      
      if (regex.test(key)) {
        matchedKeys.push(key);
      }
    }
    
    return matchedKeys;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashStorage.get(key);
    if (!hash) return {};
    return Object.fromEntries(hash);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.hashStorage.has(key)) {
      this.hashStorage.set(key, new Map());
    }
    const hash = this.hashStorage.get(key)!;
    const existed = hash.has(field);
    hash.set(field, value);
    return existed ? 0 : 1;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.hashStorage.get(key);
    if (!hash) return 0;
    
    let deleted = 0;
    for (const field of fields) {
      if (hash.delete(field)) {
        deleted++;
      }
    }
    
    return deleted;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.storage.get(key);
    if (!item) return 0;
    
    item.expiry = Date.now() + (seconds * 1000);
    return 1;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<void> {
    this.storage.clear();
    this.hashStorage.clear();
  }
}

export default createRegistryApiRouter;