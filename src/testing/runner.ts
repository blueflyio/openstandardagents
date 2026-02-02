/**
 * OSSA Test Runner
 * Main test runner with support for unit, integration, and capability tests
 */

import type { OssaAgent } from '../types/index.js';
import { ValidationService } from '../services/validation.service.js';
import type { TestReporter } from './reporters/base.js';

export interface TestOptions {
  manifestPath?: string;
  capability?: string;
  mock?: boolean;
  coverage?: boolean;
  watch?: boolean;
  verbose?: boolean;
  testId?: string;
}

export interface TestResult {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'capability' | 'policy';
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  duration: number;
  coverage?: TestCoverage;
  error?: Error;
}

export interface TestCoverage {
  capabilities?: {
    total: number;
    tested: number;
    percentage: number;
  };
  policies?: {
    total: number;
    tested: number;
    percentage: number;
  };
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: TestCoverage;
}

export class TestRunner {
  private validationService: ValidationService;
  private reporter: TestReporter;

  constructor(validationService: ValidationService, reporter: TestReporter) {
    this.validationService = validationService;
    this.reporter = reporter;
  }

  /**
   * Run all tests for an agent manifest
   */
  async runTests(
    manifest: OssaAgent,
    options: TestOptions = {}
  ): Promise<TestSummary> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Start test run
    this.reporter.onTestRunStart(manifest);

    try {
      // 1. Validate manifest
      const validationResult = await this.validateManifest(manifest);
      results.push(validationResult);

      // 2. Run capability tests if specified
      if (options.capability) {
        const capabilityResults = await this.runCapabilityTests(
          manifest,
          options.capability,
          options
        );
        results.push(...capabilityResults);
      } else {
        // Run all defined tests
        const testResults = await this.runDefinedTests(manifest, options);
        results.push(...testResults);
      }

      // 3. Run policy compliance tests
      if (manifest.spec?.policies) {
        const policyResults = await this.runPolicyTests(manifest, options);
        results.push(...policyResults);
      }

      // 4. Calculate coverage if requested
      let coverage: TestCoverage | undefined;
      if (options.coverage) {
        coverage = this.calculateCoverage(manifest, results);
      }

      // Generate summary
      const summary: TestSummary = {
        total: results.length,
        passed: results.filter((r) => r.status === 'passed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
        duration: Date.now() - startTime,
        coverage,
      };

      // Report results
      results.forEach((result) => {
        this.reporter.onTestResult(result);
      });

      this.reporter.onTestRunComplete(summary);

      return summary;
    } catch (error) {
      const errorResult: TestResult = {
        id: 'test-run',
        name: 'Test Run',
        type: 'unit',
        status: 'failed',
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error : undefined,
      };
      results.push(errorResult);

      this.reporter.onTestResult(errorResult);
      this.reporter.onTestRunComplete({
        total: results.length,
        passed: 0,
        failed: results.length,
        skipped: 0,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Validate manifest structure
   */
  private async validateManifest(manifest: OssaAgent): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const result = await this.validationService.validate(manifest);

      if (result.valid) {
        return {
          id: 'manifest-validation',
          name: 'Manifest Validation',
          type: 'unit',
          status: 'passed',
          duration: Date.now() - startTime,
          message: 'Manifest is valid',
        };
      } else {
        return {
          id: 'manifest-validation',
          name: 'Manifest Validation',
          type: 'unit',
          status: 'failed',
          duration: Date.now() - startTime,
          message: `Validation failed: ${result.errors.join(', ')}`,
        };
      }
    } catch (error) {
      return {
        id: 'manifest-validation',
        name: 'Manifest Validation',
        type: 'unit',
        status: 'failed',
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error : undefined,
      };
    }
  }

  /**
   * Run tests defined in the manifest
   */
  private async runDefinedTests(
    manifest: OssaAgent,
    options: TestOptions
  ): Promise<TestResult[]> {
    const tests = manifest.spec?.tests || [];
    const results: TestResult[] = [];

    // Filter tests if testId specified
    const testsToRun = options.testId
      ? tests.filter((t) => t.id === options.testId)
      : tests;

    for (const test of testsToRun) {
      const result = await this.runSingleTest(test, manifest, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Run a single test
   */
  private async runSingleTest(
    test: NonNullable<NonNullable<OssaAgent['spec']>['tests']>[number],
    manifest: OssaAgent,
    options: TestOptions
  ): Promise<TestResult> {
    const startTime = Date.now();
    const testId = test.id || 'unnamed';
    const testName = test.name || testId;
    const testType = test.type || 'unit';

    try {
      // Execute test based on type
      if (testType === 'unit') {
        await this.executeUnitTest(test, manifest, options);
      } else if (testType === 'integration') {
        await this.executeIntegrationTest(test, manifest, options);
      } else {
        throw new Error(`Unknown test type: ${testType}`);
      }

      return {
        id: testId,
        name: testName,
        type: testType,
        status: 'passed',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: testId,
        name: testName,
        type: testType,
        status: 'failed',
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error : undefined,
      };
    }
  }

  /**
   * Execute unit test with assertions
   */
  private async executeUnitTest(
    test: NonNullable<NonNullable<OssaAgent['spec']>['tests']>[number],
    manifest: OssaAgent,
    _options: TestOptions
  ): Promise<void> {
    if (!test.assertions || test.assertions.length === 0) {
      return;
    }

    for (const assertion of test.assertions) {
      const result = this.evaluateAssertion(assertion, manifest);
      if (!result.passed) {
        throw new Error(result.message);
      }
    }
  }

  /**
   * Execute integration test
   */
  private async executeIntegrationTest(
    test: NonNullable<NonNullable<OssaAgent['spec']>['tests']>[number],
    manifest: OssaAgent,
    options: TestOptions
  ): Promise<void> {
    // For now, treat as unit test
    // In future, this could involve actual runtime execution
    if (options.mock) {
      // Use mock LLM
      await this.executeUnitTest(test, manifest, options);
    } else {
      // Would execute against real runtime
      await this.executeUnitTest(test, manifest, options);
    }
  }

  /**
   * Run capability-specific tests
   */
  private async runCapabilityTests(
    manifest: OssaAgent,
    capabilityName: string,
    _options: TestOptions
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const capabilities = manifest.spec?.capabilities || [];
    const capability = capabilities.find((c) =>
      typeof c === 'string' ? c === capabilityName : c.id === capabilityName
    );

    if (!capability) {
      results.push({
        id: `capability-${capabilityName}`,
        name: `Capability: ${capabilityName}`,
        type: 'capability',
        status: 'failed',
        duration: 0,
        message: `Capability "${capabilityName}" not found`,
      });
      return results;
    }

    const startTime = Date.now();

    try {
      // Test capability definition
      const description =
        typeof capability === 'string' ? undefined : capability.description;
      if (!description) {
        throw new Error('Capability missing description');
      }

      results.push({
        id: `capability-${capabilityName}`,
        name: `Capability: ${capabilityName}`,
        type: 'capability',
        status: 'passed',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      results.push({
        id: `capability-${capabilityName}`,
        name: `Capability: ${capabilityName}`,
        type: 'capability',
        status: 'failed',
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error : undefined,
      });
    }

    return results;
  }

  /**
   * Run policy compliance tests
   */
  private async runPolicyTests(
    manifest: OssaAgent,
    _options: TestOptions
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const policies = manifest.spec?.policies || [];

    for (const policy of policies) {
      const startTime = Date.now();
      const policyId = policy.name || 'unnamed-policy';

      try {
        // Test policy structure
        if (!policy.type) {
          throw new Error('Policy missing type');
        }

        if (!policy.rules || policy.rules.length === 0) {
          throw new Error('Policy has no rules');
        }

        // Validate each rule
        for (const rule of policy.rules as Record<string, unknown>[]) {
          if (!rule.condition || !rule.action) {
            throw new Error('Invalid policy rule structure');
          }
        }

        results.push({
          id: `policy-${policyId}`,
          name: `Policy: ${policyId}`,
          type: 'policy',
          status: 'passed',
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          id: `policy-${policyId}`,
          name: `Policy: ${policyId}`,
          type: 'policy',
          status: 'failed',
          duration: Date.now() - startTime,
          message: error instanceof Error ? error.message : String(error),
          error: error instanceof Error ? error : undefined,
        });
      }
    }

    return results;
  }

  /**
   * Evaluate assertion
   */
  private evaluateAssertion(
    assertion: NonNullable<
      NonNullable<NonNullable<OssaAgent['spec']>['tests']>[number]['assertions']
    >[number],
    manifest: OssaAgent
  ): { passed: boolean; message: string } {
    const type = assertion.type;
    const actual = this.evaluateExpression(assertion.actual, manifest);
    const expected = assertion.expected;

    switch (type) {
      case 'equals':
        if (actual === expected) {
          return { passed: true, message: 'Values are equal' };
        }
        return {
          passed: false,
          message: `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        };

      case 'contains':
        if (
          typeof actual === 'string' &&
          typeof expected === 'string' &&
          actual.includes(expected)
        ) {
          return { passed: true, message: 'String contains expected value' };
        }
        if (Array.isArray(actual) && (actual as unknown[]).includes(expected)) {
          return { passed: true, message: 'Array contains expected value' };
        }
        return {
          passed: false,
          message: `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`,
        };

      case 'exists':
        if (actual !== undefined && actual !== null) {
          return { passed: true, message: 'Value exists' };
        }
        return { passed: false, message: 'Value does not exist' };

      case 'type':
        if (typeof actual === expected) {
          return { passed: true, message: 'Type matches' };
        }
        return {
          passed: false,
          message: `Expected type ${expected}, got ${typeof actual}`,
        };

      default:
        return {
          passed: false,
          message: `Unknown assertion type: ${type}`,
        };
    }
  }

  /**
   * Evaluate expression against manifest
   */
  private evaluateExpression(expr: string, manifest: OssaAgent): unknown {
    if (typeof expr !== 'string') {
      return expr;
    }

    const parts = expr.split('.');
    let value: unknown = manifest;

    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
    }

    return value;
  }

  /**
   * Calculate test coverage
   */
  private calculateCoverage(
    manifest: OssaAgent,
    results: TestResult[]
  ): TestCoverage {
    const coverage: TestCoverage = {};

    // Calculate capability coverage
    const capabilities = manifest.spec?.capabilities || [];
    const capabilityTests = results.filter((r) => r.type === 'capability');

    if (capabilities.length > 0) {
      coverage.capabilities = {
        total: capabilities.length,
        tested: capabilityTests.filter((r) => r.status === 'passed').length,
        percentage:
          (capabilityTests.filter((r) => r.status === 'passed').length /
            capabilities.length) *
          100,
      };
    }

    // Calculate policy coverage
    const policies = manifest.spec?.policies || [];
    const policyTests = results.filter((r) => r.type === 'policy');

    if (policies.length > 0) {
      coverage.policies = {
        total: policies.length,
        tested: policyTests.filter((r) => r.status === 'passed').length,
        percentage:
          (policyTests.filter((r) => r.status === 'passed').length /
            policies.length) *
          100,
      };
    }

    return coverage;
  }
}
