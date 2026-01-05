/**
 * OSSA CLI: Validate command
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { glob } from 'glob';

interface ValidationOptions {
  version?: string;
  strict?: boolean;
  format?: 'json' | 'yaml' | 'table';
  verbose?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

async function validateManifest(path: string, options: ValidationOptions): Promise<void> {
  const resolvedPath = resolve(path);
  const files = await glob(resolvedPath, { absolute: true });

  if (files.length === 0) {
    console.error(`No files found matching: ${path}`);
    process.exit(1);
  }

  const results: ValidationResult[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const manifest = parseYaml(content);
      
      const result = validateOSSA(manifest, options);
      results.push(result);

      if (options.format === 'table') {
        console.log(`\n${file}:`);
        if (result.valid) {
          console.log('  ✅ Valid');
        } else {
          console.log('  ❌ Invalid');
          result.errors.forEach(err => console.log(`    - ${err}`));
        }
        if (result.warnings.length > 0) {
          result.warnings.forEach(warn => console.log(`    ⚠️  ${warn}`));
        }
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
      results.push({
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      });
    }
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(results, null, 2));
  }

  const allValid = results.every(r => r.valid);
  process.exit(allValid ? 0 : 1);
}

function parseYaml(content: string): any {
  // Simple YAML parser - in production use js-yaml
  try {
    return JSON.parse(content);
  } catch {
    // Fallback to basic YAML parsing
    const lines = content.split('\n');
    const result: any = {};
    let currentKey = '';
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        currentKey = match[1];
        result[currentKey] = match[2].trim();
      }
    }
    
    return result;
  }
}

function validateOSSA(manifest: any, options: ValidationOptions): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!manifest.apiVersion) {
    errors.push('Missing apiVersion');
  } else if (manifest.apiVersion !== `ossa/${options.version || '0.3.2'}`) {
    warnings.push(`apiVersion ${manifest.apiVersion} does not match expected ${options.version || '0.3.2'}`);
  }

  if (!manifest.kind) {
    errors.push('Missing kind');
  } else if (manifest.kind !== 'Agent') {
    errors.push(`Invalid kind: ${manifest.kind}, expected Agent`);
  }

  if (!manifest.metadata) {
    errors.push('Missing metadata');
  } else {
    if (!manifest.metadata.name) {
      errors.push('Missing metadata.name');
    }
    if (!manifest.metadata.namespace) {
      warnings.push('Missing metadata.namespace');
    }
  }

  if (!manifest.spec) {
    errors.push('Missing spec');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export { validateManifest };
