/**
 * Docker Adapter Types
 */

import type { ExportOptions } from '../base/adapter.interface.js';

export interface DockerConfig {
  baseImage?: string;
  nodeVersion?: string;
  pythonVersion?: string;
  workingDir?: string;
  exposePort?: number;
  healthCheck?: {
    command: string;
    interval?: number;
    timeout?: number;
    retries?: number;
  };
}

/**
 * Docker export options
 */
export interface DockerExportOptions extends ExportOptions {
  /**
   * Base image for Dockerfile
   */
  baseImage?: string;

  /**
   * Node.js version
   */
  nodeVersion?: string;

  /**
   * Python version (if applicable)
   */
  pythonVersion?: string;

  /**
   * Working directory in container
   */
  workingDir?: string;

  /**
   * Port to expose
   */
  exposePort?: number;

  /**
   * Include development Dockerfile
   */
  includeDev?: boolean;

  /**
   * Include production docker-compose
   */
  includeComposeProd?: boolean;

  /**
   * Include nginx configuration
   */
  includeNginx?: boolean;

  /**
   * Include supervisor configuration
   */
  includeSupervisor?: boolean;

  /**
   * Health check configuration
   */
  healthCheck?: {
    command: string;
    interval?: number;
    timeout?: number;
    retries?: number;
  };

  /**
   * Environment variables
   */
  environment?: Record<string, string>;

  /**
   * Volume mounts
   */
  volumes?: string[];

  /**
   * Network configuration
   */
  networks?: string[];

  /**
   * Resource limits
   */
  resources?: {
    cpus?: string;
    memory?: string;
  };
}
