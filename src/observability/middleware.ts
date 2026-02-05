/**
 * Express Middleware for Observability
 *
 * Provides:
 * - Prometheus metrics endpoint
 * - Request metrics collection
 * - Health check endpoint
 * - Readiness check endpoint
 */

import type { Request, Response, NextFunction } from 'express';
import {
  recordHttpRequest,
  recordError,
  activeRequests,
  getMetrics,
} from './metrics';
import { getErrorCode, isOssaError } from '../errors';
import { logger } from '../utils/logger';

/**
 * Metrics middleware - records HTTP request metrics
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Increment active requests
    activeRequests.inc();

    // Record response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route?.path || req.path;
      const method = req.method;
      const statusCode = res.statusCode;

      // Record metrics
      recordHttpRequest(method, route, statusCode, duration);

      // Decrement active requests
      activeRequests.dec();

      // Log
      logger.info({
        method,
        route,
        statusCode,
        duration,
        msg: 'Request completed',
      });
    });

    next();
  };
}

/**
 * Error metrics middleware - records error metrics
 */
export function errorMetricsMiddleware() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    const errorCode = getErrorCode(err);
    const errorType = err.name;
    const statusCode = isOssaError(err) ? err.statusCode : 500;

    // Record error metrics
    recordError(errorCode, errorType, statusCode);

    // Pass to next error handler
    next(err);
  };
}

/**
 * Metrics endpoint - exposes Prometheus metrics
 */
export async function metricsEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error({ err: error, msg: 'Failed to generate metrics' });
    res.status(500).send('Failed to generate metrics');
  }
}

/**
 * Health check interface
 */
export interface HealthCheck {
  name: string;
  check: () => Promise<{ healthy: boolean; message?: string }>;
}

/**
 * Health check registry
 */
const healthChecks: HealthCheck[] = [];

/**
 * Register health check
 */
export function registerHealthCheck(check: HealthCheck): void {
  healthChecks.push(check);
  logger.info({ checkName: check.name, msg: 'Health check registered' });
}

/**
 * Health check endpoint - checks if service is healthy
 */
export async function healthEndpoint(req: Request, res: Response): Promise<void> {
  const results: Record<string, { healthy: boolean; message?: string }> = {};
  let allHealthy = true;

  // Run all health checks
  for (const check of healthChecks) {
    try {
      const result = await check.check();
      results[check.name] = result;
      if (!result.healthy) {
        allHealthy = false;
      }
    } catch (error) {
      results[check.name] = {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
      };
      allHealthy = false;
    }
  }

  // Basic health check (process is running)
  results.process = {
    healthy: true,
    message: 'Process is running',
  };

  // Memory check (warn if > 1GB)
  const memUsage = process.memoryUsage();
  const memUsedMB = memUsage.heapUsed / 1024 / 1024;
  results.memory = {
    healthy: memUsedMB < 1024,
    message: `Heap used: ${memUsedMB.toFixed(2)}MB`,
  };

  // Uptime check
  const uptimeSeconds = process.uptime();
  results.uptime = {
    healthy: true,
    message: `${uptimeSeconds.toFixed(0)}s`,
  };

  // Response
  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: results,
  });
}

/**
 * Readiness check endpoint - checks if service is ready to accept traffic
 */
export async function readinessEndpoint(req: Request, res: Response): Promise<void> {
  // Check if service is ready
  const ready = true; // Can add more checks here

  if (ready) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Liveness check endpoint - checks if service is alive (for K8s)
 */
export async function livenessEndpoint(req: Request, res: Response): Promise<void> {
  // Simple liveness check (process is running)
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Setup observability endpoints
 */
export function setupObservabilityEndpoints(app: any): void {
  // Metrics endpoint
  app.get('/metrics', metricsEndpoint);

  // Health check endpoints
  app.get('/health', healthEndpoint);
  app.get('/health/ready', readinessEndpoint);
  app.get('/health/live', livenessEndpoint);

  logger.info({ msg: 'Observability endpoints configured' });
}

/**
 * Built-in health checks
 */

/**
 * Database health check example
 */
export function createDatabaseHealthCheck(
  name: string,
  checkFn: () => Promise<boolean>
): HealthCheck {
  return {
    name,
    check: async () => {
      try {
        const healthy = await checkFn();
        return {
          healthy,
          message: healthy ? 'Connected' : 'Disconnected',
        };
      } catch (error) {
        return {
          healthy: false,
          message: error instanceof Error ? error.message : 'Check failed',
        };
      }
    },
  };
}

/**
 * External service health check example
 */
export function createExternalServiceHealthCheck(
  name: string,
  url: string,
  timeoutMs = 5000
): HealthCheck {
  return {
    name,
    check: async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        const healthy = response.ok;
        return {
          healthy,
          message: `HTTP ${response.status}`,
        };
      } catch (error) {
        return {
          healthy: false,
          message: error instanceof Error ? error.message : 'Service unavailable',
        };
      }
    },
  };
}
