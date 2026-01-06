#!/usr/bin/env node
/**
 * Run OpenAPI-Zod generator directly
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Import the generator directly
const { OpenAPIZodGenerator } = await import('../src/services/codegen/generators/openapi-zod.generator.js');

async function main() {
  try {
    console.log('Generating Zod schemas from OpenAPI specs...\n');
    
    const generator = new OpenAPIZodGenerator();
    const result = await generator.generate(false);
    
    console.log('Results:');
    console.log('========\n');
    console.log(`Generator: ${result.generator}`);
    console.log(`Files created: ${result.filesCreated}`);
    console.log(`Files updated: ${result.filesUpdated}`);
    
    if (result.errors.length > 0) {
      console.log(`\nErrors:`);
      result.errors.forEach(e => console.log(`  - ${e}`));
      process.exit(1);
    }
    
    console.log('\n✅ Generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
