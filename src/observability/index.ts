/**
 * Observability Module - Production-Grade Monitoring
 *
 * Exports:
 * - Prometheus metrics
 * - Express middleware
 * - Health checks
 * - System metrics
 */

// Metrics
export {
  metricsRegistry,
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  agentValidationsTotal,
  agentValidationDuration,
  agentExportsTotal,
  agentExportDuration,
  agentMigrationsTotal,
  registrySearchesTotal,
  registrySearchDuration,
  registryDownloadsTotal,
  registryDownloadDuration,
  errorsTotal,
  errorRate,
  activeRequests,
  memoryUsage,
  cpuUsage,
  recordHttpRequest,
  recordAgentValidation,
  recordAgentExport,
  recordAgentMigration,
  recordRegistrySearch,
  recordRegistryDownload,
  recordError,
  updateSystemMetrics,
  startSystemMetricsCollection,
  stopSystemMetricsCollection,
  getMetrics,
  clearMetrics,
} from './metrics';

// Middleware
export {
  metricsMiddleware,
  errorMetricsMiddleware,
  metricsEndpoint,
  healthEndpoint,
  readinessEndpoint,
  livenessEndpoint,
  setupObservabilityEndpoints,
  registerHealthCheck,
  createDatabaseHealthCheck,
  createExternalServiceHealthCheck,
} from './middleware';

// Types
export type { HealthCheck } from './middleware';
