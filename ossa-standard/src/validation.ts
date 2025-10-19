import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'yaml';
import manifestSchema from '../spec/schemas/agent-manifest.schema.json';

export interface ValidationResult {
  valid: boolean;
  errors?: any[];
}

const ajv = new Ajv({
  allErrors: true,
  strict: true,
});
addFormats(ajv);

const validateManifest = ajv.compile(manifestSchema);

export async function validateAgent(agentPath: string): Promise<ValidationResult> {
  try {
    const manifestPath = path.join(agentPath, 'manifest.json');
    
    if (!(await fs.pathExists(manifestPath))) {
      throw new Error(`No manifest.json found in ${agentPath}`);
    }

    const manifest = await fs.readJson(manifestPath);
    const valid = validateManifest(manifest);

    if (!valid) {
      return {
        valid: false,
        errors: validateManifest.errors,
      };
    }

    // Check if entrypoint exists if specified
    if (manifest.entrypoint) {
      const entrypointPath = path.join(agentPath, manifest.entrypoint);
      if (!(await fs.pathExists(entrypointPath))) {
        return {
          valid: false,
          errors: [{ message: `Entrypoint not found: ${entrypointPath}` }],
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: [{ message: error.message }],
    };
  }
}

export function validateManifestYaml(yamlContent: string): ValidationResult {
  try {
    const manifest = yaml.parse(yamlContent);
    const valid = validateManifest(manifest);
    
    return {
      valid,
      errors: valid ? undefined : validateManifest.errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ message: `Invalid YAML: ${error.message}` }],
    };
  }
}
