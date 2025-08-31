// Jest setup file for OAAS Services tests

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

// Global test utilities
global.testUtils = {
  createMockAgent: () => ({
    id: 'test-agent',
    name: 'Test Agent',
    version: '1.0.0',
    format: 'openapi' as const,
    source_path: '/test/path',
    capabilities: [
      {
        id: 'test-capability',
        name: 'Test Capability',
        description: 'A test capability',
        frameworks: ['openapi'],
        originalFormat: 'openapi' as const
      }
    ],
    metadata: {},
    confidence: 1.0,
    last_discovered: new Date()
  }),
  
  createMockConfig: () => ({
    projectRoot: '/test/project',
    runtimeTranslation: true,
    cacheEnabled: true,
    validationStrict: false
  })
};
