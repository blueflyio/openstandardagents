import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/utils/test-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    retry: 2,
    
    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'cli/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'services/**/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage'
    ],

    // Test organization
    reporters: ['verbose', 'json'],
    outputFile: './test-results.json',
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules',
        'dist',
        'build',
        'tests',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/test-setup.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@api': path.resolve(__dirname, './api'),
      '@cli': path.resolve(__dirname, './cli'),
      '@services': path.resolve(__dirname, './services'),
      '@tests': path.resolve(__dirname, './tests')
    }
  },

  // Environment variables for testing
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.OSSA_VERSION': JSON.stringify('0.1.8')
  }
});