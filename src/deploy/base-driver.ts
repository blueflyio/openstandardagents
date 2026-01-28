/**
 * OSSA Base Deployment Driver
 * Abstract base class for deployment drivers
 */

import type {
  IDeploymentDriver,
  DeploymentConfig,
  DeploymentResult,
  InstanceInfo,
  RollbackOptions,
  HealthCheckResult,
} from './types.js';
import type { OssaAgent } from '../types/index.js';

/**
 * Base deployment driver with common functionality
 */
export abstract class BaseDeploymentDriver implements IDeploymentDriver {
  protected instances: Map<string, InstanceInfo> = new Map();

  /**
   * Generate a unique instance ID
   */
  protected generateInstanceId(
    manifest: OssaAgent,
    config: DeploymentConfig
  ): string {
    const name = manifest.metadata?.name || 'agent';
    const version = config.version || manifest.metadata?.version || '1.0.0';
    const timestamp = Date.now();
    return `${name}-${version}-${config.environment}-${timestamp}`;
  }

  /**
   * Validate manifest before deployment
   */
  protected validateManifest(manifest: OssaAgent): void {
    if (!manifest.metadata) {
      throw new Error('Invalid manifest: missing metadata');
    }
    if (!manifest.spec) {
      throw new Error('Invalid manifest: missing spec');
    }
    if (!manifest.metadata.name) {
      throw new Error('Invalid manifest: missing metadata.name');
    }
  }

  /**
   * Create instance info from deployment
   */
  protected createInstanceInfo(
    instanceId: string,
    manifest: OssaAgent,
    config: DeploymentConfig,
    endpoint?: string
  ): InstanceInfo {
    return {
      id: instanceId,
      name: manifest.metadata?.name || 'agent',
      status: 'running',
      deployedAt: new Date().toISOString(),
      version: config.version || manifest.metadata?.version || '1.0.0',
      endpoint,
      metadata: {
        environment: config.environment,
        target: config.target,
      },
    };
  }

  /**
   * Store instance information
   */
  protected storeInstance(instance: InstanceInfo): void {
    this.instances.set(instance.id, instance);
  }

  /**
   * Get stored instance
   */
  protected getInstance(instanceId: string): InstanceInfo | undefined {
    return this.instances.get(instanceId);
  }

  // Abstract methods to be implemented by concrete drivers
  abstract deploy(
    manifest: OssaAgent,
    config: DeploymentConfig
  ): Promise<DeploymentResult>;

  abstract getStatus(instanceId: string): Promise<InstanceInfo>;

  abstract listInstances(): Promise<InstanceInfo[]>;

  abstract stop(instanceId: string): Promise<void>;

  abstract rollback(
    instanceId: string,
    options: RollbackOptions
  ): Promise<DeploymentResult>;

  abstract healthCheck(instanceId: string): Promise<HealthCheckResult>;
}
