/**
 * Prometheus Metrics - Production-Grade Observability
 *
 * Exports metrics for:
 * - HTTP requests (count, duration, errors)
 * - Agent operations (validation, export, migration)
 * - Registry operations (search, download)
 * - Error rates and types
 */

import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from '../utils/logger';

/**
 * Metrics registry (singleton)
 */
export const metricsRegistry = new Registry();

/**
 * Default labels for all metrics
 */
metricsRegistry.setDefaultLabels({
  app: 'ossa',
  version: process.env.npm_package_version || '0.0.0',
  env: process.env.NODE_ENV || 'development',
});

// ============================================================================
// HTTP METRICS
// ============================================================================

/**
 * HTTP request counter
 */
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

/**
 * HTTP request duration histogram (milliseconds)
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [metricsRegistry],
});

/**
 * HTTP errors counter
 */
export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_code'],
  registers: [metricsRegistry],
});

// ============================================================================
// AGENT OPERATION METRICS
// ============================================================================

/**
 * Agent validation counter
 */
export const agentValidationsTotal = new Counter({
  name: 'agent_validations_total',
  help: 'Total number of agent validations',
  labelNames: ['status', 'version'],
  registers: [metricsRegistry],
});

/**
 * Agent validation duration histogram (milliseconds)
 */
export const agentValidationDuration = new Histogram({
  name: 'agent_validation_duration_ms',
  help: 'Agent validation duration in milliseconds',
  labelNames: ['status', 'version'],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [metricsRegistry],
});

/**
 * Agent export counter
 */
export const agentExportsTotal = new Counter({
  name: 'agent_exports_total',
  help: 'Total number of agent exports',
  labelNames: ['platform', 'status'],
  registers: [metricsRegistry],
});

/**
 * Agent export duration histogram (milliseconds)
 */
export const agentExportDuration = new Histogram({
  name: 'agent_export_duration_ms',
  help: 'Agent export duration in milliseconds',
  labelNames: ['platform', 'status'],
  buckets: [100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [metricsRegistry],
});

/**
 * Agent migration counter
 */
export const agentMigrationsTotal = new Counter({
  name: 'agent_migrations_total',
  help: 'Total number of agent migrations',
  labelNames: ['from_version', 'to_version', 'status'],
  registers: [metricsRegistry],
});

// ============================================================================
// REGISTRY OPERATION METRICS
// ============================================================================

/**
 * Registry search counter
 */
export const registrySearchesTotal = new Counter({
  name: 'registry_searches_total',
  help: 'Total number of registry searches',
  labelNames: ['status', 'results_count'],
  registers: [metricsRegistry],
});

/**
 * Registry search duration histogram (milliseconds)
 */
export const registrySearchDuration = new Histogram({
  name: 'registry_search_duration_ms',
  help: 'Registry search duration in milliseconds',
  labelNames: ['status'],
  buckets: [50, 100, 250, 500, 1000, 2500, 5000],
  registers: [metricsRegistry],
});

/**
 * Registry download counter
 */
export const registryDownloadsTotal = new Counter({
  name: 'registry_downloads_total',
  help: 'Total number of registry downloads',
  labelNames: ['agent_id', 'status'],
  registers: [metricsRegistry],
});

/**
 * Registry download duration histogram (milliseconds)
 */
export const registryDownloadDuration = new Histogram({
  name: 'registry_download_duration_ms',
  help: 'Registry download duration in milliseconds',
  labelNames: ['status'],
  buckets: [100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [metricsRegistry],
});

// ============================================================================
// ERROR METRICS
// ============================================================================

/**
 * Error counter by error code
 */
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['error_code', 'error_type', 'status_code'],
  registers: [metricsRegistry],
});

/**
 * Error rate gauge (errors per minute)
 */
export const errorRate = new Gauge({
  name: 'error_rate',
  help: 'Error rate (errors per minute)',
  registers: [metricsRegistry],
});

// ============================================================================
// SYSTEM METRICS
// ============================================================================

/**
 * Active requests gauge
 */
export const activeRequests = new Gauge({
  name: 'active_requests',
  help: 'Number of active requests',
  registers: [metricsRegistry],
});

/**
 * Memory usage gauge (bytes)
 */
export const memoryUsage = new Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
  registers: [metricsRegistry],
});

/**
 * CPU usage gauge (percentage)
 */
export const cpuUsage = new Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage',
  registers: [metricsRegistry],
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
  errorCode?: string
): void {
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe({ method, route, status_code: statusCode }, durationMs);

  if (statusCode >= 400 && errorCode) {
    httpErrorsTotal.inc({ method, route, status_code: statusCode, error_code: errorCode });
  }
}

/**
 * Record agent validation metrics
 */
export function recordAgentValidation(
  status: 'success' | 'failure',
  version: string,
  durationMs: number
): void {
  agentValidationsTotal.inc({ status, version });
  agentValidationDuration.observe({ status, version }, durationMs);
}

/**
 * Record agent export metrics
 */
export function recordAgentExport(
  platform: string,
  status: 'success' | 'failure',
  durationMs: number
): void {
  agentExportsTotal.inc({ platform, status });
  agentExportDuration.observe({ platform, status }, durationMs);
}

/**
 * Record agent migration metrics
 */
export function recordAgentMigration(
  fromVersion: string,
  toVersion: string,
  status: 'success' | 'failure'
): void {
  agentMigrationsTotal.inc({ from_version: fromVersion, to_version: toVersion, status });
}

/**
 * Record registry search metrics
 */
export function recordRegistrySearch(
  status: 'success' | 'failure',
  resultsCount: number,
  durationMs: number
): void {
  registrySearchesTotal.inc({ status, results_count: String(resultsCount) });
  registrySearchDuration.observe({ status }, durationMs);
}

/**
 * Record registry download metrics
 */
export function recordRegistryDownload(
  agentId: string,
  status: 'success' | 'failure',
  durationMs: number
): void {
  registryDownloadsTotal.inc({ agent_id: agentId, status });
  registryDownloadDuration.observe({ status }, durationMs);
}

/**
 * Record error metrics
 */
export function recordError(errorCode: string, errorType: string, statusCode: number): void {
  errorsTotal.inc({ error_code: errorCode, error_type: errorType, status_code: statusCode });
}

/**
 * Update system metrics (memory, CPU)
 */
export function updateSystemMetrics(): void {
  const mem = process.memoryUsage();
  memoryUsage.set({ type: 'rss' }, mem.rss);
  memoryUsage.set({ type: 'heap_total' }, mem.heapTotal);
  memoryUsage.set({ type: 'heap_used' }, mem.heapUsed);
  memoryUsage.set({ type: 'external' }, mem.external);

  // CPU usage (requires cpuUsage to be called twice)
  const usage = process.cpuUsage();
  const totalUsage = (usage.user + usage.system) / 1000000; // Convert to seconds
  cpuUsage.set(totalUsage);
}

/**
 * Start system metrics collection (every 10 seconds)
 */
export function startSystemMetricsCollection(): NodeJS.Timer {
  const interval = setInterval(() => {
    try {
      updateSystemMetrics();
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to update system metrics' });
    }
  }, 10000);

  // Update immediately
  updateSystemMetrics();

  return interval;
}

/**
 * Stop system metrics collection
 */
export function stopSystemMetricsCollection(interval: NodeJS.Timer): void {
  clearInterval(interval);
}

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics(): void {
  metricsRegistry.resetMetrics();
}
