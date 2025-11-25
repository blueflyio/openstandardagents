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

    const langflowExt = manifest.extensions?.langflow;
    if (!langflowExt || langflowExt.enabled === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate flow_id if provided
    if (langflowExt.flow_id && typeof langflowExt.flow_id !== 'string') {
      errors.push({
        instancePath: '/extensions/langflow/flow_id',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'string' },
        message: 'flow_id must be a string',
      });
    }

    // Validate endpoint if provided
    if (langflowExt.endpoint && typeof langflowExt.endpoint !== 'string') {
      errors.push({
        instancePath: '/extensions/langflow/endpoint',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'string' },
        message: 'endpoint must be a string',
      });
    }

    // Validate endpoint URL format if provided
    if (langflowExt.endpoint && typeof langflowExt.endpoint === 'string') {
      try {
        new URL(langflowExt.endpoint);
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
    if (langflowExt.timeout !== undefined) {
      if (typeof langflowExt.timeout !== 'number' || langflowExt.timeout < 1) {
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
    if (langflowExt.inputs && typeof langflowExt.inputs !== 'object') {
      errors.push({
        instancePath: '/extensions/langflow/inputs',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'object' },
        message: 'inputs must be an object',
      });
    }

    // Warnings
    if (!langflowExt.flow_id && !langflowExt.endpoint) {
      warnings.push(
        'Best practice: Specify flow_id or endpoint for Langflow integration'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
