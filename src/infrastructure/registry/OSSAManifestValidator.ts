/**
 * OSSA Manifest Validator
 *
 * Validates OSSA agent manifests against the official schema.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import { join } from 'path';
import { IManifestValidator } from '../../domain/registry/IRegistryService';

export class OSSAManifestValidator implements IManifestValidator {
  private ajv: Ajv;
  private ossaSchema: any;

  constructor(schemaPath?: string) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
    addFormats(this.ajv);

    // Load OSSA schema
    const defaultSchemaPath = join(__dirname, '../../../spec/ossa-1.0.schema.json');
    this.ossaSchema = JSON.parse(readFileSync(schemaPath || defaultSchemaPath, 'utf-8'));
  }

  async validate(manifest: Buffer): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      // Parse manifest (supports YAML and JSON)
      let parsed: any;
      const content = manifest.toString('utf-8');

      try {
        // Try JSON first
        parsed = JSON.parse(content);
      } catch {
        // Fall back to YAML
        try {
          parsed = yaml.load(content) as any;
        } catch (yamlError) {
          return {
            valid: false,
            errors: ['Invalid YAML/JSON format']
          };
        }
      }

      // Validate against OSSA schema
      const validate = this.ajv.compile(this.ossaSchema);
      const valid = validate(parsed);

      if (!valid && validate.errors) {
        const errors = validate.errors.map((err) => {
          const path = err.instancePath || 'root';
          return `${path}: ${err.message}`;
        });

        return {
          valid: false,
          errors
        };
      }

      // Additional semantic validation
      const warnings: string[] = [];

      // Check for recommended fields
      if (!parsed.metadata?.description) {
        warnings.push('Missing recommended field: metadata.description');
      }

      if (!parsed.metadata?.documentation) {
        warnings.push('Missing recommended field: metadata.documentation');
      }

      if (!parsed.deployment?.resources) {
        warnings.push('Missing recommended field: deployment.resources');
      }

      return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  async verifySignature(manifest: Buffer, signature: Buffer): Promise<boolean> {
    // TODO: Implement GPG signature verification
    // For now, return false to indicate unverified
    // In production, use node-gpg or similar
    console.warn('Signature verification not yet implemented');
    return false;
  }
}
