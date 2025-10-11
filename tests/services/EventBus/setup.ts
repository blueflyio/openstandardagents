/**
 * Test setup for OSSA v0.1.9 Redis Event Bus tests
 */

// Mock global fetch for health checks and external API calls
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map()
  })
);

// Mock crypto.randomUUID for Node.js versions that don't have it
if (!global.crypto) {
  global.crypto = {} as any;
}

if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9));
}

// Setup console mocking for cleaner test output
const originalConsole = global.console;

beforeEach(() => {
  // Mock console methods to reduce noise during testing
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };
});

afterEach(() => {
  // Restore original console
  global.console = originalConsole;
});

// Setup timeout for async operations
jest.setTimeout(30000);

// Mock process.env for testing
process.env.NODE_ENV = 'test';
process.env.SERVICE_NAME = 'test-ossa-event-bus';

export {};