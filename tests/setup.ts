/**
 * Jest Test Setup
 * Configure global test environment
 */

// Prevent pino-pretty worker thread from keeping the process alive.
// In test environments NODE_ENV is 'test', which the logger treats as
// non-production and enables the pino-pretty transport (a worker thread).
// Setting NODE_ENV to 'production' disables pretty-printing and avoids
// the open handle that would require --forceExit.
process.env.NODE_ENV = 'production';

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

// Mock inquirer to avoid ES module issues in tests
jest.mock('inquirer', () => ({
  default: {
    prompt: jest.fn().mockResolvedValue({}),
  },
  prompt: jest.fn().mockResolvedValue({}),
}));

// Needed for TypeScript to recognize this as a module
export {};
