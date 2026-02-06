import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { tracingService } from './services/tracing.service.js';
import healthRouter from './routes/health.js';
import agentsRouter from './routes/agents.js';
import executeRouter from './routes/execute.js';

/**
 * OSSA Bridge Server
 *
 * HTTP API bridge connecting Drupal PHP to TypeScript OSSA runtime.
 * Enables Drupal to execute OSSA agents via REST API.
 *
 * Features:
 * - Agent execution with OpenTelemetry tracing
 * - Agent registry listing
 * - Result caching
 * - Timeout handling
 * - Comprehensive error handling
 *
 * Architecture:
 * - Express server with CORS support
 * - Service layer (agent-runtime, tracing)
 * - Route layer (execute, agents, health)
 * - Delegates MCP operations to agent-protocol
 */

const PORT = parseInt(process.env.BRIDGE_PORT || '9090', 10);
const HOST = process.env.BRIDGE_HOST || '0.0.0.0';

// Initialize Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use(healthRouter);
app.use(agentsRouter);
app.use(executeRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'OSSA Bridge Server',
    version: process.env.npm_package_version || '0.1.0',
    description: 'HTTP Bridge for OSSA Runtime - Connects Drupal PHP to TypeScript OSSA agents',
    endpoints: {
      health: 'GET /health',
      agents: 'GET /api/v1/agents',
      agentDetail: 'GET /api/v1/agents/:agentId',
      execute: 'POST /api/v1/execute',
    },
    documentation: 'https://gitlab.com/blueflyio/openstandardagents',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
});

/**
 * Start server
 */
async function startServer(): Promise<void> {
  // Initialize tracing
  tracingService.initialize('ossa-bridge-server');

  // Start HTTP server
  const server = app.listen(PORT, HOST, () => {
    console.log('='.repeat(60));
    console.log('OSSA Bridge Server');
    console.log('='.repeat(60));
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Tracing: ${tracingService.isEnabled() ? 'enabled' : 'disabled'}`);
    console.log(`Registry: ${process.env.OSSA_REGISTRY_PATH || './agents'}`);
    console.log('='.repeat(60));
    console.log('Endpoints:');
    console.log(`  GET  /health              - Health check`);
    console.log(`  GET  /api/v1/agents       - List agents`);
    console.log(`  GET  /api/v1/agents/:id   - Get agent`);
    console.log(`  POST /api/v1/execute      - Execute agent`);
    console.log('='.repeat(60));
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);

    server.close(async () => {
      console.log('HTTP server closed');

      // Shutdown tracing
      await tracingService.shutdown();

      console.log('Shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { app, startServer };
