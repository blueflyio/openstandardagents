#!/usr/bin/env node

/**
 * Comprehensive test for all 5 production-grade exporters merged from release-prep
 * Tests: kagent, Docker, Kubernetes, CrewAI, LangChain
 */

import { OSSAValidator } from './dist/services/validator/ossa-validator.js';
import { KubernetesGenerator } from './dist/adapters/kubernetes/generator.js';
import { DockerExporter } from './dist/adapters/docker/docker-exporter.js';
import { CrewAIAdapter } from './dist/adapters/crewai/adapter.js';
import { LangChainAdapter } from './dist/adapters/langchain/adapter.js';
import { KAgentCRDGenerator } from './dist/sdks/kagent/crd-generator.js';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BLUE}  Testing All 5 Production-Grade Exporters (Merged from release-prep)${RESET}`);
console.log(`${BLUE}═══════════════════════════════════════════════════════════════${RESET}\n`);

// Load test manifest
const manifestPath = './agents/code-reviewer.ossa.yaml';
let manifest;

try {
  const content = readFileSync(manifestPath, 'utf8');
  const validator = new OSSAValidator();
  const result = validator.validate(content);

  if (!result.isValid) {
    console.error(`${RED}✗ Failed to validate manifest${RESET}`);
    console.error(result.errors);
    process.exit(1);
  }

  manifest = result.manifest;
  console.log(`${GREEN}✓ Loaded and validated manifest: ${manifest.metadata.name}${RESET}\n`);
} catch (error) {
  console.error(`${RED}✗ Failed to load manifest:${RESET}`, error.message);
  process.exit(1);
}

const testOutputDir = './test-output-5-exporters';
rmSync(testOutputDir, { recursive: true, force: true });
mkdirSync(testOutputDir, { recursive: true });

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test 1: KAgentCRDGenerator (Production-grade with 10+ resources)
console.log(`${YELLOW}━━━ Test 1: KAgentCRDGenerator (Kagent SDK) ━━━${RESET}`);
try {
  const generator = new KAgentCRDGenerator();
  const bundle = generator.generateBundle(manifest, {
    namespace: 'test-agents',
    generateHPA: true,
    generateNetworkPolicy: true
  });

  console.log(`${GREEN}✓ Generated bundle with ${Object.keys(bundle).length} resources${RESET}`);

  // Verify key resources
  const expectedResources = ['crd', 'deployment', 'service', 'configmap', 'secret', 'serviceAccount', 'role', 'roleBinding', 'readme'];
  const missing = expectedResources.filter(r => !bundle[r]);

  if (missing.length > 0) {
    throw new Error(`Missing resources: ${missing.join(', ')}`);
  }

  console.log(`${GREEN}✓ All expected resources present${RESET}`);

  // Save bundle
  const kagentDir = join(testOutputDir, 'kagent');
  mkdirSync(kagentDir, { recursive: true });

  for (const [name, content] of Object.entries(bundle)) {
    const ext = name === 'readme' ? 'md' : 'yaml';
    writeFileSync(join(kagentDir, `${name}.${ext}`), content);
  }

  console.log(`${GREEN}✓ KAgentCRDGenerator: PASS${RESET}\n`);
  results.passed++;
  results.tests.push({ name: 'KAgentCRDGenerator', status: 'PASS', files: Object.keys(bundle).length });
} catch (error) {
  console.error(`${RED}✗ KAgentCRDGenerator: FAIL${RESET}`);
  console.error(`  Error: ${error.message}\n`);
  results.failed++;
  results.tests.push({ name: 'KAgentCRDGenerator', status: 'FAIL', error: error.message });
}

// Test 2: DockerExporter (14 files)
console.log(`${YELLOW}━━━ Test 2: DockerExporter ━━━${RESET}`);
try {
  const exporter = new DockerExporter();
  const output = exporter.export(manifest, {
    outputPath: join(testOutputDir, 'docker'),
    registry: 'ghcr.io/blueflyio'
  });

  console.log(`${GREEN}✓ Generated ${output.files.length} files${RESET}`);

  // Verify key files
  const expectedFiles = ['Dockerfile', 'docker-compose.yml', '.dockerignore', 'README.md'];
  const missing = expectedFiles.filter(f => !output.files.some(file => file.includes(f)));

  if (missing.length > 0) {
    throw new Error(`Missing files: ${missing.join(', ')}`);
  }

  console.log(`${GREEN}✓ All expected files present${RESET}`);
  console.log(`${GREEN}✓ DockerExporter: PASS${RESET}\n`);
  results.passed++;
  results.tests.push({ name: 'DockerExporter', status: 'PASS', files: output.files.length });
} catch (error) {
  console.error(`${RED}✗ DockerExporter: FAIL${RESET}`);
  console.error(`  Error: ${error.message}\n`);
  results.failed++;
  results.tests.push({ name: 'DockerExporter', status: 'FAIL', error: error.message });
}

// Test 3: KubernetesGenerator (24 files with Kustomize)
console.log(`${YELLOW}━━━ Test 3: KubernetesGenerator ━━━${RESET}`);
try {
  const generator = new KubernetesGenerator();
  const output = generator.generate(manifest, {
    outputPath: join(testOutputDir, 'kubernetes'),
    namespace: 'test-agents',
    generateKustomize: true
  });

  console.log(`${GREEN}✓ Generated ${output.files.length} files${RESET}`);

  // Verify Kustomize structure
  if (!output.files.some(f => f.includes('kustomization.yaml'))) {
    throw new Error('Missing kustomization.yaml');
  }

  console.log(`${GREEN}✓ Kustomize structure present${RESET}`);
  console.log(`${GREEN}✓ KubernetesGenerator: PASS${RESET}\n`);
  results.passed++;
  results.tests.push({ name: 'KubernetesGenerator', status: 'PASS', files: output.files.length });
} catch (error) {
  console.error(`${RED}✗ KubernetesGenerator: FAIL${RESET}`);
  console.error(`  Error: ${error.message}\n`);
  results.failed++;
  results.tests.push({ name: 'KubernetesGenerator', status: 'FAIL', error: error.message });
}

// Test 4: CrewAIAdapter (17 files)
console.log(`${YELLOW}━━━ Test 4: CrewAIAdapter ━━━${RESET}`);
try {
  const adapter = new CrewAIAdapter();
  const output = adapter.export(manifest, {
    outputPath: join(testOutputDir, 'crewai')
  });

  console.log(`${GREEN}✓ Generated ${output.files.length} files${RESET}`);

  // Verify key directories
  const expectedDirs = ['agents', 'tasks', 'tools', 'crew', 'examples', 'tests'];
  const outputStr = JSON.stringify(output);
  const missing = expectedDirs.filter(d => !outputStr.includes(d));

  if (missing.length > 0) {
    throw new Error(`Missing directories: ${missing.join(', ')}`);
  }

  console.log(`${GREEN}✓ All expected directories present${RESET}`);
  console.log(`${GREEN}✓ CrewAIAdapter: PASS${RESET}\n`);
  results.passed++;
  results.tests.push({ name: 'CrewAIAdapter', status: 'PASS', files: output.files.length });
} catch (error) {
  console.error(`${RED}✗ CrewAIAdapter: FAIL${RESET}`);
  console.error(`  Error: ${error.message}\n`);
  results.failed++;
  results.tests.push({ name: 'CrewAIAdapter', status: 'FAIL', error: error.message });
}

// Test 5: LangChainAdapter (30+ files)
console.log(`${YELLOW}━━━ Test 5: LangChainAdapter ━━━${RESET}`);
try {
  const adapter = new LangChainAdapter();
  const output = adapter.export(manifest, {
    outputPath: join(testOutputDir, 'langchain'),
    includeTests: true,
    includeDockerfile: true
  });

  console.log(`${GREEN}✓ Generated ${output.files.length} files${RESET}`);

  // Verify key files
  const expectedFiles = ['package.json', 'tsconfig.json', 'README.md', 'Dockerfile'];
  const outputStr = JSON.stringify(output);
  const missing = expectedFiles.filter(f => !outputStr.includes(f));

  if (missing.length > 0) {
    throw new Error(`Missing files: ${missing.join(', ')}`);
  }

  console.log(`${GREEN}✓ All expected files present${RESET}`);
  console.log(`${GREEN}✓ LangChainAdapter: PASS${RESET}\n`);
  results.passed++;
  results.tests.push({ name: 'LangChainAdapter', status: 'PASS', files: output.files.length });
} catch (error) {
  console.error(`${RED}✗ LangChainAdapter: FAIL${RESET}`);
  console.error(`  Error: ${error.message}\n`);
  results.failed++;
  results.tests.push({ name: 'LangChainAdapter', status: 'FAIL', error: error.message });
}

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
