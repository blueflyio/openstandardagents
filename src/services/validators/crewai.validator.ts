/**
 * CrewAI Platform Validator
 * Validates CrewAI-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

@injectable()
export class CrewAIValidator {
  private ajv: Ajv;
  private validateCrewAI: ReturnType<Ajv['compile']>;

  constructor() {
// @ts-expect-error - Ajv v8 API compatibility
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);

    // Load CrewAI schema from spec/ directory (relative to project root)
    // Works in both Jest (source tree) and production (project root with dist/)
    const crewaiSchemaPath = join(
      process.cwd(),
      'spec/v0.3/extensions/crewai/crewai.schema.json'
    );
    const crewaiSchema = JSON.parse(readFileSync(crewaiSchemaPath, 'utf-8'));
    this.validateCrewAI = this.ajv.compile(crewaiSchema);
  }

  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const crewaiExt = manifest.extensions?.crewai as
      | Record<string, unknown>
      | undefined;

    if (!crewaiExt) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate against CrewAI extension schema
    const valid = this.validateCrewAI(crewaiExt);
    if (!valid) {
      const schemaErrors = this.validateCrewAI.errors || [];
      errors.push(
        ...schemaErrors.map((err: ErrorObject) => ({
          ...err,
          instancePath: `/extensions/crewai${err.instancePath}`,
        }))
      );
    }

    if ((crewaiExt.enabled as boolean | undefined) === false) {
      return { valid: errors.length === 0, errors, warnings };
    }

    // Validate agent_type
    const validTypes = ['worker', 'manager', 'researcher', 'analyst', 'custom'];
    const agentType = crewaiExt.agent_type as string | undefined;
    if (agentType && !validTypes.includes(agentType)) {
      errors.push({
        instancePath: '/extensions/crewai/agent_type',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validTypes },
        message: `agent_type must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Validate role (required for CrewAI)
    const role = crewaiExt.role as string | undefined;
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      errors.push({
        instancePath: '/extensions/crewai/role',
        schemaPath: '',
        keyword: 'required',
        params: { missingProperty: 'role' },
        message: 'role is required for CrewAI agents',
      });
    }

    // Validate goal (required for CrewAI)
    const goal = crewaiExt.goal as string | undefined;
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      errors.push({
        instancePath: '/extensions/crewai/goal',
        schemaPath: '',
        keyword: 'required',
        params: { missingProperty: 'goal' },
        message: 'goal is required for CrewAI agents',
      });
    }

    // Validate backstory (optional but recommended)
    const backstory = crewaiExt.backstory as string | undefined;
    if (!backstory || backstory.trim().length === 0) {
      warnings.push(
        'Best practice: Add backstory for better CrewAI agent context'
      );
    }

    // Validate tools if provided
    const tools = crewaiExt.tools as unknown[] | undefined;
    if (tools && !Array.isArray(tools)) {
      errors.push({
        instancePath: '/extensions/crewai/tools',
        schemaPath: '',
        keyword: 'type',
        params: { type: 'array' },
        message: 'tools must be an array',
      });
    }

    // Validate max_iterations if provided
    const maxIterations = crewaiExt.max_iterations as number | undefined;
    if (maxIterations !== undefined) {
      if (typeof maxIterations !== 'number' || maxIterations < 1) {
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
    const maxExecutionTime = crewaiExt.max_execution_time as number | undefined;
    if (maxExecutionTime !== undefined) {
      if (typeof maxExecutionTime !== 'number' || maxExecutionTime < 1) {
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
    const verbose = crewaiExt.verbose as boolean | undefined;
    if (verbose !== undefined && typeof verbose !== 'boolean') {
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
