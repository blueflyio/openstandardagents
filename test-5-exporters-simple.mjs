#!/usr/bin/env node

/**
 * Simple comprehensive test for all 5 production-grade exporters
 * Tests: kagent, Docker, Kubernetes, CrewAI, LangChain
 */

import { execSync } from 'child_process';
import { rmSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BLUE}  Testing All 5 Production-Grade Exporters (Merged from release-prep)${RESET}`);
console.log(`${BLUE}═══════════════════════════════════════════════════════════════${RESET}\n`);

const testOutputDir = './test-output-5-exporters';
rmSync(testOutputDir, { recursive: true, force: true });

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

const testManifest = './examples/claude-code/code-reviewer.ossa.yaml';

function countFiles(dir) {
  let count = 0;
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stats = statSync(fullPath);
      if (stats.isFile()) {
        count++;
      } else if (stats.isDirectory()) {
        count += countFiles(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return count;
}

function runExport(adapter, outputPath, expectedMinFiles, expectedDirs = []) {
  console.log(`${YELLOW}━━━ Test: ${adapter} ━━━${RESET}`);

  try {
    // Create output directory
    mkdirSync(outputPath, { recursive: true });

    const cmd = `node dist/cli/index.js export --platform ${adapter} ${testManifest} --output ${outputPath}`;
    console.log(`  Running: ${cmd}`);

    const output = execSync(cmd, { encoding: 'utf8' });

    // Check if output directory exists
    if (!existsSync(outputPath)) {
      throw new Error(`Output directory not created: ${outputPath}`);
    }

    // Count files
    const fileCount = countFiles(outputPath);
    console.log(`  ${GREEN}✓ Generated ${fileCount} files${RESET}`);

    // Check minimum files
    if (fileCount < expectedMinFiles) {
      throw new Error(`Expected at least ${expectedMinFiles} files, got ${fileCount}`);
    }

    // Check for expected directories
    for (const dir of expectedDirs) {
      const dirPath = join(outputPath, dir);
      if (!existsSync(dirPath)) {
        throw new Error(`Missing expected directory: ${dir}`);
      }
    }

    if (expectedDirs.length > 0) {
      console.log(`  ${GREEN}✓ All expected directories present${RESET}`);
    }

    console.log(`  ${GREEN}✓ ${adapter}: PASS${RESET}\n`);
    results.passed++;
    results.tests.push({ name: adapter, status: 'PASS', files: fileCount });

  } catch (error) {
    console.error(`  ${RED}✗ ${adapter}: FAIL${RESET}`);
    console.error(`  Error: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: adapter, status: 'FAIL', error: error.message });
  }
}

// Test 1: kagent (10+ files)
runExport('kagent', join(testOutputDir, 'kagent'), 10, []);

// Test 2: docker (14+ files)
runExport('docker', join(testOutputDir, 'docker'), 10, []);

// Test 3: kubernetes (20+ files with Kustomize)
runExport('kubernetes', join(testOutputDir, 'kubernetes'), 15, []);

// Test 4: crewai (17+ files)
runExport('crewai', join(testOutputDir, 'crewai'), 15, ['agents', 'tasks', 'tools', 'crew', 'examples', 'tests']);

// Test 5: langchain (25+ files)
runExport('langchain', join(testOutputDir, 'langchain'), 20, []);

// Print summary
console.log(`${BLUE}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BLUE}  Test Summary${RESET}`);
console.log(`${BLUE}═══════════════════════════════════════════════════════════════${RESET}\n`);

results.tests.forEach(test => {
  const icon = test.status === 'PASS' ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  const files = test.files ? ` (${test.files} files)` : '';
  console.log(`${icon} ${test.name}${files}`);
  if (test.error) {
    console.log(`  ${RED}Error: ${test.error}${RESET}`);
  }
});

console.log(`\n${BLUE}Results:${RESET}`);
console.log(`  ${GREEN}Passed: ${results.passed}${RESET}`);
console.log(`  ${RED}Failed: ${results.failed}${RESET}`);
console.log(`  Total: ${results.passed + results.failed}`);

console.log(`\n${BLUE}Output directory: ${testOutputDir}${RESET}\n`);

process.exit(results.failed > 0 ? 1 : 0);
