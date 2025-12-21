/**
 * OpenAI Agents Platform Validator
 * Validates OpenAI Agents SDK extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

@injectable()
export class OpenAIValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const openaiExt = manifest.extensions?.openai_agents as Record<string, unknown> | undefined;
    if (!openaiExt || (openaiExt.enabled as boolean | undefined) === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate model
    const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    const model = openaiExt.model as string | undefined;
    if (model && !validModels.includes(model)) {
      errors.push({
        instancePath: '/extensions/openai_agents/model',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validModels },
        message: `model must be one of: ${validModels.join(', ')}`,
      });
    }

    // Validate tools_mapping if provided
    const toolsMapping = openaiExt.tools_mapping as Array<Record<string, unknown>> | undefined;
    if (toolsMapping) {
      if (!Array.isArray(toolsMapping)) {
        errors.push({
          instancePath: '/extensions/openai_agents/tools_mapping',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'array' },
          message: 'tools_mapping must be an array',
        });
      } else {
        toolsMapping.forEach((mapping: Record<string, unknown>, index: number) => {
          if (!mapping.ossa_capability) {
            errors.push({
              instancePath: `/extensions/openai_agents/tools_mapping/${index}/ossa_capability`,
              schemaPath: '',
              keyword: 'required',
              params: { missingProperty: 'ossa_capability' },
              message: 'tools_mapping item must have ossa_capability',
            });
          }
        });
      }
    }

    // Validate guardrails
    const guardrails = openaiExt.guardrails as Record<string, unknown> | undefined;
    if (guardrails) {
      const maxToolCalls = guardrails.max_tool_calls as number | undefined;
      if (maxToolCalls !== undefined && maxToolCalls < 1) {
        errors.push({
          instancePath: '/extensions/openai_agents/guardrails/max_tool_calls',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'max_tool_calls must be at least 1',
        });
      }

      const timeoutSeconds = guardrails.timeout_seconds as number | undefined;
      if (timeoutSeconds !== undefined && timeoutSeconds < 1) {
        errors.push({
          instancePath: '/extensions/openai_agents/guardrails/timeout_seconds',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'timeout_seconds must be at least 1',
        });
      }
    }

    // Validate memory
    const memory = openaiExt.memory as Record<string, unknown> | undefined;
    if (memory) {
      const validMemoryTypes = ['session', 'persistent'];
      const memoryType = memory.type as string | undefined;
      if (memoryType && !validMemoryTypes.includes(memoryType)) {
        errors.push({
          instancePath: '/extensions/openai_agents/memory/type',
          schemaPath: '',
          keyword: 'enum',
          params: { allowedValues: validMemoryTypes },
          message: `memory.type must be one of: ${validMemoryTypes.join(', ')}`,
        });
      }

      const maxMessages = memory.max_messages as number | undefined;
      if (maxMessages !== undefined && maxMessages < 1) {
        errors.push({
          instancePath: '/extensions/openai_agents/memory/max_messages',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'max_messages must be at least 1',
        });
      }
    }

    // Warnings
    if (!toolsMapping || toolsMapping.length === 0) {
      warnings.push('Best practice: Define tools_mapping to map OSSA capabilities to OpenAI tools');
    }

    if (!guardrails) {
      warnings.push('Best practice: Configure guardrails for production use');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
