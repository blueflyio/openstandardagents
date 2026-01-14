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

    const langgraphExt = manifest.extensions?.langgraph as
      | Record<string, unknown>
      | undefined;
    if (
      !langgraphExt ||
      (langgraphExt.enabled as boolean | undefined) === false
    ) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate graph_config if provided
    const graphConfig = langgraphExt.graph_config as
      | Record<string, unknown>
      | undefined;
    if (graphConfig) {
      if (typeof graphConfig !== 'object') {
        errors.push({
          instancePath: '/extensions/langgraph/graph_config',
          schemaPath: '',
          keyword: 'type',
          params: { type: 'object' },
          message: 'graph_config must be an object',
        });
      } else {
        // Validate nodes if provided
        const nodes = graphConfig.nodes as unknown[] | undefined;
        if (nodes) {
          if (!Array.isArray(nodes)) {
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
        const edges = graphConfig.edges as unknown[] | undefined;
        if (edges) {
          if (!Array.isArray(edges)) {
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
    const checkpointConfig = langgraphExt.checkpoint_config as
      | Record<string, unknown>
      | undefined;
    if (checkpointConfig) {
      if (typeof checkpointConfig !== 'object') {
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
    const maxIterations = langgraphExt.max_iterations as number | undefined;
    if (maxIterations !== undefined) {
      if (typeof maxIterations !== 'number' || maxIterations < 1) {
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
    const interruptBefore = langgraphExt.interrupt_before as
      | unknown[]
      | undefined;
    if (interruptBefore && !Array.isArray(interruptBefore)) {
      errors.push({
        instancePath: '/extensions/langgraph/interrupt_before',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'interrupt_before must be an array',
      });
    }

    // Validate interrupt_after if provided
    const interruptAfter = langgraphExt.interrupt_after as
      | unknown[]
      | undefined;
    if (interruptAfter && !Array.isArray(interruptAfter)) {
      errors.push({
        instancePath: '/extensions/langgraph/interrupt_after',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'interrupt_after must be an array',
      });
    }

    // Warnings
    if (!graphConfig) {
      warnings.push(
        'Best practice: Define graph_config for LangGraph state machine'
      );
    }

    if (!checkpointConfig) {
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
