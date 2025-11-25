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

    const openaiExt = manifest.extensions?.openai_agents;
    if (!openaiExt || openaiExt.enabled === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate model
    const validModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ];
    if (openaiExt.model && !validModels.includes(openaiExt.model)) {
      errors.push({
        instancePath: '/extensions/openai_agents/model',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validModels },
        message: `model must be one of: ${validModels.join(', ')}`,
      });
    }

    // Validate tools_mapping if provided
    if (openaiExt.tools_mapping) {
      if (!Array.isArray(openaiExt.tools_mapping)) {
        errors.push({
          instancePath: '/extensions/openai_agents/tools_mapping',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'array' },
          message: 'tools_mapping must be an array',
        });
      } else {
        openaiExt.tools_mapping.forEach(
          (mapping: Record<string, unknown>, index: number) => {
            if (!mapping.ossa_capability) {
              errors.push({
                instancePath: `/extensions/openai_agents/tools_mapping/${index}/ossa_capability`,
                schemaPath: '',
                keyword: 'required',
                params: { missingProperty: 'ossa_capability' },
                message: 'tools_mapping item must have ossa_capability',
              });
            }
          }
        );
      }
    }

    // Validate guardrails
    if (openaiExt.guardrails) {
      if (
        openaiExt.guardrails.max_tool_calls !== undefined &&
        openaiExt.guardrails.max_tool_calls < 1
      ) {
        errors.push({
          instancePath: '/extensions/openai_agents/guardrails/max_tool_calls',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'max_tool_calls must be at least 1',
        });
      }

      if (
        openaiExt.guardrails.timeout_seconds !== undefined &&
        openaiExt.guardrails.timeout_seconds < 1
      ) {
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
    if (openaiExt.memory) {
      const validMemoryTypes = ['session', 'persistent'];
      if (
        openaiExt.memory.type &&
        !validMemoryTypes.includes(openaiExt.memory.type)
      ) {
        errors.push({
          instancePath: '/extensions/openai_agents/memory/type',
          schemaPath: '',
          keyword: 'enum',
          params: { allowedValues: validMemoryTypes },
          message: `memory.type must be one of: ${validMemoryTypes.join(', ')}`,
        });
      }

      if (
        openaiExt.memory.max_messages !== undefined &&
        openaiExt.memory.max_messages < 1
      ) {
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
    if (!openaiExt.tools_mapping || openaiExt.tools_mapping.length === 0) {
      warnings.push(
        'Best practice: Define tools_mapping to map OSSA capabilities to OpenAI tools'
      );
    }

    if (!openaiExt.guardrails) {
      warnings.push('Best practice: Configure guardrails for production use');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
