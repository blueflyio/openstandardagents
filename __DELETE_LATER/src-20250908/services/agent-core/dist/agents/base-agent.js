/**
 * Base Agent Implementation
 * Provides core functionality for all agent types
 */
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
export class BaseAgent extends EventEmitter {
    id;
    name;
    version;
    description;
    status;
    metricsData;
    constructor(config) {
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
        this.initialize();
    }
    /**
     * Initialize the agent
     */
    async initialize() {
        try {
            logger.info(`Initializing ${this.agentType} agent: ${this.name} (${this.id})`);
            // Perform agent-specific initialization
            await this.onInitialize();
            this.status = 'active';
            this.emit('initialized', { agentId: this.id, type: this.agentType });
            logger.info(`Agent ${this.name} initialized successfully`);
        }
        catch (error) {
            logger.error(`Failed to initialize agent ${this.name}:`, error);
            this.status = 'error';
            this.emit('error', { agentId: this.id, error });
            throw error;
        }
    }
    /**
     * Health check implementation
     */
    async healthCheck() {
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
        }
        catch (error) {
            logger.error(`Health check failed for agent ${this.name}:`, error);
            return false;
        }
    }
    /**
     * Get agent metrics
     */
    async getMetrics() {
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
    async processRequest(operation, handler) {
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
        }
        catch (error) {
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
    async shutdown() {
        logger.info(`Shutting down agent ${this.name}`);
        this.status = 'inactive';
        // Perform agent-specific shutdown
        await this.onShutdown();
        this.emit('shutdown', { agentId: this.id });
    }
    /**
     * Get agent information
     */
    getInfo() {
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
    setStatus(status) {
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
//# sourceMappingURL=base-agent.js.map