// @ts-nocheck
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

    const cursorExt = manifest.extensions?.cursor as
      | Record<string, unknown>
      | undefined;
    if (!cursorExt) {
      return { valid: true, errors: [], warnings: [] };
    }

    if ((cursorExt.enabled as boolean | undefined) !== false) {
      // Validate agent_type
      const validTypes = ['composer', 'chat', 'background', 'cloud'];
      const agentType = cursorExt.agent_type as string | undefined;
      if (agentType && !validTypes.includes(agentType)) {
        errors.push({
          instancePath: '/extensions/cursor/agent_type',
          schemaPath: '',
          keyword: 'enum',
          params: { allowedValues: validTypes },
          message: `agent_type must be one of: ${validTypes.join(', ')}`,
        });
      }

      // Validate workspace_config if provided
      const workspaceConfig = cursorExt.workspace_config as
        | Record<string, unknown>
        | undefined;
      if (workspaceConfig) {
        const rulesFile = workspaceConfig.rules_file as string | undefined;
        if (rulesFile && typeof rulesFile !== 'string') {
          errors.push({
            instancePath: '/extensions/cursor/workspace_config/rules_file',
            schemaPath: '',
            keyword: 'type',
            params: { type: 'string' },
            message: 'rules_file must be a string',
          });
        }

        const contextFiles = workspaceConfig.context_files as
          | unknown[]
          | undefined;
        if (contextFiles && !Array.isArray(contextFiles)) {
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
      const model = cursorExt.model as Record<string, unknown> | undefined;
      if (model) {
        const validProviders = ['openai', 'anthropic', 'custom'];
        const provider = model.provider as string | undefined;
        if (provider && !validProviders.includes(provider)) {
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
      if (!workspaceConfig?.rules_file) {
        warnings.push(
          'Best practice: Specify .cursorrules file path for Cursor IDE integration'
        );
      }

      const capabilities = cursorExt.capabilities as unknown[] | undefined;
      if (!capabilities) {
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
