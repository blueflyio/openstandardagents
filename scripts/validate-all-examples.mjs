import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const examplesPath = join(rootDir, 'website/public/examples.json');
const examples = JSON.parse(readFileSync(examplesPath, 'utf-8'));

const schemaPath = join(rootDir, 'website/public/schemas/ossa-0.3.3.schema.json');
let schema;
try {
  schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  // Remove $id to avoid reference resolution issues
  if (schema.$id) {
    delete schema.$id;
  }
} catch (err) {
  console.error(`Failed to load schema: ${err.message}`);
  process.exit(1);
}

const ajv = new Ajv({ 
  allErrors: true, 
  strict: false,
  validateSchema: false,
  loadSchema: async (uri) => {
    // Return empty schema for external references
    return {};
  }
});
addFormats(ajv);

let validate;
try {
  validate = ajv.compile(schema);
} catch (err) {
  console.error(`Failed to compile schema: ${err.message}`);
  process.exit(1);
}

const results = {
  total: examples.length,
  valid: [],
  invalid: [],
  errors: []
};

console.log(`Validating ${results.total} examples against OSSA v0.3.3 schema...\n`);

for (const example of examples) {
  const examplePath = join(rootDir, 'spec/v0.3.3/examples', example.path);
  
  try {
    if (!require('fs').existsSync(examplePath)) {
      console.log(`⚠ ${example.name} - File not found: ${example.path}`);
      results.errors.push({
        name: example.name,
        path: example.path,
        error: 'File not found'
      });
      continue;
    }

    const content = readFileSync(examplePath, 'utf-8');
    let parsed;
    
    if (example.path.endsWith('.json')) {
      parsed = JSON.parse(content);
    } else if (example.path.endsWith('.ts')) {
      console.log(`⚠ ${example.name} - TypeScript file, skipping`);
      continue;
    } else {
      parsed = yaml.parse(content);
    }
    
    const isValid = validate(parsed);
    
    if (isValid) {
      results.valid.push({
        name: example.name,
        path: example.path,
        category: example.category
      });
      console.log(`✓ ${example.name}`);
    } else {
      const errors = validate.errors || [];
      results.invalid.push({
        name: example.name,
        path: example.path,
        category: example.category,
        errors: errors.map(e => ({
          path: e.instancePath || e.schemaPath,
          message: e.message,
          params: e.params
        }))
      });
      console.log(`✗ ${example.name}`);
      errors.slice(0, 3).forEach(err => {
        console.log(`  - ${err.instancePath || err.schemaPath}: ${err.message}`);
      });
    }
  } catch (err) {
    results.errors.push({
      name: example.name,
      path: example.path,
      error: err.message
    });
    console.log(`✗ ${example.name} - Parse error: ${err.message}`);
  }
}

console.log(`\n=== Validation Summary ===`);
console.log(`Total: ${results.total}`);
console.log(`Valid: ${results.valid.length}`);
console.log(`Invalid: ${results.invalid.length}`);
console.log(`Parse Errors: ${results.errors.length}`);

if (results.invalid.length > 0) {
  console.log(`\n=== Invalid Examples ===`);
  results.invalid.forEach(item => {
    console.log(`\n${item.name} (${item.path}):`);
    item.errors.slice(0, 5).forEach(err => {
      console.log(`  - ${err.path}: ${err.message}`);
    });
  });
}

const resultsPath = join(rootDir, 'scripts/validation-results.json');
writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to: ${resultsPath}`);

process.exit(results.invalid.length > 0 || results.errors.length > 0 ? 1 : 0);
