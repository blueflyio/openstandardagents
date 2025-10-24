/**
 * Jest Test Setup
 * Configure global test environment
 */

// Set test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: jest.fn(),
  warn: jest.fn(),
  // Suppress info, log, debug
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
