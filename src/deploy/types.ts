/**
 * OSSA Deployment Driver Types
 * Type definitions for deployment drivers
 */

import type { OssaAgent } from '../types/index.js';

/**
 * Deployment target types
 */
export type DeploymentTarget = 'local' | 'docker' | 'kubernetes';

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  target: DeploymentTarget;
  environment: string;
  version?: string;
  dryRun?: boolean;
  configFile?: string;
  rollback?: boolean;
  // Docker specific
  dockerImage?: string;
  dockerPort?: number;
  dockerNetwork?: string;
  // Kubernetes specific
  namespace?: string;
  kubeconfig?: string;
  replicas?: number;
  // Local specific
  port?: number;
  host?: string;
}

/**
 * Deployment result
 */
export interface DeploymentResult {
  success: boolean;
  message: string;
  instanceId?: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message?: string;
  metrics?: {
    uptime?: number;
    requestCount?: number;
    errorRate?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

/**
 * Instance information
 */
export interface InstanceInfo {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'failed';
  deployedAt: string;
  version: string;
  endpoint?: string;
  health?: HealthCheckResult;
  metadata?: Record<string, unknown>;
}

/**
 * Rollback options
 */
export interface RollbackOptions {
  toVersion?: string;
  steps?: number;
}

/**
 * Deployment driver interface
 */
export interface IDeploymentDriver {
  /**
   * Deploy an agent to the target runtime
   */
  deploy(
    manifest: OssaAgent,
    config: DeploymentConfig
  ): Promise<DeploymentResult>;

  /**
   * Get deployment status and health
   */
  getStatus(instanceId: string): Promise<InstanceInfo>;

  /**
   * List all running instances
   */
  listInstances(): Promise<InstanceInfo[]>;

  /**
   * Stop a running instance
   */
  stop(instanceId: string): Promise<void>;

  /**
   * Rollback to a previous version
   */
  rollback(
    instanceId: string,
    options: RollbackOptions
  ): Promise<DeploymentResult>;

  /**
   * Perform health check on an instance
   */
  healthCheck(instanceId: string): Promise<HealthCheckResult>;
}
