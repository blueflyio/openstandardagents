/**
 * Kubernetes Adapter Types
 */

export interface KubernetesConfig {
  namespace?: string;
  replicas?: number;
  serviceAccount?: string;
  imagePullSecrets?: string[];
  nodeSelector?: Record<string, string>;
  tolerations?: Array<{
    key: string;
    operator: string;
    value?: string;
    effect: string;
  }>;
}
