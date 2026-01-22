/**
 * Docker Adapter Types
 */

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
