#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateJsonSchema(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const schema = JSON.parse(content);
    
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
    console.error(`❌ ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

const schemaFiles = [
  'src/api/agent-manifest.schema.json',
  'src/api/workflow.schema.json'
];

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