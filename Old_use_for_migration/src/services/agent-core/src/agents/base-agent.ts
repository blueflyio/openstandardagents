/**
 * Base Agent Implementation
 * Provides core functionality for all agent types
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { 
  BaseCapabilities, 
  AgentMetrics, 
  AgentType 
} from '../types/agent-types.js';
import { logger } from '../utils/logger.js';

export abstract class BaseAgent extends EventEmitter implements BaseCapabilities {
  public readonly id: string;
  public name: string;
  public version: string;
  public description: string;
  public status: 'active' | 'inactive' | 'error' | 'initializing';
  
  protected metricsData: {
    requestsProcessed: number;
    totalResponseTime: number;
    errors: number;
    startTime: Date;
    lastActive: Date;
  };
  
  protected abstract agentType: AgentType;
  
  constructor(config: {
    name: string;
    version?: string;
    description?: string;
  }) {
    super();
    
    this.id = uuidv4();
    this.name = config.name;
    this.version = config.version || '1.0.0';
    this.description = config.description || '';
    this.status = 'initializing';
    
    this.metricsData = {
      requestsProcessed: 0,
      totalResponseTime: 0,
      errors: 0,
      startTime: new Date(),
      lastActive: new Date()
    };
    
    // Initialization will be called explicitly after construction
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    try {
      logger.info(`Initializing ${this.agentType} agent: ${this.name} (${this.id})`);
      
      // Perform agent-specific initialization
      await this.onInitialize();
      
      this.status = 'active';
      this.emit('initialized', { agentId: this.id, type: this.agentType });
      
      logger.info(`Agent ${this.name} initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize agent ${this.name}:`, error);
      this.status = 'error';
      this.emit('error', { agentId: this.id, error });
      throw error;
    }
  }
  
  /**
   * Abstract method for agent-specific initialization
   */
  protected abstract onInitialize(): Promise<void>;
  
  /**
   * Health check implementation
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Basic health check
      if (this.status === 'error') {
        return false;
      }
      
      // Check memory usage
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
        logger.warn(`Agent ${this.name} memory usage high: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Perform agent-specific health check
      const specificHealth = await this.onHealthCheck();
      
      return this.status === 'active' && specificHealth;
    } catch (error) {
      logger.error(`Health check failed for agent ${this.name}:`, error);
      return false;
    }
  }
  
  /**
   * Abstract method for agent-specific health check
   */
  protected abstract onHealthCheck(): Promise<boolean>;
  
  /**
   * Get agent metrics
   */
  public async getMetrics(): Promise<AgentMetrics> {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.metricsData.startTime.getTime();
    
    return {
      requestsProcessed: this.metricsData.requestsProcessed,
      averageResponseTime: this.metricsData.requestsProcessed > 0 
        ? this.metricsData.totalResponseTime / this.metricsData.requestsProcessed 
        : 0,
      errorRate: this.metricsData.requestsProcessed > 0
        ? this.metricsData.errors / this.metricsData.requestsProcessed
        : 0,
      lastActive: this.metricsData.lastActive,
      uptime,
      memoryUsage: memUsage.heapUsed,
      cpuUsage: process.cpuUsage().user / 1000000 // Convert to seconds
    };
  }
  
  /**
   * Process a request with metrics tracking
   */
  protected async processRequest<T, R>(
    operation: string,
    handler: () => Promise<R>
  ): Promise<R> {
    const startTime = Date.now();
    
    try {
      logger.debug(`Agent ${this.name} processing ${operation}`);
      
      const result = await handler();
      
      const responseTime = Date.now() - startTime;
      this.metricsData.requestsProcessed++;
      this.metricsData.totalResponseTime += responseTime;
      this.metricsData.lastActive = new Date();
      
      this.emit('request_processed', {
        agentId: this.id,
        operation,
        responseTime
      });
      
      return result;
    } catch (error) {
      this.metricsData.errors++;
      
      logger.error(`Agent ${this.name} failed ${operation}:`, error);
      
      this.emit('request_failed', {
        agentId: this.id,
        operation,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Shutdown the agent gracefully
   */
  public async shutdown(): Promise<void> {
    logger.info(`Shutting down agent ${this.name}`);
    
    this.status = 'inactive';
    
    // Perform agent-specific shutdown
    await this.onShutdown();
    
    this.emit('shutdown', { agentId: this.id });
  }
  
  /**
   * Abstract method for agent-specific shutdown
   */
  protected abstract onShutdown(): Promise<void>;
  
  /**
   * Get agent information
   */
  public getInfo(): {
    id: string;
    name: string;
    type: AgentType;
    version: string;
    description: string;
    status: string;
  } {
    return {
      id: this.id,
      name: this.name,
      type: this.agentType,
      version: this.version,
      description: this.description,
      status: this.status
    };
  }
  
  /**
   * Update agent status
   */
  protected setStatus(status: 'active' | 'inactive' | 'error' | 'initializing'): void {
    const oldStatus = this.status;
    this.status = status;
    
    this.emit('status_changed', {
      agentId: this.id,
      oldStatus,
      newStatus: status
    });
    
    logger.info(`Agent ${this.name} status changed: ${oldStatus} -> ${status}`);
  }
}