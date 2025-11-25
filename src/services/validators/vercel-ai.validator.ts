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

    const vercelExt = manifest.extensions?.vercel_ai as
      | Record<string, unknown>
      | undefined;
    if (!vercelExt || (vercelExt.enabled as boolean | undefined) === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate runtime
    const validRuntimes = ['edge', 'nodejs', 'cloudflare'];
    const runtime = vercelExt.runtime as string | undefined;
    if (runtime && !validRuntimes.includes(runtime)) {
      errors.push({
        instancePath: '/extensions/vercel_ai/runtime',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validRuntimes },
        message: `runtime must be one of: ${validRuntimes.join(', ')}`,
      });
    }

    // Validate stream if provided
    const stream = vercelExt.stream as boolean | undefined;
    if (stream !== undefined && typeof stream !== 'boolean') {
      errors.push({
        instancePath: '/extensions/vercel_ai/stream',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'boolean' },
        message: 'stream must be a boolean',
      });
    }

    // Validate max_tokens if provided
    const maxTokens = vercelExt.max_tokens as number | undefined;
    if (maxTokens !== undefined) {
      if (typeof maxTokens !== 'number' || maxTokens < 1) {
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
    const temperature = vercelExt.temperature as number | undefined;
    if (temperature !== undefined) {
      if (
        typeof temperature !== 'number' ||
        temperature < 0 ||
        temperature > 2
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
    const tools = vercelExt.tools as unknown[] | undefined;
    if (tools && !Array.isArray(tools)) {
      errors.push({
        instancePath: '/extensions/vercel_ai/tools',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'tools must be an array',
      });
    }

    // Warnings
    if (!runtime) {
      warnings.push(
        'Best practice: Specify runtime (edge/nodejs/cloudflare) for Vercel AI SDK'
      );
    }

    if (runtime === 'edge' && maxTokens && maxTokens > 4096) {
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
