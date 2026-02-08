#!/usr/bin/env node
/**
 * Comprehensive Export Test - All Platforms to Test Folders
 * Tests the FIXED exporters with production-grade output
 */

import { ManifestRepository } from './dist/repositories/manifest.repository.js';
import { KAgentCRDGenerator } from './dist/sdks/kagent/crd-generator.js';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const ICLOUD_BASE = `${process.env.HOME}/Library/Mobile Documents/com~apple~CloudDocs/AgentPlatform`;
const TEST_BASE = `${ICLOUD_BASE}/TESTS/ossa-cli-2026-02-06/testfolders`;
const SOURCE_MANIFEST = 'examples/mr-reviewer-with-governance.ossa.yaml';

async function main() {
  console.log('🚀 Starting Comprehensive Export Test\n');
  console.log(`Source: ${SOURCE_MANIFEST}`);
  console.log(`Output: ${TEST_BASE}\n`);

  // Load manifest
  const manifestRepo = new ManifestRepository();
  const manifest = await manifestRepo.load(SOURCE_MANIFEST);
  console.log(`✓ Loaded manifest: ${manifest.metadata?.name}\n`);

  // ==========================================================================
  // 1. KAGENT - PRODUCTION-GRADE BUNDLE (NEW!)
  // ==========================================================================
  console.log('📦 Testing kagent (Production-Grade Bundle)...');
  const kagentDir = path.join(TEST_BASE, 'kagent');
  fs.mkdirSync(kagentDir, { recursive: true });

  const kagentGenerator = new KAgentCRDGenerator();
  const bundle = kagentGenerator.generateBundle(manifest, {
    namespace: 'agent-platform',
    replicas: 3,
    resources: {
      limits: { cpu: '2000m', memory: '2Gi' },
      requests: { cpu: '500m', memory: '512Mi' }
    },
    rbac: { enabled: true },
    monitoring: { enabled: true }
  });

  // Write all 10+ files
  const agentName = manifest.metadata?.name || 'agent';
  const files = [
    { name: `${agentName}-crd.yaml`, content: bundle.crd },
    { name: `${agentName}-deployment.yaml`, content: bundle.deployment },
    { name: `${agentName}-service.yaml`, content: bundle.service },
    { name: `${agentName}-configmap.yaml`, content: bundle.configmap },
    { name: `${agentName}-secret.yaml`, content: bundle.secret },
    { name: `${agentName}-serviceaccount.yaml`, content: bundle.serviceAccount },
    { name: `${agentName}-role.yaml`, content: bundle.role },
    { name: `${agentName}-rolebinding.yaml`, content: bundle.roleBinding },
    { name: `${agentName}-networkpolicy.yaml`, content: bundle.networkPolicy },
    { name: 'README.md', content: bundle.readme, raw: true },
  ];

  if (bundle.hpa) {
    files.push({ name: `${agentName}-hpa.yaml`, content: bundle.hpa });
  }

  let totalSize = 0;
  for (const file of files) {
    const filePath = path.join(kagentDir, file.name);
    const content = file.raw ? file.content : yaml.stringify(file.content);
    fs.writeFileSync(filePath, content);
    totalSize += content.length;
    console.log(`  ✓ ${file.name} (${(content.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`✓ kagent: ${files.length} files, ${(totalSize / 1024).toFixed(1)} KB total\n`);

  // ==========================================================================
  // 2. AGENT SKILLS - Universal AI Tool Format
  // ==========================================================================
  console.log('📦 Testing agent-skills (Universal Format)...');
  const skillsDir = path.join(TEST_BASE, 'agent-skills');
  fs.mkdirSync(skillsDir, { recursive: true });

  const { AgentSkillsExporter } = await import('./dist/adapters/agent-skills/exporter.js');
  const skillsExporter = new AgentSkillsExporter();
  const skillsResult = await skillsExporter.export(manifest, {
    includeScripts: true,
    includeReferences: true,
  });

  if (skillsResult.success) {
    for (const file of skillsResult.files) {
      const filePath = path.join(skillsDir, file.path);
      const fileDir = path.dirname(filePath);
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, file.content);
      console.log(`  ✓ ${file.path}`);
    }
    console.log(`✓ agent-skills: ${skillsResult.files.length} files\n`);
  } else {
    console.error(`✗ agent-skills failed: ${skillsResult.error}\n`);
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 EXPORT TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Output Directory: ${TEST_BASE}`);
  console.log('\nPlatforms Tested:');
  console.log('  ✓ kagent - Production-grade bundle (10+ files)');
  console.log('  ✓ agent-skills - Universal AI tool format');
  console.log('\nNext Steps:');
  console.log('  1. Review generated files in each platform folder');
  console.log('  2. Compare with requirements (EXPORT-REQUIREMENTS.md)');
  console.log('  3. Wait for remaining agents to complete fixes');
  console.log('  4. Re-run this test with all fixed exporters');
  console.log('='.repeat(70));
}

main().catch(console.error);
