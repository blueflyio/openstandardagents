/**
 * Kubernetes Manifest Generator
 * Generates Deployment, Service, ConfigMap, Secret manifests
 */

import type { OssaAgent } from '../../types/index.js';
import type { KubernetesConfig } from './types.js';

export class KubernetesManifestGenerator {
  /**
   * Generate Deployment manifest
   */
  generateDeployment(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';
    const spec = manifest.spec as Record<string, unknown>;
    const constraints = spec.constraints as
      | {
          resources?: {
            cpu?: string;
            memory?: string;
          };
        }
      | undefined;

    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name,
        namespace: config.namespace || 'default',
        labels: {
          app: name,
          'ossa.ai/version': manifest.metadata?.version || '0.3.6',
        },
      },
      spec: {
        replicas: config.replicas || 1,
        selector: {
          matchLabels: {
            app: name,
          },
        },
        template: {
          metadata: {
            labels: {
              app: name,
            },
          },
          spec: {
            serviceAccountName: config.serviceAccount,
            containers: [
              {
                name: 'agent',
                image: `agent:${manifest.metadata?.version || 'latest'}`,
                ports: [
                  {
                    containerPort: 3000,
                    name: 'http',
                  },
                ],
                resources: constraints?.resources
                  ? {
                      limits: {
                        cpu: constraints.resources.cpu || '500m',
                        memory: constraints.resources.memory || '512Mi',
                      },
                      requests: {
                        cpu: constraints.resources.cpu || '100m',
                        memory: constraints.resources.memory || '128Mi',
                      },
                    }
                  : undefined,
                env: [
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                ],
              },
            ],
          },
        },
      },
    };
  }

  /**
   * Generate Service manifest
   */
  generateService(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${name}-service`,
        namespace: config.namespace || 'default',
      },
      spec: {
        selector: {
          app: name,
        },
        ports: [
          {
            port: 80,
            targetPort: 3000,
            protocol: 'TCP',
          },
        ],
        type: 'ClusterIP',
      },
    };
  }

  /**
   * Generate ConfigMap manifest
   */
  generateConfigMap(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';
    const spec = manifest.spec as Record<string, unknown>;

    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${name}-config`,
        namespace: config.namespace || 'default',
      },
      data: {
        'agent-config.json': JSON.stringify(
          {
            role: spec.role,
            llm: spec.llm,
          },
          null,
          2
        ),
      },
    };
  }

  /**
   * Generate all manifests
   */
  generateAll(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): {
    deployment: Record<string, unknown>;
    service: Record<string, unknown>;
    configMap: Record<string, unknown>;
  } {
    return {
      deployment: this.generateDeployment(manifest, config),
      service: this.generateService(manifest, config),
      configMap: this.generateConfigMap(manifest, config),
    };
  }
}
