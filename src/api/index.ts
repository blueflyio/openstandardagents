/**
 * OSSA REST API — Express app factory
 *
 * Three consumers, one service layer:
 *   CLI (inquirer) → Service Layer ← REST API (Express) ← MCP Server (stdio)
 */

import express from 'express';
import 'reflect-metadata';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestId } from './middleware/request-id.js';
import { convertRouter } from './routes/convert.router.js';
import { exportRouter } from './routes/export.router.js';
import { healthRouter } from './routes/health.router.js';
import { manifestsRouter } from './routes/manifests.router.js';
import { mcpRouter } from './routes/mcp.router.js';
import { skillsRouter } from './routes/skills.router.js';
import { validateRouter } from './routes/validate.router.js';
import { versionRouter } from './routes/version.router.js';
import { wizardRouter } from './routes/wizard.router.js';
import { workspaceRouter } from './routes/workspace.router.js';

export interface CreateAppOptions {
  corsOrigin?: string;
}

export function createApp(opts?: CreateAppOptions): express.Application {
  const app = express();

  // Body parsing
  app.use(express.json({ limit: '10mb' }));

  // Middleware
  app.use(requestId());
  app.use(corsMiddleware(opts?.corsOrigin));

  // Routes
  app.use('/', healthRouter());
  app.use('/api/v1/manifests', manifestsRouter());
  app.use('/api/v1/wizard', wizardRouter());
  app.use('/api/v1/export', exportRouter());
  app.use('/api/v1/convert', convertRouter());
  app.use('/api/v1/skills', skillsRouter());
  app.use('/api/v1/workspace', workspaceRouter());
  app.use('/api/v1/mcp', mcpRouter());
  app.use('/api/v1/version', versionRouter());
  app.use('/api/v1/validate', validateRouter());

  // Error handler (must be last)
  app.use(errorHandler());

  return app;
}
