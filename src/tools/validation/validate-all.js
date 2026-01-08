#!/usr/bin/env node

/**
 * Comprehensive validation for OSSA project
 * Validates versions, schemas, and consistency
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const errors = [];
const warnings = [];

function check(name, fn) {
  try {
    fn();
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
  }
}

function warn(message) {
  warnings.push(message);
}

// Check version consistency
check('Version Consistency', () => {
  const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const websitePkg = JSON.parse(fs.readFileSync('website/package.json', 'utf8'));
  
  if (rootPkg.version !== websitePkg.version) {
    throw new Error(`Root (${rootPkg.version}) != Website (${websitePkg.version})`);
  }
  
  const versionTs = fs.readFileSync('website/lib/version.ts', 'utf8');
  if (!versionTs.includes(`"${rootPkg.version}"`)) {
    throw new Error(`version.ts doesn't contain ${rootPkg.version}`);
  }
  
  console.log(`✓ Version consistency: ${rootPkg.version}`);
});

// Check schema exports
check('Schema Exports', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const schemaPath = pkg.exports['./schema'];
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema not found: ${schemaPath}`);
  }
  
  console.log(`✓ Schema export: ${schemaPath}`);
});

// Check spec directories
check('Spec Directories', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = pkg.version;
  const specDir = `spec/v${version}`;
  
  if (!fs.existsSync(specDir)) {
    throw new Error(`Missing spec directory: ${specDir}`);
  }
  
  const schemaFile = `${specDir}/ossa-${version}.schema.json`;
  if (!fs.existsSync(schemaFile)) {
    throw new Error(`Missing schema: ${schemaFile}`);
  }
  
  console.log(`✓ Spec directory: ${specDir}`);
});

// Validate schemas
check('Schema Validation', () => {
  try {
    execSync('npm run validate:schema', { stdio: 'pipe' });
    console.log('✓ Schema validation passed');
  } catch (err) {
    throw new Error('Schema validation failed');
  }
});

// Check for version references
check('Version References', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = pkg.version;
  
  // Check for old version references
  const result = execSync(
    `grep -r "0\\.2\\.[0-9]" src/ website/app/ website/lib/ --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
    { encoding: 'utf8' }
  );
  
  const lines = result.split('\n').filter(l => l.trim());
  const outdated = lines.filter(l => !l.includes(version) && !l.includes('v0.2'));
  
  if (outdated.length > 0) {
    warn(`Found ${outdated.length} potentially outdated version references`);
  }
  
  console.log(`✓ Version references checked`);
});

// Summary
console.log('\n' + '='.repeat(50));

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(e => console.log(`  - ${e}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(w => console.log(`  - ${w}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ All validations passed!');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('\n✅ Validations passed with warnings');
  process.exit(0);
} else {
  console.log(`\n❌ ${errors.length} error(s) found`);
  process.exit(1);
}
