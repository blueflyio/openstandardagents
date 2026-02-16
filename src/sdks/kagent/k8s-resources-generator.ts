/**
 * Kubernetes Resources Generator for KAgent
 *
 * Generates supporting K8s resources:
 * - ServiceAccount
 * - Role/ClusterRole
 * - RoleBinding/ClusterRoleBinding
 * - Secrets (for TLS)
 * - NetworkPolicy
 *
 * SOLID: Single Responsibility - K8s resource generation
 */

import type { KAgentCRD, KAgentDeploymentOptions } from './types.js';

/**
 * K8s manifest types
 */
export interface K8sManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  [key: string]: any;
}

/**
 * Kubernetes Resources Generator
 */
export class K8sResourcesGenerator {
  /**
   * Generate ServiceAccount for agent
   */
  generateServiceAccount(
    agentName: string,
    namespace: string = 'default',
    options: KAgentDeploymentOptions = {}
  ): K8sManifest {
    return {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: options.rbac?.serviceAccountName || `${agentName}-sa`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'agent',
          'ossa.ai/managed': 'true',
        },
        annotations: {
          'ossa.ai/agent': agentName,
        },
      },
    };
  }

  /**
   * Generate Role for agent RBAC
   */
  generateRole(
    agentName: string,
    namespace: string = 'default',
    options: KAgentDeploymentOptions = {}
  ): K8sManifest {
    const rules = options.rbac?.rules || [
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
    ];

    return {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {
        name: `${agentName}-role`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'rbac',
          'ossa.ai/managed': 'true',
        },
      },
      rules,
    };
  }

  /**
   * Generate RoleBinding for agent
   */
  generateRoleBinding(
    agentName: string,
    namespace: string = 'default',
    options: KAgentDeploymentOptions = {}
  ): K8sManifest {
    const serviceAccountName =
      options.rbac?.serviceAccountName || `${agentName}-sa`;

    return {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: `${agentName}-rolebinding`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'rbac',
          'ossa.ai/managed': 'true',
        },
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: serviceAccountName,
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
   * Generate TLS Secret template
   */
  generateTLSSecret(
    agentName: string,
    namespace: string = 'default',
    options: KAgentDeploymentOptions = {}
  ): K8sManifest {
    return {
      apiVersion: 'v1',
      kind: 'Secret',
      type: 'kubernetes.io/tls',
      metadata: {
        name: options.tls?.secretName || `${agentName}-tls`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'tls',
          'ossa.ai/managed': 'true',
        },
        annotations: {
          'ossa.ai/agent': agentName,
          'ossa.ai/note':
            'Replace tls.crt and tls.key with actual TLS certificate and key',
        },
      },
      data: {
        'tls.crt': '<base64-encoded-certificate>',
        'tls.key': '<base64-encoded-private-key>',
      },
    };
  }

  /**
   * Generate API Key Secret template
   */
  generateAPIKeySecret(
    agentName: string,
    namespace: string = 'default',
    provider: string = 'openai'
  ): K8sManifest {
    const keyName =
      provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';

    return {
      apiVersion: 'v1',
      kind: 'Secret',
      type: 'Opaque',
      metadata: {
        name: `${agentName}-api-key`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'credentials',
          'ossa.ai/managed': 'true',
        },
        annotations: {
          'ossa.ai/agent': agentName,
          'ossa.ai/note': `Replace ${keyName} with actual API key (base64-encoded)`,
        },
      },
      data: {
        [keyName]: '<base64-encoded-api-key>',
      },
    };
  }

  /**
   * Generate NetworkPolicy for agent
   */
  generateNetworkPolicy(
    agentName: string,
    namespace: string = 'default',
    options: KAgentDeploymentOptions = {}
  ): K8sManifest {
    return {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: `${agentName}-netpol`,
        namespace,
        labels: {
          'app.kubernetes.io/name': agentName,
          'app.kubernetes.io/component': 'network',
          'ossa.ai/managed': 'true',
        },
      },
      spec: {
        podSelector: {
          matchLabels: {
            'app.kubernetes.io/name': agentName,
          },
        },
        policyTypes: ['Ingress', 'Egress'],
        ingress: [
          {
            from: [
              {
                podSelector: {
                  matchLabels: {
                    'ossa.ai/agent-access': 'allowed',
                  },
                },
              },
            ],
            ports: [
              {
                protocol: 'TCP',
                port: 8080,
              },
            ],
          },
        ],
        egress: [
          {
            // Allow DNS
            to: [
              {
                namespaceSelector: {
                  matchLabels: {
                    'kubernetes.io/metadata.name': 'kube-system',
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
          {
            // Allow HTTPS to LLM APIs
            to: [{}], // All destinations
            ports: [
              {
                protocol: 'TCP',
                port: 443,
              },
            ],
          },
        ],
      },
    };
  }

  /**
   * Generate all K8s resources for agent
   */
  generateAll(
    crd: KAgentCRD,
    options: KAgentDeploymentOptions = {}
  ): {
    crd: KAgentCRD;
    serviceAccount?: K8sManifest;
    role?: K8sManifest;
    roleBinding?: K8sManifest;
    tlsSecret?: K8sManifest;
    apiKeySecret?: K8sManifest;
    networkPolicy?: K8sManifest;
  } {
    const agentName = crd.metadata.name;
    const namespace = crd.metadata.namespace || 'default';
    const resources: any = { crd };

    // RBAC resources
    if (options.rbac?.enabled) {
      resources.serviceAccount = this.generateServiceAccount(
        agentName,
        namespace,
        options
      );
      resources.role = this.generateRole(agentName, namespace, options);
      resources.roleBinding = this.generateRoleBinding(
        agentName,
        namespace,
        options
      );
    }

    // TLS Secret
    if (options.tls?.enabled) {
      resources.tlsSecret = this.generateTLSSecret(
        agentName,
        namespace,
        options
      );
    }

    // API Key Secret
    if (options.apiKeySecret) {
      const provider = crd.spec.modelConfig.provider;
      resources.apiKeySecret = this.generateAPIKeySecret(
        agentName,
        namespace,
        provider
      );
    }

    // Network Policy
    if (options.namespace && namespace !== 'default') {
      resources.networkPolicy = this.generateNetworkPolicy(
        agentName,
        namespace,
        options
      );
    }

    return resources;
  }

  /**
   * Generate YAML for all resources
   */
  generateYAML(crd: KAgentCRD, options: KAgentDeploymentOptions = {}): string {
    const resources = this.generateAll(crd, options);
    const yamls: string[] = [];

    // Add header
    yamls.push('# Generated KAgent Kubernetes Manifests');
    yamls.push('# OSSA Agent: ' + crd.metadata.name);
    yamls.push('# Generated: ' + new Date().toISOString());
    yamls.push('');
    yamls.push('---');

    // Convert each resource to YAML (simplified - in production use js-yaml)
    for (const [name, resource] of Object.entries(resources)) {
      if (resource) {
        yamls.push('');
        yamls.push(`# ${name}`);
        yamls.push(JSON.stringify(resource, null, 2));
        yamls.push('---');
      }
    }

    return yamls.join('\n');
  }
}
