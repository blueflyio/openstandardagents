#!/usr/bin/env node
/**
 * Comprehensive Export Test - ALL Platforms via CLI
 * Tests all FIXED exporters using the ossa export CLI command
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ICLOUD_BASE = `${process.env.HOME}/Library/Mobile Documents/com~apple~CloudDocs/AgentPlatform`;
const TEST_BASE = `${ICLOUD_BASE}/TESTS/ossa-cli-2026-02-06/testfolders`;
const SOURCE_MANIFEST = 'examples/mr-reviewer-with-governance.ossa.yaml';

// Platform configurations
const PLATFORMS = [
  { name: 'kagent', format: 'crd' },
  { name: 'gitlab-duo', format: 'yaml' },
  { name: 'docker', format: 'yaml' },
  { name: 'kubernetes', format: 'yaml' },
  { name: 'langchain', format: 'python' },
  { name: 'crewai', format: 'python' },
  { name: 'npm', format: 'typescript' },
  { name: 'agent-skills', format: 'yaml' },
];

function runExport(platform, format) {
  const outputDir = path.join(TEST_BASE, platform);

  console.log(`\n📦 Testing ${platform} (${format})...`);

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Run export command
    const cmd = `node dist/cli/index.js export ${SOURCE_MANIFEST} --platform ${platform} --format ${format} --output ${outputDir}`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });

    // Count files generated
    const files = fs.readdirSync(outputDir, { recursive: true })
      .filter(f => fs.statSync(path.join(outputDir, f)).isFile());

    console.log(`  ✓ ${platform}: ${files.length} files generated`);

    // Show file tree (first 15 files)
    const filesToShow = files.slice(0, 15);
    filesToShow.forEach(file => {
      const fullPath = path.join(outputDir, file);
      const stats = fs.statSync(fullPath);
      const size = (stats.size / 1024).toFixed(1);
      console.log(`    - ${file} (${size} KB)`);
    });

    if (files.length > 15) {
      console.log(`    ... and ${files.length - 15} more files`);
    }

    return { success: true, platform, filesCount: files.length, files: filesToShow };
  } catch (error) {
    console.error(`  ✗ ${platform} FAILED:`);
    console.error(`    ${error.message}`);
    if (error.stderr) {
      console.error(`    ${error.stderr.toString().split('\n').slice(0, 5).join('\n    ')}`);
    }
    return { success: false, platform, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Export Test (CLI)\n');
  console.log(`Source: ${SOURCE_MANIFEST}`);
  console.log(`Output: ${TEST_BASE}\n`);
  console.log('=' .repeat(70));

  // Run exports for all platforms
  const results = [];
  for (const { name, format } of PLATFORMS) {
    const result = runExport(name, format);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 EXPORT TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Output Directory: ${TEST_BASE}\n`);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Platforms Tested: ${results.length}`);
  console.log(`✓ Successful: ${successful.length}`);
  console.log(`✗ Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    console.log('✅ Successful Exports:');
    successful.forEach(r => {
      console.log(`  - ${r.platform}: ${r.filesCount} files`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Exports:');
    failed.forEach(r => {
      console.log(`  - ${r.platform}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('Next Steps:');
  console.log('  1. Review generated files in each platform folder');
  console.log('  2. Compare with production requirements (EXPORT-REQUIREMENTS.md)');
  console.log('  3. Validate documentation completeness');
  console.log('  4. Check security configurations');
  console.log('=' .repeat(70));

  // Exit with error code if any exports failed
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(console.error);
