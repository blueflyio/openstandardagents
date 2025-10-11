#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface JsonSchema {
  $schema?: string;
  type?: string;
  properties?: Record<string, unknown>;
  anyOf?: unknown[];
  oneOf?: unknown[];
  [key: string]: unknown;
}

function validateJsonSchema(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const schema: JsonSchema = JSON.parse(content);

    // Basic validation - check it's valid JSON and has required schema properties
    if (!schema.$schema) {
      throw new Error('Missing $schema property');
    }

    if (!schema.type && !schema.properties && !schema.anyOf && !schema.oneOf) {
      throw new Error('Schema must have type, properties, anyOf, or oneOf');
    }

    console.log(`✅ ${path.basename(filePath)} is valid JSON Schema`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ ${path.basename(filePath)}: ${errorMessage}`);
    return false;
  }
}

const schemaFiles: string[] = ['src/api/agent-manifest.schema.json', 'src/api/workflow.schema.json'];

let allValid = true;

for (const file of schemaFiles) {
  if (fs.existsSync(file)) {
    if (!validateJsonSchema(file)) {
      allValid = false;
    }
  } else {
    console.error(`❌ ${file} not found`);
    allValid = false;
  }
}

if (allValid) {
  console.log('\n✅ All schemas are valid');
  process.exit(0);
} else {
  console.log('\n❌ Some schemas have errors');
  process.exit(1);
}
