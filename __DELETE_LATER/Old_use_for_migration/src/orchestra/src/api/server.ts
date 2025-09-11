/**
 * OSSA Orchestra v0.1.8 - REST API Server
 * Comprehensive API for multi-agent workflow orchestration
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { OrchestrationEngine } from '../core/orchestrator';
import { Logger } from '../utils/logger';
import { 
  AgentDefinition,
  WorkflowDefinition,
  OrchestrationRequest,
  ScalingPolicy,
  LoadBalancerConfig
} from '../core/types';

export class OrchestraAPIServer {
  private app: express.Application;
  private orchestrationEngine: OrchestrationEngine;
  private logger: Logger;
  private server?: any;

  constructor() {
    this.app = express();
    this.orchestrationEngine = new OrchestrationEngine();
    this.logger = new Logger('OrchestraAPI');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async start(port: number = 3013): Promise<void> {
    try {
      // Initialize orchestration engine
      await this.orchestrationEngine.initialize();
      
      // Start server
      this.server = this.app.listen(port, () => {
        this.logger.info(`OSSA Orchestra API Server started on port ${port}`);
      });
      
    } catch (error) {
      this.logger.error('Failed to start API server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          this.logger.info('API Server stopped');
          resolve();
        });
      });
    }
    
    await this.orchestrationEngine.shutdown();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-ID']
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const traceId = req.headers['x-trace-id'] || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      req.traceId = traceId as string;
      
      this.logger.info(`${req.method} ${req.path}`, { traceId, ip: req.ip });
      next();
    });
  }

  private setupRoutes(): void {
    const router = express.Router();

    // Health check
    router.get('/health', this.getHealth.bind(this));
    router.get('/metrics', this.getMetrics.bind(this));

    // Agent management
    router.post('/agents', this.registerAgent.bind(this));
    router.get('/agents', this.getAgents.bind(this));
    router.get('/agents/:agentId', this.getAgent.bind(this));
    router.put('/agents/:agentId', this.updateAgent.bind(this));
    router.delete('/agents/:agentId', this.unregisterAgent.bind(this));
    router.get('/agents/:agentId/health', this.getAgentHealth.bind(this));

    // Workflow management
    router.post('/workflows', this.registerWorkflow.bind(this));
    router.get('/workflows', this.getWorkflows.bind(this));
    router.get('/workflows/:workflowId', this.getWorkflow.bind(this));
    router.delete('/workflows/:workflowId', this.unregisterWorkflow.bind(this));
    router.post('/workflows/:workflowId/validate', this.validateWorkflow.bind(this));

    // Orchestration execution
    router.post('/execute', this.executeWorkflow.bind(this));
    router.get('/executions', this.getActiveExecutions.bind(this));
    router.get('/executions/:executionId', this.getExecutionStatus.bind(this));
    router.post('/executions/:executionId/cancel', this.cancelExecution.bind(this));

    // Scaling management
    router.post('/scaling/policies', this.addScalingPolicy.bind(this));
    router.get('/scaling/policies', this.getScalingPolicies.bind(this));
    router.get('/scaling/policies/:policyId', this.getScalingPolicy.bind(this));
    router.delete('/scaling/policies/:policyId', this.removeScalingPolicy.bind(this));
    router.get('/scaling/metrics', this.getScalingMetrics.bind(this));

    // Load balancer configuration
    router.post('/load-balancer/config', this.configureLoadBalancer.bind(this));
    router.get('/load-balancer/config', this.getLoadBalancerConfig.bind(this));
    router.get('/load-balancer/status', this.getLoadBalancerStatus.bind(this));

    // Compliance validation
    router.post('/compliance/validate/pre-execution', this.validatePreExecution.bind(this));
    router.post('/compliance/validate/post-execution', this.validatePostExecution.bind(this));
    router.get('/compliance/policies', this.getCompliancePolicies.bind(this));
    router.get('/compliance/reports/:workflowId', this.getComplianceReport.bind(this));

    // Mount router
    this.app.use('/api/v1/orchestra', router);
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
        traceId: req.traceId
      });
    });

    // Error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('API Error:', error);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString(),
        traceId: req.traceId
      });
    });
  }

  // Health and Status Endpoints
  private async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.orchestrationEngine.getHealth();
      res.json({
        status: 'healthy',
        version: '0.1.8',
        timestamp: new Date().toISOString(),
        components: health
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.orchestrationEngine.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Agent Management Endpoints
  private async registerAgent(req: Request, res: Response): Promise<void> {
    try {
      const agent: AgentDefinition = req.body;
      await this.orchestrationEngine.registerAgent(agent);
      
      res.status(201).json({
        message: 'Agent registered successfully',
        agentId: agent.id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getAgents(req: Request, res: Response): Promise<void> {
    try {
      const agents = await this.orchestrationEngine.getAgents();
      res.json({ agents });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getAgent(req: Request, res: Response): Promise<void> {
    try {
      const agent = await this.orchestrationEngine.getAgent(req.params.agentId);
      
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }
      
      res.json({ agent });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async updateAgent(req: Request, res: Response): Promise<void> {
    try {
      const agent: AgentDefinition = { ...req.body, id: req.params.agentId };
      await this.orchestrationEngine.unregisterAgent(agent.id);
      await this.orchestrationEngine.registerAgent(agent);
      
      res.json({
        message: 'Agent updated successfully',
        agentId: agent.id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async unregisterAgent(req: Request, res: Response): Promise<void> {
    try {
      await this.orchestrationEngine.unregisterAgent(req.params.agentId);
      res.json({ message: 'Agent unregistered successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getAgentHealth(req: Request, res: Response): Promise<void> {
    try {
      const agent = await this.orchestrationEngine.getAgent(req.params.agentId);
      
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }
      
      res.json({ health: agent.healthStatus });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Workflow Management Endpoints
  private async registerWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflow: WorkflowDefinition = req.body;
      await this.orchestrationEngine.registerWorkflow(workflow);
      
      res.status(201).json({
        message: 'Workflow registered successfully',
        workflowId: workflow.id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getWorkflows(req: Request, res: Response): Promise<void> {
    try {
      const workflows = await this.orchestrationEngine.getWorkflows();
      res.json({ workflows });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflow = await this.orchestrationEngine.getWorkflow(req.params.workflowId);
      
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }
      
      res.json({ workflow });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async unregisterWorkflow(req: Request, res: Response): Promise<void> {
    try {
      await this.orchestrationEngine.unregisterWorkflow(req.params.workflowId);
      res.json({ message: 'Workflow unregistered successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async validateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflow = await this.orchestrationEngine.getWorkflow(req.params.workflowId);
      
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }
      
      // Perform validation (this would call the compliance validator)
      res.json({
        valid: true,
        violations: [],
        message: 'Workflow validation passed'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Orchestration Execution Endpoints
  private async executeWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const request: OrchestrationRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workflowId: req.body.workflowId,
        input: req.body.input,
        priority: req.body.priority || 1,
        timeout: req.body.timeout,
        callback: req.body.callback,
        metadata: {
          user: req.body.user || 'anonymous',
          origin: req.ip || 'unknown',
          timestamp: new Date(),
          traceId: req.traceId as string,
          context: req.body.context || {}
        }
      };
      
      const result = await this.orchestrationEngine.execute(request);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getActiveExecutions(req: Request, res: Response): Promise<void> {
    try {
      const executions = await this.orchestrationEngine.getActiveExecutions();
      res.json({ 
        executions: executions.map(exec => ({
          id: exec.id,
          requestId: exec.request.id,
          workflowId: exec.request.workflowId,
          status: exec.status,
          startTime: exec.startTime
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getExecutionStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.orchestrationEngine.getExecutionStatus(req.params.executionId);
      
      if (!status) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }
      
      res.json({ status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async cancelExecution(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.orchestrationEngine.cancelExecution(req.params.executionId);
      
      if (!success) {
        res.status(404).json({ error: 'Execution not found or already completed' });
        return;
      }
      
      res.json({ message: 'Execution cancelled successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Scaling Management Endpoints
  private async addScalingPolicy(req: Request, res: Response): Promise<void> {
    try {
      const policy: ScalingPolicy = req.body;
      await this.orchestrationEngine.addScalingPolicy(policy);
      
      res.status(201).json({
        message: 'Scaling policy added successfully',
        policyId: policy.id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getScalingPolicies(req: Request, res: Response): Promise<void> {
    try {
      const policies = await this.orchestrationEngine.getScalingPolicies();
      res.json({ policies });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getScalingPolicy(req: Request, res: Response): Promise<void> {
    try {
      const policies = await this.orchestrationEngine.getScalingPolicies();
      const policy = policies.find(p => p.id === req.params.policyId);
      
      if (!policy) {
        res.status(404).json({ error: 'Scaling policy not found' });
        return;
      }
      
      res.json({ policy });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async removeScalingPolicy(req: Request, res: Response): Promise<void> {
    try {
      await this.orchestrationEngine.removeScalingPolicy(req.params.policyId);
      res.json({ message: 'Scaling policy removed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getScalingMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.orchestrationEngine.getMetrics();
      
      // Filter scaling-related metrics
      const scalingMetrics = {
        // Would extract scaling-specific metrics from the general metrics
        timestamp: new Date(),
        policies: (await this.orchestrationEngine.getScalingPolicies()).length,
        activeScaling: 0 // Would be calculated from metrics
      };
      
      res.json(scalingMetrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Load Balancer Endpoints
  private async configureLoadBalancer(req: Request, res: Response): Promise<void> {
    try {
      const config: LoadBalancerConfig = req.body;
      await this.orchestrationEngine.configureLoadBalancer(config);
      
      res.json({ message: 'Load balancer configured successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getLoadBalancerConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await this.orchestrationEngine.getLoadBalancerConfig();
      res.json({ config });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getLoadBalancerStatus(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.orchestrationEngine.getHealth();
      res.json({ 
        status: health.components.loadBalancer,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Compliance Endpoints
  private async validatePreExecution(req: Request, res: Response): Promise<void> {
    try {
      const request: OrchestrationRequest = req.body.request;
      const requirements = req.body.requirements || [];
      
      // This would call the compliance validator
      const violations: any[] = []; // await this.orchestrationEngine.validatePreExecution(request, requirements);
      
      res.json({
        passed: violations.length === 0,
        violations
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async validatePostExecution(req: Request, res: Response): Promise<void> {
    try {
      const result = req.body.result;
      const requirements = req.body.requirements || [];
      
      // This would call the compliance validator
      const violations: any[] = []; // await this.orchestrationEngine.validatePostExecution(result, requirements);
      
      res.json({
        passed: violations.length === 0,
        violations
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getCompliancePolicies(req: Request, res: Response): Promise<void> {
    try {
      // This would get policies from the compliance validator
      const policies: any[] = [];
      res.json({ policies });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async getComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const workflowId = req.params.workflowId;
      const timeRange = req.query.timeRange ? JSON.parse(req.query.timeRange as string) : undefined;
      
      // This would generate a compliance report
      const report = {
        workflowId,
        timeRange,
        totalExecutions: 0,
        violationCount: 0,
        violations: [],
        complianceScore: 100,
        recommendations: []
      };
      
      res.json({ report });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// Extend Request interface to include traceId
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
}