/**
 * Test Runner for Delete Later Auditor Agent
 * 
 * Provides comprehensive testing of the auditor functionality
 * including dry-run validation and safety checks.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { DeleteLaterAuditor, AuditRequest } from './delete-later-auditor.js';

export interface TestConfig {
  test_directories: string[];
  expected_findings?: {
    credentials?: number;
    duplicates?: number;
    files?: number;
  };
  safety_checks: {
    dry_run_only: boolean;
    max_file_size: number;
    max_scan_depth: number;
  };
}

export class AuditorTestRunner {
  private auditor: DeleteLaterAuditor;
  private testResults: any[] = [];

  constructor() {
    this.auditor = new DeleteLaterAuditor();
  }

  /**
   * Run comprehensive test suite
   */
  async runTests(config: TestConfig): Promise<boolean> {
    console.log(chalk.blue('🧪 Starting Delete Later Auditor Test Suite'));
    console.log(chalk.gray('=====================================\n'));

    let allPassed = true;

    // Test 1: Basic functionality
    allPassed = await this.testBasicAudit(config) && allPassed;

    // Test 2: Credential detection
    allPassed = await this.testCredentialDetection(config) && allPassed;

    // Test 3: Duplicate detection  
    allPassed = await this.testDuplicateDetection(config) && allPassed;

    // Test 4: Dry run safety
    allPassed = await this.testDryRunSafety(config) && allPassed;

    // Test 5: Error handling
    allPassed = await this.testErrorHandling(config) && allPassed;

    // Test 6: Performance limits
    allPassed = await this.testPerformanceLimits(config) && allPassed;

    // Generate test report
    await this.generateTestReport();

    console.log(chalk.blue('\n🧪 Test Suite Complete'));
    console.log(allPassed ? chalk.green('✅ All tests passed') : chalk.red('❌ Some tests failed'));

    return allPassed;
  }

  /**
   * Test basic audit functionality
   */
  private async testBasicAudit(config: TestConfig): Promise<boolean> {
    console.log(chalk.cyan('Test 1: Basic Audit Functionality'));

    try {
      const request: AuditRequest = {
        target_directories: config.test_directories,
        scan_depth: config.safety_checks.max_scan_depth,
        file_size_limit: config.safety_checks.max_file_size,
        dry_run: config.safety_checks.dry_run_only
      };

      const startTime = Date.now();
      const report = await this.auditor.performAudit(request);
      const executionTime = Date.now() - startTime;

      // Validate report structure
      const hasRequiredFields = !!(
        report.summary &&
        Array.isArray(report.credentials) &&
        Array.isArray(report.duplicates) &&
        report.risk_assessment &&
        Array.isArray(report.recommendations)
      );

      const performanceOk = executionTime < 30000; // Should complete within 30s

      this.testResults.push({
        test: 'basic_audit',
        passed: hasRequiredFields && performanceOk,
        execution_time: executionTime,
        findings: {
          files: report.summary.total_files,
          credentials: report.credentials.length,
          duplicates: report.duplicates.length
        }
      });

      if (hasRequiredFields && performanceOk) {
        console.log(chalk.green('  ✅ Basic audit completed successfully'));
        console.log(chalk.gray(`     Files: ${report.summary.total_files}`));
        console.log(chalk.gray(`     Execution time: ${Math.round(executionTime / 1000 * 100) / 100}s`));
        return true;
      } else {
        console.log(chalk.red('  ❌ Basic audit failed'));
        if (!hasRequiredFields) console.log(chalk.red('     Missing required report fields'));
        if (!performanceOk) console.log(chalk.red('     Performance too slow'));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('  ❌ Basic audit threw error:'), error);
      this.testResults.push({
        test: 'basic_audit',
        passed: false,
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Test credential detection accuracy
   */
  private async testCredentialDetection(config: TestConfig): Promise<boolean> {
    console.log(chalk.cyan('Test 2: Credential Detection'));

    try {
      // Create test file with known credentials
      const testDir = path.join(process.cwd(), '.test-temp');
      await fs.mkdir(testDir, { recursive: true });

      const testContent = `
# Test file with credentials
export const config = {
  openai_key: "sk-test1234567890abcdef1234567890abcdef123456",
  github_token: "ghp_1234567890abcdef1234567890abcdef12",
  gitlab_token: "glpat-abcdefgh12345678",
  jwt_secret: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2MjM5MjMzMjUsImV4cCI6MTY1NTQ1OTMyNSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.4lqPCjDdGjx1hJwUl2W7JMlSZ5C4vvqYjY_vF5cFyOc"
};

// Database connection
const db_url = "postgres://user:secretpass123@localhost:5432/mydb";
`;

      const testFile = path.join(testDir, 'test-credentials.js');
      await fs.writeFile(testFile, testContent);

      // Run audit on test file
      const report = await this.auditor.performAudit({
        target_directories: [testDir],
        dry_run: true
      });

      // Clean up
      await fs.unlink(testFile);
      await fs.rmdir(testDir);

      // Should find at least 4 credentials
      const expectedFindings = 4;
      const actualFindings = report.credentials.length;
      const detectionWorking = actualFindings >= expectedFindings;

      // Check risk assessment
      const hasRiskLevels = report.credentials.some(c => c.risk_level === 'critical' || c.risk_level === 'high');

      this.testResults.push({
        test: 'credential_detection',
        passed: detectionWorking && hasRiskLevels,
        expected_findings: expectedFindings,
        actual_findings: actualFindings,
        risk_levels: report.risk_assessment
      });

      if (detectionWorking && hasRiskLevels) {
        console.log(chalk.green('  ✅ Credential detection working correctly'));
        console.log(chalk.gray(`     Found ${actualFindings} credentials (expected ≥${expectedFindings})`));
        return true;
      } else {
        console.log(chalk.red('  ❌ Credential detection failed'));
        console.log(chalk.red(`     Found ${actualFindings} credentials (expected ≥${expectedFindings})`));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('  ❌ Credential detection test error:'), error);
      return false;
    }
  }

  /**
   * Test duplicate file detection
   */
  private async testDuplicateDetection(config: TestConfig): Promise<boolean> {
    console.log(chalk.cyan('Test 3: Duplicate Detection'));

    try {
      // Create test directory with duplicate files
      const testDir = path.join(process.cwd(), '.test-duplicates');
      await fs.mkdir(testDir, { recursive: true });

      const testContent = 'This is test content for duplicate detection testing.';
      
      // Create 3 identical files
      await fs.writeFile(path.join(testDir, 'file1.txt'), testContent);
      await fs.writeFile(path.join(testDir, 'file2.txt'), testContent);
      await fs.writeFile(path.join(testDir, 'file3.txt'), testContent);

      // Create 1 different file
      await fs.writeFile(path.join(testDir, 'file4.txt'), 'Different content');

      // Run audit
      const report = await this.auditor.performAudit({
        target_directories: [testDir],
        dry_run: true
      });

      // Clean up
      await fs.unlink(path.join(testDir, 'file1.txt'));
      await fs.unlink(path.join(testDir, 'file2.txt'));
      await fs.unlink(path.join(testDir, 'file3.txt'));
      await fs.unlink(path.join(testDir, 'file4.txt'));
      await fs.rmdir(testDir);

      // Should find 1 duplicate group with 3 files
      const duplicateGroups = report.duplicates.length;
      const duplicatesDetected = duplicateGroups === 1 && report.duplicates[0]?.files.length === 3;

      this.testResults.push({
        test: 'duplicate_detection',
        passed: duplicatesDetected,
        duplicate_groups: duplicateGroups,
        files_in_group: report.duplicates[0]?.files.length || 0
      });

      if (duplicatesDetected) {
        console.log(chalk.green('  ✅ Duplicate detection working correctly'));
        console.log(chalk.gray(`     Found 1 group with 3 identical files`));
        return true;
      } else {
        console.log(chalk.red('  ❌ Duplicate detection failed'));
        console.log(chalk.red(`     Found ${duplicateGroups} groups`));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('  ❌ Duplicate detection test error:'), error);
      return false;
    }
  }

  /**
   * Test dry run safety - ensure no files are modified
   */
  private async testDryRunSafety(config: TestConfig): Promise<boolean> {
    console.log(chalk.cyan('Test 4: Dry Run Safety'));

    try {
      // Create test file
      const testDir = path.join(process.cwd(), '.test-safety');
      await fs.mkdir(testDir, { recursive: true });
      const testFile = path.join(testDir, 'safety-test.txt');
      const originalContent = 'Original test content for safety verification';
      
      await fs.writeFile(testFile, originalContent);
      const originalStats = await fs.stat(testFile);

      // Run audit with dry_run: true
      await this.auditor.performAudit({
        target_directories: [testDir],
        dry_run: true
      });

      // Generate cleanup plan (dry run)
      await this.auditor.generateCleanupPlan({
        target_directories: [testDir],
        dry_run: true
      });

      // Verify file unchanged
      const newContent = await fs.readFile(testFile, 'utf-8');
      const newStats = await fs.stat(testFile);
      
      const fileUnchanged = (
        newContent === originalContent &&
        newStats.mtime.getTime() === originalStats.mtime.getTime()
      );

      // Clean up
      await fs.unlink(testFile);
      await fs.rmdir(testDir);

      this.testResults.push({
        test: 'dry_run_safety',
        passed: fileUnchanged,
        file_modified: !fileUnchanged
      });

      if (fileUnchanged) {
        console.log(chalk.green('  ✅ Dry run safety verified - no files modified'));
        return true;
      } else {
        console.log(chalk.red('  ❌ Dry run safety failed - files were modified'));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('  ❌ Dry run safety test error:'), error);
      return false;
    }
  }

  /**
   * Test error handling for invalid inputs
   */
  private async testErrorHandling(config: TestConfig): Promise<boolean> {
    console.log(chalk.cyan('Test 5: Error Handling'));

    let errorHandlingWorking = true;

    // Test 1: Non-existent directory
    try {
      await this.auditor.performAudit({
        target_directories: ['/nonexistent/directory/path'],
        dry_run: true
      });
      console.log(chalk.red('  ❌ Should have thrown error for non-existent directory'));
      errorHandlingWorking = false;
    } catch (error) {
      console.log(chalk.green('  ✅ Correctly handled non-existent directory'));
    }

    // Test 2: Invalid scan depth
    try {
      const report = await this.auditor.performAudit({
        target_directories: config.test_directories,
        scan_depth: -1,
        dry_run: true
      });
      // Should handle gracefully, not throw
      console.log(chalk.green('  ✅ Handled invalid scan depth gracefully'));
    } catch (error) {
      console.log(chalk.yellow('  ⚠️ Invalid scan depth caused error (should handle gracefully)'));
    }

    this.testResults.push({
      test: 'error_handling',
      passed: errorHandlingWorking
    });

    return errorHandlingWorking;
  }

  /**
   * Test performance limits and resource usage
   */
  private async testPerformanceLimits(config: TestConfig): Promise<boolean> {
    console.log(chalk.cyan('Test 6: Performance Limits'));

    try {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      // Run audit with size limits
      const report = await this.auditor.performAudit({
        target_directories: config.test_directories,
        file_size_limit: config.safety_checks.max_file_size,
        scan_depth: config.safety_checks.max_scan_depth,
        dry_run: true
      });

      const executionTime = Date.now() - startTime;
      const endMemory = process.memoryUsage().heapUsed;
      const memoryUsed = endMemory - startMemory;

      // Performance criteria
      const reasonableTime = executionTime < 60000; // < 1 minute
      const reasonableMemory = memoryUsed < 500 * 1024 * 1024; // < 500MB

      this.testResults.push({
        test: 'performance_limits',
        passed: reasonableTime && reasonableMemory,
        execution_time: executionTime,
        memory_used: memoryUsed,
        files_processed: report.summary.total_files
      });

      if (reasonableTime && reasonableMemory) {
        console.log(chalk.green('  ✅ Performance within acceptable limits'));
        console.log(chalk.gray(`     Time: ${Math.round(executionTime / 1000)}s`));
        console.log(chalk.gray(`     Memory: ${Math.round(memoryUsed / 1024 / 1024)}MB`));
        return true;
      } else {
        console.log(chalk.red('  ❌ Performance exceeded limits'));
        if (!reasonableTime) console.log(chalk.red(`     Execution time: ${executionTime}ms (>60s)`));
        if (!reasonableMemory) console.log(chalk.red(`     Memory usage: ${Math.round(memoryUsed / 1024 / 1024)}MB (>500MB)`));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('  ❌ Performance test error:'), error);
      return false;
    }
  }

  /**
   * Generate comprehensive test report
   */
  private async generateTestReport(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(
      process.cwd(), 
      'OSSA/.agents/reports',
      `test-report-${timestamp}.json`
    );

    const report = {
      test_suite: 'delete-later-auditor',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: {
        total_tests: this.testResults.length,
        passed: this.testResults.filter(r => r.passed).length,
        failed: this.testResults.filter(r => !r.passed).length,
        success_rate: Math.round(
          (this.testResults.filter(r => r.passed).length / this.testResults.length) * 100
        )
      }
    };

    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(chalk.blue(`\n📊 Test report saved: ${reportPath}`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not save test report: ${error}`));
    }
  }
}

/**
 * Run tests if called directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const testConfig: TestConfig = {
    test_directories: [
      path.join(process.cwd(), '__DELETE_LATER'),
      path.join(process.cwd(), '__DELETE_LATER_LATER')
    ].filter(dir => {
      try {
        require('fs').accessSync(dir);
        return true;
      } catch {
        return false;
      }
    }),
    safety_checks: {
      dry_run_only: true,
      max_file_size: 10 * 1024 * 1024, // 10MB
      max_scan_depth: 5
    }
  };

  if (testConfig.test_directories.length === 0) {
    console.log(chalk.yellow('⚠️ No __DELETE_LATER directories found for testing'));
    console.log('Creating temporary test directory...');
    testConfig.test_directories = [path.join(process.cwd(), '.test-audit')];
  }

  const runner = new AuditorTestRunner();
  runner.runTests(testConfig)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('Test runner failed:'), error);
      process.exit(1);
    });
}