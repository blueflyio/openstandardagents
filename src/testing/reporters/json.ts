/**
 * JSON Test Reporter
 * Machine-readable JSON output for CI/CD integration
 */

import type { OssaAgent } from '../../types/index.js';
import type { TestResult, TestSummary } from '../runner.js';
import type { TestReporter } from './base.js';

export interface JsonTestReport {
  agent: {
    name: string;
    version: string;
    apiVersion: string;
  };
  summary: TestSummary;
  results: TestResult[];
  timestamp: string;
}

export class JsonReporter implements TestReporter {
  private results: TestResult[] = [];
  private manifest?: OssaAgent;
  private summary?: TestSummary;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  onTestRunStart(manifest: OssaAgent): void {
    this.manifest = manifest;
    this.startTime = new Date();
  }

  onTestResult(result: TestResult): void {
    this.results.push(result);
  }

  onTestRunComplete(summary: TestSummary): void {
    this.summary = summary;
  }

  getOutput(): string {
    if (!this.manifest || !this.summary) {
      return JSON.stringify(
        { error: 'Test run not completed' },
        null,
        2
      );
    }

    const report: JsonTestReport = {
      agent: {
        name: this.manifest.metadata?.name || 'unknown',
        version: this.manifest.metadata?.version || 'unknown',
        apiVersion: this.manifest.apiVersion || 'unknown',
      },
      summary: this.summary,
      results: this.results,
      timestamp: this.startTime.toISOString(),
    };

    return JSON.stringify(report, null, 2);
  }
}
