/**
 * Jest Setup File
 * Configure test environment
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.OSSA_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);

// Add custom matchers if needed
expect.extend({
  toBeValidAgent(received) {
    const pass =
      received &&
      received.metadata &&
      received.metadata.name &&
      received.spec &&
      received.spec.type;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid agent`
          : `expected ${received} to be a valid agent with metadata and spec`,
    };
  },
});
