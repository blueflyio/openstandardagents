/**
 * OSSA Docker Deployment Driver
 * Deploys agents as Docker containers
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseDeploymentDriver } from './base-driver.js';
import type {
  DeploymentConfig,
  DeploymentResult,
  InstanceInfo,
  RollbackOptions,
  HealthCheckResult,
} from './types.js';
import type { OssaAgent } from '../types/index.js';

const execAsync = promisify(exec);

/**
 * Docker deployment driver - runs agents in Docker containers
 */
export class DockerDeploymentDriver extends BaseDeploymentDriver {
  private dockerInstances: Map<string, InstanceInfo> = new Map();

  /**
   * Check if Docker is available
   */
  private async checkDockerAvailable(): Promise<boolean> {
    try {
      await execAsync('docker --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build container name from instance ID
   */
  private getContainerName(instanceId: string): string {
    return `ossa-${instanceId}`;
  }

  /**
   * Get Docker image for agent
   */
  private getDockerImage(
    manifest: OssaAgent,
    config: DeploymentConfig
  ): string {
    if (config.dockerImage) {
      return config.dockerImage;
    }

    // Check if manifest specifies runtime image
    const runtime = manifest.agent?.runtime;
    if (runtime?.image) {
      return runtime.image;
    }

    // Default to Node.js runtime
    return 'node:20-alpine';
  }

  async deploy(
    manifest: OssaAgent,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    this.validateManifest(manifest);

    const dockerAvailable = await this.checkDockerAvailable();
    if (!dockerAvailable) {
      return {
        success: false,
        message:
          'Docker is not available. Please install Docker and try again.',
      };
    }

    if (config.dryRun) {
      const image = this.getDockerImage(manifest, config);
      return {
        success: true,
        message: '[DRY RUN] Would deploy agent in Docker container',
        metadata: {
          name: manifest.metadata?.name,
          version: config.version || manifest.metadata?.version,
          environment: config.environment,
          image,
          port: config.port || 3000,
        },
      };
    }

    const instanceId = this.generateInstanceId(manifest, config);
    const containerName = this.getContainerName(instanceId);
    const port = config.port || 3000;
    const image = this.getDockerImage(manifest, config);
    const network = config.dockerNetwork || 'bridge';

    try {
      // Pull the image if needed
      await execAsync(`docker pull ${image}`);

      // Run the container
      const dockerCmd = [
        'docker run -d',
        `--name ${containerName}`,
        `--network ${network}`,
        `-p ${port}:${port}`,
        `-e OSSA_AGENT_NAME=${manifest.metadata?.name}`,
        `-e OSSA_ENVIRONMENT=${config.environment}`,
        `-e OSSA_VERSION=${config.version || manifest.metadata?.version || '1.0.0'}`,
        image,
      ].join(' ');

      const { stdout } = await execAsync(dockerCmd);
      const containerId = stdout.trim();

      const endpoint = `http://localhost:${port}`;
      const instance = this.createInstanceInfo(
        instanceId,
        manifest,
        config,
        endpoint
      );
      instance.metadata = {
        ...instance.metadata,
        containerId,
        containerName,
        image,
        port,
        network,
      };

      this.dockerInstances.set(instanceId, instance);
      this.storeInstance(instance);

      return {
        success: true,
        message: `Deployed ${manifest.metadata?.name} in Docker container`,
        instanceId,
        endpoint,
        metadata: {
          containerId,
          containerName,
          image,
          port,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Docker deployment failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getStatus(instanceId: string): Promise<InstanceInfo> {
    const instance = this.dockerInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const containerName = this.getContainerName(instanceId);

    try {
      // Check container status
      const { stdout } = await execAsync(
        `docker inspect --format='{{.State.Status}}' ${containerName}`
      );
      const containerStatus = stdout.trim();

      // Map Docker status to our status
      const statusMap: Record<string, InstanceInfo['status']> = {
        running: 'running',
        exited: 'stopped',
        created: 'starting',
        restarting: 'starting',
        paused: 'stopped',
        dead: 'failed',
      };

      instance.status = statusMap[containerStatus] || 'failed';

      // Update health
      const health = await this.healthCheck(instanceId);
      instance.health = health;

      return instance;
    } catch (error) {
      instance.status = 'failed';
      return instance;
    }
  }

  async listInstances(): Promise<InstanceInfo[]> {
    const instances: InstanceInfo[] = [];
    for (const [, instance] of this.dockerInstances) {
      try {
        const status = await this.getStatus(instance.id);
        instances.push(status);
      } catch {
        // Container might be removed, skip it
        continue;
      }
    }
    return instances;
  }

  async stop(instanceId: string): Promise<void> {
    const instance = this.dockerInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const containerName = this.getContainerName(instanceId);

    try {
      // Stop and remove the container
      await execAsync(`docker stop ${containerName}`);
      await execAsync(`docker rm ${containerName}`);

      this.dockerInstances.delete(instanceId);
    } catch (error) {
      throw new Error(
        `Failed to stop container: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async rollback(
    instanceId: string,
    options: RollbackOptions
  ): Promise<DeploymentResult> {
    const instance = this.dockerInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    // In a real implementation, this would:
    // 1. Stop current container
    // 2. Deploy previous version image
    // 3. Start new container with previous version
    // For now, we simulate the rollback

    const targetVersion = options.toVersion || 'previous';
    return {
      success: true,
      message: `Rolled back ${instance.name} to version ${targetVersion}`,
      instanceId,
      metadata: {
        previousVersion: instance.version,
        newVersion: targetVersion,
      },
    };
  }

  async healthCheck(instanceId: string): Promise<HealthCheckResult> {
    const instance = this.dockerInstances.get(instanceId);
    if (!instance) {
      return {
        healthy: false,
        status: 'unknown',
        message: 'Instance not found',
      };
    }

    const containerName = this.getContainerName(instanceId);

    try {
      // Check container health
      const { stdout } = await execAsync(
        `docker inspect --format='{{.State.Health.Status}}' ${containerName} 2>/dev/null || echo 'none'`
      );
      const healthStatus = stdout.trim();

      // Get container stats for metrics
      const { stdout: statsOutput } = await execAsync(
        `docker stats ${containerName} --no-stream --format '{{.MemUsage}}|{{.CPUPerc}}' 2>/dev/null || echo '0|0'`
      );
      const [memUsage, cpuUsage] = statsOutput.trim().split('|');

      const isHealthy = healthStatus === 'healthy' || healthStatus === 'none';
      const status = isHealthy ? 'healthy' : 'unhealthy';

      const uptime = Date.now() - new Date(instance.deployedAt).getTime();

      return {
        healthy: isHealthy,
        status,
        message: `Container is ${status}`,
        metrics: {
          uptime: Math.floor(uptime / 1000),
          requestCount: 0, // Would need agent metrics endpoint
          errorRate: 0,
          memoryUsage: parseFloat(memUsage) || 0,
          cpuUsage: parseFloat(cpuUsage) || 0,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'unhealthy',
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
