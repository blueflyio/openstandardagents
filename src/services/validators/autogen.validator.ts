/**
 * AutoGen Platform Validator
 * Validates AutoGen-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

@injectable()
export class AutoGenValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const autogenExt = manifest.extensions?.autogen;
    if (!autogenExt || autogenExt.enabled === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate agent_type
    const validTypes = ['assistant', 'user_proxy', 'groupchat', 'custom'];
    if (autogenExt.agent_type && !validTypes.includes(autogenExt.agent_type)) {
      errors.push({
        instancePath: '/extensions/autogen/agent_type',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validTypes },
        message: `agent_type must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Validate system_message if provided
    if (
      autogenExt.system_message !== undefined &&
      typeof autogenExt.system_message !== 'string'
    ) {
      errors.push({
        instancePath: '/extensions/autogen/system_message',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'string' },
        message: 'system_message must be a string',
      });
    }

    // Validate max_consecutive_auto_reply if provided
    if (autogenExt.max_consecutive_auto_reply !== undefined) {
      if (
        typeof autogenExt.max_consecutive_auto_reply !== 'number' ||
        autogenExt.max_consecutive_auto_reply < 0
      ) {
        errors.push({
          instancePath: '/extensions/autogen/max_consecutive_auto_reply',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 0 },
          message: 'max_consecutive_auto_reply must be at least 0',
        });
      }
    }

    // Validate human_input_mode if provided
    if (autogenExt.human_input_mode) {
      const validModes = ['NEVER', 'TERMINATE', 'ALWAYS'];
      if (!validModes.includes(autogenExt.human_input_mode)) {
        errors.push({
          instancePath: '/extensions/autogen/human_input_mode',
          schemaPath: '',
          keyword: 'enum',
          params: { allowedValues: validModes },
          message: `human_input_mode must be one of: ${validModes.join(', ')}`,
        });
      }
    }

    // Validate code_execution_config if provided
    if (autogenExt.code_execution_config) {
      if (typeof autogenExt.code_execution_config !== 'object') {
        errors.push({
          instancePath: '/extensions/autogen/code_execution_config',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'object' },
          message: 'code_execution_config must be an object',
        });
      } else {
        if (
          autogenExt.code_execution_config.work_dir &&
          typeof autogenExt.code_execution_config.work_dir !== 'string'
        ) {
          errors.push({
            instancePath: '/extensions/autogen/code_execution_config/work_dir',
            schemaPath: '',
            keyword: 'type',
            params: { type: 'string' },
            message: 'work_dir must be a string',
          });
        }
      }
    }

    // Warnings
    if (!autogenExt.system_message) {
      warnings.push('Best practice: Define system_message for AutoGen agents');
    }

    if (
      autogenExt.agent_type === 'assistant' &&
      autogenExt.max_consecutive_auto_reply === undefined
    ) {
      warnings.push(
        'Best practice: Set max_consecutive_auto_reply for AutoGen assistant agents'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
