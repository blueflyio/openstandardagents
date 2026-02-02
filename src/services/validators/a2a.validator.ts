// @ts-nocheck
/**
 * A2A Validator
 * Validates Agent-to-Agent extension
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@injectable()
export class A2AValidator {
  private ajv: Ajv;
  private validate: any;

  constructor() {
// @ts-expect-error - Ajv v8 API compatibility
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);

    const schemaPath = path.resolve(
      __dirname,
      '../../../spec/v0.3/extensions/a2a/a2a.schema.json'
    );
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    this.validate = this.ajv.compile(schema);
  }

  validateA2A(a2aConfig: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.validate(a2aConfig)) {
      if (this.validate.errors) {
        for (const error of this.validate.errors) {
          errors.push(`${error.instancePath} ${error.message}`);
        }
      }
    }

    if (
      a2aConfig.agent_card &&
      !a2aConfig.agent_card.agent_uri?.startsWith('agent://')
    ) {
      errors.push('Agent URI must start with agent://');
    }

    if (a2aConfig.handoff_protocol && !a2aConfig.service_discovery?.enabled) {
      warnings.push('Handoff protocol configured without service discovery');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
