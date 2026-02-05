// @ts-nocheck
/**
 * AutoGen (AG2) Platform Validator
 * Validates AG2/AutoGen-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

@injectable()
export class AutoGenValidator {
  private ajv: Ajv;
  private validateAG2: ReturnType<Ajv['compile']>;

  constructor() {
    // @ts-expect-error - Ajv v8 API compatibility
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);

    // Load AG2 schema from spec/ directory (relative to project root)
    // Works in both Jest (source tree) and production (project root with dist/)
    const ag2SchemaPath = join(
      process.cwd(),
      'spec/v0.3/extensions/ag2/ag2.schema.json'
    );
    const ag2Schema = JSON.parse(readFileSync(ag2SchemaPath, 'utf-8'));
    this.validateAG2 = this.ajv.compile(ag2Schema);
  }

  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    // Support both 'autogen' and 'ag2' keys
    const autogenExt = (manifest.extensions?.autogen ||
      manifest.extensions?.ag2) as Record<string, unknown> | undefined;

    if (!autogenExt) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate against AG2 extension schema
    const valid = this.validateAG2(autogenExt);
    if (!valid) {
      const schemaErrors = this.validateAG2.errors || [];
      const extKey = manifest.extensions?.autogen ? 'autogen' : 'ag2';
      errors.push(
        ...schemaErrors.map((err: ErrorObject) => ({
          ...err,
          instancePath: `/extensions/${extKey}${err.instancePath}`,
        }))
      );
    }

    if ((autogenExt.enabled as boolean | undefined) === false) {
      return { valid: errors.length === 0, errors, warnings };
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
    if (systemMessage !== undefined && typeof systemMessage !== 'string') {
      errors.push({
        instancePath: '/extensions/autogen/system_message',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'string' },
        message: 'system_message must be a string',
      });
    }

    // Validate max_consecutive_auto_reply if provided
    const maxConsecutiveAutoReply = autogenExt.max_consecutive_auto_reply as
      | number
      | undefined;
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
    const codeExecutionConfig = autogenExt.code_execution_config as
      | Record<string, unknown>
      | undefined;
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
        if (workDir && typeof workDir !== 'string') {
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

    if (agentType === 'assistant' && maxConsecutiveAutoReply === undefined) {
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
