#!/usr/bin/env node
/**
 * Comprehensive audit script to find ALL hardcoded versions
 * Run: node scripts/audit-versions.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const issues = [];
const warnings = [];

// Files to check
const checkFiles = [
  'website/app/**/*.{ts,tsx,js,jsx}',
  'website/components/**/*.{ts,tsx,js,jsx}',
  'website/lib/**/*.{ts,js}',
  'website/scripts/**/*.js',
  'website/public/**/*.json',
];

// Patterns to find hardcoded versions
const versionPatterns = [
  /v0\.\d+\.\d+/g,
  /"0\.\d+\.\d+"/g,
  /'0\.\d+\.\d+'/g,
  /apiVersion:\s*ossa\/v0\.\d+\.\d+/gi,
  /ossa\/v0\.\d+\.\d+/gi,
];

// Allowed files (known to have hardcoded versions for historical reasons)
const allowedFiles = [
  'website/app/changelog/page.tsx', // Historical versions OK
  'website/app/specification/page.tsx', // Historical versions OK
  'website/package.json', // Website version, not OSSA version
  'website/lib/version.ts', // Auto-generated
];

// Check a single file
function checkFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Skip allowed files
  if (allowedFiles.some(allowed => relativePath.includes(allowed))) {
    return;
  }
  
  versionPatterns.forEach((pattern, idx) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Check if it's in a comment
        const lines = content.split('\n');
        const matchIndex = content.indexOf(match);
        const lineNum = content.substring(0, matchIndex).split('\n').length;
        const line = lines[lineNum - 1];
        
        // Skip if it's in a comment (but warn)
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.includes('<!--')) {
          warnings.push({
            file: relativePath,
            line: lineNum,
            match,
            type: 'comment',
            lineText: line.trim(),
          });
        } else {
          // This is a real issue
          issues.push({
            file: relativePath,
            line: lineNum,
            match,
            type: 'hardcoded',
            lineText: line.trim(),
          });
        }
      });
    }
  });
}

// Find all files
function findAllFiles(dir, extensions) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      files.push(...findAllFiles(fullPath, extensions));
    } else if (item.isFile()) {
      const ext = path.extname(item.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// Main audit
console.log('🔍 Auditing all files for hardcoded versions...\n');

const websiteDir = path.join(__dirname, '..');
const appFiles = findAllFiles(path.join(websiteDir, 'app'), ['.ts', '.tsx', '.js', '.jsx']);
const componentFiles = findAllFiles(path.join(websiteDir, 'components'), ['.ts', '.tsx', '.js', '.jsx']);
const libFiles = findAllFiles(path.join(websiteDir, 'lib'), ['.ts', '.js']);
const scriptFiles = findAllFiles(path.join(websiteDir, 'scripts'), ['.js']);
const publicFiles = findAllFiles(path.join(websiteDir, 'public'), ['.json']);

const allFiles = [...appFiles, ...componentFiles, ...libFiles, ...scriptFiles, ...publicFiles];

allFiles.forEach(checkFile);

// Report
console.log(`📊 Audit Results:\n`);
console.log(`Files checked: ${allFiles.length}`);
console.log(`Issues found: ${issues.length}`);
console.log(`Warnings: ${warnings.length}\n`);

if (issues.length > 0) {
  console.log('❌ CRITICAL ISSUES (hardcoded versions):\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.file}:${issue.line}`);
    console.log(`   Match: ${issue.match}`);
    console.log(`   Line: ${issue.lineText}\n`);
  });
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (versions in comments):\n');
  warnings.forEach((warning, idx) => {
    console.log(`${idx + 1}. ${warning.file}:${warning.line}`);
    console.log(`   Match: ${warning.match}`);
    console.log(`   Line: ${warning.lineText}\n`);
  });
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No hardcoded versions found!');
  process.exit(0);
} else if (issues.length > 0) {
  console.log(`\n❌ Found ${issues.length} critical issues that need fixing.`);
  process.exit(1);
} else {
  console.log(`\n⚠️  Found ${warnings.length} warnings (versions in comments).`);
  process.exit(0);
}
