/**
 * OSSA Test Runner Service
 * Executes agent tests defined in AgentTest schema
 * Supports mock LLM testing for development without API keys
 */

import type { OssaAgent } from '../../types/index.js';
import { MockLLMService, type MockLLMConfig } from './mock-llm.service.js';
import { getScenario, type TestScenario } from './scenarios.js';

export interface TestResult {
  id: string;
  type: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
  response?: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
}

export interface TestRunnerOptions {
  testId?: string;
  useMock?: boolean;
  mockConfig?: MockLLMConfig;
  scenario?: string;
}

export class TestRunnerService {
  private mockLLM?: MockLLMService;

  async runTests(
    manifest: OssaAgent,
    options: TestRunnerOptions = {}
  ): Promise<TestResult[]> {
    // Initialize mock LLM if requested
    if (options.useMock) {
      this.mockLLM = new MockLLMService(options.mockConfig);
    }

    // Get tests from scenario or manifest
    let tests: unknown[];
    if (options.scenario) {
      const scenario = getScenario(options.scenario);
      if (!scenario) {
        throw new Error(`Scenario not found: ${options.scenario}`);
      }
      tests = scenario.tests;
    } else {
      tests = (manifest.spec as { tests?: unknown[] }).tests || [];
    }

    const testsToRun = options.testId
      ? tests.filter(
          (t: unknown) => (t as { id?: string })?.id === options.testId
        )
      : tests;

    if (testsToRun.length === 0) {
      return [];
    }

    const results: TestResult[] = [];

    for (const test of testsToRun) {
      const startTime = Date.now();
      try {
        const result = await this.executeTest(test, manifest, options.useMock);
        results.push({
          id: (test as { id?: string })?.id || 'unnamed',
          type: (test as { type?: string })?.type || 'unit',
          status: 'passed',
          duration: Date.now() - startTime,
          ...result,
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

  private async executeTest(
    test: unknown,
    manifest: OssaAgent,
    useMock?: boolean
  ): Promise<{
    response?: string;
    toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  }> {
    // If using mock LLM and test has a prompt, execute it
    if (useMock && this.mockLLM && (test as { prompt?: string })?.prompt) {
      return await this.runMockTest(test, manifest);
    }

    // Otherwise run traditional unit/integration/e2e test
    if ((test as { type?: string })?.type === 'unit') {
      await this.runUnitTest(test, manifest);
    } else if ((test as { type?: string })?.type === 'integration') {
      await this.runIntegrationTest(test, manifest);
    } else if ((test as { type?: string })?.type === 'e2e') {
      await this.runE2ETest(test, manifest);
    } else {
      throw new Error(
        `Unknown test type: ${(test as { type?: string })?.type}`
      );
    }

    return {};
  }

  /**
   * Run test with mock LLM
   */
  private async runMockTest(
    test: unknown,
    manifest: OssaAgent
  ): Promise<{
    response: string;
    toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  }> {
    if (!this.mockLLM) {
      throw new Error('Mock LLM not initialized');
    }

    const testTyped = test as {
      prompt?: string;
      expectedPatterns?: string[];
      expectedToolCalls?: string[];
      shouldFail?: boolean;
    };

    const prompt = testTyped.prompt || '';
    const spec = manifest.spec as {
      role?: string;
      tools?: Array<{ name: string; description?: string }>;
    };
    const systemPrompt = spec?.role || '';
    const tools = spec?.tools || [];

    // Generate mock response
    const response = await this.mockLLM.generate({
      prompt,
      systemPrompt,
      tools,
    });

    // Validate expected patterns
    if (testTyped.expectedPatterns) {
      for (const pattern of testTyped.expectedPatterns) {
        if (!response.content.toLowerCase().includes(pattern.toLowerCase())) {
          throw new Error(
            `Response does not contain expected pattern: "${pattern}"`
          );
        }
      }
    }

    // Validate expected tool calls
    if (testTyped.expectedToolCalls && response.toolCalls) {
      const calledTools = response.toolCalls.map((tc) => tc.name);
      for (const expectedTool of testTyped.expectedToolCalls) {
        if (!calledTools.includes(expectedTool)) {
          throw new Error(`Expected tool call not found: "${expectedTool}"`);
        }
      }
    }

    return {
      response: response.content,
      toolCalls: response.toolCalls,
    };
  }

  private async runUnitTest(test: unknown, manifest: OssaAgent): Promise<void> {
    const testTyped = test as { assertions?: unknown[] };
    if (testTyped.assertions) {
      for (const assertion of testTyped.assertions) {
        if ((assertion as { type?: string })?.type === 'equals') {
          const assertionActual = (assertion as { actual?: string })?.actual;
          const actual = this.evaluateExpression(
            assertionActual || '',
            manifest
          );
          const expected = (assertion as { expected?: unknown })?.expected;
          if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
          }
        }
      }
    }
  }

  private async runIntegrationTest(
    test: unknown,
    manifest: OssaAgent
  ): Promise<void> {
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
        value =
          value && typeof value === 'object'
            ? (value as { [key: string]: unknown })[key]
            : undefined;
      }
      return value;
    }
    if (expr.startsWith('spec.')) {
      const path = expr.split('.').slice(1);
      let value: unknown = manifest.spec;
      for (const key of path) {
        value =
          value && typeof value === 'object'
            ? (value as { [key: string]: unknown })[key]
            : undefined;
      }
      return value;
    }
    return expr;
  }
}
