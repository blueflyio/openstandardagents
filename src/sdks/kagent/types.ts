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
 * Deployment options for kagent
 */
export interface KAgentDeploymentOptions {
  namespace?: string;
  replicas?: number;
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
