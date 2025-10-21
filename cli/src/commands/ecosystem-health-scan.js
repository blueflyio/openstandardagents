#!/usr/bin/env node

/**
 * TASK 1: Ecosystem Health Scan
 * Run TypeScript/lint checks across all common_npm repos
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const COMMON_NPM_DIR = '/Users/flux423/Sites/LLM/common_npm';

const repos = [
  'agent-brain',
  'agent-chat', 
  'agent-docker',
  'agent-mesh',
  'agent-protocol',
  'agent-router',
  'agent-studio',
  'agent-tracer',
  'agentic-flows',
  'compliance-engine',
  'doc-engine',
  'foundation-bridge',
  'rfp-automation',
  'studio-ui',
  'workflow-engine'
];

async function scanRepo(repoName) {
  const repoPath = path.join(COMMON_NPM_DIR, repoName);
  
  if (!fs.existsSync(repoPath)) {
    return { repo: repoName, status: 'NOT_FOUND', errors: [] };
  }
  
  const result = {
    repo: repoName,
    status: 'UNKNOWN',
    typescript: { errors: 0, warnings: 0 },
    lint: { errors: 0, warnings: 0 },
    tests: { passed: 0, failed: 0 },
    errors: []
  };
  
  try {
    // TypeScript check
    try {
      await execAsync('npm run typecheck || npm run type-check || tsc --noEmit', { 
        cwd: repoPath,
        maxBuffer: 1024 * 1024 * 10 
      });
      result.typescript.status = 'PASS';
    } catch (err) {
      result.typescript.status = 'FAIL';
      const errors = (err.stdout || err.stderr || '').match(/error TS\d+/g) || [];
      result.typescript.errors = errors.length;
      result.errors.push(`TypeScript: ${errors.length} errors`);
    }
    
    // Lint check
    try {
      await execAsync('npm run lint || npx eslint src', { 
        cwd: repoPath,
        maxBuffer: 1024 * 1024 * 10
      });
      result.lint.status = 'PASS';
    } catch (err) {
      result.lint.status = 'FAIL';
      const errors = (err.stdout || err.stderr || '').match(/error/gi) || [];
      result.lint.errors = errors.length;
      result.errors.push(`Lint: ${errors.length} errors`);
    }
    
    // Quick test
    try {
      const { stdout } = await execAsync('npm run test:quick || echo "No test:quick"', {
        cwd: repoPath,
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10
      });
      
      if (stdout.includes('PASS') || stdout.includes('passed')) {
        result.tests.status = 'PASS';
      }
    } catch (err) {
      result.tests.status = 'FAIL';
    }
    
    result.status = (result.typescript.errors + result.lint.errors) === 0 ? 'HEALTHY' : 'NEEDS_FIX';
    
  } catch (error) {
    result.status = 'ERROR';
    result.errors.push(error.message);
  }
  
  return result;
}

async function main() {
  console.log('🏥 TASK 1: Ecosystem Health Scan\n');
  console.log('Scanning common_npm repositories...\n');
  
  const results = [];
  
  for (const repo of repos) {
    process.stdout.write(`📦 Scanning ${repo}... `);
    const result = await scanRepo(repo);
    results.push(result);
    
    const icon = result.status === 'HEALTHY' ? '✅' : result.status === 'NEEDS_FIX' ? '⚠️' : '❌';
    console.log(`${icon} ${result.status}`);
    
    if (result.errors.length > 0) {
      result.errors.forEach(err => console.log(`     ${err}`));
    }
  }
  
  // Summary
  console.log('\n📊 Health Summary:');
  const healthy = results.filter(r => r.status === 'HEALTHY').length;
  const needsFix = results.filter(r => r.status === 'NEEDS_FIX').length;
  const errors = results.filter(r => r.status === 'ERROR' || r.status === 'NOT_FOUND').length;
  
  console.log(`   ✅ Healthy: ${healthy}/${repos.length}`);
  console.log(`   ⚠️  Needs Fix: ${needsFix}/${repos.length}`);
  console.log(`   ❌ Errors: ${errors}/${repos.length}`);
  
  // Save report
  fs.writeFileSync('/tmp/ecosystem-health-report.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Full report saved: /tmp/ecosystem-health-report.json');
  
  return results;
}

main().catch(console.error);

