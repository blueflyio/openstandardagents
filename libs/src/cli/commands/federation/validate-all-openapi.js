#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateOpenAPIFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        error: 'File not found',
        filePath: relativePath
      };
    }

    // Try to parse YAML/JSON to check syntax
    const content = fs.readFileSync(filePath, 'utf8');
    let spec;

    try {
      if (filePath.endsWith('.json')) {
        spec = JSON.parse(content);
      } else {
        spec = yaml.load(content);
      }
    } catch (parseError) {
      return {
        valid: false,
        error: `Parse error: ${parseError.message}`,
        filePath: relativePath
      };
    }

    // Check for basic OpenAPI structure
    if (!spec) {
      return {
        valid: false,
        error: 'Empty specification',
        filePath: relativePath
      };
    }

    // Check OpenAPI version
    const version = spec.openapi || spec.swagger;
    if (!version) {
      return {
        valid: false,
        error: 'Missing openapi or swagger version field',
        filePath: relativePath
      };
    }

    // Validate using swagger-cli
    try {
      execSync(`npx swagger-cli validate "${filePath}"`, {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      return {
        valid: true,
        version: version,
        title: spec.info?.title || 'Untitled',
        filePath: relativePath
      };
    } catch (validationError) {
      const errorOutput = validationError.stdout?.toString() || validationError.stderr?.toString() || validationError.message;
      return {
        valid: false,
        error: `Validation failed: ${errorOutput.trim()}`,
        filePath: relativePath
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `Unexpected error: ${error.message}`,
      filePath: relativePath
    };
  }
}

async function main() {
  log(colors.bold + colors.cyan, '🔍 OSSA OpenAPI Specification Validation Report');
  log(colors.cyan, '=' .repeat(60));

  // Find all OpenAPI files
  const { execSync } = require('child_process');
  const findCommand = `find . -path "./node_modules" -prune -o \\( -name "*.yaml" -o -name "*.yml" \\) -print | grep -v node_modules | grep -E "(openapi|swagger|specification)"`;

  let openApiFiles = [];
  try {
    const output = execSync(findCommand, { encoding: 'utf8' });
    openApiFiles = output.trim().split('\n').filter(f => f.trim());
  } catch (error) {
    log(colors.red, 'Error finding OpenAPI files: ' + error.message);
    process.exit(1);
  }

  if (openApiFiles.length === 0) {
    log(colors.yellow, 'No OpenAPI specification files found.');
    return;
  }

  log(colors.blue, `Found ${openApiFiles.length} OpenAPI specification files`);
  console.log('');

  const results = [];
  let validCount = 0;
  let errorCount = 0;

  // Validate each file
  for (const file of openApiFiles) {
    const fullPath = path.resolve(file.replace('./'));
    log(colors.cyan, `Validating: ${file}`);

    const result = validateOpenAPIFile(fullPath);
    results.push(result);

    if (result.valid) {
      log(colors.green, `  ✅ Valid (${result.version}) - ${result.title}`);
      validCount++;
    } else {
      log(colors.red, `  ❌ Invalid: ${result.error}`);
      errorCount++;
    }
    console.log('');
  }

  // Summary report
  log(colors.bold + colors.cyan, 'VALIDATION SUMMARY');
  log(colors.cyan, '=' .repeat(30));
  log(colors.green, `Valid specifications: ${validCount}`);
  log(colors.red, `Invalid specifications: ${errorCount}`);
  log(colors.blue, `Total files processed: ${results.length}`);

  if (errorCount > 0) {
    console.log('');
    log(colors.bold + colors.red, 'FAILED VALIDATIONS:');
    log(colors.red, '-' .repeat(20));

    results
      .filter(r => !r.valid)
      .forEach(result => {
        log(colors.red, `📄 ${result.filePath}`);
        log(colors.red, `   Error: ${result.error}`);
        console.log('');
      });
  }

  // OpenAPI version analysis
  const versions = {};
  results
    .filter(r => r.valid && r.version)
    .forEach(r => {
      versions[r.version] = (versions[r.version] || 0) + 1;
    });

  if (Object.keys(versions).length > 0) {
    console.log('');
    log(colors.bold + colors.blue, 'VERSION ANALYSIS:');
    log(colors.blue, '-' .repeat(17));
    Object.entries(versions).forEach(([version, count]) => {
      log(colors.blue, `${version}: ${count} specifications`);
    });
  }

  // Exit with error code if there are validation failures
  if (errorCount > 0) {
    console.log('');
    log(colors.red, `❌ Validation completed with ${errorCount} errors`);
    process.exit(1);
  } else {
    console.log('');
    log(colors.green, '✅ All OpenAPI specifications are valid!');
    process.exit(0);
  }
}

main().catch(error => {
  log(colors.red, 'Script error: ' + error.message);
  process.exit(1);
});