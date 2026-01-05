import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load examples from website/public/examples.json
const examplesPath = join(rootDir, 'website/public/examples.json');
const examples = JSON.parse(readFileSync(examplesPath, 'utf-8'));

const results = {
  total: examples.length,
  valid: [],
  invalid: [],
  errors: []
};

console.log(`Validating ${results.total} examples...\n`);

// Import validation from website
const validateModule = await import('../website/lib/validate.ts');
const { validateManifest } = validateModule;

for (const example of examples) {
  try {
    if (example.path.endsWith('.ts')) {
      console.log(`⚠ ${example.name} - TypeScript, skipping`);
      continue;
    }

    if (!example.content) {
      console.log(`⚠ ${example.name} - No content`);
      results.errors.push({ name: example.name, path: example.path, error: 'No content' });
      continue;
    }

    const result = await validateManifest(example.content, { version: '0.3.3' });
    
    if (result.valid) {
      results.valid.push({ name: example.name, path: example.path, category: example.category });
      console.log(`✓ ${example.name}`);
    } else {
      results.invalid.push({ 
        name: example.name, 
        path: example.path, 
        category: example.category, 
        errors: result.errors 
      });
      console.log(`✗ ${example.name}`);
      result.errors.slice(0, 3).forEach(err => {
        console.log(`  - ${err.path || ''}: ${err.message}`);
      });
    }
  } catch (err) {
    results.errors.push({ name: example.name, path: example.path, error: err.message });
    console.log(`✗ ${example.name} - ${err.message}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total: ${results.total}`);
console.log(`Valid: ${results.valid.length}`);
console.log(`Invalid: ${results.invalid.length}`);
console.log(`Errors: ${results.errors.length}`);

if (results.invalid.length > 0) {
  console.log(`\n=== Invalid Examples ===`);
  results.invalid.forEach(item => {
    console.log(`\n${item.name} (${item.path}):`);
    item.errors.slice(0, 5).forEach(err => {
      console.log(`  - ${err.path || ''}: ${err.message}`);
    });
  });
}

const resultsPath = join(rootDir, 'scripts/validation-results.json');
writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to: ${resultsPath}`);

process.exit(results.invalid.length > 0 || results.errors.length > 0 ? 1 : 0);
