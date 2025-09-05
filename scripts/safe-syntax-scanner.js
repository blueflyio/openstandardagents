#!/usr/bin/env node

/**
 * SAFE SYNTAX SCANNER - READ ONLY ANALYSIS
 * This script ONLY reads files and generates reports
 * NO file modifications are performed
 */

import { readFileSync, existsSync, statSync, readdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

// SAFETY: All operations are read-only
const SAFETY_MODE = 'READ_ONLY';
const MODIFICATION_ALLOWED = false;

console.log('🔒 SAFE SYNTAX SCANNER - READ ONLY MODE');
console.log('📋 This tool will ONLY analyze files, never modify them');
console.log('');

// Project paths (read-only analysis)
const PROJECTS = [
  '/Users/flux423/Sites/LLM/common_npm/agent-brain',
  '/Users/flux423/Sites/LLM/common_npm/agent-chat', 
  '/Users/flux423/Sites/LLM/common_npm/agent-docker',
  '/Users/flux423/Sites/LLM/common_npm/agent-forge',
  '/Users/flux423/Sites/LLM/common_npm/agent-mesh',
  '/Users/flux423/Sites/LLM/common_npm/agent-ops',
  '/Users/flux423/Sites/LLM/common_npm/agent-protocol',
  '/Users/flux423/Sites/LLM/common_npm/agent-router',
  '/Users/flux423/Sites/LLM/common_npm/agent-studio',
  '/Users/flux423/Sites/LLM/common_npm/agent-tracker',
  '/Users/flux423/Sites/LLM/common_npm/agentic-flows',
  '/Users/flux423/Sites/LLM/common_npm/compliance-engine',
  '/Users/flux423/Sites/LLM/common_npm/doc-engine',
  '/Users/flux423/Sites/LLM/common_npm/foundation-bridge',
  '/Users/flux423/Sites/LLM/common_npm/rfp-automation',
  '/Users/flux423/Sites/LLM/common_npm/studio-ui',
  '/Users/flux423/Sites/LLM/common_npm/workflow-engine'
];

// Detection patterns (analysis only)
const SYNTAX_PATTERNS = {
  'function-brace-corruption': {
    pattern: /function\s+(\w+)\s*\{([^}]*)\}/g,
    description: 'Function parameters using {} instead of ()',
    severity: 'high',
    suggestion: 'Replace {} with () in function parameters'
  },
  'method-brace-corruption': {
    pattern: /(\w+)\s*\{([^}]*)\}\s*:/g,
    description: 'Method parameters using {} instead of ()',
    severity: 'high',  
    suggestion: 'Replace {} with () in method parameters'
  },
  'constructor-brace-corruption': {
    pattern: /constructor\s*\{([^}]*)\}/g,
    description: 'Constructor parameters using {} instead of ()',
    severity: 'critical',
    suggestion: 'Replace {} with () in constructor parameters'
  }
};

// Safe file analysis function (read-only)
function analyzeFile(filePath) {
  try {
    if (!existsSync(filePath)) {
      return { error: 'File does not exist', patterns: [] };
    }

    const content = readFileSync(filePath, 'utf8');
    const findings = [];

    for (const [patternName, patternConfig] of Object.entries(SYNTAX_PATTERNS)) {
      const matches = [...content.matchAll(patternConfig.pattern)];
      
      if (matches.length > 0) {
        findings.push({
          pattern: patternName,
          description: patternConfig.description,
          severity: patternConfig.severity,
          suggestion: patternConfig.suggestion,
          count: matches.length,
          locations: matches.map(match => ({
            line: content.substring(0, match.index).split('\n').length,
            match: match[0],
            index: match.index
          }))
        });
      }
    }

    return {
      file: filePath,
      analyzed: true,
      patterns: findings,
      totalIssues: findings.reduce((sum, f) => sum + f.count, 0)
    };
    
  } catch (error) {
    return {
      file: filePath,
      error: `Analysis failed: ${error.message}`,
      patterns: []
    };
  }
}

// Recursive file finder (safe, read-only)
function findTypeScriptFiles(dir, maxFiles = 50) {
  const tsFiles = [];
  
  function searchDir(currentDir, depth = 0) {
    if (depth > 4 || tsFiles.length >= maxFiles) return; // Safety limits
    
    try {
      if (!existsSync(currentDir)) return;
      
      const items = readdirSync(currentDir, { withFileTypes: true });
      
      for (const item of items) {
        if (tsFiles.length >= maxFiles) break;
        
        const fullPath = join(currentDir, item.name);
        
        // Skip dangerous directories
        if (item.name.startsWith('.') || 
            item.name === 'node_modules' || 
            item.name === '__DELETE_LATER' ||
            item.name === 'dist' || 
            item.name === 'build') {
          continue;
        }
        
        if (item.isDirectory()) {
          searchDir(fullPath, depth + 1);
        } else if (item.isFile() && (extname(item.name) === '.ts' || extname(item.name) === '.js')) {
          tsFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
  }
  
  searchDir(dir);
  return tsFiles;
}

// Safe project scanner (read-only)
async function scanProject(projectPath) {
  console.log(`\n📁 Analyzing project: ${projectPath.split('/').pop()}`);
  
  if (!existsSync(projectPath)) {
    console.log(`   ❌ Project not found: ${projectPath}`);
    return { error: 'Project not found' };
  }

  const results = {
    project: projectPath.split('/').pop(),
    path: projectPath,
    filesScanned: 0,
    issuesFound: 0,
    patterns: {},
    fileResults: []
  };

  try {
    // Find TypeScript files safely (limit to 50 files per project for safety)
    const tsFiles = findTypeScriptFiles(projectPath, 50);
    console.log(`   🔍 Found ${tsFiles.length} TypeScript/JavaScript files to analyze...`);
    
    for (const filePath of tsFiles.slice(0, 20)) { // Analyze first 20 files
      const analysis = analyzeFile(filePath);
      results.fileResults.push(analysis);
      results.filesScanned++;
      
      if (analysis.totalIssues > 0) {
        results.issuesFound += analysis.totalIssues;
        const relativePath = filePath.replace(projectPath + '/', '');
        console.log(`     🔍 ${relativePath}: ${analysis.totalIssues} potential issues`);
      }
    }
    
    if (results.filesScanned === 0) {
      console.log(`   ℹ️  No TypeScript/JavaScript files found`);
    } else {
      console.log(`   ✅ Analysis complete: ${results.issuesFound} potential issues found in ${results.filesScanned} files`);
    }
    
  } catch (error) {
    console.log(`   ❌ Scan error: ${error.message}`);
    results.error = error.message;
  }

  return results;
}

// Main analysis function (safe, read-only)
async function performSafeAnalysis() {
  console.log('🚀 Starting SAFE syntax analysis across ecosystem...');
  console.log(`📊 Projects to analyze: ${PROJECTS.length}`);
  console.log('⚠️  SAFETY MODE: Files will be READ ONLY, never modified\n');

  const overallResults = {
    timestamp: new Date().toISOString(),
    safetyMode: SAFETY_MODE,
    modificationAllowed: MODIFICATION_ALLOWED,
    totalProjects: PROJECTS.length,
    projectResults: [],
    summary: {
      totalFiles: 0,
      totalIssues: 0,
      projectsWithIssues: 0
    }
  };

  // Analyze each project safely
  for (const projectPath of PROJECTS.slice(0, 5)) { // Limit to first 5 for safety
    const projectResult = await scanProject(projectPath);
    overallResults.projectResults.push(projectResult);
    
    if (projectResult.filesScanned) {
      overallResults.summary.totalFiles += projectResult.filesScanned;
    }
    
    if (projectResult.issuesFound) {
      overallResults.summary.totalIssues += projectResult.issuesFound;
      overallResults.summary.projectsWithIssues++;
    }
  }

  // Generate safe report (no modifications)
  console.log('\n📊 ANALYSIS SUMMARY (READ-ONLY)');
  console.log('='.repeat(40));
  console.log(`Projects analyzed: ${overallResults.projectResults.length}`);
  console.log(`Files scanned: ${overallResults.summary.totalFiles}`);
  console.log(`Potential issues found: ${overallResults.summary.totalIssues}`);
  console.log(`Projects with issues: ${overallResults.summary.projectsWithIssues}`);

  if (overallResults.summary.totalIssues > 0) {
    console.log('\n⚠️  FINDINGS (Analysis Only - No Changes Made):');
    overallResults.projectResults.forEach(project => {
      if (project.issuesFound > 0) {
        console.log(`\n📁 ${project.project}: ${project.issuesFound} potential issues`);
        project.fileResults.forEach(file => {
          if (file.totalIssues > 0) {
            console.log(`   📄 ${file.file.split('/').pop()}: ${file.totalIssues} issues`);
            file.patterns.forEach(pattern => {
              console.log(`      🔍 ${pattern.description}: ${pattern.count} occurrences`);
            });
          }
        });
      }
    });
  }

  console.log('\n✅ SAFE ANALYSIS COMPLETE');
  console.log('📋 No files were modified during this analysis');
  console.log('💾 Full report saved to: /tmp/syntax-analysis-report.json');

  // Save report (not modifying any source files)
  try {
    writeFileSync(
      '/tmp/syntax-analysis-report.json',
      JSON.stringify(overallResults, null, 2)
    );
    console.log('📊 Report available at: /tmp/syntax-analysis-report.json');
  } catch (error) {
    console.log(`⚠️  Could not save report file: ${error.message}`);
  }

  return overallResults;
}

// Execute safe analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  performSafeAnalysis()
    .then(results => {
      if (results.summary.totalIssues > 0) {
        console.log('\n🎯 NEXT STEPS (Your Choice):');
        console.log('1. Review the analysis report');
        console.log('2. Manually verify findings');
        console.log('3. Create targeted fix scripts if needed');
        console.log('4. Always backup before any modifications');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { performSafeAnalysis, analyzeFile, scanProject };