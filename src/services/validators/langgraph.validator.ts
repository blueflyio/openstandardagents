/**
 * LangGraph Platform Validator
 * Validates LangGraph-specific extension configuration
 */

import { injectable } from 'inversify';
import type { OssaAgent, ValidationResult } from '../../types/index.js';
import type { ErrorObject } from 'ajv';

@injectable()
export class LangGraphValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const langgraphExt = manifest.extensions?.langgraph;
    if (!langgraphExt || langgraphExt.enabled === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate graph_config if provided
    if (langgraphExt.graph_config) {
      if (typeof langgraphExt.graph_config !== 'object') {
        errors.push({
          instancePath: '/extensions/langgraph/graph_config',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'object' },
          message: 'graph_config must be an object',
        });
      } else {
        // Validate nodes if provided
        if (langgraphExt.graph_config.nodes) {
          if (!Array.isArray(langgraphExt.graph_config.nodes)) {
            errors.push({
              instancePath: '/extensions/langgraph/graph_config/nodes',
              schemaPath: '',
              keyword: 'type',
              params: { type: 'array' },
              message: 'nodes must be an array',
            });
          }
        }

        // Validate edges if provided
        if (langgraphExt.graph_config.edges) {
          if (!Array.isArray(langgraphExt.graph_config.edges)) {
            errors.push({
              instancePath: '/extensions/langgraph/graph_config/edges',
              schemaPath: '',
              keyword: 'type',
              params: { type: 'array' },
              message: 'edges must be an array',
            });
          }
        }
      }
    }

    // Validate checkpoint_config if provided
    if (langgraphExt.checkpoint_config) {
      if (typeof langgraphExt.checkpoint_config !== 'object') {
        errors.push({
          instancePath: '/extensions/langgraph/checkpoint_config',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'object' },
          message: 'checkpoint_config must be an object',
        });
      }
    }

    // Validate max_iterations if provided
    if (langgraphExt.max_iterations !== undefined) {
      if (
        typeof langgraphExt.max_iterations !== 'number' ||
        langgraphExt.max_iterations < 1
      ) {
        errors.push({
          instancePath: '/extensions/langgraph/max_iterations',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'max_iterations must be at least 1',
        });
      }
    }

    // Validate interrupt_before if provided
    if (
      langgraphExt.interrupt_before &&
      !Array.isArray(langgraphExt.interrupt_before)
    ) {
      errors.push({
        instancePath: '/extensions/langgraph/interrupt_before',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'interrupt_before must be an array',
      });
    }

    // Validate interrupt_after if provided
    if (
      langgraphExt.interrupt_after &&
      !Array.isArray(langgraphExt.interrupt_after)
    ) {
      errors.push({
        instancePath: '/extensions/langgraph/interrupt_after',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'interrupt_after must be an array',
      });
    }

    // Warnings
    if (!langgraphExt.graph_config) {
      warnings.push(
        'Best practice: Define graph_config for LangGraph state machine'
      );
    }

    if (!langgraphExt.checkpoint_config) {
      warnings.push(
        'Best practice: Configure checkpoint_config for state persistence'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
