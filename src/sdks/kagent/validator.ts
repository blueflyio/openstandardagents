/**
 * kagent.dev Validator
 * Validates OSSA manifests against kagent.dev requirements
 */

import type { OssaAgent } from '../../types/index.js';
import type { KAgentValidationResult } from './types.js';

export class KAgentValidator {
  /**
   * Validate OSSA manifest for kagent.dev deployment
   */
  validate(manifest: OssaAgent): KAgentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!manifest.metadata?.name) {
      errors.push('Agent name is required');
    }

    if (!manifest.spec?.role) {
      errors.push('Agent role (system message) is required');
    }

    // Check LLM configuration
    const spec = manifest.spec as Record<string, unknown>;
    const llm = spec.llm as
      | {
          provider?: string;
          model?: string;
        }
      | undefined;

    if (!llm) {
      errors.push('LLM configuration is required');
    } else {
      if (!llm.provider) {
        errors.push('LLM provider is required');
      }
      if (!llm.model) {
        errors.push('LLM model is required');
      }
    }

    // Check Kubernetes compatibility
    const name = manifest.metadata?.name || '';
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
      errors.push(
        'Agent name must be a valid Kubernetes resource name (lowercase alphanumeric and hyphens)'
      );
    }

    // Check resource limits if specified
    const deployment = spec.deployment as Record<string, unknown> | undefined;
    const resources = deployment?.resources as
      | {
          limits?: { cpu?: string; memory?: string };
          requests?: { cpu?: string; memory?: string };
        }
      | undefined;

    if (resources?.limits) {
      if (
        resources.limits.cpu &&
        !this.isValidK8sResource(resources.limits.cpu)
      ) {
        errors.push(`Invalid CPU limit format: ${resources.limits.cpu}`);
      }
      if (
        resources.limits.memory &&
        !this.isValidK8sResource(resources.limits.memory)
      ) {
        errors.push(`Invalid memory limit format: ${resources.limits.memory}`);
      }
    }

    // Warnings
    if (!resources?.limits) {
      warnings.push(
        'No resource limits specified - consider setting limits for production'
      );
    }

    const security = spec.security as Record<string, unknown> | undefined;
    if (!security) {
      warnings.push(
        'No security context specified - consider setting security context'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate Kubernetes resource format
   */
  private isValidK8sResource(value: string): boolean {
    // Basic validation for CPU (e.g., "100m", "1", "2.5") and memory (e.g., "128Mi", "1Gi")
    return /^\d+(\.\d+)?(m|Mi|Gi|G|M|Ki|K)?$/.test(value);
  }
}
