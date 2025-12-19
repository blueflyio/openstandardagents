/**
 * Langflow Platform Validator
 * Validates Langflow-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

@injectable()
export class LangflowValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const langflowExt = manifest.extensions?.langflow as Record<string, unknown> | undefined;
    if (!langflowExt || (langflowExt.enabled as boolean | undefined) === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate flow_id if provided
    const flowId = langflowExt.flow_id as string | undefined;
    if (flowId && typeof flowId !== 'string') {
      errors.push({
        instancePath: '/extensions/langflow/flow_id',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'string' },
        message: 'flow_id must be a string',
      });
    }

    // Validate endpoint if provided
    const endpoint = langflowExt.endpoint as string | undefined;
    if (endpoint && typeof endpoint !== 'string') {
      errors.push({
        instancePath: '/extensions/langflow/endpoint',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'string' },
        message: 'endpoint must be a string',
      });
    }

    // Validate endpoint URL format if provided
    if (endpoint && typeof endpoint === 'string') {
      try {
        new URL(endpoint);
      } catch {
        errors.push({
          instancePath: '/extensions/langflow/endpoint',
          schemaPath: '',
          keyword: 'format',
          params: { format: 'uri' },
          message: 'endpoint must be a valid URL',
        });
      }
    }

    // Validate timeout if provided
    const timeout = langflowExt.timeout as number | undefined;
    if (timeout !== undefined) {
      if (typeof timeout !== 'number' || timeout < 1) {
        errors.push({
          instancePath: '/extensions/langflow/timeout',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'timeout must be at least 1 second',
        });
      }
    }

    // Validate inputs if provided
    const inputs = langflowExt.inputs as Record<string, unknown> | undefined;
    if (inputs && typeof inputs !== 'object') {
      errors.push({
        instancePath: '/extensions/langflow/inputs',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'object' },
        message: 'inputs must be an object',
      });
    }

    // Warnings
    if (!flowId && !endpoint) {
      warnings.push('Best practice: Specify flow_id or endpoint for Langflow integration');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
