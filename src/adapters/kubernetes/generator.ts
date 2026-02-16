/**
 * Production-Grade Kubernetes Manifest Generator with Kustomize Support
 * Generates complete Kubernetes deployment structure following best practices
 */

import type { OssaAgent } from '../../types/index.js';
import type { KubernetesConfig, KustomizeStructure } from './types.js';
import { getApiVersion } from '../../utils/version.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

export class KubernetesManifestGenerator {
  /**
   * Generate complete Kustomize structure with base and overlays
   */
  async generateKustomizeStructure(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Promise<KustomizeStructure> {
    const name = manifest.metadata?.name || 'agent';
    const version = manifest.metadata?.version || '1.0.0';

    return {
      base: {
        deployment: this.generateDeployment(manifest, config),
        service: this.generateService(manifest, config),
        configMap: this.generateConfigMap(manifest, config),
        secret: this.generateSecret(manifest, config),
        kustomization: this.generateBaseKustomization(name),
      },
      rbac: {
        serviceAccount: this.generateServiceAccount(manifest, config),
        role: this.generateRole(manifest, config),
        roleBinding: this.generateRoleBinding(manifest, config),
        kustomization: this.generateRBACKustomization(name),
      },
      overlays: {
        dev: {
          kustomization: this.generateOverlayKustomization(
            name,
            'dev',
            1,
            'development'
          ),
          patches: this.generateDevPatches(manifest),
        },
        staging: {
          kustomization: this.generateOverlayKustomization(
            name,
            'staging',
            2,
            'staging'
          ),
          patches: this.generateStagingPatches(manifest),
        },
        production: {
          kustomization: this.generateOverlayKustomization(
            name,
            'production',
            3,
            'production'
          ),
          patches: this.generateProductionPatches(manifest),
          hpa: this.generateHPA(manifest, config),
          networkPolicy: this.generateNetworkPolicy(manifest, config),
        },
      },
      monitoring: {
        serviceMonitor: this.generateServiceMonitor(manifest, config),
        grafanaDashboard: this.generateGrafanaDashboard(manifest),
        kustomization: this.generateMonitoringKustomization(name),
      },
      examples: {
        deployment: this.generateDeploymentExample(name, version),
        customization: this.generateCustomizationExample(name),
      },
      docs: {
        readme: this.generateREADME(manifest),
        deployment: this.generateDeploymentGuide(manifest),
      },
    };
  }

  /**
   * Generate Deployment manifest with production-grade settings
   */
  generateDeployment(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';
    const version = manifest.metadata?.version || '1.0.0';
    const spec = manifest.spec as Record<string, unknown>;
    const constraints = spec.constraints as
      | {
          resources?: {
            cpu?: string;
            memory?: string;
          };
        }
      | undefined;

    const labels = {
      app: name,
      'app.kubernetes.io/name': name,
      'app.kubernetes.io/version': version,
      'app.kubernetes.io/component': 'agent',
      'app.kubernetes.io/part-of': 'ossa-platform',
      'app.kubernetes.io/managed-by': 'kustomize',
      'ossa.ai/version': manifest.apiVersion || getApiVersion(),
    };

    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name,
        labels,
        annotations: {
          description: manifest.metadata?.description || '',
          'ossa.ai/category':
            (manifest.metadata?.labels as Record<string, string>)?.category ||
            'general',
        },
      },
      spec: {
        replicas: config.replicas || 1,
        revisionHistoryLimit: 10,
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxSurge: 1,
            maxUnavailable: 0,
          },
        },
        selector: {
          matchLabels: {
            app: name,
            'app.kubernetes.io/name': name,
          },
        },
        template: {
          metadata: {
            labels,
            annotations: {
              'prometheus.io/scrape': 'true',
              'prometheus.io/port': '3000',
              'prometheus.io/path': '/metrics',
            },
          },
          spec: {
            serviceAccountName: config.serviceAccount || `${name}-sa`,
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 1000,
              fsGroup: 1000,
              seccompProfile: {
                type: 'RuntimeDefault',
              },
            },
            containers: [
              {
                name: 'agent',
                image: `${config.imageRegistry || 'ghcr.io/ossa'}/${name}:${version}`,
                imagePullPolicy: 'IfNotPresent',
                ports: [
                  {
                    name: 'http',
                    containerPort: 3000,
                    protocol: 'TCP',
                  },
                  {
                    name: 'metrics',
                    containerPort: 9090,
                    protocol: 'TCP',
                  },
                ],
                env: [
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                  {
                    name: 'AGENT_NAME',
                    valueFrom: {
                      fieldRef: {
                        fieldPath: 'metadata.name',
                      },
                    },
                  },
                  {
                    name: 'AGENT_NAMESPACE',
                    valueFrom: {
                      fieldRef: {
                        fieldPath: 'metadata.namespace',
                      },
                    },
                  },
                ],
                envFrom: [
                  {
                    configMapRef: {
                      name: `${name}-config`,
                    },
                  },
                  {
                    secretRef: {
                      name: `${name}-secret`,
                      optional: true,
                    },
                  },
                ],
                resources: {
                  limits: {
                    cpu: constraints?.resources?.cpu || '1000m',
                    memory: constraints?.resources?.memory || '1Gi',
                  },
                  requests: {
                    cpu: constraints?.resources?.cpu || '200m',
                    memory: constraints?.resources?.memory || '256Mi',
                  },
                },
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 'http',
                  },
                  initialDelaySeconds: 30,
                  periodSeconds: 10,
                  timeoutSeconds: 5,
                  failureThreshold: 3,
                },
                readinessProbe: {
                  httpGet: {
                    path: '/ready',
                    port: 'http',
                  },
                  initialDelaySeconds: 10,
                  periodSeconds: 5,
                  timeoutSeconds: 3,
                  failureThreshold: 3,
                },
                startupProbe: {
                  httpGet: {
                    path: '/health',
                    port: 'http',
                  },
                  initialDelaySeconds: 0,
                  periodSeconds: 5,
                  timeoutSeconds: 3,
                  failureThreshold: 30,
                },
                securityContext: {
                  allowPrivilegeEscalation: false,
                  readOnlyRootFilesystem: true,
                  runAsNonRoot: true,
                  capabilities: {
                    drop: ['ALL'],
                  },
                },
                volumeMounts: [
                  {
                    name: 'tmp',
                    mountPath: '/tmp',
                  },
                  {
                    name: 'cache',
                    mountPath: '/app/cache',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'tmp',
                emptyDir: {},
              },
              {
                name: 'cache',
                emptyDir: {},
              },
            ],
            affinity: {
              podAntiAffinity: {
                preferredDuringSchedulingIgnoredDuringExecution: [
                  {
                    weight: 100,
                    podAffinityTerm: {
                      labelSelector: {
                        matchExpressions: [
                          {
                            key: 'app.kubernetes.io/name',
                            operator: 'In',
                            values: [name],
                          },
                        ],
                      },
                      topologyKey: 'kubernetes.io/hostname',
                    },
                  },
                ],
              },
            },
            tolerations: config.tolerations || [],
            nodeSelector: config.nodeSelector || {},
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
    const version = manifest.metadata?.version || '1.0.0';

    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
          'app.kubernetes.io/version': version,
        },
        annotations: {
          'prometheus.io/scrape': 'true',
          'prometheus.io/port': '3000',
        },
      },
      spec: {
        type: 'ClusterIP',
        selector: {
          app: name,
          'app.kubernetes.io/name': name,
        },
        ports: [
          {
            name: 'http',
            port: 80,
            targetPort: 'http',
            protocol: 'TCP',
          },
          {
            name: 'metrics',
            port: 9090,
            targetPort: 'metrics',
            protocol: 'TCP',
          },
        ],
        sessionAffinity: 'ClientIP',
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

    const agentConfig = {
      apiVersion: manifest.apiVersion,
      metadata: {
        name: manifest.metadata?.name,
        version: manifest.metadata?.version,
        description: manifest.metadata?.description,
      },
      spec: {
        role: spec.role,
        llm: spec.llm,
        tools: spec.tools || [],
        workflow: spec.workflow || {},
        governance: spec.governance || {},
      },
    };

    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${name}-config`,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
        },
      },
      data: {
        'agent.yaml': yaml.stringify(agentConfig),
        'config.json': JSON.stringify(
          {
            logLevel: 'info',
            metricsEnabled: true,
            tracingEnabled: true,
          },
          null,
          2
        ),
      },
    };
  }

  /**
   * Generate Secret manifest (placeholder)
   */
  generateSecret(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: `${name}-secret`,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
        },
      },
      type: 'Opaque',
      stringData: {
        '.env': `# API Keys and sensitive configuration
# Replace these values with actual secrets
API_KEY=your-api-key-here
LLM_API_KEY=your-llm-api-key-here
`,
      },
    };
  }

  /**
   * Generate ServiceAccount manifest
   */
  generateServiceAccount(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    return {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: `${name}-sa`,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
        },
      },
      automountServiceAccountToken: true,
    };
  }

  /**
   * Generate Role manifest
   */
  generateRole(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    return {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {
        name: `${name}-role`,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
        },
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['configmaps', 'secrets'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['pods'],
          verbs: ['get', 'list'],
        },
      ],
    };
  }

  /**
   * Generate RoleBinding manifest
   */
  generateRoleBinding(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    return {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: `${name}-rolebinding`,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
        },
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: `${name}-role`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${name}-sa`,
        },
      ],
    };
  }

  /**
   * Generate HPA manifest
   */
  generateHPA(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    return {
      apiVersion: 'autoscaling/v2',
      kind: 'HorizontalPodAutoscaler',
      metadata: {
        name: `${name}-hpa`,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
        },
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name,
        },
        minReplicas: 2,
        maxReplicas: 10,
        metrics: [
          {
            type: 'Resource',
            resource: {
              name: 'cpu',
              target: {
                type: 'Utilization',
                averageUtilization: 70,
              },
            },
          },
          {
            type: 'Resource',
            resource: {
              name: 'memory',
              target: {
                type: 'Utilization',
                averageUtilization: 80,
              },
            },
          },
        ],
        behavior: {
          scaleDown: {
            stabilizationWindowSeconds: 300,
            policies: [
              {
                type: 'Percent',
                value: 50,
                periodSeconds: 60,
              },
            ],
          },
          scaleUp: {
            stabilizationWindowSeconds: 0,
            policies: [
              {
                type: 'Percent',
                value: 100,
                periodSeconds: 30,
              },
            ],
          },
        },
      },
    };
  }

  /**
   * Generate NetworkPolicy manifest
   */
  generateNetworkPolicy(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    return {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: `${name}-netpol`,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
        },
      },
      spec: {
        podSelector: {
          matchLabels: {
            app: name,
            'app.kubernetes.io/name': name,
          },
        },
        policyTypes: ['Ingress', 'Egress'],
        ingress: [
          {
            from: [
              {
                namespaceSelector: {
                  matchLabels: {
                    'kubernetes.io/metadata.name':
                      config.namespace || 'default',
                  },
                },
              },
            ],
            ports: [
              {
                protocol: 'TCP',
                port: 3000,
              },
            ],
          },
        ],
        egress: [
          {
            to: [
              {
                namespaceSelector: {},
              },
            ],
            ports: [
              {
                protocol: 'TCP',
                port: 443,
              },
              {
                protocol: 'TCP',
                port: 80,
              },
            ],
          },
          {
            to: [
              {
                namespaceSelector: {},
                podSelector: {
                  matchLabels: {
                    'k8s-app': 'kube-dns',
                  },
                },
              },
            ],
            ports: [
              {
                protocol: 'UDP',
                port: 53,
              },
            ],
          },
        ],
      },
    };
  }

  /**
   * Generate ServiceMonitor for Prometheus
   */
  generateServiceMonitor(
    manifest: OssaAgent,
    config: KubernetesConfig = {}
  ): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    return {
      apiVersion: 'monitoring.coreos.com/v1',
      kind: 'ServiceMonitor',
      metadata: {
        name: `${name}-metrics`,
        labels: {
          app: name,
          'app.kubernetes.io/name': name,
        },
      },
      spec: {
        selector: {
          matchLabels: {
            app: name,
            'app.kubernetes.io/name': name,
          },
        },
        endpoints: [
          {
            port: 'metrics',
            interval: '30s',
            path: '/metrics',
          },
        ],
      },
    };
  }

  /**
   * Generate Grafana Dashboard ConfigMap
   */
  generateGrafanaDashboard(manifest: OssaAgent): Record<string, unknown> {
    const name = manifest.metadata?.name || 'agent';

    const dashboard = {
      dashboard: {
        title: `${name} Agent Metrics`,
        tags: ['ossa', 'agent'],
        timezone: 'browser',
        panels: [
          {
            title: 'Request Rate',
            targets: [
              {
                expr: `rate(http_requests_total{job="${name}"}[5m])`,
              },
            ],
          },
          {
            title: 'Error Rate',
            targets: [
              {
                expr: `rate(http_requests_total{job="${name}",status=~"5.."}[5m])`,
              },
            ],
          },
          {
            title: 'Response Time',
            targets: [
              {
                expr: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="${name}"}[5m]))`,
              },
            ],
          },
        ],
      },
    };

    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${name}-dashboard`,
        labels: {
          grafana_dashboard: 'true',
          app: name,
        },
      },
      data: {
        'dashboard.json': JSON.stringify(dashboard, null, 2),
      },
    };
  }

  /**
   * Generate base kustomization.yaml
   */
  generateBaseKustomization(name: string): Record<string, unknown> {
    return {
      apiVersion: 'kustomize.config.k8s.io/v1beta1',
      kind: 'Kustomization',
      resources: [
        'deployment.yaml',
        'service.yaml',
        'configmap.yaml',
        'secret.yaml',
        '../rbac',
      ],
      commonLabels: {
        'app.kubernetes.io/name': name,
        'app.kubernetes.io/managed-by': 'kustomize',
      },
      namespace: 'default',
    };
  }

  /**
   * Generate RBAC kustomization.yaml
   */
  generateRBACKustomization(name: string): Record<string, unknown> {
    return {
      apiVersion: 'kustomize.config.k8s.io/v1beta1',
      kind: 'Kustomization',
      resources: ['serviceaccount.yaml', 'role.yaml', 'rolebinding.yaml'],
      commonLabels: {
        'app.kubernetes.io/name': name,
      },
    };
  }

  /**
   * Generate monitoring kustomization.yaml
   */
  generateMonitoringKustomization(name: string): Record<string, unknown> {
    return {
      apiVersion: 'kustomize.config.k8s.io/v1beta1',
      kind: 'Kustomization',
      resources: ['servicemonitor.yaml', 'grafana-dashboard.yaml'],
      commonLabels: {
        'app.kubernetes.io/name': name,
      },
    };
  }

  /**
   * Generate overlay kustomization.yaml
   */
  generateOverlayKustomization(
    name: string,
    env: string,
    replicas: number,
    namespace: string
  ): Record<string, unknown> {
    const kustomization: Record<string, unknown> = {
      apiVersion: 'kustomize.config.k8s.io/v1beta1',
      kind: 'Kustomization',
      resources: ['../../base'],
      namespace,
      commonLabels: {
        environment: env,
      },
      replicas: [
        {
          name,
          count: replicas,
        },
      ],
      patches: [`${env}-patches.yaml`],
    };

    if (env === 'production') {
      kustomization.resources = [
        ...((kustomization.resources as string[]) || []),
        'hpa.yaml',
        'networkpolicy.yaml',
        '../../monitoring',
      ];
    }

    return kustomization;
  }

  /**
   * Generate development environment patches
   */
  generateDevPatches(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'agent';
    return yaml.stringify([
      {
        op: 'replace',
        path: '/spec/template/spec/containers/0/resources',
        value: {
          limits: {
            cpu: '500m',
            memory: '512Mi',
          },
          requests: {
            cpu: '100m',
            memory: '128Mi',
          },
        },
      },
      {
        op: 'add',
        path: '/spec/template/spec/containers/0/env/-',
        value: {
          name: 'LOG_LEVEL',
          value: 'debug',
        },
      },
    ]);
  }

  /**
   * Generate staging environment patches
   */
  generateStagingPatches(manifest: OssaAgent): string {
    return yaml.stringify([
      {
        op: 'replace',
        path: '/spec/template/spec/containers/0/resources',
        value: {
          limits: {
            cpu: '1000m',
            memory: '1Gi',
          },
          requests: {
            cpu: '200m',
            memory: '256Mi',
          },
        },
      },
    ]);
  }

  /**
   * Generate production environment patches
   */
  generateProductionPatches(manifest: OssaAgent): string {
    return yaml.stringify([
      {
        op: 'replace',
        path: '/spec/template/spec/containers/0/resources',
        value: {
          limits: {
            cpu: '2000m',
            memory: '2Gi',
          },
          requests: {
            cpu: '500m',
            memory: '512Mi',
          },
        },
      },
      {
        op: 'add',
        path: '/spec/template/spec/containers/0/env/-',
        value: {
          name: 'ENABLE_TRACING',
          value: 'true',
        },
      },
    ]);
  }

  /**
   * Generate deployment example
   */
  generateDeploymentExample(name: string, version: string): string {
    return `# Deploy ${name} Agent

## Quick Start

\`\`\`bash
# Deploy to development
kubectl apply -k overlays/dev

# Deploy to staging
kubectl apply -k overlays/staging

# Deploy to production
kubectl apply -k overlays/production
\`\`\`

## Verify Deployment

\`\`\`bash
# Check pods
kubectl get pods -l app.kubernetes.io/name=${name}

# Check service
kubectl get svc ${name}

# View logs
kubectl logs -l app.kubernetes.io/name=${name} -f
\`\`\`

## Customization

See \`customization-example.yaml\` for advanced configuration options.
`;
  }

  /**
   * Generate customization example
   */
  generateCustomizationExample(name: string): string {
    return yaml.stringify({
      apiVersion: 'kustomize.config.k8s.io/v1beta1',
      kind: 'Kustomization',
      resources: ['../../base'],
      namespace: 'my-namespace',
      namePrefix: 'custom-',
      commonLabels: {
        team: 'my-team',
      },
      replicas: [
        {
          name,
          count: 5,
        },
      ],
      images: [
        {
          name: `${name}`,
          newTag: 'v2.0.0',
        },
      ],
    });
  }

  /**
   * Generate README.md
   */
  generateREADME(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'agent';
    const version = manifest.metadata?.version || '1.0.0';
    const description = manifest.metadata?.description || 'OSSA Agent';

    return `# ${name} - Kubernetes Deployment

${description}

## Overview

This directory contains production-grade Kubernetes manifests for deploying the ${name} agent.

**Version:** ${version}

**Generated from:** OSSA Manifest v${manifest.apiVersion || getApiVersion()}

## Directory Structure

\`\`\`
k8s/
├── base/                 # Base manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── kustomization.yaml
├── rbac/                 # RBAC configuration
│   ├── serviceaccount.yaml
│   ├── role.yaml
│   ├── rolebinding.yaml
│   └── kustomization.yaml
├── overlays/             # Environment-specific configs
│   ├── dev/
│   ├── staging/
│   └── production/
├── monitoring/           # Prometheus & Grafana
│   ├── servicemonitor.yaml
│   ├── grafana-dashboard.yaml
│   └── kustomization.yaml
├── examples/             # Usage examples
└── docs/                 # Documentation
\`\`\`

## Quick Start

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl CLI tool
- kustomize (built into kubectl)

### Deploy to Development

\`\`\`bash
kubectl apply -k overlays/dev
\`\`\`

### Deploy to Production

\`\`\`bash
kubectl apply -k overlays/production
\`\`\`

## Configuration

### Secrets

Before deploying, configure secrets in \`base/secret.yaml\`:

\`\`\`bash
# Edit the secret
kubectl create secret generic ${name}-secret \\
  --from-literal=API_KEY=your-key \\
  --dry-run=client -o yaml | kubectl apply -f -
\`\`\`

### Customization

See \`examples/customization-example.yaml\` for advanced configuration.

## Monitoring

Prometheus metrics available at:
- Port: 9090
- Path: /metrics

Grafana dashboard included in \`monitoring/grafana-dashboard.yaml\`

## Health Checks

- **Liveness:** \`GET /health\`
- **Readiness:** \`GET /ready\`
- **Startup:** \`GET /health\`

## Scaling

### Manual Scaling

\`\`\`bash
kubectl scale deployment ${name} --replicas=5
\`\`\`

### Auto-Scaling (Production)

HorizontalPodAutoscaler configured in \`overlays/production/hpa.yaml\`:
- Min replicas: 2
- Max replicas: 10
- Target CPU: 70%
- Target Memory: 80%

## Security

- Non-root container
- Read-only root filesystem
- Security context configured
- NetworkPolicy enforced (production)
- RBAC with least privilege

## Troubleshooting

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed troubleshooting guide.

## Support

For issues and questions:
- GitHub Issues: https://github.com/ossa-ai/agents
- Documentation: https://docs.ossa.ai

## License

See LICENSE file in repository root.
`;
  }

  /**
   * Generate DEPLOYMENT.md guide
   */
  generateDeploymentGuide(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'agent';

    return `# ${name} Deployment Guide

## Prerequisites

### Required Tools

\`\`\`bash
# Verify kubectl
kubectl version --client

# Verify cluster access
kubectl cluster-info

# Verify kustomize (built into kubectl 1.14+)
kubectl kustomize --help
\`\`\`

### Cluster Requirements

- Kubernetes 1.24 or higher
- Container runtime (containerd, CRI-O)
- Ingress controller (optional)
- Prometheus Operator (for monitoring)

## Installation

### Step 1: Create Namespace

\`\`\`bash
kubectl create namespace ${name}-system
\`\`\`

### Step 2: Configure Secrets

\`\`\`bash
# Create secret from file
kubectl create secret generic ${name}-secret \\
  --from-file=.env=path/to/.env \\
  --namespace=${name}-system

# Or from literals
kubectl create secret generic ${name}-secret \\
  --from-literal=API_KEY=your-api-key \\
  --from-literal=LLM_API_KEY=your-llm-key \\
  --namespace=${name}-system
\`\`\`

### Step 3: Review Configuration

\`\`\`bash
# Preview manifests
kubectl kustomize overlays/production

# Review changes
kubectl diff -k overlays/production
\`\`\`

### Step 4: Deploy

\`\`\`bash
# Apply manifests
kubectl apply -k overlays/production

# Watch deployment
kubectl rollout status deployment/${name} -n ${name}-system
\`\`\`

### Step 5: Verify

\`\`\`bash
# Check pods
kubectl get pods -n ${name}-system -l app.kubernetes.io/name=${name}

# Check service
kubectl get svc -n ${name}-system

# View logs
kubectl logs -n ${name}-system -l app.kubernetes.io/name=${name} -f
\`\`\`

## Configuration

### Environment Variables

Set via ConfigMap (\`base/configmap.yaml\`):

- \`LOG_LEVEL\`: Log verbosity (debug, info, warn, error)
- \`METRICS_ENABLED\`: Enable Prometheus metrics
- \`TRACING_ENABLED\`: Enable distributed tracing

### Resource Tuning

Edit \`overlays/<env>/<env>-patches.yaml\`:

\`\`\`yaml
- op: replace
  path: /spec/template/spec/containers/0/resources
  value:
    limits:
      cpu: "2000m"
      memory: "2Gi"
    requests:
      cpu: "500m"
      memory: "512Mi"
\`\`\`

### Horizontal Pod Autoscaling

HPA configured in production:

\`\`\`bash
# View HPA status
kubectl get hpa ${name}-hpa -n ${name}-system

# Adjust thresholds
kubectl edit hpa ${name}-hpa -n ${name}-system
\`\`\`

## Monitoring

### Prometheus

ServiceMonitor automatically discovered by Prometheus Operator:

\`\`\`bash
# Verify ServiceMonitor
kubectl get servicemonitor -n ${name}-system
\`\`\`

### Grafana

Import dashboard from \`monitoring/grafana-dashboard.yaml\`:

\`\`\`bash
kubectl apply -f monitoring/grafana-dashboard.yaml
\`\`\`

### Logs

\`\`\`bash
# Tail logs
kubectl logs -n ${name}-system -l app.kubernetes.io/name=${name} -f

# View specific pod
kubectl logs -n ${name}-system ${name}-pod-name

# Previous container logs
kubectl logs -n ${name}-system ${name}-pod-name --previous
\`\`\`

## Upgrading

### Rolling Update

\`\`\`bash
# Update image version
kubectl set image deployment/${name} \\
  agent=ghcr.io/ossa/${name}:v2.0.0 \\
  -n ${name}-system

# Monitor rollout
kubectl rollout status deployment/${name} -n ${name}-system
\`\`\`

### Rollback

\`\`\`bash
# View rollout history
kubectl rollout history deployment/${name} -n ${name}-system

# Rollback to previous
kubectl rollout undo deployment/${name} -n ${name}-system

# Rollback to specific revision
kubectl rollout undo deployment/${name} --to-revision=2 -n ${name}-system
\`\`\`

## Troubleshooting

### Pod Not Starting

\`\`\`bash
# Describe pod
kubectl describe pod ${name}-pod-name -n ${name}-system

# Check events
kubectl get events -n ${name}-system --sort-by='.lastTimestamp'

# Check resource constraints
kubectl top pods -n ${name}-system
\`\`\`

### Health Check Failures

\`\`\`bash
# Test liveness probe
kubectl exec -it ${name}-pod-name -n ${name}-system -- curl localhost:3000/health

# Test readiness probe
kubectl exec -it ${name}-pod-name -n ${name}-system -- curl localhost:3000/ready
\`\`\`

### Network Issues

\`\`\`bash
# Check NetworkPolicy
kubectl get networkpolicy -n ${name}-system

# Test connectivity
kubectl exec -it ${name}-pod-name -n ${name}-system -- curl https://api.example.com
\`\`\`

### RBAC Issues

\`\`\`bash
# Check ServiceAccount
kubectl get sa ${name}-sa -n ${name}-system

# Check Role bindings
kubectl get rolebinding -n ${name}-system

# Test permissions
kubectl auth can-i get pods --as=system:serviceaccount:${name}-system:${name}-sa
\`\`\`

## Uninstallation

\`\`\`bash
# Delete deployment
kubectl delete -k overlays/production

# Delete namespace
kubectl delete namespace ${name}-system
\`\`\`

## Best Practices

1. **Use overlays** for environment-specific configuration
2. **Version images** with explicit tags, not \`latest\`
3. **Set resource limits** to prevent resource exhaustion
4. **Enable monitoring** for observability
5. **Use NetworkPolicies** to restrict network access
6. **Run as non-root** for security
7. **Test in staging** before production deployment

## Security Considerations

- ServiceAccount with least privilege RBAC
- Non-root container (UID 1000)
- Read-only root filesystem
- Dropped ALL capabilities
- NetworkPolicy enforcement
- Secret management via Kubernetes Secrets

## Support

For issues:
- Check logs: \`kubectl logs -n ${name}-system -l app.kubernetes.io/name=${name}\`
- Review events: \`kubectl get events -n ${name}-system\`
- GitHub Issues: https://github.com/ossa-ai/agents/issues

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [OSSA Documentation](https://docs.ossa.ai/)
`;
  }

  /**
   * Write Kustomize structure to disk
   */
  async writeKustomizeStructure(
    structure: KustomizeStructure,
    outputDir: string
  ): Promise<void> {
    // Base directory
    await this.writeManifest(
      structure.base.deployment,
      path.join(outputDir, 'base/deployment.yaml')
    );
    await this.writeManifest(
      structure.base.service,
      path.join(outputDir, 'base/service.yaml')
    );
    await this.writeManifest(
      structure.base.configMap,
      path.join(outputDir, 'base/configmap.yaml')
    );
    await this.writeManifest(
      structure.base.secret,
      path.join(outputDir, 'base/secret.yaml')
    );
    await this.writeManifest(
      structure.base.kustomization,
      path.join(outputDir, 'base/kustomization.yaml')
    );

    // RBAC directory
    await this.writeManifest(
      structure.rbac.serviceAccount,
      path.join(outputDir, 'rbac/serviceaccount.yaml')
    );
    await this.writeManifest(
      structure.rbac.role,
      path.join(outputDir, 'rbac/role.yaml')
    );
    await this.writeManifest(
      structure.rbac.roleBinding,
      path.join(outputDir, 'rbac/rolebinding.yaml')
    );
    await this.writeManifest(
      structure.rbac.kustomization,
      path.join(outputDir, 'rbac/kustomization.yaml')
    );

    // Overlays
    for (const [env, overlay] of Object.entries(structure.overlays)) {
      await this.writeManifest(
        overlay.kustomization,
        path.join(outputDir, `overlays/${env}/kustomization.yaml`)
      );
      await fs.writeFile(
        path.join(outputDir, `overlays/${env}/${env}-patches.yaml`),
        overlay.patches
      );

      if ('hpa' in overlay && overlay.hpa) {
        await this.writeManifest(
          overlay.hpa,
          path.join(outputDir, `overlays/${env}/hpa.yaml`)
        );
      }
      if ('networkPolicy' in overlay && overlay.networkPolicy) {
        await this.writeManifest(
          overlay.networkPolicy,
          path.join(outputDir, `overlays/${env}/networkpolicy.yaml`)
        );
      }
    }

    // Monitoring
    await this.writeManifest(
      structure.monitoring.serviceMonitor,
      path.join(outputDir, 'monitoring/servicemonitor.yaml')
    );
    await this.writeManifest(
      structure.monitoring.grafanaDashboard,
      path.join(outputDir, 'monitoring/grafana-dashboard.yaml')
    );
    await this.writeManifest(
      structure.monitoring.kustomization,
      path.join(outputDir, 'monitoring/kustomization.yaml')
    );

    // Examples
    await fs.mkdir(path.join(outputDir, 'examples'), { recursive: true });
    await fs.writeFile(
      path.join(outputDir, 'examples/deployment-example.md'),
      structure.examples.deployment
    );
    await fs.writeFile(
      path.join(outputDir, 'examples/customization-example.yaml'),
      structure.examples.customization
    );

    // Documentation
    await fs.mkdir(path.join(outputDir, 'docs'), { recursive: true });
    await fs.writeFile(
      path.join(outputDir, 'README.md'),
      structure.docs.readme
    );
    await fs.writeFile(
      path.join(outputDir, 'docs/DEPLOYMENT.md'),
      structure.docs.deployment
    );
  }

  /**
   * Write manifest to file
   */
  private async writeManifest(
    manifest: Record<string, unknown>,
    filePath: string
  ): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, yaml.stringify(manifest));
  }

  /**
   * Legacy method - generates all base manifests only
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
