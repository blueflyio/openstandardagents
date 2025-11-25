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

    const autogenExt = manifest.extensions?.autogen as Record<string, unknown> | undefined;
    if (!autogenExt || (autogenExt.enabled as boolean | undefined) === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate agent_type
    const validTypes = ['assistant', 'user_proxy', 'groupchat', 'custom'];
    const agentType = autogenExt.agent_type as string | undefined;
    if (agentType && !validTypes.includes(agentType)) {
      errors.push({
        instancePath: '/extensions/autogen/agent_type',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validTypes },
        message: `agent_type must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Validate system_message if provided
    const systemMessage = autogenExt.system_message as string | undefined;
    if (
      systemMessage !== undefined &&
      typeof systemMessage !== 'string'
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
    const maxConsecutiveAutoReply = autogenExt.max_consecutive_auto_reply as number | undefined;
    if (maxConsecutiveAutoReply !== undefined) {
      if (
        typeof maxConsecutiveAutoReply !== 'number' ||
        maxConsecutiveAutoReply < 0
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
    const humanInputMode = autogenExt.human_input_mode as string | undefined;
    if (humanInputMode) {
      const validModes = ['NEVER', 'TERMINATE', 'ALWAYS'];
      if (!validModes.includes(humanInputMode)) {
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
    const codeExecutionConfig = autogenExt.code_execution_config as Record<string, unknown> | undefined;
    if (codeExecutionConfig) {
      if (typeof codeExecutionConfig !== 'object') {
        errors.push({
          instancePath: '/extensions/autogen/code_execution_config',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'object' },
          message: 'code_execution_config must be an object',
        });
      } else {
        const workDir = codeExecutionConfig.work_dir as string | undefined;
        if (
          workDir &&
          typeof workDir !== 'string'
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
    if (!systemMessage) {
      warnings.push('Best practice: Define system_message for AutoGen agents');
    }

    if (
      agentType === 'assistant' &&
      maxConsecutiveAutoReply === undefined
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
