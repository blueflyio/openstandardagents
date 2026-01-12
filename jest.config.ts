import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
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
      branches: 30,
      functions: 50,
      lines: 45,
      statements: 45,
    },
    './src/services': {
      branches: 10,
<<<<<<< HEAD
      functions: 43,
=======
      functions: 43,  // TODO: Increase to 80% - see issue for test coverage improvement
>>>>>>> origin/release/v0.3.x
      lines: 25,
      statements: 25,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  verbose: true,
  testTimeout: 10000,
  forceExit: true,
};

export default config;
