#!/usr/bin/env node
/**
 * Quick test of the Delete Later Auditor Agent
 */

import { DeleteLaterAuditor } from './src/agents/auditors/delete-later-auditor.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

async function runQuickTest() {
  console.log(chalk.blue('🧪 Quick Test: Delete Later Auditor'));
  console.log(chalk.gray('==================================\n'));

  const auditor = new DeleteLaterAuditor();

  // Check if __DELETE_LATER directories exist
  const testDirs = [
    '/Users/flux423/Sites/LLM/__DELETE_LATER',
    '/Users/flux423/Sites/LLM/__DELETE_LATER_LATER'
  ];

  const existingDirs = [];
  for (const dir of testDirs) {
    try {
      await fs.access(dir);
      existingDirs.push(dir);
      console.log(chalk.green(`✅ Found directory: ${dir}`));
    } catch {
      console.log(chalk.yellow(`⚠️  Directory not found: ${dir}`));
    }
  }

  if (existingDirs.length === 0) {
    console.log(chalk.red('❌ No __DELETE_LATER directories found for testing'));
    return false;
  }

  try {
    console.log(chalk.cyan('\n🔍 Starting audit...'));
    
    const startTime = Date.now();
    const report = await auditor.performAudit({
      target_directories: existingDirs,
      scan_depth: 3, // Limit depth for quick test
      file_size_limit: 10 * 1024 * 1024, // 10MB limit
      dry_run: true // SAFETY: Dry run only
    });
    
    const executionTime = Math.round((Date.now() - startTime) / 1000 * 100) / 100;

    console.log(chalk.green('\n✅ Audit completed successfully!'));
    console.log(chalk.blue('\n📊 Results Summary:'));
    console.log(`   Files analyzed: ${report.summary.total_files}`);
    console.log(`   Total size: ${Math.round(report.summary.total_size / 1024 / 1024)} MB`);
    console.log(`   Execution time: ${executionTime}s`);
    
    if (report.credentials.length > 0) {
      console.log(chalk.red(`\n🚨 SECURITY ALERT: ${report.credentials.length} potential credentials found!`));
      console.log(`   Critical: ${report.risk_assessment.critical}`);
      console.log(`   High: ${report.risk_assessment.high}`);
      console.log(`   Medium: ${report.risk_assessment.medium}`);
      console.log(`   Low: ${report.risk_assessment.low}`);
      
      // Show first few findings
      console.log(chalk.red('\n📋 Sample findings:'));
      for (const finding of report.credentials.slice(0, 3)) {
        console.log(`   ${chalk.red('⚠️')} ${path.basename(finding.file_path)}:${finding.line_number} (${finding.risk_level})`);
      }
      if (report.credentials.length > 3) {
        console.log(chalk.gray(`   ... and ${report.credentials.length - 3} more`));
      }
    } else {
      console.log(chalk.green('\n🔒 No exposed credentials detected'));
    }

    if (report.duplicates.length > 0) {
      const totalSavings = report.duplicates.reduce((sum, g) => sum + g.potential_savings, 0);
      const savingsMB = Math.round(totalSavings / 1024 / 1024 * 100) / 100;
      
      console.log(chalk.yellow(`\n📋 Found ${report.duplicates.length} duplicate file groups`));
      console.log(`   Potential savings: ${savingsMB} MB`);
      
      // Show largest duplicate group
      const largest = report.duplicates[0];
      if (largest) {
        const sizeMB = Math.round(largest.size / 1024 / 1024 * 100) / 100;
        console.log(`   Largest group: ${largest.files.length} files × ${sizeMB} MB each`);
      }
    } else {
      console.log(chalk.green('\n📋 No duplicate files found'));
    }

    if (report.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 Key Recommendations:'));
      for (const rec of report.recommendations.slice(0, 3)) {
        console.log(`   • ${rec}`);
      }
    }

    // Test cleanup plan generation
    console.log(chalk.cyan('\n🗂️  Generating cleanup plan...'));
    const plan = await auditor.generateCleanupPlan({
      target_directories: existingDirs,
      dry_run: true
    });

    const planSavingsMB = Math.round(plan.total_savings / 1024 / 1024 * 100) / 100;
    console.log(`   Safe to delete: ${plan.safe_to_delete.length} files`);
    console.log(`   Quarantine: ${plan.quarantine.length} files`);
    console.log(`   Manual review: ${plan.manual_review.length} files`);
    console.log(`   Total savings: ${planSavingsMB} MB`);
    console.log(`   Estimated time: ${Math.round(plan.estimated_time)}s`);

    console.log(chalk.green('\n🎉 Test completed successfully!'));
    
    // Write test report
    const reportPath = path.join(process.cwd(), 'OSSA/.agents/reports', `quick-test-${new Date().toISOString().split('T')[0]}.json`);
    try {
      await fs.writeFile(reportPath, JSON.stringify({
        test_type: 'quick_validation',
        timestamp: new Date().toISOString(),
        execution_time: executionTime,
        directories_tested: existingDirs,
        report,
        cleanup_plan: plan
      }, null, 2));
      console.log(chalk.blue(`📄 Test report saved: ${reportPath}`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not save report: ${error.message}`));
    }

    return true;
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
    return false;
  }
}

// Run the test
runQuickTest()
  .then(success => {
    if (success) {
      console.log(chalk.green('\n✅ All tests passed - Delete Later Auditor is working correctly!'));
      process.exit(0);
    } else {
      console.log(chalk.red('\n❌ Tests failed - Review the errors above'));
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(chalk.red('\n💥 Test runner crashed:'), error);
    process.exit(1);
  });