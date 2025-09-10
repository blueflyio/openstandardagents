#!/usr/bin/env node
/**
 * Simple test of auditor concepts without TypeScript complexity
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';
import chalk from 'chalk';

/**
 * Simple file auditor implementation
 */
class SimpleAuditor {
  constructor() {
    this.credentialPatterns = [
      /sk-[a-zA-Z0-9]{48}/g,
      /claude-[a-zA-Z0-9-]{32,}/g,
      /ghp_[a-zA-Z0-9]{36}/g,
      /glpat-[a-zA-Z0-9_-]{20}/g,
      /xoxb-[a-zA-Z0-9-]+/g,
      /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g
    ];
  }

  async auditDirectories(directories) {
    console.log(chalk.blue(`🔍 Auditing ${directories.length} directories...`));
    
    const results = {
      files: [],
      credentials: [],
      duplicates: [],
      summary: { total_files: 0, total_size: 0 }
    };

    for (const dir of directories) {
      try {
        console.log(chalk.cyan(`📁 Scanning: ${dir}`));
        
        // Get all files
        const pattern = path.join(dir, '**/*');
        const files = await glob(pattern, {
          ignore: ['**/node_modules/**', '**/.git/**', '**/*.log'],
          maxDepth: 5,
          absolute: true,
          nodir: true
        });

        console.log(chalk.gray(`   Found ${files.length} files`));

        for (const file of files.slice(0, 100)) { // Limit for testing
          try {
            const stats = await fs.stat(file);
            
            results.files.push({
              path: file,
              size: stats.size,
              modified: stats.mtime
            });
            
            results.summary.total_files++;
            results.summary.total_size += stats.size;

            // Check for credentials (text files only)
            if (stats.size < 1024 * 1024 && !this.isBinaryFile(file)) { // < 1MB
              await this.scanFileForCredentials(file, results);
            }

          } catch (error) {
            console.warn(chalk.yellow(`⚠️ Could not process: ${path.basename(file)}`));
          }
        }

        console.log(chalk.gray(`   Processed ${Math.min(files.length, 100)} files`));

      } catch (error) {
        console.error(chalk.red(`❌ Error scanning ${dir}:`), error.message);
      }
    }

    return results;
  }

  async scanFileForCredentials(filePath, results) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        for (const pattern of this.credentialPatterns) {
          pattern.lastIndex = 0;
          const matches = [...line.matchAll(pattern)];
          
          for (const match of matches) {
            if (match[0] && match[0].length > 10) {
              results.credentials.push({
                file: filePath,
                line: lineIndex + 1,
                pattern: pattern.source,
                match: match[0].substring(0, 10) + '...',
                risk: this.assessRisk(match[0])
              });
            }
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read as text
    }
  }

  isBinaryFile(filePath) {
    const binaryExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', 
      '.tar', '.gz', '.exe', '.dll', '.so', '.dylib'
    ];
    const ext = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  assessRisk(match) {
    if (match.startsWith('sk-') || match.startsWith('claude-') || match.startsWith('ghp_')) {
      return 'critical';
    }
    if (match.length > 32) {
      return 'high';
    }
    if (match.length > 16) {
      return 'medium';
    }
    return 'low';
  }
}

async function runTest() {
  console.log(chalk.blue('🧪 Simple Delete Later Auditor Test'));
  console.log(chalk.gray('===================================\n'));

  const auditor = new SimpleAuditor();

  // Test directories
  const testDirs = [
    '/Users/flux423/Sites/LLM/__DELETE_LATER',
    '/Users/flux423/Sites/LLM/__DELETE_LATER_LATER'
  ];

  const existingDirs = [];
  for (const dir of testDirs) {
    try {
      await fs.access(dir);
      existingDirs.push(dir);
    } catch {
      console.log(chalk.yellow(`⚠️ Directory not found: ${dir}`));
    }
  }

  if (existingDirs.length === 0) {
    console.log(chalk.red('❌ No test directories found'));
    return false;
  }

  try {
    const startTime = Date.now();
    const results = await auditor.auditDirectories(existingDirs);
    const executionTime = Math.round((Date.now() - startTime) / 1000 * 100) / 100;

    console.log(chalk.green('\n✅ Audit completed!'));
    console.log(chalk.blue('\n📊 Results:'));
    console.log(`   Files processed: ${results.summary.total_files}`);
    console.log(`   Total size: ${Math.round(results.summary.total_size / 1024 / 1024)} MB`);
    console.log(`   Execution time: ${executionTime}s`);

    if (results.credentials.length > 0) {
      console.log(chalk.red(`\n🚨 Found ${results.credentials.length} potential credentials!`));
      
      const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      results.credentials.forEach(cred => riskCounts[cred.risk]++);
      
      console.log(`   Critical: ${riskCounts.critical}`);
      console.log(`   High: ${riskCounts.high}`);
      console.log(`   Medium: ${riskCounts.medium}`);
      console.log(`   Low: ${riskCounts.low}`);

      console.log(chalk.red('\n📋 Sample findings:'));
      for (const cred of results.credentials.slice(0, 5)) {
        console.log(`   ${chalk.red('⚠️')} ${path.basename(cred.file)}:${cred.line} (${cred.risk}) - ${cred.match}`);
      }
    } else {
      console.log(chalk.green('\n🔒 No credentials detected'));
    }

    // Save simple report
    const reportPath = `/Users/flux423/Sites/LLM/OSSA/.agents/reports/simple-test-${new Date().toISOString().split('T')[0]}.json`;
    try {
      await fs.writeFile(reportPath, JSON.stringify({
        test_type: 'simple_validation',
        timestamp: new Date().toISOString(),
        execution_time: executionTime,
        directories: existingDirs,
        summary: results.summary,
        credentials: results.credentials.map(c => ({
          file: path.basename(c.file),
          line: c.line,
          risk: c.risk
        }))
      }, null, 2));
      console.log(chalk.blue(`\n📄 Report saved: ${reportPath}`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not save report: ${error.message}`));
    }

    console.log(chalk.green('\n🎉 Test completed successfully!'));
    return true;

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
    return false;
  }
}

// Run the test
runTest()
  .then(success => {
    console.log(success ? 
      chalk.green('\n✅ Simple auditor test passed!') : 
      chalk.red('\n❌ Test failed')
    );
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red('Test runner error:'), error);
    process.exit(1);
  });