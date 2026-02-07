/**
 * KAGENT CRD Generator
 *
 * Generate Kubernetes Custom Resource Definitions for KAGENT agents
 * with agent taxonomy labels and optimizations
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * KAGENT CRD (Custom Resource Definition)
 */
export interface KagentCRD {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  spec: {
    agentType: string;
    agentKind: string;
    pattern: string;
    image: string;
    replicas: number;
    resources: {
      limits: { cpu: string; memory: string };
      requests: { cpu: string; memory: string };
    };
    env: Array<{ name: string; value?: string; valueFrom?: any }>;
    transport?: {
      protocol: string;
      port: number;
    };
    monitoring?: {
      enabled: boolean;
      port: number;
    };
  };
}

/**
 * Generate KAGENT CRD from OSSA manifest
 */
export function generateKagentCRD(manifest: OssaAgent): KagentCRD {
  const name = manifest.metadata?.name || 'agent';
  const agentType = manifest.metadata?.agentType || 'kagent';
  const agentKind = manifest.metadata?.agentKind || 'worker';
  const pattern = manifest.metadata?.agentArchitecture?.pattern || 'single';
  const scalability = manifest.metadata?.agentArchitecture?.runtime?.scalability;
  const executionModel =
    manifest.metadata?.agentArchitecture?.runtime?.executionModel;

  // Determine replicas based on scalability
  const replicas = scalability === 'horizontal' ? 3 : 1;

  // Determine resources based on agentKind
  const resources = getResourceLimits(agentKind, executionModel);

  // Generate labels
  const labels = {
    'agent.ossa.dev/type': agentType,
    'agent.ossa.dev/kind': agentKind,
    'agent.ossa.dev/pattern': pattern,
    'agent.ossa.dev/version': manifest.metadata?.version || '1.0.0',
    'app.kubernetes.io/name': name,
    'app.kubernetes.io/managed-by': 'ossa',
  };

  // Generate annotations
  const annotations = {
    'ossa.dev/manifest': JSON.stringify(manifest),
    'ossa.dev/generated-by': 'ossa-v0.4.4',
    'ossa.dev/timestamp': new Date().toISOString(),
  };

  // Transport configuration
  const transport = (manifest.spec as any)?.transport;
  const transportConfig = transport
    ? {
        protocol: transport.protocol || 'grpc',
        port: transport.port || 50051,
      }
    : undefined;

  // Monitoring
  const monitoring = (manifest.spec as any)?.monitoring
    ? {
        enabled: true,
        port: 9090,
      }
    : undefined;

  const crd: KagentCRD = {
    apiVersion: 'agents.ossa.dev/v1beta1',
    kind: 'Agent',
    metadata: {
      name,
      namespace: 'agent-platform',
      labels,
      annotations,
    },
    spec: {
      agentType,
      agentKind,
      pattern,
      image: `ghcr.io/your-org/${name}:latest`, // Placeholder
      replicas,
      resources,
      env: [
        { name: 'AGENT_NAME', value: name },
        { name: 'AGENT_TYPE', value: agentType },
        { name: 'AGENT_KIND', value: agentKind },
      ],
      transport: transportConfig,
      monitoring,
    },
  };

  return crd;
}

/**
 * Get resource limits based on agent kind and execution model
 */
function getResourceLimits(
  agentKind: string,
  executionModel?: string
): KagentCRD['spec']['resources'] {
  // Base resources
  const resources = {
    requests: { cpu: '100m', memory: '128Mi' },
    limits: { cpu: '500m', memory: '512Mi' },
  };

  // Orchestrators need more resources
  if (agentKind === 'orchestrator' || agentKind === 'supervisor') {
    resources.requests = { cpu: '200m', memory: '256Mi' };
    resources.limits = { cpu: '1000m', memory: '1Gi' };
  }

  // Real-time agents need guaranteed CPU
  if (executionModel === 'realtime') {
    resources.requests = { cpu: '500m', memory: '256Mi' };
    resources.limits = { cpu: '1000m', memory: '512Mi' };
  }

  // Batch agents can have lower limits
  if (executionModel === 'batch') {
    resources.requests = { cpu: '50m', memory: '64Mi' };
    resources.limits = { cpu: '200m', memory: '256Mi' };
  }

  return resources;
}

/**
 * Generate Kubernetes Service for agent
 */
export function generateKubernetesService(manifest: OssaAgent): string {
  const name = manifest.metadata?.name || 'agent';
  const transport = (manifest.spec as any)?.transport;
  const port = transport?.port || 50051;
  const protocol = transport?.protocol || 'grpc';

  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: `${name}-service`,
      namespace: 'agent-platform',
      labels: {
        'agent.ossa.dev/name': name,
        'app.kubernetes.io/name': name,
      },
    },
    spec: {
      selector: {
        'app.kubernetes.io/name': name,
      },
      ports: [
        {
          name: protocol,
          port,
          targetPort: port,
          protocol: 'TCP',
        },
      ],
      type: 'ClusterIP',
    },
  };

  return JSON.stringify(service, null, 2);
}

/**
 * Generate Kubernetes Deployment
 */
export function generateKubernetesDeployment(
  manifest: OssaAgent,
  crd: KagentCRD
): string {
  const name = manifest.metadata?.name || 'agent';

  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: `${name}-deployment`,
      namespace: 'agent-platform',
      labels: crd.metadata.labels,
    },
    spec: {
      replicas: crd.spec.replicas,
      selector: {
        matchLabels: {
          'app.kubernetes.io/name': name,
        },
      },
      template: {
        metadata: {
          labels: crd.metadata.labels,
        },
        spec: {
          containers: [
            {
              name,
              image: crd.spec.image,
              ports: crd.spec.transport
                ? [{ containerPort: crd.spec.transport.port }]
                : [],
              env: crd.spec.env,
              resources: crd.spec.resources,
            },
          ],
        },
      },
    },
  };

  return JSON.stringify(deployment, null, 2);
}

/**
 * Generate complete Kubernetes manifests
 */
export function generateKubernetesManifests(manifest: OssaAgent): {
  crd: string;
  service: string;
  deployment: string;
  readme: string;
} {
  const crd = generateKagentCRD(manifest);
  const service = generateKubernetesService(manifest);
  const deployment = generateKubernetesDeployment(manifest, crd);
  const readme = generateKubernetesReadme(manifest, crd);

  return {
    crd: JSON.stringify(crd, null, 2),
    service,
    deployment,
    readme,
  };
}

/**
 * Generate README for Kubernetes deployment
 */
function generateKubernetesReadme(
  manifest: OssaAgent,
  crd: KagentCRD
): string {
  const name = manifest.metadata?.name || 'agent';

  let readme = `# ${name} - Kubernetes Deployment\n\n`;
  readme += `Generated KAGENT CRD with agent taxonomy.\n\n`;

  readme += '## Agent Information\n\n';
  readme += `- **Type**: ${crd.spec.agentType}\n`;
  readme += `- **Kind**: ${crd.spec.agentKind}\n`;
  readme += `- **Pattern**: ${crd.spec.pattern}\n`;
  readme += `- **Replicas**: ${crd.spec.replicas}\n\n`;

  readme += '## Deployment\n\n';
  readme += '```bash\n';
  readme += '# Apply CRD\n';
  readme += 'kubectl apply -f agent-crd.yaml\n\n';
  readme += '# Apply Service\n';
  readme += 'kubectl apply -f agent-service.yaml\n\n';
  readme += '# Apply Deployment\n';
  readme += 'kubectl apply -f agent-deployment.yaml\n\n';
  readme += '# Verify\n';
  readme += `kubectl get pods -n agent-platform -l app.kubernetes.io/name=${name}\n`;
  readme += '```\n\n';

  readme += '## Resources\n\n';
  readme += `- **CPU Request**: ${crd.spec.resources.requests.cpu}\n`;
  readme += `- **CPU Limit**: ${crd.spec.resources.limits.cpu}\n`;
  readme += `- **Memory Request**: ${crd.spec.resources.requests.memory}\n`;
  readme += `- **Memory Limit**: ${crd.spec.resources.limits.memory}\n\n`;

  if (crd.spec.transport) {
    readme += '## Transport\n\n';
    readme += `- **Protocol**: ${crd.spec.transport.protocol}\n`;
    readme += `- **Port**: ${crd.spec.transport.port}\n\n`;
  }

  readme += '## Labels\n\n';
  readme += 'Agent taxonomy labels for discovery:\n\n';
  for (const [key, value] of Object.entries(crd.metadata.labels)) {
    readme += `- \`${key}\`: ${value}\n`;
  }

  return readme;
}
