/**
 * Cursor Platform Validator
 * Validates Cursor-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

@injectable()
export class CursorValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const cursorExt = manifest.extensions?.cursor;
    if (!cursorExt) {
      return { valid: true, errors: [], warnings: [] };
    }

    if (cursorExt.enabled !== false) {
      // Validate agent_type
      const validTypes = ['composer', 'chat', 'background', 'cloud'];
      if (cursorExt.agent_type && !validTypes.includes(cursorExt.agent_type)) {
        errors.push({
          instancePath: '/extensions/cursor/agent_type',
          schemaPath: '',
          keyword: 'enum',
          params: { allowedValues: validTypes },
          message: `agent_type must be one of: ${validTypes.join(', ')}`,
        });
      }

      // Validate workspace_config if provided
      if (cursorExt.workspace_config) {
        if (
          cursorExt.workspace_config.rules_file &&
          typeof cursorExt.workspace_config.rules_file !== 'string'
        ) {
          errors.push({
            instancePath: '/extensions/cursor/workspace_config/rules_file',
            schemaPath: '',
            keyword: 'type',
            params: { type: 'string' },
            message: 'rules_file must be a string',
          });
        }

        if (
          cursorExt.workspace_config.context_files &&
          !Array.isArray(cursorExt.workspace_config.context_files)
        ) {
          errors.push({
            instancePath: '/extensions/cursor/workspace_config/context_files',
            schemaPath: '',
            keyword: 'type',
            params: { type: 'array' },
            message: 'context_files must be an array',
          });
        }
      }

      // Validate model configuration
      if (cursorExt.model) {
        const validProviders = ['openai', 'anthropic', 'custom'];
        if (
          cursorExt.model.provider &&
          !validProviders.includes(cursorExt.model.provider)
        ) {
          errors.push({
            instancePath: '/extensions/cursor/model/provider',
            schemaPath: '',
            keyword: 'enum',
            params: { allowedValues: validProviders },
            message: `provider must be one of: ${validProviders.join(', ')}`,
          });
        }
      }

      // Warnings for best practices
      if (!cursorExt.workspace_config?.rules_file) {
        warnings.push(
          'Best practice: Specify .cursorrules file path for Cursor IDE integration'
        );
      }

      if (!cursorExt.capabilities) {
        warnings.push(
          'Best practice: Define Cursor capabilities (code_generation, code_review, etc.)'
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
