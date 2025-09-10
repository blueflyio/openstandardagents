/**
 * Vitest Configuration for OSSA End-to-End Tests
 * 
 * Specialized configuration for running comprehensive E2E tests including
 * agent lifecycle, multi-agent coordination, and OSSA v0.1.8 compliance validation.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test files configuration
    include: [
      'tests/e2e/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/__DELETE_LATER/**'
    ],
    
    // Test environment setup
    environment: 'node',
    
    // Timeouts for E2E tests (longer than unit tests)
    testTimeout: 60000,    // 60 seconds for complex lifecycle tests
    hookTimeout: 30000,    // 30 seconds for setup/teardown
    
    // Concurrency settings
    threads: false,        // Disable threads for E2E tests to avoid resource conflicts
    maxConcurrency: 1,     // Run E2E tests sequentially
    
    // Reporter configuration
    reporters: [
      'verbose',
      ['json', { outputFile: 'test-results-e2e.json' }],
      ['junit', { outputFile: 'test-results-e2e.xml' }]
    ],
    
    // Coverage configuration
    coverage: {
      enabled: true,
      provider: 'v8',
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'tests/**/*',
        '**/__DELETE_LATER/**'
      ],
      reporter: [
        'text',
        'html',
        'json-summary'
      ],
      outputDirectory: 'coverage-e2e',
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test output configuration
    outputFile: {
      json: 'test-results-e2e.json',
      junit: 'test-results-e2e.xml'
    },
    
    // Retry configuration for flaky E2E tests
    retry: 2,
    
    // Silent mode configuration
    silent: false,
    
    // Pool options for resource management
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true  // Use single fork to prevent resource conflicts
      }
    }
  },
  
  // TypeScript configuration
  esbuild: {
    target: 'node18'
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': './src',
      '@tests': './tests'
    }
  }
});