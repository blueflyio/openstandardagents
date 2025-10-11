/**
 * OSSA Simple Express Server
 * Minimal working Express server for OpenAPI 3.1 specification
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple type definitions
interface OSSAConfig {
  port: number;
  environment: string;
}

export class SimpleOSSAServer {
  private app: any;
  private config: OSSAConfig;

  constructor(config: OSSAConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use((express as any).urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.1.9',
        environment: this.config.environment
      });
    });

    // API documentation
    this.app.get('/docs', (req: any, res: any) => {
      res.redirect('/api-docs');
    });

    // Load OpenAPI spec for Swagger UI
    try {
      const specPath = path.join(__dirname, '../../api/ossa-complete.openapi.yml');
      if (fs.existsSync(specPath)) {
        const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as any;
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
      }
    } catch (error) {
      console.warn('Could not load OpenAPI specification:', error);
    }

    // Basic agents endpoint
    this.app.get('/api/v1/agents', (req: any, res: any) => {
      res.json({
        agents: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          has_next: false,
          has_previous: false,
          total_pages: 0
        }
      });
    });

    // Basic agent creation endpoint
    this.app.post('/api/v1/agents', (req: any, res: any) => {
      const agent = {
        id: `agent-${Date.now()}`,
        type: req.body.type || 'worker',
        name: req.body.name || 'Unnamed Agent',
        description: req.body.description,
        version: '1.0.0',
        status: 'active',
        capabilities: req.body.capabilities || [],
        configuration: req.body.configuration || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      res.status(201).json(agent);
    });

    // OpenAPI specification endpoint
    this.app.get('/api/openapi.yaml', (req: any, res: any) => {
      try {
        const specPath = path.join(__dirname, '../../api/ossa-complete.openapi.yml');
        if (fs.existsSync(specPath)) {
          res.setHeader('Content-Type', 'application/x-yaml');
          res.sendFile(path.resolve(specPath));
        } else {
          res.status(404).json({ error: 'OpenAPI specification not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Error loading OpenAPI specification' });
      }
    });

    // Catch-all for undefined routes
    this.app.use('*', (req: any, res: any) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
        available_endpoints: [
          'GET /health',
          'GET /docs',
          'GET /api-docs',
          'GET /api/v1/agents',
          'POST /api/v1/agents',
          'GET /api/openapi.yaml'
        ]
      });
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.app.listen(this.config.port, () => {
          console.log(`🚀 OSSA Server started successfully!`);
          console.log(`📍 Server running on port ${this.config.port}`);
          console.log(`🌍 Environment: ${this.config.environment}`);
          console.log(`📚 API Documentation: http://localhost:${this.config.port}/docs`);
          console.log(`🔍 Health Check: http://localhost:${this.config.port}/health`);
          console.log(`📋 OpenAPI Spec: http://localhost:${this.config.port}/api/openapi.yaml`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export for use in other modules
export default SimpleOSSAServer;

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: OSSAConfig = {
    port: parseInt(process.env.PORT || '3000'),
    environment: process.env.NODE_ENV || 'development'
  };

  const server = new SimpleOSSAServer(config);

  server
    .start()
    .then(() => {
      console.log('✅ Server initialization complete');
    })
    .catch((error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
}
