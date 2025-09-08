/**
 * Test Setup for OSSA E2E Tests
 * 
 * Configures the test environment with custom matchers and utilities
 */

import { expect } from 'vitest';
import { customMatchers } from '../fixtures/agent-fixtures.js';

// Extend expect with custom matchers
expect.extend(customMatchers);

// Global test configuration
declare global {
  namespace Vi {
    interface Assertion {
      toBeWithinRange(min: number, max: number): void;
      toMeetOSSATarget(target: number): void;
      toBeOneOf(values: any[]): void;
    }
  }
}

// Add additional matcher for convenience
expect.extend({
  toBeOneOf(received: any, values: any[]) {
    const pass = values.includes(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be one of [${values.join(', ')}]`
          : `Expected ${received} to be one of [${values.join(', ')}]`
    };
  }
});

// Set up any global test configuration
process.env.NODE_ENV = 'test';
process.env.OSSA_TEST_MODE = 'true';