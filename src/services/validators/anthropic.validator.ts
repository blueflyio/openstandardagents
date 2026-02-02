// @ts-nocheck
/**
 * Anthropic Platform Validator
 * Validates Anthropic Claude-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

@injectable()
export class AnthropicValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const anthropicExt = manifest.extensions?.anthropic as
      | Record<string, unknown>
      | undefined;
    if (
      !anthropicExt ||
      (anthropicExt.enabled as boolean | undefined) === false
    ) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate model
    const validModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
    const model = anthropicExt.model as string | undefined;
    if (model && !validModels.includes(model)) {
      errors.push({
        instancePath: '/extensions/anthropic/model',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validModels },
        message: `model must be one of: ${validModels.join(', ')}`,
      });
    }

    // Validate system prompt (recommended)
    if (
      !anthropicExt.system ||
      typeof anthropicExt.system !== 'string' ||
      anthropicExt.system.trim().length === 0
    ) {
      warnings.push(
        'Best practice: Define system prompt for Anthropic Claude agents'
      );
    }

    // Validate max_tokens if provided
    if (anthropicExt.max_tokens !== undefined) {
      if (
        typeof anthropicExt.max_tokens !== 'number' ||
        anthropicExt.max_tokens < 1 ||
        anthropicExt.max_tokens > 4096
      ) {
        errors.push({
          instancePath: '/extensions/anthropic/max_tokens',
          schemaPath: '',
          keyword: 'range',
          params: { minimum: 1, maximum: 4096 },
          message: 'max_tokens must be between 1 and 4096',
        });
      }
    }

    // Validate temperature if provided
    const temperature = anthropicExt.temperature as number | undefined;
    if (temperature !== undefined) {
      if (
        typeof temperature !== 'number' ||
        temperature < 0 ||
        temperature > 1
      ) {
        errors.push({
          instancePath: '/extensions/anthropic/temperature',
          schemaPath: '',
          keyword: 'range',
          params: { minimum: 0, maximum: 1 },
          message: 'temperature must be between 0 and 1',
        });
      }
    }

    // Validate tools if provided
    const tools = anthropicExt.tools as unknown[] | undefined;
    if (tools && !Array.isArray(tools)) {
      errors.push({
        instancePath: '/extensions/anthropic/tools',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'tools must be an array',
      });
    }

    // Validate tool_choice if provided
    const toolChoice = anthropicExt.tool_choice as string | undefined;
    if (toolChoice) {
      const validChoices = ['auto', 'any', 'none'];
      if (!validChoices.includes(toolChoice)) {
        errors.push({
          instancePath: '/extensions/anthropic/tool_choice',
          schemaPath: '',
          keyword: 'enum',
          params: { allowedValues: validChoices },
          message: `tool_choice must be one of: ${validChoices.join(', ')}`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
