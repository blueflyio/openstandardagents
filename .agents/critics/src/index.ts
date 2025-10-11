/**
 * OSSA Code Reviewer Agent - Production Implementation
 * OSSA-compliant critic agent for comprehensive code analysis
 */

import express, { Request, Response, NextFunction } from 'express';
import { ReviewHandler } from './handlers';
import { AgentConfig, ReviewRequest, ReviewResponse } from './types';
import { loadConfig, validateInput, errorHandler } from './utils';
import { MetricsCollector } from './metrics';
import { SecurityScanner } from './security';
import { QualityAnalyzer } from './quality';

export class CodeReviewerAgent {
  private app: express.Application;
  private config: AgentConfig;
  private handler: ReviewHandler;
  private metrics: MetricsCollector;
  private security: SecurityScanner;
  private quality: QualityAnalyzer;

  constructor() {
    this.app = express();
    this.config = loadConfig();
    this.metrics = new MetricsCollector();
    this.security = new SecurityScanner(this.config.security);
    this.quality = new QualityAnalyzer(this.config.quality);
    this.handler = new ReviewHandler(
      this.config,
      this.security,
      this.quality,
      this.metrics
    );

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Security middleware
    this.app.use(this.corsMiddleware.bind(this));
    this.app.use(this.authenticationMiddleware.bind(this));
    this.app.use(this.rateLimitMiddleware.bind(this));

    // Observability middleware
    this.app.use(this.loggingMiddleware.bind(this));
    this.app.use(this.metricsMiddleware.bind(this));
    this.app.use(this.tracingMiddleware.bind(this));
  }

  private setupRoutes(): void {
    // OSSA-required health endpoint
    this.app.get('/health', this.handler.health.bind(this.handler));

    // Core critic capabilities
    this.app.post('/analyze',
      validateInput('ReviewRequest'),
      this.handler.analyze.bind(this.handler)
    );

    this.app.post('/review',
      validateInput('ReviewRequest'),
      this.handler.review.bind(this.handler)
    );

    this.app.post('/security-scan',
      validateInput('SecurityScanRequest'),
      this.handler.securityScan.bind(this.handler)
    );

    this.app.post('/quality-check',
      validateInput('QualityCheckRequest'),
      this.handler.qualityCheck.bind(this.handler)
    );

    // OSSA discovery and capabilities
    this.app.get('/capabilities', this.handler.capabilities.bind(this.handler));
    this.app.get('/metrics', this.handler.metrics.bind(this.handler));

    // Batch operations
    this.app.post('/batch-review',
      validateInput('BatchReviewRequest'),
      this.handler.batchReview.bind(this.handler)
    );
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.originalUrl} not found`,
        agent: 'code-reviewer',
        version: this.config.version
      });
    });
  }

  // Middleware implementations
  private corsMiddleware(req: Request, res: Response, next: NextFunction): void {
    res.header('Access-Control-Allow-Origin', this.config.cors.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers',
      'Content-Type, Authorization, Content-Length, X-Requested-With, X-Agent-ID'
    );

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }

  private authenticationMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Skip auth for health checks
    if (req.path === '/health' || req.path === '/capabilities') {
      return next();
    }

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token && this.config.security.require_authentication) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required'
      });
    }

    // Validate token (implement your auth logic)
    if (token && !this.validateToken(token)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      });
    }

    next();
  }

  private rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const clientId = req.ip || 'unknown';
    const isRateLimited = this.metrics.checkRateLimit(clientId);

    if (isRateLimited) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: 60
      });
    }

    next();
  }

  private loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Add request context
    (req as any).requestId = requestId;
    (req as any).startTime = startTime;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Request received',
      requestId,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }));

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Request completed',
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration
      }));
    });

    next();
  }

  private metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.metrics.recordRequest({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });

    next();
  }

  private tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
    const traceId = req.headers['x-trace-id'] || this.generateTraceId();
    res.setHeader('X-Trace-ID', traceId);
    (req as any).traceId = traceId;
    next();
  }

  // Utility methods
  private validateToken(token: string): boolean {
    // Implement your token validation logic
    // For demo purposes, accept any non-empty token
    return token.length > 0;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async start(): Promise<void> {
    const port = this.config.port || 3000;

    return new Promise((resolve, reject) => {
      try {
        this.app.listen(port, () => {
          console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Code Reviewer Agent started',
            agent: 'code-reviewer',
            version: this.config.version,
            port,
            capabilities: this.config.capabilities,
            endpoints: ['/health', '/analyze', '/review', '/security-scan', '/quality-check']
          }));
          resolve();
        });
      } catch (error) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Failed to start agent',
          error: error instanceof Error ? error.message : String(error)
        }));
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    // Graceful shutdown logic
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Shutting down Code Reviewer Agent'
    }));
  }
}

// Bootstrap for standalone execution
if (require.main === module) {
  const agent = new CodeReviewerAgent();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await agent.stop();
    process.exit(0);
  });

  agent.start().catch(error => {
    console.error('Failed to start agent:', error);
    process.exit(1);
  });
}

export default CodeReviewerAgent;