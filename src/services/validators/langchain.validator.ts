// @ts-nocheck
/**
 * LangChain Platform Validator
 * Validates LangChain-specific extension configuration
 */

import { injectable } from 'inversify';
import type { ErrorObject } from 'ajv';
import type { OssaAgent, ValidationResult } from '../../types/index.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Resolve the package root directory.
 * Works in both CJS (Jest uses __dirname) and ESM (searches filesystem).
 */
function resolvePackageRoot(): string {
  if (typeof __dirname !== 'undefined') {
    return join(__dirname, '..', '..', '..');
  }
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    if (pkg.name === '@bluefly/openstandardagents') {
      return process.cwd();
    }
  } catch { /* not package root */ }
  const nmPath = join(process.cwd(), 'node_modules', '@bluefly', 'openstandardagents');
  if (existsSync(join(nmPath, 'package.json'))) {
    return nmPath;
  }
  return process.cwd();
}

const PKG_ROOT = resolvePackageRoot();

@injectable()
export class LangChainValidator {
  private ajv: Ajv;
  private validateLangChain: ReturnType<Ajv['compile']>;

  constructor() {
    // @ts-expect-error - Ajv v8 API compatibility
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);

    const langchainSchemaPath = join(
      PKG_ROOT,
      'spec/v0.4/extensions/langchain/langchain.schema.json'
    );
    const langchainSchema = JSON.parse(
      readFileSync(langchainSchemaPath, 'utf-8')
    );
    this.validateLangChain = this.ajv.compile(langchainSchema);
  }

  validate(manifest: OssaAgent): ValidationResult {
    const errors: ErrorObject[] = [];
    const warnings: string[] = [];

    const langchainExt = manifest.extensions?.langchain as
      | Record<string, unknown>
      | undefined;

    if (!langchainExt) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Validate against LangChain extension schema
    const valid = this.validateLangChain(langchainExt);
    if (!valid) {
      const schemaErrors = this.validateLangChain.errors || [];
      errors.push(
        ...schemaErrors.map((err: ErrorObject) => ({
          ...err,
          instancePath: `/extensions/langchain${err.instancePath}`,
        }))
      );
    }

    if ((langchainExt.enabled as boolean | undefined) === false) {
      return { valid: errors.length === 0, errors, warnings };
    }

    // Validate chain_type
    const validChainTypes = [
      'llm',
      'retrieval',
      'agent',
      'sequential',
      'custom',
    ];
    const chainType = langchainExt.chain_type as string | undefined;
    if (chainType && !validChainTypes.includes(chainType)) {
      errors.push({
        instancePath: '/extensions/langchain/chain_type',
        schemaPath: '',
        keyword: 'enum',
        params: { allowedValues: validChainTypes },
        message: `chain_type must be one of: ${validChainTypes.join(', ')}`,
      });
    }

    // Validate memory if provided
    const memory = langchainExt.memory as Record<string, unknown> | undefined;
    if (memory) {
      const validMemoryTypes = ['buffer', 'summary', 'conversation', 'vector'];
      const memoryType = memory.type as string | undefined;
      if (memoryType && !validMemoryTypes.includes(memoryType)) {
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
    const returnIntermediateSteps = langchainExt.return_intermediate_steps as
      | boolean
      | undefined;
    if (
      returnIntermediateSteps !== undefined &&
      typeof returnIntermediateSteps !== 'boolean'
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
    if (!memory) {
      warnings.push(
        'Best practice: Configure memory for conversational LangChain agents'
      );
    }

    const tools = langchainExt.tools as unknown[] | undefined;
    if (!tools || (Array.isArray(tools) && tools.length === 0)) {
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
