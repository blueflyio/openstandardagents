#!/usr/bin/env node
/**
 * Simple Export Test - Test all platforms to /tmp first
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_BASE = '/tmp/ossa-export-test';
const SOURCE_MANIFEST = 'examples/mr-reviewer-with-governance.ossa.yaml';

// Platform configurations (using correct platform names from CLI)
const PLATFORMS = [
  { name: 'kagent', format: 'yaml' },
  { name: 'gitlab', format: 'yaml' },
  { name: 'gitlab-agent', format: 'yaml' },
  { name: 'docker', format: 'yaml' },
  { name: 'kubernetes', format: 'yaml' },
  { name: 'langchain', format: 'python' },
  { name: 'crewai', format: 'python' },
  { name: 'npm', format: 'typescript' },
  { name: 'agent-skills', format: 'yaml' },
];

function runExport(platform, format) {
  const outputDir = path.join(TEST_BASE, platform);

  console.log(`\n📦 Testing ${platform}...`);

  // Clean and create output directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Run export command
    const cmd = `node dist/cli/index.js export "${SOURCE_MANIFEST}" --platform ${platform} --format ${format} --output "${outputDir}" -y`;
    execSync(cmd, { encoding: 'utf8', stdio: 'inherit' });

    // Count files generated
    function countFiles(dir) {
      let count = 0;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          count += countFiles(fullPath);
        } else {
          count++;
        }
      }
      return count;
    }

    const filesCount = countFiles(outputDir);
    console.log(`  ✅ ${platform}: ${filesCount} files generated`);

    return { success: true, platform, filesCount };
  } catch (error) {
    console.error(`  ❌ ${platform} FAILED: ${error.message}`);
    return { success: false, platform, error: error.message };
  }
}

async function main() {
  console.log('🚀 OSSA Export Test - All Platforms\n');
  console.log(`Source: ${SOURCE_MANIFEST}`);
  console.log(`Output: ${TEST_BASE}\n`);
  console.log('='.repeat(70));

  // Run exports for all platforms
  const results = [];
  for (const { name, format } of PLATFORMS) {
    const result = runExport(name, format);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\nTotal: ${results.length} platforms`);
  console.log(`✅ Success: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    console.log('✅ Successful Exports:');
    successful.forEach(r => {
      const status = r.filesCount >= 10 ? '🌟 Production-Grade' :
                     r.filesCount >= 5 ? '🟡 Functional' :
                     '🔴 Weak';
      console.log(`  ${status} ${r.platform}: ${r.filesCount} files`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Exports:');
    failed.forEach(r => {
      console.log(`  - ${r.platform}: ${r.error}`);
    });
  }

  console.log(`\n📁 Review exports at: ${TEST_BASE}`);
  console.log('='.repeat(70));

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(console.error);
