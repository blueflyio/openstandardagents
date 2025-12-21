/**
 * OSSA Test Runner Service
 * Executes agent tests defined in AgentTest schema
 */

import type { OssaAgent } from '../../types/index.js';

export interface TestResult {
  id: string;
  type: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
}

export class TestRunnerService {
  async runTests(manifest: OssaAgent, testId?: string): Promise<TestResult[]> {
    const tests = (manifest.spec as any).tests || [];
    const testsToRun = testId ? tests.filter((t: any) => t.id === testId) : tests;

    if (testsToRun.length === 0) {
      return [];
    }

    const results: TestResult[] = [];

    for (const test of testsToRun) {
      const startTime = Date.now();
      try {
        await this.executeTest(test, manifest);
        results.push({
          id: (test as { id?: string })?.id || 'unnamed',
          type: (test as { type?: string })?.type || 'unit',
          status: 'passed',
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          id: (test as { id?: string })?.id || 'unnamed',
          type: (test as { type?: string })?.type || 'unit',
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        });
      }
    }

    return results;
  }

  private async executeTest(test: unknown, manifest: OssaAgent): Promise<void> {
    if ((test as { type?: string })?.type === 'unit') {
      await this.runUnitTest(test, manifest);
    } else if ((test as { type?: string })?.type === 'integration') {
      await this.runIntegrationTest(test, manifest);
    } else if ((test as { type?: string })?.type === 'e2e') {
      await this.runE2ETest(test, manifest);
    } else {
      throw new Error(`Unknown test type: ${(test as { type?: string })?.type}`);
    }
  }

  private async runUnitTest(test: unknown, manifest: OssaAgent): Promise<void> {
    const testTyped = test as { assertions?: unknown[] };
    if (testTyped.assertions) {
      for (const assertion of testTyped.assertions) {
        if ((assertion as { type?: string })?.type === 'equals') {
          const assertionActual = (assertion as { actual?: string })?.actual;
          const actual = this.evaluateExpression(assertionActual || '', manifest);
          const expected = (assertion as { expected?: unknown })?.expected;
          if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
          }
        }
      }
    }
  }

  private async runIntegrationTest(test: any, manifest: OssaAgent): Promise<void> {
    await this.runUnitTest(test, manifest);
  }

  private async runE2ETest(test: unknown, manifest: OssaAgent): Promise<void> {
    await this.runIntegrationTest(test, manifest);
  }

  private evaluateExpression(expr: string, manifest: OssaAgent): unknown {
    if (expr.startsWith('metadata.')) {
      const path = expr.split('.').slice(1);
      let value: unknown = manifest.metadata;
      for (const key of path) {
        value = (value as { [key: string]: unknown })?.[key];
      }
      return value;
    }
    if (expr.startsWith('spec.')) {
      const path = expr.split('.').slice(1);
      let value: unknown = manifest.spec;
      for (const key of path) {
        value = (value as { [key: string]: unknown })?.[key];
      }
      return value;
    }
    return expr;
  }
}
