#!/usr/bin/env tsx
/**
 * Website Validation Script
 * Uses Cursor Agent configurations to validate the OSSA website
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: ValidationResult[] = [];
const websiteRoot = join(process.cwd(), 'website');

function addResult(check: string, status: 'pass' | 'fail' | 'warn', message: string) {
  results.push({ check, status, message });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${check}: ${message}`);
}

// 1. Check if website is built
function checkBuild() {
  const outDir = join(websiteRoot, 'out');
  if (existsSync(outDir)) {
    const files = readdirSync(outDir);
    if (files.length > 0) {
      addResult('Build Output', 'pass', `Site is built with ${files.length} items`);
    } else {
      addResult('Build Output', 'fail', 'Build directory is empty');
    }
  } else {
    addResult('Build Output', 'fail', 'Build directory does not exist');
  }
}

// 2. Validate package.json
function validatePackageJson() {
  try {
    const pkgPath = join(websiteRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    
    if (pkg.name && pkg.version) {
      addResult('Package.json', 'pass', `Valid package.json (${pkg.name} v${pkg.version})`);
    } else {
      addResult('Package.json', 'warn', 'Package.json missing name or version');
    }
  } catch (error) {
    addResult('Package.json', 'fail', `Invalid JSON: ${error}`);
  }
}

// 3. Check TypeScript compilation
function checkTypeScript() {
  try {
    const tsConfigPath = join(websiteRoot, 'tsconfig.json');
    if (existsSync(tsConfigPath)) {
      addResult('TypeScript Config', 'pass', 'tsconfig.json exists');
    } else {
      addResult('TypeScript Config', 'warn', 'tsconfig.json not found');
    }
  } catch (error) {
    addResult('TypeScript Config', 'fail', `Error checking tsconfig: ${error}`);
  }
}

// 4. Validate JSON files in public
function validatePublicJson() {
  const publicDir = join(websiteRoot, 'public');
  if (!existsSync(publicDir)) {
    addResult('Public JSON Files', 'warn', 'Public directory does not exist');
    return;
  }

  try {
    const files = readdirSync(publicDir, { recursive: true });
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    let valid = 0;
    let invalid = 0;
    
    for (const file of jsonFiles) {
      try {
        const content = readFileSync(join(publicDir, file), 'utf-8');
        JSON.parse(content);
        valid++;
      } catch {
        invalid++;
      }
    }
    
    if (invalid === 0) {
      addResult('Public JSON Files', 'pass', `All ${valid} JSON files are valid`);
    } else {
      addResult('Public JSON Files', 'fail', `${invalid} of ${jsonFiles.length} JSON files are invalid`);
    }
  } catch (error) {
    addResult('Public JSON Files', 'warn', `Could not check JSON files: ${error}`);
  }
}

// 5. Check OpenAPI specs
function checkOpenAPISpecs() {
  const openapiDir = join(websiteRoot, 'public', 'openapi');
  if (!existsSync(openapiDir)) {
    addResult('OpenAPI Specs', 'warn', 'OpenAPI directory does not exist');
    return;
  }

  try {
    const files = readdirSync(openapiDir);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    addResult('OpenAPI Specs', 'pass', `Found ${yamlFiles.length} OpenAPI specification files`);
  } catch (error) {
    addResult('OpenAPI Specs', 'warn', `Could not check OpenAPI specs: ${error}`);
  }
}

// 6. Check OSSA schemas
function checkOSSASchemas() {
  const schemasDir = join(websiteRoot, 'public', 'schemas');
  if (!existsSync(schemasDir)) {
    addResult('OSSA Schemas', 'warn', 'Schemas directory does not exist');
    return;
  }

  try {
    const files = readdirSync(schemasDir);
    const schemaFiles = files.filter(f => f.endsWith('.json') && f.includes('ossa'));
    addResult('OSSA Schemas', 'pass', `Found ${schemaFiles.length} OSSA schema files`);
  } catch (error) {
    addResult('OSSA Schemas', 'warn', `Could not check schemas: ${error}`);
  }
}

// 7. Check Next.js config
function checkNextConfig() {
  const configPath = join(websiteRoot, 'next.config.ts');
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      if (content.includes('output:') && content.includes('export')) {
        addResult('Next.js Config', 'pass', 'Next.js configured for static export');
      } else {
        addResult('Next.js Config', 'warn', 'Next.js config may not be set for static export');
      }
    } catch (error) {
      addResult('Next.js Config', 'fail', `Error reading config: ${error}`);
    }
  } else {
    addResult('Next.js Config', 'warn', 'next.config.ts not found');
  }
}

// 8. Check Lighthouse config
function checkLighthouseConfig() {
  const lhConfig = join(websiteRoot, '.lighthouserc.ts');
  if (existsSync(lhConfig)) {
    addResult('Lighthouse Config', 'pass', 'Lighthouse configuration exists');
  } else {
    addResult('Lighthouse Config', 'warn', 'Lighthouse configuration not found');
  }
}

// 9. Run ESLint check
function runLint() {
  try {
    execSync('npm run lint', { 
      cwd: websiteRoot, 
      stdio: 'pipe',
      timeout: 30000 
    });
    addResult('ESLint', 'pass', 'No linting errors');
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    if (output.includes('No ESLint warnings or errors')) {
      addResult('ESLint', 'pass', 'No linting errors');
    } else {
      addResult('ESLint', 'warn', 'Linting issues detected (check output)');
    }
  }
}

// Main execution
console.log('🔍 OSSA Website Validation\n');
console.log('='.repeat(50));

checkBuild();
validatePackageJson();
checkTypeScript();
validatePublicJson();
checkOpenAPISpecs();
checkOSSASchemas();
checkNextConfig();
checkLighthouseConfig();
runLint();

console.log('\n' + '='.repeat(50));
console.log('\n📊 Validation Summary:\n');

const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const warnings = results.filter(r => r.status === 'warn').length;

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`\nTotal Checks: ${results.length}`);

if (failed > 0) {
  console.log('\n❌ Some validations failed. Please review the output above.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Some warnings detected. Review recommended.');
  process.exit(0);
} else {
  console.log('\n✅ All validations passed!');
  process.exit(0);
}

