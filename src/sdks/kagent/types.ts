/**
 * kagent.dev SDK Types
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * kagent.dev CRD structure
 */
export interface KAgentCRD {
  apiVersion: 'kagent.dev/v1alpha1';
  kind: 'Agent';
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    systemMessage: string;
    modelConfig: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      secretRef?: string; // Reference to K8s secret with API keys
    };
    tools?: Array<{
      type: string;
      name?: string;
      description?: string;
      risk_level?: string;
      server?: string;
      namespace?: string;
      endpoint?: string;
      tlsConfig?: {
        enabled: boolean;
        secretName?: string;
        verifyServer?: boolean;
      };
      headerPropagation?: string[]; // Headers to propagate
    }>;
    skills?: Array<{
      name: string;
      image: string;
      port?: number;
      environment?: Record<string, string>;
    }>;
    governance?: {
      authorization?: Record<string, unknown>;
      quality_requirements?: Record<string, unknown>;
      compliance?: Record<string, unknown>;
    };
    workflow?: Record<string, unknown>;
    monitoring?: Record<string, unknown>;
    enableA2A?: boolean;
    a2aProtocol?: {
      enabled: boolean;
      endpoint?: string;
      timeout?: number;
      retries?: number;
    };
    codeExecution?: {
      enabled: boolean;
      sandboxed?: boolean;
      allowedLanguages?: string[];
    };
    resources?: {
      replicas?: number;
      limits?: {
        cpu?: string;
        memory?: string;
      };
      requests?: {
        cpu?: string;
        memory?: string;
      };
    };
    securityContext?: {
      runAsNonRoot?: boolean;
      runAsUser?: number;
      fsGroup?: number;
      readOnlyRootFilesystem?: boolean;
      allowPrivilegeEscalation?: boolean;
      capabilities?: {
        drop?: string[];
      };
    };
    serviceAccountName?: string; // For RBAC
    rbac?: {
      enabled: boolean;
      rules?: Array<{
        apiGroups: string[];
        resources: string[];
        verbs: string[];
      }>;
    };
    byoAgent?: {
      enabled: boolean;
      image?: string;
      command?: string[];
      args?: string[];
    };
  };
}

/**
 * Complete Kubernetes manifest bundle
 */
export interface KubernetesManifestBundle {
  crd: KAgentCRD;
  deployment: Record<string, unknown>;
  service: Record<string, unknown>;
  configMap: Record<string, unknown>;
  secret: Record<string, unknown>;
  serviceAccount: Record<string, unknown>;
  role: Record<string, unknown>;
  roleBinding: Record<string, unknown>;
  horizontalPodAutoscaler: Record<string, unknown> | null;
  networkPolicy: Record<string, unknown>;
  readme: string;
}

/**
 * kagent.dev v1alpha2 Declarative Agent (native kagent CRD shape)
 */
export interface KAgentV1Alpha2Agent {
  apiVersion: 'kagent.dev/v1alpha2';
  kind: 'Agent';
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    type: 'Declarative';
    description?: string;
    declarative: {
      modelConfig: string;
      stream?: boolean;
      systemMessage: string;
      systemMessageFrom?: { type: 'ConfigMap' | 'Secret'; name: string; key: string };
      tools?: (
        | {
            type: 'McpServer';
            mcpServer: {
              name: string;
              namespace?: string;
              kind: 'RemoteMCPServer';
              toolNames: string[];
            };
            headersFrom?: Array<{
              name: string;
              valueFrom: { type: 'Secret' | 'ConfigMap'; name: string; key: string };
            }>;
          }
        | { type: 'Agent'; agent: { name: string; namespace?: string } }
      )[];
      a2aConfig?: {
        skills?: Array<{
          id: string;
          name: string;
          description: string;
          inputModes?: string[];
          outputModes?: string[];
          tags?: string[];
          examples?: string[];
        }>;
      };
    };
    deployment?: {
      replicas?: number;
      resources?: {
        requests?: { cpu?: string; memory?: string };
        limits?: { cpu?: string; memory?: string };
      };
    };
    skills?: {
      insecureSkipVerify?: boolean;
      refs?: string[];
    };
  };
}

/**
 * kagent.dev v1alpha2 ModelConfig
 */
export interface KAgentV1Alpha2ModelConfig {
  apiVersion: 'kagent.dev/v1alpha2';
  kind: 'ModelConfig';
  metadata: { name: string; namespace?: string; labels?: Record<string, string> };
  spec: {
    model: string;
    provider: string;
    apiKeySecret?: string;
    apiKeySecretKey?: string;
    openAI?: { maxTokens?: number; temperature?: number };
    anthropic?: { maxTokens?: number; temperature?: number };
  };
}

/**
 * kagent.dev v1alpha2 RemoteMCPServer CRD
 */
export interface KAgentV1Alpha2RemoteMCPServer {
  apiVersion: 'kagent.dev/v1alpha2';
  kind: 'RemoteMCPServer';
  metadata: { name: string; namespace?: string; labels?: Record<string, string> };
  spec: {
    url: string;
    transport?: 'sse' | 'streamable-http';
    tools?: string[];
    headers?: Array<{
      name: string;
      value?: string;
      valueFrom?: { type: 'Secret' | 'ConfigMap'; name: string; key: string };
    }>;
  };
}

/**
 * Ordered apply sequence for kagent CRDs.
 * Dependencies must be applied before dependents.
 */
export const KAGENT_APPLY_ORDER = [
  'ModelConfig',
  'RemoteMCPServer',
  'Agent',
] as const;

/**
 * Complete v1alpha2 export bundle with all CRDs
 */
export interface KAgentV1Alpha2Bundle {
  modelConfig?: KAgentV1Alpha2ModelConfig;
  remoteMCPServers: KAgentV1Alpha2RemoteMCPServer[];
  agent: KAgentV1Alpha2Agent;
}

/**
 * Deployment options for kagent
 */
export interface KAgentDeploymentOptions {
  namespace?: string;
  replicas?: number;
  crdVersion?: 'v1alpha1' | 'v1alpha2';
  /** For v1alpha2: name of ModelConfig to reference (e.g. default-model-config) */
  modelConfigName?: string;
  resources?: {
    limits?: {
      cpu?: string;
      memory?: string;
    };
    requests?: {
      cpu?: string;
      memory?: string;
    };
  };
  securityContext?: {
    runAsNonRoot?: boolean;
    runAsUser?: number;
    fsGroup?: number;
  };

  // TLS configuration
  tls?: {
    enabled: boolean;
    secretName?: string;
    verifyServer?: boolean;
  };

  // RBAC configuration
  rbac?: {
    enabled: boolean;
    serviceAccountName?: string;
    createServiceAccount?: boolean;
    rules?: Array<{
      apiGroups: string[];
      resources: string[];
      verbs: string[];
    }>;
  };

  // Skills configuration
  skills?: Array<{
    name: string;
    image: string;
    port?: number;
    environment?: Record<string, string>;
  }>;

  // A2A protocol
  a2a?: {
    enabled: boolean;
    endpoint?: string;
    timeout?: number;
    retries?: number;
  };

  // Code execution
  codeExecution?: {
    enabled: boolean;
    sandboxed?: boolean;
    allowedLanguages?: string[];
  };

  // BYO Agent
  byoAgent?: {
    enabled: boolean;
    image?: string;
    command?: string[];
    args?: string[];
  };

  // Header propagation
  headerPropagation?: string[];

  // API key secret
  apiKeySecret?: string;
}

/**
 * Deployment result
 */
export interface KAgentDeploymentResult {
  success: boolean;
  agentId?: string;
  namespace?: string;
  crd?: KAgentCRD;
  error?: string;
}

/**
 * Validation result
 */
export interface KAgentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
