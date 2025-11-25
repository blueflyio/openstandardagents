/**
 * CrewAI Platform Validator
 * Validates CrewAI-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';

@injectable()
export class CrewAIValidator {
  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const crewaiExt = manifest.extensions?.crewai;
    if (!crewaiExt || crewaiExt.enabled === false) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate agent_type
    const validTypes = ['worker', 'manager', 'researcher', 'analyst', 'custom'];
    if (crewaiExt.agent_type && !validTypes.includes(crewaiExt.agent_type)) {
      errors.push({
        instancePath: '/extensions/crewai/agent_type',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validTypes },
        message: `agent_type must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Validate role (required for CrewAI)
    if (
      !crewaiExt.role ||
      typeof crewaiExt.role !== 'string' ||
      crewaiExt.role.trim().length === 0
    ) {
      errors.push({
        instancePath: '/extensions/crewai/role',
        schemaPath: '',
        keyword: 'required',
        params: { missingProperty: 'role' },
        message: 'role is required for CrewAI agents',
      });
    }

    // Validate goal (required for CrewAI)
    if (
      !crewaiExt.goal ||
      typeof crewaiExt.goal !== 'string' ||
      crewaiExt.goal.trim().length === 0
    ) {
      errors.push({
        instancePath: '/extensions/crewai/goal',
        schemaPath: '',
        keyword: 'required',
        params: { missingProperty: 'goal' },
        message: 'goal is required for CrewAI agents',
      });
    }

    // Validate backstory (optional but recommended)
    if (!crewaiExt.backstory || crewaiExt.backstory.trim().length === 0) {
      warnings.push(
        'Best practice: Add backstory for better CrewAI agent context'
      );
    }

    // Validate tools if provided
    if (crewaiExt.tools && !Array.isArray(crewaiExt.tools)) {
      errors.push({
        instancePath: '/extensions/crewai/tools',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'tools must be an array',
      });
    }

    // Validate max_iterations if provided
    if (crewaiExt.max_iterations !== undefined) {
      if (
        typeof crewaiExt.max_iterations !== 'number' ||
        crewaiExt.max_iterations < 1
      ) {
        errors.push({
          instancePath: '/extensions/crewai/max_iterations',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'max_iterations must be at least 1',
        });
      }
    }

    // Validate max_execution_time if provided
    if (crewaiExt.max_execution_time !== undefined) {
      if (
        typeof crewaiExt.max_execution_time !== 'number' ||
        crewaiExt.max_execution_time < 1
      ) {
        errors.push({
          instancePath: '/extensions/crewai/max_execution_time',
          schemaPath: '',
          keyword: 'minimum',
          params: { limit: 1 },
          message: 'max_execution_time must be at least 1',
        });
      }
    }

    // Validate verbose if provided
    if (
      crewaiExt.verbose !== undefined &&
      typeof crewaiExt.verbose !== 'boolean'
    ) {
      errors.push({
        instancePath: '/extensions/crewai/verbose',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'boolean' },
        message: 'verbose must be a boolean',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
