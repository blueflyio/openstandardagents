/**
 * OSSA Helm Chart Generator
 *
 * Transforms OSSA agent manifests into production-ready Helm charts.
 */

import yaml from 'js-yaml';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

const GenerationOptionsSchema = z.object({
  chart_name: z.string().optional(),
  namespace: z.string().default('default'),
  replicas: z.number().int().min(1).default(1),
  image: z
    .object({
      repository: z.string().optional(),
      tag: z.string().optional(),
      pullPolicy: z.enum(['Always', 'IfNotPresent', 'Never']).default('IfNotPresent')
    })
    .optional(),
  resources: z
    .object({
      limits: z
        .object({
          cpu: z.string().optional(),
          memory: z.string().optional()
        })
        .optional(),
      requests: z
        .object({
          cpu: z.string().optional(),
          memory: z.string().optional()
        })
        .optional()
    })
    .optional(),
  autoscaling: z
    .object({
      enabled: z.boolean().default(false),
      minReplicas: z.number().int().default(1),
      maxReplicas: z.number().int().default(10),
      targetCPUUtilization: z.number().int().default(80)
    })
    .optional(),
  ingress: z
    .object({
      enabled: z.boolean().default(false),
      className: z.string().optional(),
      hosts: z.array(z.string()).optional(),
      tls: z.array(z.any()).optional()
    })
    .optional(),
  compliance: z
    .object({
      enabled: z.boolean().default(false),
      frameworks: z.array(z.string()).optional(),
      policies: z.array(z.string()).optional()
    })
    .optional(),
  monitoring: z
    .object({
      enabled: z.boolean().default(true),
      prometheus: z.boolean().default(true),
      jaeger: z.boolean().default(false)
    })
    .optional()
});

export type GenerationOptions = z.infer<typeof GenerationOptionsSchema>;

export interface HelmChart {
  'Chart.yaml': string;
  'values.yaml': string;
  templates: {
    [key: string]: string;
  };
}

// ============================================================================
// Helm Chart Generator
// ============================================================================

export class HelmChartGenerator {
  /**
   * Generate Helm chart from OSSA manifest
   */
  async generate(manifest: any, options: GenerationOptions = {}): Promise<HelmChart> {
    // Validate options
    const validatedOptions = GenerationOptionsSchema.parse(options);

    // Extract agent metadata
    const agentName = manifest.metadata?.name || 'ossa-agent';
    const agentVersion = manifest.metadata?.version || '1.0.0';
    const chartName = validatedOptions.chart_name || agentName;

    // Generate Chart.yaml
    const chartYaml = this.generateChartYaml(chartName, agentVersion, manifest);

    // Generate values.yaml
    const valuesYaml = this.generateValuesYaml(manifest, validatedOptions);

    // Generate templates
    const templates = this.generateTemplates(manifest, validatedOptions);

    return {
      'Chart.yaml': chartYaml,
      'values.yaml': valuesYaml,
      templates
    };
  }

  /**
   * Generate Chart.yaml
   */
  private generateChartYaml(name: string, version: string, manifest: any): string {
    const chart = {
      apiVersion: 'v2',
      name,
      description: manifest.metadata?.description || 'OSSA Agent',
      type: 'application',
      version: '0.1.0',
      appVersion: version,
      keywords: manifest.metadata?.tags || [],
      home: manifest.metadata?.documentation || '',
      sources: manifest.metadata?.repository ? [manifest.metadata.repository] : [],
      maintainers: manifest.metadata?.maintainers || []
    };

    return yaml.dump(chart);
  }

  /**
   * Generate values.yaml
   */
  private generateValuesYaml(manifest: any, options: GenerationOptions): string {
    const values: any = {
      replicaCount: options.replicas,
      image: {
        repository: options.image?.repository || 'ossa/agent',
        pullPolicy: options.image?.pullPolicy || 'IfNotPresent',
        tag: options.image?.tag || manifest.metadata?.version || 'latest'
      },
      nameOverride: '',
      fullnameOverride: '',
      serviceAccount: {
        create: true,
        annotations: {},
        name: ''
      },
      podAnnotations: {
        'ossa.io/agent': manifest.metadata?.name || 'unknown',
        'ossa.io/version': manifest.metadata?.version || 'unknown'
      },
      podSecurityContext: {
        runAsNonRoot: true,
        runAsUser: 1000,
        fsGroup: 1000
      },
      securityContext: {
        allowPrivilegeEscalation: false,
        capabilities: {
          drop: ['ALL']
        },
        readOnlyRootFilesystem: true
      },
      service: {
        type: 'ClusterIP',
        port: manifest.deployment?.port || 8080
      },
      resources: options.resources || {
        limits: {
          cpu: '500m',
          memory: '512Mi'
        },
        requests: {
          cpu: '250m',
          memory: '256Mi'
        }
      },
      autoscaling: options.autoscaling || {
        enabled: false,
        minReplicas: 1,
        maxReplicas: 10,
        targetCPUUtilizationPercentage: 80
      },
      nodeSelector: {},
      tolerations: [],
      affinity: {}
    };

    // Add ingress if enabled
    if (options.ingress?.enabled) {
      values.ingress = {
        enabled: true,
        className: options.ingress.className || 'nginx',
        annotations: {},
        hosts:
          options.ingress.hosts?.map((host) => ({
            host,
            paths: [
              {
                path: '/',
                pathType: 'Prefix'
              }
            ]
          })) || [],
        tls: options.ingress.tls || []
      };
    }

    // Add monitoring if enabled
    if (options.monitoring?.enabled) {
      values.monitoring = {
        enabled: true,
        prometheus: options.monitoring.prometheus !== false,
        serviceMonitor: {
          enabled: true,
          interval: '30s'
        }
      };
    }

    // Add compliance annotations if enabled
    if (options.compliance?.enabled) {
      values.compliance = {
        enabled: true,
        frameworks: options.compliance.frameworks || [],
        podAnnotations:
          options.compliance.frameworks?.reduce(
            (acc, framework) => {
              acc[`compliance.ossa.io/${framework}`] = 'true';
              return acc;
            },
            {} as Record<string, string>
          ) || {}
      };
    }

    // Add agent-specific config
    if (manifest.deployment?.config) {
      values.config = manifest.deployment.config;
    }

    // Add environment variables
    if (manifest.deployment?.environment) {
      values.env = Object.entries(manifest.deployment.environment).map(([name, value]) => ({
        name,
        value
      }));
    }

    return yaml.dump(values);
  }

  /**
   * Generate Kubernetes templates
   */
  private generateTemplates(manifest: any, options: GenerationOptions): { [key: string]: string } {
    const templates: { [key: string]: string } = {};

    // Deployment
    templates['deployment.yaml'] = this.generateDeployment(manifest, options);

    // Service
    templates['service.yaml'] = this.generateService(manifest);

    // ServiceAccount
    templates['serviceaccount.yaml'] = this.generateServiceAccount();

    // ConfigMap (if config exists)
    if (manifest.deployment?.config) {
      templates['configmap.yaml'] = this.generateConfigMap(manifest);
    }

    // Ingress (if enabled)
    if (options.ingress?.enabled) {
      templates['ingress.yaml'] = this.generateIngress(options);
    }

    // HPA (if autoscaling enabled)
    if (options.autoscaling?.enabled) {
      templates['hpa.yaml'] = this.generateHPA(options);
    }

    // ServiceMonitor (if monitoring enabled)
    if (options.monitoring?.enabled && options.monitoring.prometheus) {
      templates['servicemonitor.yaml'] = this.generateServiceMonitor();
    }

    // NetworkPolicy (if compliance enabled)
    if (options.compliance?.enabled) {
      templates['networkpolicy.yaml'] = this.generateNetworkPolicy(options);
    }

    return templates;
  }

  /**
   * Generate Deployment template
   */
  private generateDeployment(manifest: any, options: GenerationOptions): string {
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: '{{ include "chart.fullname" . }}',
        labels: {
          '{{- include "chart.labels" . | nindent 4 }}': ''
        }
      },
      spec: {
        '{{- if not .Values.autoscaling.enabled }}': '',
        replicas: '{{ .Values.replicaCount }}',
        '{{- end }}': '',
        selector: {
          matchLabels: {
            '{{- include "chart.selectorLabels" . | nindent 6 }}': ''
          }
        },
        template: {
          metadata: {
            '{{- with .Values.podAnnotations }}': '',
            annotations: {
              '{{- toYaml . | nindent 8 }}': ''
            },
            '{{- end }}': '',
            labels: {
              '{{- include "chart.selectorLabels" . | nindent 8 }}': ''
            }
          },
          spec: {
            '{{- with .Values.imagePullSecrets }}': '',
            imagePullSecrets: {
              '{{- toYaml . | nindent 8 }}': ''
            },
            '{{- end }}': '',
            serviceAccountName: '{{ include "chart.serviceAccountName" . }}',
            securityContext: {
              '{{- toYaml .Values.podSecurityContext | nindent 8 }}': ''
            },
            containers: [
              {
                name: '{{ .Chart.Name }}',
                securityContext: {
                  '{{- toYaml .Values.securityContext | nindent 12 }}': ''
                },
                image: '{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}',
                imagePullPolicy: '{{ .Values.image.pullPolicy }}',
                ports: [
                  {
                    name: 'http',
                    containerPort: '{{ .Values.service.port }}',
                    protocol: 'TCP'
                  }
                ],
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 'http'
                  }
                },
                readinessProbe: {
                  httpGet: {
                    path: '/ready',
                    port: 'http'
                  }
                },
                resources: {
                  '{{- toYaml .Values.resources | nindent 12 }}': ''
                },
                '{{- with .Values.env }}': '',
                env: {
                  '{{- toYaml . | nindent 12 }}': ''
                },
                '{{- end }}': ''
              }
            ],
            '{{- with .Values.nodeSelector }}': '',
            nodeSelector: {
              '{{- toYaml . | nindent 8 }}': ''
            },
            '{{- end }}': '',
            '{{- with .Values.affinity }}': '',
            affinity: {
              '{{- toYaml . | nindent 8 }}': ''
            },
            '{{- end }}': '',
            '{{- with .Values.tolerations }}': '',
            tolerations: {
              '{{- toYaml . | nindent 8 }}': ''
            },
            '{{- end }}': ''
          }
        }
      }
    };

    return yaml.dump(deployment);
  }

  /**
   * Generate Service template
   */
  private generateService(manifest: any): string {
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: '{{ include "chart.fullname" . }}',
        labels: {
          '{{- include "chart.labels" . | nindent 4 }}': ''
        }
      },
      spec: {
        type: '{{ .Values.service.type }}',
        ports: [
          {
            port: '{{ .Values.service.port }}',
            targetPort: 'http',
            protocol: 'TCP',
            name: 'http'
          }
        ],
        selector: {
          '{{- include "chart.selectorLabels" . | nindent 4 }}': ''
        }
      }
    };

    return yaml.dump(service);
  }

  /**
   * Generate ServiceAccount template
   */
  private generateServiceAccount(): string {
    const sa = {
      '{{- if .Values.serviceAccount.create -}}': '',
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: '{{ include "chart.serviceAccountName" . }}',
        labels: {
          '{{- include "chart.labels" . | nindent 4 }}': ''
        },
        '{{- with .Values.serviceAccount.annotations }}': '',
        annotations: {
          '{{- toYaml . | nindent 4 }}': ''
        },
        '{{- end }}': ''
      },
      '{{- end }}': ''
    };

    return yaml.dump(sa);
  }

  /**
   * Generate ConfigMap template
   */
  private generateConfigMap(manifest: any): string {
    const cm = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: '{{ include "chart.fullname" . }}',
        labels: {
          '{{- include "chart.labels" . | nindent 4 }}': ''
        }
      },
      data: {
        '{{- toYaml .Values.config | nindent 2 }}': ''
      }
    };

    return yaml.dump(cm);
  }

  /**
   * Generate Ingress template
   */
  private generateIngress(options: GenerationOptions): string {
    const ingress = {
      '{{- if .Values.ingress.enabled -}}': '',
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: '{{ include "chart.fullname" . }}',
        labels: {
          '{{- include "chart.labels" . | nindent 4 }}': ''
        },
        '{{- with .Values.ingress.annotations }}': '',
        annotations: {
          '{{- toYaml . | nindent 4 }}': ''
        },
        '{{- end }}': ''
      },
      spec: {
        '{{- if .Values.ingress.className }}': '',
        ingressClassName: '{{ .Values.ingress.className }}',
        '{{- end }}': '',
        '{{- if .Values.ingress.tls }}': '',
        tls: {
          '{{- toYaml .Values.ingress.tls | nindent 4 }}': ''
        },
        '{{- end }}': '',
        rules: {
          '{{- range .Values.ingress.hosts }}': '',
          '- host: {{ .host | quote }}': '',
          '  http:': '',
          '    paths:': '',
          '      {{- range .paths }}': '',
          '      - path: {{ .path }}': '',
          '        pathType: {{ .pathType }}': '',
          '        backend:': '',
          '          service:': '',
          '            name: {{ include "chart.fullname" $ }}': '',
          '            port:': '',
          '              number: {{ $.Values.service.port }}': '',
          '      {{- end }}': '',
          '{{- end }}': ''
        }
      },
      '{{- end }}': ''
    };

    return yaml.dump(ingress);
  }

  /**
   * Generate HPA template
   */
  private generateHPA(options: GenerationOptions): string {
    const hpa = {
      '{{- if .Values.autoscaling.enabled }}': '',
      apiVersion: 'autoscaling/v2',
      kind: 'HorizontalPodAutoscaler',
      metadata: {
        name: '{{ include "chart.fullname" . }}',
        labels: {
          '{{- include "chart.labels" . | nindent 4 }}': ''
        }
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: '{{ include "chart.fullname" . }}'
        },
        minReplicas: '{{ .Values.autoscaling.minReplicas }}',
        maxReplicas: '{{ .Values.autoscaling.maxReplicas }}',
        metrics: [
          {
            type: 'Resource',
            resource: {
              name: 'cpu',
              target: {
                type: 'Utilization',
                averageUtilization: '{{ .Values.autoscaling.targetCPUUtilizationPercentage }}'
              }
            }
          }
        ]
      },
      '{{- end }}': ''
    };

    return yaml.dump(hpa);
  }

  /**
   * Generate ServiceMonitor template
   */
  private generateServiceMonitor(): string {
    const sm = {
      '{{- if .Values.monitoring.enabled }}': '',
      apiVersion: 'monitoring.coreos.com/v1',
      kind: 'ServiceMonitor',
      metadata: {
        name: '{{ include "chart.fullname" . }}',
        labels: {
          '{{- include "chart.labels" . | nindent 4 }}': ''
        }
      },
      spec: {
        selector: {
          matchLabels: {
            '{{- include "chart.selectorLabels" . | nindent 6 }}': ''
          }
        },
        endpoints: [
          {
            port: 'http',
            path: '/metrics',
            interval: '{{ .Values.monitoring.serviceMonitor.interval }}'
          }
        ]
      },
      '{{- end }}': ''
    };

    return yaml.dump(sm);
  }

  /**
   * Generate NetworkPolicy template
   */
  private generateNetworkPolicy(options: GenerationOptions): string {
    const np = {
      '{{- if .Values.compliance.enabled }}': '',
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: '{{ include "chart.fullname" . }}',
        labels: {
          '{{- include "chart.labels" . | nindent 4 }}': ''
        }
      },
      spec: {
        podSelector: {
          matchLabels: {
            '{{- include "chart.selectorLabels" . | nindent 6 }}': ''
          }
        },
        policyTypes: ['Ingress', 'Egress'],
        ingress: [
          {
            from: [
              {
                podSelector: {}
              }
            ],
            ports: [
              {
                protocol: 'TCP',
                port: '{{ .Values.service.port }}'
              }
            ]
          }
        ],
        egress: [
          {
            to: [
              {
                podSelector: {}
              }
            ]
          }
        ]
      },
      '{{- end }}': ''
    };

    return yaml.dump(np);
  }
}
