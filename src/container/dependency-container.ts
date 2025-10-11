import { AgentService } from '../services/AgentService';
import { MonitoringService } from '../services/MonitoringService';
import { OrchestrationService } from '../services/OrchestrationService';
import { SpecificationService } from '../services/SpecificationService';
import { WorkflowService } from '../services/WorkflowService';

// ===== SOLID: Dependency injection tokens =====
export const TOKENS = {
  // Core services
  AGENT_SERVICE: 'AgentService',
  WORKFLOW_SERVICE: 'WorkflowService',
  SPECIFICATION_SERVICE: 'SpecificationService',
  MONITORING_SERVICE: 'MonitoringService',
  ORCHESTRATION_SERVICE: 'OrchestrationService',

  // Infrastructure services
  LOGGER_SERVICE: 'LoggerService',
  VALIDATION_SERVICE: 'ValidationService',
  CACHE_SERVICE: 'CacheService',
  CONFIG_SERVICE: 'ConfigService',
  DATABASE_SERVICE: 'DatabaseService',

  // External services
  DISCOVERY_SERVICE: 'DiscoveryService',
  HEALTH_SERVICE: 'HealthService',
  METRICS_SERVICE: 'MetricsService'
} as const;

// ===== SOLID: Service interfaces for dependency inversion =====
export interface IAgentService {
  list(request: any): Promise<any>;
  get(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, updates: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  deploy(id: string): Promise<boolean>;
  undeploy(id: string): Promise<boolean>;
  getHealth(id: string): Promise<any>;
  getMetrics(id: string): Promise<any>;
}

export interface IWorkflowService {
  list(request: any): Promise<any>;
  get(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, updates: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  start(id: string): Promise<boolean>;
  stop(id: string): Promise<boolean>;
  getStatus(id: string): Promise<any>;
  getTasks(id: string): Promise<any>;
}

export interface ISpecificationService {
  list(request: any): Promise<any>;
  get(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, updates: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  validate(id: string): Promise<any>;
  publish(id: string): Promise<boolean>;
  deprecate(id: string): Promise<boolean>;
}

export interface IMonitoringService {
  getMetrics(): Promise<any>;
  getAlerts(): Promise<any>;
  createAlert(data: any): Promise<any>;
  updateAlert(id: string, updates: any): Promise<any>;
  deleteAlert(id: string): Promise<boolean>;
  getHealth(): Promise<any>;
  getSystemStatus(): Promise<any>;
}

export interface IOrchestrationService {
  executeWorkflow(workflowId: string, parameters?: any): Promise<any>;
  scheduleWorkflow(workflowId: string, schedule: any): Promise<any>;
  cancelWorkflow(workflowId: string): Promise<boolean>;
  getWorkflowStatus(workflowId: string): Promise<any>;
  getWorkflowHistory(workflowId: string): Promise<any>;
}

export interface ILoggerService {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface IValidationService {
  validateRequest(schema: any): any;
  validateAgent(data: any): boolean;
  validateWorkflow(data: any): boolean;
  validateSpecification(data: any): boolean;
  sanitizeInput(input: any): any;
}

export interface ICacheService {
  get(key: string): any;
  set(key: string, value: any, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

export interface IConfigService {
  get(key: string): any;
  set(key: string, value: any): void;
  has(key: string): boolean;
  getAll(): any;
}

export interface IDatabaseService {
  query(sql: string, params?: any[]): Promise<any>;
  transaction(callback: (tx: any) => Promise<any>): Promise<any>;
  close(): Promise<void>;
}

export interface IDiscoveryService {
  discoverAgents(): Promise<any>;
  registerAgent(agent: any): Promise<boolean>;
  unregisterAgent(agentId: string): Promise<boolean>;
  findAgents(criteria: any): Promise<any>;
}

export interface IHealthService {
  checkHealth(): Promise<any>;
  checkReadiness(): Promise<any>;
  getServiceStatus(): Promise<any>;
}

export interface IMetricsService {
  recordMetric(name: string, value: number, labels?: any): void;
  getMetrics(): Promise<any>;
  exportMetrics(): Promise<string>;
}

// ===== SOLID: Dependency injection container =====
export class DependencyContainer {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();

  constructor() {
    this.registerDefaultServices();
  }

  /**
   * Register a service with the container
   */
  register<T>(token: string, factory: () => T, singleton = true): void {
    if (singleton) {
      this.singletons.set(token, factory);
    } else {
      this.services.set(token, factory);
    }
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: string): T {
    // Check singletons first
    if (this.singletons.has(token)) {
      const factory = this.singletons.get(token);
      if (!this.services.has(token)) {
        this.services.set(token, factory());
      }
      return this.services.get(token);
    }

    // Check regular services
    if (this.services.has(token)) {
      const factory = this.services.get(token);
      return factory();
    }

    throw new Error(`Service not found: ${token}`);
  }

  /**
   * Check if a service is registered
   */
  has(token: string): boolean {
    return this.singletons.has(token) || this.services.has(token);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * Register default services
   */
  private registerDefaultServices(): void {
    // Core services
    this.register(TOKENS.AGENT_SERVICE, () => new AgentService());
    this.register(TOKENS.WORKFLOW_SERVICE, () => new WorkflowService());
    this.register(TOKENS.SPECIFICATION_SERVICE, () => new SpecificationService());
    this.register(TOKENS.MONITORING_SERVICE, () => new MonitoringService());
    this.register(TOKENS.ORCHESTRATION_SERVICE, () => new OrchestrationService());

    // Infrastructure services
    this.register(TOKENS.LOGGER_SERVICE, () => ({
      info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
      warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta),
      error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
      debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta)
    }));

    this.register(TOKENS.VALIDATION_SERVICE, () => ({
      validateRequest: (schema: any) => (req: any, res: any, next: any) => {
        // Implementation would use Zod validation
        next();
      },
      validateAgent: (data: any) => true,
      validateWorkflow: (data: any) => true,
      validateSpecification: (data: any) => true,
      sanitizeInput: (input: any) => input
    }));

    this.register(TOKENS.CACHE_SERVICE, () => ({
      cache: new Map(),
      get: function (key: string) {
        return this.cache.get(key);
      },
      set: function (key: string, value: any, ttl?: number) {
        this.cache.set(key, value);
      },
      delete: function (key: string) {
        this.cache.delete(key);
      },
      clear: function () {
        this.cache.clear();
      },
      has: function (key: string) {
        return this.cache.has(key);
      }
    }));

    this.register(TOKENS.CONFIG_SERVICE, () => ({
      config: new Map(),
      get: function (key: string) {
        return this.config.get(key);
      },
      set: function (key: string, value: any) {
        this.config.set(key, value);
      },
      has: function (key: string) {
        return this.config.has(key);
      },
      getAll: function () {
        return Object.fromEntries(this.config);
      }
    }));

    this.register(TOKENS.DATABASE_SERVICE, () => ({
      query: async (sql: string, params?: any[]) => ({ rows: [] }),
      transaction: async (callback: (tx: any) => Promise<any>) => callback({}),
      close: async () => {}
    }));

    this.register(TOKENS.DISCOVERY_SERVICE, () => ({
      discoverAgents: async () => [],
      registerAgent: async (agent: any) => true,
      unregisterAgent: async (agentId: string) => true,
      findAgents: async (criteria: any) => []
    }));

    this.register(TOKENS.HEALTH_SERVICE, () => ({
      checkHealth: async () => ({ status: 'healthy' }),
      checkReadiness: async () => ({ status: 'ready' }),
      getServiceStatus: async () => ({ services: {} })
    }));

    this.register(TOKENS.METRICS_SERVICE, () => ({
      metrics: new Map(),
      recordMetric: function (name: string, value: number, labels?: any) {
        this.metrics.set(name, { value, labels, timestamp: Date.now() });
      },
      getMetrics: async function () {
        return Object.fromEntries(this.metrics);
      },
      exportMetrics: async function () {
        return '# HELP ossa_metrics OSSA Platform Metrics\n';
      }
    }));
  }
}

// ===== SOLID: Global container instance =====
export const container = new DependencyContainer();

// ===== SOLID: Service factory functions =====
export function getService<T>(token: string): T {
  return container.resolve<T>(token);
}

export function registerService<T>(token: string, factory: () => T, singleton = true): void {
  container.register(token, factory, singleton);
}

export function hasService(token: string): boolean {
  return container.has(token);
}

// ===== SOLID: Service initialization =====
export function initializeServices(): void {
  // Services are automatically initialized when first resolved
  // This function can be used to pre-initialize critical services
  getService<IAgentService>(TOKENS.AGENT_SERVICE);
  getService<IWorkflowService>(TOKENS.WORKFLOW_SERVICE);
  getService<ISpecificationService>(TOKENS.SPECIFICATION_SERVICE);
  getService<IMonitoringService>(TOKENS.MONITORING_SERVICE);
  getService<IOrchestrationService>(TOKENS.ORCHESTRATION_SERVICE);
}

// ===== SOLID: Service health check =====
export function getServiceHealth(): Record<string, 'healthy' | 'unhealthy'> {
  const health: Record<string, 'healthy' | 'unhealthy'> = {};

  Object.values(TOKENS).forEach((token) => {
    try {
      getService(token);
      health[token] = 'healthy';
    } catch (error) {
      health[token] = 'unhealthy';
    }
  });

  return health;
}
