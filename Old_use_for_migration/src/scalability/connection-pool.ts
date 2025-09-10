/**
 * OSSA Connection Pool and Resource Manager
 * High-performance connection pooling and resource management for 1000+ agents
 */

import { EventEmitter } from 'events';

interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  maxIdleTime: number; // milliseconds
  acquireTimeout: number; // milliseconds
  createRetryAttempts: number;
  createRetryDelay: number;
  validateOnAcquire: boolean;
  validateOnReturn: boolean;
  testQuery?: string;
  warmupEnabled: boolean;
  monitoringEnabled: boolean;
}

interface ResourceManagerConfig {
  pools: Map<string, ConnectionPoolConfig>;
  globalLimits: {
    maxTotalConnections: number;
    maxConnectionsPerPool: number;
    memoryThreshold: number; // MB
    cpuThreshold: number; // percentage
  };
  cleanup: {
    interval: number;
    idleTimeout: number;
    orphanTimeout: number;
  };
  metrics: {
    enabled: boolean;
    retentionPeriod: number;
    aggregationInterval: number;
  };
}

interface Connection {
  id: string;
  poolId: string;
  resource: any;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
  isValid: boolean;
  metadata: {
    endpoint?: string;
    protocol?: string;
    credentials?: any;
    tags?: string[];
  };
}

interface ConnectionRequest {
  id: string;
  poolId: string;
  timestamp: Date;
  timeout: number;
  priority: 'low' | 'normal' | 'high';
  resolve: (connection: Connection) => void;
  reject: (error: Error) => void;
}

interface PoolStatistics {
  poolId: string;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingRequests: number;
  successfulAcquisitions: number;
  failedAcquisitions: number;
  timeouts: number;
  averageAcquisitionTime: number;
  averageConnectionLifetime: number;
  connectionCreateTime: number;
  connectionValidateTime: number;
}

interface ResourceMetrics {
  timestamp: Date;
  totalPools: number;
  totalConnections: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  pools: Map<string, PoolStatistics>;
  performance: {
    avgAcquisitionTime: number;
    p95AcquisitionTime: number;
    p99AcquisitionTime: number;
    errorRate: number;
    throughput: number;
  };
}

export class ConnectionPool extends EventEmitter {
  private config: ConnectionPoolConfig;
  private poolId: string;
  private connections: Map<string, Connection> = new Map();
  private availableConnections: Connection[] = [];
  private pendingRequests: ConnectionRequest[] = [];
  private statistics: PoolStatistics;
  private cleanupTimer?: NodeJS.Timeout;
  private monitoringTimer?: NodeJS.Timeout;
  private connectionFactory: (poolId: string) => Promise<any>;
  private validator?: (resource: any) => Promise<boolean>;
  private destroyer: (resource: any) => Promise<void>;

  constructor(
    poolId: string,
    connectionFactory: (poolId: string) => Promise<any>,
    destroyer: (resource: any) => Promise<void>,
    config: Partial<ConnectionPoolConfig> = {},
    validator?: (resource: any) => Promise<boolean>
  ) {
    super();

    this.poolId = poolId;
    this.connectionFactory = connectionFactory;
    this.destroyer = destroyer;
    this.validator = validator;

    this.config = {
      minConnections: 2,
      maxConnections: 20,
      maxIdleTime: 300000, // 5 minutes
      acquireTimeout: 30000, // 30 seconds
      createRetryAttempts: 3,
      createRetryDelay: 1000,
      validateOnAcquire: true,
      validateOnReturn: false,
      warmupEnabled: true,
      monitoringEnabled: true,
      ...config
    };

    this.initializeStatistics();
    this.startCleanupTimer();

    if (this.config.monitoringEnabled) {
      this.startMonitoring();
    }

    if (this.config.warmupEnabled) {
      this.warmupPool();
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(options?: {
    timeout?: number;
    priority?: 'low' | 'normal' | 'high';
    tags?: string[];
  }): Promise<Connection> {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    const timeout = options?.timeout || this.config.acquireTimeout;
    const priority = options?.priority || 'normal';

    return new Promise<Connection>((resolve, reject) => {
      const request: ConnectionRequest = {
        id: requestId,
        poolId: this.poolId,
        timestamp: new Date(),
        timeout,
        priority,
        resolve: (connection: Connection) => {
          const acquisitionTime = performance.now() - startTime;
          this.updateAcquisitionMetrics(true, acquisitionTime);
          resolve(connection);
        },
        reject: (error: Error) => {
          const acquisitionTime = performance.now() - startTime;
          this.updateAcquisitionMetrics(false, acquisitionTime);
          reject(error);
        }
      };

      // Try to fulfill request immediately
      this.tryFulfillRequest(request);

      // Set timeout for the request
      setTimeout(() => {
        this.handleRequestTimeout(request);
      }, timeout);
    });
  }

  /**
   * Return a connection to the pool
   */
  async release(connection: Connection): Promise<void> {
    try {
      // Validate connection if configured
      if (this.config.validateOnReturn && this.validator) {
        const isValid = await this.validator(connection.resource);
        connection.isValid = isValid;
        
        if (!isValid) {
          await this.destroyConnection(connection);
          this.emit('connection_invalidated', { connectionId: connection.id, poolId: this.poolId });
          return;
        }
      }

      // Update connection info
      connection.lastUsed = new Date();
      connection.useCount++;

      // Return to available pool
      this.availableConnections.push(connection);
      this.statistics.activeConnections--;

      // Try to fulfill pending requests
      this.processPendingRequests();

      this.emit('connection_released', { connectionId: connection.id, poolId: this.poolId });

    } catch (error) {
      this.emit('connection_release_error', { connectionId: connection.id, error });
      await this.destroyConnection(connection);
    }
  }

  /**
   * Get pool statistics
   */
  getStatistics(): PoolStatistics {
    return { ...this.statistics };
  }

  /**
   * Resize pool to target size
   */
  async resize(targetSize: number): Promise<void> {
    const currentSize = this.connections.size;
    
    if (targetSize > currentSize) {
      // Grow pool
      const connectionsToCreate = Math.min(
        targetSize - currentSize,
        this.config.maxConnections - currentSize
      );
      
      const createPromises = Array.from({ length: connectionsToCreate }, () =>
        this.createConnection()
      );
      
      await Promise.allSettled(createPromises);
      
    } else if (targetSize < currentSize) {
      // Shrink pool
      const connectionsToRemove = currentSize - Math.max(targetSize, this.config.minConnections);
      
      for (let i = 0; i < connectionsToRemove && this.availableConnections.length > 0; i++) {
        const connection = this.availableConnections.pop();
        if (connection) {
          await this.destroyConnection(connection);
        }
      }
    }

    this.emit('pool_resized', { 
      poolId: this.poolId, 
      previousSize: currentSize, 
      newSize: this.connections.size 
    });
  }

  /**
   * Drain pool (close all connections)
   */
  async drain(): Promise<void> {
    // Cancel all pending requests
    for (const request of this.pendingRequests) {
      request.reject(new Error('Pool is being drained'));
    }
    this.pendingRequests = [];

    // Close all connections
    const destroyPromises = Array.from(this.connections.values()).map(connection =>
      this.destroyConnection(connection)
    );

    await Promise.allSettled(destroyPromises);

    this.connections.clear();
    this.availableConnections = [];

    this.emit('pool_drained', { poolId: this.poolId });
  }

  /**
   * Test pool connectivity
   */
  async testConnectivity(): Promise<boolean> {
    try {
      const testConnection = await this.createConnection();
      await this.destroyConnection(testConnection);
      return true;
    } catch (error) {
      this.emit('connectivity_test_failed', { poolId: this.poolId, error });
      return false;
    }
  }

  /**
   * Try to fulfill a connection request
   */
  private async tryFulfillRequest(request: ConnectionRequest): Promise<void> {
    // Check if we have available connections
    if (this.availableConnections.length > 0) {
      const connection = this.availableConnections.pop()!;
      
      // Validate connection if configured
      if (this.config.validateOnAcquire && this.validator) {
        try {
          const isValid = await this.validator(connection.resource);
          if (!isValid) {
            await this.destroyConnection(connection);
            // Try to create new connection or add to pending
            await this.handleConnectionRequest(request);
            return;
          }
        } catch (error) {
          await this.destroyConnection(connection);
          await this.handleConnectionRequest(request);
          return;
        }
      }

      // Update statistics
      this.statistics.activeConnections++;
      this.statistics.successfulAcquisitions++;
      
      request.resolve(connection);
      return;
    }

    // No available connections, handle request
    await this.handleConnectionRequest(request);
  }

  /**
   * Handle connection request when no connections are available
   */
  private async handleConnectionRequest(request: ConnectionRequest): Promise<void> {
    // Check if we can create new connections
    if (this.connections.size < this.config.maxConnections) {
      try {
        const connection = await this.createConnection();
        this.statistics.activeConnections++;
        this.statistics.successfulAcquisitions++;
        request.resolve(connection);
        return;
      } catch (error) {
        this.statistics.failedAcquisitions++;
        request.reject(error as Error);
        return;
      }
    }

    // Add to pending requests queue (priority-ordered)
    this.insertRequestByPriority(request);
  }

  /**
   * Insert request into pending queue based on priority
   */
  private insertRequestByPriority(request: ConnectionRequest): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const requestPriority = priorityOrder[request.priority];

    let insertIndex = this.pendingRequests.length;
    for (let i = 0; i < this.pendingRequests.length; i++) {
      const existingPriority = priorityOrder[this.pendingRequests[i].priority];
      if (requestPriority < existingPriority) {
        insertIndex = i;
        break;
      }
    }

    this.pendingRequests.splice(insertIndex, 0, request);
    this.statistics.pendingRequests = this.pendingRequests.length;
  }

  /**
   * Process pending connection requests
   */
  private processPendingRequests(): void {
    while (this.pendingRequests.length > 0 && this.availableConnections.length > 0) {
      const request = this.pendingRequests.shift()!;
      const connection = this.availableConnections.pop()!;
      
      this.statistics.activeConnections++;
      this.statistics.successfulAcquisitions++;
      this.statistics.pendingRequests = this.pendingRequests.length;
      
      request.resolve(connection);
    }
  }

  /**
   * Handle request timeout
   */
  private handleRequestTimeout(request: ConnectionRequest): void {
    const index = this.pendingRequests.findIndex(r => r.id === request.id);
    if (index >= 0) {
      this.pendingRequests.splice(index, 1);
      this.statistics.pendingRequests = this.pendingRequests.length;
      this.statistics.timeouts++;
      request.reject(new Error(`Connection acquisition timeout after ${request.timeout}ms`));
    }
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<Connection> {
    const startTime = performance.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.createRetryAttempts; attempt++) {
      try {
        const resource = await this.connectionFactory(this.poolId);
        const connection: Connection = {
          id: this.generateConnectionId(),
          poolId: this.poolId,
          resource,
          createdAt: new Date(),
          lastUsed: new Date(),
          useCount: 0,
          isValid: true,
          metadata: {}
        };

        this.connections.set(connection.id, connection);
        this.statistics.totalConnections = this.connections.size;
        this.statistics.connectionCreateTime = performance.now() - startTime;

        this.emit('connection_created', { connectionId: connection.id, poolId: this.poolId });
        return connection;

      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.createRetryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.createRetryDelay));
        }
      }
    }

    this.emit('connection_create_failed', { poolId: this.poolId, error: lastError });
    throw lastError || new Error('Failed to create connection');
  }

  /**
   * Destroy a connection
   */
  private async destroyConnection(connection: Connection): Promise<void> {
    try {
      await this.destroyer(connection.resource);
      this.connections.delete(connection.id);
      
      // Remove from available connections if present
      const availableIndex = this.availableConnections.findIndex(c => c.id === connection.id);
      if (availableIndex >= 0) {
        this.availableConnections.splice(availableIndex, 1);
      }

      this.statistics.totalConnections = this.connections.size;
      this.emit('connection_destroyed', { connectionId: connection.id, poolId: this.poolId });

    } catch (error) {
      this.emit('connection_destroy_error', { connectionId: connection.id, error });
    }
  }

  /**
   * Warmup pool with minimum connections
   */
  private async warmupPool(): Promise<void> {
    try {
      const connectionsToCreate = this.config.minConnections;
      const createPromises = Array.from({ length: connectionsToCreate }, () =>
        this.createConnection().then(connection => {
          this.availableConnections.push(connection);
          return connection;
        })
      );

      await Promise.allSettled(createPromises);
      this.emit('pool_warmed_up', { poolId: this.poolId, connections: this.availableConnections.length });

    } catch (error) {
      this.emit('pool_warmup_error', { poolId: this.poolId, error });
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 60000); // Run every minute
  }

  /**
   * Start monitoring timer
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.updateStatistics();
      this.emit('pool_statistics', this.statistics);
    }, 30000); // Update every 30 seconds
  }

  /**
   * Perform cleanup of idle connections
   */
  private performCleanup(): void {
    const now = new Date();
    const idleTimeout = this.config.maxIdleTime;
    const connectionsToRemove: Connection[] = [];

    // Find idle connections to remove
    for (const connection of this.availableConnections) {
      const idleTime = now.getTime() - connection.lastUsed.getTime();
      if (idleTime > idleTimeout && this.connections.size > this.config.minConnections) {
        connectionsToRemove.push(connection);
      }
    }

    // Remove idle connections
    for (const connection of connectionsToRemove) {
      this.destroyConnection(connection);
    }

    if (connectionsToRemove.length > 0) {
      this.emit('idle_connections_cleaned', { 
        poolId: this.poolId, 
        removed: connectionsToRemove.length 
      });
    }
  }

  /**
   * Update pool statistics
   */
  private updateStatistics(): void {
    this.statistics.totalConnections = this.connections.size;
    this.statistics.idleConnections = this.availableConnections.length;
    this.statistics.pendingRequests = this.pendingRequests.length;

    // Calculate average connection lifetime
    let totalLifetime = 0;
    let activeConnections = 0;
    const now = Date.now();

    for (const connection of this.connections.values()) {
      totalLifetime += now - connection.createdAt.getTime();
      activeConnections++;
    }

    this.statistics.averageConnectionLifetime = activeConnections > 0 ? 
      totalLifetime / activeConnections : 0;
  }

  /**
   * Update acquisition metrics
   */
  private updateAcquisitionMetrics(successful: boolean, acquisitionTime: number): void {
    if (successful) {
      this.statistics.successfulAcquisitions++;
    } else {
      this.statistics.failedAcquisitions++;
    }

    // Update average acquisition time with exponential moving average
    this.statistics.averageAcquisitionTime = 
      (this.statistics.averageAcquisitionTime * 0.9) + (acquisitionTime * 0.1);
  }

  /**
   * Initialize statistics
   */
  private initializeStatistics(): void {
    this.statistics = {
      poolId: this.poolId,
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      pendingRequests: 0,
      successfulAcquisitions: 0,
      failedAcquisitions: 0,
      timeouts: 0,
      averageAcquisitionTime: 0,
      averageConnectionLifetime: 0,
      connectionCreateTime: 0,
      connectionValidateTime: 0
    };
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${this.poolId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop pool and cleanup resources
   */
  async stop(): Promise<void> {
    // Clear timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    // Drain the pool
    await this.drain();

    this.emit('pool_stopped', { poolId: this.poolId });
  }
}

/**
 * Resource Manager - manages multiple connection pools
 */
export class ResourceManager extends EventEmitter {
  private config: ResourceManagerConfig;
  private pools: Map<string, ConnectionPool> = new Map();
  private globalMetrics: ResourceMetrics;
  private monitoringTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<ResourceManagerConfig> = {}) {
    super();

    this.config = {
      pools: new Map(),
      globalLimits: {
        maxTotalConnections: 1000,
        maxConnectionsPerPool: 100,
        memoryThreshold: 2048, // 2GB
        cpuThreshold: 80
      },
      cleanup: {
        interval: 300000, // 5 minutes
        idleTimeout: 600000, // 10 minutes
        orphanTimeout: 1800000 // 30 minutes
      },
      metrics: {
        enabled: true,
        retentionPeriod: 86400000, // 24 hours
        aggregationInterval: 60000 // 1 minute
      },
      ...config
    };

    this.initializeGlobalMetrics();
    this.startMonitoring();
    this.startCleanup();
  }

  /**
   * Create a new connection pool
   */
  createPool(
    poolId: string,
    connectionFactory: (poolId: string) => Promise<any>,
    destroyer: (resource: any) => Promise<void>,
    config?: Partial<ConnectionPoolConfig>,
    validator?: (resource: any) => Promise<boolean>
  ): ConnectionPool {
    if (this.pools.has(poolId)) {
      throw new Error(`Pool ${poolId} already exists`);
    }

    // Apply global limits to pool config
    const poolConfig = {
      maxConnections: Math.min(
        config?.maxConnections || 20,
        this.config.globalLimits.maxConnectionsPerPool
      ),
      ...config
    };

    const pool = new ConnectionPool(poolId, connectionFactory, destroyer, poolConfig, validator);

    // Set up pool event handlers
    pool.on('connection_created', (event) => {
      this.checkGlobalLimits();
      this.emit('pool_connection_created', { ...event, poolId });
    });

    pool.on('connection_destroyed', (event) => {
      this.emit('pool_connection_destroyed', { ...event, poolId });
    });

    pool.on('pool_statistics', (stats) => {
      this.updatePoolMetrics(poolId, stats);
    });

    this.pools.set(poolId, pool);
    this.emit('pool_created', { poolId, config: poolConfig });

    return pool;
  }

  /**
   * Get existing pool
   */
  getPool(poolId: string): ConnectionPool | undefined {
    return this.pools.get(poolId);
  }

  /**
   * Remove and stop a pool
   */
  async removePool(poolId: string): Promise<void> {
    const pool = this.pools.get(poolId);
    if (!pool) return;

    await pool.stop();
    this.pools.delete(poolId);
    this.emit('pool_removed', { poolId });
  }

  /**
   * Get global resource metrics
   */
  getGlobalMetrics(): ResourceMetrics {
    return { ...this.globalMetrics };
  }

  /**
   * Get all pool statistics
   */
  getAllPoolStatistics(): Map<string, PoolStatistics> {
    const allStats = new Map<string, PoolStatistics>();
    
    for (const [poolId, pool] of this.pools) {
      allStats.set(poolId, pool.getStatistics());
    }
    
    return allStats;
  }

  /**
   * Auto-scale pools based on load
   */
  async autoScale(): Promise<void> {
    for (const [poolId, pool] of this.pools) {
      const stats = pool.getStatistics();
      
      // Scale up if high utilization
      if (stats.pendingRequests > 5 && stats.totalConnections < this.config.globalLimits.maxConnectionsPerPool) {
        const targetSize = Math.min(
          stats.totalConnections + Math.ceil(stats.pendingRequests / 2),
          this.config.globalLimits.maxConnectionsPerPool
        );
        
        await pool.resize(targetSize);
        this.emit('pool_scaled_up', { poolId, newSize: targetSize });
      }
      
      // Scale down if low utilization
      else if (stats.activeConnections < stats.totalConnections * 0.3 && 
               stats.pendingRequests === 0 && 
               stats.totalConnections > 2) {
        const targetSize = Math.max(2, Math.ceil(stats.totalConnections * 0.7));
        
        await pool.resize(targetSize);
        this.emit('pool_scaled_down', { poolId, newSize: targetSize });
      }
    }
  }

  /**
   * Health check all pools
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const healthResults = new Map<string, boolean>();
    
    const healthPromises = Array.from(this.pools.entries()).map(async ([poolId, pool]) => {
      try {
        const isHealthy = await pool.testConnectivity();
        healthResults.set(poolId, isHealthy);
        return { poolId, healthy: isHealthy };
      } catch (error) {
        healthResults.set(poolId, false);
        this.emit('pool_health_check_failed', { poolId, error });
        return { poolId, healthy: false };
      }
    });

    await Promise.allSettled(healthPromises);
    
    this.emit('global_health_check_completed', { results: healthResults });
    return healthResults;
  }

  /**
   * Get resource usage summary
   */
  getResourceUsage(): {
    totalPools: number;
    totalConnections: number;
    activeConnections: number;
    memoryUsage: number;
    cpuUsage: number;
    utilizationRate: number;
  } {
    let totalConnections = 0;
    let activeConnections = 0;

    for (const pool of this.pools.values()) {
      const stats = pool.getStatistics();
      totalConnections += stats.totalConnections;
      activeConnections += stats.activeConnections;
    }

    const utilizationRate = totalConnections > 0 ? activeConnections / totalConnections : 0;

    return {
      totalPools: this.pools.size,
      totalConnections,
      activeConnections,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: 0, // Would need actual CPU monitoring
      utilizationRate
    };
  }

  /**
   * Check global resource limits
   */
  private checkGlobalLimits(): void {
    const usage = this.getResourceUsage();
    
    // Check connection limits
    if (usage.totalConnections > this.config.globalLimits.maxTotalConnections) {
      this.emit('global_limit_exceeded', { 
        type: 'connections', 
        current: usage.totalConnections, 
        limit: this.config.globalLimits.maxTotalConnections 
      });
    }

    // Check memory limits
    if (usage.memoryUsage > this.config.globalLimits.memoryThreshold) {
      this.emit('global_limit_exceeded', { 
        type: 'memory', 
        current: usage.memoryUsage, 
        limit: this.config.globalLimits.memoryThreshold 
      });
    }

    // Check CPU limits (if monitoring is available)
    if (usage.cpuUsage > this.config.globalLimits.cpuThreshold) {
      this.emit('global_limit_exceeded', { 
        type: 'cpu', 
        current: usage.cpuUsage, 
        limit: this.config.globalLimits.cpuThreshold 
      });
    }
  }

  /**
   * Initialize global metrics
   */
  private initializeGlobalMetrics(): void {
    this.globalMetrics = {
      timestamp: new Date(),
      totalPools: 0,
      totalConnections: 0,
      activeConnections: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      pools: new Map(),
      performance: {
        avgAcquisitionTime: 0,
        p95AcquisitionTime: 0,
        p99AcquisitionTime: 0,
        errorRate: 0,
        throughput: 0
      }
    };
  }

  /**
   * Update metrics for specific pool
   */
  private updatePoolMetrics(poolId: string, stats: PoolStatistics): void {
    this.globalMetrics.pools.set(poolId, stats);
    this.updateGlobalMetrics();
  }

  /**
   * Update global metrics
   */
  private updateGlobalMetrics(): void {
    const usage = this.getResourceUsage();
    
    this.globalMetrics.timestamp = new Date();
    this.globalMetrics.totalPools = usage.totalPools;
    this.globalMetrics.totalConnections = usage.totalConnections;
    this.globalMetrics.activeConnections = usage.activeConnections;
    this.globalMetrics.memoryUsage = usage.memoryUsage;
    this.globalMetrics.cpuUsage = usage.cpuUsage;

    // Calculate performance metrics
    let totalAcquisitionTime = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let acquisitionTimes: number[] = [];

    for (const stats of this.globalMetrics.pools.values()) {
      totalAcquisitionTime += stats.averageAcquisitionTime * stats.successfulAcquisitions;
      totalSuccessful += stats.successfulAcquisitions;
      totalFailed += stats.failedAcquisitions;
      
      // Simulate acquisition time distribution for percentiles
      for (let i = 0; i < stats.successfulAcquisitions; i++) {
        acquisitionTimes.push(stats.averageAcquisitionTime + (Math.random() - 0.5) * 20);
      }
    }

    if (totalSuccessful > 0) {
      this.globalMetrics.performance.avgAcquisitionTime = totalAcquisitionTime / totalSuccessful;
      this.globalMetrics.performance.errorRate = totalFailed / (totalSuccessful + totalFailed);
      
      // Calculate percentiles
      acquisitionTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(acquisitionTimes.length * 0.95);
      const p99Index = Math.floor(acquisitionTimes.length * 0.99);
      
      this.globalMetrics.performance.p95AcquisitionTime = acquisitionTimes[p95Index] || 0;
      this.globalMetrics.performance.p99AcquisitionTime = acquisitionTimes[p99Index] || 0;
    }

    this.emit('global_metrics_updated', this.globalMetrics);
  }

  /**
   * Start monitoring timer
   */
  private startMonitoring(): void {
    if (!this.config.metrics.enabled) return;

    this.monitoringTimer = setInterval(() => {
      this.updateGlobalMetrics();
      
      // Auto-scale pools if needed
      this.autoScale().catch(error => {
        this.emit('auto_scale_error', { error });
      });
      
    }, this.config.metrics.aggregationInterval);
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performGlobalCleanup();
    }, this.config.cleanup.interval);
  }

  /**
   * Perform global cleanup tasks
   */
  private performGlobalCleanup(): void {
    // Check for orphaned resources, memory leaks, etc.
    const usage = this.getResourceUsage();
    
    if (usage.memoryUsage > this.config.globalLimits.memoryThreshold * 0.8) {
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
        this.emit('garbage_collection_triggered', { memoryUsage: usage.memoryUsage });
      }
    }

    this.emit('global_cleanup_completed', { 
      pools: this.pools.size, 
      connections: usage.totalConnections 
    });
  }

  /**
   * Stop resource manager and all pools
   */
  async stop(): Promise<void> {
    // Clear timers
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Stop all pools
    const stopPromises = Array.from(this.pools.values()).map(pool => pool.stop());
    await Promise.allSettled(stopPromises);

    this.pools.clear();
    this.emit('resource_manager_stopped');
  }
}