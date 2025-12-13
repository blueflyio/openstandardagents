#!/usr/bin/env node
/**
 * OSSA Example Validator
 *
 * Validates YAML examples against the OSSA JSON Schema.
 * This is a DETERMINISTIC task - no LLM required.
 *
 * Usage: node validate-examples.js <schema-path> <examples-glob> [--strict]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'yaml';

// Initialize AJV with formats
function createValidator(schema) {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
  });
  addFormats(ajv);

  return ajv.compile(schema);
}

// Format AJV errors for readability
function formatErrors(errors) {
  if (!errors) return [];

  return errors.map(err => {
    const path = err.instancePath || '/';
    const message = err.message || 'Unknown error';
    const params = err.params ? JSON.stringify(err.params) : '';
    return `${path}: ${message}${params ? ` (${params})` : ''}`;
  });
}

// Validate a single file
function validateFile(filePath, validate) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = yaml.parse(content);

    const valid = validate(data);

    if (valid) {
      return { file: filePath, valid: true, errors: [] };
    } else {
      return {
        file: filePath,
        valid: false,
        errors: formatErrors(validate.errors),
      };
    }
  } catch (error) {
    return {
      file: filePath,
      valid: false,
      errors: [`Parse error: ${error.message}`],
    };
  }
}

// Main validation function
function validateExamples(schemaPath, examplesGlob, strict = true) {
  // Load schema
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);

  // Create validator
  const validate = createValidator(schema);

  // Find example files
  const files = globSync(examplesGlob, {
    ignore: ['**/node_modules/**', '**/.git/**'],
  });

  if (files.length === 0) {
    return {
      valid_count: 0,
      invalid_count: 0,
      total_count: 0,
      errors: [],
      report_path: null,
      message: `No files found matching: ${examplesGlob}`,
    };
  }

  // Validate each file
  const results = files.map(file => validateFile(file, validate));

  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.filter(r => !r.valid).length;
  const errors = results.filter(r => !r.valid).map(r => ({
    file: r.file,
    errors: r.errors,
  }));

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    schema: schemaPath,
    pattern: examplesGlob,
    summary: {
      total: files.length,
      valid: validCount,
      invalid: invalidCount,
      pass_rate: `${((validCount / files.length) * 100).toFixed(1)}%`,
    },
    results: results.map(r => ({
      file: r.file,
      status: r.valid ? 'PASS' : 'FAIL',
      errors: r.errors,
    })),
  };

  // Write report
  const reportPath = '/tmp/ossa-validation-report.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Exit with error if strict mode and failures exist
  const exitCode = strict && invalidCount > 0 ? 1 : 0;

  return {
    valid_count: validCount,
    invalid_count: invalidCount,
    total_count: files.length,
    errors: errors,
    report_path: reportPath,
    exit_code: exitCode,
  };
}

// CLI execution
if (process.argv[1].endsWith('validate-examples.js')) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: validate-examples.js <schema-path> <examples-glob> [--strict]');
    process.exit(1);
  }

  const schemaPath = args[0];
  const examplesGlob = args[1];
  const strict = args.includes('--strict');

  try {
    const result = validateExamples(schemaPath, examplesGlob, strict);
    console.log(JSON.stringify(result, null, 2));

    // Print summary to stderr for CI visibility
    console.error(`\nValidation Summary:`);
    console.error(`  Total:   ${result.total_count}`);
    console.error(`  Valid:   ${result.valid_count}`);
    console.error(`  Invalid: ${result.invalid_count}`);

    if (result.invalid_count > 0) {
      console.error(`\nFailed files:`);
      for (const err of result.errors) {
        console.error(`  ${err.file}:`);
        for (const e of err.errors) {
          console.error(`    - ${e}`);
        }
      }
    }

    process.exit(result.exit_code || 0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export { validateExamples };
