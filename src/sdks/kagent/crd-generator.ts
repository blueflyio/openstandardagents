/**
 * kagent.dev CRD Generator
 * Converts OSSA manifest to kagent.dev CRD format
 * Generates production-grade Kubernetes manifests with complete resource specs
 */

import type { OssaAgent } from '../../types/index.js';
import type {
  KAgentCRD,
  KAgentDeploymentOptions,
  KubernetesManifestBundle,
  KAgentV1Alpha2Agent,
  KAgentV1Alpha2ModelConfig,
  KAgentV1Alpha2RemoteMCPServer,
  KAgentV1Alpha2Bundle,
} from './types.js';
import { KAGENT_APPLY_ORDER } from './types.js';
import { getVersion, getApiVersion } from '../../utils/version.js';

export class KAgentCRDGenerator {
  /**
   * Generate complete Kubernetes manifest bundle
   * Includes: CRD, Deployment, Service, ConfigMap, Secret, RBAC, HPA, NetworkPolicy
   */
  generateBundle(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): KubernetesManifestBundle {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';

    return {
      crd: this.generate(manifest, options),
      deployment: this.generateDeployment(manifest, options),
      service: this.generateService(manifest, options),
      configMap: this.generateConfigMap(manifest, options),
      secret: this.generateSecret(manifest, options),
      serviceAccount: this.generateServiceAccount(manifest, options),
      role: this.generateRole(manifest, options),
      roleBinding: this.generateRoleBinding(manifest, options),
      horizontalPodAutoscaler: this.generateHPA(manifest, options),
      networkPolicy: this.generateNetworkPolicy(manifest, options),
      readme: this.generateReadme(manifest, options),
    };
  }

  /**
   * Generate kagent CRD from OSSA manifest
   */
  generate(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): KAgentCRD {
    const spec = manifest.spec as Record<string, unknown>;
    const llmConfig = spec.llm as
      | {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
          topP?: number;
        }
      | undefined;

    const agentName = manifest.metadata?.name || 'unknown-agent';
    const systemMessage =
      (spec.role as string) || manifest.metadata?.description || '';

    // Extract tools
    const tools = this.extractTools(spec.tools, options);

    // Extract governance configuration (OSSA v0.4.4)
    const governance = this.extractGovernance(spec.governance);

    // Extract workflow configuration
    const workflow = this.extractWorkflow(spec.workflow);

    // Extract monitoring configuration
    const monitoring = this.extractMonitoring(spec.monitoring);

    // Build comprehensive CRD
    const crd: KAgentCRD = {
      apiVersion: 'kagent.dev/v1alpha1',
      kind: 'Agent',
      metadata: {
        name: agentName,
        namespace: options.namespace || 'default',
        labels: {
          'ossa.ai/version': manifest.metadata?.version || getVersion(),
          'ossa.ai/domain':
            ((spec.taxonomy as Record<string, unknown>)?.domain as string) ||
            'agents',
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/version': manifest.metadata?.version || '1.0.0',
          'app.kubernetes.io/managed-by': 'kagent',
          'app.kubernetes.io/component': 'agent',
          ...manifest.metadata?.labels,
        },
        annotations: {
          'ossa.ai/manifest': JSON.stringify(manifest),
          'ossa.ai/generated-by': 'kagent-crd-generator',
          'ossa.ai/generated-at': new Date().toISOString(),
          ...(manifest.metadata?.annotations?.['ossa.org/gaid'] && {
            'ossa.ai/gaid': manifest.metadata.annotations['ossa.org/gaid'],
          }),
          ...(manifest.metadata?.annotations?.['ossa.org/serial-number'] && {
            'ossa.ai/serial-number':
              manifest.metadata.annotations['ossa.org/serial-number'],
          }),
          ...manifest.metadata?.annotations,
        },
      },
      spec: {
        systemMessage,
        modelConfig: {
          provider: llmConfig?.provider || 'openai',
          model: llmConfig?.model || 'gpt-4',
          ...(llmConfig?.temperature !== undefined && {
            temperature: llmConfig.temperature,
          }),
          ...(llmConfig?.maxTokens !== undefined && {
            maxTokens: llmConfig.maxTokens,
          }),
          ...(llmConfig?.topP !== undefined && { topP: llmConfig.topP }),
          ...(options.apiKeySecret && { secretRef: options.apiKeySecret }),
        },
        ...(tools && tools.length > 0 && { tools }),

        // Skills (from OSSA spec or options)
        ...(options.skills &&
          options.skills.length > 0 && { skills: options.skills }),

        // Governance (OSSA v0.4.4)
        ...(governance && { governance }),

        // Workflow
        ...(workflow && { workflow }),

        // Monitoring
        ...(monitoring && { monitoring }),

        // A2A Protocol
        enableA2A: this.shouldEnableA2A(manifest),
        ...(options.a2a && {
          a2aProtocol: {
            enabled: options.a2a.enabled,
            endpoint: options.a2a.endpoint,
            timeout: options.a2a.timeout || 30000,
            retries: options.a2a.retries || 3,
          },
        }),

        // Code execution
        ...(options.codeExecution && {
          codeExecution: {
            enabled: options.codeExecution.enabled,
            sandboxed: options.codeExecution.sandboxed !== false,
            allowedLanguages: options.codeExecution.allowedLanguages || [
              'python',
              'javascript',
            ],
          },
        }),

        // Resources
        resources: {
          replicas: options.replicas || this.getDefaultReplicas(spec),
          limits: {
            cpu: options.resources?.limits?.cpu || '1000m',
            memory: options.resources?.limits?.memory || '1Gi',
          },
          requests: {
            cpu: options.resources?.requests?.cpu || '100m',
            memory: options.resources?.requests?.memory || '128Mi',
          },
        },

        // Security
        securityContext: options.securityContext || {
          runAsNonRoot: true,
          runAsUser: 1000,
          fsGroup: 1000,
          readOnlyRootFilesystem: true,
          allowPrivilegeEscalation: false,
          capabilities: {
            drop: ['ALL'],
          },
        },

        // RBAC
        serviceAccountName:
          options.rbac?.serviceAccountName || `${agentName}-sa`,
        rbac: {
          enabled: options.rbac?.enabled ?? true,
          rules: options.rbac?.rules || this.getDefaultRBACRules(),
        },

        // BYO Agent
        ...(options.byoAgent && {
          byoAgent: {
            enabled: options.byoAgent.enabled,
            image: options.byoAgent.image,
            command: options.byoAgent.command,
            args: options.byoAgent.args,
          },
        }),
      },
    };

    return crd;
  }

  /**
   * Generate Kubernetes Deployment
   */
  private generateDeployment(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';
    const spec = manifest.spec as Record<string, unknown>;

    const crd = this.generate(manifest, options);

    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `${agentName}-deployment`,
        namespace,
        labels: crd.metadata.labels,
        annotations: crd.metadata.annotations,
      },
      spec: {
        replicas: crd.spec.resources?.replicas || 1,
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxSurge: 1,
            maxUnavailable: 0,
          },
        },
        selector: {
          matchLabels: {
            'app.kubernetes.io/name': agentName,
            'app.kubernetes.io/component': 'agent',
          },
        },
        template: {
          metadata: {
            labels: crd.metadata.labels,
            annotations: {
              'prometheus.io/scrape': 'true',
              'prometheus.io/port': '9090',
              'prometheus.io/path': '/metrics',
            },
          },
          spec: {
            serviceAccountName: crd.spec.serviceAccountName,
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
                image: options.byoAgent?.image || `${agentName}:latest`,
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
                    value: agentName,
                  },
                  {
                    name: 'AGENT_VERSION',
                    value: manifest.metadata?.version || '1.0.0',
                  },
                  {
                    name: 'OSSA_VERSION',
                    value: getVersion(),
                  },
                ],
                envFrom: [
                  {
                    configMapRef: {
                      name: `${agentName}-config`,
                    },
                  },
                  {
                    secretRef: {
                      name: `${agentName}-secret`,
                      optional: true,
                    },
                  },
                ],
                resources: crd.spec.resources,
                securityContext: crd.spec.securityContext,
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 3000,
                    scheme: 'HTTP',
                  },
                  initialDelaySeconds: 30,
                  periodSeconds: 10,
                  timeoutSeconds: 5,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                readinessProbe: {
                  httpGet: {
                    path: '/ready',
                    port: 3000,
                    scheme: 'HTTP',
                  },
                  initialDelaySeconds: 10,
                  periodSeconds: 5,
                  timeoutSeconds: 3,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                volumeMounts: [
                  {
                    name: 'tmp',
                    mountPath: '/tmp',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'tmp',
                emptyDir: {},
              },
            ],
          },
        },
      },
    };
  }

  /**
   * Generate Kubernetes Service
   */
  private generateService(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';

    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${agentName}-service`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
      },
      spec: {
        type: 'ClusterIP',
        selector: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
        ports: [
          {
            name: 'http',
            port: 80,
            targetPort: 3000,
            protocol: 'TCP',
          },
          {
            name: 'metrics',
            port: 9090,
            targetPort: 9090,
            protocol: 'TCP',
          },
        ],
        sessionAffinity: 'ClientIP',
      },
    };
  }

  /**
   * Generate ConfigMap
   */
  private generateConfigMap(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';
    const spec = manifest.spec as Record<string, unknown>;

    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${agentName}-config`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
      },
      data: {
        'agent-config.json': JSON.stringify(
          {
            role: spec.role,
            llm: spec.llm,
            tools: spec.tools,
            workflow: spec.workflow,
            monitoring: spec.monitoring,
          },
          null,
          2
        ),
        'ossa-manifest.yaml': JSON.stringify(manifest, null, 2),
      },
    };
  }

  /**
   * Generate Secret (placeholder - user must fill in secrets)
   */
  private generateSecret(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';

    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: `${agentName}-secret`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
      },
      type: 'Opaque',
      stringData: {
        API_KEY: 'REPLACE_WITH_YOUR_API_KEY',
        ANTHROPIC_API_KEY: 'REPLACE_WITH_ANTHROPIC_KEY',
        OPENAI_API_KEY: 'REPLACE_WITH_OPENAI_KEY',
      },
    };
  }

  /**
   * Generate ServiceAccount
   */
  private generateServiceAccount(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';

    return {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: `${agentName}-sa`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
      },
      automountServiceAccountToken: true,
    };
  }

  /**
   * Generate Role
   */
  private generateRole(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';

    return {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {
        name: `${agentName}-role`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
      },
      rules: this.getDefaultRBACRules(),
    };
  }

  /**
   * Generate RoleBinding
   */
  private generateRoleBinding(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';

    return {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: `${agentName}-rolebinding`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: `${agentName}-sa`,
          namespace,
        },
      ],
      roleRef: {
        kind: 'Role',
        name: `${agentName}-role`,
        apiGroup: 'rbac.authorization.k8s.io',
      },
    };
  }

  /**
   * Generate HorizontalPodAutoscaler
   */
  private generateHPA(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> | null {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';
    const spec = manifest.spec as Record<string, unknown>;

    // Only generate HPA if agent supports horizontal scaling
    const scalability = (spec.agentArchitecture as any)?.runtime?.scalability;
    if (scalability !== 'horizontal') {
      return null;
    }

    return {
      apiVersion: 'autoscaling/v2',
      kind: 'HorizontalPodAutoscaler',
      metadata: {
        name: `${agentName}-hpa`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: `${agentName}-deployment`,
        },
        minReplicas: 1,
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
            stabilizationWindowSeconds: 60,
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
   * Generate NetworkPolicy
   */
  private generateNetworkPolicy(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): Record<string, unknown> {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';

    return {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: `${agentName}-netpol`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
        },
      },
      spec: {
        podSelector: {
          matchLabels: {
            'app.kubernetes.io/name': agentName,
            'app.kubernetes.io/component': 'agent',
          },
        },
        policyTypes: ['Ingress', 'Egress'],
        ingress: [
          {
            from: [
              {
                podSelector: {
                  matchLabels: {
                    'app.kubernetes.io/component': 'gateway',
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
                podSelector: {},
              },
            ],
            ports: [
              {
                protocol: 'TCP',
                port: 53,
              },
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
   * Generate comprehensive README documentation
   */
  private generateReadme(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): string {
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'default';
    const spec = manifest.spec as Record<string, unknown>;
    const llm = spec.llm as Record<string, unknown> | undefined;

    let readme = `# ${agentName} - Kubernetes Deployment\n\n`;
    readme += `**Generated from OSSA v0.4.4 Manifest**\n\n`;
    readme += `${manifest.metadata?.description || 'AI Agent deployment'}\n\n`;

    readme += '## Overview\n\n';
    readme += `- **Agent Name**: ${agentName}\n`;
    readme += `- **Version**: ${manifest.metadata?.version || '1.0.0'}\n`;
    readme += `- **Namespace**: ${namespace}\n`;
    readme += `- **LLM Provider**: ${llm?.provider || 'unknown'}\n`;
    readme += `- **LLM Model**: ${llm?.model || 'unknown'}\n\n`;

    readme += '## Prerequisites\n\n';
    readme += '- Kubernetes cluster (v1.24+)\n';
    readme += '- kubectl CLI configured\n';
    readme += '- kagent operator installed (optional for CRD)\n';
    readme += '- API keys configured in secrets\n\n';

    readme += '## Quick Start\n\n';
    readme += '### 1. Configure Secrets\n\n';
    readme += 'Edit the secret manifest and add your API keys:\n\n';
    readme += '```bash\n';
    readme += `kubectl edit secret ${agentName}-secret -n ${namespace}\n`;
    readme += '```\n\n';

    readme += '### 2. Deploy Resources\n\n';
    readme += '```bash\n';
    readme += '# Create namespace\n';
    readme += `kubectl create namespace ${namespace}\n\n`;
    readme += '# Apply all manifests\n';
    readme += `kubectl apply -f ${agentName}-serviceaccount.yaml\n`;
    readme += `kubectl apply -f ${agentName}-role.yaml\n`;
    readme += `kubectl apply -f ${agentName}-rolebinding.yaml\n`;
    readme += `kubectl apply -f ${agentName}-secret.yaml\n`;
    readme += `kubectl apply -f ${agentName}-configmap.yaml\n`;
    readme += `kubectl apply -f ${agentName}-service.yaml\n`;
    readme += `kubectl apply -f ${agentName}-deployment.yaml\n`;
    readme += `kubectl apply -f ${agentName}-networkpolicy.yaml\n`;
    readme += `kubectl apply -f ${agentName}-crd.yaml\n`;
    readme += '```\n\n';

    readme += '### 3. Verify Deployment\n\n';
    readme += '```bash\n';
    readme += '# Check pod status\n';
    readme += `kubectl get pods -n ${namespace} -l app.kubernetes.io/name=${agentName}\n\n`;
    readme += '# Check logs\n';
    readme += `kubectl logs -n ${namespace} -l app.kubernetes.io/name=${agentName} --tail=100\n\n`;
    readme += '# Check service\n';
    readme += `kubectl get svc -n ${namespace} ${agentName}-service\n`;
    readme += '```\n\n';

    readme += '## Resource Specifications\n\n';
    const crd = this.generate(manifest, options);
    readme += '### Resource Limits\n\n';
    readme += '```yaml\n';
    readme += `replicas: ${crd.spec.resources?.replicas || 1}\n`;
    readme += 'resources:\n';
    readme += `  requests:\n`;
    readme += `    cpu: ${crd.spec.resources?.requests?.cpu || '100m'}\n`;
    readme += `    memory: ${crd.spec.resources?.requests?.memory || '128Mi'}\n`;
    readme += `  limits:\n`;
    readme += `    cpu: ${crd.spec.resources?.limits?.cpu || '1000m'}\n`;
    readme += `    memory: ${crd.spec.resources?.limits?.memory || '1Gi'}\n`;
    readme += '```\n\n';

    readme += '## Security\n\n';
    readme += '### Pod Security Context\n\n';
    readme += '- **Run as non-root**: Yes\n';
    readme += '- **User ID**: 1000\n';
    readme += '- **Read-only root filesystem**: Yes\n';
    readme += '- **Privilege escalation**: Disabled\n';
    readme += '- **Capabilities**: All dropped\n\n';

    readme += '### RBAC Permissions\n\n';
    readme += 'The agent has minimal permissions:\n\n';
    readme += '- Read-only access to ConfigMaps\n';
    readme += '- Read-only access to Secrets\n';
    readme += '- Manage own agent status\n\n';

    readme += '### Network Policy\n\n';
    readme += '- **Ingress**: Only from gateway pods on port 3000\n';
    readme += '- **Egress**: HTTPS (443) and DNS (53) only\n\n';

    readme += '## Monitoring\n\n';
    readme += '### Prometheus Metrics\n\n';
    readme += '```bash\n';
    readme += '# Port-forward to metrics endpoint\n';
    readme += `kubectl port-forward -n ${namespace} svc/${agentName}-service 9090:9090\n\n`;
    readme += '# Access metrics\n';
    readme += 'curl http://localhost:9090/metrics\n';
    readme += '```\n\n';

    readme += '### Health Checks\n\n';
    readme += '- **Liveness**: GET /health on port 3000\n';
    readme += '- **Readiness**: GET /ready on port 3000\n\n';

    readme += '## Scaling\n\n';
    const hpa = this.generateHPA(manifest, options);
    if (hpa) {
      readme += '### Horizontal Pod Autoscaler\n\n';
      readme += 'HPA is configured for automatic scaling:\n\n';
      readme += '```bash\n';
      readme += `kubectl apply -f ${agentName}-hpa.yaml\n\n`;
      readme += '# Check HPA status\n';
      readme += `kubectl get hpa -n ${namespace} ${agentName}-hpa\n`;
      readme += '```\n\n';
      readme += '- **Min Replicas**: 1\n';
      readme += '- **Max Replicas**: 10\n';
      readme += '- **Target CPU**: 70%\n';
      readme += '- **Target Memory**: 80%\n\n';
    } else {
      readme += '### Manual Scaling\n\n';
      readme += '```bash\n';
      readme += `kubectl scale deployment ${agentName}-deployment -n ${namespace} --replicas=3\n`;
      readme += '```\n\n';
    }

    readme += '## Troubleshooting\n\n';
    readme += '### Pod Fails to Start\n\n';
    readme += '```bash\n';
    readme += '# Check pod events\n';
    readme += `kubectl describe pod -n ${namespace} -l app.kubernetes.io/name=${agentName}\n\n`;
    readme += '# Check logs\n';
    readme += `kubectl logs -n ${namespace} -l app.kubernetes.io/name=${agentName} --previous\n`;
    readme += '```\n\n';

    readme += '### API Key Issues\n\n';
    readme += '```bash\n';
    readme += '# Verify secret exists\n';
    readme += `kubectl get secret ${agentName}-secret -n ${namespace}\n\n`;
    readme += '# Update secret\n';
    readme += `kubectl create secret generic ${agentName}-secret \\\n`;
    readme += `  --from-literal=API_KEY=your-key \\\n`;
    readme += `  -n ${namespace} \\\n`;
    readme += '  --dry-run=client -o yaml | kubectl apply -f -\n';
    readme += '```\n\n';

    readme += '### Network Connectivity Issues\n\n';
    readme += '```bash\n';
    readme += '# Check network policy\n';
    readme += `kubectl get networkpolicy -n ${namespace} ${agentName}-netpol\n\n`;
    readme += '# Test connectivity from pod\n';
    readme += `kubectl exec -n ${namespace} -it <pod-name> -- curl -v https://api.anthropic.com\n`;
    readme += '```\n\n';

    readme += '## Cleanup\n\n';
    readme += '```bash\n';
    readme += '# Delete all resources\n';
    readme += `kubectl delete -f ${agentName}-deployment.yaml\n`;
    readme += `kubectl delete -f ${agentName}-service.yaml\n`;
    readme += `kubectl delete -f ${agentName}-configmap.yaml\n`;
    readme += `kubectl delete -f ${agentName}-secret.yaml\n`;
    readme += `kubectl delete -f ${agentName}-rolebinding.yaml\n`;
    readme += `kubectl delete -f ${agentName}-role.yaml\n`;
    readme += `kubectl delete -f ${agentName}-serviceaccount.yaml\n`;
    readme += `kubectl delete -f ${agentName}-networkpolicy.yaml\n`;
    readme += `kubectl delete -f ${agentName}-crd.yaml\n\n`;
    readme += '# Or delete by label\n';
    readme += `kubectl delete all,secret,configmap,sa,role,rolebinding,networkpolicy -n ${namespace} -l app.kubernetes.io/name=${agentName}\n`;
    readme += '```\n\n';

    readme += '## References\n\n';
    readme += '- [OSSA Specification](https://openstandardagents.org)\n';
    readme += '- [kagent.dev Documentation](https://kagent.dev)\n';
    readme += '- [Kubernetes Documentation](https://kubernetes.io/docs)\n';
    readme +=
      '- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)\n\n';

    readme += '---\n\n';
    readme += `**Generated by**: kagent CRD Generator\n`;
    readme += `**OSSA Version**: 0.4.4\n`;
    readme += `**Generated at**: ${new Date().toISOString()}\n`;

    return readme;
  }

  /**
   * Generate kagent.dev v1alpha2 Declarative Agent (and optional ModelConfig) for POC / native kagent installs
   */
  generateV1Alpha2(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): { agent: KAgentV1Alpha2Agent; modelConfig?: KAgentV1Alpha2ModelConfig } {
    const spec = manifest.spec as Record<string, unknown>;
    const llmConfig = spec.llm as
      | {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
          topP?: number;
        }
      | undefined;
    const agentName = manifest.metadata?.name || 'unknown-agent';
    const namespace = options.namespace || 'kagent';
    const systemMessage =
      (spec.role as string) || manifest.metadata?.description || '';
    const tools = this.extractToolsForV1Alpha2(spec.tools, options);
    const a2aSkills = this.extractA2ASkills(manifest, options);
    const modelConfigName =
      options.modelConfigName || 'default-model-config';
    const extKagent = (manifest.extensions as Record<string, unknown>)?.kagent as
      | Record<string, unknown>
      | undefined;
    const deployment = (extKagent?.kubernetes as Record<string, unknown>)
      ?.resourceLimits as { cpu?: string; memory?: string } | undefined;

    const agent: KAgentV1Alpha2Agent = {
      apiVersion: 'kagent.dev/v1alpha2',
      kind: 'Agent',
      metadata: {
        name: agentName,
        namespace,
        labels: {
          'ossa.ai/version': manifest.metadata?.version || getVersion(),
          'ossa.ai/domain':
            ((spec.taxonomy as Record<string, unknown>)?.domain as string) ||
            'agents',
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/managed-by': 'kagent',
          ...manifest.metadata?.labels,
        },
        annotations: {
          'ossa.ai/generated-by': 'kagent-crd-generator',
          'ossa.ai/generated-at': new Date().toISOString(),
          ...manifest.metadata?.annotations,
        },
      },
      spec: {
        type: 'Declarative',
        description: manifest.metadata?.description,
        declarative: {
          modelConfig: modelConfigName,
          stream: true,
          systemMessage,
          ...(tools && tools.length > 0 && { tools }),
          ...(a2aSkills && a2aSkills.length > 0 && { a2aConfig: { skills: a2aSkills } }),
        },
        deployment: {
          replicas: options.replicas ?? 1,
          ...(deployment || options.resources
            ? {
                resources: {
                  requests: options.resources?.requests ?? {
                    cpu: '100m',
                    memory: '256Mi',
                  },
                  limits:
                    (deployment || options.resources?.limits) ?? {
                      cpu: '500m',
                      memory: '512Mi',
                    },
                },
              }
            : {}),
        },
      },
    };

    let modelConfig: KAgentV1Alpha2ModelConfig | undefined;
    if (options.modelConfigName === undefined && llmConfig) {
      modelConfig = this.buildV1Alpha2ModelConfig(manifest, namespace, agentName);
      agent.spec.declarative.modelConfig = modelConfig.metadata.name;
    }

    return { agent, modelConfig };
  }

  /**
   * Generate complete v1alpha2 bundle in APPLY_ORDER:
   *   1. ModelConfig (if generated)
   *   2. RemoteMCPServer(s) (one per MCP tool server referenced)
   *   3. Agent
   */
  generateV1Alpha2Bundle(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): KAgentV1Alpha2Bundle {
    const { agent, modelConfig } = this.generateV1Alpha2(manifest, options);
    const remoteMCPServers = this.generateRemoteMCPServers(manifest, options);
    return { modelConfig, remoteMCPServers, agent };
  }

  /**
   * Generate RemoteMCPServer CRDs for each MCP tool server referenced in the manifest.
   * These must be applied BEFORE the Agent CRD so the agent can reference them.
   */
  generateRemoteMCPServers(
    manifest: OssaAgent,
    options: KAgentDeploymentOptions = {}
  ): KAgentV1Alpha2RemoteMCPServer[] {
    const spec = manifest.spec as Record<string, unknown>;
    const tools = spec.tools as Array<Record<string, unknown>> | undefined;
    if (!tools || !Array.isArray(tools)) return [];

    const namespace = options.namespace || 'kagent';
    const seen = new Set<string>();
    const servers: KAgentV1Alpha2RemoteMCPServer[] = [];

    for (const tool of tools) {
      if (!tool || typeof tool !== 'object') continue;
      const serverName = (tool.server as string) || (tool.name as string);
      if (!serverName || seen.has(serverName)) continue;
      seen.add(serverName);

      // Determine URL from tool spec or extensions.kagent.mcpServers
      const extKagent = (manifest.extensions as Record<string, unknown>)?.kagent as Record<string, unknown> | undefined;
      const mcpServers = extKagent?.mcpServers as Record<string, Record<string, unknown>> | undefined;
      const serverConfig = mcpServers?.[serverName];
      const url = (serverConfig?.url as string) ||
        (tool.endpoint as string) ||
        `http://${serverName}.${namespace}.svc.cluster.local/sse`;
      const transport = (serverConfig?.transport as 'sse' | 'streamable-http') || 'sse';

      const toolNames = (tool.toolNames as string[]) ?? (tool.capabilities as string[]);

      const server: KAgentV1Alpha2RemoteMCPServer = {
        apiVersion: 'kagent.dev/v1alpha2',
        kind: 'RemoteMCPServer',
        metadata: {
          name: serverName,
          namespace,
          labels: {
            'ossa.ai/agent': manifest.metadata?.name || 'unknown',
            'app.kubernetes.io/managed-by': 'kagent',
          },
        },
        spec: {
          url,
          transport,
          ...(toolNames?.length ? { tools: toolNames } : {}),
        },
      };

      // Add headers from config if present
      const headers = serverConfig?.headers as Array<Record<string, unknown>> | undefined;
      if (headers?.length) {
        server.spec.headers = headers.map((h) => ({
          name: h.name as string,
          ...(h.value ? { value: h.value as string } : {}),
          ...(h.valueFrom ? { valueFrom: h.valueFrom as { type: 'Secret' | 'ConfigMap'; name: string; key: string } } : {}),
        }));
      }

      servers.push(server);
    }

    return servers;
  }

  /**
   * Build v1alpha2 ModelConfig from OSSA spec.llm (optional; use when not relying on default-model-config)
   */
  private buildV1Alpha2ModelConfig(
    manifest: OssaAgent,
    namespace: string,
    agentName: string
  ): KAgentV1Alpha2ModelConfig {
    const spec = manifest.spec as Record<string, unknown>;
    const llm = spec.llm as Record<string, unknown> | undefined;
    const name = `ossa-${agentName}-model`;
    const provider = (llm?.provider as string) || 'openai';
    const model = (llm?.model as string) || 'gpt-4';
    const isAnthropic = provider === 'anthropic';
    return {
      apiVersion: 'kagent.dev/v1alpha2',
      kind: 'ModelConfig',
      metadata: {
        name,
        namespace,
        labels: { 'ossa.ai/agent': agentName },
      },
      spec: {
        model,
        provider: isAnthropic ? 'Anthropic' : 'OpenAI',
        apiKeySecret: isAnthropic ? 'anthropic-api-key' : 'openai-api-key',
        apiKeySecretKey: 'api-key',
        ...(isAnthropic && {
          anthropic: {
            maxTokens: (llm?.maxTokens as number) ?? 4096,
            temperature: (llm?.temperature as number) ?? 0.3,
          },
        }),
        ...(!isAnthropic && {
          openAI: {
            maxTokens: (llm?.maxTokens as number) ?? 4096,
            temperature: (llm?.temperature as number) ?? 0.3,
          },
        }),
      },
    };
  }

  /**
   * Extract tools in kagent v1alpha2 format (McpServer with toolNames, or Agent ref)
   */
  private extractToolsForV1Alpha2(
    tools: unknown,
    options: KAgentDeploymentOptions
  ): KAgentV1Alpha2Agent['spec']['declarative']['tools'] {
    if (!tools || !Array.isArray(tools)) return undefined;
    const out: NonNullable<
      KAgentV1Alpha2Agent['spec']['declarative']['tools']
    > = [];
    for (const t of tools) {
      if (!t || typeof t !== 'object') continue;
      const obj = t as Record<string, unknown>;
      if (obj.agent && typeof obj.agent === 'object') {
        const agentRef = obj.agent as { name: string; namespace?: string };
        out.push({
          type: 'Agent',
          agent: {
            name: agentRef.name,
            ...(agentRef.namespace && { namespace: agentRef.namespace }),
          },
        });
        continue;
      }
      const server = (obj.server as string) || (obj.name as string);
      const toolNames = (obj.toolNames as string[]) ?? (obj.capabilities as string[]);
      if (!server || !toolNames?.length) continue;
      out.push({
        type: 'McpServer',
        mcpServer: {
          name: server,
          kind: 'RemoteMCPServer',
          toolNames,
          ...(obj.namespace ? { namespace: obj.namespace as string } : {}),
        },
      });
    }
    return out.length ? out : undefined;
  }

  /**
   * Extract A2A skills from OSSA manifest (extensions.kagent.a2aConfig.skills or single skill from description)
   */
  private extractA2ASkills(
    manifest: OssaAgent,
    _options: KAgentDeploymentOptions
  ): Array<{
    id: string;
    name: string;
    description: string;
    inputModes?: string[];
    outputModes?: string[];
    tags?: string[];
    examples?: string[];
  }> | undefined {
    const ext = (manifest.extensions as Record<string, unknown>)?.kagent as
      | Record<string, unknown>
      | undefined;
    const a2a = ext?.a2aConfig as Record<string, unknown> | undefined;
    const skills = a2a?.skills as Array<{
      id?: string;
      name?: string;
      description?: string;
      inputModes?: string[];
      outputModes?: string[];
      tags?: string[];
      examples?: string[];
    }> | undefined;
    if (skills?.length) {
      return skills.map((s) => ({
        id: s.id || s.name?.toLowerCase().replace(/\s+/g, '-') || 'skill',
        name: s.name || 'Skill',
        description: s.description || '',
        inputModes: s.inputModes ?? ['text'],
        outputModes: s.outputModes ?? ['text'],
        tags: s.tags ?? [],
        examples: s.examples ?? [],
      })) as KAgentV1Alpha2Agent['spec']['declarative']['a2aConfig'] extends {
        skills: infer S;
      }
        ? S
        : never;
    }
    if (manifest.metadata?.description) {
      return [
        {
          id: `${(manifest.metadata?.name || 'agent').toLowerCase().replace(/\s+/g, '-')}-skill`,
          name: manifest.metadata.name || 'Agent',
          description: manifest.metadata.description,
          inputModes: ['text'],
          outputModes: ['text'],
          tags: ['ossa'],
          examples: [],
        },
      ] as KAgentV1Alpha2Agent['spec']['declarative']['a2aConfig'] extends {
        skills: infer S;
      }
        ? S
        : never;
    }
    return undefined;
  }

  /**
   * Extract tools from OSSA spec
   */
  private extractTools(
    tools: unknown,
    options: KAgentDeploymentOptions = {}
  ): KAgentCRD['spec']['tools'] {
    if (!tools || !Array.isArray(tools)) {
      return undefined;
    }

    return tools
      .map((tool) => {
        if (typeof tool === 'string') {
          return {
            type: 'mcp',
            name: tool,
            server: tool,
            ...(options.tls && {
              tlsConfig: {
                enabled: options.tls.enabled,
                secretName: options.tls.secretName,
                verifyServer: options.tls.verifyServer !== false,
              },
            }),
            ...(options.headerPropagation && {
              headerPropagation: options.headerPropagation,
            }),
          };
        }

        if (tool && typeof tool === 'object') {
          const toolObj = tool as Record<string, unknown>;
          return {
            type: (toolObj.type as string) || 'mcp',
            name: toolObj.name as string,
            description: toolObj.description as string,
            risk_level: toolObj.risk_level as string,
            server: toolObj.server as string,
            namespace: toolObj.namespace as string,
            endpoint: toolObj.endpoint as string,
            ...(options.tls && {
              tlsConfig: {
                enabled: options.tls.enabled,
                secretName: options.tls.secretName,
                verifyServer: options.tls.verifyServer !== false,
              },
            }),
            ...(options.headerPropagation && {
              headerPropagation: options.headerPropagation,
            }),
          };
        }

        return null;
      })
      .filter((tool): tool is NonNullable<typeof tool> => tool !== null);
  }

  /**
   * Extract governance configuration from OSSA v0.4.4 spec
   */
  private extractGovernance(
    governance: unknown
  ): Record<string, unknown> | undefined {
    if (!governance || typeof governance !== 'object') {
      return undefined;
    }

    const gov = governance as Record<string, unknown>;
    return {
      authorization: gov.authorization,
      quality_requirements: gov.quality_requirements,
      compliance: gov.compliance,
    };
  }

  /**
   * Extract workflow configuration
   */
  private extractWorkflow(
    workflow: unknown
  ): Record<string, unknown> | undefined {
    if (!workflow || typeof workflow !== 'object') {
      return undefined;
    }

    return workflow as Record<string, unknown>;
  }

  /**
   * Extract monitoring configuration
   */
  private extractMonitoring(
    monitoring: unknown
  ): Record<string, unknown> | undefined {
    if (!monitoring || typeof monitoring !== 'object') {
      return undefined;
    }

    return monitoring as Record<string, unknown>;
  }

  /**
   * Get default replicas based on spec
   */
  private getDefaultReplicas(spec: Record<string, unknown>): number {
    const scalability = (spec.agentArchitecture as any)?.runtime?.scalability;
    return scalability === 'horizontal' ? 3 : 1;
  }

  /**
   * Determine if A2A should be enabled
   */
  private shouldEnableA2A(manifest: OssaAgent): boolean {
    const spec = manifest.spec as Record<string, unknown>;
    const a2a = spec.a2a as Record<string, unknown> | undefined;
    const messaging = spec.messaging as Record<string, unknown> | undefined;
    return (
      (a2a !== undefined && Object.keys(a2a).length > 0) ||
      (messaging !== undefined && Object.keys(messaging).length > 0)
    );
  }

  /**
   * Get default RBAC rules for agent
   */
  private getDefaultRBACRules(): Array<{
    apiGroups: string[];
    resources: string[];
    verbs: string[];
  }> {
    return [
      {
        apiGroups: ['kagent.dev'],
        resources: ['agents', 'agents/status'],
        verbs: ['get', 'list', 'watch', 'update', 'patch'],
      },
      {
        apiGroups: [''],
        resources: ['secrets'],
        verbs: ['get', 'list'],
      },
      {
        apiGroups: [''],
        resources: ['configmaps'],
        verbs: ['get', 'list', 'watch'],
      },
      {
        apiGroups: [''],
        resources: ['pods'],
        verbs: ['get', 'list'],
      },
      {
        apiGroups: [''],
        resources: ['events'],
        verbs: ['create', 'patch'],
      },
    ];
  }
}
