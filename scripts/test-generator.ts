#!/usr/bin/env node
/**
 * Test script to generate Zod schemas from OpenAPI
 */

import 'reflect-metadata';
import { container } from '../src/di-container.js';
import { CodegenService } from '../src/services/codegen/index.js';

async function main() {
  try {
    console.log('Generating Zod schemas from OpenAPI specs...\n');
    
    const codegenService = container.get(CodegenService);
    const results = await codegenService.generate('openapi-zod', false);
    
    console.log('Results:');
    console.log('========\n');
    
    for (const result of results) {
      const status = result.errors.length > 0 ? '❌' : '✅';
      console.log(`${status} ${result.generator}`);
      console.log(`   Files created: ${result.filesCreated}`);
      console.log(`   Files updated: ${result.filesUpdated}`);
      if (result.errors.length > 0) {
        console.log(`   Errors:`);
        result.errors.forEach(e => console.log(`     - ${e}`));
      }
      console.log('');
    }
    
    const totalCreated = results.reduce((sum, r) => sum + r.filesCreated, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.filesUpdated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    
    console.log(`Total: ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors\n`);
    
    if (totalErrors > 0) {
      process.exit(1);
    }
    
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
