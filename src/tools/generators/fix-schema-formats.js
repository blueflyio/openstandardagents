#!/usr/bin/env node

/**
 * Fix unsupported format constraints in JSON schemas
 * Removes format constraints that aren't supported by ajv-cli
 */

const fs = require('fs');
const path = require('path');

const UNSUPPORTED_FORMATS = ['uri'];
const SPEC_DIR = path.join(__dirname, '..', 'spec');

function fixSchema(schemaPath) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(content);
  
  let fixed = false;
  
  function walk(obj) {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (obj.format && UNSUPPORTED_FORMATS.includes(obj.format)) {
      delete obj.format;
      fixed = true;
    }
    
    for (const key in obj) {
      walk(obj[key]);
    }
  }
  
  walk(schema);
  
  if (fixed) {
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + '\n');
    return true;
  }
  
  return false;
}

function findSchemas(dir) {
  const schemas = [];
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.name.endsWith('.schema.json')) {
        schemas.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return schemas;
}

console.log('[FIX] Fixing schema format constraints...\n');

const schemas = findSchemas(SPEC_DIR);
let fixedCount = 0;

for (const schemaPath of schemas) {
  const relative = path.relative(process.cwd(), schemaPath);
  
  try {
    if (fixSchema(schemaPath)) {
      console.log(`✓ Fixed: ${relative}`);
      fixedCount++;
    }
  } catch (err) {
    console.error(`✗ Error in ${relative}: ${err.message}`);
  }
}

console.log(`\n${fixedCount} schema(s) fixed`);
