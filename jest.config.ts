import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    // v0.3.5 tests are now enabled - removed ignore patterns
    'tests/a2a/mcp-integration.test.ts', // TODO: Fix Jest ESM parsing issue with MCP imports
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/generated/**',
    '!src/di-container.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'cobertura'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/utils': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/errors': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    // Strip .js extension from all imports (ESM compatibility)
    '^(.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
        astTransformers: {
          before: ['<rootDir>/tests/import-meta-transformer.ts'],
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(inquirer|@inquirer|chalk|ansi-styles|strip-ansi|ansi-regex|wrap-ansi|string-width|emoji-regex|is-fullwidth-code-point|@octokit|@modelcontextprotocol)/)',
  ],
  verbose: true,
  testTimeout: 10000,
};

export default config;
