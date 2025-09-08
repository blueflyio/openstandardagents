/**
 * REST Protocol Implementation
 * High-performance REST API for agent discovery
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { Server } from 'http';
import { BaseProtocol } from './base';
import { RESTConfig, DiscoveryQuery, DiscoveryResult, OSSAAgent } from '../types';
import { OSSARouter } from '../router';

export interface RESTRequest extends Request {
  startTime?: number;
}

export class RESTProtocol extends BaseProtocol {
  private app: Express;
  private server?: Server;
  private config: RESTConfig;
  private router: OSSARouter;
  private activeConnections = new Set<any>();

  constructor(config: RESTConfig, router: OSSARouter) {
    super('REST', '1.0.0');
    this.config = config;
    this.router = router;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, () => {
        this.isRunning = true;
        console.log(`🌐 REST API listening on port ${this.config.port}`);
        resolve();
      });

      this.server.on('error', reject);
      
      // Track connections for graceful shutdown
      this.server.on('connection', (socket) => {
        this.activeConnections.add(socket);
        socket.on('close', () => {
          this.activeConnections.delete(socket);
        });
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) return;

    return new Promise((resolve) => {
      // Close all active connections
      this.activeConnections.forEach((socket) => {
        socket.destroy();
      });
      this.activeConnections.clear();

      this.server!.close(() => {
        this.isRunning = false;
        console.log('🛑 REST API stopped');
        resolve();
      });
    });
  }

  getMetrics(): any {
    const baseMetrics = super.getMetrics();
    return {
      ...baseMetrics,
      activeConnections: this.activeConnections.size,
    };
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow for API usage
    }));

    // CORS
    if (this.config.cors) {
      this.app.use(cors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        credentials: true,
      }));
    }

    // Rate limiting
    if (this.config.rateLimit) {
      const limiter = rateLimit({
        windowMs: this.config.rateLimit.window,
        max: this.config.rateLimit.requests,
        message: {
          error: 'Too many requests',
          retryAfter: this.config.rateLimit.window / 1000,
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use(this.config.basePath, limiter);
    }

    // Compression
    this.app.use(compression());

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timing middleware
    this.app.use((req: RESTRequest, res: Response, next: NextFunction) => {
      req.startTime = performance.now();
      
      res.on('finish', () => {
        const responseTime = performance.now() - req.startTime!;
        const hasError = res.statusCode >= 400;
        this.recordRequest(responseTime, hasError);
      });
      
      next();
    });

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    const basePath = this.config.basePath;

    // Health check
    this.app.get(`${basePath}/health`, async (req: Request, res: Response) => {
      try {
        const health = await this.router.getHealth();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          error: 'Health check failed',
          message: (error as Error).message,
        });
      }
    });

    // Version info
    this.app.get(`${basePath}/version`, (req: Request, res: Response) => {
      res.json({
        api: this.version,
        ossa: '0.1.8',
        router: '0.1.8',
        build: process.env.BUILD_ID || 'development',
        commit: process.env.COMMIT_SHA || 'unknown',
      });
    });

    // Metrics
    this.app.get(`${basePath}/metrics`, async (req: Request, res: Response) => {
      try {
        const metrics = this.router.getMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to retrieve metrics',
          message: (error as Error).message,
        });
      }
    });

    // Agent discovery - GET with query parameters
    this.app.get(`${basePath}/discover`, async (req: Request, res: Response) => {
      try {
        const query: DiscoveryQuery = this.parseDiscoveryQuery(req.query);
        this.validateDiscoveryQuery(query);
        
        const result = await this.router.discoverAgents(query);
        const formattedResult = this.formatDiscoveryResult(result);
        
        res.json(formattedResult);
      } catch (error) {
        res.status(400).json({
          error: 'Discovery query failed',
          message: (error as Error).message,
        });
      }
    });

    // Agent discovery - POST with JSON body
    this.app.post(`${basePath}/discover`, async (req: Request, res: Response) => {
      try {
        const query: DiscoveryQuery = req.body;
        this.validateDiscoveryQuery(query);
        
        const result = await this.router.discoverAgents(query);
        const formattedResult = this.formatDiscoveryResult(result);
        
        res.json(formattedResult);
      } catch (error) {
        res.status(400).json({
          error: 'Discovery query failed',
          message: (error as Error).message,
        });
      }
    });

    // List all agents
    this.app.get(`${basePath}/agents`, async (req: Request, res: Response) => {
      try {
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = parseInt(req.query.offset as string) || 0;
        
        const query: DiscoveryQuery = {
          maxResults: limit,
          includeInactive: req.query.include_inactive === 'true',
          sortBy: req.query.sort_by as any || 'name',
          sortOrder: req.query.sort_order as any || 'asc',
        };

        // Add filters from query parameters
        if (req.query.class) {
          // Filter by agent class would be handled in discovery engine
        }
        
        if (req.query.tier) {
          query.conformanceTier = req.query.tier as any;
        }

        const result = await this.router.discoverAgents(query);
        
        res.json({
          agents: result.agents.slice(offset, offset + limit),
          total: result.totalFound,
          limit,
          offset,
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to list agents',
          message: (error as Error).message,
        });
      }
    });

    // Register new agent
    this.app.post(`${basePath}/agents`, async (req: Request, res: Response) => {
      try {
        // Validate required fields
        const { name, version, endpoint, capabilities, protocols } = req.body;
        if (!name || !version || !endpoint || !capabilities || !protocols) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['name', 'version', 'endpoint', 'capabilities', 'protocols'],
          });
        }

        const agentData = {
          ...req.body,
          status: 'healthy' as const,
          performance: {
            avgResponseTimeMs: 0,
            uptimePercentage: 100,
            requestsHandled: 0,
            successRate: 1.0,
            throughputRps: 0,
          },
        };

        const agentId = await this.router.registerAgent(agentData);
        const agent = await this.router.getAgent(agentId);
        
        res.status(201).json(agent);
      } catch (error) {
        res.status(400).json({
          error: 'Agent registration failed',
          message: (error as Error).message,
        });
      }
    });

    // Get specific agent
    this.app.get(`${basePath}/agents/:agentId`, async (req: Request, res: Response) => {
      try {
        const agent = await this.router.getAgent(req.params.agentId);
        
        if (!agent) {
          return res.status(404).json({
            error: 'Agent not found',
            agentId: req.params.agentId,
          });
        }

        res.json(agent);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to retrieve agent',
          message: (error as Error).message,
        });
      }
    });

    // Update agent
    this.app.put(`${basePath}/agents/:agentId`, async (req: Request, res: Response) => {
      try {
        await this.router.updateAgent(req.params.agentId, req.body);
        const updatedAgent = await this.router.getAgent(req.params.agentId);
        
        if (!updatedAgent) {
          return res.status(404).json({
            error: 'Agent not found',
            agentId: req.params.agentId,
          });
        }

        res.json(updatedAgent);
      } catch (error) {
        res.status(400).json({
          error: 'Agent update failed',
          message: (error as Error).message,
        });
      }
    });

    // Delete agent
    this.app.delete(`${basePath}/agents/:agentId`, async (req: Request, res: Response) => {
      try {
        await this.router.removeAgent(req.params.agentId);
        res.status(204).send();
      } catch (error) {
        res.status(404).json({
          error: 'Agent not found or could not be removed',
          message: (error as Error).message,
        });
      }
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
      });
    });
  }

  private parseDiscoveryQuery(query: any): DiscoveryQuery {
    const discoveryQuery: DiscoveryQuery = {};

    // Parse array parameters
    if (query.capabilities) {
      discoveryQuery.capabilities = Array.isArray(query.capabilities) 
        ? query.capabilities 
        : query.capabilities.split(',').map((c: string) => c.trim());
    }

    if (query.domains) {
      discoveryQuery.domains = Array.isArray(query.domains)
        ? query.domains
        : query.domains.split(',').map((d: string) => d.trim());
    }

    if (query.protocols) {
      discoveryQuery.protocols = Array.isArray(query.protocols)
        ? query.protocols
        : query.protocols.split(',').map((p: string) => p.trim());
    }

    if (query.compliance_frameworks) {
      discoveryQuery.complianceFrameworks = Array.isArray(query.compliance_frameworks)
        ? query.compliance_frameworks
        : query.compliance_frameworks.split(',').map((f: string) => f.trim());
    }

    // Parse scalar parameters
    if (query.performance_tier) {
      discoveryQuery.performanceTier = query.performance_tier;
    }

    if (query.conformance_tier) {
      discoveryQuery.conformanceTier = query.conformance_tier;
    }

    if (query.health_status) {
      discoveryQuery.healthStatus = query.health_status;
    }

    if (query.max_results) {
      discoveryQuery.maxResults = parseInt(query.max_results);
    }

    if (query.include_inactive) {
      discoveryQuery.includeInactive = query.include_inactive === 'true';
    }

    if (query.sort_by) {
      discoveryQuery.sortBy = query.sort_by;
    }

    if (query.sort_order) {
      discoveryQuery.sortOrder = query.sort_order;
    }

    return discoveryQuery;
  }
}