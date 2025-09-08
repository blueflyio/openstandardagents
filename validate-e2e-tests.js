#!/usr/bin/env node

/**
 * Validation script for OSSA E2E tests
 * Performs structural validation of test files without TypeScript compilation
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const E2E_TEST_DIR = join(__dirname, 'tests/e2e');
const FIXTURES_DIR = join(__dirname, 'tests/fixtures');

console.log('🧪 OSSA E2E Test Suite Validation\n');

// Validation results
const results = {
  testFiles: 0,
  fixtureFiles: 0,
  errors: [],
  warnings: [],
  summary: {
    totalTestSuites: 0,
    totalTests: 0,
    totalDescribeBlocks: 0
  }
};

function validateFileStructure(filePath, content) {
  const fileName = filePath.split('/').pop();
  let localErrors = [];
  let localWarnings = [];
  
  // Check for basic test structure
  if (!content.includes('describe(')) {
    localErrors.push(`${fileName}: Missing describe blocks`);
  }
  
  if (!content.includes('it(')) {
    localErrors.push(`${fileName}: Missing test cases`);
  }
  
  if (!content.includes('expect(')) {
    localWarnings.push(`${fileName}: No expectations found`);
  }
  
  // Check for imports
  if (!content.includes('import')) {
    localErrors.push(`${fileName}: Missing imports`);
  }
  
  // Count test structures
  const describeMatches = content.match(/describe\(/g) || [];
  const itMatches = content.match(/it\(/g) || [];
  
  results.summary.totalDescribeBlocks += describeMatches.length;
  results.summary.totalTests += itMatches.length;
  
  if (fileName.includes('.test.ts')) {
    results.summary.totalTestSuites++;
  }
  
  return { errors: localErrors, warnings: localWarnings };
}

function validateTestFiles() {
  console.log('📁 Validating E2E test files...');
  
  try {
    const testFiles = readdirSync(E2E_TEST_DIR).filter(f => f.endsWith('.test.ts'));
    
    for (const file of testFiles) {
      const filePath = join(E2E_TEST_DIR, file);
      const content = readFileSync(filePath, 'utf8');
      
      console.log(`  ✓ ${file}`);
      const validation = validateFileStructure(filePath, content);
      results.errors.push(...validation.errors);
      results.warnings.push(...validation.warnings);
      results.testFiles++;
    }
    
    console.log(`  Found ${testFiles.length} test files\n`);
  } catch (error) {
    results.errors.push(`Error reading E2E test directory: ${error.message}`);
  }
}

function validateFixtures() {
  console.log('🔧 Validating fixture files...');
  
  try {
    const fixtureFiles = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.ts'));
    
    for (const file of fixtureFiles) {
      const filePath = join(FIXTURES_DIR, file);
      const content = readFileSync(filePath, 'utf8');
      
      console.log(`  ✓ ${file}`);
      
      // Check for export statements
      if (!content.includes('export')) {
        results.warnings.push(`${file}: No exports found`);
      }
      
      results.fixtureFiles++;
    }
    
    console.log(`  Found ${fixtureFiles.length} fixture files\n`);
  } catch (error) {
    results.errors.push(`Error reading fixtures directory: ${error.message}`);
  }
}

function validateTestCoverage() {
  console.log('📊 Validating test coverage areas...');
  
  const requiredTestAreas = [
    'eight-phase-lifecycle',
    'agent-lifecycle-manager', 
    'multi-agent-coordination',
    'ossa-compliance-validation'
  ];
  
  const foundTests = readdirSync(E2E_TEST_DIR)
    .filter(f => f.endsWith('.test.ts'))
    .map(f => f.replace('.test.ts', ''));
  
  for (const area of requiredTestAreas) {
    if (foundTests.includes(area)) {
      console.log(`  ✓ ${area}`);
    } else {
      results.errors.push(`Missing required test area: ${area}`);
    }
  }
  
  console.log('');
}

function printSummary() {
  console.log('📋 Validation Summary');
  console.log('===================');
  console.log(`Test Files: ${results.testFiles}`);
  console.log(`Fixture Files: ${results.fixtureFiles}`);
  console.log(`Test Suites: ${results.summary.totalTestSuites}`);
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Describe Blocks: ${results.summary.totalDescribeBlocks}`);
  console.log('');
  
  if (results.errors.length > 0) {
    console.log('❌ Errors:');
    results.errors.forEach(error => console.log(`  • ${error}`));
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`  • ${warning}`));
    console.log('');
  }
  
  if (results.errors.length === 0) {
    console.log('✅ All validations passed!');
    console.log('');
    console.log('🚀 E2E Test Suite is ready for execution!');
    console.log('');
    console.log('Run tests with:');
    console.log('  npm run test:e2e                    # All E2E tests');
    console.log('  npm run test:e2e:lifecycle         # 8-Phase lifecycle');
    console.log('  npm run test:e2e:coordination       # Multi-agent coordination');
    console.log('  npm run test:e2e:compliance         # OSSA compliance');
    console.log('  npm run test:e2e:agent-manager      # Agent lifecycle manager');
  } else {
    console.log('❌ Validation failed with errors.');
    process.exit(1);
  }
}

// Run validation
validateTestFiles();
validateFixtures();
validateTestCoverage();
printSummary();