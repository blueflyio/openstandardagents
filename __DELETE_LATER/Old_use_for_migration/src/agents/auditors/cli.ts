#!/usr/bin/env node
/**
 * CLI interface for Delete Later Auditor Agent
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DeleteLaterAuditor, AuditRequest, AuditReport, CleanupPlan } from './delete-later-auditor.js';

const program = new Command();

program
  .name('delete-later-auditor')
  .description('Comprehensive auditing for __DELETE_LATER directories')
  .version('1.0.0');

program
  .command('audit')
  .description('Perform comprehensive audit of __DELETE_LATER directories')
  .argument('[directories...]', 'Target directories to audit (default: find __DELETE_LATER dirs)')
  .option('-d, --depth <number>', 'Maximum scan depth', '10')
  .option('-s, --size-limit <bytes>', 'Maximum file size to analyze', '104857600')
  .option('--exclude <patterns...>', 'Additional exclude patterns')
  .option('--patterns <patterns...>', 'Additional credential patterns')
  .option('-o, --output <file>', 'Output report to file')
  .option('--format <format>', 'Output format (json|markdown|html)', 'json')
  .option('--no-dry-run', 'Allow actual operations (dangerous!)')
  .action(async (directories, options) => {
    try {
      console.log(chalk.blue('🔍 Starting Delete Later Audit...'));
      
      // Auto-discover __DELETE_LATER directories if none provided
      const targetDirs = directories.length > 0 
        ? directories 
        : await discoverDeleteLaterDirectories();
      
      if (targetDirs.length === 0) {
        console.log(chalk.yellow('⚠️ No __DELETE_LATER directories found'));
        process.exit(1);
      }

      console.log(chalk.cyan(`📁 Target directories: ${targetDirs.length}`));
      targetDirs.forEach(dir => console.log(`  - ${dir}`));

      const auditor = new DeleteLaterAuditor(
        options.patterns,
        options.exclude
      );

      const request: AuditRequest = {
        target_directories: targetDirs,
        scan_depth: parseInt(options.depth),
        file_size_limit: parseInt(options.sizeLimit),
        credential_patterns: options.patterns,
        exclude_patterns: options.exclude,
        dry_run: options.dryRun !== false
      };

      const report = await auditor.performAudit(request);
      
      await outputReport(report, options.output, options.format);
      displaySummary(report);
      
      if (report.credentials.length > 0) {
        console.log(chalk.red('🚨 CRITICAL: Exposed credentials detected!'));
        console.log(chalk.red('Review the report and take immediate action.'));
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Audit failed:'), error);
      process.exit(1);
    }
  });

program
  .command('scan-credentials')
  .description('Scan specifically for exposed credentials')
  .argument('[directories...]', 'Target directories')
  .option('--patterns <patterns...>', 'Additional credential patterns')
  .option('-o, --output <file>', 'Output findings to file')
  .action(async (directories, options) => {
    try {
      const targetDirs = directories.length > 0 
        ? directories 
        : await discoverDeleteLaterDirectories();

      const auditor = new DeleteLaterAuditor(options.patterns);
      const report = await auditor.performAudit({ 
        target_directories: targetDirs,
        dry_run: true 
      });

      console.log(chalk.blue(`🔒 Credential Scan Results:`));
      console.log(`Files scanned: ${report.summary.total_files}`);
      console.log(`Credentials found: ${report.credentials.length}`);
      
      if (report.credentials.length > 0) {
        console.log(chalk.red('\n🚨 EXPOSED CREDENTIALS DETECTED:'));
        
        for (const finding of report.credentials) {
          console.log(chalk.red(`\n📄 ${path.basename(finding.file_path)}`));
          console.log(`   Line: ${finding.line_number}`);
          console.log(`   Risk: ${finding.risk_level.toUpperCase()}`);
          console.log(`   Pattern: ${finding.pattern_matched}`);
          console.log(`   Context: ${finding.context}`);
        }
        
        if (options.output) {
          await fs.writeFile(options.output, JSON.stringify({
            scan_type: 'credentials',
            timestamp: new Date().toISOString(),
            findings: report.credentials
          }, null, 2));
          console.log(chalk.green(`\n📝 Detailed report saved to: ${options.output}`));
        }
      } else {
        console.log(chalk.green('✅ No exposed credentials found'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Credential scan failed:'), error);
      process.exit(1);
    }
  });

program
  .command('find-duplicates')
  .description('Find and analyze duplicate files')
  .argument('[directories...]', 'Target directories')
  .option('-m, --min-size <bytes>', 'Minimum file size to consider', '1024')
  .option('-o, --output <file>', 'Output report to file')
  .action(async (directories, options) => {
    try {
      const targetDirs = directories.length > 0 
        ? directories 
        : await discoverDeleteLaterDirectories();

      const auditor = new DeleteLaterAuditor();
      const report = await auditor.performAudit({ 
        target_directories: targetDirs,
        dry_run: true 
      });

      console.log(chalk.blue(`📋 Duplicate Analysis Results:`));
      console.log(`Files analyzed: ${report.summary.total_files}`);
      console.log(`Duplicate groups: ${report.duplicates.length}`);
      
      if (report.duplicates.length > 0) {
        const totalSavings = report.duplicates.reduce((sum, g) => sum + g.potential_savings, 0);
        const savingsMB = Math.round(totalSavings / 1024 / 1024 * 100) / 100;
        
        console.log(chalk.yellow(`\n💾 Potential savings: ${savingsMB} MB`));
        console.log(chalk.yellow(`\n🔄 Top duplicate groups:`));
        
        for (const group of report.duplicates.slice(0, 10)) {
          const sizeMB = Math.round(group.size / 1024 / 1024 * 100) / 100;
          const savingsMB = Math.round(group.potential_savings / 1024 / 1024 * 100) / 100;
          
          console.log(`\n📁 ${group.files.length} identical files (${sizeMB} MB each, save ${savingsMB} MB):`);
          group.files.forEach(file => {
            console.log(`   ${path.basename(file.path)} (${file.last_modified.toISOString().split('T')[0]})`);
          });
        }
        
        if (options.output) {
          await fs.writeFile(options.output, JSON.stringify({
            scan_type: 'duplicates',
            timestamp: new Date().toISOString(),
            summary: { total_savings_mb: savingsMB },
            duplicate_groups: report.duplicates
          }, null, 2));
          console.log(chalk.green(`\n📝 Detailed report saved to: ${options.output}`));
        }
      } else {
        console.log(chalk.green('✅ No duplicate files found'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Duplicate scan failed:'), error);
      process.exit(1);
    }
  });

program
  .command('cleanup-plan')
  .description('Generate cleanup plan without executing')
  .argument('[directories...]', 'Target directories')
  .option('--aggressive', 'Include potentially risky cleanup operations')
  .option('-o, --output <file>', 'Output plan to file')
  .action(async (directories, options) => {
    try {
      const targetDirs = directories.length > 0 
        ? directories 
        : await discoverDeleteLaterDirectories();

      const auditor = new DeleteLaterAuditor();
      const plan = await auditor.generateCleanupPlan({
        target_directories: targetDirs,
        dry_run: true
      }, options.aggressive);

      console.log(chalk.blue('📋 Cleanup Plan Generated:'));
      
      const savingsMB = Math.round(plan.total_savings / 1024 / 1024 * 100) / 100;
      console.log(`\n💾 Total potential savings: ${savingsMB} MB`);
      console.log(`⏱️  Estimated execution time: ${Math.round(plan.estimated_time)} seconds`);
      
      if (plan.safe_to_delete.length > 0) {
        console.log(chalk.green(`\n✅ Safe to delete (${plan.safe_to_delete.length} files):`));
        plan.safe_to_delete.slice(0, 10).forEach(file => {
          console.log(`   ${path.basename(file)}`);
        });
        if (plan.safe_to_delete.length > 10) {
          console.log(chalk.gray(`   ... and ${plan.safe_to_delete.length - 10} more`));
        }
      }
      
      if (plan.quarantine.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Move to quarantine (${plan.quarantine.length} files):`));
        plan.quarantine.slice(0, 5).forEach(file => {
          console.log(`   ${path.basename(file)}`);
        });
        if (plan.quarantine.length > 5) {
          console.log(chalk.gray(`   ... and ${plan.quarantine.length - 5} more`));
        }
      }
      
      if (plan.manual_review.length > 0) {
        console.log(chalk.red(`\n👀 Requires manual review (${plan.manual_review.length} files):`));
        plan.manual_review.slice(0, 5).forEach(file => {
          console.log(`   ${path.basename(file)}`);
        });
        if (plan.manual_review.length > 5) {
          console.log(chalk.gray(`   ... and ${plan.manual_review.length - 5} more`));
        }
      }
      
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify({
          plan_type: 'cleanup',
          timestamp: new Date().toISOString(),
          aggressive_mode: options.aggressive,
          ...plan
        }, null, 2));
        console.log(chalk.green(`\n📝 Cleanup plan saved to: ${options.output}`));
      }
      
      console.log(chalk.blue('\n🚨 NOTE: This is a dry-run plan. No files were actually modified.'));
      
    } catch (error) {
      console.error(chalk.red('❌ Cleanup plan generation failed:'), error);
      process.exit(1);
    }
  });

program
  .command('discover')
  .description('Discover __DELETE_LATER directories in current workspace')
  .option('--depth <number>', 'Maximum search depth', '5')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Discovering __DELETE_LATER directories...'));
      
      const directories = await discoverDeleteLaterDirectories(process.cwd(), parseInt(options.depth));
      
      if (directories.length > 0) {
        console.log(chalk.green(`\n✅ Found ${directories.length} directories:`));
        for (const dir of directories) {
          const stats = await fs.stat(dir);
          console.log(`📁 ${dir} (modified: ${stats.mtime.toISOString().split('T')[0]})`);
        }
      } else {
        console.log(chalk.yellow('⚠️ No __DELETE_LATER directories found'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Discovery failed:'), error);
      process.exit(1);
    }
  });

/**
 * Auto-discover __DELETE_LATER directories
 */
async function discoverDeleteLaterDirectories(startDir = process.cwd(), maxDepth = 5): Promise<string[]> {
  const directories: string[] = [];
  
  async function searchDirectory(dir: string, depth: number) {
    if (depth > maxDepth) return;
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.name.startsWith('__DELETE_LATER')) {
            directories.push(fullPath);
          } else if (!entry.name.startsWith('.') && !entry.name.includes('node_modules')) {
            await searchDirectory(fullPath, depth + 1);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors, etc.
    }
  }
  
  await searchDirectory(startDir, 0);
  return directories.sort();
}

/**
 * Output report in specified format
 */
async function outputReport(report: AuditReport, outputFile?: string, format = 'json') {
  if (!outputFile) return;
  
  let content: string;
  
  switch (format) {
    case 'markdown':
      content = generateMarkdownReport(report);
      break;
    case 'html':
      content = generateHtmlReport(report);
      break;
    case 'json':
    default:
      content = JSON.stringify(report, null, 2);
      break;
  }
  
  await fs.writeFile(outputFile, content);
  console.log(chalk.green(`📝 Report saved to: ${outputFile}`));
}

/**
 * Display summary of audit results
 */
function displaySummary(report: AuditReport) {
  console.log(chalk.blue('\n📊 Audit Summary:'));
  console.log(`Files analyzed: ${report.summary.total_files}`);
  console.log(`Total size: ${Math.round(report.summary.total_size / 1024 / 1024)} MB`);
  console.log(`Execution time: ${Math.round(report.execution_time * 100) / 100}s`);
  
  if (report.credentials.length > 0) {
    console.log(chalk.red(`🔒 Credentials found: ${report.credentials.length}`));
    console.log(`   Critical: ${report.risk_assessment.critical}`);
    console.log(`   High: ${report.risk_assessment.high}`);
    console.log(`   Medium: ${report.risk_assessment.medium}`);
    console.log(`   Low: ${report.risk_assessment.low}`);
  }
  
  if (report.duplicates.length > 0) {
    const savingsMB = Math.round(report.summary.potential_cleanup_size / 1024 / 1024);
    console.log(chalk.yellow(`📋 Duplicate groups: ${report.duplicates.length}`));
    console.log(chalk.yellow(`💾 Potential savings: ${savingsMB} MB`));
  }
  
  if (report.recommendations.length > 0) {
    console.log(chalk.blue('\n💡 Recommendations:'));
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: AuditReport): string {
  const timestamp = new Date().toISOString();
  
  return `# Delete Later Audit Report

Generated: ${timestamp}

## Summary

- **Files Analyzed**: ${report.summary.total_files}
- **Total Size**: ${Math.round(report.summary.total_size / 1024 / 1024)} MB
- **Credentials Found**: ${report.credentials.length}
- **Duplicate Groups**: ${report.duplicates.length}
- **Potential Savings**: ${Math.round(report.summary.potential_cleanup_size / 1024 / 1024)} MB
- **Execution Time**: ${Math.round(report.execution_time * 100) / 100}s

## Risk Assessment

- Critical: ${report.risk_assessment.critical}
- High: ${report.risk_assessment.high}
- Medium: ${report.risk_assessment.medium}
- Low: ${report.risk_assessment.low}

${report.credentials.length > 0 ? `## 🚨 Exposed Credentials

${report.credentials.map(cred => `
### ${path.basename(cred.file_path)} (Line ${cred.line_number})
- **Risk Level**: ${cred.risk_level.toUpperCase()}
- **Pattern**: \`${cred.pattern_matched}\`
- **Context**: \`${cred.context}\`
- **Recommendations**:
${cred.recommendations.map(rec => `  - ${rec}`).join('\n')}
`).join('\n')}` : ''}

${report.duplicates.length > 0 ? `## 📋 Duplicate Files

${report.duplicates.slice(0, 10).map(group => `
### Group (${group.files.length} files, ${Math.round(group.size / 1024)} KB each)
**Potential Savings**: ${Math.round(group.potential_savings / 1024)} KB

Files:
${group.files.map(file => `- ${path.basename(file.path)} (${file.last_modified.toISOString().split('T')[0]})`).join('\n')}
`).join('\n')}` : ''}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

---
Generated by OSSA Delete Later Auditor Agent v1.0.0
`;
}

/**
 * Generate HTML report
 */
function generateHtmlReport(report: AuditReport): string {
  const timestamp = new Date().toISOString();
  
  return `<!DOCTYPE html>
<html>
<head>
    <title>Delete Later Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007acc; }
        .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
        .critical { border-left: 4px solid #dc3545; background: #fff5f5; }
        .high { border-left: 4px solid #fd7e14; background: #fff8f1; }
        .medium { border-left: 4px solid #ffc107; background: #fffaf0; }
        .low { border-left: 4px solid #28a745; background: #f8fff8; }
        .credential { margin: 15px 0; padding: 15px; border-radius: 5px; }
        .duplicate-group { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .recommendations { background: #e7f3ff; padding: 20px; border-radius: 5px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Delete Later Audit Report</h1>
            <p><strong>Generated:</strong> ${timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="stat">
                <div class="stat-value">${report.summary.total_files}</div>
                <div class="stat-label">Files Analyzed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${Math.round(report.summary.total_size / 1024 / 1024)}</div>
                <div class="stat-label">Total Size (MB)</div>
            </div>
            <div class="stat">
                <div class="stat-value">${report.credentials.length}</div>
                <div class="stat-label">Credentials Found</div>
            </div>
            <div class="stat">
                <div class="stat-value">${report.duplicates.length}</div>
                <div class="stat-label">Duplicate Groups</div>
            </div>
            <div class="stat">
                <div class="stat-value">${Math.round(report.summary.potential_cleanup_size / 1024 / 1024)}</div>
                <div class="stat-label">Potential Savings (MB)</div>
            </div>
        </div>
        
        ${report.credentials.length > 0 ? `
        <h2>🚨 Exposed Credentials</h2>
        ${report.credentials.map(cred => `
        <div class="credential ${cred.risk_level}">
            <h3>${path.basename(cred.file_path)} (Line ${cred.line_number})</h3>
            <p><strong>Risk Level:</strong> ${cred.risk_level.toUpperCase()}</p>
            <p><strong>Pattern:</strong> <code>${cred.pattern_matched}</code></p>
            <p><strong>Context:</strong> <code>${cred.context}</code></p>
            <p><strong>Recommendations:</strong></p>
            <ul>${cred.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
        </div>
        `).join('')}
        ` : ''}
        
        ${report.duplicates.length > 0 ? `
        <h2>📋 Duplicate Files</h2>
        ${report.duplicates.slice(0, 10).map(group => `
        <div class="duplicate-group">
            <h3>${group.files.length} identical files (${Math.round(group.size / 1024)} KB each)</h3>
            <p><strong>Potential Savings:</strong> ${Math.round(group.potential_savings / 1024)} KB</p>
            <p><strong>Files:</strong></p>
            <ul>${group.files.map(file => `<li>${path.basename(file.path)} (${file.last_modified.toISOString().split('T')[0]})</li>`).join('')}</ul>
        </div>
        `).join('')}
        ` : ''}
        
        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            <ul>${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="text-align: center; color: #666; font-size: 12px;">
            Generated by OSSA Delete Later Auditor Agent v1.0.0
        </p>
    </div>
</body>
</html>`;
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}