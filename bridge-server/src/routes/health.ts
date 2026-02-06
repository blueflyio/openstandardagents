import { Router, Request, Response } from 'express';
import { HealthResponse } from '../types/index.js';
import { tracingService } from '../services/tracing.service.js';
import { agentRuntimeService } from '../services/agent-runtime.service.js';

const router = Router();

// Server start time for uptime calculation
const startTime = Date.now();

/**
 * GET /health
 *
 * Health check endpoint for load balancers and monitoring.
 * Returns service status and component health.
 */
router.get('/health', async (_req: Request, res: Response<HealthResponse>) => {
  const uptime = Date.now() - startTime;

  // Check agent runtime health
  let agentRuntimeStatus: 'ok' | 'error' = 'ok';
  try {
    await agentRuntimeService.listAgents();
  } catch (error) {
    agentRuntimeStatus = 'error';
    console.error('Agent runtime health check failed:', error);
  }

  // Check tracing health
  const tracingStatus: 'ok' | 'error' = tracingService.isEnabled() ? 'ok' : 'error';

  // Overall status
  const allOk = agentRuntimeStatus === 'ok' && tracingStatus === 'ok';
  const anyError = agentRuntimeStatus === 'error' || tracingStatus === 'error';

  const response: HealthResponse = {
    status: allOk ? 'ok' : anyError ? 'degraded' : 'error',
    version: process.env.npm_package_version || '0.1.0',
    uptime,
    timestamp: new Date().toISOString(),
    services: {
      agentRuntime: agentRuntimeStatus,
      tracing: tracingStatus,
    },
  };

  const statusCode = response.status === 'ok' ? 200 : response.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(response);
});

export default router;
