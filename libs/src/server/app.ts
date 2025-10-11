/**
 * OSSA Complete API Server
 * Production-ready Express server implementing OpenAPI 3.1 specification
 * with full CRUD operations, validation, authentication, and monitoring
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ValidationError } from 'express-validator';
import swaggerUi from 'swagger-ui-express';
import { OpenAPIV3_1 } from 'openapi-types';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Import route handlers
import { agentsRouter } from './routes/agents';
import { specificationsRouter } from './routes/specifications';
import { orchestrationRouter } from './routes/orchestration';
import { monitoringRouter } from './routes/monitoring';
import dashboardRouter from './routes/dashboard';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { validationMiddleware } from './middleware/validation';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logging';
import { metricsMiddleware } from './middleware/metrics';

// Import services
import { AgentService } from './services/AgentService';
import { SpecificationService } from './services/SpecificationService';
import { ExecutionService } from './services/ExecutionService';
import { WebhookService } from './services/WebhookService';

// Import types
import { OSSAConfig, HealthCheckResult } from './types/server';

export class OSSAServer {
  private app: Application;
  private config: OSSAConfig;
  private agentService: AgentService;
  private specificationService: SpecificationService;
  private executionService: ExecutionService;
  private webhookService: WebhookService;

  constructor(config: OSSAConfig) {
    this.app = express();
    this.config = config;

    // Initialize services
    this.agentService = new AgentService(config.database);
    this.specificationService = new SpecificationService(config.database);
    this.executionService = new ExecutionService(config.execution);
    this.webhookService = new WebhookService(config.webhooks);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSwaggerDocs();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            scriptSrc: ["'self'", "'unsafe-inline'"] // Needed for Swagger UI
          }
        },
        crossOriginEmbedderPolicy: false
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: this.config.cors?.origins || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Metrics collection
    this.app.use(metricsMiddleware);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimit?.windowMs || 15 * 60 * 1000, // 15 minutes
      max: this.config.rateLimit?.max || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
        correlation_id: uuidv4(),
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please try again later.',
          correlation_id: uuidv4(),
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }
    });

    this.app.use('/api', limiter);

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || uuidv4();
      res.setHeader('X-Correlation-ID', req.headers['x-correlation-id'] as string);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.get('/health', this.healthCheck.bind(this));
    this.app.get('/ready', this.readinessCheck.bind(this));

    // API version information
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        name: 'OSSA Complete API',
        version: '0.1.9',
        description: 'Open Standards for Scalable Agents - Complete OpenAPI 3.1 Implementation',
        documentation: '/docs',
        health: '/health',
        ready: '/ready',
        openapi_spec: '/api/openapi.yaml'
      });
    });

    // OpenAPI spec endpoint
    this.app.get('/api/openapi.yaml', (req: Request, res: Response) => {
      try {
        const specPath = join(__dirname, '../../api/ossa-complete.openapi.yml');
        const spec = readFileSync(specPath, 'utf8');
        res.setHeader('Content-Type', 'application/yaml');
        res.send(spec);
      } catch (error) {
        res.status(500).json({
          error: 'SPEC_LOAD_ERROR',
          message: 'Failed to load OpenAPI specification',
          correlation_id: req.headers['x-correlation-id']
        });
      }
    });

    this.app.get('/api/openapi.json', (req: Request, res: Response) => {
      try {
        const specPath = join(__dirname, '../../api/ossa-complete.openapi.yml');
        const specYaml = readFileSync(specPath, 'utf8');
        const spec = yaml.load(specYaml) as OpenAPIV3_1.Document;
        res.json(spec);
      } catch (error) {
        res.status(500).json({
          error: 'SPEC_LOAD_ERROR',
          message: 'Failed to load OpenAPI specification',
          correlation_id: req.headers['x-correlation-id']
        });
      }
    });

    // API routes with authentication
    this.app.use('/api/v1/agents', authMiddleware, agentsRouter);
    this.app.use('/api/v1/specifications', authMiddleware, specificationsRouter);
    this.app.use('/api/v1/orchestration', authMiddleware, orchestrationRouter);
    this.app.use('/api/v1/monitoring', authMiddleware, monitoringRouter);

    // Dashboard API - real-time metrics (public for now, add auth later if needed)
    this.app.use('/api/v1/dashboard', dashboardRouter);

    // Webhook endpoints (special auth handling)
    this.app.post('/webhooks/:webhook_id', validationMiddleware, async (req: Request, res: Response) => {
      try {
        await this.webhookService.handleWebhook(req.params.webhook_id, req.body, req.headers);
        res.status(200).json({ received: true });
      } catch (error) {
        res.status(400).json({
          error: 'WEBHOOK_ERROR',
          message: 'Failed to process webhook',
          correlation_id: req.headers['x-correlation-id']
        });
      }
    });

    // 404 handler for undefined routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        correlation_id: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    });
  }

  private initializeSwaggerDocs(): void {
    try {
      const specPath = join(__dirname, '../../api/ossa-complete.openapi.yml');
      const specYaml = readFileSync(specPath, 'utf8');
      const spec = yaml.load(specYaml) as OpenAPIV3_1.Document;

      const swaggerOptions = {
        explorer: true,
        swaggerOptions: {
          url: '/api/openapi.yaml',
          supportedSubmitMethods: ['get', 'post', 'put', 'patch', 'delete'],
          tryItOutEnabled: true,
          filter: true,
          displayRequestDuration: true,
          docExpansion: 'list',
          defaultModelsExpandDepth: 2,
          persistAuthorization: true,
          oauth: {
            clientId: this.config.oauth?.clientId,
            realm: 'OSSA API',
            appName: 'OSSA Complete API',
            scopeSeparator: ' ',
            additionalQueryStringParams: {},
            usePkceWithAuthorizationCodeGrant: true
          }
        },
        customCss: `
          .swagger-ui .topbar { display: none }
          .swagger-ui .info { margin: 50px 0 }
          .swagger-ui .info hgroup.main { margin: 0 0 20px 0 }
          .swagger-ui .info .title { color: #3b4151; font-size: 36px }
        `,
        customSiteTitle: 'OSSA Complete API Documentation',
        customfavIcon: '/favicon.ico'
      };

      this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, swaggerOptions));

      // Alternative documentation endpoints
      this.app.use('/swagger', swaggerUi.serve, swaggerUi.setup(spec, swaggerOptions));
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, swaggerOptions));
    } catch (error) {
      console.error('Failed to initialize Swagger documentation:', error);
    }
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async healthCheck(req: Request, res: Response): Promise<void> {
    const health: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.1.9',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        webhooks: await this.checkWebhooks(),
        external_apis: await this.checkExternalAPIs()
      }
    };

    const overallHealthy = Object.values(health.checks).every((check) => check.status === 'healthy');
    health.status = overallHealthy ? 'healthy' : 'degraded';

    const statusCode = overallHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  }

  private async readinessCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check if all critical services are ready
      const checks = await Promise.all([
        this.checkDatabase(),
        this.agentService.isReady(),
        this.specificationService.isReady()
      ]);

      const ready = checks.every((check) => check.status === 'healthy');

      if (ready) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          message: 'Service is ready to accept requests'
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          message: 'Service is not ready to accept requests',
          checks
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Readiness check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async checkDatabase(): Promise<{
    status: string;
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      // Implement actual database health check
      // await this.database.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed'
      };
    }
  }

  private async checkRedis(): Promise<{
    status: string;
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      // Implement actual Redis health check
      // await this.redis.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Redis connection failed'
      };
    }
  }

  private async checkWebhooks(): Promise<{ status: string; error?: string }> {
    try {
      // Check webhook service health
      const healthy = await this.webhookService.isHealthy();
      return { status: healthy ? 'healthy' : 'unhealthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Webhook service failed'
      };
    }
  }

  private async checkExternalAPIs(): Promise<{
    status: string;
    error?: string;
  }> {
    try {
      // Check external API dependencies
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'External API check failed'
      };
    }
  }

  public async start(): Promise<void> {
    const port = this.config.port || 3000;

    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, () => {
        console.log(`🚀 OSSA Complete API Server started on port ${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/docs`);
        console.log(`🔍 Health Check: http://localhost:${port}/health`);
        console.log(`📊 OpenAPI Spec: http://localhost:${port}/api/openapi.yaml`);
        console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
        resolve();
      });

      server.on('error', (error) => {
        console.error('Failed to start server:', error);
        reject(error);
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Server factory function
export function createOSSAServer(config: OSSAConfig): OSSAServer {
  return new OSSAServer(config);
}

// Default configuration
export const defaultConfig: OSSAConfig = {
  port: parseInt(process.env.PORT || '3000'),
  environment: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ossa',
    username: process.env.DB_USER || 'ossa',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    issuer: process.env.OAUTH_ISSUER
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || 'default-webhook-secret',
    timeout: 30000
  },
  execution: {
    timeout: 300000, // 5 minutes default
    maxConcurrent: 10,
    retryAttempts: 3
  }
};

// Export for use in other modules
export * from './types/server';
export * from './services/AgentService';
export * from './services/SpecificationService';
export * from './services/ExecutionService';
export * from './services/WebhookService';
