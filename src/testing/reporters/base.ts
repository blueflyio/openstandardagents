/**
 * Base Test Reporter Interface
 */

import type { OssaAgent } from '../../types/index.js';
import type { TestResult, TestSummary } from '../runner.js';

export interface TestReporter {
  /**
   * Called when test run starts
   */
  onTestRunStart(manifest: OssaAgent): void;

  /**
   * Called for each test result
   */
  onTestResult(result: TestResult): void;

  /**
   * Called when test run completes
   */
  onTestRunComplete(summary: TestSummary): void;

  /**
   * Get the final output
   */
  getOutput(): string;
}
