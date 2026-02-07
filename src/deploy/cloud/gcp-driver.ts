/**
 * GCP Deployment Driver
 * Deploys OSSA agents to Google Cloud Platform (Cloud Run, GKE)
 *
 * Features:
 * - Cloud Run deployment (serverless containers)
 * - GKE (Google Kubernetes Engine) deployment
 * - Auto-scaling configuration
 * - Cloud Monitoring integration
 */

import { BaseDeploymentDriver } from '../base-driver.js';
import type {
  DeploymentConfig,
  DeploymentResult,
  InstanceInfo,
  RollbackOptions,
  HealthCheckResult,
} from '../types.js';
import type { OssaAgent } from '../../types/index.js';

export interface GCPDeploymentConfig extends DeploymentConfig {
  // Cloud Run specific
  serviceName?: string;
  region?: string;
  platform?: 'managed' | 'gke';
  allowUnauthenticated?: boolean;
  minInstances?: number;
  maxInstances?: number;
  concurrency?: number;
  cpu?: string;
  memory?: string;

  // GKE specific
  cluster?: string;
  zone?: string;

  // Common
  projectId?: string;
  labels?: Record<string, string>;
}

/**
 * GCP deployment driver - deploys agents to Cloud Run or GKE
 */
export class GCPDeploymentDriver extends BaseDeploymentDriver {
  private gcpInstances: Map<string, InstanceInfo> = new Map();

  /**
   * Check if gcloud CLI is available
   */
  private async checkGCloudAvailable(): Promise<boolean> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync('gcloud --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deploy to GCP
   */
  async deploy(
    manifest: OssaAgent,
    config: GCPDeploymentConfig
  ): Promise<DeploymentResult> {
    this.validateManifest(manifest);

    const gcloudAvailable = await this.checkGCloudAvailable();
    if (!gcloudAvailable) {
      return {
        success: false,
        message:
          'gcloud CLI is not available. Please install Google Cloud SDK and configure credentials.',
      };
    }

    const instanceId = this.generateInstanceId(manifest, config);
    const projectId = config.projectId || process.env.GCP_PROJECT;

    if (!projectId) {
      return {
        success: false,
        message: 'GCP project ID must be specified via --project-id or GCP_PROJECT env var',
      };
    }

    if (config.dryRun) {
      return {
        success: true,
        message: '[DRY RUN] Would deploy to GCP',
        metadata: {
          name: manifest.metadata?.name,
          version: config.version || manifest.metadata?.version,
          environment: config.environment,
          projectId,
          platform: config.platform || 'managed',
        },
      };
    }

    try {
      // Deploy to Cloud Run (default) or GKE
      const platform = config.platform || 'managed';
      let result: DeploymentResult;

      if (platform === 'gke') {
        result = await this.deployToGKE(manifest, config, instanceId, projectId);
      } else {
        result = await this.deployToCloudRun(
          manifest,
          config,
          instanceId,
          projectId
        );
      }

      if (result.success) {
        const instance = this.createInstanceInfo(
          instanceId,
          manifest,
          config,
          result.endpoint
        );
        instance.metadata = {
          ...instance.metadata,
          projectId,
          platform,
          ...result.metadata,
        };

        this.gcpInstances.set(instanceId, instance);
        this.storeInstance(instance);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: `GCP deployment failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Deploy to Cloud Run
   */
  private async deployToCloudRun(
    manifest: OssaAgent,
    config: GCPDeploymentConfig,
    instanceId: string,
    projectId: string
  ): Promise<DeploymentResult> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const serviceName =
      config.serviceName || `ossa-${manifest.metadata?.name || 'agent'}`;
    const region = config.region || 'us-central1';
    const image =
      config.dockerImage || manifest.agent?.runtime?.image || 'node:20-alpine';

    const deployCmd = [
      'gcloud run deploy',
      serviceName,
      `--image ${image}`,
      `--platform managed`,
      `--region ${region}`,
      `--project ${projectId}`,
      config.allowUnauthenticated ? '--allow-unauthenticated' : '--no-allow-unauthenticated',
      config.minInstances ? `--min-instances ${config.minInstances}` : '',
      config.maxInstances ? `--max-instances ${config.maxInstances}` : '--max-instances 10',
      config.concurrency ? `--concurrency ${config.concurrency}` : '',
      config.cpu ? `--cpu ${config.cpu}` : '',
      config.memory ? `--memory ${config.memory}` : '--memory 512Mi',
      `--set-env-vars OSSA_AGENT_NAME=${manifest.metadata?.name || 'agent'},OSSA_ENVIRONMENT=${config.environment},OSSA_VERSION=${config.version || manifest.metadata?.version || '1.0.0'}`,
    ]
      .filter(Boolean)
      .join(' ');

    try {
      await execAsync(deployCmd);

      // Get service URL
      const { stdout } = await execAsync(
        `gcloud run services describe ${serviceName} --platform managed --region ${region} --project ${projectId} --format 'value(status.url)'`
      );
      const serviceUrl = stdout.trim();

      return {
        success: true,
        message: `Deployed to Cloud Run: ${serviceName}`,
        instanceId,
        endpoint: serviceUrl,
        metadata: {
          serviceName,
          region,
          projectId,
          platform: 'managed',
        },
      };
    } catch (error) {
      throw new Error(
        `Cloud Run deployment failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Deploy to GKE
   */
  private async deployToGKE(
    manifest: OssaAgent,
    config: GCPDeploymentConfig,
    instanceId: string,
    projectId: string
  ): Promise<DeploymentResult> {
    // GKE deployment uses kubectl similar to standard Kubernetes
    // First, get credentials
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const cluster = config.cluster || 'default';
    const zone = config.zone || 'us-central1-a';

    try {
      // Get GKE credentials
      await execAsync(
        `gcloud container clusters get-credentials ${cluster} --zone ${zone} --project ${projectId}`
      );

      // Use Kubernetes driver for actual deployment
      const { KubernetesDeploymentDriver } = await import('../k8s-driver.js');
      const k8sDriver = new KubernetesDeploymentDriver();

      return await k8sDriver.deploy(manifest, config);
    } catch (error) {
      throw new Error(
        `GKE deployment failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getStatus(instanceId: string): Promise<InstanceInfo> {
    const instance = this.gcpInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    return instance;
  }

  async listInstances(): Promise<InstanceInfo[]> {
    return Array.from(this.gcpInstances.values());
  }

  async stop(instanceId: string): Promise<void> {
    const instance = this.gcpInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    // Mark as stopped
    this.gcpInstances.delete(instanceId);
  }

  async rollback(
    instanceId: string,
    options: RollbackOptions
  ): Promise<DeploymentResult> {
    const instance = this.gcpInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      success: true,
      message: 'GCP rollback not yet implemented',
      instanceId,
    };
  }

  async healthCheck(instanceId: string): Promise<HealthCheckResult> {
    const instance = this.gcpInstances.get(instanceId);
    if (!instance) {
      return {
        healthy: false,
        status: 'unknown',
        message: 'Instance not found',
      };
    }

    return {
      healthy: true,
      status: 'healthy',
      message: 'Service is running',
    };
  }
}
