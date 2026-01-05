import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateManifest } from './lib/validate.ts';

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

console.log(`Validating ${results.total} examples...\n`);

for (const example of examples) {
  const examplePath = join(rootDir, 'spec/v0.3.3/examples', example.path);
  
  try {
    const fs = await import('fs');
    if (!fs.existsSync(examplePath)) {
      console.log(`⚠ ${example.name} - File not found`);
      results.errors.push({ name: example.name, path: example.path, error: 'File not found' });
      continue;
    }

    const content = readFileSync(examplePath, 'utf-8');
    
    if (example.path.endsWith('.ts')) {
      console.log(`⚠ ${example.name} - TypeScript, skipping`);
      continue;
    }

    const result = await validateManifest(content, { version: '0.3.3' });
    
    if (result.valid) {
      results.valid.push({ name: example.name, path: example.path, category: example.category });
      console.log(`✓ ${example.name}`);
    } else {
      results.invalid.push({ name: example.name, path: example.path, category: example.category, errors: result.errors });
      console.log(`✗ ${example.name}`);
      result.errors.slice(0, 3).forEach(err => console.log(`  - ${err.path}: ${err.message}`));
    }
  } catch (err) {
    results.errors.push({ name: example.name, path: example.path, error: err.message });
    console.log(`✗ ${example.name} - ${err.message}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Valid: ${results.valid.length}/${results.total}`);
console.log(`Invalid: ${results.invalid.length}`);
console.log(`Errors: ${results.errors.length}`);

writeFileSync(join(rootDir, 'scripts/validation-results.json'), JSON.stringify(results, null, 2));
process.exit(results.invalid.length > 0 || results.errors.length > 0 ? 1 : 0);
