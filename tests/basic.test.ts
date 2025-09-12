/**
 * Basic OSSA v0.1.9 Tests
 * Verify core functionality for release
 */

describe('OSSA v0.1.9 Basic Functionality', () => {
  test('package.json version should be 0.1.9', () => {
    const packageJson = require('../package.json');
    expect(packageJson.version).toBe('0.1.9');
  });

  test('TypeScript compilation should work', () => {
    // Test basic TypeScript compilation by importing a module
    expect(() => {
      require('../dist/index.js');
    }).not.toThrow();
  });

  test('CLI should be exportable', () => {
    expect(() => {
      require('../dist/cli/index.js');
    }).not.toThrow();
  });

  test('Types should be available', () => {
    const types = require('../dist/types/index.js');
    expect(types).toBeDefined();
  });
});