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

    const llamaindexExt = manifest.extensions?.llamaindex as
      | Record<string, unknown>
      | undefined;
    if (
      !llamaindexExt ||
      (llamaindexExt.enabled as boolean | undefined) === false
    ) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate agent_type
    const validTypes = ['query_engine', 'chat_engine', 'retriever', 'custom'];
    if (
      llamaindexExt.agent_type &&
      !validTypes.includes(llamaindexExt.agent_type as string)
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
    const indexConfig = llamaindexExt.index_config as
      | Record<string, unknown>
      | undefined;
    if (indexConfig) {
      if (typeof indexConfig !== 'object') {
        errors.push({
          instancePath: '/extensions/llamaindex/index_config',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'object' },
          message: 'index_config must be an object',
        });
      } else {
        if (indexConfig.chunk_size !== undefined) {
          const chunkSize = indexConfig.chunk_size as number | undefined;
          if (typeof chunkSize !== 'number' || chunkSize < 1) {
            errors.push({
              instancePath: '/extensions/llamaindex/index_config/chunk_size',
              schemaPath: '',
              keyword: 'minimum',
              params: { limit: 1 },
              message: 'chunk_size must be at least 1',
            });
          }
        }

        if (indexConfig.chunk_overlap !== undefined) {
          const chunkOverlap = indexConfig.chunk_overlap as number | undefined;
          if (typeof chunkOverlap !== 'number' || chunkOverlap < 0) {
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
    const similarityTopK = llamaindexExt.similarity_top_k as number | undefined;
    if (similarityTopK !== undefined) {
      if (typeof similarityTopK !== 'number' || similarityTopK < 1) {
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
    const responseMode = llamaindexExt.response_mode as string | undefined;
    if (responseMode) {
      const validModes = [
        'default',
        'compact',
        'tree_summarize',
        'refine',
        'simple_summarize',
      ];
      if (!validModes.includes(responseMode)) {
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
    if (!indexConfig) {
      warnings.push(
        'Best practice: Configure index_config for LlamaIndex agents'
      );
    }

    if (
      (llamaindexExt.agent_type as string | undefined) === 'query_engine' &&
      !similarityTopK
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
