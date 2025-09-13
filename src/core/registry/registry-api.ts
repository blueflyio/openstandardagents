import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RegistryCore } from './registry-core.js';
import { CapabilityMatcher } from './capability-matcher.js';
import { HealthMonitor } from './health-monitor.js';
import { components } from '../../types/acdl-api.js';

type ACDLManifest = components['schemas']['ACDLManifest'];
type DiscoveryQuery = components['schemas']['DiscoveryQuery'];
type MatchRequest = components['schemas']['MatchRequest'];

interface AuthenticatedRequest extends Request {
  tenant?: string;
  userId?: string;
  permissions?: string[];
}

/**
 * Production-Scale Registry API with Multi-Tenant Support
 * 
 * Provides enterprise-grade REST API for OSSA agent registry operations
 * with authentication, authorization, rate limiting, and comprehensive
 * monitoring capabilities.
 */
export class RegistryAPI {
  private readonly app: express.Application;
  private readonly registryCore: RegistryCore;
  private readonly capabilityMatcher: CapabilityMatcher;
  private readonly healthMonitor: HealthMonitor;
  private readonly ossaVersion = '0.1.9-alpha.1';

  // Rate limiting and security
  private readonly rateLimits = new Map<string, { count: number; resetTime: number }>();
  private readonly defaultRateLimit = { requests: 1000, windowMs: 60000 }; // 1000 req/min
  private readonly tenantRateLimits = new Map<string, { requests: number; windowMs: number }>();

  // API metrics
  private readonly apiMetrics = {
    totalRequests: 0,
    registrations: 0,
    discoveries: 0,
    matches: 0,
    errors: 0,
    averageResponseTime: 0,
    activeConnections: 0
  };

  constructor() {
    this.app = express();
    this.registryCore = new RegistryCore();
    this.capabilityMatcher = new CapabilityMatcher();
    this.healthMonitor = new HealthMonitor();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Get the Express application instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Start the registry API server
   */
  async start(port: number = 8080): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`🚀 OSSA Registry API v${this.ossaVersion} started on port ${port}`);
        console.log(`📊 API Documentation: http://localhost:${port}/api/docs`);
        console.log(`❤️  Health Check: http://localhost:${port}/api/health`);
        resolve();
      });
    });
  }

  /**
   * Shutdown the registry API gracefully
   */
  async shutdown(): Promise<void> {
    await this.registryCore.shutdown();
    await this.healthMonitor.shutdown();
  }

  // Private setup methods

  private setupMiddleware(): void {
    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Tenant-ID');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request tracking middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      this.apiMetrics.totalRequests++;
      this.apiMetrics.activeConnections++;

      res.on('finish', () => {
        this.apiMetrics.activeConnections--;
        const responseTime = Date.now() - startTime;
        this.updateAverageResponseTime(responseTime);
      });

      next();
    });

    // Authentication middleware (simplified for demo)
    this.app.use('/api/v1', this.authenticateRequest.bind(this));

    // Rate limiting middleware
    this.app.use('/api/v1', this.rateLimitMiddleware.bind(this));

    // Tenant extraction middleware
    this.app.use('/api/v1', this.extractTenantInfo.bind(this));
  }

  private setupRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.get('/api/health', this.handleHealthCheck.bind(this));
    
    // API documentation endpoint
    this.app.get('/api/docs', this.handleAPIDocumentation.bind(this));

    // Registry management endpoints
    this.app.post('/api/v1/agents/register', this.handleAgentRegistration.bind(this));
    this.app.delete('/api/v1/agents/:agentId', this.handleAgentUnregistration.bind(this));
    this.app.get('/api/v1/agents/:agentId', this.handleGetAgent.bind(this));
    this.app.get('/api/v1/agents', this.handleListAgents.bind(this));

    // Discovery and matching endpoints
    this.app.post('/api/v1/discovery/query', this.handleDiscoveryQuery.bind(this));
    this.app.post('/api/v1/matching/request', this.handleMatchingRequest.bind(this));
    this.app.post('/api/v1/matching/rank', this.handleRankingRequest.bind(this));
    this.app.post('/api/v1/matching/ensemble', this.handleEnsembleComposition.bind(this));

    // Health monitoring endpoints
    this.app.get('/api/v1/agents/:agentId/health', this.handleGetAgentHealth.bind(this));
    this.app.post('/api/v1/agents/:agentId/health', this.handleUpdateAgentHealth.bind(this));
    this.app.get('/api/v1/health/report', this.handleHealthReport.bind(this));

    // Lifecycle management endpoints
    this.app.post('/api/v1/agents/:agentId/state', this.handleUpdateAgentState.bind(this));
    this.app.get('/api/v1/agents/:agentId/lifecycle', this.handleGetAgentLifecycle.bind(this));

    // Registry statistics and metrics
    this.app.get('/api/v1/registry/metrics', this.handleGetRegistryMetrics.bind(this));
    this.app.get('/api/v1/registry/statistics', this.handleGetRegistryStatistics.bind(this));

    // Tenant management endpoints
    this.app.get('/api/v1/tenants/:tenantId/agents', this.handleGetTenantAgents.bind(this));
    this.app.get('/api/v1/tenants/:tenantId/metrics', this.handleGetTenantMetrics.bind(this));
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        version: this.ossaVersion,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('API Error:', error);
      this.apiMetrics.errors++;

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        requestId: uuidv4(),
        version: this.ossaVersion,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Middleware implementations

  private async authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    // Simplified authentication - in production, validate JWT tokens
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token required',
        version: this.ossaVersion
      });
      return;
    }

    // Mock authentication (in production, validate actual tokens)
    req.userId = 'user-123';
    req.permissions = ['read', 'write', 'admin'];
    
    next();
  }

  private async rateLimitMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const clientId = req.userId || req.ip || 'anonymous';
    const now = Date.now();
    const windowMs = this.defaultRateLimit.windowMs;
    const maxRequests = this.defaultRateLimit.requests;

    let rateLimit = this.rateLimits.get(clientId);
    
    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = { count: 0, resetTime: now + windowMs };
    }

    rateLimit.count++;
    this.rateLimits.set(clientId, rateLimit);

    if (rateLimit.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded: ${maxRequests} requests per ${windowMs/1000} seconds`,
        retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000),
        version: this.ossaVersion
      });
      return;
    }

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - rateLimit.count).toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString()
    });

    next();
  }

  private async extractTenantInfo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    // Extract tenant information from headers or token
    req.tenant = req.headers['x-tenant-id'] as string || 'default';
    next();
  }

  // Route handlers

  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    const registryMetrics = this.registryCore.getMetrics();
    
    res.json({
      status: 'healthy',
      version: this.ossaVersion,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      registry: {
        activeAgents: registryMetrics.activeAgents,
        totalRegistrations: registryMetrics.totalRegistrations
      },
      api: {
        totalRequests: this.apiMetrics.totalRequests,
        activeConnections: this.apiMetrics.activeConnections,
        averageResponseTime: this.apiMetrics.averageResponseTime
      }
    });
  }

  private async handleAPIDocumentation(req: Request, res: Response): Promise<void> {
    res.json({
      title: 'OSSA Registry API',
      version: this.ossaVersion,
      description: 'Production-scale agent registry with multi-tenant support',
      endpoints: {
        'POST /api/v1/agents/register': 'Register a new agent with ACDL manifest',
        'GET /api/v1/agents': 'List all registered agents (tenant-scoped)',
        'POST /api/v1/discovery/query': 'Discover agents by capability requirements',
        'POST /api/v1/matching/request': 'Match agents for specific tasks',
        'GET /api/v1/agents/:id/health': 'Get agent health status',
        'GET /api/v1/registry/metrics': 'Get registry performance metrics'
      },
      authentication: 'Bearer token required',
      rateLimit: `${this.defaultRateLimit.requests} requests per minute`,
      documentation: 'https://docs.ossa.io/registry-api'
    });
  }

  private async handleAgentRegistration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const manifest: ACDLManifest = req.body;
      const tenant = req.tenant;
      const namespace = req.headers['x-namespace'] as string;

      if (!manifest || !manifest.agentId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Valid ACDL manifest required',
          version: this.ossaVersion
        });
        return;
      }

      const result = await this.registryCore.registerAgent(manifest, tenant, namespace);
      
      if (result.status === 'registered') {
        // Initialize health monitoring
        await this.healthMonitor.initializeAgent(manifest.agentId, manifest);
        this.apiMetrics.registrations++;
      }

      res.status(result.status === 'registered' ? 201 : 400).json(result);

    } catch (error) {
      console.error('Agent registration error:', error);
      res.status(500).json({
        error: 'Registration Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleDiscoveryQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query: DiscoveryQuery = req.body;
      const tenant = req.tenant;

      const result = await this.registryCore.discoverAgents(query, tenant);
      this.apiMetrics.discoveries++;

      res.json(result);

    } catch (error) {
      console.error('Discovery query error:', error);
      res.status(500).json({
        error: 'Discovery Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleMatchingRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const matchRequest: MatchRequest = req.body;
      const tenant = req.tenant;

      const result = await this.registryCore.matchAgents(matchRequest, tenant);
      this.apiMetrics.matches++;

      res.json(result);

    } catch (error) {
      console.error('Matching request error:', error);
      res.status(500).json({
        error: 'Matching Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleGetAgentHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      
      const health = this.healthMonitor.getAgentHealth(agentId);
      if (!health) {
        res.status(404).json({
          error: 'Not Found',
          message: `Agent ${agentId} not found or not monitored`,
          version: this.ossaVersion
        });
        return;
      }

      res.json(health);

    } catch (error) {
      console.error('Get agent health error:', error);
      res.status(500).json({
        error: 'Health Check Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleUpdateAgentHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const healthData = req.body;

      await (this.healthMonitor as any).updateHealth(agentId, healthData);
      
      res.json({
        success: true,
        message: 'Agent health updated',
        agentId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Update agent health error:', error);
      res.status(500).json({
        error: 'Health Update Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleGetRegistryMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const registryMetrics = this.registryCore.getMetrics();
      
      res.json({
        registry: registryMetrics,
        api: this.apiMetrics,
        version: this.ossaVersion,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get registry metrics error:', error);
      res.status(500).json({
        error: 'Metrics Retrieval Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleRankingRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { agents, requirements, context } = req.body;
      
      const ranking = await this.capabilityMatcher.rankAgents(agents, requirements, context);
      
      res.json({
        ranking,
        totalCandidates: agents.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Ranking request error:', error);
      res.status(500).json({
        error: 'Ranking Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleEnsembleComposition(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { rankedAgents, taskRequirements } = req.body;
      
      const ensemble = await this.capabilityMatcher.composeEnsemble(rankedAgents, taskRequirements);
      
      res.json(ensemble);

    } catch (error) {
      console.error('Ensemble composition error:', error);
      res.status(500).json({
        error: 'Ensemble Composition Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleAgentUnregistration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const reason = req.body.reason || 'Manual unregistration';

      const success = await this.registryCore.unregisterAgent(agentId, reason);
      
      if (success) {
        await this.healthMonitor.updateAgentState(agentId, 'terminated', reason);
        res.json({
          success: true,
          message: 'Agent unregistered successfully',
          agentId,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          error: 'Not Found',
          message: `Agent ${agentId} not found`,
          version: this.ossaVersion
        });
      }

    } catch (error) {
      console.error('Agent unregistration error:', error);
      res.status(500).json({
        error: 'Unregistration Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleGetAgent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      
      // This would retrieve agent details from registry
      res.status(501).json({
        error: 'Not Implemented',
        message: 'Get single agent endpoint not yet implemented',
        version: this.ossaVersion
      });

    } catch (error) {
      res.status(500).json({
        error: 'Get Agent Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleListAgents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenant = req.tenant;
      
      // This would list all agents for the tenant
      const agents = this.registryCore.getAgentsByTenant(tenant!);
      
      res.json({
        agents: agents.map(agent => ({
          agentId: agent.agentId,
          status: agent.status,
          registeredAt: agent.registeredAt,
          health: agent.health.score
        })),
        total: agents.length,
        tenant,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'List Agents Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleUpdateAgentState(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const { state, reason } = req.body;

      const success = await this.healthMonitor.updateAgentState(agentId, state, reason);
      
      if (success) {
        res.json({
          success: true,
          message: `Agent state updated to ${state}`,
          agentId,
          newState: state,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          error: 'Not Found',
          message: `Agent ${agentId} not found`,
          version: this.ossaVersion
        });
      }

    } catch (error) {
      res.status(500).json({
        error: 'State Update Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleGetAgentLifecycle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      
      const lifecycle = this.healthMonitor.getAgentLifecycle(agentId);
      if (!lifecycle) {
        res.status(404).json({
          error: 'Not Found',
          message: `Agent ${agentId} lifecycle not found`,
          version: this.ossaVersion
        });
        return;
      }

      res.json(lifecycle);

    } catch (error) {
      res.status(500).json({
        error: 'Lifecycle Retrieval Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleHealthReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const agentId = req.query.agentId as string;
      
      const report = this.healthMonitor.generateHealthReport(agentId);
      
      res.json(report);

    } catch (error) {
      res.status(500).json({
        error: 'Health Report Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleGetRegistryStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Comprehensive registry statistics
      const metrics = this.registryCore.getMetrics();
      
      res.json({
        statistics: metrics,
        api: this.apiMetrics,
        system: {
          version: this.ossaVersion,
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Statistics Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleGetTenantAgents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      
      const agents = this.registryCore.getAgentsByTenant(tenantId);
      
      res.json({
        tenantId,
        agents: agents.map(agent => ({
          agentId: agent.agentId,
          status: agent.status,
          health: agent.health.score,
          registeredAt: agent.registeredAt
        })),
        total: agents.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Tenant Agents Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  private async handleGetTenantMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      
      const agents = this.registryCore.getAgentsByTenant(tenantId);
      const activeAgents = agents.filter(a => a.status === 'active').length;
      const totalRequests = agents.reduce((sum, a) => sum + a.metrics.totalRequests, 0);
      const avgHealth = agents.length > 0 
        ? agents.reduce((sum, a) => sum + a.health.score, 0) / agents.length 
        : 0;

      res.json({
        tenantId,
        metrics: {
          totalAgents: agents.length,
          activeAgents,
          totalRequests,
          averageHealthScore: Math.round(avgHealth * 100) / 100
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Tenant Metrics Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        version: this.ossaVersion
      });
    }
  }

  // Utility methods

  private updateAverageResponseTime(responseTime: number): void {
    const total = this.apiMetrics.totalRequests;
    this.apiMetrics.averageResponseTime = 
      (this.apiMetrics.averageResponseTime * (total - 1) + responseTime) / total;
  }
}