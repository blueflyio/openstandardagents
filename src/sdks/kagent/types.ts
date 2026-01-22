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
    };
    tools?: Array<{
      type: string;
      name?: string;
      server?: string;
      namespace?: string;
      endpoint?: string;
    }>;
    enableA2A?: boolean;
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
