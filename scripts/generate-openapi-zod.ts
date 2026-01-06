#!/usr/bin/env node
/**
 * Generate Zod schemas from OpenAPI specs
 * 
 * DRY, SOLID, ZOD, OPENAPI-FIRST
 */

import 'reflect-metadata';
import { container } from '../src/di-container.js';
import { CodegenService } from '../src/services/codegen/index.js';

async function main() {
  try {
    const codegenService = container.get(CodegenService);
    const results = await codegenService.generate('openapi-zod', false);
    
    console.log('OpenAPI → Zod Generation Results:');
    console.log('================================');
    
    for (const result of results) {
      console.log(`\n${result.generator}:`);
      console.log(`  Files created: ${result.filesCreated}`);
      console.log(`  Files updated: ${result.filesUpdated}`);
      if (result.errors.length > 0) {
        console.log(`  Errors:`);
        result.errors.forEach(e => console.log(`    - ${e}`));
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
