/**
 * LlamaIndex Platform Validator
 * Validates LlamaIndex-specific extension configuration
 */

import { injectable } from 'inversify';
import type { OssaAgent, ValidationResult } from '../../types/index.js';
import type { ErrorObject } from 'ajv';

@injectable()
export class LlamaIndexValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const llamaindexExt = manifest.extensions?.llamaindex;
    if (!llamaindexExt || llamaindexExt.enabled === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate agent_type
    const validTypes = ['query_engine', 'chat_engine', 'retriever', 'custom'];
    if (
      llamaindexExt.agent_type &&
      !validTypes.includes(llamaindexExt.agent_type)
    ) {
      errors.push({
        instancePath: '/extensions/llamaindex/agent_type',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validTypes },
        message: `agent_type must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Validate index_config if provided
    if (llamaindexExt.index_config) {
      if (typeof llamaindexExt.index_config !== 'object') {
        errors.push({
          instancePath: '/extensions/llamaindex/index_config',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'object' },
          message: 'index_config must be an object',
        });
      } else {
        if (llamaindexExt.index_config.chunk_size !== undefined) {
          if (
            typeof llamaindexExt.index_config.chunk_size !== 'number' ||
            llamaindexExt.index_config.chunk_size < 1
          ) {
            errors.push({
              instancePath: '/extensions/llamaindex/index_config/chunk_size',
              schemaPath: '',
              keyword: 'minimum',
              params: { limit: 1 },
              message: 'chunk_size must be at least 1',
            });
          }
        }

        if (llamaindexExt.index_config.chunk_overlap !== undefined) {
          if (
            typeof llamaindexExt.index_config.chunk_overlap !== 'number' ||
            llamaindexExt.index_config.chunk_overlap < 0
          ) {
            errors.push({
              instancePath: '/extensions/llamaindex/index_config/chunk_overlap',
              schemaPath: '',
              keyword: 'minimum',
              params: { limit: 0 },
              message: 'chunk_overlap must be at least 0',
            });
          }
        }
      }
    }

    // Validate similarity_top_k if provided
    if (llamaindexExt.similarity_top_k !== undefined) {
      if (
        typeof llamaindexExt.similarity_top_k !== 'number' ||
        llamaindexExt.similarity_top_k < 1
      ) {
        errors.push({
          instancePath: '/extensions/llamaindex/similarity_top_k',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'similarity_top_k must be at least 1',
        });
      }
    }

    // Validate response_mode if provided
    if (llamaindexExt.response_mode) {
      const validModes = [
        'default',
        'compact',
        'tree_summarize',
        'refine',
        'simple_summarize',
      ];
      if (!validModes.includes(llamaindexExt.response_mode)) {
        errors.push({
          instancePath: '/extensions/llamaindex/response_mode',
          schemaPath: '',
          keyword: 'enum',
          params: { allowedValues: validModes },
          message: `response_mode must be one of: ${validModes.join(', ')}`,
        });
      }
    }

    // Warnings
    if (!llamaindexExt.index_config) {
      warnings.push(
        'Best practice: Configure index_config for LlamaIndex agents'
      );
    }

    if (
      llamaindexExt.agent_type === 'query_engine' &&
      !llamaindexExt.similarity_top_k
    ) {
      warnings.push(
        'Best practice: Set similarity_top_k for query engine agents'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
