#!/usr/bin/env npx tsx
/**
 * OSSA OpenAPI Extensions Validator
 *
 * Validates OpenAPI 3.x documents for OSSA extension compliance.
 * Uses AJV to validate against the OSSA OpenAPI extensions JSON Schema.
 *
 * Usage:
 *   npx tsx src/tools/validation/validate-openapi-extensions.ts <file1.yaml> [file2.yaml] ...
 *   npx tsx src/tools/validation/validate-openapi-extensions.ts openapi/*.yaml
 *
 * Exit codes:
 *   0 - All files valid
 *   1 - Validation errors found
 *   2 - Runtime error (file not found, parse error, etc.)
 *
 * @see https://openstandardagents.org/docs/openapi-extensions
 * @license Apache-2.0
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Schema path resolution
const POSSIBLE_PATHS = [
  // Source structure: src/tools/validation -> ../../../spec
  resolve(
    __dirname,
    '../../../spec/extensions/openapi/ossa-openapi-extensions.schema.json'
  ),
  // Dist structure: dist/tools/validation -> ../../spec
  resolve(
    __dirname,
    '../../spec/extensions/openapi/ossa-openapi-extensions.schema.json'
  ),
  // Legacy/Fallback
  resolve(
    __dirname,
    '../spec/extensions/openapi/ossa-openapi-extensions.schema.json'
  ),
];

const SCHEMA_PATH =
  POSSIBLE_PATHS.find((p) => existsSync(p)) || POSSIBLE_PATHS[0];

// Result types
interface ValidationResult {
  file: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  ossaExtensions: {
    hasMetadata: boolean;
    hasOssa: boolean;
    hasAgent: boolean;
    operationExtensions: number;
  };
}

interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

interface ValidationWarning {
  path: string;
  message: string;
}

// Load schema
function loadSchema(): Record<string, unknown> {
  if (!existsSync(SCHEMA_PATH)) {
    console.error(chalk.red(`Schema not found at ${SCHEMA_PATH}`));
    console.error(
      chalk.yellow('Run: npm run build to ensure schema files are in place')
    );
    process.exit(2);
  }

  try {
    return JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  } catch (error) {
    console.error(chalk.red(`Failed to load schema: ${error}`));
    process.exit(2);
  }
}

// Initialize AJV validator
function createValidator(schema: Record<string, unknown>): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: true,
    verbose: true,
  });

  addFormats(ajv);
  ajv.addSchema(schema, 'ossa-openapi-extensions');

  return ajv;
}

// Parse file content (YAML or JSON)
function parseFile(filePath: string): Record<string, unknown> {
  const content = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  if (ext === '.json') {
    return JSON.parse(content);
  } else if (ext === '.yaml' || ext === '.yml') {
    return parseYaml(content) as Record<string, unknown>;
  } else {
    // Try YAML first, then JSON
    try {
      return parseYaml(content) as Record<string, unknown>;
    } catch {
      return JSON.parse(content);
    }
  }
}

// Count OSSA extensions in operations
function countOperationExtensions(doc: Record<string, unknown>): number {
  let count = 0;
  const paths = doc.paths as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (!paths) return 0;

  const methods = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
  ];

  for (const pathItem of Object.values(paths)) {
    for (const method of methods) {
      const operation = pathItem[method] as Record<string, unknown> | undefined;
      if (operation) {
        if (operation['x-ossa-capability']) count++;
        if (operation['x-ossa-autonomy']) count++;
        if (operation['x-ossa-constraints']) count++;
        if (operation['x-ossa-tools']) count++;
        if (operation['x-ossa-llm']) count++;
      }
    }
  }

  return count;
}

// Generate warnings for missing recommended extensions
function generateWarnings(doc: Record<string, unknown>): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Check for x-ossa-metadata
  if (!doc['x-ossa-metadata']) {
    warnings.push({
      path: '/',
      message:
        'Missing x-ossa-metadata extension. Consider adding OSSA metadata for compliance tracking.',
    });
  } else {
    const metadata = doc['x-ossa-metadata'] as Record<string, unknown>;
    if (!metadata.compliance) {
      warnings.push({
        path: '/x-ossa-metadata',
        message:
          'Missing compliance configuration. Consider adding compliance level and frameworks.',
      });
    }
    if (!metadata.observability) {
      warnings.push({
        path: '/x-ossa-metadata',
        message:
          'Missing observability configuration. Consider enabling tracing, metrics, and logging.',
      });
    }
  }

  // Check for x-ossa
  if (!doc['x-ossa']) {
    warnings.push({
      path: '/',
      message:
        'Missing x-ossa extension. Agent identification is recommended for OSSA compliance.',
    });
  }

  // Check paths for operation-level extensions
  const paths = doc.paths as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (paths) {
    const methods = [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ];

    for (const [pathKey, pathItem] of Object.entries(paths)) {
      for (const method of methods) {
        const operation = pathItem[method] as
          | Record<string, unknown>
          | undefined;
        if (operation && operation.operationId) {
          // Check for missing capability extension
          if (!operation['x-ossa-capability']) {
            warnings.push({
              path: `/paths${pathKey}/${method}`,
              message: `Operation ${operation.operationId} missing x-ossa-capability. Consider linking to an agent capability.`,
            });
          }
          // Check for missing autonomy extension on write operations
          if (
            ['post', 'put', 'patch', 'delete'].includes(method) &&
            !operation['x-ossa-autonomy']
          ) {
            warnings.push({
              path: `/paths${pathKey}/${method}`,
              message: `Write operation ${operation.operationId} missing x-ossa-autonomy. Consider defining autonomy level.`,
            });
          }
        }
      }
    }
  }

  return warnings;
}

// Validate a single file
function validateFile(filePath: string, ajv: Ajv): ValidationResult {
  const absolutePath = resolve(filePath);

  // Check file exists
  if (!existsSync(absolutePath)) {
    return {
      file: absolutePath,
      valid: false,
      errors: [
        {
          path: '/',
          message: `File not found: ${absolutePath}`,
        },
      ],
      warnings: [],
      ossaExtensions: {
        hasMetadata: false,
        hasOssa: false,
        hasAgent: false,
        operationExtensions: 0,
      },
    };
  }

  // Parse file
  let doc: Record<string, unknown>;
  try {
    doc = parseFile(absolutePath);
  } catch (error) {
    return {
      file: absolutePath,
      valid: false,
      errors: [
        {
          path: '/',
          message: `Parse error: ${error}`,
        },
      ],
      warnings: [],
      ossaExtensions: {
        hasMetadata: false,
        hasOssa: false,
        hasAgent: false,
        operationExtensions: 0,
      },
    };
  }

  // Check if it's an OpenAPI document
  if (!doc.openapi) {
    return {
      file: absolutePath,
      valid: false,
      errors: [
        {
          path: '/openapi',
          message:
            'Missing openapi field. This does not appear to be an OpenAPI 3.x document.',
        },
      ],
      warnings: [],
      ossaExtensions: {
        hasMetadata: false,
        hasOssa: false,
        hasAgent: false,
        operationExtensions: 0,
      },
    };
  }

  // Validate against schema
  const validate = ajv.getSchema('ossa-openapi-extensions');
  if (!validate) {
    return {
      file: absolutePath,
      valid: false,
      errors: [
        {
          path: '/',
          message: 'Schema not properly loaded',
        },
      ],
      warnings: [],
      ossaExtensions: {
        hasMetadata: false,
        hasOssa: false,
        hasAgent: false,
        operationExtensions: 0,
      },
    };
  }

  const valid = validate(doc) as boolean;
  const errors: ValidationError[] = [];

  if (!valid && validate.errors) {
    for (const error of validate.errors) {
      errors.push({
        path: error.instancePath || '/',
        message: error.message || 'Validation error',
        keyword: error.keyword,
        params: error.params as Record<string, unknown>,
      });
    }
  }

  // Generate warnings
  const warnings = generateWarnings(doc);

  // Count OSSA extensions
  const ossaExtensions = {
    hasMetadata: !!doc['x-ossa-metadata'],
    hasOssa: !!doc['x-ossa'],
    hasAgent: !!doc['x-agent'],
    operationExtensions: countOperationExtensions(doc),
  };

  return {
    file: absolutePath,
    valid,
    errors,
    warnings,
    ossaExtensions,
  };
}

// Print validation result
function printResult(result: ValidationResult): void {
  console.log(chalk.blue(`\nValidating: ${result.file}`));
  console.log(chalk.gray('-'.repeat(80)));

  if (result.valid) {
    console.log(chalk.green('  Status: VALID'));
  } else {
    console.log(chalk.red('  Status: INVALID'));
  }

  // Print OSSA extension summary
  console.log(chalk.cyan('\n  OSSA Extensions Found:'));
  console.log(
    `    x-ossa-metadata: ${result.ossaExtensions.hasMetadata ? chalk.green('Yes') : chalk.yellow('No')}`
  );
  console.log(
    `    x-ossa: ${result.ossaExtensions.hasOssa ? chalk.green('Yes') : chalk.yellow('No')}`
  );
  console.log(
    `    x-agent: ${result.ossaExtensions.hasAgent ? chalk.green('Yes') : chalk.yellow('No')}`
  );
  console.log(
    `    Operation-level extensions: ${result.ossaExtensions.operationExtensions}`
  );

  // Print errors
  if (result.errors.length > 0) {
    console.log(chalk.red('\n  Errors:'));
    for (const error of result.errors) {
      console.log(chalk.red(`    ${error.path}: ${error.message}`));
      if (error.keyword) {
        console.log(chalk.gray(`      (keyword: ${error.keyword})`));
      }
    }
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log(chalk.yellow('\n  Warnings:'));
    for (const warning of result.warnings) {
      console.log(chalk.yellow(`    ${warning.path}: ${warning.message}`));
    }
  }
}

// Print summary
function printSummary(results: ValidationResult[]): void {
  console.log(chalk.gray('\n' + '='.repeat(80)));
  console.log(chalk.blue('\nValidation Summary'));
  console.log(chalk.gray('-'.repeat(80)));

  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.length - validCount;
  const totalWarnings = results.reduce((acc, r) => acc + r.warnings.length, 0);
  const totalOssaExtensions = results.reduce(
    (acc, r) =>
      acc +
      (r.ossaExtensions.hasMetadata ? 1 : 0) +
      (r.ossaExtensions.hasOssa ? 1 : 0) +
      (r.ossaExtensions.hasAgent ? 1 : 0) +
      r.ossaExtensions.operationExtensions,
    0
  );

  console.log(`  Files validated: ${results.length}`);
  console.log(chalk.green(`  Valid: ${validCount}`));
  if (invalidCount > 0) {
    console.log(chalk.red(`  Invalid: ${invalidCount}`));
  }
  console.log(chalk.yellow(`  Warnings: ${totalWarnings}`));
  console.log(chalk.cyan(`  Total OSSA extensions: ${totalOssaExtensions}`));

  if (invalidCount === 0) {
    console.log(chalk.green('\n  All files are valid OSSA OpenAPI documents!'));
  } else {
    console.log(
      chalk.red('\n  Some files failed validation. See errors above.')
    );
  }
}

// Main function
function main(): void {
  const args = process.argv.slice(2);

  // Help message
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(chalk.blue('OSSA OpenAPI Extensions Validator\n'));
    console.log('Usage:');
    console.log(
      '  npx tsx src/tools/validation/validate-openapi-extensions.ts <file1.yaml> [file2.yaml] ...'
    );
    console.log(
      '  npx tsx src/tools/validation/validate-openapi-extensions.ts openapi/*.yaml\n'
    );
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --quiet, -q    Only show errors (no warnings)');
    console.log('  --json         Output results as JSON\n');
    console.log('Exit codes:');
    console.log('  0 - All files valid');
    console.log('  1 - Validation errors found');
    console.log('  2 - Runtime error\n');
    console.log('Examples:');
    console.log(
      '  npx tsx src/tools/validation/validate-openapi-extensions.ts openapi/agent-crud.yaml'
    );
    console.log(
      '  find openapi -name "*.yaml" | xargs npx tsx src/tools/validation/validate-openapi-extensions.ts'
    );
    process.exit(0);
  }

  // Parse options
  const quiet = args.includes('--quiet') || args.includes('-q');
  const jsonOutput = args.includes('--json');
  const files = args.filter(
    (arg) => !arg.startsWith('-') && !arg.startsWith('--')
  );

  if (files.length === 0) {
    console.error(chalk.red('No files specified'));
    process.exit(2);
  }

  // Load schema and create validator
  const schema = loadSchema();
  const ajv = createValidator(schema);

  // Validate files
  const results: ValidationResult[] = [];
  for (const file of files) {
    const result = validateFile(file, ajv);
    results.push(result);

    if (!jsonOutput) {
      if (!quiet || !result.valid || result.errors.length > 0) {
        printResult(result);
      }
    }
  }

  // Output
  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printSummary(results);
  }

  // Exit with appropriate code
  const hasErrors = results.some((r) => !r.valid);
  process.exit(hasErrors ? 1 : 0);
}

// Run
main();

export { validateFile, ValidationResult, ValidationError, ValidationWarning };
