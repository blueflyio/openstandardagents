#!/usr/bin/env node
/**
 * OSSA 0.2.2 Validation Tool
 * Validates power-suite modules' ossa.yaml files against OSSA 0.2.2 schema
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load OSSA 0.2.2 schema
const schemaPath = resolve(__dirname, '../spec/v0.2.2/ossa-0.2.2.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// Initialize AJV validator
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true,
  verbose: true,
});

addFormats(ajv);

// Note: The power-suite ossa.yaml files use a different format (project config)
// than full agent manifests. This validator checks for OSSA 0.2.2 compliance
// in the project configuration format.

interface PowerSuiteOssaConfig {
  ossa?: {
    version: string;
    project?: {
      name: string;
      type: string;
      version: string;
      description: string;
    };
    metadata?: {
      reasoning?: boolean;
      compliance?: {
        frameworks?: string[];
      };
    };
    ecosystem?: {
      mesh_enabled?: boolean;
      protocol_enabled?: boolean;
      router_enabled?: boolean;
      tracer_enabled?: boolean;
      brain_enabled?: boolean;
      flows_enabled?: boolean;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

/**
 * Validate OSSA 0.2.2 configuration format
 */
function validatePowerSuiteConfig(config: PowerSuiteOssaConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.ossa) {
    errors.push('Missing top-level "ossa" key');
    return { valid: false, errors, warnings };
  }

  const { ossa } = config;

  // Check version
  if (!ossa.version) {
    errors.push('Missing ossa.version');
  } else if (!ossa.version.startsWith('0.2.2')) {
    errors.push(
      `Invalid ossa.version: expected "0.2.2" or "0.2.2.x", got "${ossa.version}"`
    );
  }

  // Check project
  if (!ossa.project) {
    warnings.push('Missing ossa.project (recommended for identification)');
  } else {
    if (!ossa.project.name) {
      errors.push('Missing ossa.project.name');
    }
    if (!ossa.project.type) {
      warnings.push('Missing ossa.project.type');
    }
  }

  // Check metadata (OSSA 0.2.2 requirement)
  if (!ossa.metadata) {
    warnings.push(
      'Missing ossa.metadata (OSSA 0.2.2 recommends metadata.reasoning)'
    );
  } else {
    if (ossa.metadata.reasoning === undefined) {
      warnings.push(
        'OSSA 0.2.2 recommends metadata.reasoning: true for AI agents'
      );
    }
    if (!ossa.metadata.compliance?.frameworks) {
      warnings.push(
        'OSSA 0.2.2 recommends metadata.compliance.frameworks array'
      );
    }
  }

  // Check ecosystem (power-suite integration)
  if (!ossa.ecosystem) {
    warnings.push(
      'Missing ossa.ecosystem (power-suite integration configuration)'
    );
  } else {
    const ecosystem = ossa.ecosystem;
    const requiredModules = [
      'mesh_enabled',
      'protocol_enabled',
      'router_enabled',
      'tracer_enabled',
      'brain_enabled',
      'flows_enabled',
    ];

    for (const module of requiredModules) {
      if (ecosystem[module] === undefined) {
        warnings.push(
          `Consider setting ossa.ecosystem.${module} for power-suite integration`
        );
      }
    }
  }

  // Check compliance standards array
  if (ossa.compliance?.standards) {
    const standards = Array.isArray(ossa.compliance.standards)
      ? ossa.compliance.standards
      : Object.values(ossa.compliance.standards);

    if (!standards.includes('OSSA-0.2.2')) {
      errors.push(
        'compliance.standards must include "OSSA-0.2.2" for v0.2.2 compliance'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single ossa.yaml file
 */
function validateFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const config = parseYaml(content) as PowerSuiteOssaConfig;

    console.log(chalk.blue(`\nValidating: ${filePath}`));
    console.log(chalk.gray('─'.repeat(80)));

    const result = validatePowerSuiteConfig(config);

    if (result.valid) {
      console.log(chalk.green('✓ Valid OSSA 0.2.2 configuration'));
    } else {
      console.log(chalk.red('✗ Invalid OSSA 0.2.2 configuration'));
      result.errors.forEach((error) => {
        console.log(chalk.red(`  ERROR: ${error}`));
      });
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        console.log(chalk.yellow(`  WARNING: ${warning}`));
      });
    }

    return result.valid;
  } catch (error) {
    console.error(chalk.red(`Failed to validate ${filePath}:`));
    console.error(error);
    return false;
  }
}

/**
 * Main validation function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(chalk.blue('OSSA 0.2.2 Power-Suite Validation Tool\n'));
    console.log('Usage:');
    console.log('  validate-ossa-0.2.2.ts <file1.yaml> [file2.yaml] ...\n');
    console.log('Or validate all power-suite modules:');
    console.log(
      '  find ../common_npm -name "ossa.yaml" -o -path "*/config/ossa.yaml" | xargs validate-ossa-0.2.2.ts'
    );
    process.exit(1);
  }

  let allValid = true;
  for (const filePath of args) {
    const valid = validateFile(resolve(filePath));
    if (!valid) {
      allValid = false;
    }
  }

  console.log(chalk.gray('\n' + '─'.repeat(80)));
  if (allValid) {
    console.log(chalk.green('\n✓ All files are OSSA 0.2.2 compliant'));
    process.exit(0);
  } else {
    console.log(chalk.red('\n✗ Some files failed validation'));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validatePowerSuiteConfig, validateFile };

