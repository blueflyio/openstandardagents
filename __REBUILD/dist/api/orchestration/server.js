/**
 * OSSA Orchestration API Server
 * Production REST API for agent workflow coordination
 */
import express from 'express';
import { OrchestratorPlatform } from '../../core/orchestrator';
import { v4 as uuidv4 } from 'uuid';
export class OrchestrationAPIServer {
    app;
    orchestrator;
    config;
    server;
    constructor(orchestratorConfig, apiConfig) {
        this.config = apiConfig;
        this.app = express();
        this.orchestrator = new OrchestratorPlatform(orchestratorConfig);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Basic middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        // CORS
        if (this.config.cors) {
            this.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                next();
            });
        }
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`[ORCHESTRATION-API] ${req.method} ${req.path}`);
            next();
        });
        // Request validation middleware
        this.app.use('/api/v1/orchestration', this.validateRequest.bind(this));
    }
    setupRoutes() {
        const router = express.Router();
        // Health check
        router.get('/health', this.getHealth.bind(this));
        // Workflow management
        router.post('/workflows', this.createWorkflow.bind(this));
        router.post('/workflows/:workflowId/execute', this.executeWorkflow.bind(this));
        router.get('/workflows/:workflowId/status', this.getWorkflowStatus.bind(this));
        // Task distribution
        router.post('/tasks/distribute', this.distributeTasks.bind(this));
        // Feedback loop management
        router.post('/feedback-loop/initiate', this.initiateFeedbackLoop.bind(this));
        router.get('/feedback-loop/:executionId/status', this.getFeedbackLoopStatus.bind(this));
        // Agent management
        router.post('/agents/allocate', this.allocateAgents.bind(this));
        router.post('/agents/spin-up', this.spinUpAgents.bind(this));
        router.get('/agents/status', this.getAgentsStatus.bind(this));
        // Monitoring and metrics
        router.get('/metrics', this.getMetrics.bind(this));
        router.get('/executions', this.getActiveExecutions.bind(this));
        router.get('/executions/:executionId', this.getExecutionDetails.bind(this));
        this.app.use('/api/v1/orchestration', router);
    }
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('[ORCHESTRATION-API] Error:', error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Internal Server Error';
            res.status(statusCode).json({
                error: error.name || 'ServerError',
                message,
                requestId: req.headers['x-request-id'] || uuidv4(),
                timestamp: new Date().toISOString()
            });
        });
    }
    validateRequest(req, res, next) {
        // Add request ID for tracing
        req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
        // Basic content type validation
        if (req.method === 'POST' && !req.is('application/json')) {
            return res.status(400).json({
                error: 'Invalid Content-Type',
                message: 'Content-Type must be application/json',
                timestamp: new Date().toISOString()
            });
        }
        next();
    }
    /**
     * GET /health - Health check endpoint
     */
    async getHealth(req, res) {
        try {
            const health = this.orchestrator.getHealthStatus();
            res.json(health);
        }
        catch (error) {
            res.status(500).json({
                error: 'Health Check Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * POST /workflows - Create new workflow
     */
    async createWorkflow(req, res) {
        try {
            const { name, description, tasks, dependencies, budget } = req.body;
            if (!name || !tasks || !Array.isArray(tasks)) {
                res.status(400).json({
                    error: 'Invalid Request',
                    message: 'name and tasks (array) are required',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const workflow = {
                id: uuidv4(),
                name,
                version: '1.0.0',
                steps: tasks.map((task, index) => ({
                    id: `step-${index}`,
                    name: task.name || `Step ${index + 1}`,
                    agent: task.agent || 'auto-assign',
                    action: task.action || 'execute',
                    inputs: task.inputs || {},
                    dependencies: task.dependencies || []
                })),
                triggers: [{
                        type: 'manual',
                        config: {}
                    }],
                policies: [],
                metadata: {
                    author: 'orchestrator-platform',
                    description: description || '',
                    tags: ['auto-generated'],
                    created: new Date(),
                    updated: new Date()
                }
            };
            res.status(201).json({
                id: workflow.id,
                name: workflow.name,
                status: 'created',
                createdAt: new Date().toISOString()
            });
            console.log(`[ORCHESTRATION-API] Workflow created: ${workflow.id}`);
        }
        catch (error) {
            res.status(500).json({
                error: 'Workflow Creation Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * POST /workflows/:workflowId/execute - Execute workflow
     */
    async executeWorkflow(req, res) {
        try {
            const { workflowId } = req.params;
            const { input, config, timeout } = req.body;
            // Create mock workflow for execution
            const workflow = {
                id: workflowId,
                name: `Workflow-${workflowId}`,
                version: '1.0.0',
                steps: [
                    {
                        id: 'step-1',
                        name: 'Initial Processing',
                        agent: 'auto-assign',
                        action: 'process',
                        inputs: input || {}
                    }
                ],
                triggers: [{ type: 'manual', config: {} }],
                policies: [],
                metadata: {
                    author: 'orchestrator-platform',
                    description: 'Auto-generated workflow execution',
                    tags: ['execution'],
                    created: new Date(),
                    updated: new Date()
                }
            };
            const budget = config?.budget || {
                tokens: 50000,
                timeLimit: timeout || 3600
            };
            const executionId = await this.orchestrator.executeWorkflow(workflow, budget);
            res.status(202).json({
                executionId,
                status: 'pending',
                startedAt: new Date().toISOString()
            });
            console.log(`[ORCHESTRATION-API] Workflow execution started: ${executionId}`);
        }
        catch (error) {
            res.status(500).json({
                error: 'Workflow Execution Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /workflows/:workflowId/status - Get workflow status
     */
    async getWorkflowStatus(req, res) {
        try {
            const { workflowId } = req.params;
            // Find execution by workflow ID
            const executions = this.orchestrator.getActiveExecutions();
            const execution = executions.find(e => e.workflowId === workflowId);
            if (!execution) {
                res.status(404).json({
                    error: 'Workflow Not Found',
                    message: `No active execution found for workflow ${workflowId}`,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                workflowId,
                executionId: execution.id,
                status: execution.status,
                currentPhase: execution.currentPhase,
                phases: execution.phases.map(phase => ({
                    name: phase.name,
                    status: phase.status,
                    agentCount: phase.agents.length
                })),
                budget: execution.budget,
                metrics: execution.metrics,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'Status Retrieval Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * POST /feedback-loop/initiate - Initiate 360° feedback loop
     */
    async initiateFeedbackLoop(req, res) {
        try {
            const { taskId, phases, agents } = req.body;
            if (!taskId || !phases || !Array.isArray(phases)) {
                res.status(400).json({
                    error: 'Invalid Request',
                    message: 'taskId and phases array are required',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const workflow = {
                id: uuidv4(),
                name: `FeedbackLoop-${taskId}`,
                version: '1.0.0',
                steps: phases.map((phase, index) => ({
                    id: `phase-${index}`,
                    name: phase,
                    agent: 'auto-assign',
                    action: 'execute',
                    inputs: { phase, taskId }
                })),
                triggers: [{ type: 'manual', config: {} }],
                policies: [],
                metadata: {
                    author: 'orchestrator-platform',
                    description: '360° feedback loop execution',
                    tags: ['feedback-loop'],
                    created: new Date(),
                    updated: new Date()
                }
            };
            const executionId = await this.orchestrator.executeWorkflow(workflow);
            res.status(202).json({
                id: executionId,
                taskId,
                currentPhase: 'plan',
                phases: phases.reduce((acc, phase) => {
                    acc[phase] = { status: 'pending' };
                    return acc;
                }, {}),
                status: 'pending',
                startedAt: new Date().toISOString()
            });
            console.log(`[ORCHESTRATION-API] Feedback loop initiated: ${executionId}`);
        }
        catch (error) {
            res.status(500).json({
                error: 'Feedback Loop Initiation Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * POST /agents/allocate - Allocate agents to task
     */
    async allocateAgents(req, res) {
        try {
            const { taskId, requirements } = req.body;
            if (!taskId || !requirements) {
                res.status(400).json({
                    error: 'Invalid Request',
                    message: 'taskId and requirements are required',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Mock allocation for demonstration
            const allocated = [
                {
                    agentId: `agent-${Date.now()}-1`,
                    type: 'worker',
                    role: 'processor',
                    capabilities: requirements.capabilities || ['general']
                },
                {
                    agentId: `agent-${Date.now()}-2`,
                    type: 'critic',
                    role: 'reviewer',
                    capabilities: ['analysis', 'validation']
                }
            ];
            res.json({
                allocated,
                strategy: 'capability-match'
            });
            console.log(`[ORCHESTRATION-API] Agents allocated to task: ${taskId}`);
        }
        catch (error) {
            res.status(500).json({
                error: 'Agent Allocation Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * POST /agents/spin-up - Spin up new agent instances
     */
    async spinUpAgents(req, res) {
        try {
            const { agents } = req.body;
            if (!agents || !Array.isArray(agents)) {
                res.status(400).json({
                    error: 'Invalid Request',
                    message: 'agents array is required',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const spunUp = agents.map((agentSpec) => ({
                agentId: `${agentSpec.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: agentSpec.type,
                status: 'ready',
                endpoint: `http://localhost:3002/agents/${agentSpec.type}`
            }));
            res.status(201).json({
                spunUp,
                total: spunUp.length,
                successful: spunUp.length,
                failed: 0
            });
            console.log(`[ORCHESTRATION-API] Spun up ${spunUp.length} agents`);
        }
        catch (error) {
            res.status(500).json({
                error: 'Agent Spin-up Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /metrics - Get orchestration metrics
     */
    async getMetrics(req, res) {
        try {
            const health = this.orchestrator.getHealthStatus();
            res.json({
                ...health,
                api: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage()
                }
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'Metrics Retrieval Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /executions - Get active executions
     */
    async getActiveExecutions(req, res) {
        try {
            const executions = this.orchestrator.getActiveExecutions();
            const summary = executions.map(execution => ({
                id: execution.id,
                workflowId: execution.workflowId,
                status: execution.status,
                currentPhase: execution.currentPhase,
                startTime: execution.startTime,
                budget: execution.budget,
                metrics: execution.metrics
            }));
            res.json({
                executions: summary,
                total: summary.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'Executions Retrieval Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /executions/:executionId - Get execution details
     */
    async getExecutionDetails(req, res) {
        try {
            const { executionId } = req.params;
            const execution = this.orchestrator.getExecutionStatus(executionId);
            if (!execution) {
                res.status(404).json({
                    error: 'Execution Not Found',
                    message: `Execution ${executionId} not found`,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json(execution);
        }
        catch (error) {
            res.status(500).json({
                error: 'Execution Details Retrieval Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * POST /tasks/distribute - Distribute tasks to agents
     */
    async distributeTasks(req, res) {
        try {
            const { task, strategy, constraints } = req.body;
            if (!task) {
                res.status(400).json({
                    error: 'Invalid Request',
                    message: 'task is required',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Mock task distribution
            const assignments = [
                {
                    agentId: `agent-${Date.now()}-1`,
                    subtask: { ...task, partition: 1 },
                    estimatedDuration: 300,
                    tokenBudget: 5000
                },
                {
                    agentId: `agent-${Date.now()}-2`,
                    subtask: { ...task, partition: 2 },
                    estimatedDuration: 300,
                    tokenBudget: 5000
                }
            ];
            res.json({
                taskId: task.id || uuidv4(),
                assignments
            });
            console.log(`[ORCHESTRATION-API] Task distributed with strategy: ${strategy || 'default'}`);
        }
        catch (error) {
            res.status(500).json({
                error: 'Task Distribution Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /feedback-loop/:executionId/status - Get feedback loop status
     */
    async getFeedbackLoopStatus(req, res) {
        try {
            const { executionId } = req.params;
            const execution = this.orchestrator.getExecutionStatus(executionId);
            if (!execution) {
                res.status(404).json({
                    error: 'Feedback Loop Not Found',
                    message: `Execution ${executionId} not found`,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                id: execution.id,
                taskId: execution.workflowId,
                currentPhase: execution.phases[execution.currentPhase]?.name || 'unknown',
                phases: execution.phases.reduce((acc, phase) => {
                    acc[phase.name] = {
                        status: phase.status,
                        startTime: phase.startTime,
                        endTime: phase.endTime,
                        agentCount: phase.agents.length,
                        budget: phase.budget
                    };
                    return acc;
                }, {}),
                status: execution.status,
                startedAt: execution.startTime
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'Feedback Loop Status Retrieval Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /agents/status - Get agents status
     */
    async getAgentsStatus(req, res) {
        try {
            const health = this.orchestrator.getHealthStatus();
            res.json({
                summary: health.agents,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'Agents Status Retrieval Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.config.port, this.config.host, () => {
                    console.log(`[ORCHESTRATION-API] Server running on ${this.config.host}:${this.config.port}`);
                    console.log(`[ORCHESTRATION-API] Health check: http://${this.config.host}:${this.config.port}/api/v1/orchestration/health`);
                    resolve();
                });
                this.server.on('error', (error) => {
                    console.error('[ORCHESTRATION-API] Server error:', error);
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('[ORCHESTRATION-API] Server stopped');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    getApp() {
        return this.app;
    }
}
export default OrchestrationAPIServer;
//# sourceMappingURL=server.js.map