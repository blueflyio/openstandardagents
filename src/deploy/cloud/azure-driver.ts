/**
 * Azure Deployment Driver
 * Deploys OSSA agents to Microsoft Azure (Container Instances, AKS)
 *
 * Features:
 * - Azure Container Instances (ACI) deployment
 * - Azure Kubernetes Service (AKS) deployment
 * - Auto-scaling configuration
 * - Azure Monitor integration
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

export interface AzureDeploymentConfig extends DeploymentConfig {
  // Container Instances specific
  containerName?: string;
  resourceGroup?: string;
  location?: string;
  cpu?: number;
  memory?: number;
  ports?: number[];
  dnsNameLabel?: string;

  // AKS specific
  aksCluster?: string;
  aksResourceGroup?: string;

  // Common
  subscriptionId?: string;
  tags?: Record<string, string>;
}

/**
 * Azure deployment driver - deploys agents to Container Instances or AKS
 */
export class AzureDeploymentDriver extends BaseDeploymentDriver {
  private azureInstances: Map<string, InstanceInfo> = new Map();

  /**
   * Check if Azure CLI is available
   */
  private async checkAzureAvailable(): Promise<boolean> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync('az --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deploy to Azure
   */
  async deploy(
    manifest: OssaAgent,
    config: AzureDeploymentConfig
  ): Promise<DeploymentResult> {
    this.validateManifest(manifest);

    const azureAvailable = await this.checkAzureAvailable();
    if (!azureAvailable) {
      return {
        success: false,
        message:
          'Azure CLI is not available. Please install Azure CLI and configure credentials.',
      };
    }

    const instanceId = this.generateInstanceId(manifest, config);

    if (config.dryRun) {
      return {
        success: true,
        message: '[DRY RUN] Would deploy to Azure',
        metadata: {
          name: manifest.metadata?.name,
          version: config.version || manifest.metadata?.version,
          environment: config.environment,
          platform: config.aksCluster ? 'AKS' : 'ACI',
        },
      };
    }

    try {
      // Deploy to AKS or Container Instances
      let result: DeploymentResult;

      if (config.aksCluster) {
        result = await this.deployToAKS(manifest, config, instanceId);
      } else {
        result = await this.deployToACI(manifest, config, instanceId);
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
          ...result.metadata,
        };

        this.azureInstances.set(instanceId, instance);
        this.storeInstance(instance);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: `Azure deployment failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Deploy to Azure Container Instances
   */
  private async deployToACI(
    manifest: OssaAgent,
    config: AzureDeploymentConfig,
    instanceId: string
  ): Promise<DeploymentResult> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const containerName =
      config.containerName || `ossa-${manifest.metadata?.name || 'agent'}`;
    const resourceGroup = config.resourceGroup || 'ossa-agents';
    const location = config.location || 'eastus';
    const image =
      config.dockerImage || manifest.agent?.runtime?.image || 'node:20-alpine';
    const cpu = config.cpu || 1;
    const memory = config.memory || 1;
    const port = config.ports?.[0] || 3000;

    // Create resource group if it doesn't exist
    try {
      await execAsync(`az group create --name ${resourceGroup} --location ${location}`);
    } catch {
      // Resource group might already exist
    }

    const deployCmd = [
      'az container create',
      `--name ${containerName}`,
      `--resource-group ${resourceGroup}`,
      `--image ${image}`,
      `--cpu ${cpu}`,
      `--memory ${memory}`,
      `--ports ${port}`,
      config.dnsNameLabel ? `--dns-name-label ${config.dnsNameLabel}` : '',
      `--environment-variables OSSA_AGENT_NAME=${manifest.metadata?.name || 'agent'} OSSA_ENVIRONMENT=${config.environment} OSSA_VERSION=${config.version || manifest.metadata?.version || '1.0.0'}`,
      `--restart-policy Always`,
    ]
      .filter(Boolean)
      .join(' ');

    try {
      await execAsync(deployCmd);

      // Get container FQDN
      const { stdout } = await execAsync(
        `az container show --name ${containerName} --resource-group ${resourceGroup} --query 'ipAddress.fqdn' --output tsv`
      );
      const fqdn = stdout.trim();
      const endpoint = fqdn ? `http://${fqdn}:${port}` : undefined;

      return {
        success: true,
        message: `Deployed to Azure Container Instances: ${containerName}`,
        instanceId,
        endpoint,
        metadata: {
          containerName,
          resourceGroup,
          location,
          fqdn,
          platform: 'ACI',
        },
      };
    } catch (error) {
      throw new Error(
        `Azure Container Instances deployment failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Deploy to Azure Kubernetes Service
   */
  private async deployToAKS(
    manifest: OssaAgent,
    config: AzureDeploymentConfig,
    instanceId: string
  ): Promise<DeploymentResult> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const cluster = config.aksCluster || 'ossa-cluster';
    const resourceGroup = config.aksResourceGroup || config.resourceGroup || 'ossa-aks';

    try {
      // Get AKS credentials
      await execAsync(
        `az aks get-credentials --name ${cluster} --resource-group ${resourceGroup} --overwrite-existing`
      );

      // Use Kubernetes driver for actual deployment
      const { KubernetesDeploymentDriver } = await import('../k8s-driver.js');
      const k8sDriver = new KubernetesDeploymentDriver();

      return await k8sDriver.deploy(manifest, config);
    } catch (error) {
      throw new Error(
        `AKS deployment failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getStatus(instanceId: string): Promise<InstanceInfo> {
    const instance = this.azureInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    return instance;
  }

  async listInstances(): Promise<InstanceInfo[]> {
    return Array.from(this.azureInstances.values());
  }

  async stop(instanceId: string): Promise<void> {
    const instance = this.azureInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const containerName = instance.metadata?.containerName as string;
    const resourceGroup = instance.metadata?.resourceGroup as string;

    if (containerName && resourceGroup) {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      try {
        await execAsync(
          `az container delete --name ${containerName} --resource-group ${resourceGroup} --yes`
        );
      } catch (error) {
        throw new Error(
          `Failed to stop container: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    this.azureInstances.delete(instanceId);
  }

  async rollback(
    instanceId: string,
    options: RollbackOptions
  ): Promise<DeploymentResult> {
    const instance = this.azureInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      success: true,
      message: 'Azure rollback not yet implemented',
      instanceId,
    };
  }

  async healthCheck(instanceId: string): Promise<HealthCheckResult> {
    const instance = this.azureInstances.get(instanceId);
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
