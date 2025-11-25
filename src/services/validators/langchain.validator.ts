/**
 * LangChain Platform Validator
 * Validates LangChain-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

@injectable()
export class LangChainValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const langchainExt = manifest.extensions?.langchain;
    if (!langchainExt || langchainExt.enabled === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate chain_type
    const validChainTypes = [
      'llm',
      'retrieval',
      'agent',
      'sequential',
      'custom',
    ];
    if (
      langchainExt.chain_type &&
      !validChainTypes.includes(langchainExt.chain_type)
    ) {
      errors.push({
        instancePath: '/extensions/langchain/chain_type',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validChainTypes },
        message: `chain_type must be one of: ${validChainTypes.join(', ')}`,
      });
    }

    // Validate memory if provided
    if (langchainExt.memory) {
      const validMemoryTypes = ['buffer', 'summary', 'conversation', 'vector'];
      if (
        langchainExt.memory.type &&
        !validMemoryTypes.includes(langchainExt.memory.type)
      ) {
        errors.push({
          instancePath: '/extensions/langchain/memory/type',
          schemaPath: '',
          keyword: 'enum',
          params: { allowedValues: validMemoryTypes },
          message: `memory.type must be one of: ${validMemoryTypes.join(', ')}`,
        });
      }
    }

    // Validate callbacks if provided
    if (langchainExt.callbacks && !Array.isArray(langchainExt.callbacks)) {
      errors.push({
        instancePath: '/extensions/langchain/callbacks',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'callbacks must be an array',
      });
    }

    // Validate verbose if provided
    if (
      langchainExt.verbose !== undefined &&
      typeof langchainExt.verbose !== 'boolean'
    ) {
      errors.push({
        instancePath: '/extensions/langchain/verbose',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'boolean' },
        message: 'verbose must be a boolean',
      });
    }

    // Validate return_intermediate_steps if provided
    if (
      langchainExt.return_intermediate_steps !== undefined &&
      typeof langchainExt.return_intermediate_steps !== 'boolean'
    ) {
      errors.push({
        instancePath: '/extensions/langchain/return_intermediate_steps',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'boolean' },
        message: 'return_intermediate_steps must be a boolean',
      });
    }

    // Warnings
    if (!langchainExt.memory) {
      warnings.push(
        'Best practice: Configure memory for conversational LangChain agents'
      );
    }

    if (
      !langchainExt.tools ||
      (Array.isArray(langchainExt.tools) && langchainExt.tools.length === 0)
    ) {
      warnings.push(
        'Best practice: Define tools for LangChain agent capabilities'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
