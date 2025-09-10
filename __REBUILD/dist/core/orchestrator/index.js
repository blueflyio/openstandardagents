/**
 * OSSA Core Orchestrator - Production Platform
 * Enterprise-grade agent coordination with 360° feedback loop
 * Plan → Execute → Review → Judge → Learn → Govern
 */
import { EventEmitter } from 'events';
import { AgentType, AgentStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';
export class OrchestratorPlatform extends EventEmitter {
    agents = new Map();
    workflows = new Map();
    executions = new Map();
    allocations = new Map();
    taskQueue = [];
    config;
    healthMetrics;
    constructor(config) {
        super();
        this.config = config;
        this.healthMetrics = {
            totalWorkflows: 0,
            activeExecutions: 0,
            avgExecutionTime: 0,
            resourceUtilization: 0,
            errorRate: 0
        };
        this.initialize();
    }
    async initialize() {
        console.log('[ORCHESTRATOR-PLATFORM] Initializing production orchestration engine...');
        await this.loadAgents();
        await this.setupMessageBus();
        await this.startScheduler();
        await this.initializeHealthMonitoring();
        this.emit('orchestrator:ready');
        console.log('[ORCHESTRATOR-PLATFORM] Production orchestration engine ready');
    }
    /**
     * Register agent with production capabilities validation
     */
    async registerAgent(agent) {
        // Validate agent capabilities for production
        if (!this.validateAgentForProduction(agent)) {
            throw new Error(`Agent ${agent.id} does not meet production requirements`);
        }
        this.agents.set(agent.id, agent);
        this.emit('agent:registered', {
            agentId: agent.id,
            type: agent.type,
            capabilities: agent.capabilities.length,
            timestamp: new Date()
        });
        console.log(`[ORCHESTRATOR-PLATFORM] Agent registered: ${agent.id} (${agent.type})`);
    }
    /**
     * Execute workflow with 360° feedback loop coordination
     */
    async executeWorkflow(workflow, budget) {
        const executionId = uuidv4();
        const defaultBudget = {
            tokens: budget?.tokens || 50000,
            timeLimit: budget?.timeLimit || 3600
        };
        const execution = {
            id: executionId,
            workflowId: workflow.id,
            status: 'pending',
            phases: this.initializeFeedbackLoopPhases(workflow),
            currentPhase: 0,
            budget: {
                totalTokens: defaultBudget.tokens,
                usedTokens: 0,
                timeLimit: defaultBudget.timeLimit
            },
            startTime: new Date(),
            metrics: {
                agentsUsed: 0,
                tasksCompleted: 0,
                errors: 0,
                performance: {}
            }
        };
        this.executions.set(executionId, execution);
        this.workflows.set(workflow.id, workflow);
        this.healthMetrics.totalWorkflows++;
        this.healthMetrics.activeExecutions++;
        console.log(`[ORCHESTRATOR-PLATFORM] Starting workflow execution: ${executionId}`);
        this.emit('workflow:started', { executionId, workflowId: workflow.id });
        // Start execution in background
        this.executeFeedbackLoop(executionId).catch(error => {
            console.error(`[ORCHESTRATOR-PLATFORM] Workflow execution failed: ${executionId}`, error);
            this.handleExecutionError(executionId, error);
        });
        return executionId;
    }
    /**
     * Allocate agents to workflow execution with resource management
     */
    async allocateAgents(executionId, requirements) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        const availableAgents = Array.from(this.agents.values())
            .filter(agent => agent.type === requirements.agentType &&
            agent.status === AgentStatus.IDLE &&
            this.hasRequiredCapabilities(agent, requirements.capabilities))
            .slice(0, requirements.count);
        if (availableAgents.length < requirements.count) {
            console.warn(`[ORCHESTRATOR-PLATFORM] Insufficient agents available. Required: ${requirements.count}, Available: ${availableAgents.length}`);
        }
        const allocatedAgentIds = [];
        const tokensPerAgent = Math.floor((execution.budget.totalTokens - execution.budget.usedTokens) /
            (requirements.count || 1));
        for (const agent of availableAgents) {
            const allocation = {
                agentId: agent.id,
                agentType: agent.type,
                allocatedTo: executionId,
                phase: requirements.phase,
                resourceQuota: {
                    tokens: tokensPerAgent,
                    timeout: 300000 // 5 minutes default
                },
                performance: {
                    tasksCompleted: 0,
                    avgResponseTime: 0,
                    errorRate: 0
                }
            };
            this.allocations.set(`${agent.id}-${executionId}`, allocation);
            allocatedAgentIds.push(agent.id);
            // Update agent status
            agent.status = AgentStatus.BUSY;
        }
        execution.metrics.agentsUsed += allocatedAgentIds.length;
        console.log(`[ORCHESTRATOR-PLATFORM] Allocated ${allocatedAgentIds.length} agents to execution ${executionId}`);
        this.emit('agents:allocated', {
            executionId,
            agentIds: allocatedAgentIds,
            phase: requirements.phase
        });
        return allocatedAgentIds;
    }
    /**
     * Execute 360° feedback loop: Plan → Execute → Review → Judge → Learn → Govern
     */
    async executeFeedbackLoop(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        execution.status = 'running';
        try {
            for (let i = 0; i < execution.phases.length; i++) {
                const phase = execution.phases[i];
                execution.currentPhase = i;
                console.log(`[ORCHESTRATOR-PLATFORM] Executing phase: ${phase.name} for execution ${executionId}`);
                await this.executePhase(executionId, phase);
                // Check budget constraints
                if (execution.budget.usedTokens >= execution.budget.totalTokens) {
                    console.warn(`[ORCHESTRATOR-PLATFORM] Token budget exceeded for execution ${executionId}`);
                    throw new Error('Token budget exceeded');
                }
                // Check time constraints
                const elapsed = Date.now() - execution.startTime.getTime();
                if (elapsed > execution.budget.timeLimit * 1000) {
                    console.warn(`[ORCHESTRATOR-PLATFORM] Time limit exceeded for execution ${executionId}`);
                    throw new Error('Time limit exceeded');
                }
            }
            execution.status = 'completed';
            execution.endTime = new Date();
            this.healthMetrics.activeExecutions--;
            console.log(`[ORCHESTRATOR-PLATFORM] Workflow execution completed: ${executionId}`);
            this.emit('workflow:completed', { executionId });
        }
        catch (error) {
            execution.status = 'failed';
            execution.endTime = new Date();
            this.healthMetrics.activeExecutions--;
            this.healthMetrics.errorRate++;
            console.error(`[ORCHESTRATOR-PLATFORM] Workflow execution failed: ${executionId}`, error);
            this.emit('workflow:failed', { executionId, error });
            throw error;
        }
        finally {
            await this.cleanupExecution(executionId);
        }
    }
    /**
     * Execute individual phase with agent coordination
     */
    async executePhase(executionId, phase) {
        phase.status = 'active';
        phase.startTime = new Date();
        const agentRequirements = this.getPhaseAgentRequirements(phase.name);
        const allocatedAgents = await this.allocateAgents(executionId, agentRequirements);
        phase.agents = allocatedAgents;
        // Coordinate agents for this phase
        const phaseResults = await this.coordinatePhaseExecution(executionId, phase, allocatedAgents);
        phase.output = phaseResults;
        phase.status = 'completed';
        phase.endTime = new Date();
        console.log(`[ORCHESTRATOR-PLATFORM] Phase ${phase.name} completed for execution ${executionId}`);
    }
    /**
     * Get agent requirements for each feedback loop phase
     */
    getPhaseAgentRequirements(phaseName) {
        const phaseMap = {
            plan: { agentType: AgentType.ORCHESTRATOR, count: 1, capabilities: ['planning', 'coordination'] },
            execute: { agentType: AgentType.WORKER, count: 3, capabilities: ['implementation', 'processing'] },
            review: { agentType: AgentType.CRITIC, count: 2, capabilities: ['analysis', 'validation'] },
            judge: { agentType: AgentType.JUDGE, count: 1, capabilities: ['evaluation', 'decision'] },
            learn: { agentType: AgentType.TRAINER, count: 1, capabilities: ['learning', 'optimization'] },
            govern: { agentType: AgentType.GOVERNOR, count: 1, capabilities: ['governance', 'compliance'] }
        };
        const requirements = phaseMap[phaseName];
        return { ...requirements, phase: phaseName };
    }
    /**
     * Coordinate agent execution within a phase
     */
    async coordinatePhaseExecution(executionId, phase, agentIds) {
        console.log(`[ORCHESTRATOR-PLATFORM] Coordinating ${agentIds.length} agents for phase ${phase.name}`);
        const results = [];
        const execution = this.executions.get(executionId);
        // Execute agents in parallel for most phases, sequentially for governance
        if (phase.name === 'govern' || phase.name === 'judge') {
            // Sequential execution for governance and judgment
            for (const agentId of agentIds) {
                const result = await this.executeAgentTask(executionId, agentId, phase);
                results.push(result);
            }
        }
        else {
            // Parallel execution for other phases
            const promises = agentIds.map(agentId => this.executeAgentTask(executionId, agentId, phase));
            const parallelResults = await Promise.allSettled(promises);
            parallelResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    console.error(`[ORCHESTRATOR-PLATFORM] Agent ${agentIds[index]} failed in phase ${phase.name}:`, result.reason);
                    execution.metrics.errors++;
                }
            });
        }
        return {
            phase: phase.name,
            agentResults: results,
            summary: this.summarizePhaseResults(phase.name, results)
        };
    }
    /**
     * Execute task for specific agent
     */
    async executeAgentTask(executionId, agentId, phase) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        const allocation = this.allocations.get(`${agentId}-${executionId}`);
        if (!allocation) {
            throw new Error(`No allocation found for agent ${agentId} in execution ${executionId}`);
        }
        const startTime = Date.now();
        try {
            // Simulate agent task execution
            // In production, this would call the actual agent via its protocol
            const mockResult = {
                agentId,
                phase: phase.name,
                status: 'completed',
                tokensUsed: Math.floor(Math.random() * allocation.resourceQuota.tokens * 0.5),
                output: `${phase.name} result from ${agentId}`
            };
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Update metrics
            const execution = this.executions.get(executionId);
            execution.budget.usedTokens += mockResult.tokensUsed;
            execution.metrics.tasksCompleted++;
            allocation.performance.tasksCompleted++;
            allocation.performance.avgResponseTime =
                (allocation.performance.avgResponseTime + duration) / allocation.performance.tasksCompleted;
            console.log(`[ORCHESTRATOR-PLATFORM] Agent ${agentId} completed task in phase ${phase.name} (${duration}ms, ${mockResult.tokensUsed} tokens)`);
            return mockResult;
        }
        catch (error) {
            allocation.performance.errorRate++;
            throw error;
        }
    }
    /**
     * Summarize results from a phase
     */
    summarizePhaseResults(phaseName, results) {
        return {
            totalAgents: results.length,
            successfulTasks: results.filter(r => r.status === 'completed').length,
            totalTokensUsed: results.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
            insights: `Phase ${phaseName} completed with ${results.length} agent contributions`
        };
    }
    /**
     * Initialize feedback loop phases for workflow
     */
    initializeFeedbackLoopPhases(workflow) {
        const phases = [
            'plan', 'execute', 'review', 'judge', 'learn', 'govern'
        ].map(name => ({
            name: name,
            agents: [],
            status: 'pending',
            budget: {
                tokens: Math.floor(8000), // ~1/6 of total budget per phase
                used: 0
            }
        }));
        return phases;
    }
    /**
     * Validate agent meets production requirements
     */
    validateAgentForProduction(agent) {
        // Production validation criteria
        return (agent.capabilities.length > 0 &&
            agent.version !== undefined &&
            agent.type !== undefined &&
            agent.config !== undefined);
    }
    /**
     * Check if agent has required capabilities
     */
    hasRequiredCapabilities(agent, requiredCapabilities) {
        const agentCapabilityNames = agent.capabilities.map(cap => cap.name);
        return requiredCapabilities.every(required => agentCapabilityNames.includes(required));
    }
    /**
     * Handle execution errors with recovery strategies
     */
    handleExecutionError(executionId, error) {
        const execution = this.executions.get(executionId);
        if (execution) {
            execution.status = 'failed';
            execution.endTime = new Date();
            this.healthMetrics.activeExecutions--;
            this.healthMetrics.errorRate++;
        }
        console.error(`[ORCHESTRATOR-PLATFORM] Execution ${executionId} failed:`, error);
        this.emit('execution:error', { executionId, error });
    }
    /**
     * Cleanup resources after execution
     */
    async cleanupExecution(executionId) {
        // Release allocated agents
        const allocationsToRemove = [];
        for (const [key, allocation] of this.allocations.entries()) {
            if (allocation.allocatedTo === executionId) {
                const agent = this.agents.get(allocation.agentId);
                if (agent) {
                    agent.status = AgentStatus.IDLE;
                }
                allocationsToRemove.push(key);
            }
        }
        allocationsToRemove.forEach(key => this.allocations.delete(key));
        console.log(`[ORCHESTRATOR-PLATFORM] Cleaned up execution ${executionId}`);
    }
    /**
     * Initialize health monitoring
     */
    async initializeHealthMonitoring() {
        setInterval(() => {
            this.updateHealthMetrics();
            this.emit('health:update', this.getHealthStatus());
        }, 30000); // Update every 30 seconds
    }
    /**
     * Update health metrics
     */
    updateHealthMetrics() {
        const activeAgents = Array.from(this.agents.values())
            .filter(agent => agent.status !== AgentStatus.OFFLINE).length;
        this.healthMetrics.resourceUtilization =
            activeAgents > 0 ? (this.healthMetrics.activeExecutions / activeAgents) * 100 : 0;
    }
    /**
     * Get current health status
     */
    getHealthStatus() {
        return {
            status: this.healthMetrics.activeExecutions > 0 ? 'active' : 'idle',
            metrics: { ...this.healthMetrics },
            agents: {
                total: this.agents.size,
                active: Array.from(this.agents.values())
                    .filter(agent => agent.status === AgentStatus.BUSY).length,
                idle: Array.from(this.agents.values())
                    .filter(agent => agent.status === AgentStatus.IDLE).length
            },
            executions: {
                active: this.healthMetrics.activeExecutions,
                total: this.healthMetrics.totalWorkflows
            },
            timestamp: new Date()
        };
    }
    /**
     * Get execution status
     */
    getExecutionStatus(executionId) {
        return this.executions.get(executionId) || null;
    }
    /**
     * List all active executions
     */
    getActiveExecutions() {
        return Array.from(this.executions.values())
            .filter(execution => execution.status === 'running');
    }
    async scheduleWorkflowTasks(workflow) {
        // Legacy method - now handled by executeWorkflow
        console.log('[ORCHESTRATOR-PLATFORM] scheduleWorkflowTasks deprecated - use executeWorkflow');
    }
    async loadAgents() {
        console.log('[ORCHESTRATOR-PLATFORM] Loading agent registry...');
        // In production, this would load from persistent storage
    }
    async setupMessageBus() {
        console.log('[ORCHESTRATOR-PLATFORM] Setting up message bus...');
        // Production message bus initialization
    }
    async startScheduler() {
        console.log('[ORCHESTRATOR-PLATFORM] Starting task scheduler...');
        // Production scheduler initialization
    }
}
// Maintain backward compatibility
export const Orchestrator = OrchestratorPlatform;
export default OrchestratorPlatform;
//# sourceMappingURL=index.js.map