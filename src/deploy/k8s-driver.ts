/**
 * OSSA Kubernetes Deployment Driver
 * Deploys agents to Kubernetes clusters
 */

import { exec, spawn } from 'child_process';
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
 * Execute kubectl with stdin input
 */
async function kubectlApply(manifest: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const kubectl = spawn('kubectl', ['apply', '-f', '-'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    kubectl.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    kubectl.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    kubectl.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`kubectl apply failed: ${stderr}`));
      }
    });

    kubectl.on('error', (err: Error) => {
      reject(err);
    });

    kubectl.stdin.write(manifest);
    kubectl.stdin.end();
  });
}

/**
 * Kubernetes deployment driver - deploys agents to K8s clusters
 */
export class KubernetesDeploymentDriver extends BaseDeploymentDriver {
  private k8sInstances: Map<string, InstanceInfo> = new Map();

  /**
   * Check if kubectl is available
   */
  private async checkKubectlAvailable(): Promise<boolean> {
    try {
      await execAsync('kubectl version --client');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get deployment name from instance ID
   */
  private getDeploymentName(instanceId: string): string {
    // K8s names must be DNS-1123 compliant
    return `ossa-${instanceId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Get Docker image for agent
   */
  private getDockerImage(manifest: OssaAgent, config: DeploymentConfig): string {
    if (config.dockerImage) {
      return config.dockerImage;
    }

    const runtime = manifest.agent?.runtime;
    if (runtime?.image) {
      return runtime.image;
    }

    return 'node:20-alpine';
  }

  /**
   * Generate Kubernetes deployment manifest
   */
  private generateK8sManifest(
    manifest: OssaAgent,
    config: DeploymentConfig,
    instanceId: string
  ): string {
    const deploymentName = this.getDeploymentName(instanceId);
    const image = this.getDockerImage(manifest, config);
    const replicas = config.replicas || 1;
    const namespace = config.namespace || 'default';
    const version = config.version || manifest.metadata?.version || '1.0.0';

    const k8sManifest = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: deploymentName,
        namespace,
        labels: {
          app: manifest.metadata?.name || 'ossa-agent',
          'ossa.io/agent': manifest.metadata?.name || 'unknown',
          'ossa.io/version': version,
          'ossa.io/environment': config.environment,
        },
      },
      spec: {
        replicas,
        selector: {
          matchLabels: {
            app: manifest.metadata?.name || 'ossa-agent',
            'ossa.io/instance': instanceId,
          },
        },
        template: {
          metadata: {
            labels: {
              app: manifest.metadata?.name || 'ossa-agent',
              'ossa.io/instance': instanceId,
              'ossa.io/version': version,
            },
          },
          spec: {
            containers: [
              {
                name: 'agent',
                image,
                ports: [{ containerPort: 3000 }],
                env: [
                  { name: 'OSSA_AGENT_NAME', value: manifest.metadata?.name || 'agent' },
                  { name: 'OSSA_ENVIRONMENT', value: config.environment },
                  { name: 'OSSA_VERSION', value: version },
                ],
                resources: manifest.spec?.constraints?.resources || {
                  limits: { cpu: '500m', memory: '512Mi' },
                  requests: { cpu: '250m', memory: '256Mi' },
                },
              },
            ],
          },
        },
      },
    };

    return JSON.stringify(k8sManifest);
  }

  /**
   * Generate Kubernetes service manifest
   */
  private generateServiceManifest(
    manifest: OssaAgent,
    config: DeploymentConfig,
    instanceId: string
  ): string {
    const deploymentName = this.getDeploymentName(instanceId);
    const namespace = config.namespace || 'default';

    const serviceManifest = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${deploymentName}-svc`,
        namespace,
      },
      spec: {
        selector: {
          'ossa.io/instance': instanceId,
        },
        ports: [
          {
            protocol: 'TCP',
            port: 80,
            targetPort: 3000,
          },
        ],
        type: 'ClusterIP',
      },
    };

    return JSON.stringify(serviceManifest);
  }

  async deploy(
    manifest: OssaAgent,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    this.validateManifest(manifest);

    const kubectlAvailable = await this.checkKubectlAvailable();
    if (!kubectlAvailable) {
      return {
        success: false,
        message: 'kubectl is not available. Please install kubectl and configure kubeconfig.',
      };
    }

    const instanceId = this.generateInstanceId(manifest, config);
    const deploymentName = this.getDeploymentName(instanceId);
    const namespace = config.namespace || 'default';

    if (config.dryRun) {
      const k8sManifest = this.generateK8sManifest(manifest, config, instanceId);
      return {
        success: true,
        message: '[DRY RUN] Would deploy to Kubernetes',
        metadata: {
          name: manifest.metadata?.name,
          version: config.version || manifest.metadata?.version,
          environment: config.environment,
          deploymentName,
          namespace,
          manifest: JSON.parse(k8sManifest),
        },
      };
    }

    try {
      // Apply deployment using kubectlApply helper
      const deploymentManifest = this.generateK8sManifest(manifest, config, instanceId);
      await kubectlApply(deploymentManifest);

      // Apply service using kubectlApply helper
      const serviceManifest = this.generateServiceManifest(manifest, config, instanceId);
      await kubectlApply(serviceManifest);

      // Wait for deployment to be ready
      await execAsync(
        `kubectl rollout status deployment/${deploymentName} -n ${namespace} --timeout=60s`
      );

      const serviceName = `${deploymentName}-svc`;
      const endpoint = `http://${serviceName}.${namespace}.svc.cluster.local`;

      const instance = this.createInstanceInfo(
        instanceId,
        manifest,
        config,
        endpoint
      );
      instance.metadata = {
        ...instance.metadata,
        deploymentName,
        serviceName,
        namespace,
        replicas: config.replicas || 1,
      };

      this.k8sInstances.set(instanceId, instance);
      this.storeInstance(instance);

      return {
        success: true,
        message: `Deployed ${manifest.metadata?.name} to Kubernetes`,
        instanceId,
        endpoint,
        metadata: {
          deploymentName,
          serviceName,
          namespace,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Kubernetes deployment failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getStatus(instanceId: string): Promise<InstanceInfo> {
    const instance = this.k8sInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const deploymentName = this.getDeploymentName(instanceId);
    const namespace = (instance.metadata?.namespace as string) || 'default';

    try {
      // Get deployment status
      const { stdout } = await execAsync(
        `kubectl get deployment ${deploymentName} -n ${namespace} -o json`
      );
      const deployment = JSON.parse(stdout);

      const availableReplicas = deployment.status?.availableReplicas || 0;
      const desiredReplicas = deployment.spec?.replicas || 0;

      if (availableReplicas === desiredReplicas && availableReplicas > 0) {
        instance.status = 'running';
      } else if (availableReplicas === 0) {
        instance.status = 'failed';
      } else {
        instance.status = 'starting';
      }

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
    for (const [, instance] of this.k8sInstances) {
      try {
        const status = await this.getStatus(instance.id);
        instances.push(status);
      } catch {
        // Deployment might be deleted, skip it
        continue;
      }
    }
    return instances;
  }

  async stop(instanceId: string): Promise<void> {
    const instance = this.k8sInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const deploymentName = this.getDeploymentName(instanceId);
    const namespace = (instance.metadata?.namespace as string) || 'default';

    try {
      // Delete deployment
      await execAsync(`kubectl delete deployment ${deploymentName} -n ${namespace}`);

      // Delete service
      const serviceName = `${deploymentName}-svc`;
      await execAsync(`kubectl delete service ${serviceName} -n ${namespace}`);

      this.k8sInstances.delete(instanceId);
    } catch (error) {
      throw new Error(
        `Failed to stop deployment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async rollback(
    instanceId: string,
    options: RollbackOptions
  ): Promise<DeploymentResult> {
    const instance = this.k8sInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const deploymentName = this.getDeploymentName(instanceId);
    const namespace = (instance.metadata?.namespace as string) || 'default';

    try {
      // Use kubectl rollout undo
      const steps = options.steps || 1;
      await execAsync(
        `kubectl rollout undo deployment/${deploymentName} -n ${namespace} --to-revision=${steps}`
      );

      // Wait for rollback to complete
      await execAsync(
        `kubectl rollout status deployment/${deploymentName} -n ${namespace} --timeout=60s`
      );

      return {
        success: true,
        message: `Rolled back ${instance.name} by ${steps} revision(s)`,
        instanceId,
        metadata: {
          previousVersion: instance.version,
          steps,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Rollback failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async healthCheck(instanceId: string): Promise<HealthCheckResult> {
    const instance = this.k8sInstances.get(instanceId);
    if (!instance) {
      return {
        healthy: false,
        status: 'unknown',
        message: 'Instance not found',
      };
    }

    const deploymentName = this.getDeploymentName(instanceId);
    const namespace = (instance.metadata?.namespace as string) || 'default';

    try {
      // Get pod metrics
      const { stdout } = await execAsync(
        `kubectl get deployment ${deploymentName} -n ${namespace} -o json`
      );
      const deployment = JSON.parse(stdout);

      const availableReplicas = deployment.status?.availableReplicas || 0;
      const desiredReplicas = deployment.spec?.replicas || 0;
      const readyReplicas = deployment.status?.readyReplicas || 0;

      const isHealthy = availableReplicas === desiredReplicas && readyReplicas === desiredReplicas;
      const status = isHealthy ? 'healthy' : availableReplicas > 0 ? 'degraded' : 'unhealthy';

      const uptime = Date.now() - new Date(instance.deployedAt).getTime();

      return {
        healthy: isHealthy,
        status,
        message: `${availableReplicas}/${desiredReplicas} replicas available`,
        metrics: {
          uptime: Math.floor(uptime / 1000),
          requestCount: 0, // Would need metrics server
          errorRate: 0,
          memoryUsage: 0,
          cpuUsage: 0,
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
