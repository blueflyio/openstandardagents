/**
 * Agent Factory Service
 * Creates and manages different agent types
 */
import { logger } from '../utils/logger.js';
export class AgentFactory {
    agentTypes;
    registry;
    constructor(registry) {
        this.agentTypes = new Map();
        this.registry = registry;
    }
    /**
     * Register an agent type implementation
     */
    registerAgentType(type, implementation) {
        this.agentTypes.set(type, implementation);
        logger.info(`Registered agent type: ${type}`);
    }
    /**
     * Create an agent of specified type
     */
    async createAgent(type, config) {
        const AgentClass = this.agentTypes.get(type);
        if (!AgentClass) {
            throw new Error(`Agent type ${type} not registered`);
        }
        try {
            // Create agent instance
            const agent = new AgentClass(config);
            // Wait for initialization
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Agent initialization timeout for ${type}`));
                }, 30000);
                if ('once' in agent && typeof agent.once === 'function') {
                    agent.once('initialized', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                    agent.once('error', (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    });
                }
                else {
                    // If no event emitter, just wait a bit
                    setTimeout(() => {
                        clearTimeout(timeout);
                        resolve();
                    }, 100);
                }
            });
            // Register with registry
            await this.registry.registerAgent(agent, type, config);
            logger.info(`Created ${type} agent: ${agent.name} (${agent.id})`);
            return agent;
        }
        catch (error) {
            logger.error(`Failed to create ${type} agent:`, error);
            throw error;
        }
    }
    /**
     * Get available agent types
     */
    getAvailableTypes() {
        return Array.from(this.agentTypes.keys());
    }
    /**
     * Get agents by type
     */
    async getAgentsByType(type) {
        const registrations = await this.registry.getAgentsByType(type);
        return registrations.map(reg => reg.agent);
    }
    /**
     * Create multiple agents of the same type
     */
    async createAgentPool(type, baseConfig, count) {
        const agents = [];
        for (let i = 0; i < count; i++) {
            const config = {
                ...baseConfig,
                name: `${baseConfig.name}-${i + 1}`
            };
            const agent = await this.createAgent(type, config);
            agents.push(agent);
        }
        logger.info(`Created agent pool of ${count} ${type} agents`);
        return agents;
    }
    /**
     * Import agent from agent-forge
     * This creates a bridge between OSSA and agent-forge agents
     */
    async importFromAgentForge(agentPath, type, config) {
        try {
            // Dynamic import of agent-forge agent
            const AgentModule = await import(agentPath);
            const AgentClass = AgentModule.default || AgentModule;
            // Create wrapper that implements BaseCapabilities
            class AgentForgeWrapper extends AgentClass {
                _id;
                _status;
                name;
                version;
                description;
                constructor(config) {
                    super(config);
                    this._id = `forge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    this._status = 'active';
                    this.name = config.name || 'agent-forge-import';
                    this.version = config.version || '1.0.0';
                    this.description = config.description || 'Imported from agent-forge';
                }
                get id() {
                    return this._id;
                }
                get status() {
                    return this._status;
                }
                async healthCheck() {
                    // If original has healthCheck, use it
                    if (super.healthCheck) {
                        return super.healthCheck();
                    }
                    // Otherwise, basic check
                    return this._status === 'active';
                }
                async getMetrics() {
                    // If original has getMetrics, use it
                    if (super.getMetrics) {
                        return super.getMetrics();
                    }
                    // Otherwise, return basic metrics
                    return {
                        requestsProcessed: 0,
                        averageResponseTime: 0,
                        errorRate: 0,
                        lastActive: new Date(),
                        uptime: 0,
                        memoryUsage: process.memoryUsage().heapUsed,
                        cpuUsage: 0
                    };
                }
                async shutdown() {
                    // If original has shutdown, use it
                    if (super.shutdown) {
                        return super.shutdown();
                    }
                    this._status = 'inactive';
                }
            }
            // Create wrapped instance
            const agent = new AgentForgeWrapper(config);
            // Register with registry
            await this.registry.registerAgent(agent, type, {
                ...config,
                source: 'agent-forge',
                originalPath: agentPath
            });
            logger.info(`Imported agent-forge agent from ${agentPath} as ${type}`);
            return agent;
        }
        catch (error) {
            logger.error(`Failed to import agent from ${agentPath}:`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=agent-factory.js.map