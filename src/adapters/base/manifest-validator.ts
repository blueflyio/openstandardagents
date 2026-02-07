/**
 * Shared Manifest Validator
 *
 * Centralized validation logic for OSSA manifests, extracted from
 * duplicated validation code across all adapters.
 *
 * SOLID: Single Responsibility - Manifest validation only
 * DRY: Single source of truth for validation rules
 */

import type { OssaAgent } from '../../types/index.js';
import type { ValidationError, ValidationWarning } from './adapter.interface.js';

/**
 * Validation result from shared validator
 */
export interface ManifestValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validate core OSSA manifest fields required by all adapters.
 *
 * Checks metadata.name, metadata.version, spec.role, and
 * basic structural integrity.
 *
 * @param manifest - OSSA agent manifest
 * @returns Validation result with errors and warnings
 */
export function validate(manifest: OssaAgent): ManifestValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!manifest) {
    errors.push({
      message: 'Manifest is required',
      code: 'MISSING_MANIFEST',
    });
    return { valid: false, errors, warnings };
  }

  // Required fields
  if (!manifest.metadata?.name) {
    errors.push({
      message: 'metadata.name is required',
      path: 'metadata.name',
      code: 'MISSING_REQUIRED_FIELD',
    });
  }

  if (!manifest.metadata?.version) {
    errors.push({
      message: 'metadata.version is required',
      path: 'metadata.version',
      code: 'MISSING_REQUIRED_FIELD',
    });
  }

  // Recommended fields
  if (!manifest.spec?.role) {
    warnings.push({
      message: 'spec.role is recommended for better agent behavior',
      path: 'spec.role',
      suggestion: 'Add a system prompt describing the agent role',
    });
  }

  if (!manifest.metadata?.description) {
    warnings.push({
      message: 'metadata.description is recommended',
      path: 'metadata.description',
      suggestion: 'Add a description for better discoverability',
    });
  }

  if (!manifest.metadata?.license) {
    warnings.push({
      message: 'metadata.license is recommended',
      path: 'metadata.license',
      suggestion: 'Add a license (e.g., "MIT", "Apache-2.0")',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate workflow steps in a manifest.
 *
 * @param workflow - Workflow configuration from manifest.spec.workflow
 * @returns Validation result
 */
export function validateWorkflow(
  workflow: OssaAgent['spec'] extends { workflow?: infer W } ? W : unknown
): ManifestValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!workflow) {
    return { valid: true, errors, warnings };
  }

  const wf = workflow as Record<string, unknown>;

  if (wf.steps && Array.isArray(wf.steps)) {
    if (wf.steps.length === 0) {
      warnings.push({
        message: 'Workflow has no steps defined',
        path: 'spec.workflow.steps',
        suggestion: 'Add at least one workflow step',
      });
    }

    for (let i = 0; i < wf.steps.length; i++) {
      const step = wf.steps[i] as Record<string, unknown> | undefined;
      if (!step) {
        errors.push({
          message: `Workflow step at index ${i} is empty`,
          path: `spec.workflow.steps[${i}]`,
          code: 'INVALID_WORKFLOW_STEP',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate LLM configuration.
 *
 * @param llm - LLM config from manifest.spec.llm
 * @param supportedProviders - Optional list of supported providers for this platform
 * @returns Validation result
 */
export function validateLLM(
  llm: OssaAgent['spec'] extends { llm?: infer L } ? L : unknown,
  supportedProviders?: string[]
): ManifestValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!llm) {
    warnings.push({
      message: 'No LLM configuration found, adapter will use defaults',
      path: 'spec.llm',
      suggestion: 'Add spec.llm configuration for explicit control',
    });
    return { valid: true, errors, warnings };
  }

  const llmConfig = llm as Record<string, unknown>;

  if (!llmConfig.provider) {
    warnings.push({
      message: 'LLM provider not specified, will use default',
      path: 'spec.llm.provider',
      suggestion: 'Add spec.llm.provider field',
    });
  }

  if (!llmConfig.model) {
    warnings.push({
      message: 'LLM model not specified, will use default',
      path: 'spec.llm.model',
      suggestion: 'Add spec.llm.model field',
    });
  }

  // Check supported providers if provided
  if (
    supportedProviders &&
    llmConfig.provider &&
    typeof llmConfig.provider === 'string' &&
    !supportedProviders.includes(llmConfig.provider)
  ) {
    warnings.push({
      message: `LLM provider '${llmConfig.provider}' may not be supported. Supported: ${supportedProviders.join(', ')}`,
      path: 'spec.llm.provider',
      suggestion: `Use one of: ${supportedProviders.join(', ')}`,
    });
  }

  // Validate temperature range
  if (
    llmConfig.temperature !== undefined &&
    typeof llmConfig.temperature === 'number'
  ) {
    if (llmConfig.temperature < 0 || llmConfig.temperature > 2) {
      warnings.push({
        message: `Temperature ${llmConfig.temperature} is outside typical range [0, 2]`,
        path: 'spec.llm.temperature',
        suggestion: 'Use a value between 0 and 2',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate tool definitions.
 *
 * @param tools - Tool array from manifest.spec.tools
 * @returns Validation result
 */
export function validateTools(
  tools: OssaAgent['spec'] extends { tools?: infer T } ? T : unknown
): ManifestValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!tools) {
    return { valid: true, errors, warnings };
  }

  if (!Array.isArray(tools)) {
    errors.push({
      message: 'spec.tools must be an array',
      path: 'spec.tools',
      code: 'INVALID_TOOLS_FORMAT',
    });
    return { valid: false, errors, warnings };
  }

  if (tools.length === 0) {
    warnings.push({
      message: 'No tools defined, agent will have limited capabilities',
      path: 'spec.tools',
      suggestion: 'Add tools for agent functionality',
    });
    return { valid: true, errors, warnings };
  }

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    if (typeof tool === 'string') {
      // String tool references are valid
      continue;
    }

    if (tool && typeof tool === 'object') {
      const toolObj = tool as Record<string, unknown>;
      if (!toolObj.name && !toolObj.type) {
        warnings.push({
          message: `Tool at index ${i} has no name or type`,
          path: `spec.tools[${i}]`,
          suggestion: 'Add a name and type for each tool',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate semver version string.
 *
 * @param version - Version string to validate
 * @returns true if valid semver
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i;
  return semverRegex.test(version);
}

/**
 * Validate npm package name.
 *
 * @param name - Package name to validate
 * @returns true if valid npm name
 */
export function isValidNpmName(name: string): boolean {
  const npmNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  return npmNameRegex.test(name);
}

/**
 * Merge multiple validation results into one.
 *
 * @param results - Array of validation results to merge
 * @returns Combined validation result
 */
export function mergeResults(
  ...results: ManifestValidationResult[]
): ManifestValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const result of results) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
