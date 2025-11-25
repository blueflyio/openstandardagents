/**
 * Vercel AI SDK Platform Validator
 * Validates Vercel AI SDK-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

@injectable()
export class VercelAIValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const vercelExt = manifest.extensions?.vercel_ai;
    if (!vercelExt || vercelExt.enabled === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate runtime
    const validRuntimes = ['edge', 'nodejs', 'cloudflare'];
    if (vercelExt.runtime && !validRuntimes.includes(vercelExt.runtime)) {
      errors.push({
        instancePath: '/extensions/vercel_ai/runtime',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validRuntimes },
        message: `runtime must be one of: ${validRuntimes.join(', ')}`,
      });
    }

    // Validate stream if provided
    if (
      vercelExt.stream !== undefined &&
      typeof vercelExt.stream !== 'boolean'
    ) {
      errors.push({
        instancePath: '/extensions/vercel_ai/stream',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'boolean' },
        message: 'stream must be a boolean',
      });
    }

    // Validate max_tokens if provided
    if (vercelExt.max_tokens !== undefined) {
      if (
        typeof vercelExt.max_tokens !== 'number' ||
        vercelExt.max_tokens < 1
      ) {
        errors.push({
          instancePath: '/extensions/vercel_ai/max_tokens',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'max_tokens must be at least 1',
        });
      }
    }

    // Validate temperature if provided
    if (vercelExt.temperature !== undefined) {
      if (
        typeof vercelExt.temperature !== 'number' ||
        vercelExt.temperature < 0 ||
        vercelExt.temperature > 2
      ) {
        errors.push({
          instancePath: '/extensions/vercel_ai/temperature',
          schemaPath: '',
          keyword: 'range',
          params: { minimum: 0, maximum: 2 },
          message: 'temperature must be between 0 and 2',
        });
      }
    }

    // Validate tools if provided
    if (vercelExt.tools && !Array.isArray(vercelExt.tools)) {
      errors.push({
        instancePath: '/extensions/vercel_ai/tools',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'tools must be an array',
      });
    }

    // Warnings
    if (!vercelExt.runtime) {
      warnings.push(
        'Best practice: Specify runtime (edge/nodejs/cloudflare) for Vercel AI SDK'
      );
    }

    if (
      vercelExt.runtime === 'edge' &&
      vercelExt.max_tokens &&
      vercelExt.max_tokens > 4096
    ) {
      warnings.push(
        'Best practice: Edge runtime has token limits - consider reducing max_tokens'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
