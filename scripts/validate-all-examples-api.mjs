import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const examplesPath = join(rootDir, 'website/public/examples.json');
const examples = JSON.parse(readFileSync(examplesPath, 'utf-8'));

const results = {
  total: examples.length,
  valid: [],
  invalid: [],
  errors: []
};

console.log(`Validating ${results.total} examples using website validation API...\n`);

async function validateExample(example) {
  const examplePath = join(rootDir, 'spec/v0.3.3/examples', example.path);
  
  try {
    const fs = await import('fs');
    if (!fs.existsSync(examplePath)) {
      console.log(`⚠ ${example.name} - File not found: ${example.path}`);
      results.errors.push({
        name: example.name,
        path: example.path,
        error: 'File not found'
      });
      return;
    }

    const content = readFileSync(examplePath, 'utf-8');
    
    if (example.path.endsWith('.ts')) {
      console.log(`⚠ ${example.name} - TypeScript file, skipping`);
      return;
    }

    // Use the website's validation API
    const response = await fetch('http://localhost:3000/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content,
        version: '0.3.3'
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.valid) {
      results.valid.push({
        name: example.name,
        path: example.path,
        category: example.category
      });
      console.log(`✓ ${example.name}`);
    } else {
      results.invalid.push({
        name: example.name,
        path: example.path,
        category: example.category,
        errors: result.errors || []
      });
      console.log(`✗ ${example.name}`);
      (result.errors || []).slice(0, 3).forEach(err => {
        console.log(`  - ${err.path || ''}: ${err.message}`);
      });
    }
  } catch (err) {
    results.errors.push({
      name: example.name,
      path: example.path,
      error: err.message
    });
    console.log(`✗ ${example.name} - Error: ${err.message}`);
  }
}

// Validate all examples sequentially
for (const example of examples) {
  await validateExample(example);
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
    (item.errors || []).slice(0, 5).forEach(err => {
      console.log(`  - ${err.path || ''}: ${err.message}`);
    });
  });
}

const resultsPath = join(rootDir, 'scripts/validation-results.json');
writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to: ${resultsPath}`);

process.exit(results.invalid.length > 0 || results.errors.length > 0 ? 1 : 0);
