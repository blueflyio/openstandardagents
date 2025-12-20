/**
 * OSSA Deployment Drivers
 * Export all deployment drivers and types
 */

export * from './types.js';
export * from './base-driver.js';
export * from './local-driver.js';
export * from './docker-driver.js';
export * from './k8s-driver.js';

import { LocalDeploymentDriver } from './local-driver.js';
import { DockerDeploymentDriver } from './docker-driver.js';
import { KubernetesDeploymentDriver } from './k8s-driver.js';
import type { IDeploymentDriver, DeploymentTarget } from './types.js';

/**
 * Factory function to create deployment drivers
 */
export function createDeploymentDriver(
  target: DeploymentTarget
): IDeploymentDriver {
  switch (target) {
    case 'local':
      return new LocalDeploymentDriver();
    case 'docker':
      return new DockerDeploymentDriver();
    case 'kubernetes':
      return new KubernetesDeploymentDriver();
    default:
      throw new Error(`Unknown deployment target: ${target}`);
  }
}
