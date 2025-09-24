/**
 * Jest configuration for OSSA v0.1.9 Redis Event Bus testing
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/services/EventBus'],
  testMatch: [
    '**/tests/services/EventBus/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/EventBus/**/*.ts',
    '!src/services/EventBus/**/*.d.ts',
    '!src/services/EventBus/**/*.test.ts'
  ],
  coverageDirectory: 'coverage/eventbus',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/services/EventBus/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};