/**
 * Express Server Generator
 *
 * Generates Express server with /chat endpoint and OpenAPI integration
 *
 * SOLID: Single Responsibility - Express server generation only
 * DRY: Reusable server templates
 */

import type { OssaAgent } from '../../../types/index.js';

/**
 * Express Server Code Generator
 */
export class ExpressGenerator {
  /**
   * Generate Express server with /chat endpoint
   */
  generateServer(manifest: OssaAgent): string {
    const metadata = manifest.metadata || { name: 'Agent', version: '1.0.0' };
    const className = this.toClassName(metadata.name);

    return `/**
 * Express Server for ${metadata.name}
 *
 * Generated from OSSA manifest
 * Version: ${metadata.version}
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import ${className} from './index.js';
import type { ChatRequest, ChatResponse } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Server configuration
 */
const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

/**
 * Express application
 */
const app = express();

/**
 * Agent instance
 */
const agent = new ${className}();

/**
 * Middleware
 */

// Parse JSON bodies
app.use(express.json());

// CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', config.corsOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (config.logLevel === 'info' || config.logLevel === 'debug') {
      console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.path} \${res.statusCode} \${duration}ms\`);
    }
  });

  next();
});

/**
 * Routes
 */

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '${metadata.version}',
  });
});

/**
 * Agent metadata endpoint
 */
app.get('/metadata', (req: Request, res: Response) => {
  try {
    const metadata = agent.getMetadata();
    res.json(metadata);
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({
      error: 'Failed to get agent metadata',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * OpenAPI specification endpoint
 */
app.get('/openapi', (req: Request, res: Response) => {
  try {
    const openapiPath = join(__dirname, '..', 'openapi.yaml');
    const openapiContent = readFileSync(openapiPath, 'utf-8');
    const openapiSpec = yaml.parse(openapiContent);

    res.json(openapiSpec);
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error);
    res.status(500).json({
      error: 'Failed to load OpenAPI specification',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Chat endpoint
 *
 * POST /chat
 * Body: { message: string, context?: object, tools?: string[] }
 */
app.post('/chat', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const request: ChatRequest = req.body;

    if (!request.message || typeof request.message !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'message field is required and must be a string',
      });
      return;
    }

    // Call agent
    const response: ChatResponse = await agent.chat(request);

    // Send response
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Chat failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Reset conversation endpoint
 *
 * POST /reset
 */
app.post('/reset', (req: Request, res: Response) => {
  try {
    agent.reset();
    res.json({
      status: 'success',
      message: 'Conversation history reset',
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({
      error: 'Reset failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get conversation history endpoint
 *
 * GET /history
 */
app.get('/history', (req: Request, res: Response) => {
  try {
    const history = agent.getHistory();
    res.json({
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      error: 'Failed to get conversation history',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: \`Route not found: \${req.method} \${req.path}\`,
  });
});

/**
 * Error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

/**
 * Start server
 */
const server = app.listen(config.port, config.host, () => {
  console.log(\`
╔════════════════════════════════════════════════════════════╗
║  ${metadata.name} v${metadata.version}
║
║  Server running at:
║  - http://\${config.host}:\${config.port}
║
║  Endpoints:
║  - POST /chat       - Send message to agent
║  - POST /reset      - Reset conversation
║  - GET  /history    - Get conversation history
║  - GET  /metadata   - Get agent metadata
║  - GET  /openapi    - OpenAPI specification
║  - GET  /health     - Health check
║
╚════════════════════════════════════════════════════════════╝
  \`);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

/**
 * Export for testing
 */
export { app, server };
`;
  }

  /**
   * Convert string to PascalCase class name
   */
  private toClassName(name: string): string {
    return name
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}
