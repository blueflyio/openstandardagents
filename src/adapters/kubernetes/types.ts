/**
 * Kubernetes Adapter Types
 */

export interface KubernetesConfig {
  namespace?: string;
  replicas?: number;
  serviceAccount?: string;
  imagePullSecrets?: string[];
  imageRegistry?: string;
  nodeSelector?: Record<string, string>;
  tolerations?: Array<{
    key: string;
    operator: string;
    value?: string;
    effect: string;
  }>;
}

export interface KustomizeStructure {
  base: {
    deployment: Record<string, unknown>;
    service: Record<string, unknown>;
    configMap: Record<string, unknown>;
    secret: Record<string, unknown>;
    kustomization: Record<string, unknown>;
  };
  rbac: {
    serviceAccount: Record<string, unknown>;
    role: Record<string, unknown>;
    roleBinding: Record<string, unknown>;
    kustomization: Record<string, unknown>;
  };
  overlays: {
    dev: {
      kustomization: Record<string, unknown>;
      patches: string;
    };
    staging: {
      kustomization: Record<string, unknown>;
      patches: string;
    };
    production: {
      kustomization: Record<string, unknown>;
      patches: string;
      hpa: Record<string, unknown>;
      networkPolicy: Record<string, unknown>;
    };
  };
  monitoring: {
    serviceMonitor: Record<string, unknown>;
    grafanaDashboard: Record<string, unknown>;
    kustomization: Record<string, unknown>;
  };
  examples: {
    deployment: string;
    customization: string;
  };
  docs: {
    readme: string;
    deployment: string;
  };
}
