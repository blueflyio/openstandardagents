#!/usr/bin/env node

/**
 * Comprehensive OSSA Export Test for ALL Platforms
 *
 * Tests all 9 platforms and generates detailed report with:
 * - File counts, sizes
 * - Success/failure status
 * - Production-grade indicators
 * - Detailed comparison table
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const PLATFORMS = [
  'kagent',
  'gitlab',
  'docker',
  'kubernetes',
  'langchain',
  'crewai',
  'npm',
  'drupal',
  'agent-skills'
];

const TEST_MANIFEST = 'examples/mr-reviewer-with-governance.ossa.yaml';
const OUTPUT_BASE = '/tmp/ossa-comprehensive-test';
const REPORT_PATH = '/tmp/ossa-export-test-report.md';
const BACKUP_PATH = '/Users/thomas.scola/Library/Mobile Documents/com~apple~CloudDocs/AgentPlatform/TESTS/ossa-cli-2026-02-06/EXPORT-TEST-REPORT.md';

// Clean up old test directory
if (existsSync(OUTPUT_BASE)) {
  console.log('🗑️  Cleaning up old test directory...');
  rmSync(OUTPUT_BASE, { recursive: true, force: true });
}

// Create fresh test directory
mkdirSync(OUTPUT_BASE, { recursive: true });

console.log('🚀 Starting comprehensive OSSA export test');
console.log(`📋 Test manifest: ${TEST_MANIFEST}`);
console.log(`📁 Output directory: ${OUTPUT_BASE}`);
console.log(`🎯 Testing ${PLATFORMS.length} platforms\n`);

const results = [];

for (const platform of PLATFORMS) {
  const outputDir = join(OUTPUT_BASE, platform);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing platform: ${platform}`);
  console.log('='.repeat(60));

  const result = {
    platform,
    status: '❌',
    error: null,
    fileCount: 0,
    totalSize: 0,
    sizeFormatted: '0 KB',
    fileTypes: {},
    hasTests: false,
    hasDocs: false,
    hasConfig: false,
    hasCI: false,
    productionGrade: '❌',
    files: []
  };

  try {
    // Run export
    const cmd = `./bin/ossa export ${TEST_MANIFEST} --platform ${platform} --output ${outputDir}`;
    console.log(`📤 Running: ${cmd}`);

    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log(output);

    // Check if output exists (could be file or directory)
    if (!existsSync(outputDir)) {
      throw new Error('Output was not created');
    }

    // Analyze output
    const stats = statSync(outputDir);
    if (stats.isDirectory()) {
      const analysis = analyzeOutput(outputDir);
      Object.assign(result, analysis);
    } else {
      // Single file export
      result.fileCount = 1;
      result.totalSize = stats.size;
      if (stats.size < 1024) {
        result.sizeFormatted = stats.size + ' B';
      } else if (stats.size < 1024 * 1024) {
        result.sizeFormatted = (stats.size / 1024).toFixed(2) + ' KB';
      } else {
        result.sizeFormatted = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
      }

      const ext = extname(outputDir).toLowerCase();
      result.fileTypes[ext] = 1;
      result.files.push({
        path: outputDir,
        size: stats.size
      });

      // Single file exports are basic, not production-grade
      result.hasDocs = false;
      result.hasConfig = ext === '.yaml' || ext === '.yml' || ext === '.json';
      result.hasTests = false;
      result.hasCI = false;
    }

    result.status = '✅';

    // Determine production grade
    const prodScore = (
      (result.hasTests ? 1 : 0) +
      (result.hasDocs ? 1 : 0) +
      (result.hasConfig ? 1 : 0) +
      (result.fileCount >= 10 ? 1 : 0)
    );

    result.productionGrade = prodScore >= 3 ? '✅' : prodScore >= 2 ? '🟡' : '❌';

    console.log(`✅ Success! Generated ${result.fileCount} files (${result.sizeFormatted})`);
    console.log(`   Tests: ${result.hasTests ? '✅' : '❌'} | Docs: ${result.hasDocs ? '✅' : '❌'} | Config: ${result.hasConfig ? '✅' : '❌'} | CI: ${result.hasCI ? '✅' : '❌'}`);
    console.log(`   Production Grade: ${result.productionGrade}`);

  } catch (error) {
    result.error = error.message;
    console.log(`❌ Failed: ${error.message}`);
  }

  results.push(result);
}

// Generate report
console.log('\n\n' + '='.repeat(60));
console.log('📊 Generating comprehensive report...');
console.log('='.repeat(60));

const report = generateReport(results);
writeFileSync(REPORT_PATH, report, 'utf8');
console.log(`\n✅ Report saved to: ${REPORT_PATH}`);

// Backup report to iCloud
try {
  const backupDir = join(BACKUP_PATH, '..');
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  writeFileSync(BACKUP_PATH, report, 'utf8');
  console.log(`✅ Report backed up to: ${BACKUP_PATH}`);
} catch (error) {
  console.log(`⚠️  Failed to backup report: ${error.message}`);
}

// Print summary
const successful = results.filter(r => r.status === '✅').length;
const failed = results.filter(r => r.status === '❌').length;
const productionGrade = results.filter(r => r.productionGrade === '✅').length;

console.log('\n\n' + '='.repeat(60));
console.log('📈 SUMMARY');
console.log('='.repeat(60));
console.log(`Total platforms tested: ${PLATFORMS.length}`);
console.log(`✅ Successful: ${successful}`);
console.log(`❌ Failed: ${failed}`);
console.log(`🏆 Production-grade: ${productionGrade}`);
console.log('\nSee full report at: ' + REPORT_PATH);
console.log('='.repeat(60) + '\n');

/**
 * Analyze exported output directory
 */
function analyzeOutput(dir) {
  const analysis = {
    fileCount: 0,
    totalSize: 0,
    sizeFormatted: '0 KB',
    fileTypes: {},
    hasTests: false,
    hasDocs: false,
    hasConfig: false,
    hasCI: false,
    files: []
  };

  function scanDir(currentDir, relativePath = '') {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const relPath = join(relativePath, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        scanDir(fullPath, relPath);
      } else {
        analysis.fileCount++;
        analysis.totalSize += stats.size;
        analysis.files.push({
          path: relPath,
          size: stats.size
        });

        const ext = extname(entry).toLowerCase();
        analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;

        // Check for production indicators
        const lowerPath = relPath.toLowerCase();
        const lowerName = entry.toLowerCase();

        if (lowerPath.includes('test') || lowerName.includes('test') || ext === '.test' || ext === '.spec') {
          analysis.hasTests = true;
        }
        if (lowerName === 'readme.md' || lowerName === 'readme' || lowerPath.includes('doc')) {
          analysis.hasDocs = true;
        }
        if (lowerName.includes('config') || lowerName === 'package.json' || lowerName === 'composer.json' || lowerName === '.env' || ext === '.yaml' || ext === '.yml' || ext === '.json') {
          analysis.hasConfig = true;
        }
        if (lowerName.includes('ci') || lowerName.includes('gitlab') || lowerName.includes('github') || lowerName === '.gitlab-ci.yml' || lowerName === '.github') {
          analysis.hasCI = true;
        }
      }
    }
  }

  scanDir(dir);

  // Format size
  if (analysis.totalSize < 1024) {
    analysis.sizeFormatted = analysis.totalSize + ' B';
  } else if (analysis.totalSize < 1024 * 1024) {
    analysis.sizeFormatted = (analysis.totalSize / 1024).toFixed(2) + ' KB';
  } else {
    analysis.sizeFormatted = (analysis.totalSize / (1024 * 1024)).toFixed(2) + ' MB';
  }

  return analysis;
}

/**
 * Generate markdown report
 */
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const successful = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  const productionGrade = results.filter(r => r.productionGrade === '✅').length;

  let report = `# OSSA Export Test Report

**Generated**: ${timestamp}
**Test Manifest**: ${TEST_MANIFEST}
**Output Directory**: ${OUTPUT_BASE}

## Summary

- **Total platforms tested**: ${PLATFORMS.length}
- **✅ Successful**: ${successful}
- **❌ Failed**: ${failed}
- **🏆 Production-grade**: ${productionGrade}

## Results Overview

| Platform | Status | Files | Size | Tests | Docs | Config | CI | Production-Grade |
|----------|--------|-------|------|-------|------|--------|----|--------------------|
`;

  for (const result of results) {
    report += `| ${result.platform} | ${result.status} | ${result.fileCount} | ${result.sizeFormatted} | ${result.hasTests ? '✅' : '❌'} | ${result.hasDocs ? '✅' : '❌'} | ${result.hasConfig ? '✅' : '❌'} | ${result.hasCI ? '✅' : '❌'} | ${result.productionGrade} |\n`;
  }

  report += '\n## Detailed Results\n\n';

  for (const result of results) {
    report += `### ${result.platform}\n\n`;
    report += `**Status**: ${result.status}\n\n`;

    if (result.status === '✅') {
      report += `**Files Generated**: ${result.fileCount}  \n`;
      report += `**Total Size**: ${result.sizeFormatted}  \n`;
      report += `**Production Indicators**:\n`;
      report += `- Tests: ${result.hasTests ? '✅ Yes' : '❌ No'}\n`;
      report += `- Documentation: ${result.hasDocs ? '✅ Yes' : '❌ No'}\n`;
      report += `- Configuration: ${result.hasConfig ? '✅ Yes' : '❌ No'}\n`;
      report += `- CI/CD: ${result.hasCI ? '✅ Yes' : '❌ No'}\n`;
      report += `\n**File Types**:\n`;

      const sortedTypes = Object.entries(result.fileTypes)
        .sort((a, b) => b[1] - a[1]);

      for (const [ext, count] of sortedTypes) {
        report += `- ${ext || '(no extension)'}: ${count} file${count > 1 ? 's' : ''}\n`;
      }

      report += `\n**Top 10 Files by Size**:\n`;
      const sortedFiles = result.files
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);

      for (const file of sortedFiles) {
        const sizeKB = (file.size / 1024).toFixed(2);
        report += `- ${file.path} (${sizeKB} KB)\n`;
      }

    } else {
      report += `**Error**: ${result.error}\n`;
    }

    report += '\n---\n\n';
  }

  report += `## Issues Found\n\n`;

  const issues = [];

  // Check for failures
  const failedPlatforms = results.filter(r => r.status === '❌');
  if (failedPlatforms.length > 0) {
    issues.push(`### ❌ Failed Platforms (${failedPlatforms.length})\n\n` +
      failedPlatforms.map(r => `- **${r.platform}**: ${r.error}`).join('\n'));
  }

  // Check for weak exports (<5 files)
  const weakExports = results.filter(r => r.status === '✅' && r.fileCount < 5);
  if (weakExports.length > 0) {
    issues.push(`### ⚠️  Weak Exports (<5 files) (${weakExports.length})\n\n` +
      weakExports.map(r => `- **${r.platform}**: Only ${r.fileCount} files generated`).join('\n'));
  }

  // Check for missing tests
  const noTests = results.filter(r => r.status === '✅' && !r.hasTests);
  if (noTests.length > 0) {
    issues.push(`### ⚠️  Missing Tests (${noTests.length})\n\n` +
      noTests.map(r => `- **${r.platform}**: No test files found`).join('\n'));
  }

  // Check for missing docs
  const noDocs = results.filter(r => r.status === '✅' && !r.hasDocs);
  if (noDocs.length > 0) {
    issues.push(`### ⚠️  Missing Documentation (${noDocs.length})\n\n` +
      noDocs.map(r => `- **${r.platform}**: No documentation files found`).join('\n'));
  }

  if (issues.length > 0) {
    report += issues.join('\n\n') + '\n\n';
  } else {
    report += '✅ No issues found! All platforms working perfectly.\n\n';
  }

  report += `## Recommendations\n\n`;

  if (failedPlatforms.length > 0) {
    report += `1. **Fix Failed Platforms**: ${failedPlatforms.map(r => r.platform).join(', ')}\n`;
  }

  if (weakExports.length > 0) {
    report += `2. **Strengthen Weak Exports**: Add more files and functionality to ${weakExports.map(r => r.platform).join(', ')}\n`;
  }

  if (noTests.length > 0) {
    report += `3. **Add Tests**: Implement test coverage for ${noTests.map(r => r.platform).join(', ')}\n`;
  }

  if (noDocs.length > 0) {
    report += `4. **Add Documentation**: Create README and docs for ${noDocs.map(r => r.platform).join(', ')}\n`;
  }

  const notProdGrade = results.filter(r => r.status === '✅' && r.productionGrade !== '✅');
  if (notProdGrade.length > 0) {
    report += `5. **Improve Production Readiness**: Enhance ${notProdGrade.map(r => r.platform).join(', ')} to production-grade quality\n`;
  }

  if (issues.length === 0 && notProdGrade.length === 0) {
    report += '🎉 All platforms are production-grade! No recommendations needed.\n';
  }

  report += `\n---\n\n*Report generated by OSSA comprehensive export test*\n`;

  return report;
}
